import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMostRequested } from "../services/api";
import "./StatsPage.css";

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='56' fill='%23e5e4e7'%3E%3Crect width='40' height='56'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='16' fill='%239ca3af'%3E📖%3C/text%3E%3C/svg%3E";

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
            <div key={book.id} className="stats-row">
              <span className="stats-rank">#{i + 1}</span>
              <Link to={`/books/${book.id}`} className="stats-cover-link">
                <img
                  className="stats-cover"
                  src={book.cover_url || PLACEHOLDER}
                  alt=""
                  onError={(e) => { e.target.src = PLACEHOLDER; }}
                />
              </Link>
              <div className="stats-info">
                <div className="stats-title-row">
                  <Link to={`/books/${book.id}`} className="stats-title">{book.title}</Link>
                </div>
                <span className="stats-author">{book.author}</span>
                <div className="stats-bar-wrap">
                  <div
                    className="stats-bar"
                    style={{ width: `${(book.loan_count / maxLoans) * 100}%` }}
                  />
                </div>
                <div className="stats-counts">
                  <span className="stats-count-primary">{book.loan_count} prestit{book.loan_count === 1 ? "o" : "i"}</span>
                  <span className="stats-count-secondary">{book.reservation_count} prenotazion{book.reservation_count === 1 ? "e" : "i"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
