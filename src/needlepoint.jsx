import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, RotateCcw, Eye, Grid3x3, Sparkles, Palette, Edit3, Eraser, Image as ImageIcon, X, Undo2, Wand2, Layers, Heart, Star, FileText, Maximize2 } from 'lucide-react';
import { DMC_COLORS, SYMBOLS, hexToRgb, rgbToHex, getSaturation, closestColor, quantize } from './lib/dmc.js';
import { PROJECTS, recommendStretcherBars } from './lib/projects.js';
import { PHRASE_FONTS, PHRASE_PRESETS } from './lib/fonts.js';
import { PHRASE_BORDERS } from './lib/borders.js';
import { renderPhraseToGrid } from './lib/phrasePillow.js';

export default function NeedlepointDesigner() {
  const [projectKey, setProjectKey] = useState('belt');
  const [inputMode, setInputMode] = useState('image'); // 'image' or 'text'
  const [phraseText, setPhraseText] = useState('I LOVE\nTHAT FOR\nYOU');
  const [phraseFont, setPhraseFont] = useState('chunky_10x14');
  const [phraseTextColor, setPhraseTextColor] = useState('#1e3a8a'); // navy
  const [phraseBgColor, setPhraseBgColor] = useState('#ffffff'); // white bg
  const [phraseBorderStyle, setPhraseBorderStyle] = useState('floral_vine');
  const [phraseBorderColor, setPhraseBorderColor] = useState('#7ba428'); // green vine
  const [phraseBorderAccentColor, setPhraseBorderAccentColor] = useState('#ff6ec4'); // pink flowers
  // Toggled true once the web fonts (Cinzel, Playfair, Pacifico, etc.) finish
  // loading. Including this in the text-mode useEffect deps re-runs render
  // after fonts arrive, so users don't see Times-fallback letters flash first.
  const [fontsReady, setFontsReady] = useState(false);
  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState('');
  const [refImage, setRefImage] = useState(null);
  const [refImageName, setRefImageName] = useState('');
  const [mesh, setMesh] = useState(18);
  const [widthIn, setWidthIn] = useState(2.5);
  const [heightIn, setHeightIn] = useState(1.22);
  const [shape, setShape] = useState('rectangle');
  const [numColors, setNumColors] = useState(4);
  const [smoothing, setSmoothing] = useState(2);
  const [edgeSharpness, setEdgeSharpness] = useState(1);
  const [useDMC, setUseDMC] = useState(true);
  const [gridData, setGridData] = useState(null);
  const [palette, setPalette] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [hoveredCell, setHoveredCell] = useState(null);
  const [showGuides, setShowGuides] = useState(true);
  const [showShape, setShowShape] = useState(true);
  const [showCanvas, setShowCanvas] = useState(false);
  const [showTrace, setShowTrace] = useState(false);
  const [traceOpacity, setTraceOpacity] = useState(0.35);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [useBg, setUseBg] = useState(false);
  const [designScale, setDesignScale] = useState(100); // % of canvas the design fills
  const [designOffsetX, setDesignOffsetX] = useState(0); // -50 to 50, % shift
  const [exportStatus, setExportStatus] = useState(null); // null | 'working' | 'done' | 'error'
  const [exportProgress, setExportProgress] = useState('');
  const [exportedImages, setExportedImages] = useState([]); // [{name, dataUrl}] for long-press save
  const [editMode, setEditMode] = useState(false);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [drawAction, setDrawAction] = useState('paint');
  const [history, setHistory] = useState([]);
  const [editingColorIdx, setEditingColorIdx] = useState(null);
  const [dmcSearch, setDmcSearch] = useState('');
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showExportPicker, setShowExportPicker] = useState(false);
  const [zoomLevel, setZoomLevel] = useState('fit');
  const [containerWidth, setContainerWidth] = useState(typeof window !== 'undefined' ? Math.min(800, window.innerWidth - 80) : 350);
  const [shopName, setShopName] = useState('');
  const [patternName, setPatternName] = useState('');
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const refFileInputRef = useRef(null);
  const gridScrollRef = useRef(null);
  const stitchPreviewRef = useRef(null);
  const isDrawingRef = useRef(false);

  const widthStitches = Math.max(4, Math.round(widthIn * mesh));
  const heightStitches = Math.max(4, Math.round(heightIn * mesh));
  const stretcherBars = recommendStretcherBars(widthIn, heightIn);
  const canvasWidthIn = stretcherBars.barW;
  const canvasHeightIn = stretcherBars.barH;

  const loadProject = (key) => {
    const p = PROJECTS[key];
    setProjectKey(key);
    setMesh(p.mesh);
    setWidthIn(p.widthIn);
    setHeightIn(p.heightIn);
    setShape(p.shape);
    setShowProjectPicker(false);
  };

  const isInsideShape = (x, y, w, h, sh) => {
    if (sh === 'rectangle' || sh === 'square') return true;
    if (sh === 'circle' || sh === 'oval') {
      const cx = (w - 1) / 2;
      const cy = (h - 1) / 2;
      const rx = w / 2;
      const ry = h / 2;
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      return (dx * dx + dy * dy) <= 1.0;
    }
    return true;
  };

  const extractPaletteFromRef = (img, k) => {
    const c = document.createElement('canvas');
    const size = 100;
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;
    const pixels = [];
    for (let i = 0; i < data.length; i += 4) {
      if (data[i+3] > 128) pixels.push([data[i], data[i+1], data[i+2]]);
    }
    const weighted = [];
    for (const p of pixels) {
      const sat = getSaturation(p[0], p[1], p[2]);
      const weight = 1 + Math.floor(sat * 4);
      for (let w = 0; w < weight; w++) weighted.push(p);
    }
    const sample = [];
    const sampleSize = Math.min(2000, weighted.length);
    for (let i = 0; i < sampleSize; i++) sample.push(weighted[Math.floor(Math.random() * weighted.length)]);
    return quantize(sample, k);
  };

  const smoothGrid = (grid, passes) => {
    if (passes === 0) return grid;
    const h = grid.length;
    const w = grid[0].length;
    let current = grid.map(r => [...r]);
    for (let pass = 0; pass < passes; pass++) {
      const next = current.map(r => [...r]);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const center = current[y][x];
          if (center === -2) continue;
          const counts = {};
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx, ny = y + dy;
              if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
              const v = current[ny][nx];
              if (v === -2) continue;
              counts[v] = (counts[v] || 0) + 1;
            }
          }
          let maxV = center, maxC = 0;
          for (const k in counts) { if (counts[k] > maxC) { maxC = counts[k]; maxV = +k; } }
          const centerCount = counts[center] || 0;
          if (maxV !== center && maxC >= 5 && centerCount <= 2) next[y][x] = maxV;
        }
      }
      current = next;
    }
    return current;
  };

  const processImage = useCallback(() => {
    if (!image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const upscale = edgeSharpness === 2 ? 1 : (edgeSharpness === 1 ? 2 : 4);
    const renderW = widthStitches * upscale;
    const renderH = heightStitches * upscale;
    canvas.width = renderW;
    canvas.height = renderH;

    const targetRatio = renderW / renderH;
    const imgRatio = image.width / image.height;
    let drawW, drawH, drawX, drawY;
    if (imgRatio > targetRatio) {
      drawW = renderW; drawH = renderW / imgRatio; drawX = 0; drawY = (renderH - drawH) / 2;
    } else {
      drawH = renderH; drawW = renderH * imgRatio; drawX = (renderW - drawW) / 2; drawY = 0;
    }

    // Apply design scale (% of full canvas) and offset
    const scale = designScale / 100;
    const scaledW = drawW * scale;
    const scaledH = drawH * scale;
    // Center, then apply X offset (Y offset omitted to keep belts/etc simple - usually vertically centered)
    const offsetXpx = (renderW - scaledW) * (designOffsetX / 100);
    drawX = drawX + (drawW - scaledW) / 2 + offsetXpx;
    drawY = drawY + (drawH - scaledH) / 2;
    drawW = scaledW;
    drawH = scaledH;

    if (useBg) { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, renderW, renderH); }
    else ctx.clearRect(0, 0, renderW, renderH);

    // In text mode, always disable smoothing for crisp edges
    ctx.imageSmoothingEnabled = inputMode === 'text' ? false : (edgeSharpness < 2);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, drawX, drawY, drawW, drawH);

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = widthStitches;
    finalCanvas.height = heightStitches;
    const fctx = finalCanvas.getContext('2d');

    if (edgeSharpness === 2 || upscale === 1 || inputMode === 'text') {
      // For text mode (and high-sharpness mode) the source canvas is already at
      // the right resolution — just draw with no smoothing to preserve exact pixels.
      fctx.imageSmoothingEnabled = false;
      fctx.drawImage(canvas, 0, 0, widthStitches, heightStitches);
    } else {
      const srcData = ctx.getImageData(0, 0, renderW, renderH).data;
      const finalImg = fctx.createImageData(widthStitches, heightStitches);
      for (let y = 0; y < heightStitches; y++) {
        for (let x = 0; x < widthStitches; x++) {
          let r = 0, g = 0, b = 0, a = 0, count = 0;
          for (let dy = 0; dy < upscale; dy++) {
            for (let dx = 0; dx < upscale; dx++) {
              const sx = x * upscale + dx, sy = y * upscale + dy;
              const si = (sy * renderW + sx) * 4;
              r += srcData[si]; g += srcData[si+1]; b += srcData[si+2]; a += srcData[si+3]; count++;
            }
          }
          const di = (y * widthStitches + x) * 4;
          finalImg.data[di] = r / count;
          finalImg.data[di+1] = g / count;
          finalImg.data[di+2] = b / count;
          finalImg.data[di+3] = a / count;
        }
      }
      fctx.putImageData(finalImg, 0, 0);
    }

    const imgData = fctx.getImageData(0, 0, widthStitches, heightStitches);
    const pixels = [];
    for (let i = 0; i < imgData.data.length; i += 4) {
      const a = imgData.data[i+3];
      if (a < 128 && !useBg) pixels.push(null);
      else pixels.push([imgData.data[i], imgData.data[i+1], imgData.data[i+2]]);
    }

    const validPixels = pixels.filter(p => p !== null);
    if (validPixels.length === 0) return;

    let pal;
    if (inputMode === 'text') {
      // PHRASE PILLOW MODE: we know exactly 3 colors. Don't run any quantization or
      // DMC voting — just use them directly. Optionally snap each to nearest DMC for thread reference.
      const phraseColors = [
        { hex: phraseBgColor, rgb: hexToRgb(phraseBgColor) },
        { hex: phraseTextColor, rgb: hexToRgb(phraseTextColor) },
        { hex: phraseBorderColor, rgb: hexToRgb(phraseBorderColor) },
      ];
      // Dedupe in case user picked same color for multiple roles
      const seen = new Set();
      const unique = phraseColors.filter(c => {
        if (seen.has(c.hex.toLowerCase())) return false;
        seen.add(c.hex.toLowerCase()); return true;
      });
      pal = unique.map(c => {
        if (useDMC) {
          // Find single nearest DMC for thread reference
          let best = DMC_COLORS[0], minD = Infinity;
          for (const d of DMC_COLORS) {
            const drgb = hexToRgb(d.hex);
            const dist = (c.rgb[0]-drgb[0])**2 + (c.rgb[1]-drgb[1])**2 + (c.rgb[2]-drgb[2])**2;
            if (dist < minD) { minD = dist; best = d; }
          }
          return { rgb: hexToRgb(best.hex), hex: best.hex, dmc: best.dmc, name: best.name, count: 0 };
        }
        return { rgb: c.rgb, hex: c.hex, dmc: null, name: null, count: 0 };
      });
    } else if (useDMC) {
      // DMC-FIRST APPROACH: snap each pixel to nearest DMC, count votes, pick top N
      // This avoids muddy-average colors from k-means snapping to wrong DMC threads.
      // Pre-cache DMC RGB values for speed
      const dmcRgb = DMC_COLORS.map(c => ({ ...c, rgb: hexToRgb(c.hex) }));
      const votes = new Map();
      for (const p of validPixels) {
        // Weight saturated pixels more heavily so vibrant colors don't get drowned out
        const sat = getSaturation(p[0], p[1], p[2]);
        const weight = 1 + Math.floor(sat * 4);
        // Find nearest DMC
        let minDist = Infinity, best = dmcRgb[0];
        for (const c of dmcRgb) {
          const d = (p[0]-c.rgb[0])**2 + (p[1]-c.rgb[1])**2 + (p[2]-c.rgb[2])**2;
          if (d < minDist) { minDist = d; best = c; }
        }
        votes.set(best.dmc, (votes.get(best.dmc) || 0) + weight);
      }
      // Sort DMCs by vote count and take top N
      const ranked = [...votes.entries()].sort((a, b) => b[1] - a[1]);
      const topDmcs = ranked.slice(0, numColors).map(([dmc]) => dmcRgb.find(c => c.dmc === dmc));
      pal = topDmcs.map(c => ({
        rgb: c.rgb, hex: c.hex, dmc: c.dmc, name: c.name, count: 0
      }));
    } else if (refImage) {
      const palRgb = extractPaletteFromRef(refImage, numColors);
      pal = palRgb.map(rgb => ({ rgb, hex: rgbToHex(rgb[0], rgb[1], rgb[2]), dmc: null, name: null, count: 0 }));
    } else {
      // Non-DMC mode: use saturation-weighted k-means as before
      const weighted = [];
      for (const p of validPixels) {
        const sat = getSaturation(p[0], p[1], p[2]);
        const weight = 1 + Math.floor(sat * 3);
        for (let w = 0; w < weight; w++) weighted.push(p);
      }
      const sampleSize = Math.min(2500, weighted.length);
      const sample = [];
      for (let i = 0; i < sampleSize; i++) sample.push(weighted[Math.floor(Math.random() * weighted.length)]);
      const palRgb = quantize(sample, numColors);
      pal = palRgb.map(rgb => ({ rgb, hex: rgbToHex(rgb[0], rgb[1], rgb[2]), dmc: null, name: null, count: 0 }));
    }

    let grid = [];
    for (let y = 0; y < heightStitches; y++) {
      const row = [];
      for (let x = 0; x < widthStitches; x++) {
        if (!isInsideShape(x, y, widthStitches, heightStitches, shape)) { row.push(-2); continue; }
        const p = pixels[y * widthStitches + x];
        if (p === null) row.push(-1);
        else row.push(closestColor(p, pal.map(pi => pi.rgb)));
      }
      grid.push(row);
    }
    grid = smoothGrid(grid, smoothing);

    setGridData(grid);
    setHistory([]);
    setPalette(pal.map((p, i) => ({ ...p, count: grid.flat().filter(v => v === i).length })));
  }, [image, widthStitches, heightStitches, numColors, useBg, bgColor, refImage, smoothing, edgeSharpness, shape, useDMC, designScale, designOffsetX, inputMode, phraseTextColor, phraseBgColor, phraseBorderColor]);

  useEffect(() => {
    if (image) processImage();
  }, [image, widthStitches, heightStitches, numColors, useBg, bgColor, refImage, smoothing, edgeSharpness, shape, useDMC, designScale, designOffsetX, inputMode, phraseTextColor, phraseBgColor, phraseBorderColor, processImage]);

  // Count stitches with no same-color neighbor on any of the 4 sides —
  // these are visually "scattered" loners that almost always look like
  // noise rather than intentional detail in a finished piece.
  const isolatedStitchCount = (() => {
    if (!gridData) return 0;
    let count = 0;
    const h = gridData.length;
    const w = gridData[0]?.length || 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = gridData[y][x];
        if (v < 0) continue;
        const up = y > 0 ? gridData[y-1][x] : -3;
        const down = y < h - 1 ? gridData[y+1][x] : -3;
        const left = x > 0 ? gridData[y][x-1] : -3;
        const right = x < w - 1 ? gridData[y][x+1] : -3;
        if (up !== v && down !== v && left !== v && right !== v) count++;
      }
    }
    return count;
  })();

  // Stitch preview: render each cell as a small X (the way the finished
  // piece will actually look stitched). Runs when in Preview mode and the
  // canvas is mounted. Single canvas = fast even at 14k+ cells.
  useEffect(() => {
    if (viewMode !== 'preview' || editMode) return;
    if (!gridData || !palette || palette.length === 0) return;
    const cv = stitchPreviewRef.current;
    if (!cv) return;
    const h = gridData.length;
    const w = gridData[0]?.length || 0;
    // Render at 2× the display pixels for crispness on retina.
    const DPI = 2;
    cv.width = w * cellSize * DPI;
    cv.height = h * cellSize * DPI;
    cv.style.width = (w * cellSize) + 'px';
    cv.style.height = (h * cellSize) + 'px';
    const ctx = cv.getContext('2d');
    ctx.scale(DPI, DPI);
    // Faint canvas background — like the unstitched mesh peeking through.
    ctx.fillStyle = '#FAF5F2';
    ctx.fillRect(0, 0, w * cellSize, h * cellSize);
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(1, cellSize * 0.38);
    const pad = Math.max(0.5, cellSize * 0.14);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = gridData[y][x];
        if (v < 0) continue;
        const c = palette[v]?.hex;
        if (!c) continue;
        const cx = x * cellSize;
        const cy = y * cellSize;
        ctx.strokeStyle = c;
        ctx.beginPath();
        ctx.moveTo(cx + pad, cy + pad);
        ctx.lineTo(cx + cellSize - pad, cy + cellSize - pad);
        ctx.moveTo(cx + cellSize - pad, cy + pad);
        ctx.lineTo(cx + pad, cy + cellSize - pad);
        ctx.stroke();
      }
    }
  }, [viewMode, editMode, gridData, palette, cellSize]);

  const recountPalette = (grid) => {
    setPalette(prev => prev.map((p, i) => ({ ...p, count: grid.flat().filter(v => v === i).length })));
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => { const img = new Image(); img.onload = () => setImage(img); img.src = ev.target.result; };
    reader.readAsDataURL(file);
  };

  const handleRefUpload = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setRefImageName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => { const img = new Image(); img.onload = () => setRefImage(img); img.src = ev.target.result; };
    reader.readAsDataURL(file);
  };

  const clearRef = () => {
    setRefImage(null); setRefImageName('');
    if (refFileInputRef.current) refFileInputRef.current.value = '';
  };

  const reset = () => {
    setImage(null); setImageName(''); setGridData(null);
    setPalette([]); setHistory([]); setEditMode(false); setShowTrace(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const paintCell = (x, y, value) => {
    setGridData(prev => {
      if (!prev || !prev[y] || prev[y][x] === undefined) return prev;
      if (prev[y][x] === value || prev[y][x] === -2) return prev;
      const next = prev.map(row => [...row]);
      next[y][x] = value;
      recountPalette(next);
      return next;
    });
  };

  const pushHistory = () => {
    if (!gridData) return;
    setHistory(prev => [...prev.slice(-29), gridData.map(r => [...r])]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setGridData(last); recountPalette(last);
    setHistory(prev => prev.slice(0, -1));
  };

  const cleanupNow = () => {
    if (!gridData) return;
    pushHistory();
    const cleaned = smoothGrid(gridData, 1);
    setGridData(cleaned); recountPalette(cleaned);
  };

  const handleCellAction = (x, y) => {
    if (!editMode) return;
    const val = drawAction === 'erase' ? -1 : selectedColorIdx;
    paintCell(x, y, val);
  };

  const getCellFromPoint = (clientX, clientY) => {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    const cell = el.closest('[data-cell]');
    if (!cell) return null;
    const x = parseInt(cell.dataset.x, 10);
    const y = parseInt(cell.dataset.y, 10);
    if (isNaN(x) || isNaN(y)) return null;
    return { x, y };
  };

  const onPointerDown = (e) => {
    if (!editMode) return;
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    const cell = getCellFromPoint(touch.clientX, touch.clientY);
    if (!cell) return;
    pushHistory();
    isDrawingRef.current = true;
    handleCellAction(cell.x, cell.y);
  };

  const onPointerMove = (e) => {
    if (!editMode || !isDrawingRef.current) return;
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    const cell = getCellFromPoint(touch.clientX, touch.clientY);
    if (!cell) return;
    handleCellAction(cell.x, cell.y);
  };

  const onPointerUp = () => { isDrawingRef.current = false; };

  useEffect(() => {
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchend', onPointerUp);
    window.addEventListener('touchcancel', onPointerUp);
    return () => {
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchend', onPointerUp);
      window.removeEventListener('touchcancel', onPointerUp);
    };
  }, []);

  // Wait for the web fonts (Cinzel, Playfair, etc.) to load before declaring
  // them ready. document.fonts.ready resolves after every @font-face in the
  // page is loaded, so this is one promise for the whole batch.
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) {
      setFontsReady(true);
      return;
    }
    let cancelled = false;
    document.fonts.ready.then(() => { if (!cancelled) setFontsReady(true); });
    return () => { cancelled = true; };
  }, []);

  // Text mode: render the phrase directly into the grid data, skipping the
  // image-processing pipeline entirely. Each letter's bitmap maps stitch-by-stitch
  // to grid cells — no canvas, no smoothing, no downsample. This is the fix
  // for the fractured-letter bug.
  useEffect(() => {
    if (inputMode !== 'text') return;
    // Make sure no stale image is feeding the image pipeline.
    setImage(null);
    if (!phraseText.trim()) {
      setGridData(null);
      setPalette([]);
      return;
    }
    const { grid, palette: newPalette } = renderPhraseToGrid({
      text: phraseText,
      fontKey: phraseFont,
      widthStitches,
      heightStitches,
      textColor: phraseTextColor,
      bgColor: phraseBgColor,
      borderStyle: phraseBorderStyle,
      borderColor: phraseBorderColor,
      borderAccentColor: phraseBorderAccentColor,
      useDMC,
    });
    setGridData(grid);
    setPalette(newPalette);
    setHistory([]);
    setImageName(`Phrase: ${phraseText.split('\n')[0].slice(0, 20)}`);
  }, [inputMode, phraseText, phraseFont, phraseTextColor, phraseBgColor, phraseBorderStyle, phraseBorderColor, phraseBorderAccentColor, widthStitches, heightStitches, useDMC, fontsReady]);

  // Track grid container width so Fit zoom can adapt to viewport. We measure
  // the .grid-scroll element's content box (the area inside its padding) via
  // ResizeObserver — that's the only number that lines up with the grid that
  // actually renders inside. Falls back to a viewport-based estimate when
  // either the ref isn't mounted yet or the browser lacks ResizeObserver.
  useEffect(() => {
    const fallbackFromViewport = () => {
      const vw = window.innerWidth;
      // Mobile: single-column layout, only card padding eats space.
      // Desktop: sidebar (340) + gap + card + scroll padding ≈ 500.
      return vw < 768 ? Math.max(200, vw - 80) : Math.max(300, vw - 500);
    };
    const updateFromRef = () => {
      const el = gridScrollRef.current;
      if (!el) {
        setContainerWidth(fallbackFromViewport());
        return;
      }
      // clientWidth includes padding; the grid renders inside the padding,
      // so subtract paddingLeft + paddingRight from computed styles.
      const cs = window.getComputedStyle(el);
      const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      const w = el.clientWidth - padX;
      if (w > 50) setContainerWidth(w);
      else setContainerWidth(fallbackFromViewport());
    };

    updateFromRef();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateFromRef) : null;
    if (ro && gridScrollRef.current) ro.observe(gridScrollRef.current);
    window.addEventListener('resize', updateFromRef);
    window.addEventListener('orientationchange', updateFromRef);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateFromRef);
      window.removeEventListener('orientationchange', updateFromRef);
    };
  }, [image, gridData]);

  const pickDmcForColor = (idx, dmcColor) => {
    setPalette(prev => prev.map((p, i) => i === idx ? {
      ...p, rgb: hexToRgb(dmcColor.hex), hex: dmcColor.hex, dmc: dmcColor.dmc, name: dmcColor.name,
    } : p));
    setEditingColorIdx(null);
    setDmcSearch('');
  };

  const addPaletteColor = () => {
    if (palette.length >= 20) return;
    const def = DMC_COLORS.find(c => c.dmc === '321') || DMC_COLORS[0];
    setPalette(prev => [...prev, { rgb: hexToRgb(def.hex), hex: def.hex, dmc: def.dmc, name: def.name, count: 0 }]);
  };

  // ============ EXPORT FUNCTIONS ============

  // Helper: draw the stitch grid onto any canvas context at a given scale
  const drawGridToContext = (c, gridD, pal, scale, offsetX, offsetY, opts = {}) => {
    const { useSymbols = false, bw = false, showGuides10 = true, drawShapeOutline = false, sh = 'rectangle' } = opts;
    const w = gridD[0].length;
    const h = gridD.length;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = gridD[y][x];
        if (v === -2) {
          c.fillStyle = '#f0f0f0';
          c.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
        } else if (v === -1) {
          c.fillStyle = bw ? '#ffffff' : '#fffafd';
          c.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
        } else {
          c.fillStyle = bw ? '#ffffff' : pal[v].hex;
          c.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
          if (useSymbols && scale >= 10) {
            c.fillStyle = bw ? '#000' : ((0.299*pal[v].rgb[0] + 0.587*pal[v].rgb[1] + 0.114*pal[v].rgb[2]) < 128 ? '#fff' : '#000');
            c.font = `bold ${Math.floor(scale * 0.7)}px Georgia`;
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText(SYMBOLS[v % SYMBOLS.length], offsetX + x * scale + scale/2, offsetY + y * scale + scale/2);
            c.textAlign = 'start';
            c.textBaseline = 'alphabetic';
          }
        }
      }
    }
    // grid lines
    c.strokeStyle = '#888'; c.lineWidth = 0.5;
    for (let x = 0; x <= w; x++) {
      c.beginPath(); c.moveTo(offsetX + x * scale, offsetY); c.lineTo(offsetX + x * scale, offsetY + h * scale); c.stroke();
    }
    for (let y = 0; y <= h; y++) {
      c.beginPath(); c.moveTo(offsetX, offsetY + y * scale); c.lineTo(offsetX + w * scale, offsetY + y * scale); c.stroke();
    }
    if (showGuides10) {
      c.strokeStyle = '#000'; c.lineWidth = 2;
      for (let x = 0; x <= w; x += 10) {
        c.beginPath(); c.moveTo(offsetX + x * scale, offsetY); c.lineTo(offsetX + x * scale, offsetY + h * scale); c.stroke();
      }
      for (let y = 0; y <= h; y += 10) {
        c.beginPath(); c.moveTo(offsetX, offsetY + y * scale); c.lineTo(offsetX + w * scale, offsetY + y * scale); c.stroke();
      }
    }
    // Center crosshair
    c.strokeStyle = '#EC4899'; c.lineWidth = 3;
    const cx = offsetX + (w / 2) * scale;
    const cy = offsetY + (h / 2) * scale;
    c.beginPath(); c.moveTo(cx - 12, cy); c.lineTo(cx + 12, cy); c.stroke();
    c.beginPath(); c.moveTo(cx, cy - 12); c.lineTo(cx, cy + 12); c.stroke();
    // Shape outline
    if (drawShapeOutline && (sh === 'circle' || sh === 'oval')) {
      c.strokeStyle = '#EC4899'; c.lineWidth = 3; c.setLineDash([8, 4]);
      c.beginPath();
      c.ellipse(offsetX + (w * scale) / 2, offsetY + (h * scale) / 2, (w * scale) / 2, (h * scale) / 2, 0, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
    }
  };

  // EXPORT: Pattern preview (the simple PNG, what we had before)
  const exportPreviewPNG = () => {
    if (!gridData) return;
    const scale = Math.max(15, Math.min(30, 800 / widthStitches));
    const padding = 60;
    const legendH = 50 + Math.ceil(palette.length / 2) * 32;
    const cv = document.createElement('canvas');
    cv.width = widthStitches * scale + padding * 2;
    cv.height = heightStitches * scale + padding * 2 + legendH;
    const c = cv.getContext('2d');
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = '#5B1735'; c.font = 'bold 22px Georgia';
    const proj = PROJECTS[projectKey];
    const title = patternName || `${proj.name} Pattern`;
    c.fillText(`${title} — ${widthStitches} × ${heightStitches} stitches`, padding, 35);
    c.font = '14px Georgia'; c.fillStyle = '#831843';
    c.fillText(`${widthIn.toFixed(2)}" × ${heightIn.toFixed(2)}" · ${mesh} mesh`, padding, 56);

    drawGridToContext(c, gridData, palette, scale, padding, padding + 30, {
      useSymbols: false, bw: false, showGuides10: true,
      drawShapeOutline: true, sh: shape,
    });

    const legendY = padding + 30 + heightStitches * scale + 30;
    c.fillStyle = '#5B1735'; c.font = 'bold 16px Georgia';
    c.fillText('DMC Floss Colors', padding, legendY);
    palette.forEach((p, i) => {
      const col = i % 2; const row = Math.floor(i / 2);
      const xPos = padding + col * 380; const y = legendY + 20 + row * 32;
      c.fillStyle = p.hex; c.fillRect(xPos, y, 28, 28);
      c.strokeStyle = '#5B1735'; c.lineWidth = 1; c.strokeRect(xPos, y, 28, 28);
      c.fillStyle = '#5B1735'; c.font = 'bold 13px Georgia';
      const label = p.dmc ? `${i + 1}. DMC ${p.dmc} — ${p.name}` : `${i + 1}. ${p.hex.toUpperCase()}`;
      c.fillText(label, xPos + 38, y + 14);
      c.font = '11px Georgia'; c.fillStyle = '#831843';
      c.fillText(`${p.count} stitches`, xPos + 38, y + 27);
    });
    if (shopName) {
      c.fillStyle = '#A855F7'; c.font = 'italic 12px Georgia';
      c.fillText(`© ${shopName}`, padding, cv.height - 12);
    }
    setExportStatus('working');
    setExportProgress('Saving preview...');
    setExportedImages([]);
    const filename = `${(patternName || proj.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-preview.png`;
    canvasToImage(cv, filename).then(img => {
      if (img) setExportedImages([img]);
    });
    downloadCanvas(cv, filename).then(ok => {
      setExportStatus('done');
      setExportProgress('Done! Scroll down to view & save below.');
    });
  };

  // EXPORT: Multi-page printable pattern bundle (PNGs)
  // Generates: 1) Cover/Info page, 2) Color chart, 3) B&W symbol chart, 4) DMC thread list
  const exportPatternBundle = async () => {
    if (!gridData) return;
    setExportStatus('working');
    setExportProgress('Generating cover page...');
    setExportedImages([]);
    const images = [];
    try {
    const proj = PROJECTS[projectKey];
    const title = patternName || `${proj.name} Pattern`;
    // US Letter at 150dpi = 1275 x 1650
    const PAGE_W = 1275;
    const PAGE_H = 1650;
    const margin = 80;

    // ============ PAGE 1: COVER / INFO ============
    const page1 = document.createElement('canvas');
    page1.width = PAGE_W; page1.height = PAGE_H;
    const c1 = page1.getContext('2d');
    // Pretty background
    // White page bg so users don't burn ink/toner on full-bleed color.
    c1.fillStyle = '#ffffff'; c1.fillRect(0, 0, PAGE_W, PAGE_H);
    // Title
    c1.fillStyle = '#5B1735'; c1.font = 'bold 64px Georgia';
    c1.textAlign = 'center';
    c1.fillText(title, PAGE_W / 2, 200);
    c1.font = 'italic 28px Georgia'; c1.fillStyle = '#A855F7';
    c1.fillText(`✨ Needlepoint Pattern ✨`, PAGE_W / 2, 250);
    if (shopName) {
      c1.font = '20px Georgia'; c1.fillStyle = '#831843';
      c1.fillText(`by ${shopName}`, PAGE_W / 2, 290);
    }
    // Preview of design (color, no symbols)
    const previewScale = Math.min(
      (PAGE_W - margin * 2) / widthStitches,
      600 / heightStitches
    );
    const previewW = widthStitches * previewScale;
    const previewH = heightStitches * previewScale;
    const previewX = (PAGE_W - previewW) / 2;
    const previewY = 360;
    drawGridToContext(c1, gridData, palette, previewScale, previewX, previewY, {
      useSymbols: false, bw: false, showGuides10: false,
      drawShapeOutline: true, sh: shape,
    });

    // Info box
    c1.textAlign = 'left';
    const infoY = previewY + previewH + 80;
    c1.fillStyle = '#fff'; c1.strokeStyle = '#5B1735'; c1.lineWidth = 3;
    c1.fillRect(margin, infoY, PAGE_W - margin * 2, 360);
    c1.strokeRect(margin, infoY, PAGE_W - margin * 2, 360);
    c1.fillStyle = '#5B1735'; c1.font = 'bold 24px Georgia';
    c1.fillText('📋 Pattern Details', margin + 30, infoY + 45);

    c1.font = '20px Georgia';
    const details = [
      `Finished Size:  ${widthIn.toFixed(2)}" × ${heightIn.toFixed(2)}"`,
      `Stitch Count:  ${widthStitches} × ${heightStitches} stitches`,
      `Canvas:  ${mesh} mesh`,
      proj.usesStretcherBars
        ? `Stretcher Bars:  ${stretcherBars.barW}" × ${stretcherBars.barH}" (2 pairs, ${stretcherBars.isMini ? 'mini ½" OK' : 'regular ¾"–1"'})`
        : `Mounting:  ${proj.name} blank (no stretcher bars needed)`,
      `Shape:  ${shape}`,
      `Total Stitches:  ${palette.reduce((s, p) => s + p.count, 0).toLocaleString()}`,
      `Colors:  ${palette.length} DMC floss colors`,
    ];
    details.forEach((line, i) => {
      c1.fillText(line, margin + 30, infoY + 90 + i * 36);
    });

    // Footer
    c1.fillStyle = '#831843'; c1.font = 'italic 16px Georgia';
    c1.textAlign = 'center';
    c1.fillText('💖 For personal use only · Do not redistribute 💖', PAGE_W / 2, PAGE_H - 60);
    if (shopName) {
      c1.fillText(`© ${shopName} · All rights reserved`, PAGE_W / 2, PAGE_H - 35);
    }

    const fname1 = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-1-cover.png`;
    images.push(await canvasToImage(page1, fname1));
    setExportedImages([...images]);
    await downloadCanvas(page1, fname1);
    await new Promise(r => setTimeout(r, 400));
    setExportProgress('Generating color chart...');

    // ============ PAGE 2: COLOR CHART ============
    const page2 = document.createElement('canvas');
    page2.width = PAGE_W; page2.height = PAGE_H;
    const c2 = page2.getContext('2d');
    c2.fillStyle = '#ffffff'; c2.fillRect(0, 0, PAGE_W, PAGE_H);
    c2.fillStyle = '#5B1735'; c2.font = 'bold 36px Georgia';
    c2.textAlign = 'center';
    c2.fillText('Color Chart', PAGE_W / 2, 60);
    c2.font = '16px Georgia'; c2.fillStyle = '#831843';
    c2.fillText(`${title} · ${widthStitches} × ${heightStitches} stitches · ${mesh} mesh`, PAGE_W / 2, 90);

    const chartScale2 = Math.min(
      (PAGE_W - margin * 2) / widthStitches,
      (PAGE_H - 200) / heightStitches
    );
    const chartW2 = widthStitches * chartScale2;
    const chartH2 = heightStitches * chartScale2;
    const chartX2 = (PAGE_W - chartW2) / 2;
    const chartY2 = 130;
    drawGridToContext(c2, gridData, palette, chartScale2, chartX2, chartY2, {
      useSymbols: false, bw: false, showGuides10: true,
      drawShapeOutline: true, sh: shape,
    });
    c2.textAlign = 'center'; c2.fillStyle = '#831843'; c2.font = 'italic 14px Georgia';
    c2.fillText(`Bold lines every 10 stitches · Pink crosshair marks center`, PAGE_W / 2, chartY2 + chartH2 + 35);
    if (shopName) {
      c2.fillText(`© ${shopName}`, PAGE_W / 2, PAGE_H - 30);
    }
    const fname2 = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-2-color-chart.png`;
    images.push(await canvasToImage(page2, fname2));
    setExportedImages([...images]);
    await downloadCanvas(page2, fname2);
    await new Promise(r => setTimeout(r, 400));
    setExportProgress('Generating symbol chart...');

    // ============ PAGE 3: B&W SYMBOL CHART ============
    const page3 = document.createElement('canvas');
    page3.width = PAGE_W; page3.height = PAGE_H;
    const c3 = page3.getContext('2d');
    c3.fillStyle = '#ffffff'; c3.fillRect(0, 0, PAGE_W, PAGE_H);
    c3.fillStyle = '#000'; c3.font = 'bold 36px Georgia';
    c3.textAlign = 'center';
    c3.fillText('Symbol Chart (B&W)', PAGE_W / 2, 60);
    c3.font = '16px Georgia';
    c3.fillText(`${title} · Prints clearly in black & white`, PAGE_W / 2, 90);

    drawGridToContext(c3, gridData, palette, chartScale2, chartX2, chartY2, {
      useSymbols: true, bw: true, showGuides10: true,
      drawShapeOutline: true, sh: shape,
    });
    c3.textAlign = 'center'; c3.fillStyle = '#555'; c3.font = 'italic 14px Georgia';
    c3.fillText(`Each symbol corresponds to a DMC color — see thread list`, PAGE_W / 2, chartY2 + chartH2 + 35);
    if (shopName) {
      c3.fillText(`© ${shopName}`, PAGE_W / 2, PAGE_H - 30);
    }
    const fname3 = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-3-symbol-chart.png`;
    images.push(await canvasToImage(page3, fname3));
    setExportedImages([...images]);
    await downloadCanvas(page3, fname3);
    await new Promise(r => setTimeout(r, 400));
    setExportProgress('Generating thread list...');

    // ============ PAGE 4: THREAD LIST ============
    const page4 = document.createElement('canvas');
    page4.width = PAGE_W; page4.height = PAGE_H;
    const c4 = page4.getContext('2d');
    // White page bg — see cover page note about ink/toner.
    c4.fillStyle = '#ffffff'; c4.fillRect(0, 0, PAGE_W, PAGE_H);
    c4.fillStyle = '#5B1735'; c4.font = 'bold 40px Georgia';
    c4.textAlign = 'center';
    c4.fillText('🧵 Thread List', PAGE_W / 2, 70);
    c4.font = '18px Georgia'; c4.fillStyle = '#831843';
    c4.fillText(`${palette.length} DMC floss colors · ${palette.reduce((s, p) => s + p.count, 0).toLocaleString()} total stitches`, PAGE_W / 2, 105);

    // Table
    const tableX = margin;
    const tableY = 160;
    const rowH = 56;
    const colWidths = [80, 140, 380, 180, 150]; // Symbol, DMC#, Name, Hex, Stitches
    const headers = ['Symbol', 'DMC #', 'Color Name', 'Hex', 'Stitches'];
    c4.textAlign = 'left';
    c4.fillStyle = '#5B1735'; c4.font = 'bold 18px Georgia';
    let xPos = tableX;
    headers.forEach((h, i) => {
      c4.fillText(h, xPos + 10, tableY);
      xPos += colWidths[i];
    });
    c4.strokeStyle = '#5B1735'; c4.lineWidth = 2;
    c4.beginPath(); c4.moveTo(tableX, tableY + 10); c4.lineTo(tableX + colWidths.reduce((a, b) => a + b, 0), tableY + 10); c4.stroke();

    c4.font = '17px Georgia';
    palette.forEach((p, i) => {
      const yy = tableY + 30 + i * rowH;
      if (yy > PAGE_H - 60) return; // overflow protection
      // alternating row bg
      if (i % 2 === 0) {
        // Subtle gray zebra stripe (was rgba-white over gradient; invisible on
        // a pure white bg, so use a faint gray instead — barely any ink).
        c4.fillStyle = 'rgba(0, 0, 0, 0.04)';
        c4.fillRect(tableX, yy - 22, colWidths.reduce((a, b) => a + b, 0), rowH - 4);
      }
      let x = tableX;
      // Symbol
      c4.fillStyle = '#000'; c4.font = 'bold 28px Georgia'; c4.textAlign = 'center';
      c4.fillText(SYMBOLS[i % SYMBOLS.length], x + colWidths[0] / 2, yy + 5);
      x += colWidths[0];
      c4.textAlign = 'left'; c4.font = 'bold 17px Georgia'; c4.fillStyle = '#5B1735';
      // DMC #
      c4.fillText(p.dmc || '—', x + 10, yy + 4);
      x += colWidths[1];
      // Name
      c4.font = '16px Georgia';
      c4.fillText(p.name || 'Custom color', x + 10, yy + 4);
      x += colWidths[2];
      // Hex swatch + code
      c4.fillStyle = p.hex; c4.fillRect(x + 10, yy - 16, 32, 32);
      c4.strokeStyle = '#5B1735'; c4.lineWidth = 1; c4.strokeRect(x + 10, yy - 16, 32, 32);
      c4.fillStyle = '#5B1735'; c4.font = '15px Georgia';
      c4.fillText(p.hex.toUpperCase(), x + 50, yy + 4);
      x += colWidths[3];
      // Stitches
      c4.fillStyle = '#831843'; c4.font = 'bold 17px Georgia';
      c4.fillText(p.count.toLocaleString(), x + 10, yy + 4);
    });

    c4.textAlign = 'center'; c4.fillStyle = '#831843'; c4.font = 'italic 14px Georgia';
    c4.fillText('💕 Buy DMC floss by number at any craft store · 1 skein covers ~150-200 stitches on 18 mesh 💕', PAGE_W / 2, PAGE_H - 50);
    if (shopName) {
      c4.fillText(`© ${shopName}`, PAGE_W / 2, PAGE_H - 25);
    }
    const fname4 = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-4-thread-list.png`;
    images.push(await canvasToImage(page4, fname4));
    setExportedImages([...images]);
    await downloadCanvas(page4, fname4);

    setExportStatus('done');
    setExportProgress('Done! Scroll down to view & save each page below.');
    } catch (err) {
      console.error('Export error:', err);
      setExportStatus('error');
      setExportProgress('Something went wrong. Try the Quick Preview PNG instead.');
      setTimeout(() => setExportStatus(null), 4000);
    }
  };

  // Returns a data URL for the canvas (no download attempt - we display inline so user can long-press save)
  const canvasToImage = (canvas, filename) => {
    return new Promise((resolve) => {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        resolve({ name: filename, dataUrl });
      } catch (e) {
        resolve(null);
      }
    });
  };

  // Try to trigger a download AND keep the data URL for inline display fallback
  const downloadCanvas = (canvas, filename) => {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) { resolve(false); return; }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          resolve(true);
        }, 100);
      }, 'image/png');
    });
  };

  // Cell sizing — Fit mode adapts to container width; numeric zoom is a multiplier
  const proj = PROJECTS[projectKey];
  // For projects using stretcher bars, account for the canvas margin in fit calculation
  const previewMarginWInFit = (proj.usesStretcherBars && showCanvas) ? (stretcherBars.barW - widthIn) / 2 : 0;
  const fitMarginStitches = Math.max(0, Math.round(previewMarginWInFit * mesh)) * 2;
  const totalCellsAcross = widthStitches + fitMarginStitches;

  let cellSize;
  if (zoomLevel === 'fit') {
    const liveVw = typeof window !== 'undefined' ? window.innerWidth : 400;
    const liveVh = typeof window !== 'undefined' ? window.innerHeight : 700;
    const isMobile = liveVw < 768;
    // Use the measured container width directly. The mobile fallback math
    // (vw - 96) was over-aggressive and could overshoot the actual scroll area,
    // forcing a horizontal scrollbar that didn't match what Fit promised.
    const effectiveWidth = containerWidth;
    // Available height: cap at a reasonable portion of viewport so the design
    // doesn't dominate the screen vertically when it's a tall/square piece.
    const maxHeight = Math.max(280, Math.min(liveVh * 0.6, 700));
    const totalCellsDown = heightStitches + (proj.usesStretcherBars && showCanvas ? fitMarginStitches : 0);
    const widthFit = Math.floor(effectiveWidth / totalCellsAcross);
    const heightFit = Math.floor(maxHeight / totalCellsDown);
    // Floor: 2px on mobile lets wide designs actually fit on iPhone; 3px on
    // desktop keeps cells readable at a glance. Below 1 would be invisible.
    const minCell = isMobile ? 2 : 3;
    cellSize = Math.max(minCell, Math.min(widthFit, heightFit));
    // Safety clamp: if even the floor is too big for the viewport, drop to 1.
    if (cellSize * totalCellsAcross > effectiveWidth && widthFit >= 1) {
      cellSize = widthFit;
    }
  } else {
    const totalCells = widthStitches * heightStitches;
    const baseSize = totalCells > 4000 ? 8 : totalCells > 2000 ? 12 : totalCells > 800 ? 16 : 22;
    cellSize = baseSize * zoomLevel;
  }

  const filteredDMC = DMC_COLORS.filter(c => {
    if (!dmcSearch) return true;
    const q = dmcSearch.toLowerCase();
    return c.dmc.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
  });

  // Calculate canvas display dimensions for preview-with-margin
  // Preview margin: half the diff between stretcher bar size and design size on each side
  const previewMarginWIn = (stretcherBars.barW - widthIn) / 2;
  const previewMarginHIn = (stretcherBars.barH - heightIn) / 2;
  const previewPaddingW = Math.max(0, Math.round(previewMarginWIn * mesh)) * cellSize;
  const previewPaddingH = Math.max(0, Math.round(previewMarginHIn * mesh)) * cellSize;
  const totalPreviewW = widthStitches + previewPaddingW * 2;
  const totalPreviewH = heightStitches + previewPaddingH * 2;

  // Small (i) tooltip — click to toggle. Mobile-friendly (no hover required).
  const InfoTip = ({ text }) => {
    const [open, setOpen] = useState(false);
    return (
      <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 6 }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
          style={{
            width: 17, height: 17, borderRadius: '50%',
            border: '1.5px solid #831843', background: 'white',
            color: '#831843', fontSize: 11, fontWeight: 800,
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            cursor: 'pointer', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            padding: 0, flexShrink: 0, lineHeight: 1,
          }}
          aria-label="More info"
        >i</button>
        {open && (
          <>
            <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
            <span style={{
              position: 'absolute', top: 24, left: -8, zIndex: 999,
              background: '#5B1735', color: 'white',
              padding: '10px 14px', borderRadius: 12,
              fontSize: 12, fontWeight: 500, lineHeight: 1.45,
              width: 240, boxShadow: '0 12px 30px rgba(91,23,53,0.3)',
              fontFamily: 'Nunito, sans-serif', letterSpacing: 0, textTransform: 'none',
            }}>
              {text}
            </span>
          </>
        )}
      </span>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      // Brand kit hero gradient: pink → violet → lavender, with sun/heart accent washes.
      background: `
        radial-gradient(circle at 10% 20%, #FF1A8C 0%, transparent 42%),
        radial-gradient(circle at 90% 10%, #A855F7 0%, transparent 42%),
        radial-gradient(circle at 50% 85%, #FCD34D 0%, transparent 35%),
        linear-gradient(135deg, #EC4899 0%, #C56BE0 50%, #A855F7 100%)
      `,
      backgroundAttachment: 'fixed',
      fontFamily: '"Nunito", system-ui, sans-serif',
      padding: '16px 8px',
      color: '#5B1735',
      position: 'relative',
      overflowX: 'hidden',
      overflowY: 'auto',
    }}>
      <style>{`
        /* Fonts loaded via <link> in index.html for parallel fetching — no
           inline @import here to avoid blocking first paint while waiting
           for the React bundle to mount and inject this <style>. */
        body { margin: 0; }
        * { -webkit-tap-highlight-color: transparent; }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        .display-font { font-family: 'Pacifico', cursive; }
        .body-font { font-family: 'Nunito', sans-serif; }
        .mono-font { font-family: 'Nunito', monospace; font-weight: 500; }
        .sparkle-bg {
          position: absolute; pointer-events: none; font-size: 24px;
          animation: sparkle 3s infinite;
        }
        input[type="range"] {
          -webkit-appearance: none; width: 100%; height: 8px;
          background: linear-gradient(90deg, #ff6ec4 0%, #ffd93d 50%, #4adfe8 100%);
          border-radius: 10px; outline: none;
          box-shadow: 0 2px 8px rgba(255, 110, 196, 0.4);
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 26px; height: 26px;
          background: linear-gradient(135deg, #ff6ec4, #A855F7);
          border-radius: 50%; cursor: pointer; border: 3px solid #fff;
          box-shadow: 0 0 15px rgba(255, 110, 196, 0.8), 0 0 4px #fff inset;
        }
        input[type="range"]::-moz-range-thumb {
          width: 26px; height: 26px;
          background: linear-gradient(135deg, #ff6ec4, #A855F7);
          border-radius: 50%; cursor: pointer; border: 3px solid #fff;
          box-shadow: 0 0 15px rgba(255, 110, 196, 0.8);
        }
        .btn {
          padding: 10px 16px; border: 2.5px solid #5B1735; background: #fff;
          color: #5B1735; font-family: 'Nunito', sans-serif;
          font-size: 12px; font-weight: 600; letter-spacing: 0.04em;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: inline-flex; align-items: center; gap: 6px;
          border-radius: 999px; box-shadow: 3px 3px 0 #5B1735;
        }
        .btn:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 #5B1735; }
        .btn:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 #5B1735; }
        .btn.active { background: linear-gradient(135deg, #ff6ec4, #A855F7); color: #fff; }
        .btn-primary {
          background: linear-gradient(135deg, #EC4899, #ff6ec4, #A855F7);
          background-size: 200% 200%; color: #fff; font-weight: 700;
          animation: shimmer 3s linear infinite;
        }
        .btn-sm { padding: 7px 12px; font-size: 10px; font-weight: 600; }
        .btn-icon {
          padding: 8px; border: 2.5px solid #5B1735; background: #fff;
          border-radius: 50%; cursor: pointer; box-shadow: 2px 2px 0 #5B1735;
          display: inline-flex; align-items: center; justify-content: center;
          color: #5B1735;
        }
        .btn-icon:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 #5B1735; }
        .card {
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          border: 3px solid #5B1735; padding: 18px; border-radius: 24px;
          box-shadow: 5px 5px 0 #5B1735, 0 0 40px rgba(255, 110, 196, 0.3);
          position: relative;
        }
        .section-label {
          font-family: 'Nunito', sans-serif; font-size: 12px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          background: linear-gradient(90deg, #EC4899, #A855F7);
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          display: flex; align-items: center; gap: 6px; margin-bottom: 12px;
        }
        .palette-swatch {
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .palette-swatch:active { transform: scale(0.95); }
        .palette-swatch.selected {
          outline: 3px solid #EC4899; outline-offset: 3px;
          box-shadow: 0 0 20px rgba(255, 20, 147, 0.5);
        }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(26, 0, 51, 0.7);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 16px;
        }
        .modal {
          background: linear-gradient(135deg, #fff5fa 0%, #ffe6f5 100%);
          border: 3px solid #5B1735; padding: 24px;
          max-width: 440px; width: 100%; max-height: 90vh; overflow: auto;
          border-radius: 28px;
          box-shadow: 8px 8px 0 #5B1735, 0 0 60px rgba(255, 110, 196, 0.6);
        }
        .text-input {
          font-family: 'Nunito', sans-serif; font-size: 14px;
          padding: 10px 14px; border: 2.5px solid #5B1735; background: #fff;
          color: #5B1735; width: 100%; box-sizing: border-box;
          border-radius: 14px; box-shadow: 3px 3px 0 #5B1735;
        }
        .text-input:focus { outline: none; border-color: #EC4899; box-shadow: 3px 3px 0 #EC4899; }
        .dmc-list {
          max-height: 380px; overflow-y: auto; margin-top: 12px;
          padding: 4px; background: rgba(255, 255, 255, 0.6); border-radius: 16px;
        }
        .dmc-item {
          display: flex; align-items: center; gap: 10px; padding: 8px 10px;
          cursor: pointer; border-radius: 12px; transition: all 0.15s; margin-bottom: 2px;
        }
        .dmc-item:hover { background: rgba(255, 110, 196, 0.2); }
        .dmc-swatch {
          width: 32px; height: 32px; border: 2px solid #5B1735;
          border-radius: 8px; flex-shrink: 0;
        }
        .project-card {
          padding: 14px; border: 2.5px solid #5B1735; background: #fff;
          cursor: pointer; transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex; gap: 12px; align-items: center;
          border-radius: 18px; box-shadow: 3px 3px 0 #5B1735;
        }
        .project-card.active {
          background: linear-gradient(135deg, #ffe6f5, #f5e6ff);
          border-color: #EC4899; box-shadow: 3px 3px 0 #EC4899;
        }
        .project-emoji {
          font-size: 36px; flex-shrink: 0;
          width: 56px; height: 56px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #fff5fa, #ffe6f5);
          border: 2px solid #5B1735; border-radius: 14px;
        }
        .bow {
          position: absolute; font-size: 32px; z-index: 2;
          animation: wiggle 4s infinite ease-in-out;
        }
        .star-deco {
          position: absolute; font-size: 20px; pointer-events: none;
          animation: float 5s infinite ease-in-out;
        }
        .glitter-text {
          background: linear-gradient(90deg, #EC4899, #ffd93d, #A855F7, #4adfe8, #EC4899);
          background-size: 200% 100%;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .holo-border {
          background: linear-gradient(135deg, #ff6ec4, #ffd93d, #4adfe8, #A855F7);
          background-size: 200% 200%;
          animation: shimmer 5s linear infinite;
          padding: 3px; border-radius: 999px; display: inline-block;
        }
        .checkbox-cute {
          appearance: none; width: 22px; height: 22px;
          border: 2.5px solid #5B1735; border-radius: 6px; background: #fff;
          cursor: pointer; position: relative;
          box-shadow: 2px 2px 0 #5B1735; flex-shrink: 0;
        }
        .checkbox-cute:checked { background: linear-gradient(135deg, #ff6ec4, #A855F7); }
        .checkbox-cute:checked::after {
          content: '✓'; position: absolute; color: #fff;
          font-weight: 800; font-size: 16px;
          top: 50%; left: 50%; transform: translate(-50%, -50%);
        }
        .canvas-margin {
          position: absolute;
          border: 3px dashed #A855F7;
          pointer-events: none;
        }
        .design-area {
          position: absolute;
          border: 3px solid #EC4899;
          pointer-events: none;
        }
        /* Scrollable grid container - critical for mobile */
        .grid-scroll {
          overflow: auto;
          max-width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #fff5fa, #f0e6ff);
          border: 2.5px solid #5B1735;
          border-radius: 16px;
          box-shadow: inset 0 0 20px rgba(255, 110, 196, 0.15);
          -webkit-overflow-scrolling: touch;
          position: relative;
        }
        .scroll-hint {
          position: absolute;
          top: 4px;
          right: 12px;
          font-size: 10px;
          color: #EC4899;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.9);
          padding: 3px 8px;
          border-radius: 999px;
          border: 1.5px solid #EC4899;
          z-index: 5;
          pointer-events: none;
        }
        @media (min-width: 769px) {
          /* Pin the design preview to the top of the viewport so it stays
             visible while users scroll the sidebar settings. Without this,
             editing project options pushes the design off-screen. */
          .preview-area {
            position: sticky;
            top: 16px;
            align-self: start;
            max-height: calc(100vh - 32px);
            overflow-y: auto;
          }
        }
        @media (max-width: 768px) {
          .main-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .sidebar-cards {
            order: 2;
          }
          .preview-area {
            order: 1;
            padding: 12px !important;
          }
          .preview-area .card,
          .preview-area > div {
            box-sizing: border-box;
          }
          .grid-scroll {
            padding: 8px !important;
          }
          .card {
            padding: 14px !important;
          }
        }
      `}</style>

      <div className="sparkle-bg" style={{ top: '5%', left: '8%', animationDelay: '0s' }}>✨</div>
      <div className="sparkle-bg" style={{ top: '20%', right: '12%', animationDelay: '0.7s' }}>💖</div>
      <div className="sparkle-bg" style={{ top: '45%', left: '4%', animationDelay: '1.4s' }}>⭐</div>
      <div className="sparkle-bg" style={{ top: '70%', right: '8%', animationDelay: '2.1s' }}>✨</div>
      <div className="sparkle-bg" style={{ top: '88%', left: '15%', animationDelay: '2.8s' }}>💫</div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Help / how-it-works modal */}
      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="display-font glitter-text" style={{ fontSize: 26 }}>✨ How Stitch &amp; Kit works</div>
              <button onClick={() => setShowHelp(false)} className="btn-icon"><X size={18} /></button>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: '#5B1735' }}>
              <div style={{ background: 'rgba(255,255,255,0.6)', padding: 16, borderRadius: 14, marginBottom: 14, border: '2px dashed #EC4899' }}>
                <div className="body-font" style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>🚀 Three steps</div>
                <div style={{ fontSize: 13 }}>
                  <strong>1.</strong> Pick a project (belt logo, ornament, pillow, etc.) — this sets the mesh and size.<br/>
                  <strong>2.</strong> Add your design — upload an image <em>or</em> type a phrase.<br/>
                  <strong>3.</strong> Tweak the palette, edit by hand if you want, and export the printable bundle.
                </div>
              </div>

              <div className="body-font" style={{ fontWeight: 800, fontSize: 14, color: '#831843', marginTop: 14, marginBottom: 6 }}>🖼️ Image mode</div>
              <ul style={{ paddingLeft: 18, margin: '0 0 12px', fontSize: 13 }}>
                <li>Upload any PNG/JPG. Each pixel snaps to the nearest DMC thread.</li>
                <li>Use <strong>Color Reference</strong> to pull a palette from a second image.</li>
                <li><strong>Smoothing</strong> cleans up scattered single stitches. <strong>Edge Sharpness</strong> controls how soft the color edges are.</li>
              </ul>

              <div className="body-font" style={{ fontWeight: 800, fontSize: 14, color: '#831843', marginBottom: 6 }}>💬 Phrase mode</div>
              <ul style={{ paddingLeft: 18, margin: '0 0 12px', fontSize: 13 }}>
                <li>Type your text — line breaks = new lines.</li>
                <li>Pick a <strong>font</strong>: Chunky Block, Bold Serif, cursive, italic, lowercase, etc.</li>
                <li>Pick a <strong>border</strong>: floral vine, hearts, scallop, gingham…</li>
                <li>Color the <strong>text, background, border</strong>, and <strong>accent</strong> (the flowers/scallops on decorative borders).</li>
                <li>Hit <strong>🎲 Surprise Me</strong> for a random combo, or tap a curated preset.</li>
              </ul>

              <div className="body-font" style={{ fontWeight: 800, fontSize: 14, color: '#831843', marginBottom: 6 }}>🎨 Editing colors</div>
              <ul style={{ paddingLeft: 18, margin: '0 0 12px', fontSize: 13 }}>
                <li>Tap any palette swatch to swap it for a different DMC thread.</li>
                <li>Hit <strong>Edit</strong> to paint or erase individual stitches by hand.</li>
                <li><strong>Cleanup ✨</strong> auto-smooths scattered loner stitches.</li>
                <li><strong>Undo</strong> rolls back the last 30 actions.</li>
              </ul>

              <div className="body-font" style={{ fontWeight: 800, fontSize: 14, color: '#831843', marginBottom: 6 }}>💾 Exporting</div>
              <ul style={{ paddingLeft: 18, margin: '0 0 14px', fontSize: 13 }}>
                <li>Export bundle = 4 printable pages (cover, color chart, B&amp;W symbol chart, thread list).</li>
                <li>Backgrounds are white to save printer ink.</li>
                <li>On iPhone: scroll down after export — <strong>long-press</strong> each image to save to Photos/Files.</li>
              </ul>

              <button
                onClick={() => setShowGlossary(g => !g)}
                className="btn btn-sm"
                style={{ width: '100%', justifyContent: 'space-between', background: '#FCE7F3', borderColor: '#831843' }}
              >
                <span>📚 New to needlepoint? Glossary</span>
                <span>{showGlossary ? '▲' : '▼'}</span>
              </button>

              {showGlossary && (
                <div style={{ background: 'rgba(255,255,255,0.7)', padding: 14, borderRadius: 12, marginTop: 10, fontSize: 13 }}>
                  <p style={{ margin: '6px 0' }}><strong>Mesh</strong> — stitches per inch on the canvas. <strong>13 mesh</strong> = chunkier, faster to stitch. <strong>18 mesh</strong> = finer detail, smaller stitches.</p>
                  <p style={{ margin: '6px 0' }}><strong>DMC</strong> — the most common embroidery floss brand. Every color has a number (e.g. <em>DMC 321 = Christmas Red</em>).</p>
                  <p style={{ margin: '6px 0' }}><strong>Stretcher Bars</strong> — wooden frames you stretch your canvas on so it doesn't warp while you stitch. Sold in pairs by the inch.</p>
                  <p style={{ margin: '6px 0' }}><strong>Canvas / Blank</strong> — the gridded fabric you stitch on. Belt blanks and key fobs come pre-cut to size; pillows need stretcher bars.</p>
                  <p style={{ margin: '6px 0' }}><strong>Stitches to sew</strong> — roughly how many individual stitches you'll make. Rule of thumb: ~150-200 stitches per skein of floss on 18 mesh.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Project picker modal */}
      {showProjectPicker && (
        <div className="modal-overlay" onClick={() => setShowProjectPicker(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="display-font glitter-text" style={{ fontSize: 26 }}>✨ Pick a project ✨</div>
              <button onClick={() => setShowProjectPicker(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(PROJECTS).map(([key, p]) => (
                <div
                  key={key}
                  className={`project-card ${projectKey === key ? 'active' : ''}`}
                  onClick={() => loadProject(key)}
                >
                  <div className="project-emoji">{p.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="body-font" style={{ fontSize: 18, fontWeight: 700 }}>{p.name}</div>
                    <div className="mono-font" style={{ fontSize: 11, color: '#A855F7', marginTop: 2, fontWeight: 600 }}>
                      {p.mesh} mesh · {p.widthIn}" × {p.heightIn}" · {p.shape}
                    </div>
                    <div style={{ fontSize: 11, color: '#831843', marginTop: 2 }}>{p.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DMC picker */}
      {editingColorIdx !== null && palette[editingColorIdx] && (
        <div className="modal-overlay" onClick={() => { setEditingColorIdx(null); setDmcSearch(''); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="display-font glitter-text" style={{ fontSize: 24 }}>🎀 Pick DMC color</div>
              <button onClick={() => { setEditingColorIdx(null); setDmcSearch(''); }} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: 14, background: 'rgba(255, 255, 255, 0.6)', borderRadius: 16, border: '2px dashed #EC4899' }}>
              <div style={{ width: 60, height: 60, background: palette[editingColorIdx].hex, border: '2.5px solid #5B1735', borderRadius: 12, boxShadow: '3px 3px 0 #5B1735', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="body-font" style={{ fontWeight: 700, fontSize: 14 }}>Color {editingColorIdx + 1}</div>
                {palette[editingColorIdx].dmc && (
                  <div className="mono-font" style={{ fontSize: 12, color: '#831843', marginTop: 2, fontWeight: 600 }}>
                    DMC {palette[editingColorIdx].dmc} — {palette[editingColorIdx].name}
                  </div>
                )}
              </div>
            </div>
            <input
              type="text" className="text-input"
              placeholder="🔍 Search by number or name..."
              value={dmcSearch}
              onChange={(e) => setDmcSearch(e.target.value)}
            />
            <div className="dmc-list">
              {filteredDMC.map(c => (
                <div key={c.dmc} className="dmc-item" onClick={() => pickDmcForColor(editingColorIdx, c)}>
                  <div className="dmc-swatch" style={{ background: c.hex }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="body-font" style={{ fontSize: 13, fontWeight: 700, color: '#5B1735' }}>DMC {c.dmc}</div>
                    <div style={{ fontSize: 11, color: '#831843', marginTop: 1 }}>{c.name}</div>
                  </div>
                </div>
              ))}
              {filteredDMC.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: '#831843', fontSize: 13 }}>
                  No colors match "{dmcSearch}" 💔
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export picker modal */}
      {showExportPicker && (
        <div className="modal-overlay" onClick={() => { setShowExportPicker(false); setExportedImages([]); setExportStatus(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="display-font glitter-text" style={{ fontSize: 26 }}>💝 Export</div>
              <button onClick={() => { setShowExportPicker(false); setExportedImages([]); setExportStatus(null); }} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 16, padding: 14, background: 'rgba(255, 255, 255, 0.7)', borderRadius: 14, border: '2px solid #A855F7' }}>
              <div className="section-label" style={{ marginBottom: 8 }}>Pattern Info (optional)</div>
              <div style={{ marginBottom: 10 }}>
                <label className="body-font" style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>Pattern Name</label>
                <input type="text" className="text-input" placeholder="e.g. Strawberry Belt"
                  value={patternName} onChange={(e) => setPatternName(e.target.value)} />
              </div>
              <div>
                <label className="body-font" style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>Shop / Designer Name</label>
                <input type="text" className="text-input" placeholder="e.g. Stitch &amp; Kit Designs"
                  value={shopName} onChange={(e) => setShopName(e.target.value)} />
              </div>
            </div>

            {exportStatus && (
              <div style={{
                padding: 14, marginBottom: 12, borderRadius: 14,
                background: exportStatus === 'error' ? 'linear-gradient(135deg, #ffe0e0, #ffd0d0)' : 'linear-gradient(135deg, #e0ffe0, #d0ffd0)',
                border: `2px solid ${exportStatus === 'error' ? '#ff4444' : '#1a9933'}`,
                fontSize: 13, fontWeight: 600, color: '#5B1735',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 20 }}>
                  {exportStatus === 'working' ? '✨' : exportStatus === 'done' ? '💖' : '⚠️'}
                </span>
                <span>{exportProgress}</span>
              </div>
            )}

            <div style={{ padding: 12, marginBottom: 14, background: 'rgba(255, 200, 100, 0.15)', borderRadius: 12, border: '1.5px dashed #A855F7', fontSize: 11, color: '#831843', lineHeight: 1.5, fontWeight: 500 }}>
              📱 <strong>On iPhone/iPad?</strong> Downloads sometimes don't go through silently. After generating, scroll down to see each page as an image — <strong>long-press to save to Photos or Files</strong>. That always works.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-primary" onClick={exportPatternBundle} disabled={exportStatus === 'working'} style={{ width: '100%', justifyContent: 'center', padding: '14px', opacity: exportStatus === 'working' ? 0.5 : 1 }}>
                <FileText size={16} />{exportStatus === 'working' ? 'Working...' : 'Full Pattern Bundle ✨'}
              </button>
              <div style={{ fontSize: 11, color: '#831843', lineHeight: 1.5, padding: '0 8px' }}>
                4 letter-sized pages (150 dpi): cover page with details, color chart, B&W symbol chart, thread list. Combine into a PDF using Canva, Pages, or Acrobat.
              </div>

              <div style={{ height: 1, background: '#A855F7', margin: '8px 0' }} />

              <button className="btn" onClick={exportPreviewPNG} disabled={exportStatus === 'working'} style={{ width: '100%', justifyContent: 'center', opacity: exportStatus === 'working' ? 0.5 : 1 }}>
                <Download size={14} />Quick Preview PNG
              </button>
              <div style={{ fontSize: 11, color: '#831843', lineHeight: 1.5, padding: '0 8px' }}>
                Single PNG with chart + DMC legend. Good for personal use.
              </div>
            </div>

            {exportedImages.length > 0 && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '2px dashed #A855F7' }}>
                <div className="display-font glitter-text" style={{ fontSize: 22, marginBottom: 8 }}>
                  📸 Your pattern files
                </div>
                <div style={{ padding: 12, marginBottom: 14, background: 'linear-gradient(135deg, #fff5e6, #ffe6f5)', borderRadius: 12, border: '2px solid #EC4899', fontSize: 12, color: '#5B1735', lineHeight: 1.5, fontWeight: 600 }}>
                  💡 <strong>Save method that always works:</strong><br/>
                  • <strong>iPhone/iPad:</strong> Long-press an image → "Save to Photos" or "Add to Files"<br/>
                  • <strong>Desktop:</strong> Right-click → "Save image as..."<br/>
                  • <strong>Android:</strong> Long-press → "Download image"
                </div>
                {exportedImages.map((img, i) => img && (
                  <div key={i} style={{ marginBottom: 16, padding: 10, background: '#fff', border: '2px solid #5B1735', borderRadius: 14, boxShadow: '3px 3px 0 #5B1735' }}>
                    <div className="mono-font" style={{ fontSize: 11, fontWeight: 700, color: '#831843', marginBottom: 8, textAlign: 'center' }}>
                      {img.name}
                    </div>
                    <img
                      src={img.dataUrl}
                      alt={img.name}
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        borderRadius: 8,
                        border: '1px solid #A855F7',
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 24, position: 'relative' }}>
          <div className="bow" style={{ top: -10, left: '50%', transform: 'translateX(-50%)' }}>🎀</div>
          <div className="star-deco" style={{ top: 20, left: '15%' }}>⭐</div>
          <div className="star-deco" style={{ top: 30, right: '15%', animationDelay: '1.5s' }}>💖</div>
          <div className="holo-border" style={{ marginBottom: 14, marginTop: 30 }}>
            <div style={{ padding: '6px 18px', background: '#fff', borderRadius: 999, fontSize: 10, fontFamily: 'Nunito', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5B1735' }}>
              ✨ Printable needlepoint pattern maker ✨
            </div>
          </div>
          {/* Wordmark — Pacifico in a shimmering rainbow gradient that pops
              against the pink/purple hero bg. The plain SVG wordmark blended
              into the bg; this brings back the disco shimmer the brand started
              with while keeping Stitch & Kit type-locked in Pacifico. */}
          <h1 style={{
            fontFamily: "'Pacifico', cursive",
            fontSize: 'clamp(64px, 11vw, 144px)',
            margin: 0,
            lineHeight: 1,
            background: 'linear-gradient(90deg, #FFFFFF 0%, #FCD34D 25%, #FFFFFF 50%, #A7F3D0 75%, #FFFFFF 100%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'shimmer 5s linear infinite',
            filter: 'drop-shadow(0 6px 18px rgba(91,23,53,0.35))',
            letterSpacing: '-0.01em',
          }}>
            Stitch &amp; Kit
          </h1>
          <button
            onClick={() => setShowHelp(true)}
            className="btn"
            style={{
              marginTop: 18,
              background: 'rgba(255,255,255,0.92)',
              borderColor: '#5B1735',
              color: '#5B1735',
            }}
          >
            ❓ How does this work?
          </button>
        </div>

        <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: 18 }}>
          <div className="sidebar-cards" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card">
              <div className="section-label"><Sparkles size={14} /> Project Type<InfoTip text="What you're making — sets the canvas mesh, dimensions, and shape automatically." /></div>
              <button className="btn" onClick={() => setShowProjectPicker(true)} style={{ width: '100%', justifyContent: 'space-between', padding: '12px 16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{proj.emoji}</span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{proj.name}</span>
                </span>
                <span style={{ fontSize: 11, color: '#A855F7', fontWeight: 700 }}>change ›</span>
              </button>
              <div className="mono-font" style={{ fontSize: 11, color: '#831843', marginTop: 10, fontWeight: 600, textAlign: 'center' }}>
                💕 {proj.mesh} mesh · {widthStitches} × {heightStitches} st 💕
              </div>
              {proj.usesStretcherBars ? (
                <div style={{ marginTop: 10, padding: 12, background: 'linear-gradient(135deg, #ffe6f5, #f5e6ff)', border: '2px solid #EC4899', borderRadius: 12 }}>
                  <div className="body-font" style={{ fontSize: 11, fontWeight: 700, color: '#5B1735', marginBottom: 4, display: 'flex', alignItems: 'center' }}>🛒 Stretcher Bars<InfoTip text="Wooden frames you stretch your canvas on so it doesn't warp while stitching. Buy 2 pairs at these sizes." /></div>
                  <div className="display-font" style={{ fontSize: 18, color: '#EC4899', lineHeight: 1.1 }}>
                    {stretcherBars.barW}" × {stretcherBars.barH}"
                  </div>
                  <div className="mono-font" style={{ fontSize: 10, color: '#831843', marginTop: 4, fontWeight: 500, lineHeight: 1.4 }}>
                    Buy 2 pairs ({stretcherBars.barW}" + {stretcherBars.barH}") · {stretcherBars.isMini ? '½" mini bars OK' : 'use ¾"–1" regular bars'} · 2" margin per side
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 10, padding: 12, background: 'linear-gradient(135deg, #fff5e6, #ffe6f5)', border: '2px solid #EC4899', borderRadius: 12 }}>
                  <div className="body-font" style={{ fontSize: 11, fontWeight: 700, color: '#5B1735', marginBottom: 4 }}>👛 {proj.name} Blank</div>
                  <div className="mono-font" style={{ fontSize: 10, color: '#831843', marginTop: 2, fontWeight: 500, lineHeight: 1.4 }}>
                    {proj.finishNote}
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <div className="section-label"><Heart size={14} fill="#EC4899" /> 01 · Source</div>
              {/* Mode toggle: Image upload vs Text/phrase pillow maker */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, background: 'rgba(255,255,255,0.6)', padding: 4, borderRadius: 14, border: '2px solid #5B1735' }}>
                <button
                  className={`btn btn-sm ${inputMode === 'image' ? 'active' : ''}`}
                  onClick={() => setInputMode('image')}
                  style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
                >
                  🖼️ Image
                </button>
                <button
                  className={`btn btn-sm ${inputMode === 'text' ? 'active' : ''}`}
                  onClick={() => {
                    setInputMode('text');
                    // If current project doesn't suit text, switch to a phrase pillow
                    const curr = PROJECTS[projectKey];
                    if (curr && !projectKey.includes('phrase')) {
                      loadProject('phrase_pillow_md');
                    }
                  }}
                  style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
                >
                  💬 Phrase
                </button>
              </div>

              {inputMode === 'image' ? (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
                  <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} style={{ width: '100%', justifyContent: 'center' }}>
                    <Upload size={14} />{image ? 'Replace Image' : 'Upload Image ✨'}
                  </button>
                  {imageName && (
                    <div style={{ fontSize: 11, marginTop: 10, color: '#831843', fontWeight: 500, wordBreak: 'break-all', textAlign: 'center' }}>
                      💖 {imageName}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <label className="body-font" style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                      Your phrase ✨ <span style={{ fontWeight: 400, color: '#831843' }}>(line breaks = new lines)</span>
                    </label>
                    <textarea
                      className="text-input"
                      value={phraseText}
                      onChange={(e) => setPhraseText(e.target.value)}
                      rows={4}
                      placeholder="I LOVE&#10;THAT FOR&#10;YOU"
                      style={{ resize: 'vertical', minHeight: 80, fontFamily: '"Nunito", sans-serif', fontWeight: 600 }}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label className="body-font" style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>Font style</label>
                    <select
                      className="text-input"
                      value={phraseFont}
                      onChange={(e) => setPhraseFont(e.target.value)}
                      style={{ fontFamily: '"Nunito", sans-serif', fontWeight: 600 }}
                    >
                      {Object.entries(PHRASE_FONTS).map(([k, f]) => (
                        <option key={k} value={k}>{f.name} — {f.note}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label className="body-font" style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>Border style</label>
                    <select
                      className="text-input"
                      value={phraseBorderStyle}
                      onChange={(e) => setPhraseBorderStyle(e.target.value)}
                      style={{ fontFamily: '"Nunito", sans-serif', fontWeight: 600 }}
                    >
                      {Object.entries(PHRASE_BORDERS).map(([k, b]) => (
                        <option key={k} value={k}>{b.emoji} {b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    <div>
                      <label className="body-font" style={{ fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>Text</label>
                      <input type="color" value={phraseTextColor} onChange={(e) => setPhraseTextColor(e.target.value)} style={{ width: '100%', height: 36, border: '2px solid #5B1735', borderRadius: 8, cursor: 'pointer', padding: 0, background: '#fff' }} />
                    </div>
                    <div>
                      <label className="body-font" style={{ fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>Bg</label>
                      <input type="color" value={phraseBgColor} onChange={(e) => setPhraseBgColor(e.target.value)} style={{ width: '100%', height: 36, border: '2px solid #5B1735', borderRadius: 8, cursor: 'pointer', padding: 0, background: '#fff' }} />
                    </div>
                    <div>
                      <label className="body-font" style={{ fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>Border</label>
                      <input type="color" value={phraseBorderColor} onChange={(e) => setPhraseBorderColor(e.target.value)} style={{ width: '100%', height: 36, border: '2px solid #5B1735', borderRadius: 8, cursor: 'pointer', padding: 0, background: '#fff' }} />
                    </div>
                    <div>
                      <label className="body-font" style={{ fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4 }}>
                        Accent <span style={{ fontWeight: 400, color: '#831843' }}>(flowers/scallops)</span>
                      </label>
                      <input type="color" value={phraseBorderAccentColor} onChange={(e) => setPhraseBorderAccentColor(e.target.value)} style={{ width: '100%', height: 36, border: '2px solid #5B1735', borderRadius: 8, cursor: 'pointer', padding: 0, background: '#fff' }} />
                    </div>
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const preset = PHRASE_PRESETS[Math.floor(Math.random() * PHRASE_PRESETS.length)];
                      const borderKeys = Object.keys(PHRASE_BORDERS).filter(k => k !== 'none');
                      const fontKeys = Object.keys(PHRASE_FONTS);
                      setPhraseTextColor(preset.text);
                      setPhraseBgColor(preset.bg);
                      setPhraseBorderColor(preset.border);
                      setPhraseBorderAccentColor(preset.accent || preset.text);
                      setPhraseFont(fontKeys[Math.floor(Math.random() * fontKeys.length)]);
                      setPhraseBorderStyle(borderKeys[Math.floor(Math.random() * borderKeys.length)]);
                    }}
                    style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}
                  >
                    🎲 Surprise Me ✨
                  </button>

                  <div style={{ fontSize: 10, color: '#831843', fontWeight: 600, marginBottom: 6, textAlign: 'center' }}>or pick a curated combo</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {PHRASE_PRESETS.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => { setPhraseTextColor(p.text); setPhraseBgColor(p.bg); setPhraseBorderColor(p.border); setPhraseBorderAccentColor(p.accent || p.text); }}
                        style={{
                          padding: '6px 8px',
                          border: '2px solid #5B1735',
                          borderRadius: 10,
                          background: p.bg,
                          color: p.text,
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: '"Nunito", sans-serif',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '2px 2px 0 #5B1735',
                        }}
                      >
                        <span style={{ width: 14, height: 14, borderRadius: 4, background: p.border, flexShrink: 0, border: '1px solid rgba(0,0,0,0.2)' }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="card">
              <div className="section-label"><Star size={14} fill="#ffd93d" /> 02 · Color Reference</div>
              <div style={{ fontSize: 11, color: '#831843', marginBottom: 10, fontWeight: 500 }}>✨ Pull palette from another image</div>
              <input ref={refFileInputRef} type="file" accept="image/*" onChange={handleRefUpload} style={{ display: 'none' }} />
              {!refImage ? (
                <button className="btn" onClick={() => refFileInputRef.current?.click()} style={{ width: '100%', justifyContent: 'center' }}>
                  <ImageIcon size={14} />Upload Reference
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={refImage.src} alt="ref" style={{ width: 52, height: 52, objectFit: 'cover', border: '2.5px solid #5B1735', borderRadius: 12, boxShadow: '2px 2px 0 #5B1735' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: '#5B1735', fontWeight: 600, wordBreak: 'break-all' }}>{refImageName}</div>
                    <div className="mono-font" style={{ fontSize: 10, color: '#EC4899', marginTop: 2, fontWeight: 700 }}>✨ active</div>
                  </div>
                  <button onClick={clearRef} className="btn-icon">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="card">
              <div className="section-label">💎 03 · Size & Shape</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label className="body-font" style={{ fontSize: 12, fontWeight: 700 }}>Width</label>
                  <span className="mono-font" style={{ fontSize: 13, fontWeight: 700, color: '#EC4899' }}>{widthIn.toFixed(2)}" · {widthStitches} st</span>
                </div>
                <input type="range" min="0.5" max="16" step="0.1" value={widthIn} onChange={(e) => setWidthIn(+e.target.value)} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label className="body-font" style={{ fontSize: 12, fontWeight: 700 }}>Height</label>
                  <span className="mono-font" style={{ fontSize: 13, fontWeight: 700, color: '#EC4899' }}>{heightIn.toFixed(2)}" · {heightStitches} st</span>
                </div>
                <input type="range" min="0.5" max="16" step="0.1" value={heightIn} onChange={(e) => setHeightIn(+e.target.value)} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label className="body-font" style={{ fontSize: 12, fontWeight: 700 }}>Mesh</label>
                  <span className="mono-font" style={{ fontSize: 13, fontWeight: 700, color: '#EC4899' }}>{mesh}</span>
                </div>
                <input type="range" min="8" max="22" value={mesh} onChange={(e) => setMesh(+e.target.value)} />
                <div className="mono-font" style={{ fontSize: 10, color: '#831843', marginTop: 4, fontWeight: 600 }}>10 = chunky 🍡 · 13 = std · 18 = fine ✨</div>
              </div>
              <div>
                <label className="body-font" style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>Shape</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {[
                    { v: 'rectangle', e: '▭' }, { v: 'square', e: '◻' },
                    { v: 'circle', e: '◯' }, { v: 'oval', e: '⬭' },
                  ].map(s => (
                    <button key={s.v} className={`btn ${shape === s.v ? 'active' : ''}`}
                      onClick={() => setShape(s.v)}
                      style={{ justifyContent: 'center', padding: '8px 6px', fontSize: 11 }}>
                      {s.e} {s.v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {image && (
              <div className="card">
                <div className="section-label">📐 Image Position</div>
                <div style={{ fontSize: 11, color: '#831843', marginBottom: 12, fontWeight: 500, fontStyle: 'italic' }}>
                  Shrink the design within the canvas so it doesn't fill the whole space
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label className="body-font" style={{ fontSize: 12, fontWeight: 700 }}>Size</label>
                    <span className="mono-font" style={{ fontSize: 13, fontWeight: 700, color: '#EC4899' }}>{designScale}%</span>
                  </div>
                  <input type="range" min="20" max="100" step="5" value={designScale} onChange={(e) => setDesignScale(+e.target.value)} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label className="body-font" style={{ fontSize: 12, fontWeight: 700 }}>Horizontal Position</label>
                    <span className="mono-font" style={{ fontSize: 13, fontWeight: 700, color: '#EC4899' }}>
                      {designOffsetX === 0 ? 'center' : designOffsetX > 0 ? `+${designOffsetX}` : designOffsetX}
                    </span>
                  </div>
                  <input type="range" min="-50" max="50" step="5" value={designOffsetX} onChange={(e) => setDesignOffsetX(+e.target.value)} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 4, color: '#831843', fontWeight: 600 }} className="mono-font">
                    <span>← left</span><span>center</span><span>right →</span>
                  </div>
                </div>
                <button className="btn btn-sm" onClick={() => { setDesignScale(100); setDesignOffsetX(0); }} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                  Reset
                </button>
              </div>
            )}

            <div className="card">
              <div className="section-label">🌈 04 · Pattern Magic</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 12, marginBottom: 14, padding: 10, background: useDMC ? 'linear-gradient(135deg, #ffe6f5, #f5e6ff)' : 'rgba(255,255,255,0.5)', borderRadius: 12, border: '2px solid #5B1735' }}>
                <input type="checkbox" className="checkbox-cute" checked={useDMC} onChange={(e) => setUseDMC(e.target.checked)} />
                <span className="body-font" style={{ fontSize: 12, fontWeight: 700 }}>🧵 Snap to DMC threads</span>
                <InfoTip text="DMC is the most common embroidery floss brand. When on, every color in your pattern maps to a real DMC thread number you can buy." />
              </label>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label className="body-font" style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center' }}>Colors<InfoTip text="How many DMC threads to use. Fewer = simpler pattern, more uniform. More = closer match to your image but more skeins to buy." /></label>
                  <span className="mono-font" style={{ fontSize: 13, fontWeight: 700, color: '#EC4899' }}>{numColors}</span>
                </div>
                <input type="range" min="2" max="20" value={numColors} onChange={(e) => setNumColors(+e.target.value)} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label className="body-font" style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center' }}>Edges<InfoTip text="How crisp color boundaries should be. Sharp = hard edges (good for logos). Soft = blended (better for photos)." /></label>
                  <span className="mono-font" style={{ fontSize: 13, fontWeight: 700, color: '#EC4899' }}>{['Soft','Normal','Sharp'][edgeSharpness]}</span>
                </div>
                <input type="range" min="0" max="2" value={edgeSharpness} onChange={(e) => setEdgeSharpness(+e.target.value)} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label className="body-font" style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center' }}>Smoothing<InfoTip text="Cleans up scattered loner stitches. Higher = neater shapes but loses fine detail. Off = preserves every speck." /></label>
                  <span className="mono-font" style={{ fontSize: 13, fontWeight: 700, color: '#EC4899' }}>{['off','light','normal','heavy'][smoothing]}</span>
                </div>
                <input type="range" min="0" max="3" value={smoothing} onChange={(e) => setSmoothing(+e.target.value)} />
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '2px dashed #A855F7' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 12 }}>
                  <input type="checkbox" className="checkbox-cute" checked={useBg} onChange={(e) => setUseBg(e.target.checked)} />
                  <span className="body-font" style={{ fontSize: 12, fontWeight: 700 }}>Background fill</span>
                </label>
                {useBg && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ width: 44, height: 36, border: '2.5px solid #5B1735', cursor: 'pointer', borderRadius: 10, boxShadow: '2px 2px 0 #5B1735' }} />
                    <span className="mono-font" style={{ fontSize: 11, fontWeight: 700 }}>{bgColor.toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>

            {gridData && (
              <div className="card">
                <div className="section-label">💝 05 · Export</div>
                <button className="btn btn-primary" onClick={() => setShowExportPicker(true)} style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}>
                  <Download size={14} />Export Options ✨
                </button>
                <button className="btn" onClick={reset} style={{ width: '100%', justifyContent: 'center' }}>
                  <RotateCcw size={14} />Start Over
                </button>
              </div>
            )}
          </div>

          <div className="card preview-area" style={{ padding: 18, minHeight: 400 }}>
            {!gridData ? (
              <div style={{
                minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', color: '#831843', textAlign: 'center', gap: 18,
                border: '3px dashed #EC4899', borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(255,230,245,0.5), rgba(245,230,255,0.5))',
                padding: 24,
              }}>
                <div style={{ fontSize: 56 }}>🎀</div>
                <div className="display-font glitter-text" style={{ fontSize: 28 }}>Let's make something cute!</div>
                <div style={{ fontSize: 13, maxWidth: 380, lineHeight: 1.6, fontWeight: 500 }}>
                  Set to <strong style={{ color: '#EC4899' }}>{proj.name} {proj.emoji}</strong> ({proj.mesh} mesh, {proj.widthIn}" × {proj.heightIn}"). Tap a different project or upload your image ✨
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button className={`btn btn-sm ${viewMode === 'grid' && !editMode ? 'active' : ''}`} onClick={() => { setViewMode('grid'); setEditMode(false); }}>
                    <Grid3x3 size={11} />Grid
                  </button>
                  <button className={`btn btn-sm ${viewMode === 'numbered' && !editMode ? 'active' : ''}`} onClick={() => { setViewMode('numbered'); setEditMode(false); }}>
                    <Palette size={11} />Numbered
                  </button>
                  <button className={`btn btn-sm ${viewMode === 'preview' && !editMode ? 'active' : ''}`} onClick={() => { setViewMode('preview'); setEditMode(false); }}>
                    <Eye size={11} />Preview
                  </button>
                  <div style={{ width: 2, height: 22, background: '#A855F7', margin: '0 2px', borderRadius: 1 }} />
                  <button className={`btn btn-sm ${editMode ? 'active' : ''}`} onClick={() => setEditMode(!editMode)}>
                    <Edit3 size={11} />{editMode ? 'Editing ✨' : 'Edit'}
                  </button>
                  {editMode && (
                    <>
                      <button className={`btn-sm btn ${drawAction === 'paint' ? 'active' : ''}`} onClick={() => setDrawAction('paint')}>🎨</button>
                      <button className={`btn btn-sm ${drawAction === 'erase' ? 'active' : ''}`} onClick={() => setDrawAction('erase')}><Eraser size={11} /></button>
                      <button className={`btn btn-sm ${showTrace ? 'active' : ''}`} onClick={() => setShowTrace(!showTrace)}><Layers size={11} />Trace</button>
                      <button className="btn btn-sm" onClick={cleanupNow}><Wand2 size={11} /></button>
                      <button className="btn btn-sm" onClick={undo} disabled={history.length === 0} style={history.length === 0 ? { opacity: 0.4 } : {}}><Undo2 size={11} /></button>
                    </>
                  )}
                </div>

                {/* Zoom + toggles row */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.6)', borderRadius: 12, border: '2px solid #A855F7' }}>
                  <span className="body-font" style={{ fontSize: 11, fontWeight: 700, color: '#831843' }}>🔍 Zoom:</span>
                  <button className={`btn btn-sm ${zoomLevel === 'fit' ? 'active' : ''}`} onClick={() => setZoomLevel('fit')} style={{ padding: '4px 8px', fontSize: 10 }}>Fit</button>
                  <button className={`btn btn-sm ${zoomLevel === 1 ? 'active' : ''}`} onClick={() => setZoomLevel(1)} style={{ padding: '4px 8px', fontSize: 10 }}>1×</button>
                  <button className={`btn btn-sm ${zoomLevel === 1.5 ? 'active' : ''}`} onClick={() => setZoomLevel(1.5)} style={{ padding: '4px 8px', fontSize: 10 }}>1.5×</button>
                  <button className={`btn btn-sm ${zoomLevel === 2 ? 'active' : ''}`} onClick={() => setZoomLevel(2)} style={{ padding: '4px 8px', fontSize: 10 }}>2×</button>
                  <button className={`btn btn-sm ${zoomLevel === 3 ? 'active' : ''}`} onClick={() => setZoomLevel(3)} style={{ padding: '4px 8px', fontSize: 10 }}>3×</button>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>
                      <input type="checkbox" className="checkbox-cute" style={{ width: 16, height: 16 }} checked={showGuides} onChange={(e) => setShowGuides(e.target.checked)} />Guides
                    </label>
                    {proj.usesStretcherBars && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>
                        <input type="checkbox" className="checkbox-cute" style={{ width: 16, height: 16 }} checked={showCanvas} onChange={(e) => setShowCanvas(e.target.checked)} />Canvas
                      </label>
                    )}
                    {(shape === 'circle' || shape === 'oval') && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>
                        <input type="checkbox" className="checkbox-cute" style={{ width: 16, height: 16 }} checked={showShape} onChange={(e) => setShowShape(e.target.checked)} />Shape
                      </label>
                    )}
                  </div>
                </div>

                {editMode && showTrace && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <label className="body-font" style={{ fontSize: 11, fontWeight: 700 }}>Trace opacity</label>
                      <span className="mono-font" style={{ fontSize: 11, color: '#EC4899', fontWeight: 700 }}>{Math.round(traceOpacity * 100)}%</span>
                    </div>
                    <input type="range" min="0.1" max="0.8" step="0.05" value={traceOpacity} onChange={(e) => setTraceOpacity(+e.target.value)} />
                  </div>
                )}

                {editMode && (
                  <div style={{ padding: 10, background: 'linear-gradient(135deg, #ffe6f5, #f5e6ff)', border: '2px solid #EC4899', marginBottom: 12, fontSize: 11, color: '#831843', lineHeight: 1.5, borderRadius: 12, fontWeight: 600 }}>
                    {showTrace ? '🎀 Tracing mode: original image shown behind grid' :
                     drawAction === 'paint' ? '💖 Tap or drag to paint! Pick a color from the palette below' :
                     '🧼 Tap or drag to erase to background'}
                  </div>
                )}

                {gridData && (
                  <div ref={gridScrollRef} className="grid-scroll">
                    {(widthStitches * cellSize > 350) && (
                      <div className="scroll-hint">← swipe →</div>
                    )}
                    {/* Wrapper with optional canvas margin matching stretcher bar size */}
                    <div style={{
                      display: 'inline-block', position: 'relative',
                      padding: (showCanvas && proj.usesStretcherBars) ? `${previewPaddingH}px ${previewPaddingW}px` : '0',
                      background: (showCanvas && proj.usesStretcherBars) ? 'repeating-linear-gradient(0deg, transparent, transparent ' + (cellSize - 0.5) + 'px, rgba(192, 132, 245, 0.15) ' + (cellSize - 0.5) + 'px, rgba(192, 132, 245, 0.15) ' + cellSize + 'px), repeating-linear-gradient(90deg, transparent, transparent ' + (cellSize - 0.5) + 'px, rgba(192, 132, 245, 0.15) ' + (cellSize - 0.5) + 'px, rgba(192, 132, 245, 0.15) ' + cellSize + 'px)' : 'transparent',
                      border: (showCanvas && proj.usesStretcherBars) ? '3px dashed #A855F7' : 'none',
                      borderRadius: (showCanvas && proj.usesStretcherBars) ? 8 : 0,
                    }}>
                      {(showCanvas && proj.usesStretcherBars) && (
                        <div style={{
                          position: 'absolute',
                          top: 8, left: 8,
                          background: 'rgba(192, 132, 245, 0.9)',
                          color: '#fff',
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 700,
                          fontFamily: 'Nunito',
                          letterSpacing: '0.05em',
                          zIndex: 3,
                          whiteSpace: 'nowrap',
                        }}>
                          {stretcherBars.barW}" × {stretcherBars.barH}" stretcher bars
                        </div>
                      )}
                      <div
                        onMouseDown={onPointerDown}
                        onMouseMove={onPointerMove}
                        onTouchStart={onPointerDown}
                        onTouchMove={onPointerMove}
                        style={{
                          display: 'inline-block', position: 'relative',
                          boxShadow: '0 2px 12px rgba(255, 110, 196, 0.3)',
                          cursor: editMode ? (drawAction === 'erase' ? 'cell' : 'crosshair') : 'default',
                          touchAction: editMode ? 'none' : 'auto',
                        }}
                      >
                        {/* Stitched preview mode: a single canvas with X-stitches
                            for each cell. Lets users see how the design will
                            actually look stitched, not just as flat colored cells. */}
                        {viewMode === 'preview' && !editMode ? (
                          <canvas
                            ref={stitchPreviewRef}
                            style={{ display: 'block', borderRadius: 4 }}
                          />
                        ) : (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: `repeat(${widthStitches}, ${cellSize}px)`,
                          gridTemplateRows: `repeat(${heightStitches}, ${cellSize}px)`,
                          gap: 0,
                        }}>
                          {gridData.flat().map((v, i) => {
                            const x = i % widthStitches;
                            const y = Math.floor(i / widthStitches);
                            const isMasked = v === -2;
                            const isEmpty = v === -1;
                            let color = '#fff5fa';
                            if (isMasked) color = '#e8d5e8';
                            else if (!isEmpty) color = palette[v]?.hex || '#fff';
                            // Show palette symbol in Numbered mode. Lowered the
                            // cellSize threshold from 14 → 7 so symbols are visible
                            // even at Fit zoom on small designs (e.g. belt logos),
                            // and switched from "v+1" indices to the canonical
                            // SYMBOLS used in the printed chart for consistency.
                            const showSymbol = viewMode === 'numbered' && !editMode && !isEmpty && !isMasked && cellSize >= 7;
                            const isPreview = viewMode === 'preview' && !editMode;
                            const borderRight = showGuides && (x + 1) % 10 === 0 && x !== widthStitches - 1 ? '1.5px solid #EC4899' : (isPreview ? 'none' : '1px solid rgba(122, 51, 153, 0.2)');
                            const borderBottom = showGuides && (y + 1) % 10 === 0 && y !== heightStitches - 1 ? '1.5px solid #EC4899' : (isPreview ? 'none' : '1px solid rgba(122, 51, 153, 0.2)');
                            let textColor = '#000';
                            if (!isEmpty && !isMasked) {
                              const [r,g,b] = palette[v].rgb;
                              const lum = (0.299*r + 0.587*g + 0.114*b);
                              textColor = lum < 128 ? '#fff' : '#000';
                            }
                            return (
                              <div key={i} data-cell data-x={x} data-y={y}
                                onMouseEnter={() => setHoveredCell({x: x+1, y: y+1, color: (isEmpty || isMasked) ? null : palette[v]?.hex, idx: v, masked: isMasked, dmc: palette[v]?.dmc, name: palette[v]?.name})}
                                onMouseLeave={() => setHoveredCell(null)}
                                style={{
                                  background: color,
                                  backgroundImage: isMasked ? 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(192,132,245,0.3) 2px, rgba(192,132,245,0.3) 4px)' : 'none',
                                  borderRight, borderBottom,
                                  borderTop: isPreview ? 'none' : (y === 0 ? '1px solid rgba(122,51,153,0.2)' : 'none'),
                                  borderLeft: isPreview ? 'none' : (x === 0 ? '1px solid rgba(122,51,153,0.2)' : 'none'),
                                  width: cellSize, height: cellSize,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: Math.max(6, Math.min(14, cellSize * 0.6)), color: textColor,
                                  fontFamily: 'Nunito, sans-serif', fontWeight: 700,
                                  userSelect: 'none', boxSizing: 'border-box',
                                  opacity: isMasked ? 0.5 : 1,
                                }}
                              >
                                {showSymbol ? SYMBOLS[v % SYMBOLS.length] : ''}
                              </div>
                            );
                          })}
                        </div>
                        )}
                        {showShape && (shape === 'circle' || shape === 'oval') && (
                          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                            viewBox={`0 0 ${widthStitches * cellSize} ${heightStitches * cellSize}`} preserveAspectRatio="none">
                            <ellipse cx={(widthStitches * cellSize) / 2} cy={(heightStitches * cellSize) / 2}
                              rx={(widthStitches * cellSize) / 2 - 1} ry={(heightStitches * cellSize) / 2 - 1}
                              fill="none" stroke="#EC4899" strokeWidth="2.5" strokeDasharray="6,3" />
                          </svg>
                        )}
                        {editMode && showTrace && image && (
                          <img src={image.src} alt="trace"
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                              objectFit: 'contain', opacity: traceOpacity,
                              pointerEvents: 'none', mixBlendMode: 'multiply' }} />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div className="mono-font" style={{ fontSize: 11, color: '#831843', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span>💎 {widthStitches} × {heightStitches} st · {widthIn.toFixed(2)}" × {heightIn.toFixed(2)}"</span>
                    {palette.length > 0 && (() => {
                      const total = palette.reduce((s, p) => s + p.count, 0);
                      return <span style={{ color: '#EC4899' }}>· ≈ {total.toLocaleString()} stitches to sew</span>;
                    })()}
                    {isolatedStitchCount > 5 && (
                      <button
                        onClick={cleanupNow}
                        title="Run a smoothing pass to merge scattered loner stitches into surrounding shapes"
                        style={{
                          border: '1.5px solid #EC4899', background: '#FCE7F3', color: '#831843',
                          padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontFamily: 'Nunito, sans-serif',
                        }}
                      >
                        ✨ {isolatedStitchCount} scattered — clean up
                      </button>
                    )}
                  </div>
                  <div className="mono-font" style={{ fontSize: 11, color: '#EC4899', minHeight: 16, fontWeight: 600 }}>
                    {hoveredCell && (
                      <>({hoveredCell.x}, {hoveredCell.y}) · {hoveredCell.masked ? 'outside shape' : hoveredCell.color ? (hoveredCell.dmc ? `DMC ${hoveredCell.dmc} — ${hoveredCell.name}` : `${hoveredCell.idx + 1} — ${hoveredCell.color.toUpperCase()}`) : 'empty'}</>
                    )}
                  </div>
                </div>

                {palette.length > 0 && (
                  <div style={{ marginTop: 18, paddingTop: 16, borderTop: '2px dashed #A855F7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      <div className="display-font glitter-text" style={{ fontSize: 20 }}>
                        ✨ Palette · {palette.length} colors
                      </div>
                      {editMode && (
                        <button className="btn btn-sm" onClick={addPaletteColor} disabled={palette.length >= 20}>+ Add Color</button>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                      {palette.map((p, i) => (
                        <div key={i}
                          className={`palette-swatch ${editMode && selectedColorIdx === i ? 'selected' : ''}`}
                          onClick={() => {
                            if (editMode) setSelectedColorIdx(i);
                            else { setEditingColorIdx(i); setDmcSearch(''); }
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10,
                            background: '#fff', border: '2.5px solid #5B1735', borderRadius: 14,
                            boxShadow: '3px 3px 0 #5B1735' }}>
                          <div style={{
                            width: 42, height: 42, background: p.hex, border: '2px solid #5B1735',
                            borderRadius: 10, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: (0.299*p.rgb[0] + 0.587*p.rgb[1] + 0.114*p.rgb[2]) < 128 ? '#fff' : '#5B1735',
                            fontSize: 14, fontWeight: 800,
                          }}>{SYMBOLS[i % SYMBOLS.length]}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {p.dmc ? (
                              <>
                                <div className="body-font" style={{ fontSize: 12, fontWeight: 700 }}>DMC {p.dmc}</div>
                                <div style={{ fontSize: 10, color: '#831843', marginTop: 1, fontWeight: 500 }}>{p.name}</div>
                                <div className="mono-font" style={{ fontSize: 10, color: '#EC4899', marginTop: 2, fontWeight: 700 }}>{p.count} st</div>
                              </>
                            ) : (
                              <>
                                <div className="mono-font" style={{ fontSize: 12, fontWeight: 700 }}>{p.hex.toUpperCase()}</div>
                                <div className="mono-font" style={{ fontSize: 10, color: '#EC4899', fontWeight: 700 }}>{p.count} st</div>
                              </>
                            )}
                          </div>
                          {editMode && (
                            <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); setEditingColorIdx(i); setDmcSearch(''); }} style={{ padding: '6px 10px' }}>
                              Edit
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#5B1735', fontWeight: 600, fontFamily: 'Nunito' }}>
          💖 {mesh} mesh · {mesh * mesh} stitches per sq inch · made with sparkles 💖
        </div>
      </div>
    </div>
  );
}
