import { Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import NavBar from "./components/NavBar";
import CatalogPage from "./pages/CatalogPage";
import BookDetailPage from "./pages/BookDetailPage";
import MyLoansPage from "./pages/MyLoansPage";
import AdminLoansPage from "./pages/AdminLoansPage";
import "./App.css";

function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="app-loading">Caricamento…</div>;
  if (!user) return <AuthPage />;

  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />
        <Route path="/loans/" element={<MyLoansPage />} />
        {user.role === "admin" && (
          <Route path="/loans/all" element={<AdminLoansPage />} />
        )}
      </Routes>
    </>
  );
}

export default App;
