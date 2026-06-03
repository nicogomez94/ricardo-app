export const DEFAULT_PREVIEW_MAX_SIZE = 1200;

export function getCanvasSourceSize(source) {
  return {
    w: source.naturalWidth ?? source.videoWidth ?? source.width,
    h: source.naturalHeight ?? source.videoHeight ?? source.height,
  };
}

export function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

export function drawSourceToCanvas(source, width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function cloneToCanvas(source) {
  const { w, h } = getCanvasSourceSize(source);
  return drawSourceToCanvas(source, w, h);
}

export function resizeToCanvas(source, maxSize = DEFAULT_PREVIEW_MAX_SIZE, { allowUpscale = false } = {}) {
  const { w, h } = getCanvasSourceSize(source);
  const rawScale = maxSize / Math.max(w, h);
  const scale = allowUpscale ? rawScale : Math.min(1, rawScale);
  return drawSourceToCanvas(source, w * scale, h * scale);
}

export function scaleCanvas(source, scale = 1) {
  const { w, h } = getCanvasSourceSize(source);
  return drawSourceToCanvas(source, w * scale, h * scale);
}

export function parseHexColor(hex, fallback = '#000000') {
  const clean = /^#[0-9a-f]{6}$/i.test(hex) ? hex : fallback;
  return {
    r: parseInt(clean.slice(1, 3), 16),
    g: parseInt(clean.slice(3, 5), 16),
    b: parseInt(clean.slice(5, 7), 16),
  };
}

export function hexToRgba(hex, alpha, fallback = '#000000') {
  const { r, g, b } = parseHexColor(hex, fallback);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function clampByte(value) {
  return Math.max(0, Math.min(255, value));
}

export function getFilterOutputSize(size, filter, settings = {}) {
  if (filter !== 'enhancement') return size;
  const factor = Math.max(0.1, (settings.scale ?? 100) / 100);
  return {
    w: Math.max(1, Math.round(size.w * factor)),
    h: Math.max(1, Math.round(size.h * factor)),
  };
}

export function getFilterStackOutputSize(sourceSize, steps = []) {
  return steps.reduce(
    (size, step) => getFilterOutputSize(size, step.filter, step.settings),
    sourceSize
  );
}
