import { useState } from "react";
import "./SearchBar.css";

export default function SearchBar({ q, onSearch }) {
    const [localValue, setLocalValue] = useState(q);

    return (
        <div className="search-bar">
            <form onSubmit={(e) => { e.preventDefault(); onSearch(localValue); }}>
            <input
                type="text"
                placeholder="Cerca per titolo o autore..."
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
            />
            <button className="search-button" type="submit">Cerca</button>
            <button className="reset-button" type="button" onClick={() => { setLocalValue(""); onSearch(""); }}>Reset</button>
            </form>
        </div>
    );
}