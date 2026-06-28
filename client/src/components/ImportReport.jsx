import "./ImportReport.css";

export default function ImportReport({ report }) {
  return (
    <div className="import-report">
      <h3 className="import-report-title">Import completato</h3>
      <div className="import-report-grid">
        {report.inseriti > 0 && (
          <div className="import-report-stat import-report-stat--new">
            <span className="import-report-num">{report.inseriti}</span>
            <span className="import-report-label">Inseriti</span>
          </div>
        )}
        {report.aggiornati > 0 && (
          <div className="import-report-stat import-report-stat--upd">
            <span className="import-report-num">{report.aggiornati}</span>
            <span className="import-report-label">Aggiornati</span>
          </div>
        )}
        {report.saltati > 0 && (
          <div className="import-report-stat import-report-stat--skip">
            <span className="import-report-num">{report.saltati}</span>
            <span className="import-report-label">Saltati</span>
          </div>
        )}
        {report.scartati.length > 0 && (
          <div className="import-report-stat import-report-stat--err">
            <span className="import-report-num">{report.scartati.length}</span>
            <span className="import-report-label">Scartati</span>
          </div>
        )}
      </div>

      {report.scartati.length > 0 && (
        <details className="import-report-details">
          <summary>Righe scartate</summary>
          <ul className="import-report-list">
            {report.scartati.map((s, i) => (
              <li key={i}>Riga {s.riga}: {s.motivo}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
