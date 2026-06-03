import { useMemo } from 'react';
import { formatPligoCm, layoutPligoItems } from '../../utils/pligoLayout.js';
import './PligoPanel.css';

export default function PligoPanel({
  items,
  processedDataUrl,
  onAdd,
  onDuplicate,
  onRemove,
  onClear,
}) {
  const canAdd = !!processedDataUrl;
  const layout = useMemo(() => layoutPligoItems(items), [items]);
  const lastSheet = layout.sheets[layout.sheets.length - 1];
  const placementsByIndex = useMemo(() => {
    const map = new Map();
    layout.placements.forEach((placement) => {
      map.set(placement.index, placement);
    });
    return map;
  }, [layout.placements]);

  return (
    <div className="pligo-panel">
      <div className="panel-info">
        <span className="panel-info-icon">🧷</span>
        <p>
          Armá pliegos DTF de 58 cm × 1 metro. Las piezas se acomodan automáticamente,
          se dividen en nuevos pliegos si hace falta y se exportan con fondo transparente.
        </p>
      </div>

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

      {items.length > 0 && (
        <>
          <div className="pligo-stats">
            <div className="pligo-stat">
              <span>Pliegos</span>
              <strong>{layout.sheetCount}</strong>
            </div>
            <div className="pligo-stat">
              <span>Ocupación</span>
              <strong>{Math.round(layout.efficiency)}%</strong>
            </div>
            <div className="pligo-stat">
              <span>Libre final</span>
              <strong>{lastSheet ? formatPligoCm(lastSheet.remainingHeight) : '0,0'} cm</strong>
            </div>
          </div>

          <div className="pligo-section-header">
            <span>En el pliego ({items.length})</span>
            <button className="pligo-clear-btn" onClick={onClear}>Limpiar todo</button>
          </div>

          <div className="pligo-thumbs">
            {items.map((item, idx) => {
              const placement = placementsByIndex.get(idx);
              const placedSize = placement
                ? `${formatPligoCm(placement.w)}×${formatPligoCm(placement.h)} cm`
                : `${item.w}×${item.h}px`;

              return (
                <div key={item.id} className="pligo-thumb-item">
                  <div className="pligo-thumb-img-wrap">
                    <img src={item.dataUrl} alt={`Diseño ${idx + 1}`} className="pligo-thumb-img" />
                    <div className="pligo-thumb-actions">
                      <button
                        className="pligo-thumb-action"
                        onClick={() => onDuplicate(item.id)}
                        title="Duplicar pieza"
                      >
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                          <rect x="5" y="2" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.4"/>
                          <rect x="2" y="5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.4"/>
                        </svg>
                      </button>
                      <button
                        className="pligo-thumb-action"
                        onClick={() => onRemove(item.id)}
                        title="Quitar del pliego"
                      >
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                          <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="pligo-thumb-meta">
                    <span className="pligo-thumb-n">#{idx + 1}</span>
                    <span className="pligo-thumb-dim">{placedSize}</span>
                  </div>
                  {placement?.scale < 1 && (
                    <span className="pligo-thumb-scale">Ajustado al ancho del pliego</span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {items.length === 0 && canAdd && (
        <div className="pligo-empty-hint">
          <p>El pliego está vacío.</p>
          <span>Agregá el resultado procesado con el botón de arriba.</span>
        </div>
      )}

      <div className="pligo-note">
        <strong>Preparación automática:</strong> al agregar una pieza se recorta 1px de borde.
        Si no entra en el espacio disponible, se crea otro pliego para exportar por separado.
      </div>
    </div>
  );
}
