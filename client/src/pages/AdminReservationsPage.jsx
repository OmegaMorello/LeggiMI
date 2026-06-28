import { useState, useEffect } from "react";
import { getAllReservations, cancelReservation } from "../services/api";
import ReservationCard from "../components/ReservationCard";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import "./MyLoansPage.css";

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelId, setCancelId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getAllReservations()
      .then(setReservations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function reloadReservations() {
    getAllReservations()
      .then(setReservations)
      .catch((err) => setError(err.message));
  }

  function executeCancelReservation() {
    const id = cancelId;
    setCancelId(null);
    cancelReservation(id)
      .then(() => {
        setToast({ message: "Prenotazione annullata", type: "success" });
        reloadReservations();
      })
      .catch((err) => setToast({ message: err.message, type: "error" }));
  }

  if (loading) return <div className="loans-loading">Caricamento…</div>;
  if (error) return <div className="loans-error">Errore: {error}</div>;

  const waiting = reservations.filter((r) => r.status === "waiting");
  const fulfilled = reservations.filter((r) => r.status === "fulfilled");
  const cancelled = reservations.filter((r) => r.status === "cancelled");

  return (
    <div className="loans-page">
      <h1 className="loans-heading">Gestione prenotazioni</h1>

      {reservations.length === 0 ? (
        <p className="loans-empty">Nessuna prenotazione presente.</p>
      ) : (
        <>
          {waiting.length > 0 && (
            <section className="loans-section">
              <h2 className="loans-section-title">In attesa ({waiting.length})</h2>
              <div className="loans-list">
                {waiting.map((r) => (
                  <ReservationCard key={r.id} reservation={r} onCancel={setCancelId} variant="admin" />
                ))}
              </div>
            </section>
          )}

          {fulfilled.length > 0 && (
            <section className="loans-section">
              <h2 className="loans-section-title">Completate ({fulfilled.length})</h2>
              <div className="loans-list">
                {fulfilled.map((r) => (
                  <ReservationCard key={r.id} reservation={r} variant="admin" />
                ))}
              </div>
            </section>
          )}

          {cancelled.length > 0 && (
            <section className="loans-section">
              <h2 className="loans-section-title">Annullate ({cancelled.length})</h2>
              <div className="loans-list">
                {cancelled.map((r) => (
                  <ReservationCard key={r.id} reservation={r} variant="admin" />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {cancelId && (
        <ConfirmModal
          message="Vuoi annullare questa prenotazione?"
          onConfirm={executeCancelReservation}
          onCancel={() => setCancelId(null)}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
