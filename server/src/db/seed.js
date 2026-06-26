// ============================================================
//  seed.js  —  Insert sample data for development.
//  Run with:  npm run seed
//  TODO (build together): insert a few books + copies and one
//  admin user so you have something to look at while building.
// ============================================================

import bcrypt from "bcrypt";
import { db } from "./db.js";

// --- Example admin user (TODO: adjust credentials) ----------
// const password_hash = bcrypt.hashSync("admin123", 10);
// db.prepare(
//   "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')"
// ).run("Bibliotecario", "admin@biblioteca.local", password_hash);

// --- Example books + copies (TODO) --------------------------
// const insertBook = db.prepare(
//   "INSERT INTO books (title, author, genre, year) VALUES (?, ?, ?, ?)"
// );
// const insertCopy = db.prepare(
//   "INSERT INTO copies (book_id) VALUES (?)"
// );
// const info = insertBook.run("Il barone rampante", "Italo Calvino", "Romanzo", 1957);
// insertCopy.run(info.lastInsertRowid);
// insertCopy.run(info.lastInsertRowid); // a second copy

console.log("Seed script ready. Uncomment the blocks to insert sample data.");
