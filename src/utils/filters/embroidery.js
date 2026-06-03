import {
  clampByte,
  createCanvas,
  getCanvasSourceSize,
  hexToRgba,
  parseHexColor,
} from './canvas.js';

const ALPHA_THRESHOLD = 18;
const SOURCE_CACHE = new WeakMap();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeNumber(value, fallback, min, max) {
  const parsed = Number(value);
  return clamp(Number.isFinite(parsed) ? parsed : fallback, min, max);
}

function rgba({ r, g, b }, alpha = 1) {
  return `rgba(${clampByte(r)},${clampByte(g)},${clampByte(b)},${alpha})`;
}

function mixChannel(a, b, amount) {
  return Math.round(a + (b - a) * amount);
}

function mixColor(a, b, amount) {
  return {
    r: mixChannel(a.r, b.r, amount),
    g: mixChannel(a.g, b.g, amount),
    b: mixChannel(a.b, b.b, amount),
  };
}

function scaleColor(color, amount) {
  return {
    r: clampByte(Math.round(color.r * amount)),
    g: clampByte(Math.round(color.g * amount)),
    b: clampByte(Math.round(color.b * amount)),
  };
}

function lightenColor(color, amount) {
  return mixColor(color, { r: 255, g: 255, b: 255 }, amount);
}

function darkenColor(color, amount) {
  return mixColor(color, { r: 0, g: 0, b: 0 }, amount);
}

function luminance(r, g, b) {
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

function drawSourceCanvas(source, w, h) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, w, h);
  return canvas;
}

function buildSourceField(sourceCanvas, w, h) {
  const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  const { data } = ctx.getImageData(0, 0, w, h);
  const count = w * h;
  const alpha = new Uint8Array(count);
  const lum = new Uint8ClampedArray(count);
  const edge = new Uint8ClampedArray(count);
  const alphaEdge = new Uint8ClampedArray(count);

  for (let i = 0, p = 0; i < count; i += 1, p += 4) {
    alpha[i] = data[p + 3] > ALPHA_THRESHOLD ? 1 : 0;
    lum[i] = Math.round(luminance(data[p], data[p + 1], data[p + 2]));
  }

  for (let y = 1; y < h - 1; y += 1) {
    const row = y * w;

    for (let x = 1; x < w - 1; x += 1) {
      const i = row + x;
      const gx = lum[i + 1] - lum[i - 1];
      const gy = lum[i + w] - lum[i - w];
      const ax =
        Math.abs(alpha[i + 1] - alpha[i - 1]) +
        Math.abs(alpha[i + w] - alpha[i - w]);

      edge[i] = clampByte(Math.round(Math.hypot(gx, gy) * 1.25 + ax * 120));
      alphaEdge[i] = ax > 0 ? 255 : 0;
    }
  }

  return { data, alpha, lum, edge, alphaEdge, w, h };
}

function getSourceAssets(source, w, h) {
  const cached = SOURCE_CACHE.get(source);
  if (cached?.w === w && cached?.h === h) return cached;

  const sourceCanvas = drawSourceCanvas(source, w, h);
  const field = buildSourceField(sourceCanvas, w, h);
  const assets = {
    w,
    h,
    sourceCanvas,
    field,
    maskCanvas: makeMaskCanvas(field),
    underlayByThread: new Map(),
  };

  SOURCE_CACHE.set(source, assets);
  return assets;
}

function makeMaskCanvas(field) {
  const { alpha, w, h } = field;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(w, h);

  for (let i = 0, p = 0; i < alpha.length; i += 1, p += 4) {
    if (!alpha[i]) continue;
    image.data[p] = 255;
    image.data[p + 1] = 255;
    image.data[p + 2] = 255;
    image.data[p + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);
  return canvas;
}

function getThreadColor(field, idx, threadRgb, extraEdge = 0) {
  const p = idx * 4;
  const source = {
    r: field.data[p],
    g: field.data[p + 1],
    b: field.data[p + 2],
  };
  const lum01 = field.lum[idx] / 255;
  const darkness = 1 - lum01;
  const chroma = Math.max(source.r, source.g, source.b) - Math.min(source.r, source.g, source.b);
  const edge01 = clamp((field.edge[idx] + extraEdge) / 255, 0, 1);
  const sourceWeight = clamp(0.16 + chroma / 950 + darkness * 0.18 + edge01 * 0.16, 0.12, 0.48);
  const shade = clamp(0.48 + lum01 * 0.72 - edge01 * 0.22, 0.24, 1.18);
  const tinted = mixColor(threadRgb, source, sourceWeight);

  return scaleColor(tinted, shade);
}

function getEdgeThreadColor(field, idx, threadRgb) {
  const base = getThreadColor(field, idx, threadRgb, 64);
  const p = idx * 4;
  const source = {
    r: field.data[p],
    g: field.data[p + 1],
    b: field.data[p + 2],
  };
  const brightSource = lightenColor(source, 0.34);
  return lightenColor(mixColor(base, brightSource, 0.42), 0.26);
}

function makeUnderlayCanvas(field, maskCanvas, threadRgb) {
  const { alpha, data, edge, lum, w, h } = field;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(w, h);

  for (let i = 0, p = 0; i < alpha.length; i += 1, p += 4) {
    if (!alpha[i]) continue;

    const color = getThreadColor(field, i, threadRgb, edge[i] > 42 ? 22 : 0);
    const detail = clamp(edge[i] / 255, 0, 1);
    const darkDetail = lum[i] < 72 ? 0.2 : 0;
    const sourceAlpha = data[p + 3] / 255;

    image.data[p] = color.r;
    image.data[p + 1] = color.g;
    image.data[p + 2] = color.b;
    image.data[p + 3] = Math.round(255 * sourceAlpha * clamp(0.22 + detail * 0.24 + darkDetail, 0.18, 0.58));
  }

  ctx.putImageData(image, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskCanvas, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

function getUnderlayCanvas(assets, threadColor, threadRgb) {
  const key = `${threadRgb.r},${threadRgb.g},${threadRgb.b}:${threadColor}`;
  const cached = assets.underlayByThread.get(key);
  if (cached) return cached;

  const canvas = makeUnderlayCanvas(assets.field, assets.maskCanvas, threadRgb);
  assets.underlayByThread.set(key, canvas);
  return canvas;
}

function drawPatchTexture(ctx, w, h, patchColor) {
  const patchRgb = parseHexColor(patchColor, '#2c5f2e');
  const light = lightenColor(patchRgb, 0.18);
  const dark = darkenColor(patchRgb, 0.22);

  ctx.save();
  ctx.lineCap = 'butt';
  ctx.lineWidth = 1;

  ctx.strokeStyle = rgba(light, 0.09);
  for (let y = 2; y < h; y += 7) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
    ctx.stroke();
  }

  ctx.strokeStyle = rgba(dark, 0.1);
  for (let x = 3; x < w; x += 9) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
    ctx.stroke();
  }

  ctx.strokeStyle = rgba(light, 0.045);
  for (let x = -h; x < w; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.lineTo(x + h, 0);
    ctx.stroke();
  }

  ctx.restore();
}

function drawStitchedBorder(ctx, w, h, threadColor) {
  const pad = Math.max(6, Math.round(Math.min(w, h) * 0.02));
  const inset = pad + 8;

  ctx.save();
  ctx.strokeStyle = hexToRgba(threadColor, 0.68, '#f5c542');
  ctx.lineWidth = Math.max(1.2, Math.min(w, h) * 0.002);
  ctx.setLineDash([7, 5]);
  ctx.strokeRect(inset, inset, Math.max(1, w - inset * 2), Math.max(1, h - inset * 2));
  ctx.restore();
}

function drawSilhouetteShadow(ctx, sourceCanvas, w, h) {
  const shadow = createCanvas(w, h);
  const sCtx = shadow.getContext('2d');

  sCtx.drawImage(sourceCanvas, 0, 0);
  sCtx.globalCompositeOperation = 'source-in';
  sCtx.fillStyle = 'rgba(0,0,0,0.58)';
  sCtx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.filter = 'blur(5px)';
  ctx.drawImage(shadow, 2, 3);
  ctx.restore();
}

function getGradientAngle(field, x, y) {
  const { lum, w, h } = field;
  if (w < 3 || h < 3) return null;

  const ix = clamp(Math.round(x), 1, w - 2);
  const iy = clamp(Math.round(y), 1, h - 2);
  const idx = iy * w + ix;
  const gx = lum[idx + 1] - lum[idx - 1];
  const gy = lum[idx + w] - lum[idx - w];

  if (Math.abs(gx) + Math.abs(gy) < 10) return null;
  return Math.atan2(gy, gx);
}

function drawThreadLine(ctx, x, y, length, angle, width, color, alpha) {
  const dx = Math.cos(angle) * length * 0.5;
  const dy = Math.sin(angle) * length * 0.5;
  const highlight = lightenColor(color, 0.42);

  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x - dx, y - dy);
  ctx.lineTo(x + dx, y + dy);
  ctx.stroke();

  ctx.strokeStyle = rgba(highlight, alpha * 0.28);
  ctx.lineWidth = Math.max(0.45, width * 0.35);
  ctx.beginPath();
  ctx.moveTo(x - dx * 0.74, y - dy * 0.74 - width * 0.18);
  ctx.lineTo(x + dx * 0.74, y + dy * 0.74 - width * 0.18);
  ctx.stroke();
}

function drawFillStitches(ctx, field, threadRgb, spacing) {
  const { alpha, edge, w, h } = field;
  const rowStep = spacing;
  const stitchLength = clamp(Math.round(spacing * 4.6), 9, 28);
  const stride = Math.max(5, Math.round(stitchLength * 0.72));
  const width = clamp(spacing * 0.42, 0.9, 2.8);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.18)';
  ctx.shadowBlur = 0.8;
  ctx.shadowOffsetY = 0.55;

  for (let y = 0; y < h; y += rowStep) {
    const row = y * w;
    const rowIndex = Math.floor(y / rowStep);
    let x = 0;

    while (x < w) {
      while (x < w && !alpha[row + x]) x += 1;
      if (x >= w) break;

      const start = x;
      while (x < w && alpha[row + x]) x += 1;
      const end = x - 1;
      const offset = rowIndex % 2 ? Math.round(stride * 0.5) : 0;

      for (let sx = start - offset; sx <= end; sx += stride) {
        const midX = clamp(sx + stitchLength * 0.5, start, end);
        const idx = row + Math.round(midX);
        if (!alpha[idx]) continue;

        const grad = getGradientAngle(field, midX, y);
        const detailed = edge[idx] > 36 && grad !== null;
        const baseAngle = detailed
          ? grad + Math.PI * 0.5
          : (rowIndex % 2 ? -0.075 : 0.075) + Math.sin((midX + y) * 0.021) * 0.035;
        const color = getThreadColor(field, idx, threadRgb);
        const localLength = stitchLength * (detailed ? 0.8 : 1);
        const localAlpha = clamp(0.72 + edge[idx] / 720, 0.72, 0.93);

        drawThreadLine(ctx, midX, y + (rowIndex % 2 ? -0.35 : 0.35), localLength, baseAngle, width, color, localAlpha);
      }
    }
  }

  ctx.restore();
}

function drawDetailStitches(ctx, field, threadRgb, spacing) {
  const { alpha, edge, alphaEdge, w, h } = field;
  const step = Math.max(3, Math.round(spacing * 1.6));
  const width = clamp(spacing * 0.34, 0.75, 2.1);
  const length = clamp(Math.round(spacing * 3.1), 7, 18);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let y = step; y < h - step; y += step) {
    for (let x = step; x < w - step; x += step) {
      const idx = y * w + x;
      if (!alpha[idx]) continue;

      const detail = Math.max(edge[idx], alphaEdge[idx]);
      if (detail < 44) continue;

      const grad = getGradientAngle(field, x, y);
      const angle = (grad === null ? Math.PI * 0.5 : grad + Math.PI * 0.5) + Math.sin((x - y) * 0.03) * 0.16;
      const isHardEdge = alphaEdge[idx] > 0 || detail > 130;
      const color = isHardEdge
        ? getEdgeThreadColor(field, idx, threadRgb)
        : getThreadColor(field, idx, threadRgb, 24);
      const alphaValue = clamp(0.38 + detail / 330, 0.42, 0.9);

      drawThreadLine(ctx, x, y, length, angle, width, color, alphaValue);
    }
  }

  ctx.restore();
}

function drawEdgeHighlightStitches(ctx, field, threadRgb, spacing) {
  const { alpha, edge, alphaEdge, w, h } = field;
  const step = Math.max(2, Math.round(spacing * 0.95));
  const width = clamp(spacing * 0.24, 0.65, 1.55);
  const length = clamp(Math.round(spacing * 2.8), 7, 16);
  const lightAngle = -Math.PI * 0.72;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'screen';

  for (let y = step; y < h - step; y += step) {
    for (let x = step; x < w - step; x += step) {
      const idx = y * w + x;
      if (!alpha[idx]) continue;

      const detail = Math.max(edge[idx], alphaEdge[idx]);
      if (detail < 72) continue;

      const grad = getGradientAngle(field, x, y);
      const tangent = (grad === null ? 0 : grad + Math.PI * 0.5) + Math.sin((x + y) * 0.047) * 0.12;
      const lightBias = grad === null ? 0.35 : clamp((Math.cos(grad - lightAngle) + 1) * 0.5, 0.28, 1);
      const color = lightenColor(getEdgeThreadColor(field, idx, threadRgb), 0.12 + lightBias * 0.18);
      const alphaValue = clamp(0.16 + detail / 420 + lightBias * 0.22, 0.28, 0.74);

      drawThreadLine(ctx, x, y, length, tangent, width, color, alphaValue);
    }
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

function drawCrossWeave(ctx, field, threadRgb, spacing) {
  const { alpha, w, h } = field;
  const step = Math.max(5, Math.round(spacing * 3));
  const width = clamp(spacing * 0.18, 0.45, 1);
  const length = clamp(Math.round(spacing * 3.4), 7, 20);

  ctx.save();
  ctx.lineCap = 'round';

  for (let y = step; y < h; y += step) {
    for (let x = (Math.floor(y / step) % 2) * Math.round(step * 0.5); x < w; x += step) {
      const idx = y * w + x;
      if (!alpha[idx]) continue;

      const color = lightenColor(getThreadColor(field, idx, threadRgb), 0.2);
      const angle = Math.PI * 0.5 + Math.sin((x + y) * 0.04) * 0.08;
      drawThreadLine(ctx, x, y, length, angle, width, color, 0.22);
    }
  }

  ctx.restore();
}

function makeThreadCanvas(field, maskCanvas, threadRgb, spacing) {
  const canvas = createCanvas(field.w, field.h);
  const ctx = canvas.getContext('2d');

  drawFillStitches(ctx, field, threadRgb, spacing);
  drawCrossWeave(ctx, field, threadRgb, spacing);
  drawDetailStitches(ctx, field, threadRgb, spacing);
  drawEdgeHighlightStitches(ctx, field, threadRgb, spacing);

  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskCanvas, 0, 0);
  ctx.globalCompositeOperation = 'source-over';

  return canvas;
}

export function applyEmbroidery(source, {
  threadColor = '#f5c542',
  patchColor = '#2c5f2e',
  lineSpacing = 4,
  patchEnabled = false,
} = {}) {
  const { w, h } = getCanvasSourceSize(source);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const assets = getSourceAssets(source, w, h);
  const spacing = Math.max(2, Math.round(normalizeNumber(lineSpacing, 4, 2, 12)));
  const threadRgb = parseHexColor(threadColor, '#f5c542');

  if (patchEnabled) {
    ctx.fillStyle = patchColor;
    ctx.fillRect(0, 0, w, h);
    drawPatchTexture(ctx, w, h, patchColor);
    drawStitchedBorder(ctx, w, h, threadColor);
  }

  drawSilhouetteShadow(ctx, assets.sourceCanvas, w, h);

  ctx.drawImage(getUnderlayCanvas(assets, threadColor, threadRgb), 0, 0);
  ctx.drawImage(makeThreadCanvas(assets.field, assets.maskCanvas, threadRgb, spacing), 0, 0);

  return canvas;
}
