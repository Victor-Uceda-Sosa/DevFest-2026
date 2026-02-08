import axios from 'axios';
import { authService } from './authService';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: backendUrl,
});

// Add JWT token to all requests
apiClient.interceptors.request.use(async (config) => {
  try {
    const session = await authService.getCurrentSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    } else {
      console.warn('No session found for request to', config.url);
    }
  } catch (error) {
    console.error('Error getting session:', error);
  }
  return config;
});

// Handle 401 errors by redirecting to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
