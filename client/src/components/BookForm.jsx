import { useState } from "react";
import { lookupIsbn } from "../services/api";
import "./BookForm.css";

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='170' fill='%23e5e4e7'%3E%3Crect width='120' height='170'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='40' fill='%239ca3af'%3E📖%3C/text%3E%3C/svg%3E";

export default function BookForm({ book, onSubmit, onCancel, loading }) {
  const isEdit = !!book;

  const [form, setForm] = useState({
    title: book?.title || "",
    author: book?.author || "",
    genre: book?.genre || "",
    year: book?.year || "",
    isbn: book?.isbn || "",
    cover_url: book?.cover_url || "",
    description: book?.description || "",
    title_original: book?.title_original || "",
    initialCopies: 1,
  });

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(book?.cover_url || "");
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [isbnError, setIsbnError] = useState(null);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setForm((prev) => ({ ...prev, cover_url: "" }));
  }

  async function handleIsbnLookup() {
    const isbn = form.isbn.trim();
    if (!isbn) return;
    setIsbnLoading(true);
    setIsbnError(null);
    try {
      const data = await lookupIsbn(isbn);
      setForm((prev) => ({
        ...prev,
        title: data.title || prev.title,
        author: data.author || prev.author,
        year: data.year || prev.year,
        description: data.description || prev.description,
        cover_url: data.cover_url || prev.cover_url,
      }));
      if (data.cover_url) {
        setCoverPreview(data.cover_url);
        setCoverFile(null);
      }
    } catch (err) {
      setIsbnError(err.message);
    } finally {
      setIsbnLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form, coverFile);
  }

  const previewSrc = coverPreview || form.cover_url || PLACEHOLDER;

  return (
    <form className="book-form" onSubmit={handleSubmit}>
      <div className="book-form-layout">
        <div className="book-form-cover-section">
          <img
            className="book-form-preview"
            src={previewSrc}
            alt="Anteprima copertina"
            onError={(e) => { e.target.src = PLACEHOLDER; }}
          />
          <label className="book-form-file-label">
            Carica file
            <input type="file" accept="image/*" onChange={handleFileChange} hidden />
          </label>
        </div>

        <div className="book-form-fields">
          <div className="book-form-row">
            <label className="book-form-label">
              ISBN
              <div className="book-form-isbn-row">
                <input name="isbn" value={form.isbn} onChange={handleChange} placeholder="es. 9788804668237" className="book-form-input" />
                <button type="button" className="book-form-isbn-btn" onClick={handleIsbnLookup} disabled={isbnLoading || !form.isbn.trim()}>
                  {isbnLoading ? "Cerco…" : "Cerca da ISBN"}
                </button>
              </div>
              {isbnError && <span className="book-form-isbn-error">{isbnError}</span>}
            </label>
          </div>

          <div className="book-form-row">
            <label className="book-form-label">
              Titolo *
              <input name="title" value={form.title} onChange={handleChange} required className="book-form-input" />
            </label>
          </div>

          <div className="book-form-row">
            <label className="book-form-label">
              Autore *
              <input name="author" value={form.author} onChange={handleChange} required className="book-form-input" />
            </label>
          </div>

          <div className="book-form-row book-form-row--half">
            <label className="book-form-label">
              Genere
              <input name="genre" value={form.genre} onChange={handleChange} className="book-form-input" />
            </label>
            <label className="book-form-label">
              Anno
              <input name="year" type="number" value={form.year} onChange={handleChange} className="book-form-input" />
            </label>
          </div>

          <div className="book-form-row">
            <label className="book-form-label">
              Titolo originale
              <input name="title_original" value={form.title_original} onChange={handleChange} className="book-form-input" />
            </label>
          </div>

          <div className="book-form-row">
            <label className="book-form-label">
              Descrizione
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="book-form-input book-form-textarea" />
            </label>
          </div>

          {!isEdit && (
            <div className="book-form-row">
              <label className="book-form-label">
                Copie iniziali
                <input name="initialCopies" type="number" min={1} value={form.initialCopies} onChange={handleChange} className="book-form-input book-form-input--short" />
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="book-form-actions">
        <button type="button" className="book-form-cancel" onClick={onCancel}>Annulla</button>
        <button type="submit" className="book-form-submit" disabled={loading}>
          {loading ? "Salvataggio…" : isEdit ? "Salva modifiche" : "Crea libro"}
        </button>
      </div>
    </form>
  );
}
