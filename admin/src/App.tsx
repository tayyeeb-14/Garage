import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardApp from './DashboardApp';

const App = () => {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) return null;
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1.5rem 0' }}>
        <button onClick={logout} style={{ padding: '0.7rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
      <ProtectedRoute user={user} isLoading={isLoading}>
        <DashboardApp />
      </ProtectedRoute>
    </div>
  );
};

export default App;
