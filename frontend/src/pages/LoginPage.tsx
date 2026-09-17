import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subsidyApi } from '../api/client';
import { useTranslation } from 'react-i18next';
import { Sprout, LogIn, UserPlus, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface DistrictItem {
  id: number;
  name: string;
}

// Generate username suggestion from full name
// e.g. "Manikandan T" → "manikandant", "Ramesh Kumar" → "rameshk"
function generateUsername(fullName: string): string {
  return fullName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .map((word, idx) => (idx === 0 ? word : word.charAt(0)))
    .join('')
    .slice(0, 20);
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const PHONE_REGEX = /^\d{10}$/;

export const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isSignup, setIsSignup] = useState(false);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login, signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup form state
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [cropGrown, setCropGrown] = useState('Paddy');
  const [landSizeHectares, setLandSizeHectares] = useState('1.0');

  // Inline validation errors
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Track if user manually edited username (stop auto-filling if so)
  const usernameManuallyEdited = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const loadDistricts = async () => {
      try {
        const res = await subsidyApi.get<DistrictItem[]>('/api/districts');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setDistricts(res.data);
          setDistrictName(res.data[0].name);
          if (res.data.length < 10) {
            console.warn('[LoginPage] Only', res.data.length, 'districts returned — expected 38.');
          }
        }
      } catch (err) {
        console.error('[LoginPage] Failed to load districts from API:', err);
        const fallback = [
          { id: 1, name: 'Thanjavur' },
          { id: 2, name: 'Thiruvarur' },
          { id: 3, name: 'Nagapattinam' },
          { id: 4, name: 'Tiruchirappalli' },
        ];
        setDistricts(fallback);
        setDistrictName(fallback[0].name);
      }
    };
    loadDistricts();
  }, []);

  // Auto-generate username as user types full name
  const handleFullNameChange = (val: string) => {
    setFullName(val);
    if (!usernameManuallyEdited.current) {
      setSignupUsername(generateUsername(val));
    }
  };

  const handleUsernameChange = (val: string) => {
    usernameManuallyEdited.current = true;
    setSignupUsername(val);
  };

  // Phone: only digits, max 10
  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(digits);
    if (digits.length > 0 && !PHONE_REGEX.test(digits)) {
      setPhoneError(t('signupPhoneError'));
    } else {
      setPhoneError(null);
    }
  };

  // Password: validate strength on change
  const handlePasswordChange = (val: string) => {
    setSignupPassword(val);
    if (val.length > 0 && !PASSWORD_REGEX.test(val)) {
      setPasswordError(t('signupPasswordError'));
    } else {
      setPasswordError(null);
    }
  };

  const handleTabSwitch = (toSignup: boolean) => {
    setIsSignup(toSignup);
    setError(null);
    setPhoneError(null);
    setPasswordError(null);
    setShowLoginPassword(false);
    setShowSignupPassword(false);
  };

  const extractErrorMessage = (err: any, fallback: string): string => {
    if (!err) return fallback;
    if (err.response) {
      const data = err.response.data;
      if (typeof data === 'string' && data.trim()) return data;
      if (data && typeof data === 'object') {
        if (data.message && typeof data.message === 'string') return data.message;
        if (data.error && typeof data.error === 'string') return data.error;
      }
      if (err.response.statusText) return `Server Error (${err.response.status}: ${err.response.statusText})`;
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return 'Unable to connect to the backend server. Render backend may be starting up (please wait 30 seconds and try again).';
    }
    return err.message || fallback;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setError('Please fill in both username and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(loginUsername.trim(), loginPassword);
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('[LoginPage] Login error — status:', err?.response?.status, 'body:', err?.response?.data);
      setError(extractErrorMessage(err, t('loginErrorFallback')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!signupUsername.trim() || !signupPassword.trim() || !fullName.trim()) {
      setError(t('signupRequiredError'));
      return;
    }
    if (phoneNumber && !PHONE_REGEX.test(phoneNumber)) {
      setPhoneError(t('signupPhoneError'));
      setError(t('signupPhoneError'));
      return;
    }
    if (!PASSWORD_REGEX.test(signupPassword)) {
      setPasswordError(t('signupPasswordError'));
      setError(t('signupPasswordError'));
      return;
    }

    setSubmitting(true);
    try {
      await signup({
        username: signupUsername.trim(),
        password: signupPassword,
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        phoneNumber: phoneNumber || undefined,
      });

      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('=== SIGNUP ERROR DEBUG ===');
      console.error('Status Code:', err?.response?.status);
      console.error('Response Body:', err?.response?.data);
      console.error('Error Code:', err?.code);
      console.error('Full Error Object:', err);

      const statusStr = err?.response?.status ? `[HTTP ${err.response.status}] ` : '[Network Error] ';
      const bodyStr = err?.response?.data
        ? (typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data))
        : (err?.message || 'No response received from server');

      setError(`${statusStr}${bodyStr}`);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ta' : 'en');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-emerald-50/50">
      {/* Language toggle */}
      <div className="absolute top-4 right-4">
        <button
          id="lang-toggle-btn"
          onClick={toggleLanguage}
          className="px-3 py-1.5 text-xs font-semibold bg-white border border-emerald-200 text-emerald-700 rounded-xl shadow-sm hover:bg-emerald-50 transition-colors"
        >
          {i18n.language === 'en' ? 'தமிழ்' : 'English'}
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-emerald-100 p-8 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-md">
            <Sprout size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('brandName')}</h1>
          <p className="text-xs text-gray-500">{t('loginBrandSub')}</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button
            type="button"
            id="login-tab-btn"
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all ${
              !isSignup
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleTabSwitch(false)}
          >
            {t('loginTabLabel')}
          </button>
          <button
            type="button"
            id="signup-tab-btn"
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all ${
              isSignup
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleTabSwitch(true)}
          >
            {t('signupTabLabel')}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            id="form-error-msg"
            className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        {!isSignup ? (
          <form id="login-form" onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('loginUsernameLabel')}
              </label>
              <input
                id="login-username"
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={t('loginUsernamePlaceholder')}
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('loginPasswordLabel')}
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder={t('loginPasswordPlaceholder')}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  id="login-password-toggle-btn"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors p-1 flex items-center justify-center"
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <LogIn size={18} />
              {submitting ? t('loginSubmitting') : t('loginSubmitBtn')}
            </button>
          </form>
        ) : (
          <form id="signup-form" onSubmit={handleSignupSubmit} className="space-y-3">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('signupFullNameLabel')} *
              </label>
              <input
                id="signup-fullname"
                type="text"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={t('signupFullNamePlaceholder')}
                value={fullName}
                onChange={(e) => handleFullNameChange(e.target.value)}
                required
              />
            </div>

            {/* Username + Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('signupUsernameLabel')} *
                  <span className="ml-1 font-normal text-gray-400">(auto-filled)</span>
                </label>
                <input
                  id="signup-username"
                  type="text"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder={t('signupUsernamePlaceholder')}
                  value={signupUsername}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('signupPasswordLabel')} *
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showSignupPassword ? 'text' : 'password'}
                    className={`w-full px-3.5 py-2.5 pr-10 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      passwordError ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    id="signup-password-toggle-btn"
                    onClick={() => setShowSignupPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors p-1 flex items-center justify-center"
                    aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {signupPassword && !passwordError && (
                  <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Strong ✓
                  </p>
                )}
                {passwordError ? (
                  <p id="password-error" className="mt-1 text-xs text-red-600 leading-tight">{passwordError}</p>
                ) : (
                  !signupPassword && (
                    <p className="mt-1 text-xs text-gray-400 leading-tight">{t('signupPasswordHint')}</p>
                  )
                )}
              </div>
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('signupPhoneLabel')}
                </label>
                <input
                  id="signup-phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    phoneError ? 'border-red-400 bg-red-50' : 'border-gray-200'
                  }`}
                  placeholder={t('signupPhonePlaceholder')}
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                />
                {phoneError && (
                  <p id="phone-error" className="mt-1 text-xs text-red-600">{phoneError}</p>
                )}
                {!phoneError && phoneNumber.length === 10 && (
                  <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Valid ✓
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('signupEmailLabel')}
                </label>
                <input
                  id="signup-email"
                  type="email"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder={t('signupEmailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              id="signup-submit-btn"
              type="submit"
              disabled={submitting || !!phoneError || !!passwordError}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-4"
            >
              <UserPlus size={18} />
              {submitting ? t('signupSubmitting') : t('signupSubmitBtn')}
            </button>

          </form>
        )}
      </div>
    </div>
  );
};
