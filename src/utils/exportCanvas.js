/**
 * Exports the Konva stage as a PNG file download.
 * @param {import('konva/lib/Stage').Stage} stage - Konva stage reference
 * @param {string} filename
 */
export function exportStageToPNG(stage, filename = 'diseno.png') {
  if (!stage) return;
  // Temporarily deselect all to hide transformer handles
  const dataURL = stage.toDataURL({ pixelRatio: 2 });
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
