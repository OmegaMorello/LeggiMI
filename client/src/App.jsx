import { Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import Sidebar from "./components/Sidebar";
import CatalogPage from "./pages/CatalogPage";
import BookDetailPage from "./pages/BookDetailPage";
import MyLoansPage from "./pages/MyLoansPage";
import AdminLoansPage from "./pages/AdminLoansPage";
import BooksAdmin from "./pages/BooksAdmin";
import AdminReservationsPage from "./pages/AdminReservationsPage";
import "./App.css";

function App() {
  const { user, loading, logout } = useAuth();

  if (loading) return <div className="app-loading">Caricamento…</div>;
  if (!user) return <AuthPage />;

  return (
    <>
      <header className="mobile-header">
        <div className="mobile-brand">
          <span aria-hidden="true">📖</span> LeggiMI
        </div>
        <div className="mobile-user">
          <span className="mobile-greeting">
            Ciao, <strong>{user.name}</strong>
          </span>
          <button className="mobile-logout" onClick={logout}>Esci</button>
        </div>
      </header>
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<CatalogPage />} />
            <Route path="/books/:id" element={<BookDetailPage />} />
            <Route path="/loans" element={<MyLoansPage />} />
            {user.role === "admin" && (
              <>
                <Route path="/admin/loans" element={<AdminLoansPage />} />
                <Route path="/admin/books" element={<BooksAdmin />} />
                <Route path="/admin/reservations" element={<AdminReservationsPage />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </>
  );
}

export default App;
