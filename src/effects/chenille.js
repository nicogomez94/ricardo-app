import { darkenHex, lightenHex } from '../utils/colorUtils.js';
import { drawFittedImage } from '../utils/imageMode.js';

export const chenilleEffect = {
  id: 'chenille',
  label: 'Chenille',
  description: 'Bordado de lana en relieve, estilo varsity patch',
  emoji: '🎓',
  defaultColors: {
    primary: '#e8382a',
    secondary: '#f5f0e0',
    background: '#f5f0e0',
  },
  render: renderChenille,
};

function renderChenille(canvas, text, opts = {}) {
  const {
    fontFamily = 'Impact',
    fontSize = 110,
    primary = '#e8382a',
    background = '#f5f0e0',
  } = opts;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, W, H);

  // Image mode: draw image with felt-blur outline treatment
  if (opts.uploadedImage) {
    // Blurred colored halo layers to simulate chenille border
    const blurLayers = [
      { blur: 10, color: darkenHex(primary, 50), alpha: 0.7 },
      { blur: 5, color: darkenHex(primary, 25), alpha: 0.8 },
      { blur: 2, color: primary, alpha: 0.9 },
    ];
    for (const layer of blurLayers) {
      ctx.save();
      ctx.filter = `blur(${layer.blur}px)`;
      ctx.globalAlpha = layer.alpha;
      // Draw image tinted by drawing a color rect then compositing
      const offTint = document.createElement('canvas');
      offTint.width = W; offTint.height = H;
      const tCtx = offTint.getContext('2d');
      drawFittedImage(tCtx, opts.uploadedImage, W, H);
      tCtx.globalCompositeOperation = 'source-atop';
      tCtx.fillStyle = layer.color;
      tCtx.fillRect(0, 0, W, H);
      ctx.drawImage(offTint, 0, 0);
      ctx.restore();
    }
    // Draw actual image on top
    ctx.save();
    drawFittedImage(ctx, opts.uploadedImage, W, H);
    ctx.restore();
    applyFeltTexture(ctx, W, H);
    return;
  }

  const fontStr = `900 ${fontSize}px "${fontFamily}", Impact, Arial Black, sans-serif`;

  // Build fuzzy effect: draw multiple blurred layers from outside in
  // Layer stack: dark blur (outer glow/shadow) → mid → bright top
  const layers = [
    { blur: 8, color: darkenHex(primary, 60), offsetY: 3 },
    { blur: 5, color: darkenHex(primary, 35), offsetY: 2 },
    { blur: 3, color: darkenHex(primary, 15), offsetY: 1 },
    { blur: 1.5, color: primary, offsetY: 0 },
    { blur: 0, color: lightenHex(primary, 25), offsetY: -1 },
  ];

  for (const layer of layers) {
    ctx.save();
    ctx.font = fontStr;
    ctx.fillStyle = layer.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.filter = `blur(${layer.blur}px)`;
    ctx.fillText(text, W / 2, H / 2 + layer.offsetY);
    ctx.restore();
  }

  // Fine-grain surface texture using noise via offscreen pixel manipulation
  applyFeltTexture(ctx, W, H);
}

function applyFeltTexture(ctx, W, H) {
  // Get current canvas data
  const imageData = ctx.getImageData(0, 0, W, H);
  const data = imageData.data;

  // Add subtle random noise to non-background pixels
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 20) continue;
    const noise = (Math.random() - 0.5) * 18;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);
}
