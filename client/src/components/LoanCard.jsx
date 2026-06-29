import { useState } from "react";
import { Link } from "react-router-dom";
import "./LoanCard.css";

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='90' fill='%23e5e4e7'%3E%3Crect width='60' height='90'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='24' fill='%239ca3af'%3E📖%3C/text%3E%3C/svg%3E";

export default function LoanCard({ loan, onReturn, variant = "user" }) {
  const [imgSrc, setImgSrc] = useState(loan.cover_url || PLACEHOLDER);

  const isActive = loan.status === "active" || loan.status === "overdue";
  const isOverdue = loan.status === "overdue" || (loan.status === "active" && new Date(loan.due_date) < new Date());
  const isAdmin = variant === "admin";

  const statusLabel = loan.status === "returned" ? "Restituito" : isOverdue ? "In ritardo" : "Attivo";

  return (
    <div className={`loan-card ${isOverdue ? "loan-card--overdue" : ""}`}>
      <Link to={`/books/${loan.book_id}`} className="loan-cover-link">
        <img
          className="loan-cover"
          src={imgSrc}
          alt={`Copertina di ${loan.title}`}
          onError={() => setImgSrc(PLACEHOLDER)}
        />
      </Link>

      <div className="loan-body">
        <div className="loan-header">
          <Link to={`/books/${loan.book_id}`} className="loan-title">{loan.title}</Link>
          <span className={`loan-status loan-status--${loan.status === "returned" ? "returned" : isOverdue ? "overdue" : "active"}`}>
            {statusLabel}
          </span>
        </div>

        <div className="loan-details">
          {loan.author && <span className="loan-detail">Autore: {loan.author}</span>}
          <span className="loan-detail">Prestito: {new Date(loan.start_date).toLocaleDateString("it-IT")}</span>
          <span className="loan-detail">Scadenza: {new Date(loan.due_date).toLocaleDateString("it-IT")}</span>
          {isAdmin && loan.user_name && (
            <span className="loan-detail">Utente: {loan.user_name}</span>
          )}
        </div>

        {isActive && (
          <button className="loan-return-btn" onClick={() => onReturn(loan.id)}>
            {isAdmin ? "Forza restituzione" : "Restituisci"}
          </button>
        )}
      </div>
    </div>
  );
}
