import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a, #2563eb)', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '430px', background: '#fff', borderRadius: '24px', padding: '2rem', boxShadow: '0 18px 60px rgba(15, 23, 42, 0.18)' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.7rem', color: '#0f172a' }}>Admin Sign In</h2>
          <p style={{ margin: '0.45rem 0 0', color: '#64748b' }}>Access the M Enterprises control center</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.45rem', fontWeight: 600 }}>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required style={{ width: '100%', padding: '0.8rem 0.9rem', borderRadius: '12px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.45rem', fontWeight: 600 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} required style={{ width: '100%', padding: '0.8rem 0.9rem', borderRadius: '12px', border: '1px solid #cbd5e1', boxSizing: 'border-box', paddingRight: '3rem' }} />
              <button type="button" onClick={() => setShowPassword((prev) => !prev)} style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer' }}>{showPassword ? 'Hide' : 'Show'}</button>
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

          <button type="submit" disabled={isLoading} style={{ padding: '0.85rem 1rem', borderRadius: '12px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
