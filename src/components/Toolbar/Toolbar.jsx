import './Toolbar.css';

export default function Toolbar({ onExport }) {
  return (
    <header className="toolbar">
      <div className="toolbar-brand">
        <span className="toolbar-logo">◈</span>
        <span className="toolbar-name">Apparel Effects Engine</span>
        <span className="toolbar-tag">demo</span>
      </div>

      <div className="toolbar-center">
        <span className="toolbar-hint">
          Seleccioná un efecto · Editá el texto · Exportá como PNG
        </span>
      </div>

      <div className="toolbar-right">
        <button className="toolbar-export-btn" onClick={onExport}>
          ↓ Exportar PNG
        </button>
      </div>
    </header>
  );
}

