import { clampByte, createCanvas, getCanvasSourceSize, parseHexColor } from './canvas.js';

const PALETTES = {
  gold: ['#160a00', '#533000', '#a76506', '#e2a81f', '#fff0a6', '#f6cf50', '#b87308', '#4a2700', '#160a00'],
  silver: ['#11131a', '#343947', '#7b8291', '#c3c8d1', '#ffffff', '#dce2e8', '#8e96a3', '#3c414c', '#11131a'],
  copper: ['#170602', '#5b1b0b', '#9a391a', '#d06d34', '#ffd09a', '#e58645', '#a94720', '#54200e', '#170602'],
  chrome: ['#07101d', '#163060', '#2f78d0', '#b7e5ff', '#ffffff', '#9ad6ff', '#3d8bf0', '#1b3f77', '#07101d'],
};

const TWO_PI = Math.PI * 2;
const RGB_PALETTES = Object.fromEntries(
  Object.entries(PALETTES).map(([key, stops]) => [
    key,
    stops.map((color) => parseHexColor(color)),
  ])
);

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0, edge1, value) {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function mixRgb(a, b, t) {
  return {
    r: mix(a.r, b.r, t),
    g: mix(a.g, b.g, t),
    b: mix(a.b, b.b, t),
  };
}

function samplePalette(stops, value) {
  const position = clamp01(value) * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(position));
  const localT = position - index;
  return mixRgb(stops[index], stops[index + 1], smoothstep(0, 1, localT));
}

export function applyMetallic(
  source,
  {
    variant = 'gold',
    bandSize = 62,
    bandIntensity = 46,
    shine = 68,
    texture = 14,
    angle = 12,
  } = {}
) {
  const { w, h } = getCanvasSourceSize(source);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const pixelCount = canvas.width * canvas.height;
  const luma = new Float32Array(pixelCount);
  const heightMap = new Float32Array(pixelCount);
  const stops = RGB_PALETTES[variant] || RGB_PALETTES.gold;
  const patternSize = clamp01(bandSize / 100);
  const patternAmount = clamp01(bandIntensity / 100);
  const shineAmount = clamp01(shine / 100);
  const textureAmount = clamp01(texture / 100);
  const bandFrequency = mix(7.8, 2.2, patternSize);
  const fineFrequency = mix(10, 28, textureAmount);
  const angleRad = angle * Math.PI / 180;
  const directionX = Math.sin(angleRad);
  const directionY = Math.cos(angleRad);
  const crossX = Math.cos(angleRad);
  const crossY = -Math.sin(angleRad);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const alpha = data[i + 3] / 255;
    const light = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
    luma[p] = light;
    heightMap[p] = light * 0.72 + alpha * 0.28;
  }

  for (let y = 0, p = 0; y < canvas.height; y++) {
    const ny = canvas.height > 1 ? y / (canvas.height - 1) : 0;

    for (let x = 0; x < canvas.width; x++, p++) {
      const i = p * 4;
      const alpha = data[i + 3];
      if (alpha === 0) continue;

      const nx = canvas.width > 1 ? x / (canvas.width - 1) : 0;
      const light = luma[p];
      const left = heightMap[x > 0 ? p - 1 : p];
      const right = heightMap[x < canvas.width - 1 ? p + 1 : p];
      const up = heightMap[y > 0 ? p - canvas.width : p];
      const down = heightMap[y < canvas.height - 1 ? p + canvas.width : p];
      const ridge = (left - right) * 0.48 + (up - down) * 0.62;
      const edge = clamp01((Math.abs(left - right) + Math.abs(up - down)) * 2.8);
      const linePos = nx * directionX + ny * directionY;
      const crossPos = nx * crossX + ny * crossY;

      const broadBand = 0.5 + 0.5 * Math.sin((linePos * bandFrequency + crossPos * 0.18 + 0.08) * TWO_PI);
      const mirrorBand = 0.5 + 0.5 * Math.sin((linePos * bandFrequency * 1.95 - crossPos * 0.58 + 0.34) * TWO_PI);
      const brushedBand = 0.5 + 0.5 * Math.sin((linePos * fineFrequency + Math.sin(crossPos * TWO_PI * 1.7) * 0.16) * TWO_PI);
      const hotStreak = (
        Math.pow(smoothstep(0.6, 1, broadBand), 5) * 0.74
        + Math.pow(smoothstep(0.78, 1, mirrorBand), 8) * 0.48
      ) * shineAmount;
      const reflection = clamp01(
        broadBand * mix(0.22, 0.58, patternAmount)
        + mirrorBand * mix(0.08, 0.26, patternAmount)
        + brushedBand * mix(0, 0.16, textureAmount)
        + hotStreak * 0.28
      );
      const tone = clamp01(
        0.12
        + Math.pow(light, 0.78) * mix(0.5, 0.38, patternAmount)
        + reflection * mix(0.22, 0.56, patternAmount)
        + ridge * mix(0.22, 0.52, patternAmount)
      );
      const metal = samplePalette(stops, tone);
      const shade = clamp01(0.66 + light * 0.3 + ridge * mix(0.14, 0.36, patternAmount) - edge * 0.1);
      const gloss = clamp01(
        hotStreak * 0.7
        + smoothstep(0.76, 1, reflection) * shineAmount * 0.24
        + edge * mix(0.1, 0.23, patternAmount)
      );

      let r = metal.r * shade;
      let g = metal.g * shade;
      let b = metal.b * shade;

      r = mix(r, 255, gloss);
      g = mix(g, 255, gloss);
      b = mix(b, 255, gloss);

      data[i] = clampByte(r);
      data[i + 1] = clampByte(g);
      data[i + 2] = clampByte(b);
      data[i + 3] = alpha;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return canvas;
}
