import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyLoans, returnLoan } from "../services/api";
import LoanCard from "../components/LoanCard";
import "./MyLoansPage.css";


export default function MyLoansPage() {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        let stale = false;
        getMyLoans()
            .then((data) => { if (!stale) { setLoans(data); } })
            .catch((err) => { if (!stale) setError(err.message); })
            .finally(() => { if (!stale) setLoading(false); });
        return () => { stale = true; };
    }, []);

    if (loading) return <div className="detail-loading">Caricamento…</div>;
    if (error) return <div className="detail-error">Errore: {error}</div>;

    const handleReturn = (loanId) => {
        returnLoan(loanId)
            .then(() => {
                setLoans((prevLoans) =>
                    prevLoans.map((loan) =>
                        loan.id === loanId ? { ...loan, status: "returned" } : loan
                    )
                );
            })
            .catch((error) => console.error(error));
    };

    return (
        <div className="my-loans">
            <button className="detail-back" onClick={() => navigate("/")}>
                ← Catalogo
            </button>
            <h1>My Loans</h1>
            {loans.length === 0 ? (
                <p>You have no loans.</p>
            ) : (
                <ul className="loan-list">
                    {loans.map((loan) => (
                        <li key={loan.id} className="loan-item">
                            <LoanCard loan={loan} onReturn={handleReturn} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}   
    