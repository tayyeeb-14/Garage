import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await login(email, password, rememberMe);
  };

  return (
    <div className="page-shell" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a, #2563eb)', padding: '1rem' }}>
      <div className="form-card" style={{ width: '100%', maxWidth: '430px', padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 className="page-title" style={{ fontSize: '1.7rem' }}>Admin Sign In</h2>
          <p className="page-subtitle" style={{ margin: '0.45rem 0 0' }}>Access the M Enterprises control center</p>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-field">
            <label>Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>

          <div className="form-field">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                required
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer' }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569' }}>
              <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe((prev) => !prev)} />
              Remember me
            </label>
            <a href="#" style={{ color: '#2563eb', textDecoration: 'none' }}>Forgot password?</a>
          </div>

          {error ? <div style={{ color: '#dc2626', fontSize: '0.95rem' }}>{error}</div> : null}

          <button type="submit" disabled={isLoading} className="button button-primary button-block">
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
