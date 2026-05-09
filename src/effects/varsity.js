import { darkenHex, lightenHex, hexToRgba } from '../utils/colorUtils.js';

export const varsityEffect = {
  id: 'varsity',
  label: 'Varsity',
  description: 'Estilo universitario con capas de trazo en colores de equipo',
  emoji: '🏈',
  defaultColors: {
    primary: '#ffd700',
    secondary: '#003087',
    background: '#000000',
  },
  render: renderVarsity,
};

function renderVarsity(canvas, text, opts = {}) {
  const {
    fontFamily = 'Impact',
    fontSize = 110,
    primary = '#ffd700',
    secondary = '#003087',
    background = '#000000',
  } = opts;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, W, H);

  const fontStr = `900 ${fontSize}px "${fontFamily}", Impact, Arial Black, sans-serif`;
  ctx.font = fontStr;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  const cx = W / 2;
  const cy = H / 2;

  // Layer 1: thick outer white stroke (creates separation ring)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = fontSize * 0.18;
  ctx.strokeText(text, cx, cy);

  // Layer 2: secondary color fill stroke
  ctx.strokeStyle = secondary;
  ctx.lineWidth = fontSize * 0.13;
  ctx.strokeText(text, cx, cy);

  // Layer 3: thin inner white ring
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = fontSize * 0.04;
  ctx.strokeText(text, cx, cy);

  // Layer 4: primary color fill
  ctx.fillStyle = primary;
  ctx.fillText(text, cx, cy);

  // Layer 5: top shine — subtle light gradient over the fill
  const offHL = document.createElement('canvas');
  offHL.width = W;
  offHL.height = H;
  const hlCtx = offHL.getContext('2d');
  hlCtx.font = fontStr;
  hlCtx.textAlign = 'center';
  hlCtx.textBaseline = 'middle';

  const grad = hlCtx.createLinearGradient(0, cy - fontSize * 0.55, 0, cy + fontSize * 0.55);
  grad.addColorStop(0, 'rgba(255,255,255,0.28)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.15)');
  hlCtx.fillStyle = grad;
  hlCtx.fillText(text, cx, cy);

  ctx.drawImage(offHL, 0, 0);
}
