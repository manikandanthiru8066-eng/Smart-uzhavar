import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subsidyApi } from '../api/client';
import { Sprout, LogIn, UserPlus, AlertCircle } from 'lucide-react';

interface DistrictItem {
  id: number;
  name: string;
}

export const LoginPage: React.FC = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login, signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [cropGrown, setCropGrown] = useState('Paddy');
  const [landSizeHectares, setLandSizeHectares] = useState('1.0');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const loadDistricts = async () => {
      try {
        const res = await subsidyApi.get<DistrictItem[]>('/api/districts');
        if (Array.isArray(res.data)) {
          setDistricts(res.data);
          if (res.data.length > 0) {
            setDistrictName(res.data[0].name);
          }
        }
      } catch {
        // Fallback default districts
        setDistricts([
          { id: 1, name: 'Thanjavur' },
          { id: 2, name: 'Thiruvarur' },
          { id: 3, name: 'Nagapattinam' },
          { id: 4, name: 'Trichy' },
        ]);
        setDistrictName('Thanjavur');
      }
    };
    loadDistricts();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setError('Please fill in both username and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(loginUsername, loginPassword);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!signupUsername.trim() || !signupPassword.trim() || !fullName.trim()) {
      setError('Username, Password, and Full Name are required.');
      return;
    }
    setSubmitting(true);
    try {
      await signup({
        username: signupUsername.trim(),
        password: signupPassword,
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        districtName,
        cropGrown,
        landSizeHectares: parseFloat(landSizeHectares) || 1.0,
      });
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Registration failed. Username, email, or phone may already exist.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-emerald-50/50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-emerald-100 p-8 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-md">
            <Sprout size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Uzhavar</h1>
          <p className="text-xs text-gray-500">
            Personalized Farmer Decision Support Portal
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button
            type="button"
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all ${
              !isSignup
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => {
              setIsSignup(false);
              setError(null);
            }}
          >
            Log In
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all ${
              isSignup
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => {
              setIsSignup(true);
              setError(null);
            }}
          >
            New Farmer Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        {!isSignup ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter your username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <LogIn size={18} />
              {submitting ? 'Logging in...' : 'Sign In to Dashboard'}
            </button>
          </form>
        ) : (
          /* Signup Form */
          <form onSubmit={handleSignupSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Ramesh Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="ramesh123"
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="ramesh@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  District
                </label>
                <select
                  className="w-full px-2.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  value={districtName}
                  onChange={(e) => setDistrictName(e.target.value)}
                >
                  {districts.map((d) => (
                    <option key={d.id || d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Crop Grown
                </label>
                <select
                  className="w-full px-2.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  value={cropGrown}
                  onChange={(e) => setCropGrown(e.target.value)}
                >
                  <option value="Paddy">Paddy</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Banana">Banana</option>
                  <option value="Groundnut">Groundnut</option>
                  <option value="Maize">Maize</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Land (Ha)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full px-2.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="1.0"
                  value={landSizeHectares}
                  onChange={(e) => setLandSizeHectares(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2"
            >
              <UserPlus size={18} />
              {submitting ? 'Creating Profile...' : 'Complete Sign Up'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
