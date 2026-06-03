import { createCanvas, getCanvasSourceSize } from './canvas.js';

const PALETTES = {
  gold: ['#2d1800', '#7a4a00', '#c08010', '#e8c040', '#fff4a0', '#e8c040', '#c08010', '#7a4a00', '#2d1800'],
  silver: ['#1a1a24', '#565668', '#9898b0', '#d0d0e4', '#f4f4fc', '#d0d0e4', '#9898b0', '#565668', '#1a1a24'],
  copper: ['#1e0800', '#6b2010', '#a84520', '#d07035', '#f0a060', '#d07035', '#a84520', '#6b2010', '#1e0800'],
  chrome: ['#0c1828', '#2040a0', '#4878d4', '#90c0f0', '#e0f0ff', '#90c0f0', '#4878d4', '#2040a0', '#0c1828'],
};

export function applyMetallic(source, { variant = 'gold' } = {}) {
  const { w, h } = getCanvasSourceSize(source);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, 0, 0);

  const stops = PALETTES[variant] || PALETTES.gold;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  stops.forEach((color, i) => grad.addColorStop(i / (stops.length - 1), color));

  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = 'screen';
  const shine = ctx.createLinearGradient(0, h * 0.08, 0, h * 0.44);
  shine.addColorStop(0, 'rgba(255,255,255,0)');
  shine.addColorStop(0.5, 'rgba(255,255,255,0.26)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(source, 0, 0);
  ctx.globalCompositeOperation = 'source-over';

  return canvas;
}
