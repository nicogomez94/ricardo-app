/**
 * Image processing utilities — demo filters.
 * All processing functions accept a CanvasImageSource (HTMLImageElement | HTMLCanvasElement)
 * and an options object, and return an HTMLCanvasElement.
 */

function getSize(source) {
  return {
    w: source.naturalWidth ?? source.width,
    h: source.naturalHeight ?? source.height,
  };
}

/**
 * Resize source to fit within maxSize (preserves aspect ratio).
 */
export function resizeToCanvas(source, maxSize = 900) {
  const { w, h } = getSize(source);
  const scale = Math.min(1, maxSize / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Image Enhancement — brightness, contrast, saturation, scale, and optional
 * basic vectorization (threshold to solid shapes) via CSS filters + pixel ops.
 */
export function applyEnhancement(source, {
  brightness = 100,
  contrast = 100,
  saturation = 100,
  scale = 100,
  vectorize = false,
  vectorThreshold = 128,
  vectorColor = '#000000',
} = {}) {
  const { w, h } = getSize(source);
  const factor = Math.max(0.1, scale / 100);
  const outW = Math.max(1, Math.round(w * factor));
  const outH = Math.max(1, Math.round(h * factor));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // Draw source without any filter first (ctx.filter is unreliable on canvas sources)
  ctx.drawImage(source, 0, 0, outW, outH);

  // Apply brightness / contrast / saturation via pixel manipulation (reliable cross-browser)
  if (brightness !== 100 || contrast !== 100 || saturation !== 100) {
    const imageData = ctx.getImageData(0, 0, outW, outH);
    const d = imageData.data;
    const br = brightness / 100;
    const cr = contrast / 100;
    const sr = saturation / 100;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i], g = d[i + 1], b = d[i + 2];
      // Brightness
      r *= br; g *= br; b *= br;
      // Contrast (pivot at 128)
      r = (r - 128) * cr + 128;
      g = (g - 128) * cr + 128;
      b = (b - 128) * cr + 128;
      // Saturation (blend toward gray)
      const gray = r * 0.299 + g * 0.587 + b * 0.114;
      r = gray + (r - gray) * sr;
      g = gray + (g - gray) * sr;
      b = gray + (b - gray) * sr;
      d[i]     = Math.max(0, Math.min(255, r));
      d[i + 1] = Math.max(0, Math.min(255, g));
      d[i + 2] = Math.max(0, Math.min(255, b));
    }
    ctx.putImageData(imageData, 0, 0);
  }

  if (vectorize) {
    const imageData = ctx.getImageData(0, 0, outW, outH);
    const d = imageData.data;
    const fgR = parseInt(vectorColor.slice(1, 3), 16);
    const fgG = parseInt(vectorColor.slice(3, 5), 16);
    const fgB = parseInt(vectorColor.slice(5, 7), 16);
    for (let i = 0; i < d.length; i += 4) {
      const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
      if (lum < vectorThreshold) {
        d[i] = fgR; d[i + 1] = fgG; d[i + 2] = fgB;
      } else {
        d[i] = 255; d[i + 1] = 255; d[i + 2] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  return canvas;
}

/**
 * Halftone — converts image into dot patterns (screen-print simulation).
 * Supports angled grids (angle param) and multiple dot shapes for a realistic
 * screen-printing look.
 */
export function applyHalftone(source, {
  dotSize = 8,
  density = 80,
  contrast = 150,
  invert = false,
  garmentMode = 'light',
  angle = 45,
  shape = 'circle',
} = {}) {
  const { w, h } = getSize(source);

  // Get grayscale + contrast-adjusted pixel data
  const tmp = document.createElement('canvas');
  tmp.width = w;
  tmp.height = h;
  const tmpCtx = tmp.getContext('2d');
  tmpCtx.filter = `grayscale(100%) contrast(${contrast}%)`;
  tmpCtx.drawImage(source, 0, 0);
  const { data } = tmpCtx.getImageData(0, 0, w, h);

  // Render halftone grid
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = garmentMode === 'dark' ? '#111' : '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = garmentMode === 'dark' ? '#fff' : '#111';

  const step = Math.max(3, dotSize);
  const rad = (angle * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);

  // Iterate over a rotated grid large enough to cover the whole image
  const imgCx = w / 2;
  const imgCy = h / 2;
  const halfDiag = Math.sqrt(w * w + h * h) / 2 + step;

  for (let gj = -halfDiag; gj < halfDiag; gj += step) {
    for (let gi = -halfDiag; gi < halfDiag; gi += step) {
      // Grid cell center in image space (rotate around image center)
      const ix = imgCx + gi * cosA - gj * sinA;
      const iy = imgCy + gi * sinA + gj * cosA;

      if (ix < 0 || ix >= w || iy < 0 || iy >= h) continue;

      const px = Math.min(Math.floor(ix), w - 1);
      const py = Math.min(Math.floor(iy), h - 1);
      const lum = data[(py * w + px) * 4] / 255; // 0 = black, 1 = white

      let r;
      if (garmentMode === 'dark') {
        r = (step / 2) * (invert ? 1 - lum : lum) * (density / 100);
      } else {
        r = (step / 2) * (invert ? lum : 1 - lum) * (density / 100);
      }

      if (r < 0.4) continue;

      if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(ix, iy, r, 0, Math.PI * 2);
        ctx.fill();
      } else if (shape === 'square') {
        ctx.fillRect(ix - r, iy - r, r * 2, r * 2);
      } else if (shape === 'diamond') {
        ctx.save();
        ctx.translate(ix, iy);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7);
        ctx.restore();
      } else if (shape === 'line') {
        // Horizontal lines whose thickness is proportional to luminosity
        ctx.fillRect(ix - step * 0.5, iy - r, step * 0.98, r * 2);
      }
    }
  }

  return canvas;
}

/**
 * Background Removal — makes white/near-white pixels transparent.
 */
export function removeBackground(source, { tolerance = 30 } = {}) {
  const { w, h } = getSize(source);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, 0, 0);

  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  // Euclidean distance threshold in RGB space from (255, 255, 255)
  const threshold = (tolerance / 100) * 441.67; // sqrt(3) * 255 ≈ 441.67

  for (let i = 0; i < d.length; i += 4) {
    const dr = 255 - d[i];
    const dg = 255 - d[i + 1];
    const db = 255 - d[i + 2];
    if (Math.sqrt(dr * dr + dg * dg + db * db) < threshold) {
      d[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Metallic Effects — overlays gradient to simulate metallic sheen.
 */
export function applyMetallic(source, { variant = 'gold' } = {}) {
  const { w, h } = getSize(source);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, 0, 0);

  const palettes = {
    gold:   ['#2d1800', '#7a4a00', '#c08010', '#e8c040', '#fff4a0', '#e8c040', '#c08010', '#7a4a00', '#2d1800'],
    silver: ['#1a1a24', '#565668', '#9898b0', '#d0d0e4', '#f4f4fc', '#d0d0e4', '#9898b0', '#565668', '#1a1a24'],
    copper: ['#1e0800', '#6b2010', '#a84520', '#d07035', '#f0a060', '#d07035', '#a84520', '#6b2010', '#1e0800'],
    chrome: ['#0c1828', '#2040a0', '#4878d4', '#90c0f0', '#e0f0ff', '#90c0f0', '#4878d4', '#2040a0', '#0c1828'],
  };

  const stops = palettes[variant] || palettes.gold;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  stops.forEach((color, i) => grad.addColorStop(i / (stops.length - 1), color));

  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Horizontal highlight streak
  ctx.globalCompositeOperation = 'screen';
  const shine = ctx.createLinearGradient(0, h * 0.1, 0, h * 0.42);
  shine.addColorStop(0, 'rgba(255,255,255,0)');
  shine.addColorStop(0.5, 'rgba(255,255,255,0.22)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

/**
 * Puff Print — simulates inflated 3D relief by stacking depth shadows + top highlight.
 */
export function applyPuffPrint(source, { depth = 8, highlightOpacity = 40 } = {}) {
  const { w, h } = getSize(source);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Depth shadow layers (deepest first)
  for (let i = depth; i > 0; i--) {
    const t = i / depth; // 1 = deepest
    ctx.save();
    ctx.globalAlpha = 0.55 * t;
    ctx.filter = `blur(${i * 0.35}px) brightness(${25 + 35 * (1 - t)}%)`;
    ctx.drawImage(source, i * 0.65, i * 0.95);
    ctx.restore();
  }

  // Main image
  ctx.drawImage(source, 0, 0);

  // Top highlight gradient clipped to image shape
  const offHL = document.createElement('canvas');
  offHL.width = w;
  offHL.height = h;
  const hlCtx = offHL.getContext('2d');
  hlCtx.drawImage(source, 0, 0);
  hlCtx.globalCompositeOperation = 'source-atop';
  const hlAlpha = Math.max(0, Math.min(1, highlightOpacity / 100));
  const hlGrad = hlCtx.createLinearGradient(0, 0, 0, h * 0.55);
  hlGrad.addColorStop(0, `rgba(255,255,255,${hlAlpha})`);
  hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
  hlCtx.fillStyle = hlGrad;
  hlCtx.fillRect(0, 0, w, h);
  ctx.drawImage(offHL, 0, 0);

  return canvas;
}

/**
 * Embroidery — applies horizontal thread lines + patch background to the image.
 */
export function applyEmbroidery(source, {
  threadColor = '#f5c542',
  patchColor = '#2c5f2e',
  lineSpacing = 4,
} = {}) {
  const { w, h } = getSize(source);

  // Helper: hex → rgba string
  function hexRgba(hex, alpha) {
    const hx = hex.replace('#', '');
    const r = parseInt(hx.slice(0, 2), 16);
    const g = parseInt(hx.slice(2, 4), 16);
    const b = parseInt(hx.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // 1. Patch background
  ctx.fillStyle = patchColor;
  ctx.fillRect(0, 0, w, h);

  // 2. Stitched border
  const pad = Math.max(6, Math.round(Math.min(w, h) * 0.02));
  ctx.save();
  ctx.strokeStyle = hexRgba(threadColor, 0.65);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  ctx.strokeRect(pad + 8, pad + 8, w - (pad + 8) * 2, h - (pad + 8) * 2);
  ctx.setLineDash([]);
  ctx.restore();

  // 3. Thread lines clipped to the image's alpha
  const threadCanvas = document.createElement('canvas');
  threadCanvas.width = w;
  threadCanvas.height = h;
  const tCtx = threadCanvas.getContext('2d');

  const spacing = Math.max(2, Math.round(lineSpacing));
  tCtx.strokeStyle = threadColor;
  tCtx.lineWidth = 1.8;
  for (let y = 0; y < h; y += spacing) {
    tCtx.beginPath();
    const wobble = y % (spacing * 2) === 0 ? 0.5 : -0.5;
    tCtx.moveTo(0, y + wobble);
    tCtx.lineTo(w, y + wobble);
    tCtx.stroke();
  }
  tCtx.strokeStyle = hexRgba(threadColor, 0.25);
  tCtx.lineWidth = 1;
  for (let x = 0; x < w; x += spacing * 3) {
    tCtx.beginPath();
    tCtx.moveTo(x, 0);
    tCtx.lineTo(x, h);
    tCtx.stroke();
  }

  // Clip thread lines to image shape
  tCtx.globalCompositeOperation = 'destination-in';
  tCtx.drawImage(source, 0, 0);

  ctx.drawImage(threadCanvas, 0, 0);

  // 4. Subtle drop shadow for depth (draw image silhouette under thread layer)
  const offShadow = document.createElement('canvas');
  offShadow.width = w;
  offShadow.height = h;
  const sCtx = offShadow.getContext('2d');
  sCtx.save();
  sCtx.shadowColor = 'rgba(0,0,0,0.45)';
  sCtx.shadowBlur = 7;
  sCtx.shadowOffsetX = 2;
  sCtx.shadowOffsetY = 3;
  sCtx.drawImage(source, 0, 0);
  sCtx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';
  ctx.drawImage(offShadow, 0, 0);
  ctx.restore();

  return canvas;
}

/**
 * Route processing to the correct filter function.
 */
export function processImage(source, filter, settings) {
  switch (filter) {
    case 'enhancement': return applyEnhancement(source, settings);
    case 'halftone':    return applyHalftone(source, settings);
    case 'bgremoval':   return removeBackground(source, settings);
    case 'metallic':    return applyMetallic(source, settings);
    case 'puff':        return applyPuffPrint(source, settings);
    case 'embroidery':  return applyEmbroidery(source, settings);
    default:            return null;
  }
}

/**
 * Re-render the processed result at a higher export scale (for print quality).
 * exportScale: 1 = normal, 2 = HD, 3 = ~300 DPI simulation.
 */
export function processImageForExport(source, filter, settings, exportScale = 1) {
  if (filter !== 'enhancement' || exportScale === 1) {
    return processImage(source, filter, settings);
  }
  // Scale up the enhancement output by the export multiplier
  const enhanced = applyEnhancement(source, settings);
  if (exportScale === 1) return enhanced;
  const { w, h } = getSize(enhanced);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * exportScale);
  canvas.height = Math.round(h * exportScale);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(enhanced, 0, 0, canvas.width, canvas.height);
  return canvas;
}
