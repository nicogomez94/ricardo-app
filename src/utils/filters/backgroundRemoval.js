import { createCanvas, getCanvasSourceSize } from './canvas.js';

function smoothstep(edge0, edge1, value) {
  if (edge0 === edge1) return value < edge0 ? 0 : 1;
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function removeBackground(source, {
  tolerance = 30,
  softness = 10,
  sampleColor = '#ffffff',
} = {}) {
  const { w, h } = getCanvasSourceSize(source);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0);

  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  const target = {
    r: parseInt(sampleColor.slice(1, 3), 16),
    g: parseInt(sampleColor.slice(3, 5), 16),
    b: parseInt(sampleColor.slice(5, 7), 16),
  };
  const baseThreshold = (tolerance / 100) * 441.67;
  const softRange = Math.max(1, (softness / 100) * 120);
  const hardEdge = Math.max(0, baseThreshold - softRange);
  const softEdge = baseThreshold + softRange;

  for (let i = 0; i < d.length; i += 4) {
    const dr = target.r - d[i];
    const dg = target.g - d[i + 1];
    const db = target.b - d[i + 2];
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);

    if (distance <= hardEdge) {
      d[i + 3] = 0;
    } else if (distance < softEdge) {
      d[i + 3] = Math.round(d[i + 3] * smoothstep(hardEdge, softEdge, distance));
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
