import { useAuth } from "../context/AuthContext";
import "./NavBar.css";

export default function NavBar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="navbar-brand-icon" aria-hidden="true">📖</span>
        LeggiMI
      </div>
      <div className="navbar-user">
        <span className="navbar-greeting">
          Ciao, <strong>{user.name}</strong>
        </span>
        <button className="navbar-logout" onClick={logout}>
          Esci
        </button>
      </div>
    </header>
  );
}
