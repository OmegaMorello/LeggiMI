import { useState } from "react";

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' fill='%23e5e4e7'%3E%3Crect width='200' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='%239ca3af'%3E📖%3C/text%3E%3C/svg%3E";

export default function LoanCard({ loan, onReturn, variant = "user" }) {
  const [imgSrc, setImgSrc] = useState(loan.cover_url || PLACEHOLDER);

  const isOverdue = loan.status === "active" && new Date(loan.due_date) < new Date();
    const isAdmin = variant === "admin";


  return (
    <div className={`loan-card ${isOverdue ? "overdue" : ""}`}>
      <img
        className="loan-cover"
        src={imgSrc}
        alt={`Copertina di ${loan.title}`}
        loading="lazy"
        onError={() => setImgSrc(PLACEHOLDER)}
      />
      <div className="loan-title">{loan.title}</div>
      <div className="loan-due-date">
        Scadenza: {new Date(loan.due_date).toLocaleDateString()}
      </div>
      { loan.user_name && <div className="loan-user">Utente: {loan.user_name}</div> }
      <div className="loan-status">Stato: {loan.status}</div>
      {loan.status === "active" && (
        <button className="loan-return" onClick={() => onReturn(loan.id)}>
          {isAdmin ? "Forza restituzione" : "Restituisci"}
        </button>
      )}
    </div>
  );
}