# LeggiMI — Sistema di gestione biblioteca

Applicazione web full-stack per la gestione di una biblioteca: catalogo con ricerca e
filtri, prestiti di copie fisiche, coda di prenotazioni, area amministrativa per la
gestione del catalogo, statistiche, import/export CSV ed email di promemoria scadenze.

Progetto sviluppato per il corso di **Tecnologie Informatiche per il Web (TIW)** —
versione Single Page Application (React + REST API).

---

## Funzionalità

**Livello 1 — Catalogo e prestiti base**

Utente:
- Registrarsi e accedere (login/logout con sessioni server-side)
- Consultare il catalogo dei libri
- Cercare per titolo o autore
- Visualizzare la scheda dettagliata di un libro
- Richiedere il prestito di un libro disponibile
- Visualizzare i propri prestiti
- Restituire un libro

Amministratore/bibliotecario:
- Aggiungere nuovi libri
- Modificare o rimuovere libri
- Visualizzare tutti i prestiti

**Livello 2 — Copie, prenotazioni e scadenze**
- Gestione di più copie dello stesso libro, con conteggio delle disponibili
- Data di inizio e data di scadenza del prestito
- Stato del prestito: attivo, restituito, scaduto
- Prenotazione di un libro non disponibile
- Coda di prenotazione: alla restituzione la copia passa automaticamente al primo in coda
- Storico dei prestiti (area personale per l'utente, vista completa per l'admin)
- Filtri di catalogo per autore, genere, anno e disponibilità

**Livello 3 — Raccomandazioni, notifiche o import dati**
- Notifiche email prima della scadenza del prestito (e per i prestiti scaduti), con controllo periodico schedulato
- Importazione/esportazione del catalogo da file CSV
- Integrazione con Open Library tramite ISBN per recuperare copertine e metadati (più upload manuale della copertina)
- Statistiche sui libri più richiesti

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

## Requisiti

- **Node.js 18+** (consigliato 20+)
- **npm** (incluso con Node.js)

Nessun altro software è necessario: il database SQLite viene creato automaticamente.

---

## Installazione e avvio

### 1. Clonare il repository

```bash
git clone <url-del-repo>
cd LeggiMI
```

### 2. Installare le dipendenze

Il progetto ha due moduli separati (backend e frontend), ciascuno con il proprio `package.json`:

```bash
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 3. Creare il database e popolare il catalogo

Al primo avvio il server crea automaticamente il file `server/src/db/library.db` con lo
schema vuoto. Per popolarlo con il catalogo di ~100 libri e l'utente amministratore:

```bash
cd server
npm run seed
```

Il seed inserisce tutti i libri (manga, narrativa, classici, fantasy, fantascienza,
giallo/thriller) con ISBN, copertina, descrizione e un numero variabile di copie fisiche
per titolo, oltre a un utente admin.

> **Credenziali admin di default:**
>
> - **Email:** `admin@biblioteca.local`
> - **Password:** `admin123`
>
> Per personalizzarle, modificare le costanti `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`
> in cima al file `server/src/db/seed.js` **prima** di eseguire il seed.

⚠️ Il seed **non è idempotente**: se serve ri-eseguirlo, cancellare prima il file
`server/src/db/library.db` e riavviare il server per ricreare lo schema vuoto.

### 4. Avviare il backend

```bash
cd server
npm run dev          # avvia su http://localhost:3000 (con --watch)
```

### 5. Avviare il frontend (in un secondo terminale)

```bash
cd client
npm run dev          # avvia su http://localhost:5173
```

Aprire il browser su **http://localhost:5173**.

In sviluppo Vite fa da proxy: ogni richiesta a `/api` viene inoltrata al backend sulla
porta 3000.

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
│   │   │   └── seed.js      # Catalogo completo + utente admin
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
  `POST /api/reminders/send` permette di lanciarlo manualmente dall'area admin.
- Le copertine caricate da file sono servite come contenuti statici dal backend.
- Se non viene configurato un server SMTP, le email usano un account di test
  [Ethereal](https://ethereal.email/) e i link di anteprima vengono mostrati
  nell'interfaccia admin dopo l'invio.
