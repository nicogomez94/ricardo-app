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
 * Image Enhancement — brightness, contrast, saturation via CSS filters.
 */
export function applyEnhancement(source, {
  brightness = 100,
  contrast = 100,
  saturation = 100,
} = {}) {
  const { w, h } = getSize(source);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  ctx.drawImage(source, 0, 0);
  ctx.filter = 'none';
  return canvas;
}

/**
 * Halftone — converts image into dot patterns (screen-print simulation).
 */
export function applyHalftone(source, {
  dotSize = 8,
  density = 80,
  contrast = 150,
  invert = false,
  garmentMode = 'light',
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

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const cx = x + step / 2;
      const cy = y + step / 2;
      const px = Math.min(Math.floor(cx), w - 1);
      const py = Math.min(Math.floor(cy), h - 1);
      const lum = data[(py * w + px) * 4] / 255; // 0 = black, 1 = white

      let r;
      if (garmentMode === 'dark') {
        // White dots on dark background: bright areas → bigger dots
        r = (step / 2) * (invert ? 1 - lum : lum) * (density / 100);
      } else {
        // Dark dots on white background: dark areas → bigger dots
        r = (step / 2) * (invert ? lum : 1 - lum) * (density / 100);
      }

      if (r > 0.4) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
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
 * Route processing to the correct filter function.
 */
export function processImage(source, filter, settings) {
  switch (filter) {
    case 'enhancement': return applyEnhancement(source, settings);
    case 'halftone':    return applyHalftone(source, settings);
    case 'bgremoval':   return removeBackground(source, settings);
    case 'metallic':    return applyMetallic(source, settings);
    default:            return null;
  }
}
