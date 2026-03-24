import axios from 'axios';

// const api = axios.create({
//   baseURL: '/api',
// });
const api = axios.create({
  baseURL: 'https://dhara-rag-2.onrender.com/api',
});

// Interceptor to add JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
