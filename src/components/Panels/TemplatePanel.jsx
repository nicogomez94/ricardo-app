import { TEMPLATES } from '../../data/templates';
import './Panel.css';

export default function TemplatePanel({ onLoad }) {
  return (
    <div className="panel">
      <h3 className="panel-title">Templates</h3>
      <div className="template-grid">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            className="template-btn"
            onClick={() => onLoad(tpl.id)}
            style={{ background: tpl.background }}
          >
            <span className="template-label">{tpl.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
