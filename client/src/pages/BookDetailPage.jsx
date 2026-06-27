
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBook } from "../services/api";
import "./BookDetailPage.css";


export default function BookDetailPage() {
    const [book, setBook] = useState(null);
    const { id } = useParams();
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        let stale = false;
        getBook(id)
            .then((data) => { if (!stale) { setBook(data); } })
            .catch((err) => { if (!stale) { setError(err.message); } });
        return () => { stale = true; };
    }, [id]);

    if (error) return <div className="book-detail-error">Errore: {error}</div>;
    if (!book) return <div className="book-detail-not-found">Libro non trovato</div>;

  return (
    <div className="book-detail">
        { book?.cover_url ? <img src={book.cover_url} alt={book.title} /> : <div className="no-image">No image available</div> }
      <h1>{ book?.title }</h1>
      <p>ISBN: { book?.isbn }</p>
      <p>Autore: { book?.author }</p>
        <p>Genere: { book?.genre }</p>
        <p>Anno: { book?.year }</p>
      <p>Descrizione: { book?.description }</p>

        <p>Disponibili per il noleggio: { book?.availableCopies }</p>
        <button onClick={() => navigate(-1)}>
            Torna al catalogo
        </button>
        <button disabled={book?.availableCopies === 0} onClick={() => {}}>
            Noleggia
        </button>
    </div>
  );
}