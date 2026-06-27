// ============================================================
//  seed.js  —  Insert sample data for development.
//  Run with:  npm run seed
//  Inserts one admin user + ~100 sample books (manga + a mix of
//  novels), each with a variable number of physical copies so you
//  have data to test catalog, search, filters, loans and the
//  reservation queue (Level 2).
//  NOTE: not idempotent — run on a fresh DB (delete the .db file
//  and restart the server to recreate the schema before re-seeding).
// ============================================================

import bcrypt from "bcrypt";
import { db } from "./db.js";

// // --- Example admin user -------------------------------------
// const password_hash = bcrypt.hashSync("admin123", 10);
// db.prepare(
//   "INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')",
// ).run("Bibliotecario", "admin@biblioteca.local", password_hash);

// // --- Sample catalog -----------------------------------------
// // [title, author, genre, year]
// const books = [
//   // ---- Manga: Shōnen --------------------------------------
//   ["Naruto", "Masashi Kishimoto", "Shōnen", 1999],
//   ["One Piece", "Eiichiro Oda", "Shōnen", 1997],
//   ["Dragon Ball", "Akira Toriyama", "Shōnen", 1984],
//   ["Bleach", "Tite Kubo", "Shōnen", 2001],
//   ["Hunter x Hunter", "Yoshihiro Togashi", "Shōnen", 1998],
//   ["Fullmetal Alchemist", "Hiromu Arakawa", "Shōnen", 2001],
//   ["My Hero Academia", "Kohei Horikoshi", "Shōnen", 2014],
//   ["Demon Slayer", "Koyoharu Gotouge", "Shōnen", 2016],
//   ["Jujutsu Kaisen", "Gege Akutami", "Shōnen", 2018],
//   ["Chainsaw Man", "Tatsuki Fujimoto", "Shōnen", 2018],
//   ["Black Clover", "Yūki Tabata", "Shōnen", 2015],
//   ["Dr. Stone", "Riichiro Inagaki", "Shōnen", 2017],
//   ["The Promised Neverland", "Kaiu Shirai", "Shōnen", 2016],
//   ["Haikyu!!", "Haruichi Furudate", "Shōnen", 2012],
//   ["Kuroko's Basket", "Tadatoshi Fujimaki", "Shōnen", 2008],
//   ["Yu Yu Hakusho", "Yoshihiro Togashi", "Shōnen", 1990],
//   ["Slam Dunk", "Takehiko Inoue", "Shōnen", 1990],
//   ["Fist of the North Star", "Buronson", "Shōnen", 1983],
//   ["Soul Eater", "Atsushi Ohkubo", "Shōnen", 2004],
//   ["Fairy Tail", "Hiro Mashima", "Shōnen", 2006],
//   ["Blue Lock", "Muneyuki Kaneshiro", "Shōnen", 2018],
//   ["The Seven Deadly Sins", "Nakaba Suzuki", "Shōnen", 2012],
//   ["Magi: The Labyrinth of Magic", "Shinobu Ohtaka", "Shōnen", 2009],
//   ["Toriko", "Mitsutoshi Shimabukuro", "Shōnen", 2008],
//   ["Assassination Classroom", "Yūsei Matsui", "Shōnen", 2012],

//   // ---- Manga: Seinen --------------------------------------
//   ["Berserk", "Kentaro Miura", "Seinen", 1989],
//   ["Vagabond", "Takehiko Inoue", "Seinen", 1998],
//   ["Vinland Saga", "Makoto Yukimura", "Seinen", 2005],
//   ["Monster", "Naoki Urasawa", "Seinen", 1994],
//   ["20th Century Boys", "Naoki Urasawa", "Seinen", 1999],
//   ["Tokyo Ghoul", "Sui Ishida", "Seinen", 2011],
//   ["Attack on Titan", "Hajime Isayama", "Seinen", 2009],
//   ["Death Note", "Tsugumi Ohba", "Seinen", 2003],
//   ["JoJo's Bizarre Adventure", "Hirohiko Araki", "Seinen", 1987],
//   ["Akira", "Katsuhiro Otomo", "Seinen", 1982],
//   ["Ghost in the Shell", "Masamune Shirow", "Seinen", 1989],
//   ["Nausicaä della Valle del Vento", "Hayao Miyazaki", "Seinen", 1982],
//   ["Made in Abyss", "Akihito Tsukushi", "Seinen", 2012],
//   ["One Punch Man", "ONE", "Seinen", 2012],
//   ["Mob Psycho 100", "ONE", "Seinen", 2012],
//   ["Gantz", "Hiroya Oku", "Seinen", 2000],
//   ["Parasyte", "Hitoshi Iwaaki", "Seinen", 1988],
//   ["Blame!", "Tsutomu Nihei", "Seinen", 1998],
//   ["Hellsing", "Kohta Hirano", "Seinen", 1997],
//   ["Drifters", "Kohta Hirano", "Seinen", 2009],
//   ["Kingdom", "Yasuhisa Hara", "Seinen", 2006],
//   ["Goodnight Punpun", "Inio Asano", "Seinen", 2007],
//   ["Homunculus", "Hideo Yamamoto", "Seinen", 2003],
//   ["Real", "Takehiko Inoue", "Seinen", 1999],
//   ["Pluto", "Naoki Urasawa", "Seinen", 2003],
//   ["Spy x Family", "Tatsuya Endo", "Seinen", 2019],

//   // ---- Manga: Shōjo / Romance -----------------------------
//   ["Fruits Basket", "Natsuki Takaya", "Shōjo", 1998],
//   ["Sailor Moon", "Naoko Takeuchi", "Shōjo", 1991],
//   ["Cardcaptor Sakura", "CLAMP", "Shōjo", 1996],
//   ["Nana", "Ai Yazawa", "Shōjo", 2000],
//   ["Ouran High School Host Club", "Bisco Hatori", "Shōjo", 2002],
//   ["Kaguya-sama: Love is War", "Aka Akasaka", "Shōjo", 2015],
//   ["Horimiya", "HERO", "Shōjo", 2011],
//   ["Toradora!", "Yuyuko Takemiya", "Shōjo", 2007],
//   ["A Silent Voice", "Yoshitoki Ōima", "Shōjo", 2013],
//   ["Your Lie in April", "Naoshi Arakawa", "Shōjo", 2011],
//   ["March Comes in Like a Lion", "Chica Umino", "Shōjo", 2007],
//   ["Inuyasha", "Rumiko Takahashi", "Shōjo", 1996],
//   ["Ranma ½", "Rumiko Takahashi", "Shōjo", 1987],
//   ["Maison Ikkoku", "Rumiko Takahashi", "Shōjo", 1980],
//   ["Skip Beat!", "Yoshiki Nakamura", "Shōjo", 2002],
//   ["Lovely Complex", "Aya Nakahara", "Shōjo", 2001],

//   // ---- Romanzi e classici ---------------------------------
//   ["Il barone rampante", "Italo Calvino", "Romanzo", 1957],
//   ["Se questo è un uomo", "Primo Levi", "Romanzo", 1947],
//   ["Il nome della rosa", "Umberto Eco", "Romanzo storico", 1980],
//   ["La coscienza di Zeno", "Italo Svevo", "Romanzo", 1923],
//   ["Il fu Mattia Pascal", "Luigi Pirandello", "Romanzo", 1904],
//   ["Uno, nessuno e centomila", "Luigi Pirandello", "Romanzo", 1926],
//   ["I promessi sposi", "Alessandro Manzoni", "Romanzo storico", 1840],
//   ["Il Gattopardo", "Giuseppe Tomasi di Lampedusa", "Romanzo storico", 1958],
//   ["La luna e i falò", "Cesare Pavese", "Romanzo", 1950],
//   ["Cristo si è fermato a Eboli", "Carlo Levi", "Romanzo", 1945],
//   ["1984", "George Orwell", "Fantascienza", 1949],
//   ["Il signore degli anelli", "J.R.R. Tolkien", "Fantasy", 1954],
//   ["Lo Hobbit", "J.R.R. Tolkien", "Fantasy", 1937],
//   ["Harry Potter e la pietra filosofale", "J.K. Rowling", "Fantasy", 1997],
//   ["Il trono di spade", "George R.R. Martin", "Fantasy", 1996],
//   ["Dune", "Frank Herbert", "Fantascienza", 1965],
//   ["Fahrenheit 451", "Ray Bradbury", "Fantascienza", 1953],
//   ["Il club Dumas", "Arturo Pérez-Reverte", "Giallo", 1993],
//   ["Dieci piccoli indiani", "Agatha Christie", "Giallo", 1939],
//   ["Il codice da Vinci", "Dan Brown", "Thriller", 2003],
//   ["Cent'anni di solitudine", "Gabriel García Márquez", "Romanzo", 1967],
//   ["Il vecchio e il mare", "Ernest Hemingway", "Romanzo", 1952],
//   ["Delitto e castigo", "Fëdor Dostoevskij", "Romanzo", 1866],
//   ["Orgoglio e pregiudizio", "Jane Austen", "Romanzo", 1813],
//   ["Il grande Gatsby", "Francis Scott Fitzgerald", "Romanzo", 1925],
//   ["Lo strano caso del cane ucciso a mezzanotte", "Mark Haddon", "Romanzo", 2003],
//   ["La storia infinita", "Michael Ende", "Fantasy", 1979],
//   ["Le cronache di Narnia", "C.S. Lewis", "Fantasy", 1950],
//   ["Neuromante", "William Gibson", "Fantascienza", 1984],
//   ["Io, robot", "Isaac Asimov", "Fantascienza", 1950],
//   ["It", "Stephen King", "Horror", 1986],
//   ["Shining", "Stephen King", "Horror", 1977],
//   ["Lo zen e l'arte della manutenzione della motocicletta", "Robert M. Pirsig", "Saggio", 1974],
// ];

// const insertBook = db.prepare(
//   "INSERT INTO books (title, author, genre, year) VALUES (?, ?, ?, ?)",
// );
// const insertCopy = db.prepare(
//   "INSERT INTO copies (book_id, code) VALUES (?, ?)",
// );

// // Insert all books in a single transaction (fast + atomic).
// const seedAll = db.transaction((rows) => {
//   rows.forEach(([title, author, genre, year], i) => {
//     const info = insertBook.run(title, author, genre, year);
//     const bookId = info.lastInsertRowid;
//     // 1–3 copies per title, varied so some books run out (queue testing).
//     const copies = (i % 3) + 1;
//     for (let c = 1; c <= copies; c++) {
//       insertCopy.run(bookId, `B${bookId}-${c}`);
//     }
//   });
// });

// seedAll(books);

// const bookCount = db.prepare("SELECT COUNT(*) AS n FROM books").get().n;
// const copyCount = db.prepare("SELECT COUNT(*) AS n FROM copies").get().n;
// console.log(
//   `Seed completato: ${bookCount} libri, ${copyCount} copie. Admin: admin@biblioteca.local / admin123`,
// );

console.log("Seed script ready. Uncomment the blocks to insert sample data.");
