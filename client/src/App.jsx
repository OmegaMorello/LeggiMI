import { useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import CatalogPage from "./pages/CatalogPage";
import "./App.css";

function App() {
  const { user, loading, logout } = useAuth();

  if (loading) return <div className="app-loading">Caricamento…</div>;
  if (!user) return <AuthPage />;

  return (
    <>
      <header className="app-header">
        <div className="app-brand">
          <span className="app-brand-icon" aria-hidden="true">📖</span>
          LeggiMI
        </div>
        <div className="app-user">
          <span className="app-greeting">
            Ciao, <strong>{user.name}</strong>
          </span>
          <button className="app-logout" onClick={logout}>
            Esci
          </button>
        </div>
      </header>
      <CatalogPage />
    </>
  );
}

export default App;
