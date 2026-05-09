import { darkenHex, lightenHex, hexToRgba } from '../utils/colorUtils.js';

export const leatherPatchEffect = {
  id: 'leather',
  label: 'Leather Patch',
  description: 'Parche de cuero grabado con texto en relieve',
  emoji: '🟫',
  defaultColors: {
    primary: '#d4a043',
    secondary: '#7a4a1a',
    background: '#3a1f0a',
  },
  render: renderLeatherPatch,
};

function renderLeatherPatch(canvas, text, opts = {}) {
  const {
    fontFamily = 'Georgia',
    fontSize = 95,
    primary = '#d4a043',
    secondary = '#7a4a1a',
    background = '#3a1f0a',
  } = opts;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Dark outer background
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, W, H);

  // Leather patch shape
  const pad = 20;
  ctx.save();
  roundedRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 10);

  // Leather gradient (light top-left, dark bottom-right)
  const leatherGrad = ctx.createLinearGradient(pad, pad, W - pad, H - pad);
  leatherGrad.addColorStop(0, lightenHex(secondary, 30));
  leatherGrad.addColorStop(0.5, secondary);
  leatherGrad.addColorStop(1, darkenHex(secondary, 25));
  ctx.fillStyle = leatherGrad;
  ctx.fill();

  // Leather grain texture via subtle noise
  ctx.clip();
  applyLeatherGrain(ctx, W, H);
  ctx.restore();

  // Stitched border
  ctx.save();
  ctx.strokeStyle = hexToRgba(primary, 0.8);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([7, 5]);
  roundedRect(ctx, pad + 10, pad + 10, W - (pad + 10) * 2, H - (pad + 10) * 2, 5);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  const fontStr = `bold ${fontSize}px "${fontFamily}", Georgia, serif`;

  // Debossed shadow (dark, slight offset below)
  ctx.save();
  ctx.font = fontStr;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = darkenHex(secondary, 40);
  ctx.globalAlpha = 0.7;
  ctx.fillText(text, W / 2 + 2, H / 2 + 3);
  ctx.restore();

  // Embossed highlight (light, slight offset above)
  ctx.save();
  ctx.font = fontStr;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = hexToRgba(primary, 0.6);
  ctx.fillText(text, W / 2 - 1, H / 2 - 1);
  ctx.restore();

  // Main text in warm gold tone
  ctx.save();
  ctx.font = fontStr;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = primary;
  ctx.fillText(text, W / 2, H / 2);
  ctx.restore();
}

function applyLeatherGrain(ctx, W, H) {
  const imageData = ctx.getImageData(0, 0, W, H);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 10) continue;
    const noise = (Math.random() - 0.5) * 14;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise * 0.7));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise * 0.4));
  }
  ctx.putImageData(imageData, 0, 0);
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
