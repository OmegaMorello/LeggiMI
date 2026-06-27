import { useState, useEffect, useMemo } from "react";
import BookCard from "../components/BookCard";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import { getBooks } from "../services/api";
import "./CatalogPage.css";

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
    let stale = false;
    getBooks(filters)
      .then((data) => { if (!stale) { setBooks(data); setError(null); } })
      .catch((err) => { if (!stale) setError(err.message); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [filters]);

  const genres = useMemo(
    () => [...new Set(books.map((b) => b.genre).filter(Boolean))].sort(),
    [books],
  );

  const authors = useMemo(
    () => [...new Set(books.map((b) => b.author).filter(Boolean))].sort(),
    [books],
  );

  function handleSearch(q) {
    setLoading(true);
    setFilters((f) => ({ ...f, q }));
  }

  function handleFilter(patch) {
    setLoading(true);
    setFilters((f) => ({ ...f, ...patch }));
  }

  return (
    <div className="catalog">
      <div className="catalog-sidebar">
        <FilterBar
          filters={filters}
          genres={genres}
          authors={authors}
          onApply={handleFilter}
        />
      </div>

      <div className="catalog-main">
        <SearchBar q={filters.q} onSearch={handleSearch} />

        {loading && <p className="catalog-loading">Caricamento catalogo…</p>}

        {error && <p className="catalog-error">{error}</p>}

        {!loading && !error && (
          <>
            <p className="catalog-count">
              <strong>{books.length}</strong>{" "}
              {books.length === 1 ? "libro trovato" : "libri trovati"}
            </p>

            {books.length === 0 ? (
              <p className="catalog-empty">
                Nessun libro corrisponde ai criteri di ricerca.
              </p>
            ) : (
              <div className="catalog-grid">
                {books.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
