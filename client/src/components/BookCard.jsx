import "./BookCard.css";

export default function BookCard ({ book }) {
    return <div className="book-card">
        <h3>{book.title}</h3>
        <p><strong>Autore:</strong> {book.author}</p>
        <p><strong>Genere:</strong> {book.genre}</p>
        <p><strong>Anno:</strong> {book.year}</p>
    </div>;
}