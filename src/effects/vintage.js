import { darkenHex, lightenHex } from '../utils/colorUtils.js';

export const vintageEffect = {
  id: 'vintage',
  label: 'Vintage',
  description: 'Efecto gastado y desgastado, look retro de los 90s',
  emoji: '🎞️',
  defaultColors: {
    primary: '#c8860a',
    secondary: '#5a3a1a',
    background: '#f0e6ce',
  },
  render: renderVintage,
};

function renderVintage(canvas, text, opts = {}) {
  const {
    fontFamily = 'Impact',
    fontSize = 110,
    primary = '#c8860a',
    secondary = '#5a3a1a',
    background = '#f0e6ce',
  } = opts;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Parchment background with subtle vignette
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, W, H);

  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  const fontStr = `900 ${fontSize}px "${fontFamily}", Impact, Arial Black, sans-serif`;
  ctx.font = fontStr;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Distressed shadow beneath
  ctx.save();
  ctx.fillStyle = darkenHex(primary, 50);
  ctx.globalAlpha = 0.5;
  ctx.fillText(text, W / 2 + 3, H / 2 + 3);
  ctx.restore();

  // Main text
  ctx.fillStyle = primary;
  ctx.fillText(text, W / 2, H / 2);

  // Thin outline for definition
  ctx.strokeStyle = darkenHex(primary, 40);
  ctx.lineWidth = 1;
  ctx.lineJoin = 'round';
  ctx.strokeText(text, W / 2, H / 2);

  // Wear/distress: erase random pixels inside text region using noise
  applyDistress(ctx, W, H);

  // Halftone dots overlay — classic screen-print texture
  applyHalftone(ctx, W, H, primary);
}

function applyDistress(ctx, W, H) {
  const imageData = ctx.getImageData(0, 0, W, H);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 20) continue;
    const noise = (Math.random() - 0.5) * 22;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    // Randomly erase some pixels for "cracked" look
    if (Math.random() < 0.07) data[i + 3] = Math.max(0, data[i + 3] - 120);
  }
  ctx.putImageData(imageData, 0, 0);
}

function applyHalftone(ctx, W, H, color) {
  // Sparse dot grid over text area for screen-print feel
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = darkenHex(color, 40);
  const dotSpacing = 6;
  for (let x = 0; x < W; x += dotSpacing) {
    for (let y = 0; y < H; y += dotSpacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
