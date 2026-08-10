import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { subsidyApi } from '../api/client';
import { Info, FileText, ExternalLink, MapPin, Map, Search, ChevronDown, ChevronUp } from 'lucide-react';

interface SubsidySchemeItem {
  id: number;
  name: string;
  nameTa?: string;
  description: string;
  descriptionTa?: string;
  applicableCrops?: string;
  applicableCropsTa?: string;
  applicableDistricts?: string;
  subsidyAmount?: string;
}

export const SubsidyPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';

  const [schemes, setSchemes] = useState<SubsidySchemeItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [showOffice1, setShowOffice1] = useState(false);
  const [showOffice2, setShowOffice2] = useState(false);

  useEffect(() => {
    fetchSubsidies();
  }, []);

  const fetchSubsidies = async () => {
    try {
      const res = await subsidyApi.get('/api/subsidies');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setSchemes(res.data);
      }
    } catch {
      // Fallback
    }
  };

  const scheme1 = schemes[0];
  const scheme2 = schemes[2] || schemes[1];

  return (
    <div className="page-view fade-in">
      <div className="page-hd">
        <h1>{t('subsidyPageTitle')}</h1>
        <p>{t('subsidyPageSub')}</p>
      </div>

      <div
        className="card p-4 mb-5 flex items-center gap-3 text-xs"
        style={{
          background: 'var(--amber-soft)',
          borderColor: 'transparent',
          color: '#6b4f10',
        }}
      >
        <Info size={16} className="shrink-0" />
        <span>{t('noProfileNoteSub')}</span>
      </div>

      <h3 className="text-sm font-semibold mb-3">{t('recommendedForYou')}</h3>

      {/* Subsidy 1 */}
      <div className="card rec-card">
        <div className="rec-top">
          <div>
            <h4>{(isTa && scheme1?.nameTa) ? scheme1.nameTa : (scheme1?.name || 'PM-KISAN Samman Nidhi')}</h4>
            <div className="rec-meta">
              <span className="badge badge-green">96% match</span>
              <span className="badge badge-neutral">Income Support</span>
            </div>
          </div>
          <div className="rec-benefit">
            <div className="l">{t('estBenefitLabel')}</div>
            <div className="v">₹6,000/yr</div>
          </div>
        </div>

        <p className="text-xs text-gray-600 mb-2">
          {(isTa && scheme1?.descriptionTa) ? scheme1.descriptionTa : (scheme1?.description || 'Income support of ₹6,000/year in 3 installments to landholding farmer families.')}
        </p>

        <div className="rec-docs">
          <span className="doc-chip"><FileText size={13} />{t('docAadhaar')}</span>
          <span className="doc-chip"><FileText size={13} />{t('docLandRecord')}</span>
          <span className="doc-chip"><FileText size={13} />{t('docBankPassbook')}</span>
        </div>

        <div className="rec-actions">
          <button className="btn btn-primary btn-sm"><ExternalLink size={13} />{t('applyOnlineBtn')}</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowOffice1(!showOffice1)}><MapPin size={13} />{t('offlineOfficeBtn')}</button>
          <button className="btn btn-ghost btn-sm">{t('viewAll')}</button>
        </div>

        {showOffice1 && (
          <div className="office-box">
            <span><b>Thiruvaiyaru Block Agriculture Office</b> · Big Bazaar St, Thiruvaiyaru · 3.2 km</span>
            <button className="btn btn-ghost btn-sm"><Map size={13} />{t('mapsBtn')}</button>
          </div>
        )}
      </div>

      {/* Subsidy 2 */}
      <div className="card rec-card">
        <div className="rec-top">
          <div>
            <h4>{(isTa && scheme2?.nameTa) ? scheme2.nameTa : (scheme2?.name || 'Micro Irrigation Subsidy (Drip/Sprinkler)')}</h4>
            <div className="rec-meta">
              <span className="badge badge-green">88% match</span>
              <span className="badge badge-neutral">Up to 55% assistance</span>
            </div>
          </div>
          <div className="rec-benefit">
            <div className="l">{t('estBenefitLabel')}</div>
            <div className="v">₹27,500</div>
          </div>
        </div>

        <p className="text-xs text-gray-600 mb-2">
          {(isTa && scheme2?.descriptionTa) ? scheme2.descriptionTa : (scheme2?.description || 'Subsidy for drip and sprinkler irrigation systems.')}
        </p>

        <div className="rec-docs">
          <span className="doc-chip"><FileText size={13} />{t('docLandRecord')}</span>
          <span className="doc-chip"><FileText size={13} />{t('docWaterSource')}</span>
        </div>

        <div className="rec-actions">
          <button className="btn btn-primary btn-sm"><ExternalLink size={13} />{t('applyOnlineBtn')}</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowOffice2(!showOffice2)}><MapPin size={13} />{t('offlineOfficeBtn')}</button>
          <button className="btn btn-ghost btn-sm">{t('viewAll')}</button>
        </div>

        {showOffice2 && (
          <div className="office-box">
            <span><b>Thanjavur District Collectorate — Agri Wing</b> · Medical College Rd · 8.6 km</span>
            <button className="btn btn-ghost btn-sm"><Map size={13} />{t('mapsBtn')}</button>
          </div>
        )}
      </div>

      {/* View All */}
      <div className="text-center my-5">
        <button className="btn btn-ghost" onClick={() => setShowAll(!showAll)}>
          {showAll ? t('hideCatalogueBtn') : t('viewAllSubsidyBtn')}{' '}
          {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {showAll && (
        <div className="fade-in">
          <div className="filter-bar">
            <div className="search">
              <Search />
              <input placeholder={t('searchSchemesPlaceholder')} />
            </div>
            <select><option>{t('allCategoriesOption')}</option></select>
            <select><option>{t('allCropsOption')}</option></select>
            <select><option>{t('allDistrictsOption')}</option></select>
          </div>
          <div className="card p-2">
            {schemes.map((item, idx) => (
              <div key={item.id || idx} className="py-3 px-4 flex justify-between text-sm border-b last:border-b-0">
                <div>
                  <div className="font-semibold">{(isTa && item.nameTa) ? item.nameTa : item.name}</div>
                  <div className="text-xs text-gray-500">{(isTa && item.applicableCropsTa) ? item.applicableCropsTa : item.applicableCrops}</div>
                </div>
                <span className="badge badge-neutral">Subsidy</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
