import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ta' : 'en');
  };

  return (
    <div className="page-view fade-in">
      <div className="page-hd">
        <h1>{t('settingsPageTitle')}</h1>
        <p>{t('settingsPageSub')}</p>
      </div>

      <div className="card">
        <div className="settings-row">
          <div className="l">
            <h4>{t('langSettingTitle')}</h4>
            <p>{t('langSettingSub')}</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={toggleLanguage}>
            <Languages size={14} />
            <span>{i18n.language === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>
        </div>

        <div className="settings-row">
          <div className="l">
            <h4>{t('themeSettingTitle')}</h4>
            <p>{t('themeSettingSub')}</p>
          </div>
          <div className="switch-toggle"></div>
        </div>

        <div className="settings-row">
          <div className="l">
            <h4>{t('navProfile')}</h4>
            <p>{t('subProfile')}</p>
          </div>
          <button className="btn btn-ghost btn-sm">{t('editBtn')}</button>
        </div>

        <div className="settings-row">
          <div className="l">
            <h4>{t('helpSettingTitle')}</h4>
            <p>{t('helpSettingSub')}</p>
          </div>
          <button className="btn btn-ghost btn-sm">{t('openBtn')}</button>
        </div>

        <div className="settings-row">
          <div className="l">
            <h4>{t('privacySettingTitle')}</h4>
            <p>{t('privacySettingSub')}</p>
          </div>
          <button className="btn btn-ghost btn-sm">{t('openBtn')}</button>
        </div>
      </div>
    </div>
  );
};
