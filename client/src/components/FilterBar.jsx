import { useState } from 'react';
import './FilterBar.css';

export default function FilterBar({ q, onSearch }) {
    const [localFilters, setLocalFilters] = useState({
        author: q.author || '',
        genre: q.genre || '',
        year: q.year || '',
        available: q.available || false
    });

    return (
        <div className="filter-bar">
            <form onSubmit={(e) => { e.preventDefault(); onSearch(localFilters); }}>
                <input
                    type="text"
                    placeholder="Autore"
                    value={localFilters.author}
                    onChange={(e) => setLocalFilters({ ...localFilters, author: e.target.value })}
                />
                <input
                    type="text"
                    placeholder="Genere"
                    value={localFilters.genre}
                    onChange={(e) => setLocalFilters({ ...localFilters, genre: e.target.value })}
                />
                <input
                    type="number"
                    placeholder="Anno"
                    value={localFilters.year}
                    onChange={(e) => setLocalFilters({ ...localFilters, year: e.target.value })}
                />
                <label>
                    <input
                        type="checkbox"
                        checked={localFilters.available}
                        onChange={(e) => setLocalFilters({ ...localFilters, available: e.target.checked })}
                    />
                    Solo disponibili
                </label>
                <button type="submit">Filtra</button>
            </form>
        </div>
    );
}