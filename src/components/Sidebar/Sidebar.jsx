import { useState } from 'react';
import TemplatePanel from '../Panels/TemplatePanel';
import TextPanel from '../Panels/TextPanel';
import EffectsPanel from '../Panels/EffectsPanel';
import './Sidebar.css';

const TABS = [
  { id: 'templates', label: 'Templates' },
  { id: 'text', label: 'Texto' },
  { id: 'effects', label: 'Efectos' },
];

export default function Sidebar({
  onLoadTemplate,
  selectedElement,
  onUpdateElement,
  showTexture,
  setShowTexture,
}) {
  const [activeTab, setActiveTab] = useState('templates');

  return (
    <aside className="sidebar">
      <div className="sidebar-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="sidebar-content">
        {activeTab === 'templates' && <TemplatePanel onLoad={onLoadTemplate} />}
        {activeTab === 'text' && (
          <TextPanel element={selectedElement} onUpdate={onUpdateElement} />
        )}
        {activeTab === 'effects' && (
          <EffectsPanel
            element={selectedElement}
            onUpdate={onUpdateElement}
            showTexture={showTexture}
            setShowTexture={setShowTexture}
          />
        )}
      </div>
    </aside>
  );
}
