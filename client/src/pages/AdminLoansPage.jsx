import { useState, useEffect } from "react";
import { getAllLoans, returnLoan, sendReminders } from "../services/api";
import LoanCard from "../components/LoanCard";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import "./AdminLoansPage.css";

export default function AdminLoansPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [toast, setToast] = useState(null);
  const [sending, setSending] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    getAllLoans()
      .then(setLoans)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function reloadLoans() {
    getAllLoans()
      .then(setLoans)
      .catch((err) => setError(err.message));
  }

  function handleForceReturn(loanId) {
    setConfirmId(loanId);
  }

  function executeReturn() {
    const loanId = confirmId;
    setConfirmId(null);
    returnLoan(loanId)
      .then(() => {
        setToast({ message: "Prestito restituito con successo", type: "success" });
        reloadLoans();
      })
      .catch((err) => setToast({ message: err.message, type: "error" }));
  }

  function handleSendReminders() {
    setSending(true);
    sendReminders()
      .then((result) => {
        setToast({
          message: result.sent > 0
            ? `Promemoria inviati: ${result.sent}` + (result.failed > 0 ? `, falliti: ${result.failed}` : "")
            : "Nessun prestito in scadenza o scaduto.",
          type: result.failed > 0 ? "error" : "success",
        });
        if (result.previewUrls && result.previewUrls.length > 0) {
          setPreviewUrls(result.previewUrls);
        }
        reloadLoans();
      })
      .catch((err) => setToast({ message: err.message, type: "error" }))
      .finally(() => setSending(false));
  }

  if (loading) return <div className="loans-loading">Caricamento…</div>;
  if (error) return <div className="loans-error">Errore: {error}</div>;

  const active = loans.filter((l) => l.status === "active");
  const overdue = loans.filter((l) => l.status === "overdue");
  const returned = loans.filter((l) => l.status === "returned");

  return (
    <div className="loans-page">
      <div className="loans-header">
        <h1 className="loans-heading">Gestione prestiti</h1>
        <button className="loans-reminder-btn" onClick={handleSendReminders} disabled={sending}>
          {sending ? "Invio in corso…" : "Invia promemoria"}
        </button>
      </div>

      {previewUrls.length > 0 && (
        <div className="loans-preview-links">
          <strong>Anteprima email (Ethereal):</strong>
          <ul>
            {previewUrls.map((url, i) => (
              <li key={i}><a href={url} target="_blank" rel="noopener noreferrer">{url}</a></li>
            ))}
          </ul>
        </div>
      )}

      {loans.length === 0 ? (
        <p className="loans-empty">Nessun prestito presente.</p>
      ) : (
        <>
          {overdue.length > 0 && (
            <section className="loans-section">
              <h2 className="loans-section-title loans-section-title--overdue">Scaduti ({overdue.length})</h2>
              <div className="loans-list">
                {overdue.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} onReturn={handleForceReturn} variant="admin" />
                ))}
              </div>
            </section>
          )}

          {active.length > 0 && (
            <section className="loans-section">
              <h2 className="loans-section-title">Attivi ({active.length})</h2>
              <div className="loans-list">
                {active.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} onReturn={handleForceReturn} variant="admin" />
                ))}
              </div>
            </section>
          )}

          {returned.length > 0 && (
            <section className="loans-section">
              <h2 className="loans-section-title">Restituiti ({returned.length})</h2>
              <div className="loans-list">
                {returned.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} onReturn={handleForceReturn} variant="admin" />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {confirmId && (
        <ConfirmModal
          message="Sei sicuro di voler forzare la restituzione?"
          onConfirm={executeReturn}
          onCancel={() => setConfirmId(null)}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
