import { useState, useEffect } from "react";
import { getBooks, getBook, createBook, updateBook, deleteBook, uploadCover, addCopy, removeCopy } from "../services/api";
import BookForm from "../components/BookForm";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import "./BooksAdmin.css";

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='56' fill='%23e5e4e7'%3E%3Crect width='40' height='56'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='16' fill='%239ca3af'%3E📖%3C/text%3E%3C/svg%3E";

export default function BooksAdmin() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [formMode, setFormMode] = useState(null);
  const [editBook, setEditBook] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [copyDelete, setCopyDelete] = useState(null);
  const [expandedBook, setExpandedBook] = useState(null);

  useEffect(() => {
    let stale = false;
    getBooks({})
      .then((data) => {
        if (!stale) setBooks(data);
      })
      .catch((err) => { if (!stale) setError(err.message); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, []);

  function reloadBooks() {
    getBooks({}).then(setBooks).catch((err) => setError(err.message));
  }

  function openCreate() {
    setEditBook(null);
    setFormMode("create");
  }

  function openEdit(book) {
    getBook(book.id)
      .then((full) => {
        setEditBook(full);
        setFormMode("edit");
      })
      .catch((err) => setToast({ message: err.message, type: "error" }));
  }

  async function handleFormSubmit(formData, coverFile) {
    setFormLoading(true);
    try {
      let saved;
      if (formMode === "create") {
        saved = await createBook(formData);
        setToast({ message: "Libro creato", type: "success" });
      } else {
        saved = await updateBook(editBook.id, formData);
        setToast({ message: "Libro aggiornato", type: "success" });
      }
      if (coverFile) {
        await uploadCover(saved.id, coverFile);
      }
      setFormMode(null);
      reloadBooks();
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setFormLoading(false);
    }
  }

  function handleDelete() {
    const id = deleteId;
    setDeleteId(null);
    deleteBook(id)
      .then(() => {
        setToast({ message: "Libro eliminato", type: "success" });
        if (expandedBook === id) setExpandedBook(null);
        reloadBooks();
      })
      .catch((err) => setToast({ message: err.message, type: "error" }));
  }

  function toggleCopies(bookId) {
    if (expandedBook === bookId) {
      setExpandedBook(null);
    } else {
      getBook(bookId)
        .then((full) => {
          setBooks((prev) => prev.map((b) => b.id === bookId ? { ...b, _copies: full.copies } : b));
          setExpandedBook(bookId);
        })
        .catch((err) => setToast({ message: err.message, type: "error" }));
    }
  }

  function updateBookCopies(bookId, full) {
    setBooks((prev) => prev.map((b) => (
      b.id === bookId
        ? {
            ...b,
            ...full,
            _copies: full.copies,
            totalCopies: full.copies.length,
            availableCopies: full.availableCopies,
          }
        : b
    )));
  }

  async function refreshBookCopies(bookId) {
    const full = await getBook(bookId);
    updateBookCopies(bookId, full);
  }

  function handleAddCopy(bookId, quantity) {
    addCopy(bookId, quantity)
      .then(() => refreshBookCopies(bookId))
      .then(() => {
        setToast({
          message: quantity === 1 ? "Copia aggiunta" : `${quantity} copie aggiunte`,
          type: "success",
        });
      })
      .catch((err) => setToast({ message: err.message, type: "error" }));
  }

  function handleRemoveCopy() {
    const target = copyDelete;
    setCopyDelete(null);
    if (!target) return;

    removeCopy(target.bookId, target.copyId)
      .then(() => {
        setToast({ message: "Copia rimossa", type: "success" });
        return refreshBookCopies(target.bookId);
      })
      .catch((err) => setToast({ message: err.message, type: "error" }));
  }

  if (loading) return <div className="loans-loading">Caricamento…</div>;
  if (error) return <div className="loans-error">Errore: {error}</div>;

  if (formMode) {
    return (
      <div className="ba-page">
        <h1 className="ba-heading">{formMode === "create" ? "Nuovo libro" : "Modifica libro"}</h1>
        <BookForm
          book={formMode === "edit" ? editBook : undefined}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormMode(null)}
          loading={formLoading}
        />
      </div>
    );
  }

  return (
    <div className="ba-page">
      <div className="ba-header">
        <h1 className="ba-heading">Gestione libri</h1>
        <button className="ba-add-btn" onClick={openCreate}>+ Nuovo libro</button>
      </div>

      <div className="ba-table-wrap">
        <table className="ba-table">
          <thead>
            <tr>
              <th></th>
              <th>Titolo</th>
              <th>Autore</th>
              <th>Genere</th>
              <th>Anno</th>
              <th>Copie</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <BooksAdminRow
                key={book.id}
                book={book}
                expanded={expandedBook === book.id}
                onEdit={() => openEdit(book)}
                onDelete={() => setDeleteId(book.id)}
                onToggleCopies={() => toggleCopies(book.id)}
                onAddCopy={(quantity) => handleAddCopy(book.id, quantity)}
                onRemoveCopy={(copy) => setCopyDelete({ bookId: book.id, copyId: copy.id, code: copy.code })}
              />
            ))}
          </tbody>
        </table>
      </div>

      {deleteId && (
        <ConfirmModal
          message="Sei sicuro di voler eliminare questo libro? Le copie e i prestiti restituiti verranno rimossi."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
      {copyDelete && (
        <ConfirmModal
          message={`Sei sicuro di voler eliminare la copia ${copyDelete.code}?`}
          onConfirm={handleRemoveCopy}
          onCancel={() => setCopyDelete(null)}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function BooksAdminRow({ book, expanded, onEdit, onDelete, onToggleCopies, onAddCopy, onRemoveCopy }) {
  const [copyQuantity, setCopyQuantity] = useState(1);
  const copies = book._copies || [];
  const totalCopies = book.totalCopies ?? copies.length;

  function handleAddCopies(e) {
    e.preventDefault();
    const quantity = Math.max(1, parseInt(copyQuantity, 10) || 1);
    onAddCopy(quantity);
    setCopyQuantity(1);
  }

  return (
    <>
      <tr className="ba-row">
        <td className="ba-cell-cover">
          <img
            src={book.cover_url || PLACEHOLDER}
            alt=""
            className="ba-cover"
            onError={(e) => { e.target.src = PLACEHOLDER; }}
          />
        </td>
        <td className="ba-cell-title">{book.title}</td>
        <td>{book.author}</td>
        <td>{book.genre || "—"}</td>
        <td>{book.year || "—"}</td>
        <td>
          <button className="ba-copies-toggle" onClick={onToggleCopies}>
            {expanded ? "▾" : "▸"} {totalCopies || "?"}
          </button>
        </td>
        <td className="ba-cell-actions">
          <button className="ba-action-btn ba-action-btn--edit" onClick={onEdit}>Modifica</button>
          <button className="ba-action-btn ba-action-btn--delete" onClick={onDelete}>Elimina</button>
        </td>
      </tr>
      {expanded && (
        <tr className="ba-copies-row">
          <td colSpan={7}>
            <div className="ba-copies-panel">
              <div className="ba-copies-list">
                {copies.map((c) => (
                  <div key={c.id} className={`ba-copy ${c.status === "on_loan" ? "ba-copy--on-loan" : ""}`}>
                    <span className="ba-copy-code">{c.code}</span>
                    <span className={`ba-copy-status ba-copy-status--${c.status === "available" ? "available" : "on-loan"}`}>
                      {c.status === "available" ? "Disponibile" : "In prestito"}
                    </span>
                    {c.status === "available" && (
                      <button className="ba-copy-remove" onClick={() => onRemoveCopy(c)}>✕</button>
                    )}
                  </div>
                ))}
              </div>
              <form className="ba-copy-add-form" onSubmit={handleAddCopies}>
                <input
                  className="ba-copy-quantity"
                  type="number"
                  min={1}
                  value={copyQuantity}
                  onChange={(e) => setCopyQuantity(e.target.value)}
                  aria-label="Numero copie da aggiungere"
                />
                <button className="ba-copy-add" type="submit">+ Aggiungi</button>
              </form>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
