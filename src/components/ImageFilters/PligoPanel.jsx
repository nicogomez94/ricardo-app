import './PligoPanel.css';

export default function PligoPanel({ items, processedDataUrl, onAdd, onRemove, onClear }) {
  const canAdd = !!processedDataUrl;

  return (
    <div className="pligo-panel">
      <div className="panel-info">
        <span className="panel-info-icon">🧷</span>
        <p>
          Armá un pliego DTF de 58 cm × 1 metro. Cada imagen se recorta automáticamente 1px en sus bordes
          para eliminar la semitransparencia residual antes de imprimir.
        </p>
      </div>

      {/* Add button */}
      <button
        className={`pligo-add-btn ${!canAdd ? 'disabled' : ''}`}
        onClick={onAdd}
        disabled={!canAdd}
        title={!canAdd ? 'Primero procesá una imagen en otro filtro' : 'Agregar resultado al pliego'}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Agregar resultado al pliego
      </button>

      {!canAdd && (
        <p className="pligo-hint-text">
          Subí una imagen y aplicá un filtro para poder agregarla al pliego.
        </p>
      )}

      {/* Item list */}
      {items.length > 0 && (
        <>
          <div className="pligo-section-header">
            <span>En el pliego ({items.length})</span>
            <button className="pligo-clear-btn" onClick={onClear}>Limpiar todo</button>
          </div>

          <div className="pligo-thumbs">
            {items.map((item, idx) => (
              <div key={item.id} className="pligo-thumb-item">
                <div className="pligo-thumb-img-wrap">
                  <img src={item.dataUrl} alt={`Diseño ${idx + 1}`} className="pligo-thumb-img" />
                  <button
                    className="pligo-thumb-remove"
                    onClick={() => onRemove(item.id)}
                    title="Quitar del pliego"
                  >
                    ×
                  </button>
                </div>
                <div className="pligo-thumb-meta">
                  <span className="pligo-thumb-n">#{idx + 1}</span>
                  <span className="pligo-thumb-dim">{item.w}×{item.h}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {items.length === 0 && canAdd && (
        <div className="pligo-empty-hint">
          <p>El pliego está vacío.</p>
          <span>Agregá el resultado procesado con el botón de arriba.</span>
        </div>
      )}

      {/* Footer note */}
      <div className="pligo-note">
        <strong>Reducción automática:</strong> Al agregar cada imagen se recorta 1px de borde
        para eliminar el pixel semitransparente que genera el recorte de fondo.
      </div>
    </div>
  );
}
