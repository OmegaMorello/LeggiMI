# LeggiMI — Sistema di gestione biblioteca

Applicazione web full-stack per la gestione di una biblioteca: catalogo con ricerca e
filtri, prestiti di copie fisiche, coda di prenotazioni, area amministrativa per la
gestione del catalogo, statistiche, import/export CSV ed email di promemoria scadenze.

Progetto sviluppato per il corso di **Tecnologie Informatiche per il Web (TIW)** —
versione Single Page Application (React + REST API).

---

## Funzionalità

**Livello 1 — Catalogo e prestiti base**
- Registrazione, login e logout con sessioni server-side
- Catalogo libri con ricerca per titolo/autore e scheda di dettaglio
- Richiesta di prestito di una copia disponibile e restituzione
- Area personale "I miei prestiti" (attivi + storico)
- Area admin: gestione catalogo (aggiungi/modifica/elimina libri) e visione di tutti i prestiti

**Livello 2 — Copie multiple, prenotazioni, scadenze**
- Più copie fisiche per titolo, con conteggio delle disponibili
- Date di prestito (`start_date` / `due_date`) e stato (attivo / restituito / scaduto)
- Prenotazione di un libro quando tutte le copie sono occupate
- Coda di prenotazioni: alla restituzione la copia passa automaticamente al primo in coda
- Filtri di catalogo per autore, genere, anno e disponibilità

**Livello 3 — Estensioni**
- Recupero copertina e metadati da Open Library tramite ISBN (più upload manuale del file)
- Statistiche dei libri più richiesti
- Import ed export del catalogo in formato CSV
- Email di promemoria per i prestiti in scadenza e scaduti (controllo periodico schedulato)

---

## Stack tecnologico

**Backend**
- Node.js + Express 5 (REST API)
- SQLite tramite `better-sqlite3` (driver sincrono)
- `express-session` per le sessioni server-side
- `bcrypt` per l'hashing delle password
- `multer` (upload copertine e CSV), `csv-parse` / `csv-stringify` (CSV)
- `nodemailer` (email) + `node-cron` (job schedulato)

**Frontend**
- React 19 + Vite
- React Router 7 per il routing client-side
- Context API per lo stato di autenticazione

---

## Struttura del progetto

```
LeggiMI/
├── server/                  # Backend Express + SQLite
│   ├── src/
│   │   ├── server.js        # Entry point: middleware, sessioni, mount delle route, cron
│   │   ├── db/
│   │   │   ├── db.js        # Connessione SQLite + esecuzione schema + migrazioni
│   │   │   ├── schema.sql   # Modello dati (users, books, copies, loans, reservations)
│   │   │   └── seed.js      # Dati di esempio (opzionale)
│   │   ├── middleware/
│   │   │   └── auth.js      # requireAuth / requireAdmin
│   │   ├── routes/          # Una route file per risorsa
│   │   │   ├── authRoutes.js
│   │   │   ├── bookRoutes.js
│   │   │   ├── loanRoutes.js
│   │   │   ├── reservationRoutes.js
│   │   │   ├── statsRoutes.js
│   │   │   └── reminderRoutes.js
│   │   └── mail/
│   │       ├── mailer.js        # Transporter nodemailer (Ethereal/SMTP)
│   │       └── reminderJob.js   # Logica del controllo scadenze
│   └── package.json
│
└── client/                  # Frontend React + Vite
    ├── src/
    │   ├── main.jsx         # Bootstrap: Router + AuthProvider + App
    │   ├── App.jsx          # Layout e routing (route admin condizionali al ruolo)
    │   ├── context/         # AuthContext + AuthProvider (utente loggato globale)
    │   ├── services/
    │   │   └── api.js       # Tutte le chiamate fetch verso il backend
    │   ├── pages/           # Una pagina per vista
    │   └── components/      # Componenti riutilizzabili (card, form, sidebar, toast…)
    └── package.json
```

---

## Requisiti

- Node.js 18+ (consigliato 20+)
- npm

---

## Installazione e avvio

Il progetto ha due processi separati: backend (porta 3000) e frontend Vite (porta 5173).
In sviluppo Vite fa da proxy: ogni richiesta a `/api` viene inoltrata al backend.

**1. Backend**

```bash
cd server
npm install
npm run dev          # avvia su http://localhost:3000 (con --watch)
```

(Opzionale) inserire dati di esempio su un database vuoto:

```bash
npm run seed
```

**2. Frontend** (in un secondo terminale)

```bash
cd client
npm install
npm run dev          # avvia su http://localhost:5173
```

Aprire il browser su `http://localhost:5173`.

Il database SQLite (`server/src/db/library.db`) viene creato automaticamente al primo
avvio e lo schema viene applicato da `db.js`.

---

## Configurazione (`.env` nel server)

Creare `server/.env` (vedi `.env.example`):

```
SESSION_SECRET=una-stringa-segreta-robusta
PORT=3000

# SMTP — opzionale. Se assente, le email usano un account di test Ethereal
# e il link di anteprima viene stampato nei log del server.
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
MAIL_FROM=Biblioteca <noreply@biblioteca.local>
```

---

## Account e ruoli

Esistono due ruoli: `user` (default alla registrazione) e `admin` (bibliotecario).
La registrazione crea sempre un utente normale; il primo amministratore va creato fuori
dall'app, abilitando il blocco dedicato in `seed.js` oppure con una query manuale:

```sql
UPDATE users SET role = 'admin' WHERE email = 'tua@email';
```

Le funzioni e le rotte admin sono protette lato server da `requireAdmin` e nascoste lato
client a chi non è amministratore.

---

## Panoramica delle API

| Metodo | Endpoint                          | Accesso | Descrizione                              |
|--------|-----------------------------------|---------|------------------------------------------|
| POST   | `/api/auth/register`              | tutti   | Registrazione                            |
| POST   | `/api/auth/login`                 | tutti   | Login (apre la sessione)                 |
| POST   | `/api/auth/logout`                | auth    | Logout                                   |
| GET    | `/api/auth/me`                    | tutti   | Utente corrente o `null`                 |
| GET    | `/api/books`                      | tutti   | Catalogo con ricerca e filtri            |
| GET    | `/api/books/:id`                  | tutti   | Scheda libro + copie disponibili         |
| POST   | `/api/books`                      | admin   | Aggiungi libro (+ copie iniziali)        |
| PUT    | `/api/books/:id`                  | admin   | Modifica metadati libro                  |
| DELETE | `/api/books/:id`                  | admin   | Elimina libro (bloccato se prestiti attivi) |
| GET    | `/api/books/lookup/:isbn`         | admin   | Metadati/copertina da Open Library       |
| POST   | `/api/books/:id/cover`            | admin   | Upload copertina da file                 |
| POST   | `/api/books/:id/copies`           | admin   | Aggiungi una copia                       |
| DELETE | `/api/books/:id/copies/:copyId`   | admin   | Rimuovi una copia disponibile            |
| GET    | `/api/books/export/csv`           | admin   | Esporta catalogo in CSV                  |
| POST   | `/api/books/import/csv`           | admin   | Analizza/importa catalogo da CSV         |
| GET    | `/api/loans/mine`                 | auth    | I miei prestiti (attivi + storico)       |
| POST   | `/api/loans`                      | auth    | Richiedi prestito di una copia           |
| POST   | `/api/loans/:id/return`           | auth    | Restituisci (+ promuovi la coda)         |
| GET    | `/api/loans/all`                  | admin   | Tutti i prestiti                         |
| POST   | `/api/reservations`               | auth    | Prenota un libro non disponibile         |
| GET    | `/api/reservations/mine`          | auth    | Le mie prenotazioni (con posizione)      |
| DELETE | `/api/reservations/:id`           | auth    | Annulla una prenotazione                 |
| GET    | `/api/reservations/all`           | admin   | Tutte le prenotazioni                    |
| GET    | `/api/stats/most-requested`       | admin   | Classifica libri più richiesti           |
| POST   | `/api/reminders/send`             | admin   | Esegue subito il job di promemoria       |
| GET    | `/api/health`                     | tutti   | Health check                             |

---

## Note

- Il job di promemoria scadenze gira automaticamente ogni giorno alle 08:00 (cron
  in-process), quindi viene eseguito solo mentre il server è attivo. La rotta
  `POST /api/reminders/send` permette di lanciarlo manualmente.
- Le copertine caricate da file sono servite come contenuti statici dal backend.
