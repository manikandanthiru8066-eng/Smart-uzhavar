import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { insuranceApi } from '../api/client';
import {
  Info,
  Calculator,
  FileText,
  ExternalLink,
  MapPin,
  Map,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';

interface Scheme {
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

  const [recommendedSchemes, setRecommendedSchemes] = useState<Scheme[]>([]);
  const [allSchemes, setAllSchemes] = useState<Scheme[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [searchCrop, setSearchCrop] = useState('');
  const [showOffice, setShowOffice] = useState(false);

  // Form states for calculator
  const [crop, setCrop] = useState('Paddy');
  const [acres, setAcres] = useState<number>(2.5);
  const [season, setSeason] = useState('Kharif');
  const [estimatedPremium, setEstimatedPremium] = useState<number>(2000);
  const [estimatedCoverage, setEstimatedCoverage] = useState<number>(100000);

  useEffect(() => {
    fetchRecommended();
    fetchAllSchemes();
  }, []);

  const fetchRecommended = async () => {
    try {
      const res = await insuranceApi.get('/api/insurance/recommended');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setRecommendedSchemes(res.data);
      } else {
        setRecommendedSchemes([
          {
            id: 1,
            name: 'PMFBY — Paddy Coverage',
            nameTa: 'பிரதம மந்திரி பயிர் காப்பீட்டு திட்டம் (PMFBY) - கார்/காரீஃப்',
            description: 'Pradhan Mantri Fasal Bima Yojana',
            descriptionTa: 'காரீஃப் பருவத்தில் பயிர் இழப்பை ஈடுசெய்யும் விளைச்சல் சார்ந்த காப்பீட்டுத் திட்டம்.',
            schemeType: 'YIELD_BASED',
            applicableCrops: 'Paddy',
            applicableCropsTa: 'நெல்',
            premiumRatePercentage: 2.0,
            sumInsuredPerAcre: 40000,
          },
        ]);
      }
    } catch {
      setRecommendedSchemes([
        {
          id: 1,
          name: 'PMFBY — Paddy Coverage',
          nameTa: 'பிரதம மந்திரி பயிர் காப்பீட்டு திட்டம் (PMFBY) - கார்/காரீஃப்',
          description: 'Pradhan Mantri Fasal Bima Yojana',
          descriptionTa: 'காரீஃப் பருவத்தில் பயிர் இழப்பை ஈடுசெய்யும் விளைச்சல் சார்ந்த காப்பீட்டுத் திட்டம்.',
          schemeType: 'YIELD_BASED',
          applicableCrops: 'Paddy',
          applicableCropsTa: 'நெல்',
          premiumRatePercentage: 2.0,
          sumInsuredPerAcre: 40000,
        },
      ]);
    }
  };

  const fetchAllSchemes = async (cropFilter?: string) => {
    try {
      const params = cropFilter ? { crop: cropFilter } : {};
      const res = await insuranceApi.get('/api/insurance', { params });
      setAllSchemes(res.data);
    } catch {
      setAllSchemes([
        { id: 1, name: 'Coconut Palm Insurance Scheme', nameTa: 'தென்னை மர காப்பீட்டு திட்டம் (CPIS)', schemeType: 'Perennial' },
        { id: 2, name: 'Unified Package Insurance Scheme', nameTa: 'ஒருங்கிணைந்த தொகுப்பு காப்பீட்டு திட்டம் (UPIS)', schemeType: 'Multi-risk' },
        { id: 3, name: 'Weather Based Crop Insurance Scheme', nameTa: 'சீரமைக்கப்பட்ட வானிலை சார்ந்த பயிர் காப்பீட்டு திட்டம் (RWBCIS)', schemeType: 'Weather' },
      ]);
    }
  };

  const handleAcresChange = async (newAcres: number) => {
    setAcres(newAcres);
    const sumPerAcre = 40000;
    const rate = 0.02;
    const cov = newAcres * sumPerAcre;
    const prem = cov * rate;
    setEstimatedCoverage(cov);
    setEstimatedPremium(prem);

    try {
      await insuranceApi.post('/api/insurance/estimate', {
        schemeId: recommendedSchemes[0]?.id || 1,
        landSizeAcres: newAcres,
        crop: crop,
      });
    } catch {
      // API handles estimate calculation
    }
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

      <div
        className="card p-4 mb-5 flex items-center gap-3 text-xs"
        style={{
          background: 'var(--amber-soft)',
          borderColor: 'transparent',
          color: '#6b4f10',
        }}
      >
        <Info size={16} className="shrink-0" />
        <span>{t('noProfileNoteIns')}</span>
      </div>

      {/* Primary Recommended Scheme Card */}
      <div className="card rec-card">
        <div className="rec-top">
          <div>
            <h4>{(isTa && primaryScheme?.nameTa) ? primaryScheme.nameTa : (primaryScheme?.name || 'PMFBY — Paddy Coverage')}</h4>
            <div className="rec-meta">
              <span className="badge badge-green">92% match</span>
              <span className="badge badge-neutral">Agriculture Insurance Co. of India</span>
            </div>
          </div>
          <div className="rec-benefit">
            <div className="l">{t('sumInsuredLabel')}</div>
            <div className="v">₹40,000/ac</div>
          </div>
        </div>

        {/* Premium Calculator Panel */}
        <div className="calc-panel">
          <div className="hd">
            <Calculator size={14} />
            <span>{t('premiumCalculatorTitle')}</span>
          </div>

          <div className="field-row">
            <div className="field">
              <label>{t('cropLabel')}</label>
              <select value={crop} onChange={(e) => setCrop(e.target.value)}>
                <option value="Paddy">{isTa ? 'நெல் (Paddy)' : 'Paddy'}</option>
                <option value="Sugarcane">{isTa ? 'கரும்பு (Sugarcane)' : 'Sugarcane'}</option>
              </select>
            </div>
            <div className="field">
              <label>{t('acresLabel')}</label>
              <input
                type="number"
                value={acres}
                step="0.5"
                onChange={(e) => handleAcresChange(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="field">
              <label>{t('seasonLabel')}</label>
              <select value={season} onChange={(e) => setSeason(e.target.value)}>
                <option value="Kharif">{isTa ? 'கார்/காரீஃப் (Kharif)' : 'Kharif'}</option>
                <option value="Rabi">{isTa ? 'ரபி (Rabi)' : 'Rabi'}</option>
              </select>
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
          <span className="doc-chip">
            <FileText size={13} />
            {t('docLandRecord')}
          </span>
          <span className="doc-chip">
            <FileText size={13} />
            {t('docSowingCert')}
          </span>
          <span className="doc-chip">
            <FileText size={13} />
            {t('docBankPassbook')}
          </span>
        </div>

        {/* Actions */}
        <div className="rec-actions">
          <button className="btn btn-primary btn-sm">
            <ExternalLink size={13} />
            {t('applyOnlineBtn')}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowOffice(!showOffice)}
          >
            <MapPin size={13} />
            {t('offlineOfficeBtn')}
          </button>
        </div>

        {/* Offline Office Box */}
        {showOffice && (
          <div className="office-box">
            <span>
              <b>Thiruvaiyaru Agriculture Extension Office</b> · 3.2 km
            </span>
            <button className="btn btn-ghost btn-sm">
              <Map size={13} />
              {t('mapsBtn')}
            </button>
          </div>
        )}
      </div>

      {/* Secondary Scheme Card */}
      <div className="card rec-card">
        <div className="rec-top">
          <div>
            <h4>{isTa ? 'சீரமைக்கப்பட்ட வானிலை சார்ந்த பயிர் காப்பீட்டு திட்டம் (RWBCIS)' : 'Restructured Weather-Based Crop Insurance'}</h4>
            <div className="rec-meta">
              <span className="badge badge-neutral">{isTa ? 'மழைப்பொழிவு அடிப்படையில் இழப்பீடு' : 'Payout on rainfall trigger'}</span>
            </div>
          </div>
        </div>
        <div className="rec-actions">
          <button className="btn btn-primary btn-sm">
            <ExternalLink size={13} />
            {t('applyOnlineBtn')}
          </button>
        </div>
      </div>

      {/* View All Panel Toggle */}
      <div className="text-center my-5">
        <button
          className="btn btn-ghost"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? t('hideCatalogueBtn') : t('viewAllInsuranceBtn')}{' '}
          {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expandable All Schemes Panel */}
      {showAll && (
        <div className="fade-in">
          <div className="filter-bar">
            <div className="search">
              <Search />
              <input
                placeholder={t('searchInsurancePlaceholder')}
                value={searchCrop}
                onChange={handleSearchChange}
              />
            </div>
            <select>
              <option>{t('allCompaniesOption')}</option>
            </select>
            <select>
              <option>{t('allCropsOption')}</option>
            </select>
          </div>

          <div className="card p-2">
            {allSchemes.map((scheme, idx) => (
              <div
                key={scheme.id || idx}
                className="py-3 px-4 flex justify-between items-center text-sm border-b last:border-b-0"
                style={{ borderColor: 'var(--border)' }}
              >
                <span>{(isTa && scheme.nameTa) ? scheme.nameTa : scheme.name}</span>
                <span className="badge badge-neutral">
                  {scheme.schemeType || 'Standard'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
