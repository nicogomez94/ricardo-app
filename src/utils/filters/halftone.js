import { createCanvas, getCanvasSourceSize } from './canvas.js';

const TARGET_WIDTH = 4500;
const TARGET_HEIGHT = 5400;
const TARGET_DPI = 300;
const PNG_ALPHA_ON = 255;
const PNG_ALPHA_OFF = 0;

function clampByte(value) {
  return Math.max(0, Math.min(255, value));
}

function createSourceCanvas(source) {
  const { w, h } = getCanvasSourceSize(source);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, w, h);
  return canvas;
}

function getBlackCropBox(imageData, w, h, threshold) {
  const data = imageData.data;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const idx = (y * w + x) * 4;
      if (
        data[idx] > threshold ||
        data[idx + 1] > threshold ||
        data[idx + 2] > threshold
      ) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return { x: 0, y: 0, w, h };
  }

  return {
    x: minX,
    y: minY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
  };
}

function cropNearBlackBackground(sourceCanvas, threshold) {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, w, h);
  const crop = getBlackCropBox(imageData, w, h, threshold);

  if (crop.x === 0 && crop.y === 0 && crop.w === w && crop.h === h) {
    return sourceCanvas;
  }

  const canvas = createCanvas(crop.w, crop.h);
  const cropCtx = canvas.getContext('2d');
  cropCtx.drawImage(
    sourceCanvas,
    crop.x,
    crop.y,
    crop.w,
    crop.h,
    0,
    0,
    crop.w,
    crop.h
  );
  return canvas;
}

function resizeToTarget(sourceCanvas, targetPixels) {
  const maxW = targetPixels?.w ?? TARGET_WIDTH;
  const maxH = targetPixels?.h ?? TARGET_HEIGHT;
  const scale = Math.min(1, maxW / sourceCanvas.width, maxH / sourceCanvas.height);

  if (scale >= 1) return sourceCanvas;

  const canvas = createCanvas(sourceCanvas.width * scale, sourceCanvas.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function imageDataToLeveledGray(imageData, {
  blackPoint = 16,
  whitePoint = 100,
  gamma = 1,
  invertForDarkGarment = false,
} = {}) {
  const data = imageData.data;
  const gray = new Uint8Array(imageData.width * imageData.height);
  const bp = Number(blackPoint);
  const wp = Number(whitePoint);
  const range = Math.max(wp - bp, 1);
  const safeGamma = Math.max(0.1, Number(gamma) || 1);

  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    let value;

    if (lum <= bp) {
      value = 0;
    } else if (lum >= wp) {
      value = 255;
    } else {
      let norm = (lum - bp) / range;
      if (safeGamma !== 1) norm = norm ** (1 / safeGamma);
      value = Math.round(norm * 255);
    }

    gray[p] = invertForDarkGarment ? 255 - value : value;
  }

  return gray;
}

function createScreenAlpha(gray, w, h, {
  screenFrequency = 35,
  screenAngle = 23.5,
  dotShape = 'round',
  targetDpi = TARGET_DPI,
} = {}) {
  const alpha = new Uint8Array(w * h);
  const frequency = Math.max(0.1, Number(screenFrequency) || 35);
  const pxPerCycle = targetDpi / frequency;
  const wave = (Math.PI * 2) / pxPerCycle;
  const angle = ((Number(screenAngle) || 0) * Math.PI) / 180;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const xrStep = wave * cosA;
  const yrStep = -wave * sinA;
  const xrStepSin = Math.sin(xrStep);
  const xrStepCos = Math.cos(xrStep);
  const yrStepSin = Math.sin(yrStep);
  const yrStepCos = Math.cos(yrStep);
  const isLine = dotShape === 'line';

  for (let y = 0; y < h; y += 1) {
    const xrStart = wave * y * sinA;
    let xrSin = Math.sin(xrStart);
    let xrCos = Math.cos(xrStart);
    let yrSin = 0;
    let yrCos = 1;

    if (!isLine) {
      const yrStart = wave * y * cosA;
      yrSin = Math.sin(yrStart);
      yrCos = Math.cos(yrStart);
    }

    for (let x = 0; x < w; x += 1) {
      const index = y * w + x;
      const pattern = isLine
        ? 0.5 * (1 + xrSin) * 255
        : 0.5 * (1 + xrSin * yrSin) * 255;

      alpha[index] = gray[index] > pattern ? PNG_ALPHA_ON : PNG_ALPHA_OFF;

      if ((x + 1) % 1024 === 0) {
        const nextX = x + 1;
        const xrPhase = wave * (nextX * cosA + y * sinA);
        xrSin = Math.sin(xrPhase);
        xrCos = Math.cos(xrPhase);

        if (!isLine) {
          const yrPhase = wave * (-nextX * sinA + y * cosA);
          yrSin = Math.sin(yrPhase);
          yrCos = Math.cos(yrPhase);
        }
      } else {
        const nextXrSin = xrSin * xrStepCos + xrCos * xrStepSin;
        xrCos = xrCos * xrStepCos - xrSin * xrStepSin;
        xrSin = nextXrSin;

        if (!isLine) {
          const nextYrSin = yrSin * yrStepCos + yrCos * yrStepSin;
          yrCos = yrCos * yrStepCos - yrSin * yrStepSin;
          yrSin = nextYrSin;
        }
      }
    }
  }

  return alpha;
}

function createDiffusionAlpha(gray, w, h) {
  const alpha = new Uint8Array(w * h);
  const values = new Float32Array(gray.length);

  for (let i = 0; i < gray.length; i += 1) {
    values[i] = gray[i];
  }

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const index = y * w + x;
      const oldValue = values[index];
      const nextValue = oldValue >= 128 ? 255 : 0;
      const error = oldValue - nextValue;

      alpha[index] = nextValue;

      if (x + 1 < w) values[index + 1] += error * (7 / 16);
      if (y + 1 < h) {
        if (x > 0) values[index + w - 1] += error * (3 / 16);
        values[index + w] += error * (5 / 16);
        if (x + 1 < w) values[index + w + 1] += error * (1 / 16);
      }
    }
  }

  return alpha;
}

function applyAlphaToColor(imageData, alpha) {
  const out = new ImageData(imageData.width, imageData.height);
  const src = imageData.data;
  const dst = out.data;

  for (let i = 0, p = 0; i < src.length; i += 4, p += 1) {
    dst[i] = clampByte(src[i]);
    dst[i + 1] = clampByte(src[i + 1]);
    dst[i + 2] = clampByte(src[i + 2]);
    dst[i + 3] = alpha[p];
  }

  return out;
}

export function applyHalftone(source, {
  cropBlackBackground = true,
  cropBlackThreshold = 25,
  blackPoint = 16,
  whitePoint = 100,
  gamma = 1,
  invertForDarkGarment = false,
  halftoneMethod = 'halftone',
  screenFrequency = 35,
  screenAngle = 23.5,
  dotShape = 'round',
  targetPixels = { w: TARGET_WIDTH, h: TARGET_HEIGHT },
  targetDpi = TARGET_DPI,
} = {}) {
  let sourceCanvas = createSourceCanvas(source);

  if (cropBlackBackground) {
    sourceCanvas = cropNearBlackBackground(
      sourceCanvas,
      Math.max(0, Math.min(255, Number(cropBlackThreshold) || 0))
    );
  }

  const resized = resizeToTarget(sourceCanvas, targetPixels);
  const w = resized.width;
  const h = resized.height;
  const ctx = resized.getContext('2d', { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, w, h);
  const gray = imageDataToLeveledGray(imageData, {
    blackPoint,
    whitePoint,
    gamma,
    invertForDarkGarment,
  });
  const alpha = halftoneMethod === 'diffusion'
    ? createDiffusionAlpha(gray, w, h)
    : createScreenAlpha(gray, w, h, {
      screenFrequency,
      screenAngle,
      dotShape,
      targetDpi,
    });

  const canvas = createCanvas(w, h);
  const outCtx = canvas.getContext('2d');
  outCtx.putImageData(applyAlphaToColor(imageData, alpha), 0, 0);
  return canvas;
}
