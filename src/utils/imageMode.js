/**
 * Draws an HTMLImageElement fitted (object-fit: contain) centered on the canvas.
 * @returns {{ x, y, w, h }} bounds of the drawn image
 */
export function drawFittedImage(ctx, img, canvasW, canvasH, padding = 0.88) {
  const scale = Math.min(canvasW / img.naturalWidth, canvasH / img.naturalHeight) * padding;
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  const x = (canvasW - w) / 2;
  const y = (canvasH - h) / 2;
  ctx.drawImage(img, x, y, w, h);
  return { x, y, w, h };
}

/**
 * Creates an offscreen canvas with the image drawn as a white silhouette
 * (non-transparent pixels → white, transparent → transparent).
 * Useful as an alpha mask for effects that do pixel reads.
 */
export function getImageWhiteMask(W, H, img) {
  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const ctx = off.getContext('2d');
  drawFittedImage(ctx, img, W, H);
  const imageData = ctx.getImageData(0, 0, W, H);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 10) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return off;
}
