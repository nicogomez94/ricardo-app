import { useEffect, useRef } from 'react';
import { renderEffect } from '../../utils/renderEffect.js';
import './EffectGallery.css';

const PREV_W = 200;
const PREV_H = 80;
const PREVIEW_TEXT = 'ABC';

export default function EffectCard({ effect, isSelected, onSelect, userText, fontFamily }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const text = userText && userText.length <= 8 ? userText : PREVIEW_TEXT;
    renderEffect(canvas, effect.id, text, {
      fontFamily: fontFamily || 'Impact',
      fontSize: 52,
      ...effect.defaultColors,
    });
  }, [effect, userText, fontFamily]);

  return (
    <button
      className={`effect-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(effect.id)}
      title={effect.description}
    >
      <canvas ref={canvasRef} width={PREV_W} height={PREV_H} className="effect-card-canvas" />
      <div className="effect-card-footer">
        <span className="effect-card-emoji">{effect.emoji}</span>
        <span className="effect-card-label">{effect.label}</span>
      </div>
    </button>
  );
}
