import { useMemo } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardApp from './DashboardApp';

const App = () => {
  const { user, isLoading, logout } = useAuth();

  const content = useMemo(() => {
    if (isLoading) return null;
    if (!user) {
      return <LoginPage onSuccess={() => window.location.reload()} />;
    }

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1.5rem 0' }}>
          <button onClick={logout} style={{ padding: '0.7rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
        <ProtectedRoute>
          <DashboardApp />
        </ProtectedRoute>
      </div>
    );
  }, [isLoading, logout, user]);

  return content;
};

export default App;
