import { useState, useEffect } from "react";
import { getMostRequested } from "../services/api";
import StatsRow from "../components/StatsRow";
import "./StatsPage.css";

export default function StatsPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let stale = false;
    getMostRequested()
      .then((data) => { if (!stale) setBooks(data); })
      .catch((err) => { if (!stale) setError(err.message); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, []);

  if (loading) return <div className="stats-loading">Caricamento…</div>;
  if (error) return <div className="stats-error">Errore: {error}</div>;

  const maxLoans = books.length > 0 ? books[0].loan_count : 1;

  return (
    <div className="stats-page">
      <h1 className="stats-heading">Libri più richiesti</h1>

      {books.length === 0 ? (
        <p className="stats-empty">Nessun prestito registrato.</p>
      ) : (
        <div className="stats-list">
          {books.map((book, i) => (
            <StatsRow key={book.id} book={book} rank={i + 1} maxLoans={maxLoans} />
          ))}
        </div>
      )}
    </div>
  );
}
