import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { subsidyApi } from '../api/client';
import { useAuth, FarmerCropItem } from '../context/AuthContext';
import { Info, FileText, ExternalLink, Search, Sprout, MapPin, UserPlus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { NearestOfficeCard } from '../components/NearestOfficeCard';
import { normalizeSchemeUrl } from '../utils/schemeUtils';
import { getFallbackDistricts } from '../utils/districtData';

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
  sourceUrl?: string;
  matchScore?: number;
  matchReasons?: string[];
}

interface CropSubsidyGroup {
  cropProfile: FarmerCropItem;
  schemes: SubsidyItem[];
}

export const getValidSchemeUrl = normalizeSchemeUrl;

export const SubsidyPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();

  const [cropGroups, setCropGroups] = useState<CropSubsidyGroup[]>([]);
  const [districtSchemes, setDistrictSchemes] = useState<SubsidyItem[]>([]);
  const [chosenDistrict, setChosenDistrict] = useState<string>(() => {
    return profile?.crops?.[0]?.districtName || profile?.districtName || '';
  });
  const [districts, setDistricts] = useState<Array<{ id?: number; name: string }>>([]);
  const [allSchemes, setAllSchemes] = useState<SubsidyItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [showOfficeIndex, setShowOfficeIndex] = useState<number | null>(null);
  const [savingDistrict, setSavingDistrict] = useState(false);
  const [savedDistrictSuccess, setSavedDistrictSuccess] = useState(false);

  useEffect(() => {
    const initialDistrict = profile?.crops?.[0]?.districtName || profile?.districtName || '';
    setChosenDistrict(initialDistrict);
    fetchDistricts();
    fetchAllSchemes();
    fetchGroupedRecommendations();
    if (initialDistrict) {
      fetchDistrictSchemes(initialDistrict);
    }
  }, [profile]);

  const fetchDistricts = async () => {
    try {
      const res = await subsidyApi.get('/api/districts');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setDistricts(res.data);
      } else {
        setDistricts(getFallbackDistricts());
      }
    } catch {
      setDistricts(getFallbackDistricts());
    }
  };

  const fetchDistrictSchemes = async (distName: string) => {
    if (!distName) {
      setDistrictSchemes([]);
      return;
    }
    try {
      const res = await subsidyApi.get<SubsidyItem[]>('/api/subsidies', {
        params: { district: distName },
      });
      if (Array.isArray(res.data)) {
        setDistrictSchemes(res.data);
      }
    } catch {
      setDistrictSchemes([]);
    }
  };

  const handleDistrictSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setChosenDistrict(val);
    if (val) {
      fetchDistrictSchemes(val);
    } else {
      setDistrictSchemes([]);
    }
  };

  const handleSaveDistrict = async () => {
    if (!chosenDistrict || savingDistrict) return;
    setSavingDistrict(true);
    try {
      await updateProfile({ districtName: chosenDistrict });
      setSavedDistrictSuccess(true);
      setTimeout(() => setSavedDistrictSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save district:', err);
    } finally {
      setSavingDistrict(false);
    }
  };

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

      {/* Render Grouped Recommendations per Crop Profile */}
      {cropGroups.length > 0 ? (
        cropGroups.map((group, groupIdx) => {
          const cropItem = group.cropProfile;
          const cropAcres = cropItem.landSizeAcres || 2.5;

          return (
            <div key={cropItem.id || groupIdx} className="mb-8 border-b border-gray-200 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200">
                <div className="flex items-center gap-2">
                  <Sprout className="text-emerald-700 shrink-0" size={20} />
                  <h3 className="text-sm font-bold text-emerald-950">
                    Recommendations for {cropItem.cropGrown || 'Crop'} ({cropItem.districtName || 'District'} - {cropAcres} Acres)
                  </h3>
                </div>
                <span className="self-start sm:self-auto text-xs font-semibold px-2.5 py-1 bg-emerald-700 text-white rounded-full">
                  Crop Profile #{groupIdx + 1}
                </span>
              </div>

              {/* Nearest Agriculture Office Card */}
              <NearestOfficeCard
                blockId={cropItem.blockId}
                blockName={cropItem.block}
                districtName={cropItem.districtName}
              />

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
                      className="btn btn-primary btn-sm cursor-pointer"
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
                          href={getValidSchemeUrl(scheme.sourceUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm text-xs flex items-center gap-1"
                        >
                          <ExternalLink size={12} /> {scheme.sourceUrl ? `Official Scheme Portal` : `Apply on TN Agrisnet`}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })
      ) : !chosenDistrict ? (
        /* Empty District State - Prompt User to Choose District */
        <div className="card p-6 mb-8 border-2 border-emerald-200 bg-white rounded-2xl shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl shrink-0">
              <MapPin size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {isTa ? 'மானியத் திட்டங்களைக் காண உங்கள் மாவட்டத்தைத் தேர்வுசெய்யவும்' : 'Choose Your District to View Eligible Subsidies'}
              </h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {isTa
                  ? 'வேளாண் மானியங்கள் மற்றும் உதவி மையங்கள் உங்கள் மாவட்டத்தின் அடிப்படையில் வேறுபடுகின்றன. துல்லியமான மானியங்களை அறிய உங்கள் மாவட்டத்தைத் தேர்வுசெய்யவும்.'
                  : 'Agricultural subsidies and nearest extension offices depend on your district agro-climatic zone. Select your district to view applicable schemes.'}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <select
                value={chosenDistrict}
                onChange={handleDistrictSelect}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              >
                <option value="">{isTa ? '-- மாவட்டத்தைத் தேர்ந்தெடுக்கவும் --' : '-- Select Your District --'}</option>
                {(districts.length > 0 ? districts : getFallbackDistricts()).map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => navigate('/profile')}
              className="btn btn-primary btn-sm text-xs flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer py-2.5 px-4"
            >
              <UserPlus size={14} /> {isTa ? 'பயிர் விவரங்களை சேர்க்க' : 'Add Farm Crops'} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* District is chosen but no specific crop group yet */
        <div className="mb-6">
          <div className="p-4 mb-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-emerald-700 shrink-0" />
              <div>
                <span className="text-xs text-emerald-800 font-medium">Selected District:</span>
                <span className="ml-1.5 text-xs font-bold text-emerald-950">{chosenDistrict}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={chosenDistrict}
                onChange={handleDistrictSelect}
                className="px-2.5 py-1.5 border border-emerald-300 rounded-xl text-xs bg-white text-emerald-900 font-medium focus:outline-none"
              >
                {(districts.length > 0 ? districts : getFallbackDistricts()).map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleSaveDistrict}
                disabled={savingDistrict}
                className="btn btn-secondary btn-sm text-xs flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                {savedDistrictSuccess ? (
                  <>
                    <CheckCircle2 size={13} className="text-emerald-600" /> {isTa ? 'சேமிக்கப்பட்டது!' : 'Saved!'}
                  </>
                ) : (
                  <>
                    {savingDistrict ? 'Saving...' : (isTa ? 'சேமி' : 'Save to Profile')}
                  </>
                )}
              </button>
            </div>
          </div>

          <NearestOfficeCard
            blockId={profile?.blockId}
            blockName={profile?.block}
            districtName={chosenDistrict}
          />

          <h3 className="text-sm font-semibold mb-3">
            {isTa ? `${chosenDistrict} மாவட்டத்திற்கான மானியத் திட்டங்கள்` : `Subsidies for ${chosenDistrict} District`}
          </h3>

          {districtSchemes.length > 0 ? (
            districtSchemes.map((scheme, idx) => (
              <div key={scheme.id || idx} className="card rec-card mb-4">
                <div className="rec-top">
                  <div>
                    <h4>{(isTa && scheme.nameTa) ? scheme.nameTa : scheme.name}</h4>
                    <div className="rec-meta">
                      <span className="badge badge-amber">{chosenDistrict}</span>
                      {scheme.applicableCrops && (
                        <span className="badge badge-sky">{scheme.applicableCrops}</span>
                      )}
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
                <div className="flex gap-2 pt-2">
                  <a
                    href={getValidSchemeUrl(scheme.sourceUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm text-xs flex items-center gap-1 inline-flex"
                  >
                    <ExternalLink size={12} /> {scheme.sourceUrl ? 'Official Scheme Portal' : 'Apply on TN Agrisnet'}
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="card p-6 text-center text-xs text-gray-500 mb-4 border border-dashed border-gray-200">
              <p>No district-specific subsidy programs currently listed for {chosenDistrict}.</p>
              <p className="mt-1">You can explore state-wide Tamil Nadu agricultural subsidies below.</p>
            </div>
          )}
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
                <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
                  <div className="flex gap-2">
                    <span>🌾 {scheme.applicableCrops || 'All Crops'}</span>
                    <span>📍 {scheme.applicableDistricts || 'All Districts'}</span>
                  </div>
                  <a
                    href={getValidSchemeUrl(scheme.sourceUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline ml-auto"
                  >
                    <ExternalLink size={11} /> {scheme.sourceUrl ? 'Official Portal' : 'Apply on TN Agrisnet'}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
