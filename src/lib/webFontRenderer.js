// Render a real web font (Google Fonts etc.) into the stitch grid by drawing
// the text to an offscreen canvas at supersampled resolution, then downsampling
// + thresholding to decide which stitches get filled.
//
// This is how we support cursive, italic, lowercase serif, etc. without
// hand-designing bitmaps — at the cost of some edge stairstepping (which is
// what needlepoint looks like anyway).

const SUPER = 3;        // supersample factor for cleaner anti-aliased input
const ALPHA_THRESHOLD = 120;  // 0–255; below this a stitch stays unfilled

const applyTransform = (line, t) => {
  if (t === 'uppercase') return line.toUpperCase();
  if (t === 'lowercase') return line.toLowerCase();
  return line;
};

// Build the CSS font shorthand string from a spec.
const cssFont = (spec, sizePx) => {
  const style = spec.style || 'normal';
  const weight = spec.weight || 400;
  return `${style} ${weight} ${sizePx}px ${spec.family}`;
};

// Find the largest integer font size (in supersampled px) where every line
// fits horizontally and the line stack fits vertically.
const findBestFontSize = (ctx, lines, spec, cw, ch, lineHeightMul) => {
  // Start near the ceiling and walk down — typically converges in <20 steps.
  let maxSize = Math.floor(ch / lines.length / lineHeightMul);
  if (maxSize < 6) return 6;
  for (let size = maxSize; size >= 6; size--) {
    ctx.font = cssFont(spec, size);
    const lineH = size * lineHeightMul;
    if (lineH * lines.length > ch) continue;
    let fits = true;
    for (const l of lines) {
      if (ctx.measureText(l).width > cw) { fits = false; break; }
    }
    if (fits) return size;
  }
  return 6;
};

// Stamp the text into the grid as `textIdx`. Returns nothing — mutates grid.
export const renderWebFontText = ({
  text, fontSpec,
  grid, textBoxX, textBoxY, textBoxW, textBoxH, textIdx,
  // 1.0 = auto-fit (largest size that fits). Multiplier on the auto-sized text.
  textScale = 1.0,
}) => {
  if (!text || textBoxW <= 0 || textBoxH <= 0) return;

  const lineHeightMul = fontSpec.lineHeight || 1.1;
  const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (rawLines.length === 0) return;
  const lines = rawLines.map(l => applyTransform(l, fontSpec.transform));

  // Supersampled canvas — render at SUPER× stitch resolution so the input has
  // proper anti-aliasing, then downsample with averaging + threshold.
  const cw = textBoxW * SUPER;
  const ch = textBoxH * SUPER;
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');

  // Auto-fit size, then apply the user's multiplier.
  const autoFontSize = findBestFontSize(ctx, lines, fontSpec, cw, ch, lineHeightMul);
  const fontSize = Math.max(6, Math.round(autoFontSize * textScale));
  ctx.font = cssFont(fontSpec, fontSize);
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lineH = fontSize * lineHeightMul;
  const totalH = lineH * lines.length;
  const startY = (ch - totalH) / 2 + lineH / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], cw / 2, startY + i * lineH);
  }

  // Downsample: for each stitch, average alpha across its SUPER×SUPER source
  // block and threshold to decide whether that stitch is filled.
  const imgData = ctx.getImageData(0, 0, cw, ch).data;
  const blockArea = SUPER * SUPER;
  for (let sy = 0; sy < textBoxH; sy++) {
    const gy = textBoxY + sy;
    if (gy < 0 || gy >= grid.length) continue;
    for (let sx = 0; sx < textBoxW; sx++) {
      const gx = textBoxX + sx;
      if (gx < 0 || gx >= grid[0].length) continue;
      let alphaSum = 0;
      for (let dy = 0; dy < SUPER; dy++) {
        const py = sy * SUPER + dy;
        const rowBase = py * cw * 4;
        for (let dx = 0; dx < SUPER; dx++) {
          const px = sx * SUPER + dx;
          alphaSum += imgData[rowBase + px * 4 + 3];
        }
      }
      if (alphaSum / blockArea > ALPHA_THRESHOLD) {
        grid[gy][gx] = textIdx;
      }
    }
  }
};
