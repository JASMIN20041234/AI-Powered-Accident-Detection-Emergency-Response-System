import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  timeout: 30_000,
});

// Attach JWT to every outgoing request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('sentinel_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 clear token and bounce to login
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sentinel_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
