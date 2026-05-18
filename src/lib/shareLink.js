// Encode a pattern (or a phrase config) into a URL-safe base64 string and
// back, so we can share designs via a link without any backend.
//
// Two payload shapes are supported:
//   1. Image mode result: { v:1, t:'grid', p:projectKey, g: encodedGrid, c: encodedPalette }
//   2. Phrase mode config: { v:1, t:'phrase', p:projectKey, ...phrase fields }
//
// Image-mode patterns can get LONG (thousands of cells) so we run-length-
// encode each grid row before base64ing.

const VERSION = 1;

// Run-length encode a grid row: [1,1,1,2,2,0,0,0,0] → "1x3,2x2,0x4"
const rleRow = (row) => {
  if (!row || row.length === 0) return '';
  const parts = [];
  let cur = row[0];
  let run = 1;
  for (let i = 1; i < row.length; i++) {
    if (row[i] === cur) {
      run++;
    } else {
      parts.push(run > 1 ? `${cur}x${run}` : `${cur}`);
      cur = row[i];
      run = 1;
    }
  }
  parts.push(run > 1 ? `${cur}x${run}` : `${cur}`);
  return parts.join(',');
};

const decodeRleRow = (s) => {
  if (!s) return [];
  const out = [];
  for (const tok of s.split(',')) {
    if (!tok) continue;
    const x = tok.indexOf('x');
    if (x === -1) {
      out.push(parseInt(tok, 10));
    } else {
      const val = parseInt(tok.slice(0, x), 10);
      const run = parseInt(tok.slice(x + 1), 10);
      for (let i = 0; i < run; i++) out.push(val);
    }
  }
  return out;
};

// Make a URL-safe base64 (no padding, no +, no /).
const urlSafe = (b64) =>
  b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromUrlSafe = (s) => {
  let b = s.replace(/-/g, '+').replace(/_/g, '/');
  while (b.length % 4) b += '=';
  return b;
};

const encodeJSON = (obj) => {
  try {
    return urlSafe(btoa(unescape(encodeURIComponent(JSON.stringify(obj)))));
  } catch {
    return null;
  }
};
const decodeJSON = (s) => {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(fromUrlSafe(s)))));
  } catch {
    return null;
  }
};

// PUBLIC API

export const encodeGridPattern = ({ projectKey, widthIn, heightIn, mesh, shape, gridData, palette }) => {
  return encodeJSON({
    v: VERSION, t: 'grid', p: projectKey,
    w: widthIn, h: heightIn, m: mesh, s: shape,
    g: gridData.map(rleRow),
    c: palette.map(p => ({ h: p.hex, d: p.dmc || null, n: p.name || null })),
  });
};

export const encodePhrasePattern = ({
  projectKey, widthIn, heightIn, mesh, shape,
  phraseText, phraseFont, phraseTextColor, phraseBgColor,
  phraseBorderStyle, phraseBorderColor, phraseBorderAccentColor, phraseTextScale,
}) => {
  return encodeJSON({
    v: VERSION, t: 'phrase', p: projectKey,
    w: widthIn, h: heightIn, m: mesh, s: shape,
    tx: phraseText, fn: phraseFont,
    tc: phraseTextColor, bc: phraseBgColor,
    bs: phraseBorderStyle, bo: phraseBorderColor, ba: phraseBorderAccentColor,
    ts: phraseTextScale,
  });
};

export const decodePattern = (encoded) => {
  const obj = decodeJSON(encoded);
  if (!obj || obj.v !== VERSION) return null;
  const common = {
    type: obj.t,
    projectKey: obj.p,
    widthIn: obj.w,
    heightIn: obj.h,
    mesh: obj.m,
    shape: obj.s,
  };
  if (obj.t === 'grid') {
    return {
      ...common,
      gridData: (obj.g || []).map(decodeRleRow),
      palette: (obj.c || []).map(c => ({
        hex: c.h,
        dmc: c.d,
        name: c.n,
        rgb: [
          parseInt(c.h.slice(1, 3), 16),
          parseInt(c.h.slice(3, 5), 16),
          parseInt(c.h.slice(5, 7), 16),
        ],
        count: 0,
      })),
    };
  }
  if (obj.t === 'phrase') {
    return {
      ...common,
      phraseText: obj.tx,
      phraseFont: obj.fn,
      phraseTextColor: obj.tc,
      phraseBgColor: obj.bc,
      phraseBorderStyle: obj.bs,
      phraseBorderColor: obj.bo,
      phraseBorderAccentColor: obj.ba,
      phraseTextScale: obj.ts || 100,
    };
  }
  return null;
};
