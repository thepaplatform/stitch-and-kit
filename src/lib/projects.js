// Project presets (belts, ornaments, pillows, etc.) and stretcher bar logic.

export const PROJECTS = {
  belt: { name: 'Belt Logo', emoji: '👛', mesh: 18, widthIn: 2.5, heightIn: 1.22, shape: 'rectangle', note: 'Centered logo on a standard 1.25" belt blank', usesStretcherBars: false, finishNote: 'Belt blanks are pre-cut to size — you only stitch the logo area, the rest stays blank canvas. No stretcher bars needed.' },
  belt_full: { name: 'Full Belt (36")', emoji: '👖', mesh: 18, widthIn: 36, heightIn: 1.22, shape: 'rectangle', note: 'Full 36" belt blank — see logo to scale on the whole belt', usesStretcherBars: false, finishNote: 'Use the Width offset slider in Size & Shape to move the logo placement along the belt. Most stitchers center it; some prefer slightly off-center.' },
  keyfob: { name: 'Key Fob', emoji: '🔑', mesh: 18, widthIn: 3, heightIn: 1, shape: 'rectangle', note: 'Slim rectangle for keychains', usesStretcherBars: false, finishNote: 'Key fob blanks come pre-sized. No stretcher bars needed — stitch in-hand.' },
  ornament_round: { name: 'Round Ornament', emoji: '🎄', mesh: 13, widthIn: 3.5, heightIn: 3.5, shape: 'circle', note: 'Classic round ornament', usesStretcherBars: true },
  ornament_oval: { name: 'Oval Ornament', emoji: '✨', mesh: 13, widthIn: 4, heightIn: 3, shape: 'oval', note: 'Oval ornament shape', usesStretcherBars: true },
  coaster: { name: 'Coaster', emoji: '🍸', mesh: 13, widthIn: 4, heightIn: 4, shape: 'square', note: 'Square coaster', usesStretcherBars: true },
  phrase_pillow_sm: { name: 'Phrase Pillow (Small)', emoji: '💬', mesh: 13, widthIn: 10, heightIn: 6, shape: 'rectangle', note: 'Mini sayings pillow (~10×6")', usesStretcherBars: true },
  phrase_pillow_md: { name: 'Phrase Pillow (Medium)', emoji: '💗', mesh: 13, widthIn: 12, heightIn: 8, shape: 'rectangle', note: 'Furbish-style sayings pillow', usesStretcherBars: true },
  phrase_pillow_lg: { name: 'Phrase Pillow (Large)', emoji: '💋', mesh: 13, widthIn: 14, heightIn: 10, shape: 'rectangle', note: 'Larger landscape pillow', usesStretcherBars: true },
  pillow_sm: { name: 'Square Pillow (Small)', emoji: '💕', mesh: 13, widthIn: 12, heightIn: 12, shape: 'square', note: 'Square throw pillow', usesStretcherBars: true },
  pillow_lg: { name: 'Square Pillow (Large)', emoji: '💖', mesh: 13, widthIn: 14, heightIn: 14, shape: 'square', note: 'Larger square throw pillow', usesStretcherBars: true },
  stocking: { name: 'Stocking', emoji: '🎁', mesh: 13, widthIn: 8, heightIn: 14, shape: 'rectangle', note: 'Christmas stocking panel', usesStretcherBars: true },
  custom: { name: 'Custom', emoji: '⭐', mesh: 13, widthIn: 4, heightIn: 4, shape: 'rectangle', note: 'Make your own', usesStretcherBars: true },
};

// Standard needlepoint stretcher bar sizes (sold in pairs, whole inches).
// Mini bars (1/2" wide): 5"-18" in 1" increments.
// Regular bars (3/4"-1" wide): 5"-28" in 1" increments, plus 30", 32", 36".
export const STRETCHER_BAR_SIZES = [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,30,32,36];

// Margin added to each side of the design before rounding up to a stretcher bar.
export const CANVAS_MARGIN_INCHES = 2;

const nextStretcherBar = (inches) => {
  for (const s of STRETCHER_BAR_SIZES) {
    if (s >= inches) return s;
  }
  return STRETCHER_BAR_SIZES[STRETCHER_BAR_SIZES.length - 1];
};

// Returns { barW, barH, isMini } — the recommended stretcher bar pair sizes.
export const recommendStretcherBars = (designW, designH) => {
  const neededW = designW + CANVAS_MARGIN_INCHES * 2;
  const neededH = designH + CANVAS_MARGIN_INCHES * 2;
  const barW = nextStretcherBar(neededW);
  const barH = nextStretcherBar(neededH);
  // Mini bars only go up to 18".
  const isMini = barW <= 18 && barH <= 18;
  return { barW, barH, isMini };
};
