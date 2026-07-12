// In dev, use relative /api so Vite proxy avoids mixed-content issues.
// In prod, set VITE_API_BASE_URL explicitly.
const API_BASE_URL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000');

export default API_BASE_URL;