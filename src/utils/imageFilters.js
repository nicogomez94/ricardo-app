import {
  cloneToCanvas,
  DEFAULT_PREVIEW_MAX_SIZE,
  getCanvasSourceSize,
  getFilterOutputSize,
  getFilterStackOutputSize,
  resizeToCanvas,
  scaleCanvas,
} from './filters/canvas.js';
import { applyEnhancement } from './filters/enhancement.js';
import { applyHalftone } from './filters/halftone.js';
import { removeBackground } from './filters/backgroundRemoval.js';
import { applyMetallic } from './filters/metallic.js';
import { applyPuffPrint } from './filters/puffPrint.js';
import { applyEmbroidery } from './filters/embroidery.js';

export {
  DEFAULT_PREVIEW_MAX_SIZE,
  applyEmbroidery,
  applyEnhancement,
  applyHalftone,
  applyMetallic,
  applyPuffPrint,
  getCanvasSourceSize,
  getFilterOutputSize,
  getFilterStackOutputSize,
  removeBackground,
  resizeToCanvas,
};

export function processImage(source, filter, settings = {}) {
  switch (filter) {
    case 'enhancement': return applyEnhancement(source, settings);
    case 'halftone': return applyHalftone(source, settings);
    case 'bgremoval': return removeBackground(source, settings);
    case 'metallic': return applyMetallic(source, settings);
    case 'puff': return applyPuffPrint(source, settings);
    case 'embroidery': return applyEmbroidery(source, settings);
    default: return null;
  }
}

export function cloneFilterStep(step) {
  return {
    filter: step.filter,
    settings: { ...(step.settings || {}) },
  };
}

export function renderFilterStack(source, steps = []) {
  let canvas = cloneToCanvas(source);

  for (const step of steps) {
    const next = processImage(canvas, step.filter, step.settings);
    if (next) canvas = next;
  }

  return canvas;
}

export function getExportQualityScale(exportQuality = 'normal') {
  if (exportQuality === 'print') return 3;
  if (exportQuality === 'hd') return 2;
  return 1;
}

export function processImageForExport(source, filter, settings = {}, exportScale = 1) {
  const processed = processImage(source, filter, settings) || cloneToCanvas(source);
  return exportScale === 1 ? processed : scaleCanvas(processed, exportScale);
}
