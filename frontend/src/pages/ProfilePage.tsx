import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page-view fade-in">
      <div className="page-hd">
        <h1>{t('profilePageTitle')}</h1>
        <p>{t('profilePageSub')}</p>
      </div>

      <div className="card p-7 max-w-2xl">
        <div className="field-row">
          <div className="field">
            <label>{t('nameLabel')}</label>
            <input defaultValue="Manikandan R" />
          </div>
          <div className="field">
            <label>{t('phoneLabel')}</label>
            <input defaultValue="+91 98765 43210" disabled />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>{t('districtLabel')}</label>
            <input defaultValue="Thanjavur" />
          </div>
          <div className="field">
            <label>{t('blockLabel')}</label>
            <input defaultValue="Thiruvaiyaru" />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>{t('villageLabel')}</label>
            <input defaultValue="Kondiyur" />
          </div>
          <div className="field">
            <label>{t('categoryLabel')}</label>
            <select defaultValue="Marginal">
              <option value="Small">Small</option>
              <option value="Marginal">Marginal</option>
              <option value="Large">Large</option>
            </select>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>{t('cropTypeLabel')}</label>
            <input defaultValue="Paddy (Rice)" />
          </div>
          <div className="field">
            <label>{t('acresLabel')}</label>
            <input defaultValue="2.5" />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>{t('seasonTypeLabel')}</label>
            <input defaultValue="Kharif · Jun–Oct" />
          </div>
          <div className="field">
            <label>{t('irrigationLabel')}</label>
            <select defaultValue="Canal">
              <option value="Canal">Canal</option>
              <option value="Borewell">Borewell</option>
              <option value="Rain-fed">Rain-fed</option>
            </select>
          </div>
        </div>

        <button className="btn btn-primary btn-lg" onClick={handleSave}>
          <Check size={18} />
          {saved ? t('savedSuccessBtn') : t('saveProfileBtn')}
        </button>
      </div>
    </div>
  );
};
