import { useState, useEffect } from "react";
import { getMyLoans, returnLoan, getMyReservations, cancelReservation } from "../services/api";
import LoanCard from "../components/LoanCard";
import ReservationCard from "../components/ReservationCard";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import "./MyLoansPage.css";

export default function MyLoansPage() {
  const [loans, setLoans] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [cancelId, setCancelId] = useState(null);

  useEffect(() => {
    let stale = false;
    Promise.all([getMyLoans(), getMyReservations()])
      .then(([loansData, resData]) => {
        if (!stale) {
          setLoans(loansData);
          setReservations(resData);
        }
      })
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

  function handleCancelReservation() {
    cancelReservation(cancelId)
      .then(() => {
        setReservations((prev) => prev.filter((r) => r.id !== cancelId));
        setToast({ message: "Prenotazione annullata", type: "success" });
      })
      .catch((err) => setToast({ message: err.message, type: "error" }))
      .finally(() => setCancelId(null));
  }

  if (loading) return <div className="loans-loading">Caricamento…</div>;
  if (error) return <div className="loans-error">Errore: {error}</div>;

  const overdue = loans.filter((l) => l.status === "overdue");
  const active = loans.filter((l) => l.status === "active");
  const returned = loans.filter((l) => l.status === "returned");
  const waitingRes = reservations.filter((r) => r.status === "waiting");
  const pastRes = reservations.filter((r) => r.status !== "waiting");

  return (
    <div className="loans-page">
      <h1 className="loans-heading">I miei prestiti</h1>

      {loans.length === 0 ? (
        <p className="loans-empty">Non hai ancora effettuato prestiti.</p>
      ) : (
        <>
          {overdue.length > 0 && (
            <section className="loans-section">
              <h2 className="loans-section-title loans-section-title--overdue">Scaduti ({overdue.length})</h2>
              <div className="loans-list">
                {overdue.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} onReturn={handleReturn} />
                ))}
              </div>
            </section>
          )}

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

      <h1 className="loans-heading" style={{ marginTop: 40 }}>Le mie prenotazioni</h1>

      {reservations.length === 0 ? (
        <p className="loans-empty">Non hai prenotazioni.</p>
      ) : (
        <>
          {waitingRes.length > 0 && (
            <section className="loans-section">
              <h2 className="loans-section-title">In attesa ({waitingRes.length})</h2>
              <div className="loans-list">
                {waitingRes.map((r) => (
                  <ReservationCard key={r.id} reservation={r} onCancel={setCancelId} />
                ))}
              </div>
            </section>
          )}

          {pastRes.length > 0 && (
            <section className="loans-section">
              <h2 className="loans-section-title">Passate ({pastRes.length})</h2>
              <div className="loans-list">
                {pastRes.map((r) => (
                  <ReservationCard key={r.id} reservation={r} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {cancelId && (
        <ConfirmModal
          message="Vuoi annullare questa prenotazione?"
          onConfirm={handleCancelReservation}
          onCancel={() => setCancelId(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
