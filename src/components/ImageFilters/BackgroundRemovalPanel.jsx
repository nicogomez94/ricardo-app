import './BackgroundRemovalPanel.css';

export default function BackgroundRemovalPanel({ settings, onSettingsChange }) {
  const { tolerance } = settings;

  return (
    <div className="bgr-panel">
      <div className="panel-info">
        <span className="panel-info-icon">✂️</span>
        <p>Elimina fondos blancos o de color claro uniforme. Ideal para logos y diseños sobre fondo blanco.</p>
      </div>

      <div className="bgr-ctrl-row">
        <div className="bgr-ctrl-header">
          <span className="bgr-ctrl-label">Tolerancia de color</span>
          <span className="bgr-ctrl-value">{tolerance}%</span>
        </div>
        <input
          type="range"
          min={1}
          max={80}
          value={tolerance}
          onChange={e => onSettingsChange('tolerance', Number(e.target.value))}
          className="bgr-slider"
        />
        <div className="bgr-ctrl-range-labels">
          <span>Preciso</span>
          <span>Agresivo</span>
        </div>
      </div>

      <div className="bgr-hint-box">
        <div className="bgr-hint-title">Resultado sobre fondo cuadriculado</div>
        <div className="bgr-checkerboard-demo">
          <div className="bgr-checker-text">Vista previa con transparencia</div>
        </div>
        <p className="bgr-hint-text">
          Los píxeles eliminados se muestran como transparencia en el canvas. Funciona mejor con fondos blancos puros.
        </p>
      </div>

      <div className="bgr-tip">
        <strong>Consejo:</strong> Tolerancia baja (5–15%) para diseños con degradados o sombras. Alta (30–60%) para fondos blancos sólidos.
      </div>
    </div>
  );
}
