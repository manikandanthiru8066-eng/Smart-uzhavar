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
  // One short, plain sentence (< 15 words) shown by default
  shortSummary: string;
  shortSummaryTa: string;
  // Expanded detailed explanation for "Learn more" toggle
  detailedExplanation?: string;
  detailedExplanationTa?: string;
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
export function normalizeCropName(crop: string | undefined): string {
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
export function normalizeSeason(season: string | undefined): 'Kharif' | 'Rabi' | 'Summer' | 'Annual' | 'Perennial' {
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
  const targetDistrict = districtName?.trim() || '';

  if (!targetDistrict) {
    return [];
  }

  const cropAdvisories = (advisoryData.crops as Record<string, CropAdvisoryInfo>)[normalizedCrop] || advisoryData.crops.Paddy;
  const seasonAdv = cropAdvisories.seasonAdvisories?.[normalizedSeason] ||
    cropAdvisories.seasonAdvisories?.Kharif ||
    cropAdvisories.seasonAdvisories?.Annual ||
    cropAdvisories.seasonAdvisories?.Perennial;

  // -------------------------------------------------------------
  // 1. YIELD BENCHMARK INSIGHT (Derived strictly from district data)
  // -------------------------------------------------------------
  if (context === 'dashboard' || context === 'insurance') {
    // 1. Check passed districtCropStats for this specific district
    let currentDistrictStat = districtCropStats.find(
      (s) => normalizeCropName(s.crop) === normalizedCrop
    );

    // 2. Query stateCropData strictly by the farmer's selected district
    const distData = stateCropData.find(
      (d) => d.district.toLowerCase() === targetDistrict.toLowerCase()
    );

    if (!currentDistrictStat && distData) {
      currentDistrictStat = distData.cropStats.find(
        (s) => normalizeCropName(s.crop) === normalizedCrop
      );
    }

    const { avgYield: stateAvgYield } = calculateStateAverageYield(normalizedCrop);

    if (currentDistrictStat) {
      const distYield = currentDistrictStat.yieldKgPerHa;
      const diffPct = Math.round(((distYield - stateAvgYield) / stateAvgYield) * 1000) / 10;
      const isAbove = diffPct >= 0;
      const diffText = Math.abs(diffPct).toFixed(1);
      const sign = isAbove ? '+' : '-';

      cards.push({
        id: 'yield-benchmark',
        type: 'yield_benchmark',
        title: `${currentDistrictStat.crop} Yield in ${targetDistrict}`,
        titleTa: `${targetDistrict}ல் ${cropAdvisories.cropNameTa} விளைச்சல்`,
        badgeText: 'District Yield Data (2024-25)',
        badgeTextTa: 'மாவட்ட விளைச்சல் தரவு (2024-25)',
        badgeType: 'data',
        badgeColor: 'emerald',
        keyMetric: {
          label: `${targetDistrict} Average`,
          labelTa: `${targetDistrict} சராசரி`,
          value: `${distYield.toLocaleString()} kg/ha`,
          comparisonText: `${sign}${diffText}% vs state avg (${stateAvgYield.toLocaleString()} kg/ha)`,
          comparisonTextTa: `மாநில சராசரியை விட ${sign}${diffText}% (${stateAvgYield.toLocaleString()} கி.கி/ஹெக்)`,
          isPositive: isAbove,
        },
        // Short plain sentence (< 15 words)
        shortSummary: `Your ${currentDistrictStat.crop} yield in ${targetDistrict} is ${distYield.toLocaleString()} kg/ha (${sign}${diffText}% vs state average).`,
        shortSummaryTa: `${targetDistrict}ல் உங்கள் ${cropAdvisories.cropNameTa} விளைச்சல் ${distYield.toLocaleString()} கி.கி/ஹெக் (மாநில சராசரியை விட ${sign}${diffText}%).`,
        // Detailed explanation for expandable "Learn more"
        detailedExplanation: `In ${targetDistrict}, ${currentDistrictStat.crop} recorded an average yield of ${distYield.toLocaleString()} kg/ha across ${currentDistrictStat.areaHectares ? currentDistrictStat.areaHectares.toLocaleString() + ' hectares' : 'cultivated land'} in 2024-25. ${
          isAbove
            ? 'Your district outperforms the statewide average. Enroll in PMFBY to safeguard this strong productivity against weather shocks.'
            : 'Yield is currently below state leaders. Adopting TNAU balanced fertilization and split nitrogen can boost your crop output.'
        }`,
        detailedExplanationTa: `${targetDistrict} மாவட்டத்தில், 2024-25 பருவத்தில் ${cropAdvisories.cropNameTa} பயிர் சராசரியாக ${distYield.toLocaleString()} கி.கி/ஹெக்டேர் விளைச்சல் தந்துள்ளது. ${
          isAbove
            ? 'உங்கள் மாவட்டம் மாநில சராசரியை விட முன்னணியில் உள்ளது. இயற்கை சீற்றங்களிலிருந்து விளைச்சலைப் பாதுகாக்க காப்பீடு அவசியம்.'
            : 'மாநில சராசரியை விட விளைச்சல் சற்று குறைவாக உள்ளது. பரிந்துரைக்கப்பட்ட உர மற்றும் நீர் மேலாண்மையை பின்பற்றவும்.'
        }`,
        relevantSchemeLink: {
          name: seasonAdv?.relevantInsuranceScheme || 'PMFBY Crop Insurance',
          nameTa: 'PMFBY பயிர் காப்பீடு',
          route: '/insurance',
          actionLabel: 'Protect Yield →',
          actionLabelTa: 'காப்பீடு செய்ய →',
        },
      });
    } else if (distData && distData.cropStats.length > 0) {
      // District has records for other crops
      const topCrop = distData.cropStats[0];
      cards.push({
        id: 'yield-benchmark-district-context',
        type: 'yield_benchmark',
        title: `${targetDistrict} Agricultural Context`,
        titleTa: `${targetDistrict} வேளாண் புள்ளிவிவரம்`,
        badgeText: 'District Yield Data (2024-25)',
        badgeTextTa: 'மாவட்ட விளைச்சல் தரவு (2024-25)',
        badgeType: 'data',
        badgeColor: 'emerald',
        keyMetric: {
          label: `${targetDistrict} Top Crop: ${topCrop.crop}`,
          labelTa: `முக்கிய பயிர்: ${topCrop.crop}`,
          value: `${topCrop.yieldKgPerHa.toLocaleString()} kg/ha`,
          comparisonText: `Statewide benchmark for ${normalizedCrop}: ${stateAvgYield.toLocaleString()} kg/ha`,
          comparisonTextTa: `${cropAdvisories.cropNameTa} மாநில சராசரி: ${stateAvgYield.toLocaleString()} கி.கி/ஹெக்`,
          isPositive: true,
        },
        shortSummary: `${targetDistrict}'s leading crop is ${topCrop.crop} (${topCrop.yieldKgPerHa.toLocaleString()} kg/ha); statewide ${normalizedCrop} benchmark is ${stateAvgYield.toLocaleString()} kg/ha.`,
        shortSummaryTa: `${targetDistrict} மாவட்டத்தின் முக்கிய பயிர் ${topCrop.crop} (${topCrop.yieldKgPerHa.toLocaleString()} கி.கி/ஹெக்); மாநில ${cropAdvisories.cropNameTa} சராசரி ${stateAvgYield.toLocaleString()} கி.கி/ஹெக்.`,
        detailedExplanation: `Agricultural records in ${targetDistrict} show ${topCrop.crop} as the dominant crop (${topCrop.areaHectares?.toLocaleString()} Ha). For your ${normalizedCrop} crop, Tamil Nadu major growing belts average ${stateAvgYield.toLocaleString()} kg/ha.`,
        detailedExplanationTa: `${targetDistrict} மாவட்டத்தில் ${topCrop.crop} அதிக பரப்பளவில் பயிரிடப்படுகிறது. உங்கள் ${cropAdvisories.cropNameTa} பயிருக்கு மாநில சராசரி இலக்கு ${stateAvgYield.toLocaleString()} கி.கி/ஹெக் ஆகும்.`,
      });
    } else {
      // General state-wide benchmark for this district
      cards.push({
        id: 'yield-benchmark-general',
        type: 'yield_benchmark',
        title: `${normalizedCrop} State Yield Benchmark`,
        titleTa: `${cropAdvisories.cropNameTa} மாநில சராசரி ஒப்பீடு`,
        badgeText: 'State Benchmark (2024-25)',
        badgeTextTa: 'மாநில சராசரி (2024-25)',
        badgeType: 'data',
        badgeColor: 'emerald',
        keyMetric: {
          label: 'TN Benchmark',
          labelTa: 'மாநில சராசரி',
          value: `${stateAvgYield.toLocaleString()} kg/ha`,
          comparisonText: `Average across major Tamil Nadu agricultural districts`,
          comparisonTextTa: `தமிழ்நாட்டின் முன்னணி விவசாய மாவட்டங்களின் சராசரி`,
          isPositive: true,
        },
        shortSummary: `Tamil Nadu state average for ${normalizedCrop} is ${stateAvgYield.toLocaleString()} kg/ha across major belts.`,
        shortSummaryTa: `தமிழ்நாட்டில் ${cropAdvisories.cropNameTa} சராசரி விளைச்சல் ${stateAvgYield.toLocaleString()} கி.கி/ஹெக் ஆகும்.`,
        detailedExplanation: `Productivity data across Tamil Nadu sets the benchmark for ${normalizedCrop} at ${stateAvgYield.toLocaleString()} kg/ha. Follow TNAU soil health guidelines to optimize your harvest in ${targetDistrict}.`,
        detailedExplanationTa: `தமிழ்நாட்டின் முக்கிய விவசாய மண்டலங்களில் ${cropAdvisories.cropNameTa} சராசரியாக ${stateAvgYield.toLocaleString()} கி.கி/ஹெக் விளைச்சல் தருகிறது. ${targetDistrict}ல் சிறந்த மகசூலைப் பெற மண் பரிசோதனை பரிந்துரைகளைப் பின்பற்றவும்.`,
      });
    }
  }

  // -------------------------------------------------------------
  // 2. SEASON-APPROPRIATE ADVISORY (TNAU Agritech Portal)
  // -------------------------------------------------------------
  if (seasonAdv && (context === 'dashboard' || context === 'subsidy' || context === 'insurance')) {
    // Generate crisp 1-sentence summary based on crop & season
    let shortSeasonText = '';
    let shortSeasonTextTa = '';

    if (normalizedCrop === 'Paddy') {
      if (normalizedSeason === 'Kharif') {
        shortSeasonText = 'Kharif Paddy risk: blast & stem borer — use resistant varieties and balanced nitrogen.';
        shortSeasonTextTa = 'குறுவை நெல் இடர்பாடு: குலை நோய் மற்றும் தண்டு துளைப்பான் — எதிர்ப்பு ரகங்களை பயிரிடவும்.';
      } else if (normalizedSeason === 'Rabi') {
        shortSeasonText = 'Samba Paddy risk: BPH & lodging — provide 30cm alleyways and drainage.';
        shortSeasonTextTa = 'சம்பா நெல் இடர்பாடு: புகையான் வண்டு — 2 மீட்டருக்கு 30 செ.மீ பாத்தி இடைவெளி விடவும்.';
      } else {
        shortSeasonText = 'Summer Paddy risk: heat stress — spray 1% KCl at flowering.';
        shortSeasonTextTa = 'கோடை நெல் இடர்பாடு: வெப்ப தாக்கம் — பூக்கும் பருவத்தில் 1% பொட்டாசியம் குளோரைடு தெளிக்கவும்.';
      }
    } else if (normalizedCrop === 'Sugarcane') {
      shortSeasonText = 'Sugarcane risk: early shoot borer — adopt trash mulching and drip fertigation.';
      shortSeasonTextTa = 'கரும்பு இடர்பாடு: இளம் குருத்து துளைப்பான் — சோகை மூடாக்கு மற்றும் சொட்டு நீர் பாசனம் அமைக்கவும்.';
    } else if (normalizedCrop === 'Cotton') {
      shortSeasonText = 'Cotton risk: pink bollworm — install 12 pheromone traps/ha to monitor pest levels.';
      shortSeasonTextTa = 'பருத்தி இடர்பாடு: காய்ப்புழு — ஹெக்டேருக்கு 12 இனக்கவர்ச்சி பொறிகளை அமைக்கவும்.';
    } else if (normalizedCrop === 'Groundnut') {
      shortSeasonText = 'Groundnut risk: root rot & tikka spot — apply gypsum at 45 days for pod filling.';
      shortSeasonTextTa = 'நிலக்கடலை இடர்பாடு: டிக்கா இலைப்புள்ளி — 45 ஆம் நாளில் ஜிப்சம் (400 கிலோ/ஹெக்) இடவும்.';
    } else if (normalizedCrop === 'Pulses') {
      shortSeasonText = 'Pulses risk: yellow mosaic virus — sow resistant varieties (VBN 6/8) with 2% DAP.';
      shortSeasonTextTa = 'பயறு இடர்பாடு: மஞ்சள் தேமல் நோய் — VBN 6/8 எதிர்ப்பு ரகங்களை விதைத்து 2% டிஏபி தெளிக்கவும்.';
    } else if (normalizedCrop === 'Maize') {
      shortSeasonText = 'Maize risk: fall armyworm — apply sand + neem cake in leaf whorls.';
      shortSeasonTextTa = 'மக்காச்சோளம் இடர்பாடு: படைப்புழு — குருத்தில் மணல் மற்றும் வேப்பம் புண்ணாக்கு கலவை இடவும்.';
    } else if (normalizedCrop === 'Banana') {
      shortSeasonText = 'Banana risk: wind lodging — provide bamboo staking before shooting.';
      shortSeasonTextTa = 'வாழை இடர்பாடு: காற்று சாய்வு — தார் வெளிவரும் முன் கன்றுகளுக்கு முட்டுக் கொடுக்கவும்.';
    } else if (normalizedCrop === 'Turmeric') {
      shortSeasonText = 'Turmeric risk: rhizome rot — plant on raised beds with Trichoderma seed treatment.';
      shortSeasonTextTa = 'மஞ்சள் இடர்பாடு: கிழங்கு அழுகல் — மேட்டுப்பாத்தி முறையில் நடவு செய்து விதை நேர்த்தி செய்யவும்.';
    } else {
      shortSeasonText = `${seasonAdv.seasonLabel} advisory: practice seed treatment and monitor early vegetative pests.`;
      shortSeasonTextTa = `${seasonAdv.seasonLabelTa} ஆலோசனை: விதை நேர்த்தி செய்து ஆரம்ப கால பூச்சிகளை கண்காணிக்கவும்.`;
    }

    cards.push({
      id: 'seasonal-agronomy',
      type: 'seasonal_advisory',
      title: `${seasonAdv.seasonLabel} Seasonal Advisory`,
      titleTa: `${seasonAdv.seasonLabelTa} பருவ வேளாண் ஆலோசனை`,
      badgeText: 'General Best-Practice Guidance',
      badgeTextTa: 'பொதுவான வழிகாட்டுதல்',
      badgeType: 'guidance',
      badgeColor: 'amber',
      sourceCitation: 'Source: TNAU Agritech Portal',
      shortSummary: shortSeasonText,
      shortSummaryTa: shortSeasonTextTa,
      detailedExplanation: `Agronomic Protocol: ${seasonAdv.preventivePractices} (Key risks identified: ${seasonAdv.commonRisks})`,
      detailedExplanationTa: `பரிந்துரைக்கப்பட்ட சாகுபடி முறை: ${seasonAdv.preventivePracticesTa} (கவனிக்க வேண்டிய இடர்பாடுகள்: ${seasonAdv.commonRisksTa})`,
      preventiveSteps: [
        `Common Risks: ${seasonAdv.commonRisks}`,
        `Preventive Agronomy: ${seasonAdv.preventivePractices}`,
      ],
      preventiveStepsTa: [
        `இடர்பாடுகள்: ${seasonAdv.commonRisksTa}`,
        `பரிந்துரைக்கப்பட்ட மேலாண்மை: ${seasonAdv.preventivePracticesTa}`,
      ],
      relevantSchemeLink: seasonAdv.relevantSubsidyScheme
        ? {
            name: seasonAdv.relevantSubsidyScheme,
            nameTa: seasonAdv.relevantSubsidyScheme,
            route: '/subsidy',
            actionLabel: 'Matching Subsidies →',
            actionLabelTa: 'மானியங்களை பார்க்க →',
          }
        : undefined,
    });
  }

  // -------------------------------------------------------------
  // 3. STORAGE / POST-HARVEST ADVISORY (TNAU Guidelines)
  // -------------------------------------------------------------
  if (cropAdvisories.storageAdvisories && (context === 'dashboard' || context === 'subsidy')) {
    const storage = cropAdvisories.storageAdvisories;
    let shortStorageText = '';
    let shortStorageTextTa = '';

    if (normalizedCrop === 'Paddy') {
      shortStorageText = 'Store paddy at 12–14% moisture on raised pallets to prevent post-harvest loss.';
      shortStorageTextTa = 'அறுவடைக்கு பின் இழப்பைத் தவிர்க்க நெல்லை 12–14% ஈரப்பதத்தில் மரப்பலகை மீது சேமிக்கவும்.';
    } else if (normalizedCrop === 'Sugarcane') {
      shortStorageText = 'Crush harvested sugarcane within 24–48 hours to prevent sucrose inversion loss.';
      shortStorageTextTa = 'சுக்ரோஸ் இழப்பைத் தவிர்க்க அறுவடை செய்த கரும்பை 24–48 மணி நேரத்திற்குள் அரவை செய்க.';
    } else if (normalizedCrop === 'Cotton') {
      shortStorageText = 'Dry seed cotton to 7–8% moisture and store in dry cloth bags away from dampness.';
      shortStorageTextTa = 'பருத்தியை 7–8% ஈரப்பதத்தில் சுத்தமான துணிப் பைகளில் சேமிக்கவும்.';
    } else if (normalizedCrop === 'Groundnut') {
      shortStorageText = 'Dry groundnut pods to 8–9% moisture to prevent toxic aflatoxin fungal growth.';
      shortStorageTextTa = 'அஃப்லாடாக்சின் நச்சு பூஞ்சை வராமல் பாதுகாக்க நிலக்கடலையை 8–9% ஈரப்பதத்தில் உலர்த்தவும்.';
    } else if (normalizedCrop === 'Pulses') {
      shortStorageText = 'Store pulses at 9–10% moisture with neem oil coating to deter pulse beetle.';
      shortStorageTextTa = 'பயறு வண்டு தாக்காமல் இருக்க வேப்ப எண்ணெய் தடவி 9–10% ஈரப்பதத்தில் சேமிக்கவும்.';
    } else {
      shortStorageText = `Maintain target moisture of ${storage.targetMoisturePercent} for safe storage.`;
      shortStorageTextTa = `பாதுகாப்பான சேமிப்பிற்கு ${storage.targetMoisturePercent} ஈரப்பதத்தை பராமரிக்கவும்.`;
    }

    cards.push({
      id: 'storage-postharvest',
      type: 'storage_postharvest',
      title: `${cropAdvisories.cropName} Safe Storage Protocol`,
      titleTa: `${cropAdvisories.cropNameTa} பாதுகாப்பான சேமிப்பு முறை`,
      badgeText: 'General Best-Practice Guidance',
      badgeTextTa: 'பொதுவான வழிகாட்டுதல்',
      badgeType: 'guidance',
      badgeColor: 'sky',
      sourceCitation: 'Source: TNAU Agritech Portal',
      keyMetric: {
        label: 'Target Moisture Limit',
        labelTa: 'பரிந்துரைக்கப்படும் ஈரப்பதம்',
        value: storage.targetMoisturePercent,
      },
      shortSummary: shortStorageText,
      shortSummaryTa: shortStorageTextTa,
      detailedExplanation: storage.bestPractices,
      detailedExplanationTa: storage.bestPracticesTa,
      relevantSchemeLink: storage.relevantScheme
        ? {
            name: storage.relevantScheme,
            nameTa: storage.relevantScheme,
            route: '/subsidy',
            actionLabel: 'Storage Subsidies →',
            actionLabelTa: 'சேமிப்பு மானியங்கள் →',
          }
        : undefined,
    });
  }

  // -------------------------------------------------------------
  // 4. SCHEME TIE-IN (Government Support Direct Action)
  // -------------------------------------------------------------
  if (context === 'subsidy' || context === 'insurance' || cards.length < 3) {
    if (context === 'insurance' || (!cards.some(c => c.type === 'yield_benchmark') && seasonAdv?.relevantInsuranceScheme)) {
      cards.push({
        id: 'scheme-insurance-support',
        type: 'scheme_support',
        title: `Crop Protection: ${seasonAdv?.relevantInsuranceScheme || 'PMFBY'}`,
        titleTa: `பயிர் பாதுகாப்பு: ${seasonAdv?.relevantInsuranceScheme || 'PMFBY'}`,
        badgeText: 'Government Support',
        badgeTextTa: 'அரசு ஆதரவு',
        badgeType: 'support',
        badgeColor: 'rust',
        shortSummary: `PMFBY covers yield loss from weather and pests — consider enrolling for ${normalizedCrop}.`,
        shortSummaryTa: `இயற்கை சீற்ற பயிர் இழப்புகளுக்கு PMFBY காப்பீடு பாதுகாப்பு அளிக்கிறது — பதிவு செய்யவும்.`,
        detailedExplanation: `Protect your farming investment against drought, flood, pests, and post-harvest cyclone damage with subsidized government premium rates (1.5% - 2%).`,
        detailedExplanationTa: `வறட்சி, வெள்ளம், பூச்சித் தாக்குதல் மற்றும் அறுவடைக்குப் பிந்தைய புயல் இழப்புகளுக்கு அரசு மானிய பிரீமியத்தில் (1.5% - 2%) முழு பாதுகாப்பு பெறலாம்.`,
        relevantSchemeLink: {
          name: seasonAdv?.relevantInsuranceScheme || 'PMFBY Crop Insurance',
          nameTa: 'PMFBY பயிர் காப்பீடு',
          route: '/insurance',
          actionLabel: 'Calculate Premium →',
          actionLabelTa: 'பிரீமியம் பார்க்க →',
        },
      });
    } else if (seasonAdv?.relevantSubsidyScheme) {
      cards.push({
        id: 'scheme-subsidy-support',
        type: 'scheme_support',
        title: `Input & Machine Support: ${seasonAdv.relevantSubsidyScheme}`,
        titleTa: `உள்ளீட்டு மானியம்: ${seasonAdv.relevantSubsidyScheme}`,
        badgeText: 'Government Support',
        badgeTextTa: 'அரசு ஆதரவு',
        badgeType: 'support',
        badgeColor: 'rust',
        shortSummary: `Avail subsidized certified seed and farm machinery kits under ${seasonAdv.relevantSubsidyScheme}.`,
        shortSummaryTa: `${seasonAdv.relevantSubsidyScheme} திட்டத்தின் கீழ் சான்றளிக்கப்பட்ட விதை மற்றும் உபகரண மானியம் பெறலாம்.`,
        detailedExplanation: `State agricultural missions provide up to 50% subsidy on certified high-yielding seeds, micro-irrigation kits, and harvesting implements.`,
        detailedExplanationTa: `மாநில வேளாண் மிஷன்கள் மூலம் சான்றளிக்கப்பட்ட அதிக மகசூல் தரும் விதைகள், சொட்டுநீர் உபகரணங்கள் மற்றும் அறுவடை கருவிகளுக்கு 50% வரை மானியம் வழங்கப்படுகிறது.`,
        relevantSchemeLink: {
          name: seasonAdv.relevantSubsidyScheme,
          nameTa: seasonAdv.relevantSubsidyScheme,
          route: '/subsidy',
          actionLabel: 'View Subsidies →',
          actionLabelTa: 'மானியங்களை பார்க்க →',
        },
      });
    }
  }

  return cards;
}
