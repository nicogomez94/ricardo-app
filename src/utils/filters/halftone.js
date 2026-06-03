import { createCanvas, getCanvasSourceSize } from './canvas.js';

function applyContrast(value, contrastPercent) {
  const contrast = contrastPercent / 100;
  return Math.max(0, Math.min(255, (value - 128) * contrast + 128));
}

export function applyHalftone(source, {
  dotSize = 8,
  density = 80,
  contrast = 150,
  invert = false,
  garmentMode = 'light',
  angle = 45,
  shape = 'circle',
  backgroundMode = 'transparent',
} = {}) {
  const { w, h } = getCanvasSourceSize(source);

  const tmp = createCanvas(w, h);
  const tmpCtx = tmp.getContext('2d', { willReadFrequently: true });
  tmpCtx.drawImage(source, 0, 0);
  const { data } = tmpCtx.getImageData(0, 0, w, h);

  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  if (backgroundMode !== 'transparent') {
    ctx.fillStyle = garmentMode === 'dark' ? '#111' : '#fff';
    ctx.fillRect(0, 0, w, h);
  }

  ctx.fillStyle = garmentMode === 'dark' ? '#fff' : '#111';

  const step = Math.max(3, dotSize);
  const rad = (angle * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);
  const imgCx = w / 2;
  const imgCy = h / 2;
  const halfDiag = Math.sqrt(w * w + h * h) / 2 + step;

  for (let gj = -halfDiag; gj < halfDiag; gj += step) {
    for (let gi = -halfDiag; gi < halfDiag; gi += step) {
      const ix = imgCx + gi * cosA - gj * sinA;
      const iy = imgCy + gi * sinA + gj * cosA;

      if (ix < 0 || ix >= w || iy < 0 || iy >= h) continue;

      const px = Math.min(Math.floor(ix), w - 1);
      const py = Math.min(Math.floor(iy), h - 1);
      const idx = (py * w + px) * 4;
      const alpha = data[idx + 3] / 255;
      if (alpha < 0.05) continue;

      const rawLum = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      const lum = applyContrast(rawLum, contrast) / 255;
      const inkAmount = garmentMode === 'dark'
        ? (invert ? 1 - lum : lum)
        : (invert ? lum : 1 - lum);
      const r = (step / 2) * inkAmount * (density / 100) * alpha;

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
        ctx.fillRect(ix - step * 0.5, iy - r, step * 0.98, r * 2);
      }
    }
  }

  return canvas;
}
