import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { subsidyApi } from '../api/client';
import { useAuth, FarmerCropItem } from '../context/AuthContext';
import { Info, FileText, ExternalLink, MapPin, Search, Sprout } from 'lucide-react';
import { InsightsPanel } from '../components/InsightsPanel';

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
  matchReasons?: string[];
}


interface CropSubsidyGroup {
  cropProfile: FarmerCropItem;
  schemes: SubsidyItem[];
}

export const SubsidyPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';
  const { profile } = useAuth();

  const [cropGroups, setCropGroups] = useState<CropSubsidyGroup[]>([]);
  const [fallbackRecommended, setFallbackRecommended] = useState<SubsidyItem[]>([]);
  const [allSchemes, setAllSchemes] = useState<SubsidyItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [showOfficeIndex, setShowOfficeIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchGroupedRecommendations();
    fetchAllSchemes();
  }, [profile]);

  const fetchGroupedRecommendations = async () => {
    const crops: FarmerCropItem[] = Array.isArray(profile?.crops) ? profile.crops : [];

    if (crops.length > 0) {
      try {
        const groups: CropSubsidyGroup[] = [];
        for (const cropItem of crops) {
          if (cropItem.id) {
            const res = await subsidyApi.get<SubsidyItem[]>(`/api/subsidies/recommended?cropProfileId=${cropItem.id}`);
            if (Array.isArray(res.data) && res.data.length > 0) {
              groups.push({
                cropProfile: cropItem,
                schemes: res.data,
              });
            }
          }
        }
        if (groups.length > 0) {
          setCropGroups(groups);
          return;
        }
      } catch (err) {
        console.error('[SubsidyPage] Error fetching crop profile recommendations:', err);
      }
    }

    // Fallback if zero crops or single fallback
    fetchFallbackRecommended();
  };

  const fetchFallbackRecommended = async () => {
    try {
      const res = await subsidyApi.get<SubsidyItem[]>('/api/subsidies/recommended');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setFallbackRecommended(res.data);
      } else {
        const allRes = await subsidyApi.get<SubsidyItem[]>('/api/subsidies');
        if (Array.isArray(allRes.data)) {
          setFallbackRecommended(allRes.data.slice(0, 3));
        }
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
            Matched for <b>{profile.fullName || profile.username}</b> ({cropGroups.length} Active Cultivated Crop Profiles)
          </span>
        </div>
      )}

      {/* Actionable Agronomic & Storage Support Insights */}
      <InsightsPanel context="subsidy" />

      {/* Render Grouped Recommendations per Crop Profile */}
      {cropGroups.length > 0 ? (
        cropGroups.map((group, groupIdx) => {
          const cropItem = group.cropProfile;
          const cropAcres = cropItem.landSizeAcres || 2.5;

          return (
            <div key={cropItem.id || groupIdx} className="mb-8 border-b border-gray-200 pb-6">
              <div className="flex items-center gap-2 mb-3 bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200">
                <Sprout className="text-emerald-700 shrink-0" size={20} />
                <h3 className="text-sm font-bold text-emerald-950">
                  Recommendations for {cropItem.cropGrown || 'Crop'} ({cropItem.districtName || 'District'} - {cropAcres} Acres)
                </h3>
                <span className="ml-auto text-xs font-semibold px-2.5 py-1 bg-emerald-700 text-white rounded-full">
                  Crop Profile #{groupIdx + 1}
                </span>
              </div>

              {group.schemes.map((scheme, idx) => (
                <div key={scheme.id || idx} className="card rec-card mb-4">
                  <div className="rec-top">
                    <div>
                      <h4>{(isTa && scheme.nameTa) ? scheme.nameTa : scheme.name}</h4>
                      <div className="rec-meta">
                        <span className="badge badge-green">
                          {scheme.matchScore ? `${Math.round(scheme.matchScore)}% match` : 'High Match'}
                        </span>
                        <span className="badge badge-amber">
                          {cropItem.districtName || 'All Districts'}
                        </span>
                        <span className="badge badge-sky">
                          {cropItem.cropGrown || 'All Crops'}
                        </span>
                      </div>
                      {scheme.matchReasons && scheme.matchReasons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {scheme.matchReasons.map((reason, rIdx) => (
                            <span key={rIdx} className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-1">
                              ✓ {reason}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {scheme.subsidyAmount && (
                      <div className="rec-benefit">
                        <div className="l">{t('estBenefitLabel')}</div>
                        <div className="v">{scheme.subsidyAmount}</div>
                      </div>
                    )}
                  </div>
                  <p className="rec-desc">{(isTa && scheme.descriptionTa) ? scheme.descriptionTa : scheme.description}</p>
                  <div className="rec-actions">
                    <button
                      className="btn btn-emerald btn-sm cursor-pointer"
                      onClick={() => setShowOfficeIndex(showOfficeIndex === (groupIdx * 100 + idx) ? null : (groupIdx * 100 + idx))}
                    >
                      <FileText size={14} /> Application Guide & Offices
                    </button>
                  </div>

                  {showOfficeIndex === (groupIdx * 100 + idx) && (
                    <div className="mt-3 p-3 bg-emerald-50 rounded-xl text-xs space-y-2 border border-emerald-200 fade-in">
                      <p><strong>District Agriculture Office:</strong> {cropItem.districtName || 'Thanjavur'} Collectorate Complex</p>
                      <p><strong>Block Office:</strong> {cropItem.block || 'Central Block'} Agriculture Extension Centre</p>
                      <p><strong>Documents Required:</strong> Chitta/Adangal, Aadhaar Card, Bank Passbook, Passport Photo</p>
                      <div className="flex gap-2 pt-1">
                        <a
                          href="https://tntagrisnet.tn.gov.in"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-emerald btn-sm text-xs flex items-center gap-1"
                        >
                          <ExternalLink size={12} /> Apply on TN AG RISNET
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })
      ) : (
        /* Fallback single list if zero crops */
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3">{t('recommendedForYou')}</h3>
          {fallbackRecommended.map((scheme, idx) => (
            <div key={scheme.id || idx} className="card rec-card mb-4">
              <div className="rec-top">
                <div>
                  <h4>{(isTa && scheme.nameTa) ? scheme.nameTa : scheme.name}</h4>
                  <div className="rec-meta">
                    <span className="badge badge-green">
                      {scheme.matchScore ? `${Math.round(scheme.matchScore)}% match` : 'High Match'}
                    </span>
                  </div>
                </div>
                {scheme.subsidyAmount && (
                  <div className="rec-benefit">
                    <div className="l">{t('estBenefitLabel')}</div>
                    <div className="v">{scheme.subsidyAmount}</div>
                  </div>
                )}
              </div>
              <p className="rec-desc">{(isTa && scheme.descriptionTa) ? scheme.descriptionTa : scheme.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Catalogue toggle */}
      <div className="text-center my-6">
        <button className="btn btn-primary btn-md cursor-pointer" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Hide Full Catalogue' : `${t('viewAllSubsidyBtn')} (${allSchemes.length})`}
        </button>
      </div>

      {/* Full Catalogue Section */}
      {showAll && (
        <div className="mt-6 card p-5 fade-in">
          <h3 className="text-base font-bold mb-3">Complete Subsidy Scheme Catalogue</h3>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={t('searchSchemesPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{t('allCropsOption')}</option>
              <option value="Paddy">Paddy</option>
              <option value="Sugarcane">Sugarcane</option>
              <option value="Cotton">Cotton</option>
              <option value="Banana">Banana</option>
              <option value="Groundnut">Groundnut</option>
              <option value="Maize">Maize</option>
            </select>
          </div>

          <div className="space-y-3">
            {filteredSchemes.map((scheme) => (
              <div key={scheme.id} className="p-4 border border-gray-100 rounded-xl hover:border-emerald-200 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-bold text-gray-900">{(isTa && scheme.nameTa) ? scheme.nameTa : scheme.name}</h4>
                  {scheme.subsidyAmount && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      {scheme.subsidyAmount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-2">{(isTa && scheme.descriptionTa) ? scheme.descriptionTa : scheme.description}</p>
                <div className="flex gap-2 text-xs text-gray-500">
                  <span>🌾 {scheme.applicableCrops || 'All Crops'}</span>
                  <span>📍 {scheme.applicableDistricts || 'All Districts'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
