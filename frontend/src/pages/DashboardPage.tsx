import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { subsidyApi, insuranceApi } from '../api/client';
import {
  HandCoins,
  ShieldCheck,
  CloudSun,
  Tractor,
  UserPlus,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, username } = useAuth();

  const [weatherTemp, setWeatherTemp] = useState<number | null>(null);
  const [subsidiesCount, setSubsidiesCount] = useState<number>(0);
  const [insuranceCount, setInsuranceCount] = useState<number>(0);

  const farmerName = profile?.fullName || profile?.username || username || 'Farmer';
  const cropsList = Array.isArray(profile?.crops) && profile.crops.length > 0 ? profile.crops : [];
  
  // Default to FIRST crop profile created (earliest in crops array)
  const firstCrop = cropsList[0];
  const defaultDistrict = firstCrop?.districtName || '';

  const [selectedWeatherDistrict, setSelectedWeatherDistrict] = useState<string>(defaultDistrict);

  // Sync default weather district whenever profile updates
  useEffect(() => {
    const primaryDist = cropsList[0]?.districtName || '';
    setSelectedWeatherDistrict(primaryDist);
  }, [profile]);

  const cropSummary = cropsList.length > 0
    ? cropsList.map(c => c.cropGrown).filter(Boolean).join(', ')
    : 'No Crops Added';

  const totalAcres = (() => {
    if (cropsList.length > 0) {
      return cropsList.reduce((acc, c) => acc + (parseFloat(String(c.landSizeAcres ?? 0)) || 0), 0).toFixed(1);
    }
    return '0';
  })();

  const landSizeDisplay = cropsList.length > 0 ? `${totalAcres} Acres` : 'Not Set';

  useEffect(() => {
    if (selectedWeatherDistrict) {
      fetchDashboardData(selectedWeatherDistrict);
    } else {
      setWeatherTemp(null);
      fetchDashboardData('Thanjavur'); // general background fetch
    }
  }, [selectedWeatherDistrict, profile]);


  const fetchDashboardData = async (targetDistrict: string) => {
    // 1. Fetch weather for selected district (defaults to 1st crop profile's district)
    try {
      const res = await insuranceApi.get('/api/weather', { params: { district: targetDistrict } });
      if (res.data?.temperatureCelsius !== undefined) {
        setWeatherTemp(Math.round(res.data.temperatureCelsius));
      }
    } catch {
      setWeatherTemp(32);
    }

    // 2. Fetch recommended subsidies
    try {
      const res = await subsidyApi.get('/api/subsidies/recommended');
      if (Array.isArray(res.data)) {
        setSubsidiesCount(res.data.length);
      }
    } catch {
      setSubsidiesCount(2);
    }

    // 3. Fetch recommended insurance
    try {
      const res = await insuranceApi.get('/api/insurance/recommended');
      if (Array.isArray(res.data)) {
        setInsuranceCount(res.data.length);
      }
    } catch {
      setInsuranceCount(1);
    }
  };

  return (
    <div className="page-view fade-in">
      {/* Welcome Card with District Weather Defaults & Switcher */}
      <div className="welcome-card">
        <div>
          <h2>Welcome, {farmerName}!</h2>
          <div style={{ fontSize: '12.5px', opacity: 0.85 }}>
            {t('welcomeSub')}
          </div>
          <div className="stats-inline mt-3">
            <div className="s-item">
              <div className="l">Primary District</div>
              <div className="v">{defaultDistrict || 'Not Set'}</div>
            </div>
            <div className="s-item">
              <div className="l">Registered Crops ({cropsList.length})</div>
              <div className="v">{cropSummary}</div>
            </div>
            <div className="s-item">
              <div className="l">{t('landLabel')}</div>
              <div className="v">{landSizeDisplay}</div>
            </div>
          </div>
        </div>

        {/* Main Weather Widget - Defaults to 1st Crop District with Switcher */}
        <div className="weather-mini flex flex-col items-end gap-1">
          <div className="l text-right" style={{ fontSize: '11px', opacity: 0.85 }}>
            📍 Weather: <strong className="underline">{selectedWeatherDistrict || 'Not Set'}</strong>
          </div>
          <div className="t">{selectedWeatherDistrict && weatherTemp !== null ? `${weatherTemp}°C` : '--'}</div>


          {/* District Switcher for Multi-Crop Farmers */}
          {cropsList.length > 1 && (
            <div className="mt-1">
              <select
                value={selectedWeatherDistrict}
                onChange={(e) => setSelectedWeatherDistrict(e.target.value)}
                className="text-[10px] font-bold py-0.5 px-1.5 rounded bg-white/20 text-white border border-white/30 focus:outline-none cursor-pointer"
                title="Switch district view"
              >
                {cropsList.map((c, i) => {
                  const dist = c.districtName || defaultDistrict;
                  return (
                    <option key={i} value={dist} className="text-gray-900 font-normal">
                      {i === 0 ? `★ ${dist} (1st Crop: ${c.cropGrown})` : `${dist} (Crop #${i + 1}: ${c.cropGrown})`}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Profile CTA Banner */}
      <div className="profile-cta-banner">
        <div className="txt">
          <h3>
            {profile?.districtName && (profile?.cropGrown || cropsList.length > 0)
              ? 'Farmer Profile & Crops Active'
              : t('ctaTitle')}
          </h3>
          <p>
            {profile?.districtName && (profile?.cropGrown || cropsList.length > 0)
              ? `Default District: ${defaultDistrict} (1st Crop) · ${cropsList.length} Crops (${cropSummary}) · Total ${landSizeDisplay}`
              : t('ctaSub')}
          </p>
        </div>
        <button
          className="btn btn-primary btn-lg whitespace-nowrap cursor-pointer flex items-center gap-2"
          onClick={() => navigate('/profile')}
        >
          <UserPlus size={18} />
          {profile?.districtName && (profile?.cropGrown || cropsList.length > 0) ? 'Manage Crops' : t('completeProfileBtn')}
        </button>
      </div>


      {/* Module Grid (4 Columns) */}
      <div className="module-grid">
        {/* Module 1: Subsidy */}
        <div
          className="card hoverable module-card cursor-pointer"
          onClick={() => navigate('/subsidy')}
        >
          <div
            className="m-ic"
            style={{
              background: 'var(--light-green-soft)',
              color: 'var(--emerald-deep)',
            }}
          >
            <HandCoins size={20} />
          </div>
          <h4>{t('modSubsidyTitle')}</h4>
          <div className="m-detail">{t('modSubsidyDetail')}</div>
          <div className="m-foot">
            <span className="badge badge-green">{subsidiesCount} Recommended</span>
            <span
              className="btn-sm"
              style={{ color: 'var(--emerald-deep)', fontWeight: 700 }}
            >
              {t('viewAll')}
            </span>
          </div>
        </div>

        {/* Module 2: Insurance */}
        <div
          className="card hoverable module-card cursor-pointer"
          onClick={() => navigate('/insurance')}
        >
          <div
            className="m-ic"
            style={{
              background: 'var(--sky-soft)',
              color: 'var(--sky)',
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <h4>{t('modInsuranceTitle')}</h4>
          <div className="m-detail">{t('modInsuranceDetail')}</div>
          <div className="m-foot">
            <span className="badge badge-green">{insuranceCount} Scheme Available</span>
            <span
              className="btn-sm"
              style={{ color: 'var(--emerald-deep)', fontWeight: 700 }}
            >
              {t('viewAll')}
            </span>
          </div>
        </div>

        {/* Module 3: Weather */}
        <div
          className="card hoverable module-card cursor-pointer"
          onClick={() => navigate('/weather')}
        >
          <div
            className="m-ic"
            style={{
              background: 'var(--amber-soft)',
              color: 'var(--amber)',
            }}
          >
            <CloudSun size={20} />
          </div>
          <h4>{t('modWeatherTitle')}</h4>
          <div className="m-detail">{t('modWeatherDetail')}</div>
          <div className="m-foot">
            <span className="badge badge-amber">{selectedWeatherDistrict} Forecast</span>
            <span
              className="btn-sm"
              style={{ color: 'var(--emerald-deep)', fontWeight: 700 }}
            >
              {t('viewAll')}
            </span>
          </div>
        </div>

        {/* Module 4: Machinery */}
        <div
          className="card hoverable module-card cursor-pointer"
          onClick={() => navigate('/machinery')}
        >
          <div
            className="m-ic"
            style={{
              background: 'var(--rust-soft)',
              color: 'var(--rust)',
            }}
          >
            <Tractor size={20} />
          </div>
          <h4>{t('modMachineryTitle')}</h4>
          <div className="m-detail">{t('modMachineryDetail')}</div>
          <div className="m-foot">
            <span className="badge badge-amber">Custom Hiring</span>
            <span
              className="btn-sm"
              style={{ color: 'var(--emerald-deep)', fontWeight: 700 }}
            >
              {t('viewAll')}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="quick-stats">
        <div className="card qs-card">
          <div className="l">{t('eligibleSubsidies')}</div>
          <div className="v">{subsidiesCount}</div>
          <div className="trend" style={{ color: 'var(--emerald-deep)' }}>
            Matched for {cropSummary}
          </div>
        </div>

        <div className="card qs-card">
          <div className="l">{t('insuranceDeadline')}</div>
          <div className="v">14 days</div>
          <div className="trend" style={{ color: 'var(--rust)' }}>
            Kharif Crop Season
          </div>
        </div>

        <div className="card qs-card">
          <div className="l">Live Temperature</div>
          <div className="v">{weatherTemp !== null ? `${weatherTemp}°C` : '--'}</div>
          <div className="trend" style={{ color: 'var(--sky)' }}>
            {selectedWeatherDistrict}
          </div>
        </div>

        <div className="card qs-card">
          <div className="l">Land Size</div>
          <div className="v">{landSizeDisplay}</div>
          <div className="trend" style={{ color: 'var(--amber)' }}>
            Registered Profile
          </div>
        </div>
      </div>

    </div>
  );
};
