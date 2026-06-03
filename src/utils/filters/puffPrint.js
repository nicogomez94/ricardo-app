import { createCanvas, getCanvasSourceSize } from './canvas.js';

export function applyPuffPrint(source, { depth = 8, highlightOpacity = 40 } = {}) {
  const { w, h } = getCanvasSourceSize(source);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  for (let i = depth; i > 0; i--) {
    const t = i / depth;
    ctx.save();
    ctx.globalAlpha = 0.55 * t;
    ctx.filter = `blur(${i * 0.35}px) brightness(${25 + 35 * (1 - t)}%)`;
    ctx.drawImage(source, i * 0.65, i * 0.95);
    ctx.restore();
  }

  ctx.drawImage(source, 0, 0);

  const highlight = createCanvas(w, h);
  const hlCtx = highlight.getContext('2d');
  hlCtx.drawImage(source, 0, 0);
  hlCtx.globalCompositeOperation = 'source-atop';
  const hlAlpha = Math.max(0, Math.min(1, highlightOpacity / 100));
  const hlGrad = hlCtx.createLinearGradient(0, 0, 0, h * 0.55);
  hlGrad.addColorStop(0, `rgba(255,255,255,${hlAlpha})`);
  hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
  hlCtx.fillStyle = hlGrad;
  hlCtx.fillRect(0, 0, w, h);
  ctx.drawImage(highlight, 0, 0);

  return canvas;
}
