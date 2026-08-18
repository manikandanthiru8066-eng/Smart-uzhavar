import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { subsidyApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Info, FileText, ExternalLink, MapPin, Search, ChevronDown, ChevronUp } from 'lucide-react';

interface SubsidyItem {
  id: number;
  name: string;
  nameTa?: string;
  description: string;
  descriptionTa?: string;
  applicableCrops?: string;
  applicableCropsTa?: string;
  applicableDistricts?: string;
  subsidyAmount?: string;
  matchScore?: number;
}

export const SubsidyPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';
  const { profile } = useAuth();

  const [recommended, setRecommended] = useState<SubsidyItem[]>([]);
  const [allSchemes, setAllSchemes] = useState<SubsidyItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [showOfficeIndex, setShowOfficeIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchRecommended();
    fetchAllSchemes();
  }, []);

  const fetchRecommended = async () => {
    try {
      const res = await subsidyApi.get<SubsidyItem[]>('/api/subsidies/recommended');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setRecommended(res.data);
      } else {
        fetchAllFallback();
      }
    } catch {
      fetchAllFallback();
    }
  };

  const fetchAllFallback = async () => {
    try {
      const res = await subsidyApi.get<SubsidyItem[]>('/api/subsidies');
      if (Array.isArray(res.data)) {
        setRecommended(res.data.slice(0, 2));
      }
    } catch {
      // Fallback
    }
  };

  const fetchAllSchemes = async () => {
    try {
      const res = await subsidyApi.get<SubsidyItem[]>('/api/subsidies');
      if (Array.isArray(res.data)) {
        setAllSchemes(res.data);
      }
    } catch {
      // Fallback
    }
  };

  const filteredSchemes = allSchemes.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCrop =
      !selectedCrop ||
      (item.applicableCrops &&
        (item.applicableCrops.toLowerCase().includes(selectedCrop.toLowerCase()) ||
          item.applicableCrops.toLowerCase() === 'all'));

    return matchesSearch && matchesCrop;
  });

  return (
    <div className="page-view fade-in">
      <div className="page-hd">
        <h1>{t('subsidyPageTitle')}</h1>
        <p>{t('subsidyPageSub')}</p>
      </div>

      {profile && (
        <div
          className="card p-4 mb-5 flex items-center gap-3 text-xs font-medium"
          style={{
            background: 'var(--light-green-soft)',
            borderColor: 'var(--emerald)',
            color: 'var(--emerald-deep)',
          }}
        >
          <Info size={16} className="shrink-0" />
          <span>
            Matched for <b>{profile.fullName || profile.username}</b> in <b>{profile.districtName || 'All Districts'}</b> ({profile.cropGrown || 'All Crops'}, {profile.landSizeHectares || 1.0} Ha)
          </span>
        </div>
      )}

      <h3 className="text-sm font-semibold mb-3">{t('recommendedForYou')}</h3>

      {recommended.length > 0 ? (
        recommended.map((scheme, idx) => (
          <div key={scheme.id || idx} className="card rec-card mb-4">
            <div className="rec-top">
              <div>
                <h4>{(isTa && scheme.nameTa) ? scheme.nameTa : scheme.name}</h4>
                <div className="rec-meta">
                  <span className="badge badge-green">
                    {scheme.matchScore ? `${Math.round(scheme.matchScore)}% match` : 'High Match'}
                  </span>
                  <span className="badge badge-neutral">
                    {(isTa && scheme.applicableCropsTa) ? scheme.applicableCropsTa : scheme.applicableCrops || 'Crops'}
                  </span>
                </div>
              </div>
              <div className="rec-benefit">
                <div className="l">{t('estBenefitLabel')}</div>
                <div className="v">{scheme.subsidyAmount || 'Subsidized'}</div>
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-3">
              {(isTa && scheme.descriptionTa) ? scheme.descriptionTa : scheme.description}
            </p>

            <div className="rec-docs mb-3">
              <span className="doc-chip"><FileText size={13} />{t('docAadhaar')}</span>
              <span className="doc-chip"><FileText size={13} />{t('docLandRecord')}</span>
              <span className="doc-chip"><FileText size={13} />{t('docBankPassbook')}</span>
            </div>

            <div className="rec-actions">
              <button className="btn btn-primary btn-sm"><ExternalLink size={13} />{t('applyOnlineBtn')}</button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowOfficeIndex(showOfficeIndex === idx ? null : idx)}
              >
                <MapPin size={13} />{t('offlineOfficeBtn')}
              </button>
            </div>

            {showOfficeIndex === idx && (
              <div className="office-box mt-3">
                <span><b>{profile?.districtName || 'Thanjavur'} District Agriculture Extension Office</b> · Main Road Center</span>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="card p-6 text-center text-sm text-gray-500">
          Loading subsidy recommendations...
        </div>
      )}

      {/* View All Catalogue Toggle */}
      <div className="text-center my-5">
        <button className="btn btn-ghost" onClick={() => setShowAll(!showAll)}>
          {showAll ? t('hideCatalogueBtn') : t('viewAllSubsidyBtn')}{' '}
          {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {showAll && (
        <div className="fade-in space-y-3">
          <div className="filter-bar">
            <div className="search">
              <Search size={16} />
              <input
                placeholder={t('searchSchemesPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}>
              <option value="">{t('allCropsOption')}</option>
              <option value="Paddy">Paddy</option>
              <option value="Sugarcane">Sugarcane</option>
              <option value="Cotton">Cotton</option>
            </select>
          </div>

          <div className="card p-2">
            {filteredSchemes.map((item, idx) => (
              <div key={item.id || idx} className="py-3 px-4 flex justify-between items-center text-sm border-b last:border-b-0">
                <div>
                  <div className="font-semibold">{(isTa && item.nameTa) ? item.nameTa : item.name}</div>
                  <div className="text-xs text-gray-500">{(isTa && item.descriptionTa) ? item.descriptionTa : item.description}</div>
                </div>
                <span className="badge badge-green font-bold shrink-0">{item.subsidyAmount || 'Subsidy'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
