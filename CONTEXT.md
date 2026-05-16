# Stitch &amp; Kit - Needlepoint Pattern Maker

## What this is
A React component (single .jsx file, ~2700 lines) that converts images or typed phrases into needlepoint patterns with DMC thread matching, editable grids, and printable export bundles. Built as a Claude artifact, now being refactored.

## Stack
- React (single component, no build tool yet)
- Uses lucide-react icons
- Tailwind utility classes
- Inline styles for the disco/glitter aesthetic
- No external dependencies beyond React + lucide-react

## What works well (don't break)
- Image upload → stitch grid conversion
- DMC color voting algorithm (~120 DMC threads built in)
- Project presets (belts, ornaments, pillows, etc)
- Stretcher bar size recommendations
- Edit mode with paint/erase
- Export bundle (4-page printable PNG set)
- Inline image display for iOS download fallback
- Disco/glitter aesthetic (Pacifico font, hot pink, holographic gradients)

## What's broken
The phrase pillow text mode produces unreadable, fractured letters.
Root cause: text rendering uses bitmap fonts BUT the downstream image pipeline (processImage → smoothGrid → cell sampling) destroys the letter shapes by averaging/smoothing/downsampling.

## Goals for this refactor
1. Split the 2700-line file into separate modules:
   - components/PhrasePillow.jsx (text mode UI + bitmap rendering)
   - components/ImageUploader.jsx (image mode UI)
   - components/PatternGrid.jsx (the chart preview)
   - components/Export.jsx (export modal + PNG generation)
   - lib/dmc.js (DMC color list + matching algorithms)
   - lib/fonts.js (bitmap fonts for phrase pillows)
   - lib/borders.js (drawBorder function + border styles)
   - lib/projects.js (project presets + stretcher bar logic)
2. For phrase pillow mode, write text DIRECTLY into the grid data array, skipping the image-processing pipeline entirely. Each letter's bitmap maps stitch-by-stitch to grid cells. No canvas rendering, no downsampling, no smoothing.
3. Make Fit zoom actually fit on mobile (currently overflows horizontally on iOS)
4. Add more bitmap fonts (10×14 chunky version that mimics Furbish-pillow weight)

## My context
- I'm a non-developer building this for my needlepoint hobby and possibly to sell as a tool
- I'm on Mac, iPhone for testing
- Goal: working tool that produces clean printable needlepoint patterns from text or images
- Aesthetic must stay: disco/glitter, hot pink, Pacifico/Fredoka fonts, sparkles, holographic

## Test cases I care about
1. Upload UGA logo (red ring, black oval, white G) → should produce 3-color pattern with crisp edges
2. Phrase pillow "I LOVE / THAT FOR / YOU" with Furbish Navy preset → should produce clean readable letters with chunky floral vine border
3. Export bundle on iPhone → files visible and saveable via long-press

## Vite setup needed
This currently lives as a Claude artifact - no build config exists. Need to set up Vite + React so I can run it locally and iterate.
