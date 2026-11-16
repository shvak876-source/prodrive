import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

/**
 * A video turned into still frames (public/frames/<name>/0001.webp …) and played by the scroll.
 * Scrubbing still images on a canvas is smooth in both directions on every device, where seeking
 * an actual <video> stutters. scripts/video-to-frames.sh makes the frames and the manifest.
 */
export interface FrameSet {
  /** folder under public/, e.g. "frames/hero" */
  dir: string;
  count: number;
  width: number;
  height: number;
  ext: string;
}

interface Manifest {
  desktop: Omit<FrameSet, "dir"> & { dir: string };
  mobile?: Omit<FrameSet, "dir"> & { dir: string };
}

const base = import.meta.env.BASE_URL;

/**
 * Loads public/frames/manifest.json. undefined while checking, null when there is no video yet
 * (the hero then falls back to the 3D scene), otherwise the set that fits this screen.
 */
export function useFrameSet(): FrameSet | null | undefined {
  const [set, setSet] = useState<FrameSet | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    fetch(`${base}frames/manifest.json`, { cache: "no-cache" })
      .then((r) => (r.ok ? (r.json() as Promise<Manifest>) : null))
      .then((m) => {
        if (!alive) return;
        if (!m) return setSet(null);
        const portrait = innerHeight > innerWidth;
        setSet(portrait && m.mobile ? m.mobile : m.desktop);
      })
      .catch(() => alive && setSet(null));
    return () => {
      alive = false;
    };
  }, []);
  return set;
}

export interface ScrollFramesHandle {
  /** 0..1 position in the clip */
  seek: (p: number) => void;
}

/**
 * Canvas that shows frame N of the set, cover-fitted. Frames load in a coarse-to-fine order
 * (every 16th, then every 8th, …) so scrubbing works almost at once and sharpens as it loads.
 */
export const ScrollFrames = forwardRef<ScrollFramesHandle, { set: FrameSet; onFirstFrame?: () => void; className?: string }>(
  function ScrollFrames({ set, onFirstFrame, className }, ref) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const imgs = useRef<(HTMLImageElement | null)[]>([]);
    const current = useRef(0);
    const drawn = useRef(-1);

    const url = (i: number) => `${base}${set.dir}/${String(i + 1).padStart(4, "0")}.${set.ext}`;

    // nearest frame that has finished loading
    const nearest = (i: number) => {
      for (let d = 0; d < set.count; d++) {
        const a = imgs.current[i - d];
        if (a?.complete && a.naturalWidth) return a;
        const b = imgs.current[i + d];
        if (b?.complete && b.naturalWidth) return b;
      }
      return null;
    };

    const draw = (force = false) => {
      const c = canvas.current;
      if (!c) return;
      const i = current.current;
      const img = nearest(i);
      if (!img) return;
      if (!force && drawn.current === i && img === imgs.current[i]) return;
      const g = c.getContext("2d")!;
      // cover-fit, anchored to the left third where the car sits on wide screens
      const s = Math.max(c.width / img.naturalWidth, c.height / img.naturalHeight);
      const w = img.naturalWidth * s;
      const h = img.naturalHeight * s;
      const x = (c.width - w) * 0.5;
      g.drawImage(img, x, (c.height - h) / 2, w, h);
      drawn.current = img === imgs.current[i] ? i : -1;
    };

    useImperativeHandle(ref, () => ({
      seek(p) {
        current.current = Math.round(Math.min(1, Math.max(0, p)) * (set.count - 1));
        draw();
      },
    }));

    // size the canvas to its box (device pixels, capped)
    useEffect(() => {
      const c = canvas.current!;
      const fit = () => {
        const dpr = Math.min(devicePixelRatio || 1, 1.5);
        c.width = Math.round(c.clientWidth * dpr);
        c.height = Math.round(c.clientHeight * dpr);
        draw(true);
      };
      fit();
      const ro = new ResizeObserver(fit);
      ro.observe(c);
      return () => ro.disconnect();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // load order: first frame, then strides 16, 8, 4, 2, 1
    useEffect(() => {
      imgs.current = new Array(set.count).fill(null);
      const order: number[] = [0];
      const seen = new Set(order);
      for (const step of [16, 8, 4, 2, 1]) for (let i = 0; i < set.count; i += step) if (!seen.has(i)) (seen.add(i), order.push(i));
      let cancelled = false;
      let next = 0;
      const pump = () => {
        if (cancelled || next >= order.length) return;
        const i = order[next++];
        const img = new Image();
        img.decoding = "async";
        img.src = url(i);
        imgs.current[i] = img;
        img.onload = img.onerror = () => {
          if (i === 0) onFirstFrame?.();
          draw(true);
          pump();
        };
      };
      for (let k = 0; k < 6; k++) pump(); // six parallel downloads
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [set]);

    return <canvas ref={canvas} className={className} aria-hidden="true" />;
  },
);
