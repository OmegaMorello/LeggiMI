import { useAuth } from "./context/AuthContext";
import AuthPage from './pages/AuthPage'

function App() {
  const {user, loading, logout} = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <AuthPage />;
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <button onClick={logout}>Log out</button>
    </div>
  );
}

export default App