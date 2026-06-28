import { Link } from "react-router-dom";
import "./ReservationCard.css";

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='90' fill='%23e5e4e7'%3E%3Crect width='60' height='90'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='24' fill='%239ca3af'%3E📖%3C/text%3E%3C/svg%3E";

export default function ReservationCard({ reservation, onCancel, variant }) {
  const r = reservation;
  const isWaiting = r.status === "waiting";
  const isAdmin = variant === "admin";

  const statusLabel = isWaiting ? `In coda (${r.position}°)` : r.status === "fulfilled" ? "Completata" : "Annullata";
  const statusClass = isWaiting ? "waiting" : r.status === "fulfilled" ? "fulfilled" : "cancelled";

  return (
    <div className="res-card">
      <Link to={`/books/${r.book_id}`} className="res-cover-link">
        <img className="res-cover" src={r.cover_url || PLACEHOLDER} alt="" onError={(e) => { e.target.src = PLACEHOLDER; }} />
      </Link>
      <div className="res-body">
        <div className="res-header">
          <Link to={`/books/${r.book_id}`} className="res-title">{r.title}</Link>
          <span className={`res-status res-status--${statusClass}`}>{statusLabel}</span>
        </div>
        <div className="res-details">
          {isAdmin && r.user_name && <span className="res-detail">Utente: {r.user_name}</span>}
          {r.author && <span className="res-detail">Autore: {r.author}</span>}
          <span className="res-detail">Prenotato: {new Date(r.created_at).toLocaleDateString("it-IT")}</span>
        </div>
        {isWaiting && onCancel && (
          <button className="res-cancel-btn" onClick={() => onCancel(r.id)}>Annulla prenotazione</button>
        )}
      </div>
    </div>
  );
}
