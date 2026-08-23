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
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  UserPlus,
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

  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});
  const [selectedCropIndex, setSelectedCropIndex] = useState<number>(0);

  const crops: FarmerCropItem[] = Array.isArray(profile?.crops) && profile.crops.length > 0
    ? profile.crops
    : [];

  // Active crop profile selected or fallback from profile fields
  const activeCrop: FarmerCropItem | undefined = crops[selectedCropIndex] || crops[0];

  const currentCropGrown = activeCrop?.cropGrown || profile?.cropGrown;
  const currentSeason = activeCrop?.season || profile?.season || 'Kharif';
  const currentDistrict = activeCrop?.districtName || profile?.districtName;

  // Requirement 1: Guard when no profile/district has been configured yet
  const hasConfiguredProfile = Boolean(
    (crops.length > 0 && currentDistrict && currentCropGrown) ||
    (profile?.districtName && (profile?.cropGrown || crops.length > 0))
  );

  if (!hasConfiguredProfile) {
    return (
      <div className={`insights-panel-container mb-6 ${className}`}>
        <div className="card p-6 rounded-2xl border border-dashed border-emerald-600/40 bg-surface-2/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink font-display">
                {isTa
                  ? 'உங்கள் மாவட்டத்திற்கான வேளாண் நுண்ணறிவுகளைக் காண சுயவிவரத்தை பூர்த்தி செய்யவும்'
                  : 'Complete your profile to see personalized insights for your district'}
              </h3>
              <p className="text-xs text-ink-soft mt-0.5">
                {isTa
                  ? 'உங்கள் மாவட்டம் மற்றும் பயிர் விவரங்களை சேர்த்தால் உள்ளூர் விளைச்சல் ஒப்பீடு மற்றும் TNAU வழிகாட்டல்கள் கிடைக்கும்.'
                  : 'Add your district, crop, and season to unlock district-specific yield benchmarks and TNAU agronomy guidance.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="btn btn-primary btn-sm whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <UserPlus size={15} />
            <span>{isTa ? 'சுயவிவரத்தை பூர்த்தி செய்க' : 'Complete Profile'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // Generate actionable insights strictly for this farmer's crop and district
  const insights: InsightCardData[] = generateCropInsights({
    cropGrown: currentCropGrown,
    season: currentSeason,
    districtName: currentDistrict,
    districtCropStats,
    context,
  });

  if (insights.length === 0) {
    return null;
  }

  const toggleExpand = (id: string) => {
    setExpandedCardIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getCardIcon = (type: InsightCardData['type']) => {
    switch (type) {
      case 'yield_benchmark':
        return <TrendingUp className="text-emerald-500 shrink-0" size={18} />;
      case 'seasonal_advisory':
        return <Sprout className="text-amber-500 shrink-0" size={18} />;
      case 'storage_postharvest':
        return <Warehouse className="text-sky-500 shrink-0" size={18} />;
      case 'scheme_support':
        return <ShieldCheck className="text-emerald-600 shrink-0" size={18} />;
      default:
        return <Sparkles className="text-emerald-500 shrink-0" size={18} />;
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
      {/* Header Container */}
      <div className="card p-4 sm:p-5 rounded-2xl border border-emerald-700/30 bg-gradient-to-br from-emerald-900/10 via-surface to-surface-2 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Sparkles size={17} />
              </span>
              <h3 className="text-base font-bold tracking-tight text-ink font-display">
                {isTa ? 'செயல்பாட்டு நுண்ணறிவு மற்றும் பரிந்துரைகள்' : 'Insights & Recommendations'}
              </h3>
            </div>
            <p className="text-xs text-ink-soft mt-0.5">
              {isTa
                ? `${currentDistrict} · ${currentCropGrown} (${currentSeason}) பயிருக்கான தனிப்பயனாக்கப்பட்ட வழிகாட்டுதல்`
                : `Tailored advisory for ${currentCropGrown} (${currentSeason}) in ${currentDistrict}`}
            </p>
          </div>

          {/* Multi-Crop Profile Switcher */}
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
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium transition-all cursor-pointer border ${
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

        {/* 2-4 Crisp Insight Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {insights.map((card) => {
            const isExpanded = Boolean(expandedCardIds[card.id]);

            return (
              <div
                key={card.id}
                className="card flex flex-col justify-between p-3.5 sm:p-4 rounded-xl border border-border/80 hover:border-emerald-500/40 bg-surface transition-all duration-200 shadow-sm"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {getCardIcon(card.type)}
                      <h4 className="font-bold text-sm text-ink leading-snug">
                        {isTa ? card.titleTa : card.title}
                      </h4>
                    </div>
                  </div>

                  {/* Provenance Badge & Citation */}
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    <span
                      className={`text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full border uppercase ${getBadgeClass(
                        card.badgeType
                      )}`}
                    >
                      {isTa ? card.badgeTextTa : card.badgeText}
                    </span>

                    {card.sourceCitation && (
                      <span className="text-[11px] text-ink-faint flex items-center gap-1">
                        <Info size={11} className="text-amber-500" />
                        {card.sourceCitation}
                      </span>
                    )}
                  </div>

                  {/* Single Short Plain Sentence (Under 15 words) */}
                  <p className="text-xs font-medium text-ink leading-relaxed mb-2.5">
                    {isTa ? card.shortSummaryTa : card.shortSummary}
                  </p>

                  {/* Key Metric Pill (if present) */}
                  {card.keyMetric && (
                    <div className="bg-surface-2/80 border border-border/60 rounded-lg px-2.5 py-1.5 mb-2.5 flex items-center justify-between text-xs">
                      <span className="text-ink-soft text-[11px]">
                        {isTa ? card.keyMetric.labelTa : card.keyMetric.label}:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-ink">
                          {card.keyMetric.value}
                        </span>
                        {card.keyMetric.comparisonText && (
                          <span
                            className={`text-[11px] font-semibold flex items-center gap-0.5 ${
                              card.keyMetric.isPositive !== false
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {card.keyMetric.isPositive !== false ? (
                              <TrendingUp size={12} />
                            ) : (
                              <TrendingDown size={12} />
                            )}
                            <span>
                              {isTa
                                ? card.keyMetric.comparisonTextTa || card.keyMetric.comparisonText
                                : card.keyMetric.comparisonText}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Expandable "Learn more" details */}
                  {(card.detailedExplanation || (card.preventiveSteps && card.preventiveSteps.length > 0)) && (
                    <div className="mb-2">
                      <button
                        type="button"
                        onClick={() => toggleExpand(card.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        <span>{isExpanded ? (isTa ? 'சுருக்க' : 'Hide details') : (isTa ? 'மேலும் அறிய' : 'Learn more')}</span>
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-2.5 rounded-lg bg-surface-2/70 border border-border/60 text-xs text-ink-soft space-y-2 fade-in">
                          {card.detailedExplanation && (
                            <p className="leading-relaxed">
                              {isTa ? card.detailedExplanationTa : card.detailedExplanation}
                            </p>
                          )}
                          {card.preventiveSteps && card.preventiveSteps.length > 0 && (
                            <div className="space-y-1 pt-1 border-t border-border/40">
                              {(isTa && card.preventiveStepsTa ? card.preventiveStepsTa : card.preventiveSteps).map(
                                (step, sIdx) => (
                                  <div key={sIdx} className="flex items-start gap-1.5 text-[11px]">
                                    <CheckCircle2 size={12} className="text-emerald-600 shrink-0 mt-0.5" />
                                    <span>{step}</span>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Direct Action Link */}
                {card.relevantSchemeLink && (
                  <div className="pt-2 border-t border-border/60 mt-auto flex items-center justify-between text-xs">
                    <span className="text-[11px] text-ink-soft truncate max-w-[65%]">
                      {isTa ? card.relevantSchemeLink.nameTa : card.relevantSchemeLink.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(card.relevantSchemeLink!.route)}
                      className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors cursor-pointer text-xs"
                    >
                      <span>
                        {isTa
                          ? card.relevantSchemeLink.actionLabelTa
                          : card.relevantSchemeLink.actionLabel}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
