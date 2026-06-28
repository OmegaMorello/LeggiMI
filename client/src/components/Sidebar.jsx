import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const isAdmin = user.role === "admin";

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon" aria-hidden="true">📖</span>
          LeggiMI
        </div>
        <div className="sidebar-user">
          <span className="sidebar-greeting">
            Ciao, <strong>{user.name}</strong>
          </span>
          <button className="sidebar-logout" onClick={logout}>Esci</button>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Naviga</span>
        <NavLink to="/" end className="sidebar-link">Catalogo</NavLink>
        <NavLink to="/loans" className="sidebar-link">I miei prestiti</NavLink>
      </nav>

      {isAdmin && (
        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Admin</span>
          <NavLink to="/admin/books" className="sidebar-link">Gestione libri</NavLink>
          <NavLink to="/admin/loans" className="sidebar-link">Gestione prestiti</NavLink>
          <NavLink to="/admin/reservations" className="sidebar-link">Gestione prenotazioni</NavLink>
          <NavLink to="/admin/stats" className="sidebar-link">Statistiche</NavLink>
        </nav>
      )}
    </aside>
  );
}
