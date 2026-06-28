import { useState, useEffect } from "react";
import { getAllLoans, returnLoan } from "../services/api";
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

  if (loading) return <div className="loans-loading">Caricamento…</div>;
  if (error) return <div className="loans-error">Errore: {error}</div>;

  const active = loans.filter((l) => l.status === "active");
  const returned = loans.filter((l) => l.status === "returned");

  return (
    <div className="loans-page">
      <h1 className="loans-heading">Gestione prestiti</h1>

      {loans.length === 0 ? (
        <p className="loans-empty">Nessun prestito presente.</p>
      ) : (
        <>
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
