import { EFFECTS } from '../effects/index.js';

/**
 * Renders an effect onto the given canvas element.
 * @param {HTMLCanvasElement} canvas
 * @param {string} effectId
 * @param {string} text
 * @param {object} options - { fontFamily, fontSize, primary, secondary, background }
 */
export function renderEffect(canvas, effectId, text, options) {
  const effect = EFFECTS.find((e) => e.id === effectId);
  if (!effect) return;
  effect.render(canvas, text || 'TEXTO', options);
}
