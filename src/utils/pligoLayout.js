export const PLIGO_WIDTH = 580;
export const PLIGO_HEIGHT = 1000;
export const PLIGO_GAP = 14;
export const PLIGO_PX_PER_CM = 10;
export const PLIGO_EXPORT_SCALE = 4;

function normalizeSize(value) {
  const size = Math.round(Number(value));
  return Number.isFinite(size) && size > 0 ? size : 1;
}

function createSheet(index) {
  return {
    index,
    items: [],
    usedArea: 0,
    usedHeight: 0,
    remainingHeight: PLIGO_HEIGHT,
    efficiency: 0,
  };
}

export function formatPligoCm(value, fractionDigits = 1) {
  const cm = value / PLIGO_PX_PER_CM;
  return cm.toLocaleString('es-AR', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  });
}

export function layoutPligoItems(items = []) {
  if (!items.length) {
    return {
      sheets: [],
      placements: [],
      sheetCount: 0,
      usedArea: 0,
      availableArea: 0,
      efficiency: 0,
    };
  }

  const sheets = [createSheet(0)];
  const placements = [];
  const maxW = PLIGO_WIDTH - PLIGO_GAP * 2;
  const maxH = PLIGO_HEIGHT - PLIGO_GAP * 2;
  const pageRight = PLIGO_WIDTH - PLIGO_GAP;
  const pageBottom = PLIGO_HEIGHT - PLIGO_GAP;

  let sheet = sheets[0];
  let x = PLIGO_GAP;
  let y = PLIGO_GAP;
  let rowH = 0;

  items.forEach((item, index) => {
    const sourceW = normalizeSize(item.w);
    const sourceH = normalizeSize(item.h);
    const scale = Math.min(1, maxW / sourceW, maxH / sourceH);
    const w = Math.max(1, Math.round(sourceW * scale));
    const h = Math.max(1, Math.round(sourceH * scale));

    if (x > PLIGO_GAP && x + w > pageRight) {
      x = PLIGO_GAP;
      y += rowH + PLIGO_GAP;
      rowH = 0;
    }

    if (y > PLIGO_GAP && y + h > pageBottom) {
      sheet = createSheet(sheets.length);
      sheets.push(sheet);
      x = PLIGO_GAP;
      y = PLIGO_GAP;
      rowH = 0;
    }

    const placement = {
      ...item,
      sourceW,
      sourceH,
      x,
      y,
      w,
      h,
      scale,
      index,
      sheetIndex: sheet.index,
    };

    sheet.items.push(placement);
    sheet.usedArea += w * h;
    sheet.usedHeight = Math.min(PLIGO_HEIGHT, Math.max(sheet.usedHeight, y + h + PLIGO_GAP));
    placements.push(placement);

    x += w + PLIGO_GAP;
    rowH = Math.max(rowH, h);
  });

  let usedArea = 0;
  sheets.forEach((entry) => {
    usedArea += entry.usedArea;
    entry.remainingHeight = Math.max(0, PLIGO_HEIGHT - entry.usedHeight);
    entry.efficiency = (entry.usedArea / (PLIGO_WIDTH * PLIGO_HEIGHT)) * 100;
  });

  const availableArea = sheets.length * PLIGO_WIDTH * PLIGO_HEIGHT;

  return {
    sheets,
    placements,
    sheetCount: sheets.length,
    usedArea,
    availableArea,
    efficiency: availableArea ? (usedArea / availableArea) * 100 : 0,
  };
}
