import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, FarmerCropItem } from '../context/AuthContext';
import {
  generateCropInsights,
  InsightCardData,
  DistrictCropStatItem,
} from '../utils/insightsEngine';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Sprout,
  Warehouse,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface InsightsPanelProps {
  context?: 'dashboard' | 'subsidy' | 'insurance';
  districtCropStats?: DistrictCropStatItem[];
  defaultDistrict?: string;
  className?: string;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  context = 'dashboard',
  districtCropStats = [],
  defaultDistrict,
  className = '',
}) => {
  const { i18n } = useTranslation();
  const isTa = i18n.language === 'ta';
  const navigate = useNavigate();
  const { profile } = useAuth();

  const crops: FarmerCropItem[] = Array.isArray(profile?.crops) && profile.crops.length > 0
    ? profile.crops
    : [];

  const [selectedCropIndex, setSelectedCropIndex] = useState<number>(0);

  // Active crop profile selected or fallback
  const activeCrop: FarmerCropItem | undefined = crops[selectedCropIndex] || crops[0];

  const currentCropGrown = activeCrop?.cropGrown || profile?.cropGrown || 'Paddy';
  const currentSeason = activeCrop?.season || profile?.season || 'Kharif';
  const currentDistrict = activeCrop?.districtName || profile?.districtName || defaultDistrict || 'Thanjavur';

  // Generate actionable insights
  const insights: InsightCardData[] = generateCropInsights({
    cropGrown: currentCropGrown,
    season: currentSeason,
    districtName: currentDistrict,
    districtCropStats,
    context,
  });

  const getCardIcon = (type: InsightCardData['type']) => {
    switch (type) {
      case 'yield_benchmark':
        return <TrendingUp className="text-emerald-500 shrink-0" size={20} />;
      case 'seasonal_advisory':
        return <Sprout className="text-amber-500 shrink-0" size={20} />;
      case 'storage_postharvest':
        return <Warehouse className="text-sky-500 shrink-0" size={20} />;
      case 'scheme_support':
        return <ShieldCheck className="text-emerald-600 shrink-0" size={20} />;
      default:
        return <Sparkles className="text-emerald-500 shrink-0" size={20} />;
    }
  };

  const getBadgeClass = (badgeType: InsightCardData['badgeType']) => {
    switch (badgeType) {
      case 'data':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800';
      case 'guidance':
        return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800';
      case 'support':
        return 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className={`insights-panel-container mb-6 ${className}`}>
      {/* Header Bar */}
      <div className="card p-5 rounded-2xl border border-emerald-700/30 bg-gradient-to-br from-emerald-900/10 via-surface to-surface-2 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Sparkles size={18} />
              </span>
              <h3 className="text-base font-bold tracking-tight text-ink font-display">
                {isTa ? 'செயல்பாட்டு நுண்ணறிவு மற்றும் பரிந்துரைகள்' : 'Insights & Recommendations'}
              </h3>
            </div>
            <p className="text-xs text-ink-soft mt-1">
              {isTa
                ? `${currentDistrict} · ${currentCropGrown} (${currentSeason}) பயிருக்கான தனிப்பயனாக்கப்பட்ட வேளாண் வழிகாட்டுதல்`
                : `Actionable agronomic advisories tailored to ${currentCropGrown} (${currentSeason}) in ${currentDistrict}`}
            </p>
          </div>

          {/* Multi-Crop Profile Switcher Pills */}
          {crops.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-ink-soft mr-1">
                {isTa ? 'பயிர் தேர்வு:' : 'Active Crop:'}
              </span>
              {crops.map((c, idx) => {
                const isSelected = idx === selectedCropIndex;
                return (
                  <button
                    key={c.id || idx}
                    type="button"
                    onClick={() => setSelectedCropIndex(idx)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-semibold'
                        : 'bg-surface hover:bg-surface-2 text-ink-soft border-border'
                    }`}
                  >
                    🌾 {c.cropGrown || `Crop ${idx + 1}`} ({c.districtName || 'TN'})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2-4 Actionable Insight Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((card) => {
            return (
              <div
                key={card.id}
                className="card flex flex-col justify-between p-4 rounded-xl border border-border/80 hover:border-emerald-500/40 bg-surface transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div>
                  {/* Card Header with Badges */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      {getCardIcon(card.type)}
                      <h4 className="font-bold text-sm text-ink leading-snug">
                        {isTa ? card.titleTa : card.title}
                      </h4>
                    </div>
                  </div>

                  {/* Provenance Badge & Citation */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span
                      className={`text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full border uppercase ${getBadgeClass(
                        card.badgeType
                      )}`}
                    >
                      {isTa ? card.badgeTextTa : card.badgeText}
                    </span>

                    {card.sourceCitation && (
                      <span className="text-[11px] text-ink-faint flex items-center gap-1">
                        <Info size={12} className="text-amber-500" />
                        {card.sourceCitation}
                      </span>
                    )}
                  </div>

                  {/* Key Metric Highlight Box (if present) */}
                  {card.keyMetric && (
                    <div className="bg-surface-2/80 border border-border/60 rounded-lg p-2.5 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-ink-soft">
                          {isTa ? card.keyMetric.labelTa : card.keyMetric.label}
                        </span>
                        <span className="font-bold font-mono text-sm text-ink">
                          {card.keyMetric.value}
                        </span>
                      </div>
                      {card.keyMetric.comparisonText && (
                        <div
                          className={`text-[11px] font-medium mt-1 flex items-center gap-1 ${
                            card.keyMetric.isPositive !== false
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {card.keyMetric.isPositive !== false ? (
                            <TrendingUp size={13} />
                          ) : (
                            <TrendingDown size={13} />
                          )}
                          <span>
                            {isTa
                              ? card.keyMetric.comparisonTextTa || card.keyMetric.comparisonText
                              : card.keyMetric.comparisonText}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content / Advisory Text */}
                  <p className="text-xs text-ink-soft leading-relaxed mb-3">
                    {isTa ? card.contentTa : card.content}
                  </p>

                  {/* Preventive Steps list (if present) */}
                  {card.preventiveSteps && card.preventiveSteps.length > 0 && (
                    <div className="space-y-1.5 mb-3 bg-surface-2/50 p-2.5 rounded-lg border border-border/40">
                      {(isTa && card.preventiveStepsTa
                        ? card.preventiveStepsTa
                        : card.preventiveSteps
                      ).map((step, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-1.5 text-[11px] text-ink-soft">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Action / Scheme Link Footer */}
                {card.relevantSchemeLink && (
                  <div className="pt-2 border-t border-border/60 mt-auto flex items-center justify-between">
                    <div className="text-[11px] font-medium text-ink-soft truncate max-w-[65%]">
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        {isTa ? 'தொடர்புடைய ஆதரவு:' : 'Relevant Support:'}
                      </span>{' '}
                      <span className="text-ink">
                        {isTa
                          ? card.relevantSchemeLink.nameTa
                          : card.relevantSchemeLink.name}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(card.relevantSchemeLink!.route)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      <span>
                        {isTa
                          ? card.relevantSchemeLink.actionLabelTa
                          : card.relevantSchemeLink.actionLabel}
                      </span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Global Footer Provenance Note */}
        <div className="mt-3 pt-2.5 border-t border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-ink-faint gap-1">
          <div className="flex items-center gap-1.5">
            <Info size={13} className="text-emerald-600" />
            <span>
              {isTa
                ? 'விளைச்சல் ஒப்பீடுகள் மாவட்ட கள புள்ளிவிவரங்கள் அடிப்படையில் கணக்கிடப்படுகின்றன; பருவ மற்றும் சேமிப்பு வழிகாட்டல்கள் தமிழ்நாடு வேளாண்மைப் பல்கலைக்கழக (TNAU) விரிவாக்க கையேடுகளிலிருந்து தொகுக்கப்பட்டவை.'
                : 'Yield benchmarks derived from district agricultural records; agronomy and storage protocols sourced from TNAU Agritech Portal extension guidelines.'}
            </span>
          </div>
          <a
            href="https://agritech.tnau.ac.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-700 hover:underline dark:text-emerald-400 shrink-0 font-medium"
          >
            <span>agritech.tnau.ac.in</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </div>
  );
};
