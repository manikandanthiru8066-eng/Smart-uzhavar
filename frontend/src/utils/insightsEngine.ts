import advisoryData from '../data/tn_crop_advisory_guidelines.json';
import stateCropData from '../data/tn_district_crop_data.json';

export interface InsightCardData {
  id: string;
  type: 'yield_benchmark' | 'seasonal_advisory' | 'storage_postharvest' | 'scheme_support';
  title: string;
  titleTa: string;
  badgeText: string;
  badgeTextTa: string;
  badgeType: 'data' | 'guidance' | 'support';
  badgeColor: 'emerald' | 'amber' | 'sky' | 'rust';
  sourceCitation?: string;
  content: string;
  contentTa: string;
  keyMetric?: {
    label: string;
    labelTa: string;
    value: string;
    comparisonText?: string;
    comparisonTextTa?: string;
    isPositive?: boolean;
  };
  preventiveSteps?: string[];
  preventiveStepsTa?: string[];
  relevantSchemeLink?: {
    name: string;
    nameTa: string;
    route: string;
    actionLabel: string;
    actionLabelTa: string;
  };
}

export interface DistrictCropStatItem {
  id?: number;
  crop: string;
  season: string;
  year?: string;
  areaHectares?: number;
  productionTonnes?: number;
  yieldKgPerHa: number;
  isTopCrop?: boolean;
}

interface CropAdvisoryInfo {
  cropName: string;
  cropNameTa: string;
  seasonAdvisories?: Record<string, {
    seasonLabel: string;
    seasonLabelTa: string;
    commonRisks: string;
    commonRisksTa: string;
    preventivePractices: string;
    preventivePracticesTa: string;
    relevantInsuranceScheme?: string;
    relevantSubsidyScheme?: string;
  }>;
  storageAdvisories?: {
    targetMoisturePercent: string;
    bestPractices: string;
    bestPracticesTa: string;
    relevantScheme?: string;
  };
}

// Normalize crop name to match dataset keys
function normalizeCropName(crop: string | undefined): string {
  if (!crop) return 'Paddy';
  const c = crop.trim().toLowerCase();
  if (c.includes('paddy') || c.includes('rice') || c.includes('நெல்')) return 'Paddy';
  if (c.includes('sugar') || c.includes('cane') || c.includes('கரும்பு')) return 'Sugarcane';
  if (c.includes('cotton') || c.includes('பருத்தி')) return 'Cotton';
  if (c.includes('groundnut') || c.includes('peanut') || c.includes('நிலக்கடலை')) return 'Groundnut';
  if (c.includes('pulse') || c.includes('blackgram') || c.includes('greengram') || c.includes('redgram') || c.includes('உளுந்து') || c.includes('பயறு')) return 'Pulses';
  if (c.includes('maize') || c.includes('corn') || c.includes('மக்காச்சோளம்')) return 'Maize';
  if (c.includes('banana') || c.includes('வாழை')) return 'Banana';
  if (c.includes('turmeric') || c.includes('மஞ்சள்')) return 'Turmeric';
  if (c.includes('millet') || c.includes('ragi') || c.includes('சிறுதானியம்') || c.includes('கேழ்வரகு')) return 'Millets';
  if (c.includes('coconut') || c.includes('தென்னை')) return 'Coconut';
  return 'Paddy';
}

// Normalize season name
function normalizeSeason(season: string | undefined): 'Kharif' | 'Rabi' | 'Summer' | 'Annual' | 'Perennial' {
  if (!season) return 'Kharif';
  const s = season.trim().toLowerCase();
  if (s.includes('kuruvai') || s.includes('kharif') || s.includes('கார்') || s.includes('குறுவை')) return 'Kharif';
  if (s.includes('samba') || s.includes('thaladi') || s.includes('rabi') || s.includes('சம்பா') || s.includes('தாளடி')) return 'Rabi';
  if (s.includes('summer') || s.includes('navarai') || s.includes('நவரை') || s.includes('கோடை')) return 'Summer';
  if (s.includes('perennial') || s.includes('பல்லாண்டு')) return 'Perennial';
  if (s.includes('annual') || s.includes('ஆண்டு')) return 'Annual';
  return 'Kharif';
}

/**
 * Calculates state average yield for a specific crop across all districts in dataset
 */
export function calculateStateAverageYield(cropKey: string): { avgYield: number; count: number } {
  let totalYield = 0;
  let count = 0;

  const targetKey = cropKey.toLowerCase();
  for (const dist of stateCropData) {
    for (const stat of dist.cropStats) {
      if (stat.crop.toLowerCase().includes(targetKey) || targetKey.includes(stat.crop.toLowerCase())) {
        totalYield += stat.yieldKgPerHa;
        count++;
      }
    }
  }

  return {
    avgYield: count > 0 ? Math.round(totalYield / count) : 3850,
    count,
  };
}

/**
 * Generates 2-4 tailored actionable insight cards based on actual farmer profile data and TNAU agronomy guidance.
 */
export function generateCropInsights({
  cropGrown,
  season,
  districtName,
  districtCropStats = [],
  context = 'dashboard',
}: {
  cropGrown?: string;
  season?: string;
  districtName?: string;
  districtCropStats?: DistrictCropStatItem[];
  context?: 'dashboard' | 'subsidy' | 'insurance';
}): InsightCardData[] {
  const cards: InsightCardData[] = [];
  const normalizedCrop = normalizeCropName(cropGrown);
  const normalizedSeason = normalizeSeason(season);
  const targetDistrict = districtName?.trim() || 'Thanjavur';

  const cropAdvisories = (advisoryData.crops as Record<string, CropAdvisoryInfo>)[normalizedCrop] || advisoryData.crops.Paddy;
  const seasonAdv = cropAdvisories.seasonAdvisories?.[normalizedSeason] ||
    cropAdvisories.seasonAdvisories?.Kharif ||
    cropAdvisories.seasonAdvisories?.Annual ||
    cropAdvisories.seasonAdvisories?.Perennial;

  // -------------------------------------------------------------
  // 1. YIELD BENCHMARK INSIGHT (Derived from real district dataset)
  // -------------------------------------------------------------
  if (context === 'dashboard' || context === 'insurance') {
    // Look for matching district crop stat from passed stats or stateCropData
    let currentDistrictStat = districtCropStats.find(
      (s) => normalizeCropName(s.crop) === normalizedCrop
    );

    if (!currentDistrictStat) {
      const distData = stateCropData.find(
        (d) => d.district.toLowerCase() === targetDistrict.toLowerCase()
      );
      if (distData) {
        const found = distData.cropStats.find(
          (s) => normalizeCropName(s.crop) === normalizedCrop
        );
        if (found) {
          currentDistrictStat = found;
        }
      }
    }

    const { avgYield: stateAvgYield } = calculateStateAverageYield(normalizedCrop);

    if (currentDistrictStat) {
      const distYield = currentDistrictStat.yieldKgPerHa;
      const diffPct = Math.round(((distYield - stateAvgYield) / stateAvgYield) * 1000) / 10;
      const isAbove = diffPct >= 0;
      const diffText = Math.abs(diffPct).toFixed(1);

      cards.push({
        id: 'yield-benchmark',
        type: 'yield_benchmark',
        title: `${currentDistrictStat.crop} District Yield Benchmark (${targetDistrict})`,
        titleTa: `${cropAdvisories.cropNameTa} மாவட்ட விளைச்சல் ஒப்பீடு (${targetDistrict})`,
        badgeText: 'Derived from District Yield Data (2024-25)',
        badgeTextTa: 'மாவட்ட விளைச்சல் தரவு அடிப்படையில் (2024-25)',
        badgeType: 'data',
        badgeColor: 'emerald',
        keyMetric: {
          label: 'District Average Yield',
          labelTa: 'மாவட்ட சராசரி விளைச்சல்',
          value: `${distYield.toLocaleString()} kg/ha`,
          comparisonText: isAbove
            ? `${diffText}% above TN major district average (${stateAvgYield.toLocaleString()} kg/ha)`
            : `${diffText}% below TN major district average (${stateAvgYield.toLocaleString()} kg/ha)`,
          comparisonTextTa: isAbove
            ? `மாநில முக்கிய மாவட்ட சராசரியை விட ${diffText}% அதிகம் (${stateAvgYield.toLocaleString()} கி.கி/ஹெக்)`
            : `மாநில முக்கிய மாவட்ட சராசரியை விட ${diffText}% குறைவு (${stateAvgYield.toLocaleString()} கி.கி/ஹெக்)`,
          isPositive: isAbove,
        },
        content: `In ${targetDistrict}, ${currentDistrictStat.crop} recorded an average yield of ${distYield.toLocaleString()} kg/ha across ${currentDistrictStat.areaHectares ? currentDistrictStat.areaHectares.toLocaleString() + ' hectares' : 'cultivated acreage'} during ${currentDistrictStat.year || '2024-25'}. ${
          isAbove
            ? 'Strong regional agro-climatic performance. Protect your potential yield against weather anomalies.'
            : 'Yield is currently trailing state leaders. Implementing TNAU nutrient and water management can bridge this gap.'
        }`,
        contentTa: `${targetDistrict} மாவட்டத்தில், 2024-25 பருவத்தில் ${cropAdvisories.cropNameTa} பயிர் சராசரியாக ${distYield.toLocaleString()} கி.கி/ஹெக்டேர் விளைச்சல் தந்துள்ளது. ${
          isAbove
            ? 'மாவட்டத்தில் விளைச்சல் சிறப்பாக உள்ளது. இயற்கை இடர்பாடுகளிலிருந்து விளைச்சலைப் பாதுகாக்க காப்பீடு அவசியம்.'
            : 'மாநில சராசரியை விட விளைச்சல் சற்று குறைவாக உள்ளது. பரிந்துரைக்கப்பட்ட உர மற்றும் நீர் மேலாண்மையை பின்பற்றவும்.'
        }`,
        relevantSchemeLink: {
          name: seasonAdv?.relevantInsuranceScheme || 'PMFBY Crop Insurance',
          nameTa: 'பயிர் காப்பீட்டு திட்டம்',
          route: '/insurance',
          actionLabel: 'Protect Yield with Insurance',
          actionLabelTa: 'காப்பீடு மூலம் பாதுகாக்க',
        },
      });
    } else {
      // General state-wide benchmark
      cards.push({
        id: 'yield-benchmark-general',
        type: 'yield_benchmark',
        title: `${normalizedCrop} State Yield Benchmark`,
        titleTa: `${cropAdvisories.cropNameTa} மாநில சராசரி விளைச்சல் ஒப்பீடு`,
        badgeText: 'State Statistical Benchmark (2024-25)',
        badgeTextTa: 'மாநில புள்ளியியல் ஒப்பீடு (2024-25)',
        badgeType: 'data',
        badgeColor: 'emerald',
        keyMetric: {
          label: 'TN State Major Benchmark',
          labelTa: 'மாநில சராசரி இலக்கு',
          value: `${stateAvgYield.toLocaleString()} kg/ha`,
          comparisonText: `Benchmark computed across major Tamil Nadu agricultural belts`,
          comparisonTextTa: `தமிழ்நாட்டின் முக்கிய விவசாய மண்டலங்களின் சராசரி கணக்கீடு`,
          isPositive: true,
        },
        content: `Major agricultural districts in Tamil Nadu achieve an average productivity benchmark of ${stateAvgYield.toLocaleString()} kg/ha for ${normalizedCrop}. Optimize seed treatment and basal nutrition to hit high productivity targets.`,
        contentTa: `தமிழ்நாட்டின் முன்னணி மாவட்டங்களில் ${cropAdvisories.cropNameTa} சராசரியாக ${stateAvgYield.toLocaleString()} கி.கி/ஹெக்டேர் விளைச்சல் தருகிறது. விதை நேர்த்தி மற்றும் அடிப்படை உரம் மூலம் அதிக மகசூலை எட்டலாம்.`,
      });
    }
  }

  // -------------------------------------------------------------
  // 2. SEASON-APPROPRIATE AGRONOMIC ADVISORY (TNAU Agritech Portal)
  // -------------------------------------------------------------
  if (seasonAdv && (context === 'dashboard' || context === 'subsidy' || context === 'insurance')) {
    cards.push({
      id: 'seasonal-agronomy',
      type: 'seasonal_advisory',
      title: `${seasonAdv.seasonLabel} Agronomic & Pest Management Advisory`,
      titleTa: `${seasonAdv.seasonLabelTa} பருவ பயிர் பாதுகாப்பு மற்றும் சாகுபடி ஆலோசனை`,
      badgeText: 'General Best-Practice Guidance',
      badgeTextTa: 'பொதுவான வழிகாட்டுதல்',
      badgeType: 'guidance',
      badgeColor: 'amber',
      sourceCitation: 'Source: TNAU Agritech Portal (agritech.tnau.ac.in)',
      content: seasonAdv.preventivePractices,
      contentTa: seasonAdv.preventivePracticesTa,
      preventiveSteps: [
        `Key Risks to Monitor: ${seasonAdv.commonRisks}`,
        `Preventive Agronomy: ${seasonAdv.preventivePractices}`,
      ],
      preventiveStepsTa: [
        `கவனிக்க வேண்டிய இடர்பாடுகள்: ${seasonAdv.commonRisksTa}`,
        `பரிந்துரைக்கப்பட்ட மேலாண்மை: ${seasonAdv.preventivePracticesTa}`,
      ],
      relevantSchemeLink: seasonAdv.relevantSubsidyScheme
        ? {
            name: seasonAdv.relevantSubsidyScheme,
            nameTa: seasonAdv.relevantSubsidyScheme,
            route: '/subsidy',
            actionLabel: 'Check Input & Machinery Subsidies',
            actionLabelTa: 'மானிய திட்டங்களை பார்க்க',
          }
        : undefined,
    });
  }

  // -------------------------------------------------------------
  // 3. STORAGE & POST-HARVEST LOSS PREVENTION (TNAU Guidelines)
  // -------------------------------------------------------------
  if (cropAdvisories.storageAdvisories && (context === 'dashboard' || context === 'subsidy')) {
    const storage = cropAdvisories.storageAdvisories;
    cards.push({
      id: 'storage-postharvest',
      type: 'storage_postharvest',
      title: `${cropAdvisories.cropName} Post-Harvest & Safe Storage Protocol`,
      titleTa: `${cropAdvisories.cropNameTa} அறுவடைக்கு பின் பாதுகாப்பான சேமிப்பு முறை`,
      badgeText: 'General Best-Practice Guidance',
      badgeTextTa: 'பொதுவான வழிகாட்டுதல்',
      badgeType: 'guidance',
      badgeColor: 'sky',
      sourceCitation: 'Source: TNAU Agritech Portal (agritech.tnau.ac.in)',
      keyMetric: {
        label: 'Target Moisture Limit',
        labelTa: 'பரிந்துரைக்கப்படும் ஈரப்பதம்',
        value: storage.targetMoisturePercent,
        comparisonText: 'Critical threshold to prevent fungal aflatoxins & storage insect pests',
        comparisonTextTa: 'பூஞ்சை நச்சு மற்றும் வண்டுகள் தாக்குதலை தவிர்க்கும் பாதுகாப்பான வரம்பு',
        isPositive: true,
      },
      content: storage.bestPractices,
      contentTa: storage.bestPracticesTa,
      relevantSchemeLink: storage.relevantScheme
        ? {
            name: storage.relevantScheme,
            nameTa: storage.relevantScheme,
            route: '/subsidy',
            actionLabel: 'View Mechanization & Storage Schemes',
            actionLabelTa: 'சேமிப்பு மற்றும் இயந்திர மானியங்களை பார்க்க',
          }
        : undefined,
    });
  }

  // -------------------------------------------------------------
  // 4. SCHEME SUPPORT TIE-IN (Government Support Direct Action)
  // -------------------------------------------------------------
  if (context === 'subsidy' || context === 'insurance' || cards.length < 3) {
    if (context === 'insurance' || (!cards.some(c => c.type === 'yield_benchmark') && seasonAdv?.relevantInsuranceScheme)) {
      cards.push({
        id: 'scheme-insurance-support',
        type: 'scheme_support',
        title: `Recommended Safety Net: ${seasonAdv?.relevantInsuranceScheme || 'PMFBY Crop Insurance'}`,
        titleTa: `பரிந்துரைக்கப்படும் பயிர் பாதுகாப்பு: ${seasonAdv?.relevantInsuranceScheme || 'PMFBY பயிர் காப்பீடு'}`,
        badgeText: 'Government Scheme Support',
        badgeTextTa: 'அரசு பாதுகாப்பு திட்டம்',
        badgeType: 'support',
        badgeColor: 'rust',
        content: `Protect your investment against yield shortfall, unseasonal monsoon rainfall, and localized natural disasters with comprehensive government premium subsidies.`,
        contentTa: `விளைச்சல் குறைவு மற்றும் எதிர்பாராத இயற்கை சீற்றங்களிலிருந்து உங்களது உழைப்பையும் முதலீட்டையும் அரசு மானியத்துடன் கூடிய காப்பீடு மூலம் பாதுகாத்திடுங்கள்.`,
        relevantSchemeLink: {
          name: seasonAdv?.relevantInsuranceScheme || 'PMFBY Crop Insurance',
          nameTa: seasonAdv?.relevantInsuranceScheme || 'PMFBY பயிர் காப்பீடு',
          route: '/insurance',
          actionLabel: 'Calculate Premium & View Details',
          actionLabelTa: 'பிரீமியம் கணக்கிட்டு பார்க்க',
        },
      });
    } else if (seasonAdv?.relevantSubsidyScheme) {
      cards.push({
        id: 'scheme-subsidy-support',
        type: 'scheme_support',
        title: `Financial & Input Support: ${seasonAdv.relevantSubsidyScheme}`,
        titleTa: `நிதி மற்றும் உள்ளீட்டு மானிய ஆதரவு: ${seasonAdv.relevantSubsidyScheme}`,
        badgeText: 'Government Scheme Support',
        badgeTextTa: 'அரசு மானிய திட்டம்',
        badgeType: 'support',
        badgeColor: 'rust',
        content: `Avail certified seed assistance, soil nutrient kits, and mechanized equipment subsidies under active state and central agricultural missions.`,
        contentTa: `அரசு சான்றளிக்கப்பட்ட விதை மானியங்கள், மண் ஊட்டச்சத்து தொகுப்புகள் மற்றும் விவசாய இயந்திர மானியங்களைப் பெறுங்கள்.`,
        relevantSchemeLink: {
          name: seasonAdv.relevantSubsidyScheme,
          nameTa: seasonAdv.relevantSubsidyScheme,
          route: '/subsidy',
          actionLabel: 'Explore Matching Subsidies',
          actionLabelTa: 'பொருந்தும் மானியங்களை பார்க்க',
        },
      });
    }
  }

  return cards;
}
