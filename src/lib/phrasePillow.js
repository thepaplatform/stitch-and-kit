// Grid-direct phrase pillow renderer. Writes each letter's bitmap stitch-by-stitch
// into the grid array — no canvas, no smoothing, no downsample. This is the
// fix for the fractured-letter bug: the old approach rendered to a canvas and
// then fed that canvas through the image-processing pipeline, which destroyed
// the pixel-perfect letter shapes.

import { PHRASE_FONTS } from './fonts.js';
import { DMC_COLORS, hexToRgb } from './dmc.js';
import { renderWebFontText } from './webFontRenderer.js';

// ---------- low-level grid helpers ----------

const setCell = (grid, x, y, value) => {
  if (y < 0 || y >= grid.length) return;
  if (x < 0 || x >= grid[0].length) return;
  grid[y][x] = value;
};

const fillRect = (grid, x, y, w, h, value) => {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      setCell(grid, xx, yy, value);
    }
  }
};

const stampCircle = (grid, cx, cy, r, value) => {
  const r2 = r * r;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r2) setCell(grid, cx + dx, cy + dy, value);
    }
  }
};

// Small vertical leaf — pointed oval used between flowers on the leafy vine.
const stampLeaf = (grid, cx, cy, r, value) => {
  const reach = Math.max(1, r);
  for (let dy = -reach; dy <= reach; dy++) setCell(grid, cx, cy + dy, value);
  // Side bulges in the middle for a teardrop shape.
  setCell(grid, cx - 1, cy, value);
  setCell(grid, cx + 1, cy, value);
};

// Valentine heart bitmap — stamped at flower intervals on the hearts border.
const HEART_BITMAP = [
  '.#.#.',
  '#####',
  '#####',
  '.###.',
  '..#..',
];
const stampHeart = (grid, cx, cy, value) => {
  const h = HEART_BITMAP.length;
  const w = HEART_BITMAP[0].length;
  const halfW = Math.floor(w / 2);
  const halfH = Math.floor(h / 2);
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (HEART_BITMAP[r][c] === '#') {
        setCell(grid, cx + c - halfW, cy + r - halfH, value);
      }
    }
  }
};

// Two-color flower with distinct petals + center.
// At small sizes uses 4 cardinal petals (looks flowery, not blobby).
// At r>=4 adds 4 diagonal petals for a chunky 8-petal look.
const stampFlower = (grid, cx, cy, r, petalValue, centerValue) => {
  const ringR = Math.max(1, r);
  const petalR = Math.max(1, Math.round(r * 0.55));
  // 4 cardinal petals (N, E, S, W).
  stampCircle(grid, cx, cy - ringR, petalR, petalValue);
  stampCircle(grid, cx + ringR, cy, petalR, petalValue);
  stampCircle(grid, cx, cy + ringR, petalR, petalValue);
  stampCircle(grid, cx - ringR, cy, petalR, petalValue);
  // Diagonal petals only when there's room — otherwise they blob together.
  if (r >= 4) {
    const diagR = Math.max(1, Math.round(ringR * 0.7));
    const diagPetal = Math.max(1, Math.round(petalR * 0.8));
    stampCircle(grid, cx + diagR, cy - diagR, diagPetal, petalValue);
    stampCircle(grid, cx - diagR, cy - diagR, diagPetal, petalValue);
    stampCircle(grid, cx + diagR, cy + diagR, diagPetal, petalValue);
    stampCircle(grid, cx - diagR, cy + diagR, diagPetal, petalValue);
  }
  // Center dot (drawn last so it sits on top of petals).
  stampCircle(grid, cx, cy, Math.max(1, Math.round(r * 0.45)), centerValue);
};

// ---------- borders, all rendered as grid stamps ----------

// `mainValue` is the dominant border color (vines, base strips, frames).
// `accentValue` is used for the decorative pop — flower petals, scallop bumps.
// For single-color styles (solid, double, dashed, etc.) only mainValue is used.
const drawBorderToGrid = (grid, style, mainValue, accentValue, x, y, w, h, t) => {
  if (style === 'none' || t <= 0) return;
  const value = mainValue;

  if (style === 'solid') {
    fillRect(grid, x, y, w, t, value);
    fillRect(grid, x, y + h - t, w, t, value);
    fillRect(grid, x, y, t, h, value);
    fillRect(grid, x + w - t, y, t, h, value);
    return;
  }

  if (style === 'double') {
    const stripT = Math.max(1, Math.floor(t * 0.32));
    const gap = Math.max(1, Math.floor(t * 0.32));
    fillRect(grid, x, y, w, stripT, value);
    fillRect(grid, x, y + h - stripT, w, stripT, value);
    fillRect(grid, x, y, stripT, h, value);
    fillRect(grid, x + w - stripT, y, stripT, h, value);
    const io = stripT + gap;
    fillRect(grid, x + io, y + io, w - io * 2, stripT, value);
    fillRect(grid, x + io, y + h - io - stripT, w - io * 2, stripT, value);
    fillRect(grid, x + io, y + io, stripT, h - io * 2, value);
    fillRect(grid, x + w - io - stripT, y + io, stripT, h - io * 2, value);
    return;
  }

  if (style === 'dashed') {
    const dashLen = Math.max(2, Math.floor(t * 1.5));
    const gapLen = Math.max(1, Math.floor(t * 0.7));
    let pos = 0;
    while (pos < w) {
      const len = Math.min(dashLen, w - pos);
      fillRect(grid, x + pos, y, len, t, value);
      fillRect(grid, x + pos, y + h - t, len, t, value);
      pos += dashLen + gapLen;
    }
    pos = 0;
    while (pos < h) {
      const len = Math.min(dashLen, h - pos);
      fillRect(grid, x, y + pos, t, len, value);
      fillRect(grid, x + w - t, y + pos, t, len, value);
      pos += dashLen + gapLen;
    }
    return;
  }

  if (style === 'dot_grid') {
    const r = Math.max(1, Math.floor(t * 0.25));
    const spacing = Math.max(2, r * 3);
    const dotBand = (sx, sy, sw, sh) => {
      const cols = Math.max(1, Math.floor(sw / spacing));
      const rows = Math.max(1, Math.floor(sh / spacing));
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cx = sx + Math.floor(col * spacing + spacing / 2);
          const cy = sy + Math.floor(row * spacing + spacing / 2);
          stampCircle(grid, cx, cy, r, value);
        }
      }
    };
    dotBand(x, y, w, t);
    dotBand(x, y + h - t, w, t);
    dotBand(x, y, t, h);
    dotBand(x + w - t, y, t, h);
    return;
  }

  if (style === 'gingham') {
    const sq = Math.max(1, Math.floor(t * 0.5));
    const checkers = (sx, sy, sw, sh) => {
      const cols = Math.floor(sw / sq);
      const rows = Math.floor(sh / sq);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if ((r + c) % 2 === 0) fillRect(grid, sx + c * sq, sy + r * sq, sq, sq, value);
        }
      }
    };
    checkers(x, y, w, t);
    checkers(x, y + h - t, w, t);
    checkers(x, y, t, h);
    checkers(x + w - t, y, t, h);
    return;
  }

  if (style === 'flower_row') {
    const fr = Math.max(2, Math.floor(t * 0.4));
    const spacing = Math.max(3, Math.round(fr * 2.5));
    const cyTop = y + Math.floor(t / 2);
    const cyBot = y + h - Math.floor(t / 2) - 1;
    for (let xx = x + Math.floor(spacing / 2); xx < x + w; xx += spacing) {
      stampFlower(grid, xx, cyTop, fr, accentValue, mainValue);
      stampFlower(grid, xx, cyBot, fr, accentValue, mainValue);
    }
    const cxLeft = x + Math.floor(t / 2);
    const cxRight = x + w - Math.floor(t / 2) - 1;
    for (let yy = y + Math.floor(spacing / 2); yy < y + h; yy += spacing) {
      stampFlower(grid, cxLeft, yy, fr, accentValue, mainValue);
      stampFlower(grid, cxRight, yy, fr, accentValue, mainValue);
    }
    return;
  }

  if (style === 'floral_vine') {
    // Slightly thinner vine strips so flowers stand out more.
    const baseStrip = Math.max(1, Math.floor(t * 0.22));
    const off = Math.floor(t / 2);
    const halfStrip = Math.floor(baseStrip / 2);
    fillRect(grid, x, y + off - halfStrip, w, baseStrip, value);
    fillRect(grid, x, y + h - off - halfStrip, w, baseStrip, value);
    fillRect(grid, x + off - halfStrip, y, baseStrip, h, value);
    fillRect(grid, x + w - off - halfStrip, y, baseStrip, h, value);

    // Wider spacing so leaves have room between flowers.
    const fr = Math.max(2, Math.floor(t * 0.36));
    const spacing = Math.max(6, Math.round(fr * 4));
    const leafR = Math.max(1, Math.floor(fr * 0.55));

    // Top + bottom edges: flowers at `spacing`, leaves at `spacing/2` offset.
    for (let xx = x + spacing; xx < x + w - spacing / 2; xx += spacing) {
      stampFlower(grid, xx, y + off, fr, accentValue, mainValue);
      stampFlower(grid, xx, y + h - off - 1, fr, accentValue, mainValue);
    }
    for (let xx = x + Math.floor(spacing / 2); xx < x + w; xx += spacing) {
      // Leaves bracket the vine — one above, one below the strip.
      stampLeaf(grid, xx, y + off - baseStrip - leafR, leafR, mainValue);
      stampLeaf(grid, xx, y + off + baseStrip + leafR, leafR, mainValue);
      stampLeaf(grid, xx, y + h - off - baseStrip - leafR - 1, leafR, mainValue);
      stampLeaf(grid, xx, y + h - off + baseStrip + leafR - 1, leafR, mainValue);
    }
    // Left + right edges: same idea, rotated.
    for (let yy = y + spacing; yy < y + h - spacing / 2; yy += spacing) {
      stampFlower(grid, x + off, yy, fr, accentValue, mainValue);
      stampFlower(grid, x + w - off - 1, yy, fr, accentValue, mainValue);
    }
    for (let yy = y + Math.floor(spacing / 2); yy < y + h; yy += spacing) {
      stampLeaf(grid, x + off - baseStrip - leafR, yy, leafR, mainValue);
      stampLeaf(grid, x + off + baseStrip + leafR, yy, leafR, mainValue);
      stampLeaf(grid, x + w - off - baseStrip - leafR - 1, yy, leafR, mainValue);
      stampLeaf(grid, x + w - off + baseStrip + leafR - 1, yy, leafR, mainValue);
    }
    return;
  }

  if (style === 'hearts') {
    // Thin base strip + hearts in accent color.
    const baseStrip = Math.max(1, Math.floor(t * 0.2));
    const off = Math.floor(t / 2);
    const halfStrip = Math.floor(baseStrip / 2);
    fillRect(grid, x, y + off - halfStrip, w, baseStrip, value);
    fillRect(grid, x, y + h - off - halfStrip, w, baseStrip, value);
    fillRect(grid, x + off - halfStrip, y, baseStrip, h, value);
    fillRect(grid, x + w - off - halfStrip, y, baseStrip, h, value);
    // Heart is 5w × 5h; space ~8 cells apart so they don't crowd.
    const spacing = Math.max(7, Math.floor(t * 0.7));
    for (let xx = x + Math.floor(spacing / 2); xx < x + w; xx += spacing) {
      stampHeart(grid, xx, y + off, accentValue);
      stampHeart(grid, xx, y + h - off - 1, accentValue);
    }
    for (let yy = y + Math.floor(spacing / 2); yy < y + h; yy += spacing) {
      stampHeart(grid, x + off, yy, accentValue);
      stampHeart(grid, x + w - off - 1, yy, accentValue);
    }
    return;
  }

  if (style === 'scallop') {
    const baseT = Math.max(1, Math.floor(t * 0.4));
    const r = Math.max(1, Math.floor(t * 0.4));
    // Base strip in main color
    fillRect(grid, x, y, w, baseT, value);
    fillRect(grid, x, y + h - baseT, w, baseT, value);
    fillRect(grid, x, y, baseT, h, value);
    fillRect(grid, x + w - baseT, y, baseT, h, value);
    // Scallop bumps in accent for pop
    const step = Math.max(2, r * 2);
    for (let cx = x + r; cx < x + w; cx += step) {
      stampCircle(grid, cx, y + baseT + r, r, accentValue);
      stampCircle(grid, cx, y + h - baseT - r - 1, r, accentValue);
    }
    for (let cy = y + r; cy < y + h; cy += step) {
      stampCircle(grid, x + baseT + r, cy, r, accentValue);
      stampCircle(grid, x + w - baseT - r - 1, cy, r, accentValue);
    }
    return;
  }

  if (style === 'rope_twist') {
    const stripeW = Math.max(1, Math.floor(t * 0.3));
    const stripeGap = Math.max(1, Math.floor(t * 0.2));
    const period = stripeW + stripeGap;
    const drawDiag = (sx, sy, sw, sh, dir) => {
      for (let yy = 0; yy < sh; yy++) {
        for (let xx = 0; xx < sw; xx++) {
          const key = dir > 0 ? (xx + yy) : (xx - yy + sh * 2);
          if (key % period < stripeW) setCell(grid, sx + xx, sy + yy, value);
        }
      }
    };
    drawDiag(x, y, w, t, 1);
    drawDiag(x, y + h - t, w, t, -1);
    drawDiag(x, y, t, h, 1);
    drawDiag(x + w - t, y, t, h, -1);
    return;
  }
};

// ---------- palette builder ----------

const findNearestDmc = (hex) => {
  const rgb = hexToRgb(hex);
  let best = DMC_COLORS[0];
  let minD = Infinity;
  for (const d of DMC_COLORS) {
    const drgb = hexToRgb(d.hex);
    const dist = (rgb[0]-drgb[0])**2 + (rgb[1]-drgb[1])**2 + (rgb[2]-drgb[2])**2;
    if (dist < minD) { minD = dist; best = d; }
  }
  return best;
};

// Border styles that use the accent color (for flower petals / scallop bumps).
const STYLES_USING_ACCENT = new Set(['floral_vine', 'flower_row', 'scallop']);

const buildPalette = ({ textColor, bgColor, borderColor, borderAccentColor, borderStyle, useDMC }) => {
  // Dedupe by final hex (post-DMC-snap if applicable) so the same DMC thread
  // doesn't appear twice when text and border land on the same color.
  const noBorder = borderStyle === 'none';
  const usesAccent = STYLES_USING_ACCENT.has(borderStyle);
  const resolved = [
    { role: 'bg', src: bgColor },
    { role: 'text', src: textColor },
    { role: 'border', src: noBorder ? bgColor : borderColor },
    // Only include accent when the chosen border style actually paints with it.
    { role: 'accent', src: usesAccent ? borderAccentColor : (noBorder ? bgColor : borderColor) },
  ].map(r => {
    if (useDMC) {
      const dmc = findNearestDmc(r.src);
      return { ...r, hex: dmc.hex, rgb: hexToRgb(dmc.hex), dmc: dmc.dmc, name: dmc.name };
    }
    return { ...r, hex: r.src, rgb: hexToRgb(r.src), dmc: null, name: null };
  });

  const colors = [];
  const indexByRole = {};
  const seen = new Map();
  for (const r of resolved) {
    const key = r.hex.toLowerCase();
    if (seen.has(key)) {
      indexByRole[r.role] = seen.get(key);
      continue;
    }
    const idx = colors.length;
    seen.set(key, idx);
    indexByRole[r.role] = idx;
    colors.push({ rgb: r.rgb, hex: r.hex, dmc: r.dmc, name: r.name, count: 0 });
  }
  return { colors, indexByRole };
};

// ---------- main entry point ----------

// Draw a border along the perimeter of a circle/oval shape: a ring of
// decorative elements (flowers/leaves/hearts/etc) following the curve,
// instead of rectangular strips that get clipped by the shape mask.
const drawShapedBorder = (grid, style, mainValue, accentValue, w, h, t) => {
  if (style === 'none' || t <= 0) return;
  const cx = w / 2;
  const cy = h / 2;
  // Outer ring radius — sit just inside the shape edge.
  const rxOuter = w / 2 - 1;
  const ryOuter = h / 2 - 1;
  // Inner ring radius — leave room for the text area.
  const rxInner = Math.max(2, rxOuter - t);
  const ryInner = Math.max(2, ryOuter - t);
  // Number of decorative elements: scale with the perimeter.
  const perim = Math.PI * (rxOuter + ryOuter);
  // Element spacing depends on element size — bigger elements, fewer of them.
  const fr = Math.max(2, Math.floor(t * 0.4));
  const elementSpacing = Math.max(3, fr * 2.5);
  const count = Math.max(6, Math.floor(perim / elementSpacing));
  // Pick where on the radius the decoration sits.
  const rxMid = (rxOuter + rxInner) / 2;
  const ryMid = (ryOuter + ryInner) / 2;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = Math.round(cx + rxMid * Math.cos(angle));
    const y = Math.round(cy + ryMid * Math.sin(angle));
    // Choose how each style stamps along the ring.
    if (style === 'floral_vine' || style === 'flower_row') {
      stampFlower(grid, x, y, fr, accentValue, mainValue);
    } else if (style === 'hearts') {
      stampHeart(grid, x, y, accentValue);
    } else if (style === 'dot_grid' || style === 'scallop') {
      stampCircle(grid, x, y, fr, accentValue || mainValue);
    } else {
      // solid / double / dashed / gingham / rope_twist → draw a small filled
      // block at each position to form a beaded ring outline.
      stampCircle(grid, x, y, Math.max(1, Math.floor(fr * 0.7)), mainValue);
    }
  }
};

export const renderPhraseToGrid = ({
  text,
  fontKey,
  widthStitches,
  heightStitches,
  textColor,
  bgColor,
  borderStyle,
  borderColor,
  borderAccentColor,
  useDMC,
  shape = 'rectangle',
  // Multiplier on the auto-computed text size. 1.0 = auto-fit (largest
  // size that fits). <1 = smaller letters. >1 = larger letters that may
  // bleed toward or into the border area.
  textScale = 1.0,
}) => {
  const { colors, indexByRole } = buildPalette({
    textColor, bgColor, borderColor, borderAccentColor, borderStyle, useDMC,
  });
  const bgIdx = indexByRole.bg;
  const textIdx = indexByRole.text;
  const borderIdx = indexByRole.border;
  const accentIdx = indexByRole.accent;

  // Fill grid with bg.
  const grid = Array.from({ length: heightStitches }, () =>
    new Array(widthStitches).fill(bgIdx));

  // Border thickness scales with the smaller dimension.
  const minDim = Math.min(widthStitches, heightStitches);
  const borderThickness = borderStyle === 'none' ? 0 : Math.max(2, Math.round(minDim * 0.10));
  const isCurved = shape === 'circle' || shape === 'oval';
  if (isCurved) {
    drawShapedBorder(grid, borderStyle, borderIdx, accentIdx, widthStitches, heightStitches, borderThickness);
  } else {
    drawBorderToGrid(grid, borderStyle, borderIdx, accentIdx, 0, 0, widthStitches, heightStitches, borderThickness);
  }

  // Text layout area: inset further on curved shapes so text stays within
  // the inscribed rectangle of the circle/oval (otherwise it overflows).
  const padding = 2;
  let textBoxX = borderThickness + padding;
  let textBoxY = borderThickness + padding;
  let textBoxW = Math.max(0, widthStitches - 2 * (borderThickness + padding));
  let textBoxH = Math.max(0, heightStitches - 2 * (borderThickness + padding));
  if (isCurved) {
    // Inscribed rectangle of an ellipse with radii (rx, ry) has half-axes
    // (rx/√2, ry/√2). Use that as the safe text area, plus border inset.
    const SQRT2 = Math.SQRT2;
    const innerRx = Math.max(0, widthStitches / 2 - borderThickness - padding);
    const innerRy = Math.max(0, heightStitches / 2 - borderThickness - padding);
    const inscribedW = Math.floor((innerRx * 2) / SQRT2);
    const inscribedH = Math.floor((innerRy * 2) / SQRT2);
    textBoxW = inscribedW;
    textBoxH = inscribedH;
    textBoxX = Math.floor((widthStitches - inscribedW) / 2);
    textBoxY = Math.floor((heightStitches - inscribedH) / 2);
  }

  const font = PHRASE_FONTS[fontKey] || PHRASE_FONTS['chunky_10x14'];

  // Web fonts: hand off to the canvas-based renderer. It writes directly into
  // the grid as filled stitches, then we still do the stitch-count pass below.
  if (font.type === 'webfont') {
    renderWebFontText({
      text,
      fontSpec: font,
      grid,
      textBoxX, textBoxY, textBoxW, textBoxH,
      textIdx,
      textScale,
    });
  } else if (textBoxW > 0 && textBoxH > 0) {
    const charW = font.w;
    const charH = font.h;
    const lines = (text || '').toUpperCase().split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) {
      // fall through to stitch count
    } else {
    const longestLen = Math.max(...lines.map(l => l.length));
    // 1 cell gap between chars and between lines (at scale 1).
    const lineCharsW = longestLen * charW + (longestLen - 1);
    const totalCharsH = lines.length * charH + (lines.length - 1);

    // Integer scale — keeps bitmap letterforms pixel-perfect. Fractional
    // scaling introduces uneven strokes and broken glyphs, so we stick to
    // whole-multiple scaling and rely on font choice to fill the box.
    const scaleByW = Math.floor(textBoxW / lineCharsW);
    const scaleByH = Math.floor(textBoxH / totalCharsH);
    // Auto-fit scale, then apply user multiplier (clamp at 1 minimum so the
    // bitmap never shrinks below its native resolution).
    const autoSc = Math.min(scaleByW, scaleByH);
    const sc = Math.max(1, Math.round(autoSc * textScale));

    const renderedW = lineCharsW * sc;
    const renderedH = totalCharsH * sc;
    const startX = textBoxX + Math.floor((textBoxW - renderedW) / 2);
    const startY = textBoxY + Math.floor((textBoxH - renderedH) / 2);

    lines.forEach((line, lineIdx) => {
      const thisLineW = (line.length * charW + (line.length - 1)) * sc;
      const lineX = startX + Math.floor((renderedW - thisLineW) / 2);
      const lineY = startY + lineIdx * (charH + 1) * sc;
      for (let charIdx = 0; charIdx < line.length; charIdx++) {
        const ch = line[charIdx];
        const charBitmap = font.bitmap[ch] || font.bitmap[' '];
        const charX = lineX + charIdx * (charW + 1) * sc;
        for (let row = 0; row < charH; row++) {
          const rowStr = charBitmap[row] || '';
          for (let col = 0; col < charW; col++) {
            if (rowStr[col] !== '#') continue;
            // Stamp a sc×sc block per bitmap pixel.
            for (let sy = 0; sy < sc; sy++) {
              for (let sx = 0; sx < sc; sx++) {
                setCell(grid, charX + col * sc + sx, lineY + row * sc + sy, textIdx);
              }
            }
          }
        }
      }
    });
    }  // end of `else` for lines.length > 0
  }  // end of `else if (textBoxW > 0 && textBoxH > 0)`

  // Count stitches per palette index.
  const counts = new Array(colors.length).fill(0);
  for (const row of grid) {
    for (const v of row) {
      if (v >= 0 && v < counts.length) counts[v]++;
    }
  }
  const palette = colors.map((c, i) => ({ ...c, count: counts[i] }));

  return { grid, palette };
};
