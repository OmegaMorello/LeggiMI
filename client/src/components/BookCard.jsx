import { useState } from "react";
import "./BookCard.css";

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' fill='%23e5e4e7'%3E%3Crect width='200' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='%239ca3af'%3E📖%3C/text%3E%3C/svg%3E";

export default function BookCard({ book }) {
  const [imgSrc, setImgSrc] = useState(book.cover_url || PLACEHOLDER);

  return (
    <div className="book-card">
      <img
        className="book-cover"
        src={imgSrc}
        alt={`Copertina di ${book.title}`}
        loading="lazy"
        onError={() => setImgSrc(PLACEHOLDER)}
      />
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{book.author}</p>
        <div className="book-meta">
          {book.genre && <span className="book-badge">{book.genre}</span>}
          {book.year && <span className="book-year">{book.year}</span>}
        </div>
      </div>
    </div>
  );
}
