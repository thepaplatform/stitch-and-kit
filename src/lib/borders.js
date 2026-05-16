// Canvas-based decorative border rendering. These functions draw onto a 2D
// canvas context — used by the current (image-pipeline) phrase pillow renderer.
// Phase C will replace these with grid-direct bitmap stamps.

export const PHRASE_BORDERS = {
  'none': { name: 'None', emoji: '⬜' },
  'solid': { name: 'Solid Line', emoji: '▭' },
  'double': { name: 'Double Line', emoji: '⏚' },
  'dashed': { name: 'Dashed', emoji: '╌' },
  'scallop': { name: 'Scalloped', emoji: '〰️' },
  'floral_vine': { name: 'Floral Vine', emoji: '🌿' },
  'gingham': { name: 'Gingham', emoji: '🟪' },
  'rope_twist': { name: 'Rope Twist', emoji: '🪢' },
  'dot_grid': { name: 'Dot Grid', emoji: '⠿' },
  'flower_row': { name: 'Flower Row', emoji: '🌸' },
  'hearts': { name: 'Hearts', emoji: '💖' },
};

// Helper: draw a chunky 5-petal flower at (cx, cy) with petal radius r.
export const drawFlower = (ctx, cx, cy, r) => {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r * 0.85, cy + Math.sin(a) * r * 0.85, r * 0.65, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
};

// Draw a decorative border. The border occupies a strip of `thickness` pixels
// inside the rectangle (x, y, w, h). Furbish/preppy chunky style — substantial
// decorated frame rather than a thin line.
export const drawBorder = (ctx, style, color, x, y, w, h, scale, thickness) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  const t = thickness;

  if (style === 'solid') {
    ctx.fillRect(x, y, w, t);
    ctx.fillRect(x, y + h - t, w, t);
    ctx.fillRect(x, y, t, h);
    ctx.fillRect(x + w - t, y, t, h);
  } else if (style === 'double') {
    const stripT = Math.max(2, Math.floor(t * 0.32));
    const gap = Math.max(2, Math.floor(t * 0.32));
    ctx.fillRect(x, y, w, stripT);
    ctx.fillRect(x, y + h - stripT, w, stripT);
    ctx.fillRect(x, y, stripT, h);
    ctx.fillRect(x + w - stripT, y, stripT, h);
    const io = stripT + gap;
    ctx.fillRect(x + io, y + io, w - io * 2, stripT);
    ctx.fillRect(x + io, y + h - io - stripT, w - io * 2, stripT);
    ctx.fillRect(x + io, y + io, stripT, h - io * 2);
    ctx.fillRect(x + w - io - stripT, y + io, stripT, h - io * 2);
  } else if (style === 'dashed') {
    const dashLen = Math.floor(t * 1.5);
    const gapLen = Math.floor(t * 0.7);
    const drawDashes = (sx, sy, total, isHorizontal) => {
      let pos = 0;
      while (pos < total) {
        const len = Math.min(dashLen, total - pos);
        if (isHorizontal) ctx.fillRect(sx + pos, sy, len, t);
        else ctx.fillRect(sx, sy + pos, t, len);
        pos += dashLen + gapLen;
      }
    };
    drawDashes(x, y, w, true);
    drawDashes(x, y + h - t, w, true);
    drawDashes(x, y, h, false);
    drawDashes(x + w - t, y, h, false);
  } else if (style === 'scallop') {
    const r = Math.floor(t * 0.5);
    ctx.fillRect(x, y, w, Math.floor(t * 0.5));
    ctx.fillRect(x, y + h - Math.floor(t * 0.5), w, Math.floor(t * 0.5));
    ctx.fillRect(x, y, Math.floor(t * 0.5), h);
    ctx.fillRect(x + w - Math.floor(t * 0.5), y, Math.floor(t * 0.5), h);
    const step = r * 2;
    for (let cx = x + r; cx < x + w; cx += step) {
      ctx.beginPath(); ctx.arc(cx, y + Math.floor(t * 0.5) + r, r, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, y + h - Math.floor(t * 0.5) - r, r, 0, Math.PI * 2); ctx.fill();
    }
    for (let cy = y + r; cy < y + h; cy += step) {
      ctx.beginPath(); ctx.arc(x + Math.floor(t * 0.5) + r, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + w - Math.floor(t * 0.5) - r, cy, r, 0, Math.PI * 2); ctx.fill();
    }
  } else if (style === 'floral_vine') {
    const baseStrip = Math.floor(t * 0.35);
    ctx.fillRect(x, y + Math.floor(t * 0.5) - Math.floor(baseStrip/2), w, baseStrip);
    ctx.fillRect(x, y + h - Math.floor(t * 0.5) - Math.floor(baseStrip/2), w, baseStrip);
    ctx.fillRect(x + Math.floor(t * 0.5) - Math.floor(baseStrip/2), y, baseStrip, h);
    ctx.fillRect(x + w - Math.floor(t * 0.5) - Math.floor(baseStrip/2), y, baseStrip, h);
    const fr = Math.floor(t * 0.32);
    const fspacing = fr * 3;
    for (let xx = x + fspacing; xx < x + w; xx += fspacing) {
      drawFlower(ctx, xx, y + Math.floor(t * 0.5), fr);
      drawFlower(ctx, xx, y + h - Math.floor(t * 0.5), fr);
    }
    for (let yy = y + fspacing; yy < y + h; yy += fspacing) {
      drawFlower(ctx, x + Math.floor(t * 0.5), yy, fr);
      drawFlower(ctx, x + w - Math.floor(t * 0.5), yy, fr);
    }
  } else if (style === 'gingham') {
    const sq = Math.max(2, Math.floor(t * 0.5));
    const fillCheckers = (sx, sy, sw, sh) => {
      const cols = Math.floor(sw / sq);
      const rows = Math.floor(sh / sq);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if ((r + c) % 2 === 0) {
            ctx.fillRect(sx + c * sq, sy + r * sq, sq, sq);
          }
        }
      }
    };
    fillCheckers(x, y, w, t);
    fillCheckers(x, y + h - t, w, t);
    fillCheckers(x, y, t, h);
    fillCheckers(x + w - t, y, t, h);
  } else if (style === 'rope_twist') {
    const stripeW = Math.max(2, Math.floor(t * 0.32));
    const stripeGap = Math.max(2, Math.floor(t * 0.18));
    const drawRope = (sx, sy, sw, sh, dir) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(sx, sy, sw, sh);
      ctx.clip();
      ctx.lineWidth = stripeW;
      const span = Math.max(sw, sh) * 1.5;
      for (let i = -span; i < sw + sh + span; i += stripeW + stripeGap) {
        ctx.beginPath();
        if (dir > 0) {
          ctx.moveTo(sx + i, sy);
          ctx.lineTo(sx + i + sh, sy + sh);
        } else {
          ctx.moveTo(sx + i, sy);
          ctx.lineTo(sx + i - sh, sy + sh);
        }
        ctx.stroke();
      }
      ctx.restore();
    };
    drawRope(x, y, w, t, 1);
    drawRope(x, y + h - t, w, t, -1);
    drawRope(x, y, t, h, 1);
    drawRope(x + w - t, y, t, h, -1);
  } else if (style === 'dot_grid') {
    const r = Math.floor(t * 0.22);
    const spacing = r * 3;
    const drawDotBand = (sx, sy, sw, sh) => {
      const cols = Math.floor(sw / spacing);
      const rows = Math.floor(sh / spacing);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cx = sx + col * spacing + spacing / 2;
          const cy = sy + row * spacing + spacing / 2;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };
    drawDotBand(x, y, w, t);
    drawDotBand(x, y + h - t, w, t);
    drawDotBand(x, y, t, h);
    drawDotBand(x + w - t, y, t, h);
  } else if (style === 'flower_row') {
    const fr = Math.floor(t * 0.32);
    const spacing = fr * 2.8;
    const drawFlowerBand = (sx, sy, sw, sh) => {
      const isHorizontal = sw > sh;
      if (isHorizontal) {
        const cy = sy + sh / 2;
        for (let xx = sx + spacing / 2; xx < sx + sw; xx += spacing) {
          drawFlower(ctx, xx, cy, fr);
        }
      } else {
        const cx = sx + sw / 2;
        for (let yy = sy + spacing / 2; yy < sy + sh; yy += spacing) {
          drawFlower(ctx, cx, yy, fr);
        }
      }
    };
    drawFlowerBand(x, y, w, t);
    drawFlowerBand(x, y + h - t, w, t);
    drawFlowerBand(x, y, t, h);
    drawFlowerBand(x + w - t, y, t, h);
  }
  ctx.restore();
};
