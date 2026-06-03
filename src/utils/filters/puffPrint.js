import {
  clampByte,
  createCanvas,
  getCanvasSourceSize,
  getPuffPrintPadding,
} from './canvas.js';

const ALPHA_THRESHOLD = 18;
const MASK_EDGE_ALPHA = 0.56;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeNumber(value, fallback, min, max) {
  const parsed = Number(value);
  return clamp(Number.isFinite(parsed) ? parsed : fallback, min, max);
}

function getSafeSettings({
  depth = 18,
  highlightOpacity = 72,
  outlineWidth = 5,
  stickerBorder = 4,
  solidify = 74,
} = {}) {
  return {
    depth: Math.round(normalizeNumber(depth, 18, 1, 36)),
    highlightOpacity: normalizeNumber(highlightOpacity, 72, 0, 100),
    outlineWidth: Math.round(normalizeNumber(outlineWidth, 5, 0, 18)),
    stickerBorder: Math.round(normalizeNumber(stickerBorder, 4, 0, 24)),
    solidify: normalizeNumber(solidify, 74, 0, 100),
  };
}

function countMask(mask) {
  let count = 0;
  for (let i = 0; i < mask.length; i += 1) {
    if (mask[i]) count += 1;
  }
  return count;
}

function makeAlphaMask(data) {
  const mask = new Uint8Array(data.length / 4);
  let count = 0;

  for (let i = 0, p = 3; i < mask.length; i += 1, p += 4) {
    if (data[p] > ALPHA_THRESHOLD) {
      mask[i] = 1;
      count += 1;
    }
  }

  return { mask, count };
}

function dilateMask(mask, w, h, radius) {
  if (radius <= 0) return mask.slice();

  const r = Math.max(1, Math.round(radius));
  const temp = new Uint8Array(mask.length);
  const out = new Uint8Array(mask.length);

  for (let y = 0; y < h; y += 1) {
    const row = y * w;
    let hits = 0;

    for (let x = -r; x <= r; x += 1) {
      if (x >= 0 && x < w) hits += mask[row + x];
    }

    for (let x = 0; x < w; x += 1) {
      temp[row + x] = hits > 0 ? 1 : 0;

      const removeX = x - r;
      const addX = x + r + 1;
      if (removeX >= 0 && removeX < w) hits -= mask[row + removeX];
      if (addX >= 0 && addX < w) hits += mask[row + addX];
    }
  }

  for (let x = 0; x < w; x += 1) {
    let hits = 0;

    for (let y = -r; y <= r; y += 1) {
      if (y >= 0 && y < h) hits += temp[y * w + x];
    }

    for (let y = 0; y < h; y += 1) {
      out[y * w + x] = hits > 0 ? 1 : 0;

      const removeY = y - r;
      const addY = y + r + 1;
      if (removeY >= 0 && removeY < h) hits -= temp[removeY * w + x];
      if (addY >= 0 && addY < h) hits += temp[addY * w + x];
    }
  }

  return out;
}

function erodeMask(mask, w, h, radius) {
  if (radius <= 0) return mask.slice();

  const r = Math.max(1, Math.round(radius));
  const windowSize = r * 2 + 1;
  const temp = new Uint8Array(mask.length);
  const out = new Uint8Array(mask.length);

  for (let y = 0; y < h; y += 1) {
    const row = y * w;
    let hits = 0;

    for (let x = -r; x <= r; x += 1) {
      if (x >= 0 && x < w) hits += mask[row + x];
    }

    for (let x = 0; x < w; x += 1) {
      temp[row + x] = hits === windowSize ? 1 : 0;

      const removeX = x - r;
      const addX = x + r + 1;
      if (removeX >= 0 && removeX < w) hits -= mask[row + removeX];
      if (addX >= 0 && addX < w) hits += mask[row + addX];
    }
  }

  for (let x = 0; x < w; x += 1) {
    let hits = 0;

    for (let y = -r; y <= r; y += 1) {
      if (y >= 0 && y < h) hits += temp[y * w + x];
    }

    for (let y = 0; y < h; y += 1) {
      out[y * w + x] = hits === windowSize ? 1 : 0;

      const removeY = y - r;
      const addY = y + r + 1;
      if (removeY >= 0 && removeY < h) hits -= temp[removeY * w + x];
      if (addY >= 0 && addY < h) hits += temp[addY * w + x];
    }
  }

  return out;
}

function subtractMask(a, b) {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i += 1) {
    out[i] = a[i] && !b[i] ? 1 : 0;
  }
  return out;
}

function intersectMask(a, b) {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i += 1) {
    out[i] = a[i] && b[i] ? 1 : 0;
  }
  return out;
}

function makeSolidMaskCanvas(mask, w, h, color, alpha = 255) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(w, h);
  const [r, g, b] = color;

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x;
      const coverage = getMaskEdgeCoverage(mask, w, h, x, y);
      if (!coverage) continue;

      const p = i * 4;
      image.data[p] = r;
      image.data[p + 1] = g;
      image.data[p + 2] = b;
      image.data[p + 3] = Math.round(alpha * coverage);
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas;
}

function getMaskEdgeCoverage(mask, w, h, x, y) {
  const idx = y * w + x;
  if (mask[idx]) return 1;

  let weight = 0;

  for (let dy = -1; dy <= 1; dy += 1) {
    const ny = y + dy;
    if (ny < 0 || ny >= h) continue;

    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;

      const nx = x + dx;
      if (nx < 0 || nx >= w) continue;
      if (!mask[ny * w + nx]) continue;

      weight += dx === 0 || dy === 0 ? 1 : 0.55;
    }
  }

  return Math.min(MASK_EDGE_ALPHA, weight * 0.18);
}

function boostAndPosterizeChannel(value, step) {
  if (value <= 14) return 0;
  if (value >= 241) return 255;
  return clampByte(Math.round(value / step) * step);
}

function prepareSolidColors(sourceData, alphaMask, solidify) {
  const colorStep = Math.round(14 + solidify * 0.42);
  const red = new Uint8ClampedArray(alphaMask.length);
  const green = new Uint8ClampedArray(alphaMask.length);
  const blue = new Uint8ClampedArray(alphaMask.length);
  const filled = new Uint8Array(alphaMask.length);
  let fallbackR = 0;
  let fallbackG = 0;
  let fallbackB = 0;
  let fallbackCount = 0;

  for (let i = 0, p = 0; i < alphaMask.length; i += 1, p += 4) {
    if (!alphaMask[i]) continue;

    const avg = (sourceData[p] + sourceData[p + 1] + sourceData[p + 2]) / 3;
    const contrast = 1.14;
    const saturation = 1.16;
    const r = clampByte(128 + (avg + (sourceData[p] - avg) * saturation - 128) * contrast);
    const g = clampByte(128 + (avg + (sourceData[p + 1] - avg) * saturation - 128) * contrast);
    const b = clampByte(128 + (avg + (sourceData[p + 2] - avg) * saturation - 128) * contrast);

    red[i] = boostAndPosterizeChannel(r, colorStep);
    green[i] = boostAndPosterizeChannel(g, colorStep);
    blue[i] = boostAndPosterizeChannel(b, colorStep);
    filled[i] = 1;
    fallbackR += red[i];
    fallbackG += green[i];
    fallbackB += blue[i];
    fallbackCount += 1;
  }

  return {
    red,
    green,
    blue,
    filled,
    fallback: fallbackCount
      ? [
          Math.round(fallbackR / fallbackCount),
          Math.round(fallbackG / fallbackCount),
          Math.round(fallbackB / fallbackCount),
        ]
      : [220, 220, 220],
  };
}

function spreadSolidColors(channels, targetMask, w, h, maxPasses) {
  const { red, green, blue, filled, fallback } = channels;
  const dirs = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],           [1, 0],
    [-1, 1],  [0, 1],  [1, 1],
  ];

  for (let pass = 0; pass < maxPasses; pass += 1) {
    let additions = 0;

    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const idx = y * w + x;
        if (!targetMask[idx] || filled[idx]) continue;

        let r = 0;
        let g = 0;
        let b = 0;
        let hits = 0;

        for (const [dx, dy] of dirs) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;

          const nIdx = ny * w + nx;
          if (!filled[nIdx]) continue;

          r += red[nIdx];
          g += green[nIdx];
          b += blue[nIdx];
          hits += 1;
        }

        if (!hits) continue;

        red[idx] = Math.round(r / hits);
        green[idx] = Math.round(g / hits);
        blue[idx] = Math.round(b / hits);
        filled[idx] = 1;
        additions += 1;
      }
    }

    if (!additions) break;
  }

  for (let i = 0; i < targetMask.length; i += 1) {
    if (!targetMask[i] || filled[i]) continue;
    red[i] = fallback[0];
    green[i] = fallback[1];
    blue[i] = fallback[2];
    filled[i] = 1;
  }
}

function tintToward(value, target, amount) {
  return clampByte(value + (target - value) * amount);
}

function getNeighborPuffColor(channels, mask, w, h, x, y) {
  let r = 0;
  let g = 0;
  let b = 0;
  let hits = 0;

  for (let dy = -1; dy <= 1; dy += 1) {
    const ny = y + dy;
    if (ny < 0 || ny >= h) continue;

    for (let dx = -1; dx <= 1; dx += 1) {
      const nx = x + dx;
      if (nx < 0 || nx >= w) continue;

      const nIdx = ny * w + nx;
      if (!mask[nIdx]) continue;

      r += channels.red[nIdx];
      g += channels.green[nIdx];
      b += channels.blue[nIdx];
      hits += 1;
    }
  }

  return hits
    ? [Math.round(r / hits), Math.round(g / hits), Math.round(b / hits)]
    : [220, 220, 220];
}

function makePuffSurfaceCanvas(channels, puffMask, bevelMask, w, h, highlightOpacity) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(w, h);
  const highlight = highlightOpacity / 100;

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const idx = y * w + x;
      const coverage = getMaskEdgeCoverage(puffMask, w, h, x, y);
      if (!coverage) continue;

      const edgeColor = puffMask[idx]
        ? [channels.red[idx], channels.green[idx], channels.blue[idx]]
        : getNeighborPuffColor(channels, puffMask, w, h, x, y);

      let [r, g, b] = edgeColor;

      const diagonal = (x / Math.max(1, w)) * 0.62 + (y / Math.max(1, h)) * 0.9;
      const topLeftEdge = (
        x === 0 ||
        y === 0 ||
        !puffMask[idx - 1] ||
        !puffMask[idx - w] ||
        !puffMask[idx - w - 1]
      );
      const bottomRightEdge = (
        x === w - 1 ||
        y === h - 1 ||
        !puffMask[idx + 1] ||
        !puffMask[idx + w] ||
        !puffMask[idx + w + 1]
      );

      if (bevelMask[idx] && topLeftEdge) {
        const amount = 0.32 + highlight * 0.34;
        r = tintToward(r, 255, amount);
        g = tintToward(g, 255, amount);
        b = tintToward(b, 255, amount);
      } else if (bevelMask[idx] && bottomRightEdge) {
        const amount = 0.38;
        r = tintToward(r, 0, amount);
        g = tintToward(g, 0, amount);
        b = tintToward(b, 0, amount);
      } else if (diagonal < 0.42) {
        const amount = 0.2 + highlight * 0.18;
        r = tintToward(r, 255, amount);
        g = tintToward(g, 255, amount);
        b = tintToward(b, 255, amount);
      } else if (diagonal > 0.98) {
        const amount = 0.18;
        r = tintToward(r, 0, amount);
        g = tintToward(g, 0, amount);
        b = tintToward(b, 0, amount);
      }

      const p = idx * 4;
      image.data[p] = r;
      image.data[p + 1] = g;
      image.data[p + 2] = b;
      image.data[p + 3] = Math.round(255 * coverage);
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas;
}

function makeMaskedSourceCanvas(sourceCanvas, mask, w, h) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(makeSolidMaskCanvas(mask, w, h, [255, 255, 255]), 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

function drawDepth(ctx, maskCanvas, depth) {
  for (let i = depth; i > 0; i -= 1) {
    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.drawImage(maskCanvas, i * 0.42, i * 0.68);
    ctx.restore();
  }
}

export function applyPuffPrint(source, settings = {}) {
  const safe = getSafeSettings(settings);
  const { w: sourceW, h: sourceH } = getCanvasSourceSize(source);
  const padding = getPuffPrintPadding(safe);
  const w = sourceW + padding * 2;
  const h = sourceH + padding * 2;
  const sourceCanvas = createCanvas(w, h);
  const sourceCtx = sourceCanvas.getContext('2d');

  sourceCtx.imageSmoothingEnabled = true;
  sourceCtx.imageSmoothingQuality = 'high';
  sourceCtx.drawImage(source, padding, padding, sourceW, sourceH);

  const sourceImage = sourceCtx.getImageData(0, 0, w, h);
  const { mask: alphaMask, count: opaqueCount } = makeAlphaMask(sourceImage.data);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  if (!opaqueCount) return canvas;

  const coreRadius = clamp(Math.round(safe.depth * 0.22), 1, 8);
  const inflateRadius = clamp(Math.round(safe.depth * 0.42), 1, 16);
  const bevelRadius = clamp(Math.round(safe.depth * 0.32), 2, 12);
  let puffCore = erodeMask(alphaMask, w, h, coreRadius);

  if (countMask(puffCore) < opaqueCount * 0.03) {
    puffCore = erodeMask(alphaMask, w, h, 1);
  }

  if (countMask(puffCore) < opaqueCount * 0.015) {
    puffCore = alphaMask.slice();
  }

  const broadOriginalMask = dilateMask(puffCore, w, h, coreRadius);
  const puffMask = dilateMask(broadOriginalMask, w, h, inflateRadius);
  const innerMask = erodeMask(puffMask, w, h, bevelRadius);
  const bevelMask = subtractMask(puffMask, innerMask);
  const flatDetailMask = subtractMask(alphaMask, broadOriginalMask);
  const channels = prepareSolidColors(sourceImage.data, alphaMask, safe.solidify);

  spreadSolidColors(channels, puffMask, w, h, inflateRadius + coreRadius + 2);

  const shadowMask = safe.outlineWidth
    ? dilateMask(puffMask, w, h, Math.max(1, Math.round(safe.outlineWidth * 0.5)))
    : puffMask;
  const shadowCanvas = makeSolidMaskCanvas(shadowMask, w, h, [0, 0, 0], 230);

  drawDepth(ctx, shadowCanvas, safe.depth);

  if (safe.stickerBorder > 0) {
    const stickerMask = dilateMask(puffMask, w, h, safe.outlineWidth + safe.stickerBorder);
    ctx.drawImage(makeSolidMaskCanvas(stickerMask, w, h, [255, 255, 255]), 0, 0);
  }

  if (safe.outlineWidth > 0) {
    const outlineMask = dilateMask(puffMask, w, h, safe.outlineWidth);
    ctx.drawImage(makeSolidMaskCanvas(outlineMask, w, h, [18, 18, 20]), 0, 0);
  }

  ctx.drawImage(makePuffSurfaceCanvas(channels, puffMask, bevelMask, w, h, safe.highlightOpacity), 0, 0);

  const litMask = intersectMask(innerMask, puffMask);
  const highlightCanvas = makeSolidMaskCanvas(litMask, w, h, [255, 255, 255], Math.round(safe.highlightOpacity * 1.35));
  const highlightCtx = highlightCanvas.getContext('2d');
  highlightCtx.globalCompositeOperation = 'destination-in';
  highlightCtx.fillStyle = '#ffffff';
  highlightCtx.fillRect(0, 0, w, Math.round(h * 0.42));
  ctx.globalAlpha = 0.58;
  ctx.drawImage(highlightCanvas, 0, 0);
  ctx.globalAlpha = 1;

  if (countMask(flatDetailMask) > 0) {
    ctx.drawImage(makeMaskedSourceCanvas(sourceCanvas, flatDetailMask, w, h), 0, 0);
  }

  return canvas;
}
