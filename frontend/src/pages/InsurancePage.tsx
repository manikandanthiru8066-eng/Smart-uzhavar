import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { insuranceApi } from '../api/client';
import { useAuth, FarmerCropItem } from '../context/AuthContext';
import {
  Info,
  Calculator,
  FileText,
  ExternalLink,
  MapPin,
  Search,
  Sprout,
  UserPlus,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { NearestOfficeCard } from '../components/NearestOfficeCard';
import { DistrictItem, getFallbackDistricts } from '../utils/districtData';

interface InsuranceSchemeItem {
  id: number;
  name: string;
  nameTa?: string;
  description?: string;
  descriptionTa?: string;
  schemeType?: string;
  applicableCrops?: string;
  applicableCropsTa?: string;
  premiumRatePercentage?: number;
  sumInsuredPerAcre?: number;
  matchScore?: number;
  matchReasons?: string[];
}


interface CropInsuranceGroup {
  cropProfile: FarmerCropItem;
  schemes: InsuranceSchemeItem[];
}

export const InsurancePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();

  const [cropGroups, setCropGroups] = useState<CropInsuranceGroup[]>([]);
  const [chosenDistrict, setChosenDistrict] = useState<string>(() => {
    return profile?.crops?.[0]?.districtName || profile?.districtName || '';
  });
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [savingDistrict, setSavingDistrict] = useState(false);
  const [savedDistrictSuccess, setSavedDistrictSuccess] = useState(false);
  const [fallbackSchemes, setFallbackSchemes] = useState<InsuranceSchemeItem[]>([]);
  const [allSchemes, setAllSchemes] = useState<InsuranceSchemeItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [searchCrop, setSearchCrop] = useState('');
  const [showOffice, setShowOffice] = useState(false);

  // Form states for calculator
  const [selectedSchemeId, setSelectedSchemeId] = useState<number>(1);
  const [calcAcres, setCalcAcres] = useState<number>(2.5);
  const [calcCrop, setCalcCrop] = useState<string>('Paddy');
  const [estimatedPremium, setEstimatedPremium] = useState<number>(2000);
  const [estimatedCoverage, setEstimatedCoverage] = useState<number>(100000);

  useEffect(() => {
    const initialDistrict = profile?.crops?.[0]?.districtName || profile?.districtName || '';
    setChosenDistrict(initialDistrict);
    fetchDistricts();
    fetchGroupedInsurance();
    fetchAllSchemes();
  }, [profile]);

  const fetchDistricts = async () => {
    try {
      const res = await insuranceApi.get<DistrictItem[]>('/api/districts');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setDistricts(res.data);
      } else {
        setDistricts(getFallbackDistricts());
      }
    } catch {
      setDistricts(getFallbackDistricts());
    }
  };

  const handleDistrictSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setChosenDistrict(val);
    if (val && fallbackSchemes.length > 0) {
      calculateEstimate(selectedSchemeId, calcAcres, calcCrop);
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
      console.error('Failed to save district in insurance page:', err);
    } finally {
      setSavingDistrict(false);
    }
  };

  const fetchGroupedInsurance = async () => {
    const crops: FarmerCropItem[] = Array.isArray(profile?.crops) ? profile.crops : [];

    if (crops.length > 0) {
      try {
        const groups: CropInsuranceGroup[] = [];
        for (const cropItem of crops) {
          if (cropItem.id) {
            const res = await insuranceApi.get<InsuranceSchemeItem[]>(`/api/insurance/recommended?cropProfileId=${cropItem.id}`);
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
          const firstCrop = crops[0];
          setCalcCrop(firstCrop.cropGrown || 'Paddy');
          setCalcAcres(firstCrop.landSizeAcres || 2.5);
          if (groups[0].schemes.length > 0) {
            calculateEstimate(groups[0].schemes[0].id, firstCrop.landSizeAcres || 2.5, firstCrop.cropGrown || 'Paddy');
          }
          return;
        }
      } catch (err) {
        console.error('[InsurancePage] Error fetching per-crop insurance recommendations:', err);
      }
    }

    fetchFallbackRecommended();
  };

  const fetchFallbackRecommended = async () => {
    try {
      const res = await insuranceApi.get<InsuranceSchemeItem[]>('/api/insurance/recommended');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setFallbackSchemes(res.data);
        calculateEstimate(res.data[0].id, calcAcres, calcCrop);
      } else {
        const allRes = await insuranceApi.get<InsuranceSchemeItem[]>('/api/insurance');
        if (Array.isArray(allRes.data) && allRes.data.length > 0) {
          setFallbackSchemes(allRes.data);
          calculateEstimate(allRes.data[0].id, calcAcres, calcCrop);
        }
      }
    } catch {
      const fallbackList: InsuranceSchemeItem[] = [
        {
          id: 1,
          name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY) - Kharif',
          nameTa: 'பிரதம மந்திரி பயிர் காப்பீட்டு திட்டம் (PMFBY) - காரீஃப்',
          description: 'Yield-based crop insurance scheme covering crop loss due to non-preventable natural risks during Kharif season. Premium rate is 2% of sum insured.',
          descriptionTa: 'காரீஃப் பருவத்தில் இயற்கையான இடர்பாடுகளால் ஏற்படும் பயிர் இழப்பை ஈடுசெய்யும் விளைச்சல் சார்ந்த காப்பீட்டுத் திட்டம்.',
          schemeType: 'YIELD_BASED',
          applicableCrops: 'Paddy, Maize, Millets, Pulses',
          premiumRatePercentage: 2.0,
          sumInsuredPerAcre: 35000,
        },
      ];
      setFallbackSchemes(fallbackList);
      calculateEstimate(1, calcAcres, calcCrop);
    }
  };

  const fetchAllSchemes = async () => {
    try {
      const res = await insuranceApi.get<InsuranceSchemeItem[]>('/api/insurance');
      if (Array.isArray(res.data)) {
        setAllSchemes(res.data);
      }
    } catch {
      // Fallback
    }
  };

  const calculateEstimate = (schemeId: number, numAcres: number, cropName: string) => {
    const scheme = [...allSchemes, ...fallbackSchemes].find((s) => s.id === schemeId) || {
      premiumRatePercentage: 2.0,
      sumInsuredPerAcre: 35000,
    };
    const rate = scheme.premiumRatePercentage || 2.0;
    const sumPerAcre = scheme.sumInsuredPerAcre || 35000;
    const coverage = numAcres * sumPerAcre;
    const premium = (coverage * rate) / 100;

    setEstimatedCoverage(coverage);
    setEstimatedPremium(premium);
  };

  const handleAcresChange = (val: number) => {
    setCalcAcres(val);
    calculateEstimate(selectedSchemeId, val, calcCrop);
  };

  const filteredCatalogue = allSchemes.filter((item) => {
    if (!searchCrop) return true;
    return item.applicableCrops?.toLowerCase().includes(searchCrop.toLowerCase());
  });

  return (
    <div className="page-view fade-in">
      <div className="page-hd">
        <h1>{t('insurancePageTitle')}</h1>
        <p>{t('insurancePageSub')}</p>
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
                    Insurance Recommendations for {cropItem.cropGrown || 'Crop'} ({cropItem.districtName || 'District'} - {cropAcres} Acres)
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
                <div key={scheme.id || idx} className="card ins-card mb-4">
                  <div className="ins-top flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-base font-bold text-gray-900 leading-snug">
                        {(isTa && scheme.nameTa) ? scheme.nameTa : scheme.name}
                      </h4>
                      <div className="ins-meta mt-2 flex flex-wrap items-center gap-2">
                        <span className="badge badge-sky">{scheme.schemeType?.replace('_', ' ') || 'YIELD_BASED'}</span>
                        <span className="badge badge-amber">📍 {cropItem.districtName || 'District'}</span>
                        <span className="badge badge-green">🌾 {cropItem.cropGrown || 'Crop'}</span>
                      </div>
                      {scheme.matchReasons && scheme.matchReasons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {scheme.matchReasons.map((reason, rIdx) => (
                            <span key={rIdx} className="px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-lg flex items-center gap-1">
                              ✓ {reason}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0 bg-emerald-50/80 border border-emerald-200/70 px-3.5 py-2 rounded-xl text-left sm:text-right">
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 opacity-80">Premium Rate</div>
                        <div className="text-sm font-extrabold text-emerald-950">
                          {scheme.premiumRatePercentage ? `${scheme.premiumRatePercentage}%` : '2.0%'}
                        </div>
                      </div>
                      {scheme.sumInsuredPerAcre && (
                        <div className="border-l border-emerald-200 pl-3">
                          <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 opacity-80">Sum Insured / Acre</div>
                          <div className="text-sm font-extrabold text-emerald-950">
                            ₹{scheme.sumInsuredPerAcre.toLocaleString('en-IN')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="ins-desc">
                    {(isTa && scheme.descriptionTa) ? scheme.descriptionTa : scheme.description}
                  </p>

                  <div className="ins-footer">
                    <span className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                      <span>🌾</span> <strong>Crops Covered:</strong> {scheme.applicableCrops || cropItem.cropGrown || 'All Crops'}
                    </span>
                    <button
                      className="btn btn-ghost btn-sm text-xs font-semibold text-emerald-800 border border-emerald-200 hover:bg-emerald-50 flex items-center gap-1.5"
                      onClick={() => {
                        if (scheme.id) {
                          setSelectedSchemeId(scheme.id);
                          calculateEstimate(scheme.id, cropItem.landSizeAcres || calcAcres, cropItem.cropGrown || calcCrop);
                          document.getElementById('calculator-section')?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      <Calculator size={14} /> Calculate Premium
                    </button>
                  </div>
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
                {isTa ? 'பயிர் காப்பீட்டுத் திட்டங்களைக் காண உங்கள் மாவட்டத்தைத் தேர்வுசெய்யவும்' : 'Choose Your District to View Crop Insurance'}
              </h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {isTa
                  ? 'PMFBY மற்றும் தமிழக அரசின் பயிர் காப்பீட்டு திட்டங்களின் கீழ் காப்பீட்டுக் கட்டணம், அறிவிக்கப்பட்ட பயிர்கள் மற்றும் காப்பீட்டு நிறுவனங்கள் மாவட்டத்திற்கு மாவட்டம் மாறுபடும். உங்கள் மாவட்டத்தைத் தேர்வு செய்யவும்.'
                  : 'Under PMFBY and Tamil Nadu Crop Insurance, notified crops, premium rates, and implementing insurance companies vary by district. Please select your district.'}
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

          <h3 className="text-sm font-bold text-gray-800 mb-3.5 uppercase tracking-wider">
            {isTa ? `${chosenDistrict} மாவட்டத்திற்கான பயிர் காப்பீட்டுத் திட்டங்கள்` : `Recommended Insurance Schemes for ${chosenDistrict}`}
          </h3>
          {fallbackSchemes.map((scheme, idx) => (
            <div key={scheme.id || idx} className="card ins-card mb-4">
              <div className="ins-top flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-base font-bold text-gray-900 leading-snug">
                    {(isTa && scheme.nameTa) ? scheme.nameTa : scheme.name}
                  </h4>
                  <div className="ins-meta mt-2 flex flex-wrap items-center gap-2">
                    <span className="badge badge-sky">{scheme.schemeType?.replace('_', ' ') || 'YIELD_BASED'}</span>
                    <span className="badge badge-amber">📍 {chosenDistrict}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 bg-emerald-50/80 border border-emerald-200/70 px-3.5 py-2 rounded-xl text-right">
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 opacity-80">Premium Rate</div>
                    <div className="text-sm font-extrabold text-emerald-950">
                      {scheme.premiumRatePercentage ? `${scheme.premiumRatePercentage}%` : '2.0%'}
                    </div>
                  </div>
                  {scheme.sumInsuredPerAcre && (
                    <div className="border-l border-emerald-200 pl-3">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 opacity-80">Sum Insured / Acre</div>
                      <div className="text-sm font-extrabold text-emerald-950">
                        ₹{scheme.sumInsuredPerAcre.toLocaleString('en-IN')}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <p className="ins-desc">
                {(isTa && scheme.descriptionTa) ? scheme.descriptionTa : scheme.description}
              </p>

              <div className="ins-footer">
                <span className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                  <span>🌾</span> <strong>Crops Covered:</strong> {scheme.applicableCrops || 'All Crops'}
                </span>
                <button
                  className="btn btn-ghost btn-sm text-xs font-semibold text-emerald-800 border border-emerald-200 hover:bg-emerald-50 flex items-center gap-1.5"
                  onClick={() => {
                    if (scheme.id) {
                      setSelectedSchemeId(scheme.id);
                      calculateEstimate(scheme.id, calcAcres, calcCrop);
                      document.getElementById('calculator-section')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <Calculator size={14} /> Calculate Premium
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Premium Calculator Card */}
      <div id="calculator-section" className="card calc-card mb-6">

        <div className="flex items-center gap-2 mb-3">
          <Calculator className="text-emerald-700" size={20} />
          <h3 className="text-sm font-bold text-gray-900">{t('premiumCalculatorTitle')}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{t('cropLabel')}</label>
            <select
              value={calcCrop}
              onChange={(e) => setCalcCrop(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Paddy">Paddy</option>
              <option value="Sugarcane">Sugarcane</option>
              <option value="Cotton">Cotton</option>
              <option value="Banana">Banana</option>
              <option value="Groundnut">Groundnut</option>
              <option value="Maize">Maize</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{t('acresLabel')}</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={calcAcres}
              onChange={(e) => handleAcresChange(parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Scheme</label>
            <select
              value={selectedSchemeId}
              onChange={(e) => {
                const sid = parseInt(e.target.value);
                setSelectedSchemeId(sid);
                calculateEstimate(sid, calcAcres, calcCrop);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {allSchemes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
          <div>
            <div className="text-xs font-semibold text-emerald-800">{t('estimatedPremiumLabel')}</div>
            <div className="text-xl font-bold text-emerald-950">₹{estimatedPremium.toLocaleString('en-IN')}</div>
            <div className="text-xs text-gray-500">2.0% Farmer Premium Rate</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-800">{t('estimatedCoverageLabel')}</div>
            <div className="text-xl font-bold text-emerald-950">₹{estimatedCoverage.toLocaleString('en-IN')}</div>
            <div className="text-xs text-gray-500">Total Sum Insured</div>
          </div>
        </div>
      </div>

      {/* Catalogue toggle */}
      <div className="text-center my-6">
        <button className="btn btn-primary btn-md cursor-pointer" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Hide Full Catalogue' : `${t('viewAllInsuranceBtn')}`}
        </button>
      </div>

      {/* Full Catalogue Section */}
      {showAll && (
        <div className="mt-6 card p-5 fade-in">
          <h3 className="text-base font-bold mb-3">Complete Insurance Policy Catalogue</h3>
          <div className="space-y-3">
            {filteredCatalogue.map((scheme) => (
              <div key={scheme.id} className="p-4 border border-gray-100 rounded-xl hover:border-emerald-200 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-bold text-gray-900">{(isTa && scheme.nameTa) ? scheme.nameTa : scheme.name}</h4>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    {scheme.premiumRatePercentage}% Premium Rate
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{(isTa && scheme.descriptionTa) ? scheme.descriptionTa : scheme.description}</p>
                <div className="text-xs text-gray-500">
                  <span>🌾 {scheme.applicableCrops || 'All Crops'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
