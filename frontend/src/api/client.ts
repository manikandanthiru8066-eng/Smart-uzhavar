import axios from 'axios';

const INSURANCE_API_URL = import.meta.env.VITE_INSURANCE_API_URL || 'http://localhost:8081';
const SUBSIDY_API_URL = import.meta.env.VITE_SUBSIDY_API_URL || 'http://localhost:8080';

export const insuranceApi = axios.create({
  baseURL: INSURANCE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const subsidyApi = axios.create({
  baseURL: SUBSIDY_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token if present in localStorage
[insuranceApi, subsidyApi].forEach((api) => {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
});
