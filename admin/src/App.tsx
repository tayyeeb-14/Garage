import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardApp from './DashboardApp';

const App = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <LoginPage />;

  return (
    <ProtectedRoute user={user} isLoading={isLoading}>
      <DashboardApp />
    </ProtectedRoute>
  );
};

export default App;
