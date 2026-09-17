import axios from 'axios';

// Base URLs read exclusively from environment variables with no hardcoded fallbacks
const SUBSIDY_API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_SUBSIDY_API_URL || '';
const INSURANCE_API_URL = import.meta.env.VITE_INSURANCE_API_URL || '';

if (!SUBSIDY_API_URL) {
  console.error('[API Client Error] VITE_API_URL is not defined in environment variables!');
}

if (!INSURANCE_API_URL) {
  console.error('[API Client Error] VITE_INSURANCE_API_URL is not defined in environment variables!');
}

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

