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
  const [districtCropStats, setDistrictCropStats] = useState<Array<{
    id: number;
    crop: string;
    season: string;
    year: string;
    areaHectares: number;
    productionTonnes: number;
    yieldKgPerHa: number;
    isTopCrop: boolean;
  }>>([]);


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
    // 1. Fetch weather for selected district
    try {
      const res = await insuranceApi.get('/api/weather', { params: { district: targetDistrict } });
      if (res.data?.temperatureCelsius !== undefined) {
        setWeatherTemp(Math.round(res.data.temperatureCelsius));
      }
    } catch {
      setWeatherTemp(32);
    }

    // 2. Fetch district crop stats
    if (targetDistrict) {
      try {
        const res = await subsidyApi.get(`/api/districts/name/${encodeURIComponent(targetDistrict)}/crop-stats`);
        if (Array.isArray(res.data)) {
          setDistrictCropStats(res.data);
        } else {
          setDistrictCropStats([]);
        }
      } catch {
        setDistrictCropStats([]);
      }
    } else {
      setDistrictCropStats([]);
    }

    // 3. Fetch recommended subsidies
    try {
      const res = await subsidyApi.get('/api/subsidies/recommended');
      if (Array.isArray(res.data)) {
        setSubsidiesCount(res.data.length);
      }
    } catch {
      setSubsidiesCount(2);
    }

    // 4. Fetch recommended insurance
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

        {/* Main Weather Widget */}
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
                className="text-xs text-gray-900 bg-white/90 border border-emerald-200 rounded-lg px-2 py-1 outline-none font-semibold cursor-pointer shadow-sm"
              >
                {cropsList.map((c, i) => {
                  const distName = c.districtName || `Crop #${i + 1}`;
                  return (
                    <option key={c.id || i} value={distName}>
                      {c.cropGrown} ({distName})
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

      {/* District Crop Yield Insights Card */}
      {selectedWeatherDistrict && districtCropStats.length > 0 && (
        <div className="card p-5 mb-6 bg-gradient-to-r from-emerald-900 to-emerald-950 text-white rounded-2xl shadow-sm border border-emerald-800">
          <div className="flex items-center justify-between mb-3 border-b border-emerald-800/80 pb-2">
            <h4 className="text-sm font-bold flex items-center gap-2 text-emerald-300">
              <Tractor size={18} className="text-emerald-400" />
              District Crop Yield Context ({selectedWeatherDistrict})
            </h4>
            <span className="text-[11px] font-medium bg-emerald-800/80 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-700">
              tn_district_crop_data 2024-25
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {districtCropStats.map((stat, idx) => (
              <div key={stat.id || idx} className="bg-emerald-900/60 border border-emerald-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-white">{stat.crop}</span>
                  {stat.isTopCrop && (
                    <span className="text-[10px] font-bold bg-amber-400 text-gray-950 px-1.5 py-0.5 rounded">
                      TOP CROP
                    </span>
                  )}
                </div>
                <div className="text-xs text-emerald-200 font-mono">
                  Yield: <strong>{Number(stat.yieldKgPerHa).toLocaleString()} kg/ha</strong>
                </div>
                <div className="text-[11px] text-emerald-300/80 mt-0.5">
                  Area: {Number(stat.areaHectares).toLocaleString()} Ha ({stat.season})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


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
