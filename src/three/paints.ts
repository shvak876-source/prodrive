/** Paint finishes for the live colour picker. Kept free of three.js so the page shell stays light. */
export const PAINTS = {
  carmine: { label: "אדום", color: "#7d0a10", metalness: 0.55, roughness: 0.26 },
  graphite: { label: "גרפיט", color: "#2a2d31", metalness: 0.75, roughness: 0.32 },
  silver: { label: "כסף", color: "#a9adb3", metalness: 0.9, roughness: 0.28 },
  pearl: { label: "לבן", color: "#e9e6df", metalness: 0.2, roughness: 0.22 },
} as const;
export type PaintId = keyof typeof PAINTS;
