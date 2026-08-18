import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { subsidyApi } from '../api/client';
import { Check, AlertCircle, ArrowLeft } from 'lucide-react';

interface DistrictItem {
  id: number;
  name: string;
}

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();

  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
  const [districtName, setDistrictName] = useState(profile?.districtName || '');
  const [block, setBlock] = useState('Thiruvaiyaru');
  const [cropGrown, setCropGrown] = useState(profile?.cropGrown || 'Paddy');
  const [landSizeHectares, setLandSizeHectares] = useState(
    profile?.landSizeHectares ? String(profile.landSizeHectares) : '1.0'
  );
  const [irrigationType, setIrrigationType] = useState('Canal');

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setEmail(profile.email || '');
      setPhoneNumber(profile.phoneNumber || '');
      setDistrictName(profile.districtName || '');
      setCropGrown(profile.cropGrown || 'Paddy');
      setLandSizeHectares(profile.landSizeHectares ? String(profile.landSizeHectares) : '1.0');
    }
  }, [profile]);

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const res = await subsidyApi.get<DistrictItem[]>('/api/districts');
        if (Array.isArray(res.data)) {
          setDistricts(res.data);
        }
      } catch {
        setDistricts([
          { id: 1, name: 'Thanjavur' },
          { id: 2, name: 'Thiruvarur' },
          { id: 3, name: 'Nagapattinam' },
          { id: 4, name: 'Trichy' },
        ]);
      }
    };
    fetchDistricts();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        districtName: districtName || undefined,
        cropGrown: cropGrown || undefined,
        landSizeHectares: parseFloat(landSizeHectares) || 1.0,
      });
      setSaved(true);
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-view fade-in">
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="btn btn-ghost btn-sm flex items-center gap-1.5"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>

      <div className="page-hd">
        <h1>{t('profilePageTitle')}</h1>
        <p>{t('profilePageSub')}</p>
      </div>

      <div className="card p-7 max-w-2xl">
        {error && (
          <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {saved && (
          <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
            <Check size={16} />
            <span>Profile saved successfully! Redirecting to dashboard...</span>
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="field-row">
            <div className="field">
              <label>{t('nameLabel')} *</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Username</label>
              <input value={profile?.username || ''} disabled className="bg-gray-100 cursor-not-allowed" />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>{t('phoneLabel')}</label>
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="field">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@example.com"
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>{t('districtLabel')} *</label>
              <select
                value={districtName}
                onChange={(e) => setDistrictName(e.target.value)}
                required
              >
                <option value="">-- Select District --</option>
                {districts.map((d) => (
                  <option key={d.id || d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Block / Taluk</label>
              <input
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                placeholder="e.g. Thiruvaiyaru"
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>{t('cropTypeLabel')} *</label>
              <select
                value={cropGrown}
                onChange={(e) => setCropGrown(e.target.value)}
                required
              >
                <option value="Paddy">Paddy (Rice)</option>
                <option value="Sugarcane">Sugarcane</option>
                <option value="Cotton">Cotton</option>
                <option value="Banana">Banana</option>
                <option value="Groundnut">Groundnut</option>
                <option value="Maize">Maize</option>
              </select>
            </div>
            <div className="field">
              <label>Land Size (Hectares / Acres)</label>
              <input
                type="number"
                step="0.1"
                value={landSizeHectares}
                onChange={(e) => setLandSizeHectares(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Irrigation Type</label>
              <select
                value={irrigationType}
                onChange={(e) => setIrrigationType(e.target.value)}
              >
                <option value="Canal">Canal</option>
                <option value="Borewell">Borewell</option>
                <option value="Rain-fed">Rain-fed</option>
                <option value="Drip/Sprinkler">Drip / Sprinkler</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary btn-lg"
            >
              <Check size={18} />
              {saving ? 'Saving Profile...' : saved ? 'Saved!' : t('saveProfileBtn')}
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-lg"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
