// In Replit, get the current domain and replace port 5000 with 8000 for backend
const getBackendUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  if (typeof window !== 'undefined') {
    const currentUrl = window.location.origin;
    // Replace port 5000 with 8000 for backend
    return currentUrl.replace(':5000', ':8000').replace('-5000-', '-8000-');
  }
  
  return 'http://localhost:8000';
};

const API_BASE_URL = getBackendUrl();

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const fetchOptions = {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include'
  };

  const res = await fetch(url, fetchOptions);
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const error = new Error(typeof data === 'string' ? data : (data?.error || 'Request failed'));
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' })
};

export default api;

