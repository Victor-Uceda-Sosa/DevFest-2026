import axios, { AxiosError, AxiosInstance } from 'axios';
import { ApiError } from '../types/api';

// Create Axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed in the future
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.detail || 'An error occurred';
      console.error('API Error:', errorMessage, error.response.status);
      return Promise.reject({
        message: errorMessage,
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your connection and ensure the backend is running.',
        status: 0,
      });
    } else {
      // Something else happened
      console.error('Error:', error.message);
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
        status: -1,
      });
    }
  }
);

export default api;
