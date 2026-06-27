// ===============================================================
// CatalogPage.jsx
// ===============================================================

//React imports
import { useState, useEffect } from "react";

// Component imports
import BookCard from "../components/BookCard";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";

// Service imports
import { getBooks } from "../services/api";


export default function CatalogPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    q: "",
    author: "",
    genre: "",
    year: "",
    available: false,
  });

  useEffect(() => {
    async function fetchBooks() {
      try {
        const data = await getBooks(filters);
        setBooks(data);
      } catch (err) {
        setError(err.message);
      }
      finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, [filters]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Catalogo dei Libri</h1>
        <SearchBar q={filters.q} onSearch={(q) => setFilters((f) => ({ ...f, q }))} />
        <FilterBar q={filters} onSearch={setFilters} />
      {books.map((book, index) => (
        <BookCard key={index} book={book} />
      ))}
    </div>
  );
}