import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBook } from "../services/api";
import { requestLoan } from "../services/api";
import "./BookDetailPage.css";

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='400' fill='%23e5e4e7'%3E%3Crect width='280' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='64' fill='%239ca3af'%3E📖%3C/text%3E%3C/svg%3E";

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgSrc, setImgSrc] = useState(PLACEHOLDER);

  useEffect(() => {
    let stale = false;
    getBook(id)
      .then((data) => {
        if (!stale) {
          setBook(data);
          setImgSrc(data.cover_url || PLACEHOLDER);
        }
      })
      .catch((err) => { if (!stale) setError(err.message); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [id]);

  if (loading) return <div className="detail-loading">Caricamento…</div>;
  if (error) return <div className="detail-error">Errore: {error}</div>;
  if (!book) return <div className="detail-error">Libro non trovato</div>;

  const hasAvailable = book.availableCopies > 0;

  return (
    <div className="detail">
      <button className="detail-back" onClick={() => navigate("/")}>
        ← Catalogo
      </button>

      <div className="detail-card">
        <div className="detail-top">
          <div className="detail-cover-wrap">
            <img
              className="detail-cover"
              src={imgSrc}
              alt={`Copertina di ${book.title}`}
              onError={() => setImgSrc(PLACEHOLDER)}
            />
          </div>

          <div className="detail-info">
            <h1 className="detail-title">{book.title}</h1>
            <p className="detail-author">{book.author}</p>

            <div className="detail-meta">
              {book.genre && <span className="detail-badge">{book.genre}</span>}
              {book.year && <span className="detail-badge">{book.year}</span>}
            </div>

            {book.isbn && (
              <p className="detail-isbn">ISBN {book.isbn}</p>
            )}

            <div className="detail-availability">
              <span className={`detail-avail-dot ${hasAvailable ? "available" : "unavailable"}`} />
              {hasAvailable
                ? `${book.availableCopies} ${book.availableCopies === 1 ? "copia disponibile" : "copie disponibili"}`
                : "Nessuna copia disponibile"}
            </div>
          </div>
        </div>

        {book.description && (
          <div className="detail-description">
            <h2 className="detail-desc-label">Trama</h2>
            <p className="detail-desc-text">{book.description}</p>
          </div>
        )}
      </div>

      <button
        className="detail-borrow"
        disabled={!hasAvailable}
        onClick={() => 
          requestLoan({ bookId: book.id })
            .then(() => alert("Prestito richiesto con successo!"))
            .then(() => getBook(id).then((data) => setBook(data)))
            .catch((err) => alert(`Errore: ${err.message}`))
        }
      >
        {hasAvailable ? "Noleggia questo libro" : "Non disponibile"}
      </button>
    </div>
  );
}
