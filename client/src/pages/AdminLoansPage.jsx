import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllLoans, returnLoan } from "../services/api";
import LoanCard from "../components/LoanCard";
import "./AdminLoansPage.css";

export default function AdminLoansPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let stale = false;
    getAllLoans()
      .then((data) => { if (!stale) setLoans(data); })
      .catch((err) => { if (!stale) setError(err.message); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, []);

  if (loading) return <div className="detail-loading">Caricamento…</div>;
  if (error) return <div className="detail-error">Errore: {error}</div>;

  function handleForceReturn(loanId) {
    if (!window.confirm("Sei sicuro di voler forzare la restituzione di questo prestito?")) return;
    returnLoan(loanId)
      .then(() => getAllLoans())
      .then(setLoans)
      .catch((err) => setError(err.message));
  }

  return (
    <div className="admin-loans">
      <button className="detail-back" onClick={() => navigate("/")}>
        ← Catalogo
      </button>
      <h1>Gestione Prestiti</h1>
      {loans.length === 0 ? (
        <p>Nessun prestito presente.</p>
      ) : (
        <ul className="loan-list">
          {loans.map((loan) => (
            <li key={loan.id} className="loan-item">
              <LoanCard loan={loan} onReturn={handleForceReturn} variant="admin" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
