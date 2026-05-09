import { lightenHex, hexToRgba } from '../utils/colorUtils.js';

export const embroideryEffect = {
  id: 'embroidery',
  label: 'Embroidery',
  description: 'Efecto de bordado con hilos sobre parche',
  emoji: '🧵',
  defaultColors: {
    primary: '#f5c542',
    secondary: '#2c5f2e',
    background: '#1a3a1c',
  },
  render: renderEmbroidery,
};

function renderEmbroidery(canvas, text, opts = {}) {
  const {
    fontFamily = 'Impact',
    fontSize = 110,
    primary = '#f5c542',
    secondary = '#2c5f2e',
    background = '#1a3a1c',
  } = opts;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Patch background
  const pad = 18;
  ctx.save();
  roundedRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 14);
  ctx.fillStyle = secondary;
  ctx.fill();
  ctx.restore();

  // Stitched border (outer dashed line)
  ctx.save();
  ctx.strokeStyle = hexToRgba(primary, 0.65);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  roundedRect(ctx, pad + 9, pad + 9, W - (pad + 9) * 2, H - (pad + 9) * 2, 8);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // --- Thread lines clipped to text shape ---
  // 1. Draw thread lines onto offscreen canvas
  const threadCanvas = document.createElement('canvas');
  threadCanvas.width = W;
  threadCanvas.height = H;
  const tCtx = threadCanvas.getContext('2d');

  const lineSpacing = 4;
  // Horizontal thread passes
  tCtx.strokeStyle = primary;
  tCtx.lineWidth = 1.8;
  for (let y = 0; y < H; y += lineSpacing) {
    tCtx.beginPath();
    tCtx.moveTo(0, y + (y % (lineSpacing * 2) === 0 ? 0.5 : -0.5));
    tCtx.lineTo(W, y + (y % (lineSpacing * 2) === 0 ? 0.5 : -0.5));
    tCtx.stroke();
  }
  // Subtle vertical thread passes (every 3rd)
  tCtx.strokeStyle = hexToRgba(primary, 0.25);
  tCtx.lineWidth = 1;
  for (let x = 0; x < W; x += lineSpacing * 3) {
    tCtx.beginPath();
    tCtx.moveTo(x, 0);
    tCtx.lineTo(x, H);
    tCtx.stroke();
  }

  // 2. Clip thread canvas to text shape via destination-in
  tCtx.globalCompositeOperation = 'destination-in';
  tCtx.font = `900 ${fontSize}px "${fontFamily}", Impact, Arial Black, sans-serif`;
  tCtx.fillStyle = 'white';
  tCtx.textAlign = 'center';
  tCtx.textBaseline = 'middle';
  tCtx.fillText(text, W / 2, H / 2);

  // 3. Composite thread pattern onto main canvas
  ctx.drawImage(threadCanvas, 0, 0);

  // 4. Outline the text for definition (darker thread border)
  ctx.save();
  ctx.font = `900 ${fontSize}px "${fontFamily}", Impact, Arial Black, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = lightenHex(primary, 20);
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.strokeText(text, W / 2, H / 2);
  ctx.restore();
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
