import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { db } from "../db/db.js";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import { extname, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(__dirname, "../../uploads/covers");
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) =>
    cb(null, `${randomUUID()}${extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

// GET /api/books  -> list catalog, with search & filters
router.get("/", requireAuth, (req, res) => {
  const q = (req.query.q || "").trim();
  const author = (req.query.author || "").trim();
  const genre = (req.query.genre || "").trim();
  const year = parseInt(req.query.year) || null;
  const available = req.query.available === "true";

  const dbQuery = db.prepare(
    `SELECT books.*,
       (SELECT COUNT(*) FROM copies WHERE copies.book_id = books.id) AS totalCopies,
       (SELECT COUNT(*) FROM copies WHERE copies.book_id = books.id AND copies.status = 'available') AS availableCopies
     FROM books
     WHERE 1=1
       AND (:q = '' OR title LIKE '%' || :q || '%' OR author LIKE '%' || :q || '%')
       AND (:author = '' OR author LIKE '%' || :author || '%')
       AND (:genre = '' OR genre LIKE '%' || :genre || '%')
       AND (:year IS NULL OR year = :year)
       AND (:available = 0 OR EXISTS (
         SELECT 1 FROM copies WHERE copies.book_id = books.id AND copies.status = 'available'
       ))`,
  );

  const books = dbQuery.all({
    q,
    author,
    genre,
    year,
    available: available ? 1 : 0,
  });

  res.json(books);
});

// GET /api/books/lookup/:isbn  -> lookup book metadata from Open Library
router.get("/lookup/:isbn", requireAdmin, async (req, res) => {
  const isbn = req.params.isbn.replace(/[^0-9Xx]/g, "");
  if (!isbn) return res.status(400).json({ error: "ISBN mancante" });

  try {
    const resp = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
    if (!resp.ok)
      return res
        .status(404)
        .json({ error: "ISBN non trovato su Open Library" });

    const data = await resp.json();

    let authorName = null;
    if (data.authors && data.authors.length > 0) {
      const authorKey = data.authors[0].key;
      const authorResp = await fetch(
        `https://openlibrary.org${authorKey}.json`,
      );
      if (authorResp.ok) {
        const authorData = await authorResp.json();
        authorName = authorData.name || null;
      }
    }

    let description = null;
    if (data.description) {
      description =
        typeof data.description === "string"
          ? data.description
          : data.description.value || null;
    }

    const coverUrl =
      data.covers && data.covers.length > 0
        ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`
        : null;

    const year = data.publish_date
      ? parseInt(data.publish_date.match(/\d{4}/)?.[0]) || null
      : null;

    res.json({
      title: data.title || null,
      author: authorName,
      year,
      description,
      cover_url: coverUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/books/:id  -> book detail + copies availability
router.get("/:id", requireAuth, (req, res) => {
  const bookId = parseInt(req.params.id);
  const book = db.prepare("SELECT * FROM books WHERE id = ?").get(bookId);
  if (!book) {
    return res.status(404).json({ error: "Book not found" });
  }

  const copies = db
    .prepare("SELECT * FROM copies WHERE book_id = ?")
    .all(bookId);
  const availableCopies = copies.filter((c) => c.status === "available").length;

  res.json({ ...book, copies, availableCopies });
});

// POST /api/books  -> add a book (admin)
router.post("/", requireAdmin, (req, res) => {
  const {
    title,
    author,
    genre,
    year,
    isbn,
    cover_url,
    description,
    title_original,
    initialCopies,
  } = req.body;

  if (!title || !title.trim())
    return res.status(400).json({ error: "Titolo obbligatorio" });
  if (!author || !author.trim())
    return res.status(400).json({ error: "Autore obbligatorio" });

  const copies = Math.max(1, parseInt(initialCopies) || 1);

  try {
    let bookId;
    db.transaction(() => {
      const result = db
        .prepare(
          `INSERT INTO books (title, author, genre, year, isbn, cover_url, description, title_original)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          title.trim(),
          author.trim(),
          genre?.trim() || null,
          parseInt(year) || null,
          isbn?.trim() || null,
          cover_url?.trim() || null,
          description?.trim() || null,
          title_original?.trim() || null,
        );
      bookId = result.lastInsertRowid;

      const insertCopy = db.prepare(
        "INSERT INTO copies (book_id, code, status) VALUES (?, ?, 'available')",
      );
      for (let i = 1; i <= copies; i++) {
        insertCopy.run(bookId, `${bookId}-${String(i).padStart(3, "0")}`);
      }
    })();

    const book = db.prepare("SELECT * FROM books WHERE id = ?").get(bookId);
    res.status(201).json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/books/:id  -> edit book metadata (admin)
router.put("/:id", requireAdmin, (req, res) => {
  const bookId = parseInt(req.params.id);
  const {
    title,
    author,
    genre,
    year,
    isbn,
    cover_url,
    description,
    title_original,
  } = req.body;

  if (!title || !title.trim())
    return res.status(400).json({ error: "Titolo obbligatorio" });
  if (!author || !author.trim())
    return res.status(400).json({ error: "Autore obbligatorio" });

  try {
    const existing = db.prepare("SELECT * FROM books WHERE id = ?").get(bookId);
    if (!existing) return res.status(404).json({ error: "Libro non trovato" });

    db.prepare(
      `UPDATE books SET title = ?, author = ?, genre = ?, year = ?, isbn = ?,
       cover_url = ?, description = ?, title_original = ? WHERE id = ?`,
    ).run(
      title.trim(),
      author.trim(),
      genre?.trim() || null,
      parseInt(year) || null,
      isbn?.trim() || null,
      cover_url?.trim() || null,
      description?.trim() || null,
      title_original?.trim() || null,
      bookId,
    );

    const book = db.prepare("SELECT * FROM books WHERE id = ?").get(bookId);
    res.json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/books/:id  -> remove a book (admin)
router.delete("/:id", requireAdmin, (req, res) => {
  const bookId = parseInt(req.params.id);

  try {
    const book = db.prepare("SELECT * FROM books WHERE id = ?").get(bookId);
    if (!book) return res.status(404).json({ error: "Libro non trovato" });

    const activeLoans = db
      .prepare(
        `SELECT COUNT(*) as count FROM loans
       JOIN copies ON loans.copy_id = copies.id
       WHERE copies.book_id = ? AND loans.status = 'active'`,
      )
      .get(bookId);

    if (activeLoans.count > 0) {
      return res.status(409).json({
        error: `Impossibile eliminare: ${activeLoans.count} prestito/i attivo/i per questo libro`,
      });
    }

    if (book.cover_url && book.cover_url.startsWith("/uploads/covers/")) {
      const filePath = join(__dirname, "../..", book.cover_url);
      try {
        unlinkSync(filePath);
      } catch {}
    }

    db.prepare("DELETE FROM books WHERE id = ?").run(bookId);
    res.json({ message: "Libro eliminato" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/books/:id/cover  -> upload cover image (admin)
router.post("/:id/cover", requireAdmin, upload.single("cover"), (req, res) => {
  const bookId = parseInt(req.params.id);

  try {
    const book = db.prepare("SELECT * FROM books WHERE id = ?").get(bookId);
    if (!book) return res.status(404).json({ error: "Libro non trovato" });

    if (book.cover_url && book.cover_url.startsWith("/uploads/covers/")) {
      const oldPath = join(__dirname, "../..", book.cover_url);
      try {
        unlinkSync(oldPath);
      } catch {}
    }

    const coverUrl = `/uploads/covers/${req.file.filename}`;
    db.prepare("UPDATE books SET cover_url = ? WHERE id = ?").run(
      coverUrl,
      bookId,
    );

    const updated = db.prepare("SELECT * FROM books WHERE id = ?").get(bookId);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/books/:id/copies  -> add one or more copies (admin)
router.post("/:id/copies", requireAdmin, (req, res) => {
  const bookId = parseInt(req.params.id);
  const quantity = Number(req.body?.quantity ?? 1);

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    return res.status(400).json({ error: "Quantità copie non valida (1-100)" });
  }

  try {
    const book = db.prepare("SELECT * FROM books WHERE id = ?").get(bookId);
    if (!book) return res.status(404).json({ error: "Libro non trovato" });

    const existingCodes = db
      .prepare("SELECT code FROM copies WHERE book_id = ?")
      .all(bookId);
    const maxCopyNumber = existingCodes.reduce((max, { code }) => {
      const match = String(code).match(/-(\d+)$/);
      const copyNumber = match ? parseInt(match[1], 10) : 0;
      return Math.max(max, copyNumber);
    }, 0);

    const insertedIds = [];
    db.transaction(() => {
      const insertCopy = db.prepare(
        "INSERT INTO copies (book_id, code, status) VALUES (?, ?, 'available')",
      );

      for (let i = 1; i <= quantity; i++) {
        const code = `${bookId}-${String(maxCopyNumber + i).padStart(3, "0")}`;
        const result = insertCopy.run(bookId, code);
        insertedIds.push(result.lastInsertRowid);
      }
    })();

    const copies = db
      .prepare(
        `SELECT * FROM copies WHERE id IN (${insertedIds.map(() => "?").join(",")})`,
      )
      .all(...insertedIds);
    res.status(201).json({ copies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/books/:id/copies/:copyId  -> remove a copy (admin, only if available)
router.delete("/:id/copies/:copyId", requireAdmin, (req, res) => {
  const bookId = parseInt(req.params.id);
  const copyId = parseInt(req.params.copyId);

  try {
    const copy = db
      .prepare("SELECT * FROM copies WHERE id = ? AND book_id = ?")
      .get(copyId, bookId);

    if (!copy) return res.status(404).json({ error: "Copia non trovata" });

    if (copy.status !== "available") {
      return res.status(409).json({
        error: "Impossibile rimuovere: copia attualmente in prestito",
      });
    }

    db.prepare("DELETE FROM copies WHERE id = ?").run(copyId);
    res.json({ message: "Copia rimossa" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/books/export/csv  -> download catalog as CSV (admin)
router.get("/export/csv", requireAdmin, (req, res) => {
  try {
    const books = db
      .prepare(
        `SELECT b.title, b.author, b.genre, b.year, b.isbn, b.description, b.cover_url,
              (SELECT COUNT(*) FROM copies WHERE book_id = b.id) AS copies
       FROM books b ORDER BY b.id`,
      )
      .all();

    const csv = stringify(books, {
      header: true,
      columns: [
        "title",
        "author",
        "genre",
        "year",
        "isbn",
        "description",
        "cover_url",
        "copies",
      ],
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="catalogo.csv"');
    res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/books/import/csv  -> analyze or import CSV (admin)
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post(
  "/import/csv",
  requireAdmin,
  csvUpload.single("file"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "File CSV mancante" });

    const dryRun = req.body.dryRun === "true";
    const duplicateStrategy = req.body.duplicateStrategy || "skip";

    try {
      const records = parse(req.file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });

      const nuovi = [];
      const duplicati = [];
      const scartati = [];

      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNum = i + 2;

        const title = (row.title || "").trim();
        const author = (row.author || "").trim();

        if (!title || !author) {
          scartati.push({
            riga: rowNum,
            motivo:
              !title && !author
                ? "title e author mancanti"
                : !title
                  ? "title mancante"
                  : "author mancante",
          });
          continue;
        }

        const isbn = (row.isbn || "").trim() || null;
        const entry = {
          title,
          author,
          genre: (row.genre || "").trim() || null,
          year: parseInt(row.year) || null,
          isbn,
          description: (row.description || "").trim() || null,
          cover_url: (row.cover_url || "").trim() || null,
          copies: Math.max(1, parseInt(row.copies) || 1),
        };

        if (isbn) {
          const existing = db
            .prepare("SELECT id FROM books WHERE isbn = ?")
            .get(isbn);
          if (existing) {
            duplicati.push({ ...entry, existingId: existing.id, riga: rowNum });
            continue;
          }
        }

        nuovi.push({ ...entry, riga: rowNum });
      }

      if (dryRun) {
        return res.json({
          nuovi: nuovi.map((r) => ({
            riga: r.riga,
            title: r.title,
            author: r.author,
            copies: r.copies,
          })),
          duplicati: duplicati.map((r) => ({
            riga: r.riga,
            title: r.title,
            author: r.author,
            isbn: r.isbn,
          })),
          scartati,
        });
      }

      let inseriti = 0;
      let aggiornati = 0;
      let saltati = 0;

      const insertBook = db.prepare(
        `INSERT INTO books (title, author, genre, year, isbn, cover_url, description) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      );
      const insertCopy = db.prepare(
        "INSERT INTO copies (book_id, code, status) VALUES (?, ?, 'available')",
      );
      const updateBook = db.prepare(
        `UPDATE books SET title = ?, author = ?, genre = ?, year = ?, description = ?, cover_url = ? WHERE id = ?`,
      );

      const processNew = async (entry) => {
        let coverUrl = entry.cover_url;
        if (!coverUrl && entry.isbn) {
          try {
            coverUrl = await fetchCoverFromIsbn(entry.isbn);
          } catch {}
        }
        db.transaction(() => {
          const result = insertBook.run(
            entry.title,
            entry.author,
            entry.genre,
            entry.year,
            entry.isbn,
            coverUrl || null,
            entry.description,
          );
          const bookId = result.lastInsertRowid;
          for (let c = 1; c <= entry.copies; c++) {
            insertCopy.run(bookId, `${bookId}-${String(c).padStart(3, "0")}`);
          }
        })();
        inseriti++;
      };

      for (const entry of nuovi) {
        await processNew(entry);
      }

      for (const entry of duplicati) {
        if (duplicateStrategy === "update") {
          let coverUrl = entry.cover_url;
          if (!coverUrl && entry.isbn) {
            try {
              coverUrl = await fetchCoverFromIsbn(entry.isbn);
            } catch {}
          }
          updateBook.run(
            entry.title,
            entry.author,
            entry.genre,
            entry.year,
            entry.description,
            coverUrl || null,
            entry.existingId,
          );
          aggiornati++;
        } else {
          saltati++;
        }
      }

      res.json({ inseriti, aggiornati, saltati, scartati });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

async function fetchCoverFromIsbn(isbn) {
  const clean = isbn.replace(/[^0-9Xx]/g, "");
  if (!clean) return null;
  const resp = await fetch(`https://openlibrary.org/isbn/${clean}.json`);
  if (!resp.ok) return null;
  const data = await resp.json();
  if (data.covers && data.covers.length > 0) {
    return `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`;
  }
  return null;
}

export default router;
