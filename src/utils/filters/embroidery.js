import { createCanvas, getCanvasSourceSize, hexToRgba } from './canvas.js';

export function applyEmbroidery(source, {
  threadColor = '#f5c542',
  patchColor = '#2c5f2e',
  lineSpacing = 4,
} = {}) {
  const { w, h } = getCanvasSourceSize(source);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = patchColor;
  ctx.fillRect(0, 0, w, h);

  const pad = Math.max(6, Math.round(Math.min(w, h) * 0.02));
  ctx.save();
  ctx.strokeStyle = hexToRgba(threadColor, 0.65, '#f5c542');
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  ctx.strokeRect(pad + 8, pad + 8, w - (pad + 8) * 2, h - (pad + 8) * 2);
  ctx.restore();

  const threadCanvas = createCanvas(w, h);
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

  tCtx.strokeStyle = hexToRgba(threadColor, 0.25, '#f5c542');
  tCtx.lineWidth = 1;
  for (let x = 0; x < w; x += spacing * 3) {
    tCtx.beginPath();
    tCtx.moveTo(x, 0);
    tCtx.lineTo(x, h);
    tCtx.stroke();
  }

  tCtx.globalCompositeOperation = 'destination-in';
  tCtx.drawImage(source, 0, 0);
  ctx.drawImage(threadCanvas, 0, 0);

  const shadow = createCanvas(w, h);
  const sCtx = shadow.getContext('2d');
  sCtx.save();
  sCtx.shadowColor = 'rgba(0,0,0,0.45)';
  sCtx.shadowBlur = 7;
  sCtx.shadowOffsetX = 2;
  sCtx.shadowOffsetY = 3;
  sCtx.drawImage(source, 0, 0);
  sCtx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';
  ctx.drawImage(shadow, 0, 0);
  ctx.restore();

  return canvas;
}
