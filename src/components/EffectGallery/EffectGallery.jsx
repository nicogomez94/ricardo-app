import { EFFECTS } from '../../effects/index.js';
import EffectCard from './EffectCard.jsx';
import './EffectGallery.css';

export default function EffectGallery({ selectedEffectId, onSelect, userText, fontFamily, uploadedImage }) {
  return (
    <aside className="effect-gallery">
      <div className="gallery-header">
        <h2 className="gallery-title">Efectos de Decoración</h2>
        <p className="gallery-subtitle">{EFFECTS.length} estilos disponibles</p>
      </div>
      <div className="gallery-grid">
        {EFFECTS.map((effect) => (
          <EffectCard
            key={effect.id}
            effect={effect}
            isSelected={selectedEffectId === effect.id}
            onSelect={onSelect}
            userText={userText}
            fontFamily={fontFamily}
            uploadedImage={uploadedImage}
          />
        ))}
      </div>
    </aside>
  );
}
