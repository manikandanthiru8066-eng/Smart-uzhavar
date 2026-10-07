import axios from 'axios';

// Smart backend target detection:
// 1. If running on a live/cloud domain (e.g. Vercel, Render), point to live deployed Render backends.
// 2. If running locally on localhost/127.0.0.1, point to localhost ports.
// 3. If explicit environment variables are supplied and not pointing to localhost in a production environment, use them.
const isBrowser = typeof window !== 'undefined';
const isLocalhost =
  isBrowser &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0');

export const LIVE_SUBSIDY_URL = 'https://smart-uzhavar-subsidy.onrender.com';
export const LIVE_INSURANCE_URL = 'https://smart-uzhavar-insurance.onrender.com';

const DEFAULT_SUBSIDY_URL = isLocalhost ? 'http://localhost:8080' : LIVE_SUBSIDY_URL;
const DEFAULT_INSURANCE_URL = isLocalhost ? 'http://localhost:8081' : LIVE_INSURANCE_URL;

const rawSubsidy = import.meta.env.VITE_API_URL || import.meta.env.VITE_SUBSIDY_API_URL;
const rawInsurance = import.meta.env.VITE_INSURANCE_API_URL;

// If built in production or running on a remote cloud domain, override any stale localhost URLs
const SUBSIDY_API_URL =
  (!isLocalhost && rawSubsidy && rawSubsidy.includes('localhost'))
    ? LIVE_SUBSIDY_URL
    : (rawSubsidy || DEFAULT_SUBSIDY_URL);

const INSURANCE_API_URL =
  (!isLocalhost && rawInsurance && rawInsurance.includes('localhost'))
    ? LIVE_INSURANCE_URL
    : (rawInsurance || DEFAULT_INSURANCE_URL);

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

