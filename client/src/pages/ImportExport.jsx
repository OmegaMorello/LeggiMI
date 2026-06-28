import { useState } from "react";
import { exportBooksCsv, importBooksCsv } from "../services/api";
import CsvUploader from "../components/CsvUploader";
import ImportSummary from "../components/ImportSummary";
import DuplicateStrategyPrompt from "../components/DuplicateStrategyPrompt";
import ImportReport from "../components/ImportReport";
import ExportPanel from "../components/ExportPanel";
import Toast from "../components/Toast";
import "./ImportExport.css";

export default function ImportExport() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  function handleFileSelected(selectedFile) {
    setFile(selectedFile);
    setAnalysis(null);
    setReport(null);
    setLoading(true);

    importBooksCsv(selectedFile, { dryRun: true })
      .then((data) => setAnalysis(data))
      .catch((err) => setToast({ message: err.message, type: "error" }))
      .finally(() => setLoading(false));
  }

  function handleImport(duplicateStrategy) {
    if (!file) return;
    setLoading(true);

    importBooksCsv(file, { dryRun: false, duplicateStrategy })
      .then((data) => {
        setReport(data);
        setAnalysis(null);
        setFile(null);
      })
      .catch((err) => setToast({ message: err.message, type: "error" }))
      .finally(() => setLoading(false));
  }

  function handleConfirmNoDuplicates() {
    handleImport("skip");
  }

  function handleExport() {
    setLoading(true);
    exportBooksCsv()
      .then(() => setToast({ message: "Catalogo esportato!", type: "success" }))
      .catch((err) => setToast({ message: err.message, type: "error" }))
      .finally(() => setLoading(false));
  }

  function handleReset() {
    setFile(null);
    setAnalysis(null);
    setReport(null);
  }

  const hasDuplicates = analysis && analysis.duplicati.length > 0;
  const hasNewOrDuplicates = analysis && (analysis.nuovi.length > 0 || analysis.duplicati.length > 0);

  return (
    <div className="ie-page">
      <h1 className="ie-heading">Import / Export</h1>

      <section className="ie-section">
        <h2 className="ie-section-title">Esporta</h2>
        <ExportPanel onExport={handleExport} disabled={loading} />
      </section>

      <section className="ie-section">
        <h2 className="ie-section-title">Importa</h2>

        {!analysis && !report && (
          <CsvUploader onFileSelected={handleFileSelected} disabled={loading} />
        )}

        {loading && <p className="ie-loading">Elaborazione in corso…</p>}

        {analysis && (
          <div className="ie-analysis-flow">
            <ImportSummary analysis={analysis} />

            {hasDuplicates ? (
              <DuplicateStrategyPrompt
                count={analysis.duplicati.length}
                onChoose={handleImport}
              />
            ) : hasNewOrDuplicates ? (
              <div className="ie-confirm-row">
                <button className="ie-confirm-btn" onClick={handleConfirmNoDuplicates} disabled={loading}>
                  Conferma import
                </button>
                <button className="ie-cancel-btn" onClick={handleReset} disabled={loading}>
                  Annulla
                </button>
              </div>
            ) : (
              <div className="ie-confirm-row">
                <p className="ie-no-data">Nessuna riga valida da importare.</p>
                <button className="ie-cancel-btn" onClick={handleReset}>Chiudi</button>
              </div>
            )}
          </div>
        )}

        {report && (
          <div className="ie-analysis-flow">
            <ImportReport report={report} />
            <button className="ie-cancel-btn" onClick={handleReset}>Nuovo import</button>
          </div>
        )}
      </section>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
