import { darkenHex, lightenHex } from '../utils/colorUtils.js';

export const pvcEffect = {
  id: 'pvc',
  label: 'PVC / Rubber',
  description: 'Silicona moldeada con acabado glossy y biselado',
  emoji: '🔵',
  defaultColors: {
    primary: '#2266cc',
    secondary: '#ffffff',
    background: '#1a1a1a',
  },
  render: renderPVC,
};

function renderPVC(canvas, text, opts = {}) {
  const {
    fontFamily = 'Impact',
    fontSize = 110,
    primary = '#2266cc',
    background = '#1a1a1a',
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

  // Base fill
  ctx.fillStyle = primary;
  ctx.fillText(text, W / 2, H / 2);

  // Bevel bottom-right shadow
  const offShadow = document.createElement('canvas');
  offShadow.width = W;
  offShadow.height = H;
  const sCtx = offShadow.getContext('2d');
  sCtx.font = fontStr;
  sCtx.textAlign = 'center';
  sCtx.textBaseline = 'middle';

  // Dark bevel using destination-in on gradient rect
  sCtx.fillStyle = darkenHex(primary, 60);
  sCtx.fillText(text, W / 2, H / 2);

  sCtx.globalCompositeOperation = 'destination-in';
  const bevelGrad = sCtx.createLinearGradient(
    W / 2 - fontSize, H / 2 - fontSize * 0.6,
    W / 2 + fontSize, H / 2 + fontSize * 0.6
  );
  bevelGrad.addColorStop(0, 'rgba(0,0,0,0)');
  bevelGrad.addColorStop(0.55, 'rgba(0,0,0,0)');
  bevelGrad.addColorStop(1, 'rgba(0,0,0,0.9)');
  sCtx.fillStyle = bevelGrad;
  sCtx.fillRect(0, 0, W, H);
  ctx.drawImage(offShadow, 0, 0);

  // Gloss highlight — top edge
  const offGloss = document.createElement('canvas');
  offGloss.width = W;
  offGloss.height = H;
  const gCtx = offGloss.getContext('2d');
  gCtx.font = fontStr;
  gCtx.textAlign = 'center';
  gCtx.textBaseline = 'middle';

  const glossGrad = gCtx.createLinearGradient(0, H / 2 - fontSize * 0.6, 0, H / 2 + fontSize * 0.1);
  glossGrad.addColorStop(0, 'rgba(255,255,255,0.72)');
  glossGrad.addColorStop(0.4, 'rgba(255,255,255,0.18)');
  glossGrad.addColorStop(1, 'rgba(255,255,255,0)');
  gCtx.fillStyle = glossGrad;
  gCtx.fillText(text, W / 2, H / 2);

  gCtx.globalCompositeOperation = 'destination-in';
  gCtx.fillStyle = 'white';
  gCtx.fillText(text, W / 2, H / 2);

  ctx.drawImage(offGloss, 0, 0);

  // Thin outer ring
  ctx.strokeStyle = lightenHex(primary, 30);
  ctx.lineWidth = 1.5;
  ctx.strokeText(text, W / 2, H / 2);
}
