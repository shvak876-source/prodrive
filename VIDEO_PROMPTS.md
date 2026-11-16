# Hero video prompts (Pro Drive)

The hero plays a real-looking clip frame by frame as the visitor scrolls:
the car on a race track → the door opens → the camera moves in through the door → the catalog appears.

Make two clips with an AI video tool (Higgsfield, Kling, Veo, Runway…), the second starting from the last frame of the first.

## Clip 1 – the car on the track, the door opens (16:9, 1920×1080, 6–8 s)

> Photorealistic cinematic shot of a sleek modern sports coupé in deep metallic red, parked on the asphalt of a professional race track on a bright, slightly hazy afternoon. Red-and-white kerbs at the edge of the track, pit-lane buildings and grandstands softly out of focus far behind, warm low sunlight with clean reflections along the body. The car fills the left half of the frame in a three-quarter front view; the right half of the frame is calm open sky and track (space for text). The camera holds steady, then slowly pushes in toward the driver's door as the door swings open smoothly. No people, no logos, no badges, no license plate text, no on-screen text. Natural colours, 35mm lens, shallow depth of field, ultra-realistic, smooth constant camera motion, no cuts.

## Clip 2 – the camera enters through the open door (16:9, 6–8 s)

Use the **last frame of clip 1 as the first frame** (image-to-video / start frame).

> Continuous shot: the camera glides forward through the open driver's door into the car's cabin, past the seat bolster, and settles on a calm, centred view of the steering wheel and dashboard with the race track visible through the windshield. Premium leather and carbon interior with red stitching, soft daylight filling the cabin. Smooth, steady, constant-speed dolly, no shake, no cuts, no people, no logos, no on-screen text, photorealistic.

## Optional – phone versions (9:16, 1080×1920)

The same two prompts, with: "vertical 9:16 frame, the car centred in the upper half of the frame, open sky and track in the lower half".

## Tips

- Export the highest quality MP4 the tool offers; no sound needed.
- If the tool has a "start frame / end frame" option, use it so the two clips join without a jump.
- Then: `scripts/video-to-frames.sh desktop.mp4 [mobile.mp4]` (join two clips first – see the script header).
