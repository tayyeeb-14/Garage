export const API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.MODE === 'development' ? 'http://localhost:5000/api' : '');

if (!API_BASE) {
  throw new Error('VITE_API_URL is required for production builds. Set VITE_API_URL to the production API URL.');
}
