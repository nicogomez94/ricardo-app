import { clampByte, createCanvas, getCanvasSourceSize, parseHexColor } from './canvas.js';

export function applyEnhancement(source, {
  brightness = 100,
  contrast = 100,
  saturation = 100,
  scale = 100,
  vectorize = false,
  vectorThreshold = 128,
  vectorColor = '#000000',
} = {}) {
  const { w, h } = getCanvasSourceSize(source);
  const factor = Math.max(0.1, scale / 100);
  const outW = Math.max(1, Math.round(w * factor));
  const outH = Math.max(1, Math.round(h * factor));

  const canvas = createCanvas(outW, outH);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, outW, outH);

  if (brightness !== 100 || contrast !== 100 || saturation !== 100) {
    const imageData = ctx.getImageData(0, 0, outW, outH);
    const d = imageData.data;
    const br = brightness / 100;
    const cr = contrast / 100;
    const sr = saturation / 100;

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];

      r *= br;
      g *= br;
      b *= br;

      r = (r - 128) * cr + 128;
      g = (g - 128) * cr + 128;
      b = (b - 128) * cr + 128;

      const gray = r * 0.299 + g * 0.587 + b * 0.114;
      r = gray + (r - gray) * sr;
      g = gray + (g - gray) * sr;
      b = gray + (b - gray) * sr;

      d[i] = clampByte(r);
      d[i + 1] = clampByte(g);
      d[i + 2] = clampByte(b);
    }
    ctx.putImageData(imageData, 0, 0);
  }

  if (vectorize) {
    const imageData = ctx.getImageData(0, 0, outW, outH);
    const d = imageData.data;
    const fg = parseHexColor(vectorColor);

    for (let i = 0; i < d.length; i += 4) {
      const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
      if (lum < vectorThreshold) {
        d[i] = fg.r;
        d[i + 1] = fg.g;
        d[i + 2] = fg.b;
      } else {
        d[i] = 255;
        d[i + 1] = 255;
        d[i + 2] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  return canvas;
}
