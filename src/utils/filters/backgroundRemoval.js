import { clampByte, createCanvas, getCanvasSourceSize, parseHexColor } from './canvas.js';

const RGB_MAX_DISTANCE = Math.sqrt(255 * 255 * 3);

function smoothstep(edge0, edge1, value) {
  if (edge0 === edge1) return value < edge0 ? 0 : 1;
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function colorDistance(data, offset, target) {
  const dr = target.r - data[offset];
  const dg = target.g - data[offset + 1];
  const db = target.b - data[offset + 2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function getEdgeSamplingConfig(w, h) {
  const minSide = Math.min(w, h);
  const maxSide = Math.max(w, h);

  return {
    band: Math.max(1, Math.min(24, Math.round(minSide * 0.035))),
    corner: Math.max(2, Math.min(36, Math.round(minSide * 0.06))),
    stride: Math.max(1, Math.floor(maxSide / 600)),
  };
}

function forEachEdgeSample(w, h, visit) {
  const { band, corner, stride } = getEdgeSamplingConfig(w, h);

  for (let y = 0; y < band; y += 1) {
    const bottomY = h - 1 - y;
    for (let x = 0; x < w; x += stride) {
      visit(x, y, 1);
      if (bottomY !== y) visit(x, bottomY, 1);
    }
  }

  for (let x = 0; x < band; x += 1) {
    const rightX = w - 1 - x;
    for (let y = 0; y < h; y += stride) {
      visit(x, y, 1);
      if (rightX !== x) visit(rightX, y, 1);
    }
  }

  const corners = [
    [0, 0],
    [Math.max(0, w - corner), 0],
    [0, Math.max(0, h - corner)],
    [Math.max(0, w - corner), Math.max(0, h - corner)],
  ];

  corners.forEach(([startX, startY]) => {
    for (let y = startY; y < Math.min(h, startY + corner); y += stride) {
      for (let x = startX; x < Math.min(w, startX + corner); x += stride) {
        visit(x, y, 1.75);
      }
    }
  });
}

function addColorSample(buckets, data, offset, weight) {
  const alpha = data[offset + 3] / 255;
  if (alpha < 0.05) return;

  const r = data[offset];
  const g = data[offset + 1];
  const b = data[offset + 2];
  const sampleWeight = weight * alpha;
  const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
  const bucket = buckets.get(key) || { weight: 0, r: 0, g: 0, b: 0 };

  bucket.weight += sampleWeight;
  bucket.r += r * sampleWeight;
  bucket.g += g * sampleWeight;
  bucket.b += b * sampleWeight;
  buckets.set(key, bucket);
}

function getDominantEdgeColor(data, w, h, fallback) {
  const buckets = new Map();

  forEachEdgeSample(w, h, (x, y, weight) => {
    addColorSample(buckets, data, (y * w + x) * 4, weight);
  });

  let dominant = null;
  buckets.forEach((bucket) => {
    if (!dominant || bucket.weight > dominant.weight) dominant = bucket;
  });

  if (!dominant || dominant.weight <= 0) return fallback;

  const firstPass = {
    r: dominant.r / dominant.weight,
    g: dominant.g / dominant.weight,
    b: dominant.b / dominant.weight,
  };
  const refineDistance = 72;
  const refined = { weight: 0, r: 0, g: 0, b: 0 };

  forEachEdgeSample(w, h, (x, y, weight) => {
    const offset = (y * w + x) * 4;
    const alpha = data[offset + 3] / 255;
    if (alpha < 0.05) return;
    if (colorDistance(data, offset, firstPass) > refineDistance) return;

    const sampleWeight = weight * alpha;
    refined.weight += sampleWeight;
    refined.r += data[offset] * sampleWeight;
    refined.g += data[offset + 1] * sampleWeight;
    refined.b += data[offset + 2] * sampleWeight;
  });

  if (refined.weight <= 0) return firstPass;

  return {
    r: refined.r / refined.weight,
    g: refined.g / refined.weight,
    b: refined.b / refined.weight,
  };
}

function getRemovalStrength(data, offset, target, hardEdge, softEdge) {
  if (data[offset + 3] <= 0) return 0;

  const distance = colorDistance(data, offset, target);
  if (distance <= hardEdge) return 1;
  if (distance >= softEdge) return 0;
  return 1 - smoothstep(hardEdge, softEdge, distance);
}

function applyRemovalToPixel(data, offset, target, removalStrength, cleanup) {
  const originalAlpha = data[offset + 3];
  if (originalAlpha <= 0 || removalStrength <= 0) return;

  const keepStrength = 1 - removalStrength;
  const nextAlpha = Math.round(originalAlpha * keepStrength);
  const alphaTrim = Math.round(cleanup * 10);

  if (nextAlpha <= alphaTrim) {
    data[offset + 3] = 0;
    return;
  }

  if (cleanup > 0 && removalStrength > 0.01) {
    const backgroundShare = Math.min(0.95, removalStrength * cleanup);
    const foregroundShare = Math.max(0.08, 1 - backgroundShare);

    data[offset] = clampByte((data[offset] - target.r * backgroundShare) / foregroundShare);
    data[offset + 1] = clampByte((data[offset + 1] - target.g * backgroundShare) / foregroundShare);
    data[offset + 2] = clampByte((data[offset + 2] - target.b * backgroundShare) / foregroundShare);
  }

  data[offset + 3] = nextAlpha;
}

function buildEdgeConnectedMask(strengths, w, h) {
  const total = w * h;
  const connected = new Uint8Array(total);
  const queue = new Int32Array(total);
  let read = 0;
  let write = 0;

  const enqueue = (idx) => {
    if (!strengths[idx] || connected[idx]) return;
    connected[idx] = 1;
    queue[write] = idx;
    write += 1;
  };

  for (let x = 0; x < w; x += 1) {
    enqueue(x);
    enqueue((h - 1) * w + x);
  }

  for (let y = 1; y < h - 1; y += 1) {
    enqueue(y * w);
    enqueue(y * w + w - 1);
  }

  while (read < write) {
    const idx = queue[read];
    read += 1;

    const x = idx % w;
    const y = Math.floor(idx / w);
    if (x > 0) enqueue(idx - 1);
    if (x < w - 1) enqueue(idx + 1);
    if (y > 0) enqueue(idx - w);
    if (y < h - 1) enqueue(idx + w);
  }

  return connected;
}

export function removeBackground(source, {
  tolerance = 30,
  softness = 12,
  edgeCleanup = 55,
  sampleMode = 'auto',
  sampleColor = '#ffffff',
  removeInterior = true,
} = {}) {
  const { w, h } = getCanvasSourceSize(source);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0);

  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  const fallbackTarget = parseHexColor(sampleColor, '#ffffff');
  const target = sampleMode === 'auto'
    ? getDominantEdgeColor(d, w, h, fallbackTarget)
    : fallbackTarget;
  const baseThreshold = (Math.max(1, tolerance) / 100) * RGB_MAX_DISTANCE;
  const softRange = Math.max(1, (Math.max(0, softness) / 100) * 150);
  const hardEdge = Math.max(0, baseThreshold - softRange);
  const softEdge = baseThreshold + softRange;
  const cleanup = clamp01(edgeCleanup / 100);

  if (removeInterior) {
    for (let offset = 0; offset < d.length; offset += 4) {
      const strength = getRemovalStrength(d, offset, target, hardEdge, softEdge);
      applyRemovalToPixel(d, offset, target, strength, cleanup);
    }
  } else {
    const total = w * h;
    const strengths = new Uint8Array(total);

    for (let pixel = 0, offset = 0; pixel < total; pixel += 1, offset += 4) {
      strengths[pixel] = Math.round(
        getRemovalStrength(d, offset, target, hardEdge, softEdge) * 255
      );
    }

    const connected = buildEdgeConnectedMask(strengths, w, h);

    for (let pixel = 0, offset = 0; pixel < total; pixel += 1, offset += 4) {
      if (!connected[pixel]) continue;
      applyRemovalToPixel(d, offset, target, strengths[pixel] / 255, cleanup);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
