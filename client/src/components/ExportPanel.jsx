import "./ExportPanel.css";

export default function ExportPanel({ onExport, disabled }) {
  return (
    <div className="export-panel">
      <p className="export-panel-desc">Scarica l'intero catalogo in formato CSV.</p>
      <button className="export-panel-btn" onClick={onExport} disabled={disabled}>
        Esporta catalogo CSV
      </button>
    </div>
  );
}
