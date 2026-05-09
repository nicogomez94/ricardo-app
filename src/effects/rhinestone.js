import { darkenHex } from '../utils/colorUtils.js';

export const rhinestoneEffect = {
  id: 'rhinestone',
  label: 'Rhinestone',
  description: 'Cristales brillantes que forman el texto sobre tela oscura',
  emoji: '💎',
  defaultColors: {
    primary: '#aad4ff',
    secondary: '#2244aa',
    background: '#0d0d14',
  },
  render: renderRhinestone,
};

function renderRhinestone(canvas, text, opts = {}) {
  const {
    fontFamily = 'Impact',
    fontSize = 110,
    primary = '#aad4ff',
    background = '#0d0d14',
  } = opts;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, W, H);

  // Render text silhouette to offscreen canvas for pixel mask
  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const offCtx = off.getContext('2d');
  offCtx.font = `900 ${fontSize}px "${fontFamily}", Impact, Arial Black, sans-serif`;
  offCtx.fillStyle = 'white';
  offCtx.textAlign = 'center';
  offCtx.textBaseline = 'middle';
  offCtx.fillText(text, W / 2, H / 2);

  const { data: pixels } = offCtx.getImageData(0, 0, W, H);

  // Hex-grid layout of rhinestones
  const r = Math.max(3, fontSize / 18);
  const spacing = r * 2.3;

  for (let row = 0; row * spacing < H + r; row++) {
    const y = r + row * spacing;
    const xOff = row % 2 === 0 ? 0 : spacing / 2;
    for (let col = 0; col * spacing < W + r; col++) {
      const x = r + col * spacing + xOff;
      const px = Math.round(x);
      const py = Math.round(y);
      if (px < 0 || px >= W || py < 0 || py >= H) continue;
      if (pixels[(py * W + px) * 4 + 3] > 100) {
        drawGem(ctx, x, y, r, primary);
      }
    }
  }
}

function drawGem(ctx, x, y, r, color) {
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.38, 0, x, y, r);
  grad.addColorStop(0, 'rgba(255,255,255,0.98)');
  grad.addColorStop(0.18, 'rgba(255,255,255,0.75)');
  grad.addColorStop(0.45, color);
  grad.addColorStop(0.8, darkenHex(color, 55));
  grad.addColorStop(1, 'rgba(0,0,0,0.55)');

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Sparse sparkle cross
  const hash = (Math.floor(x * 17 + y * 31)) % 100;
  if (hash < 20) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.88)';
    ctx.lineWidth = 0.7;
    const sl = r * 1.9;
    ctx.beginPath(); ctx.moveTo(x - sl, y); ctx.lineTo(x + sl, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - sl); ctx.lineTo(x, y + sl); ctx.stroke();
    ctx.restore();
  }
}
