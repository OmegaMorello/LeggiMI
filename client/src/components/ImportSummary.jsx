import "./ImportSummary.css";

export default function ImportSummary({ analysis }) {
  return (
    <div className="import-summary">
      <h3 className="import-summary-title">Risultato analisi</h3>
      <div className="import-summary-grid">
        <div className="import-summary-stat import-summary-stat--new">
          <span className="import-summary-num">{analysis.nuovi.length}</span>
          <span className="import-summary-label">Nuovi</span>
        </div>
        <div className="import-summary-stat import-summary-stat--dup">
          <span className="import-summary-num">{analysis.duplicati.length}</span>
          <span className="import-summary-label">Duplicati (ISBN)</span>
        </div>
        <div className="import-summary-stat import-summary-stat--err">
          <span className="import-summary-num">{analysis.scartati.length}</span>
          <span className="import-summary-label">Scartati</span>
        </div>
      </div>

      {analysis.scartati.length > 0 && (
        <details className="import-summary-details">
          <summary>Righe scartate</summary>
          <ul className="import-summary-list">
            {analysis.scartati.map((s, i) => (
              <li key={i}>Riga {s.riga}: {s.motivo}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
