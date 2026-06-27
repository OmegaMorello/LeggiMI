import { useState } from "react";
import "./FilterBar.css";

const EMPTY = { author: "", genre: "", year: "", available: false };

export default function FilterBar({ filters, genres, authors, onApply }) {
  const [local, setLocal] = useState({
    author: filters.author || "",
    genre: filters.genre || "",
    year: filters.year || "",
    available: filters.available || false,
  });

  function handleSubmit(e) {
    e.preventDefault();
    onApply(local);
  }

  function handleReset() {
    setLocal(EMPTY);
    onApply(EMPTY);
  }

  return (
    <aside className="filter-bar">
      <h3>Filtri</h3>
      <form onSubmit={handleSubmit}>
        <div className="filter-field">
          <span>Genere</span>
          <select
            value={local.genre}
            onChange={(e) => setLocal({ ...local, genre: e.target.value })}
          >
            <option value="">Tutti</option>
            {genres.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <span>Autore</span>
          <select
            value={local.author}
            onChange={(e) => setLocal({ ...local, author: e.target.value })}
          >
            <option value="">Tutti</option>
            {authors.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <span>Anno</span>
          <input
            type="number"
            placeholder="es. 2005"
            value={local.year}
            onChange={(e) => setLocal({ ...local, year: e.target.value })}
          />
        </div>

        <label className="filter-check">
          <input
            type="checkbox"
            checked={local.available}
            onChange={(e) => setLocal({ ...local, available: e.target.checked })}
          />
          Solo disponibili
        </label>

        <div className="filter-actions">
          <button className="filter-apply" type="submit">Filtra</button>
          <button className="filter-reset" type="button" onClick={handleReset}>
            Reset
          </button>
        </div>
      </form>
    </aside>
  );
}
