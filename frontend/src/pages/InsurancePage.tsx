import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { insuranceApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Info,
  Calculator,
  FileText,
  ExternalLink,
  MapPin,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';

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
}

export const InsurancePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';
  const { profile } = useAuth();

  const [recommendedSchemes, setRecommendedSchemes] = useState<InsuranceSchemeItem[]>([]);
  const [allSchemes, setAllSchemes] = useState<InsuranceSchemeItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [searchCrop, setSearchCrop] = useState('');
  const [showOffice, setShowOffice] = useState(false);

  // Form states for calculator
  const [crop, setCrop] = useState(profile?.cropGrown || 'Paddy');
  const [acres, setAcres] = useState<number>(profile?.landSizeHectares ? profile.landSizeHectares * 2.47 : 2.5);
  const [estimatedPremium, setEstimatedPremium] = useState<number>(2000);
  const [estimatedCoverage, setEstimatedCoverage] = useState<number>(100000);

  useEffect(() => {
    if (profile?.cropGrown) {
      setCrop(profile.cropGrown);
    }
    if (profile?.landSizeHectares) {
      setAcres(profile.landSizeHectares * 2.47);
    }
  }, [profile]);

  useEffect(() => {
    fetchRecommended();
    fetchAllSchemes();
  }, []);

  const fetchRecommended = async () => {
    try {
      const res = await insuranceApi.get<InsuranceSchemeItem[]>('/api/insurance/recommended');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setRecommendedSchemes(res.data);
        calculateEstimate(res.data[0].id, acres, crop);
      } else {
        fetchAllFallback();
      }
    } catch {
      fetchAllFallback();
    }
  };

  const fetchAllFallback = async () => {
    try {
      const res = await insuranceApi.get<InsuranceSchemeItem[]>('/api/insurance');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setRecommendedSchemes(res.data);
        calculateEstimate(res.data[0].id, acres, crop);
      }
    } catch {
      const fallbackList: InsuranceSchemeItem[] = [
        {
          id: 1,
          name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY) - Kharif',
          nameTa: 'பிரதம மந்திரி பயிர் காப்பீட்டு திட்டம் (PMFBY) - கார்/காரீஃப்',
          description: 'Yield-based crop insurance scheme covering crop loss due to non-preventable natural risks during Kharif season. Premium rate is 2% of sum insured.',
          descriptionTa: 'காரீஃப் பருவத்தில் இயற்கையான இடர்பாடுகளால் ஏற்படும் பயிர் இழப்பை ஈடுசெய்யும் விளைச்சல் சார்ந்த காப்பீட்டுத் திட்டம். பிரீமியம் விகிதம் 2%.',
          schemeType: 'YIELD_BASED',
          applicableCrops: 'Paddy, Maize, Millets, Pulses',
          applicableCropsTa: 'நெல், மக்காச்சோளம், சிறுதானியங்கள், பருப்பு வகைகள்',
          premiumRatePercentage: 2.0,
          sumInsuredPerAcre: 35000,
        },
      ];
      setRecommendedSchemes(fallbackList);
      calculateEstimate(1, acres, crop);
    }
  };

  const fetchAllSchemes = async (filterCrop?: string) => {
    try {
      const params = filterCrop ? { crop: filterCrop } : {};
      const res = await insuranceApi.get<InsuranceSchemeItem[]>('/api/insurance', { params });
      if (Array.isArray(res.data)) {
        setAllSchemes(res.data);
      }
    } catch {
      // Fallback list
      setAllSchemes([
        {
          id: 1,
          name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY) - Kharif',
          schemeType: 'YIELD_BASED',
          applicableCrops: 'Paddy, Maize, Millets, Pulses',
          premiumRatePercentage: 2.0,
          sumInsuredPerAcre: 35000,
        },
        {
          id: 2,
          name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY) - Rabi',
          schemeType: 'YIELD_BASED',
          applicableCrops: 'Wheat, Barley, Mustard, Pulses',
          premiumRatePercentage: 1.5,
          sumInsuredPerAcre: 30000,
        },
        {
          id: 3,
          name: 'Restructured Weather Based Crop Insurance Scheme (RWBCIS)',
          schemeType: 'WEATHER_BASED',
          applicableCrops: 'Cotton, Groundnut, Sugarcane',
          premiumRatePercentage: 5.0,
          sumInsuredPerAcre: 40000,
        },
        {
          id: 4,
          name: 'Unified Package Insurance Scheme (UPIS) - Revenue Guard',
          schemeType: 'REVENUE_BASED',
          applicableCrops: 'Banana, Mango, Turmeric, Potato, Ginger',
          premiumRatePercentage: 4.5,
          sumInsuredPerAcre: 55000,
        },
        {
          id: 5,
          name: 'Coconut Palm Insurance Scheme (CPIS)',
          schemeType: 'YIELD_BASED',
          applicableCrops: 'Coconut',
          premiumRatePercentage: 3.5,
          sumInsuredPerAcre: 50000,
        },
      ]);
    }
  };

  const calculateEstimate = async (schemeId: number, landAcres: number, cropName: string) => {
    try {
      const res = await insuranceApi.post('/api/insurance/estimate', {
        schemeId,
        landSizeAcres: landAcres,
        crop: cropName,
      });
      if (res.data) {
        setEstimatedCoverage(res.data.sumInsured);
        setEstimatedPremium(res.data.premiumEstimate);
      }
    } catch {
      // Fallback client calculation if backend estimate endpoint fails
      const currentScheme = recommendedSchemes.find((s) => s.id === schemeId) || recommendedSchemes[0];
      const sumPerAcre = currentScheme?.sumInsuredPerAcre || 40000;
      const rate = (currentScheme?.premiumRatePercentage || 2.0) / 100;
      const cov = landAcres * sumPerAcre;
      setEstimatedCoverage(cov);
      setEstimatedPremium(cov * rate);
    }
  };

  const handleAcresChange = (newAcres: number) => {
    setAcres(newAcres);
    const targetSchemeId = recommendedSchemes[0]?.id || 1;
    calculateEstimate(targetSchemeId, newAcres, crop);
  };

  const handleCropChange = (newCrop: string) => {
    setCrop(newCrop);
    const targetSchemeId = recommendedSchemes[0]?.id || 1;
    calculateEstimate(targetSchemeId, acres, newCrop);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchCrop(val);
    fetchAllSchemes(val);
  };

  const primaryScheme = recommendedSchemes[0];

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
            background: 'var(--sky-soft)',
            borderColor: 'var(--sky)',
            color: '#084b66',
          }}
        >
          <Info size={16} className="shrink-0" />
          <span>
            Insurance tailored for <b>{profile.fullName || profile.username}</b> ({profile.cropGrown || 'Paddy'}, {profile.landSizeHectares || 1.0} Ha registered)
          </span>
        </div>
      )}

      {/* Primary Recommended Scheme Card */}
      {primaryScheme ? (
        <div className="card rec-card">
          <div className="rec-top">
            <div>
              <h4>{(isTa && primaryScheme.nameTa) ? primaryScheme.nameTa : primaryScheme.name}</h4>
              <div className="rec-meta">
                <span className="badge badge-green">Recommended</span>
                <span className="badge badge-neutral">{primaryScheme.schemeType || 'YIELD_BASED'}</span>
              </div>
            </div>
            <div className="rec-benefit">
              <div className="l">{t('sumInsuredLabel')}</div>
              <div className="v">₹{primaryScheme.sumInsuredPerAcre?.toLocaleString('en-IN') || '40,000'}/ac</div>
            </div>
          </div>

          <p className="text-xs text-gray-600 mb-3">
            {(isTa && primaryScheme.descriptionTa) ? primaryScheme.descriptionTa : primaryScheme.description}
          </p>

          {/* Premium Calculator Panel */}
          <div className="calc-panel">
            <div className="hd">
              <Calculator size={14} />
              <span>{t('premiumCalculatorTitle')}</span>
            </div>

            <div className="field-row">
              <div className="field">
                <label>{t('cropLabel')}</label>
                <select value={crop} onChange={(e) => handleCropChange(e.target.value)}>
                  <option value="Paddy">Paddy</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Banana">Banana</option>
                </select>
              </div>
              <div className="field">
                <label>Land (Acres)</label>
                <input
                  type="number"
                  value={acres}
                  step="0.5"
                  onChange={(e) => handleAcresChange(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="calc-result-row">
              <div className="item">
                <div className="l">{t('estimatedPremiumLabel')}</div>
                <div className="v">₹{Math.round(estimatedPremium).toLocaleString('en-IN')}</div>
              </div>
              <div className="item">
                <div className="l">{t('estimatedCoverageLabel')}</div>
                <div className="v">₹{Math.round(estimatedCoverage).toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>

          {/* Required Documents */}
          <div className="rec-docs mt-3.5">
            <span className="doc-chip"><FileText size={13} />{t('docLandRecord')}</span>
            <span className="doc-chip"><FileText size={13} />{t('docSowingCert')}</span>
            <span className="doc-chip"><FileText size={13} />{t('docBankPassbook')}</span>
          </div>

          {/* Actions */}
          <div className="rec-actions">
            <button className="btn btn-primary btn-sm"><ExternalLink size={13} />{t('applyOnlineBtn')}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowOffice(!showOffice)}>
              <MapPin size={13} />{t('offlineOfficeBtn')}
            </button>
          </div>

          {showOffice && (
            <div className="office-box">
              <span><b>{profile?.districtName || 'District'} Agriculture Extension Office</b> · Custom Hiring & Insurance Cell</span>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-6 text-center text-sm text-gray-500">
          Loading insurance recommendations...
        </div>
      )}

      {/* View All Panel Toggle */}
      <div className="text-center my-5">
        <button className="btn btn-ghost" onClick={() => setShowAll(!showAll)}>
          {showAll
            ? t('hideCatalogueBtn')
            : (isTa ? `அனைத்து காப்பீட்டு திட்டங்களையும் காண்க (${allSchemes.length})` : `View All Insurance Schemes (${allSchemes.length})`)}{' '}
          {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {showAll && (
        <div className="fade-in space-y-3">
          <div className="filter-bar">
            <div className="search">
              <Search size={16} />
              <input
                placeholder={t('searchInsurancePlaceholder')}
                value={searchCrop}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          <div className="card p-2">
            {allSchemes.map((scheme, idx) => (
              <div
                key={scheme.id || idx}
                className="py-3 px-4 flex justify-between items-center text-sm border-b last:border-b-0"
              >
                <div>
                  <div className="font-semibold">{(isTa && scheme.nameTa) ? scheme.nameTa : scheme.name}</div>
                  <div className="text-xs text-gray-500">{(isTa && scheme.applicableCropsTa) ? scheme.applicableCropsTa : scheme.applicableCrops}</div>
                </div>
                <div className="text-right">
                  <span className="badge badge-neutral font-bold">{scheme.schemeType}</span>
                  <div className="text-xs text-emerald-700 font-semibold mt-1">
                    Premium: {scheme.premiumRatePercentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
