import { darkenHex, lightenHex } from '../utils/colorUtils.js';
import { drawFittedImage } from '../utils/imageMode.js';

export const puffPrintEffect = {
  id: 'puff',
  label: 'Puff Print',
  description: 'Impresión 3D inflada con relieve visible',
  emoji: '🫧',
  defaultColors: {
    primary: '#ff6b35',
    secondary: '#8b2500',
    background: '#111111',
  },
  render: renderPuffPrint,
};

function renderPuffPrint(canvas, text, opts = {}) {
  const {
    fontFamily = 'Impact',
    fontSize = 110,
    primary = '#ff6b35',
    background = '#111111',
  } = opts;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, W, H);

  // Image mode: draw image with puff depth shadow + highlight
  if (opts.uploadedImage) {
    const depth = 8;
    for (let i = depth; i > 0; i--) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.filter = `blur(${i * 0.5}px)`;
      const offD = document.createElement('canvas');
      offD.width = W; offD.height = H;
      const dCtx = offD.getContext('2d');
      drawFittedImage(dCtx, opts.uploadedImage, W, H);
      dCtx.globalCompositeOperation = 'source-atop';
      dCtx.fillStyle = darkenHex(primary, Math.round((i / depth) * 70));
      dCtx.fillRect(0, 0, W, H);
      ctx.drawImage(offD, i * 0.6, i * 0.9);
      ctx.restore();
    }
    // Draw image with primary tint
    const offMain = document.createElement('canvas');
    offMain.width = W; offMain.height = H;
    const mCtx = offMain.getContext('2d');
    drawFittedImage(mCtx, opts.uploadedImage, W, H);
    ctx.drawImage(offMain, 0, 0);
    // Top highlight
    const offHL = document.createElement('canvas');
    offHL.width = W; offHL.height = H;
    const hlCtx = offHL.getContext('2d');
    drawFittedImage(hlCtx, opts.uploadedImage, W, H);
    hlCtx.globalCompositeOperation = 'source-atop';
    const hlGrad = hlCtx.createLinearGradient(0, 0, 0, H * 0.6);
    hlGrad.addColorStop(0, 'rgba(255,255,255,0.45)');
    hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
    hlCtx.fillStyle = hlGrad;
    hlCtx.fillRect(0, 0, W, H);
    ctx.drawImage(offHL, 0, 0);
    return;
  }

  const fontStr = `900 ${fontSize}px "${fontFamily}", Impact, Arial Black, sans-serif`;
  const depth = Math.round(fontSize / 8);

  ctx.font = fontStr;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw depth layers from deepest to shallowest
  for (let i = depth; i > 0; i--) {
    const t = i / depth; // 1 = deepest, near 0 = top
    const shade = darkenHex(primary, Math.round(t * 80));
    ctx.save();
    ctx.fillStyle = shade;
    ctx.fillText(text, W / 2 + i * 0.6, H / 2 + i * 0.9);
    ctx.restore();
  }

  // Main fill
  ctx.save();
  ctx.fillStyle = primary;
  ctx.fillText(text, W / 2, H / 2);
  ctx.restore();

  // Top highlight strip — simulate light hitting the puffed surface
  const offHL = document.createElement('canvas');
  offHL.width = W;
  offHL.height = H;
  const hlCtx = offHL.getContext('2d');
  hlCtx.font = fontStr;
  hlCtx.fillStyle = 'white';
  hlCtx.textAlign = 'center';
  hlCtx.textBaseline = 'middle';
  hlCtx.fillText(text, W / 2, H / 2);

  // Mask top 35% of text height as a linear gradient fade
  hlCtx.globalCompositeOperation = 'destination-in';
  const hlGrad = hlCtx.createLinearGradient(0, H / 2 - fontSize * 0.6, 0, H / 2);
  hlGrad.addColorStop(0, 'rgba(255,255,255,0.45)');
  hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
  hlCtx.fillStyle = hlGrad;
  hlCtx.fillRect(0, 0, W, H);

  ctx.drawImage(offHL, 0, 0);
}
