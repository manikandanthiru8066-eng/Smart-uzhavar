import axios from 'axios';

// Support VITE_SUBSIDY_API_URL or VITE_API_URL for subsidy service
const rawSubsidyUrl = import.meta.env.VITE_SUBSIDY_API_URL || import.meta.env.VITE_API_URL;
const rawInsuranceUrl = import.meta.env.VITE_INSURANCE_API_URL;

const isDev = import.meta.env.DEV;

// In production, require env vars to prevent silently masking missing production URLs with localhost
const SUBSIDY_API_URL = rawSubsidyUrl || (isDev ? 'http://localhost:8080' : '');
const INSURANCE_API_URL = rawInsuranceUrl || (isDev ? 'http://localhost:8081' : '');

if (!rawSubsidyUrl && !isDev) {
  console.error('[API Client Error] Neither VITE_SUBSIDY_API_URL nor VITE_API_URL is defined in production environment!');
}

if (!rawInsuranceUrl && !isDev) {
  console.error('[API Client Error] VITE_INSURANCE_API_URL is not defined in production environment!');
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

