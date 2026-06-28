import { useRef } from "react";
import "./CsvUploader.css";

export default function CsvUploader({ onFileSelected, disabled }) {
  const inputRef = useRef(null);

  function handleChange(e) {
    const file = e.target.files[0];
    if (file) onFileSelected(file);
    e.target.value = "";
  }

  return (
    <div className="csv-uploader">
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="csv-uploader-input"
        onChange={handleChange}
        disabled={disabled}
      />
      <button
        className="csv-uploader-btn"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        Scegli file CSV
      </button>
      <span className="csv-uploader-hint">Formato: title, author, genre, year, isbn, description, cover_url, copies</span>
    </div>
  );
}
