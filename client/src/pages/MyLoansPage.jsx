import { useState, useEffect } from "react";
import { getMyLoans, returnLoan } from "../services/api";
import LoanCard from "../components/LoanCard";
import Toast from "../components/Toast";
import "./MyLoansPage.css";

export default function MyLoansPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let stale = false;
    getMyLoans()
      .then((data) => { if (!stale) setLoans(data); })
      .catch((err) => { if (!stale) setError(err.message); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, []);

  function handleReturn(loanId) {
    returnLoan(loanId)
      .then(() => {
        setLoans((prev) =>
          prev.map((l) => l.id === loanId ? { ...l, status: "returned" } : l)
        );
        setToast({ message: "Libro restituito con successo", type: "success" });
      })
      .catch((err) => setToast({ message: err.message, type: "error" }));
  }

  if (loading) return <div className="loans-loading">Caricamento…</div>;
  if (error) return <div className="loans-error">Errore: {error}</div>;

  const active = loans.filter((l) => l.status === "active");
  const returned = loans.filter((l) => l.status === "returned");

  return (
    <div className="loans-page">
      <h1 className="loans-heading">I miei prestiti</h1>

      {loans.length === 0 ? (
        <p className="loans-empty">Non hai ancora effettuato prestiti.</p>
      ) : (
        <>
          {active.length > 0 && (
            <section className="loans-section">
              <h2 className="loans-section-title">Attivi ({active.length})</h2>
              <div className="loans-list">
                {active.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} onReturn={handleReturn} />
                ))}
              </div>
            </section>
          )}

          {returned.length > 0 && (
            <section className="loans-section">
              <h2 className="loans-section-title">Restituiti ({returned.length})</h2>
              <div className="loans-list">
                {returned.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} onReturn={handleReturn} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
