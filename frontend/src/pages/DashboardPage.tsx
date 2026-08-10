import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

  return (
    <div className="page-view fade-in">
      {/* Welcome Card */}
      <div className="welcome-card">
        <div>
          <h2>{t('welcomeTitle')}</h2>
          <div style={{ fontSize: '12.5px', opacity: 0.85 }}>
            {t('welcomeSub')}
          </div>
          <div className="stats-inline mt-3">
            <div className="s-item">
              <div className="l">{t('villageLabel')}</div>
              <div className="v">Kondiyur</div>
            </div>
            <div className="s-item">
              <div className="l">{t('cropLabel')}</div>
              <div className="v">Paddy</div>
            </div>
            <div className="s-item">
              <div className="l">{t('landLabel')}</div>
              <div className="v">2.5 ac</div>
            </div>
          </div>
        </div>
        <div className="weather-mini">
          <div className="l" style={{ fontSize: '11px', opacity: 0.75 }}>
            {t('todayLabel')}
          </div>
          <div className="t">31°C</div>
        </div>
      </div>

      {/* Profile CTA Banner */}
      <div className="profile-cta-banner">
        <div className="txt">
          <h3>{t('ctaTitle')}</h3>
          <p>{t('ctaSub')}</p>
        </div>
        <button
          className="btn btn-primary btn-lg whitespace-nowrap"
          onClick={() => navigate('/profile')}
        >
          <UserPlus size={18} />
          {t('completeProfileBtn')}
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
            <span className="badge badge-amber">{t('profileRequired')}</span>
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
            <span className="badge badge-amber">{t('profileRequired')}</span>
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
            <span className="badge badge-amber">{t('profileRequired')}</span>
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
            <span className="badge badge-amber">{t('profileRequired')}</span>
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
          <div className="v">3</div>
          <div className="trend" style={{ color: 'var(--emerald-deep)' }}>
            {t('eligibleSubsidiesTrend')}
          </div>
        </div>

        <div className="card qs-card">
          <div className="l">{t('insuranceDeadline')}</div>
          <div className="v">14 days</div>
          <div className="trend" style={{ color: 'var(--rust)' }}>
            {t('insuranceDeadlineTrend')}
          </div>
        </div>

        <div className="card qs-card">
          <div className="l">{t('rainProbability')}</div>
          <div className="v">70%</div>
          <div className="trend" style={{ color: 'var(--sky)' }}>
            {t('rainProbabilityTrend')}
          </div>
        </div>

        <div className="card qs-card">
          <div className="l">{t('machineryGroup')}</div>
          <div className="v">3/4</div>
          <div className="trend" style={{ color: 'var(--amber)' }}>
            {t('machineryGroupTrend')}
          </div>
        </div>
      </div>
    </div>
  );
};
