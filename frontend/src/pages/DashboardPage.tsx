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
  const district = profile?.districtName || 'Thanjavur';
  const crop = profile?.cropGrown || 'Paddy';
  const landSize = profile?.landSizeHectares ? `${profile.landSizeHectares} ha` : '1.0 ha';

  useEffect(() => {
    fetchDashboardData();
  }, [profile]);

  const fetchDashboardData = async () => {
    // 1. Fetch weather
    try {
      const res = await insuranceApi.get('/api/weather', { params: { district } });
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
      {/* Welcome Card */}
      <div className="welcome-card">
        <div>
          <h2>Welcome, {farmerName}!</h2>
          <div style={{ fontSize: '12.5px', opacity: 0.85 }}>
            {t('welcomeSub')}
          </div>
          <div className="stats-inline mt-3">
            <div className="s-item">
              <div className="l">{t('districtLabel')}</div>
              <div className="v">{district}</div>
            </div>
            <div className="s-item">
              <div className="l">{t('cropLabel')}</div>
              <div className="v">{crop}</div>
            </div>
            <div className="s-item">
              <div className="l">{t('landLabel')}</div>
              <div className="v">{landSize}</div>
            </div>
          </div>
        </div>
        <div className="weather-mini">
          <div className="l" style={{ fontSize: '11px', opacity: 0.75 }}>
            {t('todayLabel')}
          </div>
          <div className="t">{weatherTemp !== null ? `${weatherTemp}°C` : '--'}</div>
        </div>
      </div>

      {/* Profile CTA Banner */}
      <div className="profile-cta-banner">
        <div className="txt">
          <h3>
            {profile?.districtName && profile?.cropGrown
              ? 'Farmer Profile Registered & Active'
              : t('ctaTitle')}
          </h3>
          <p>
            {profile?.districtName && profile?.cropGrown
              ? `Configured for ${profile.districtName} district · ${profile.cropGrown} · ${profile.landSizeHectares || 1.0} Ha`
              : t('ctaSub')}
          </p>
        </div>
        <button
          className="btn btn-primary btn-lg whitespace-nowrap cursor-pointer"
          onClick={() => navigate('/profile')}
        >
          <UserPlus size={18} />
          {profile?.districtName && profile?.cropGrown ? 'Edit Profile' : t('completeProfileBtn')}
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
            <span className="badge badge-amber">{district} Forecast</span>
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
            Matched for {crop}
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
            {district}
          </div>
        </div>

        <div className="card qs-card">
          <div className="l">Land Size</div>
          <div className="v">{landSize}</div>
          <div className="trend" style={{ color: 'var(--amber)' }}>
            Registered Profile
          </div>
        </div>
      </div>
    </div>
  );
};
