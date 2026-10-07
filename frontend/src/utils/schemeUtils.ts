import { subsidyApi, insuranceApi } from '../api/client';

export type SchemeCategory = 'SUBSIDY' | 'INSURANCE';

export interface UnifiedScheme {
  id: number;
  name: string;
  nameTa?: string;
  description: string;
  descriptionTa?: string;
  category: SchemeCategory;
  applicableCrops: string;
  applicableCropsTa?: string;
  lastVerifiedDate: string | null;

  // Subsidy specific
  applicableDistricts?: string;
  subsidyAmount?: string;
  sourceUrl?: string;

  // Insurance specific
  schemeType?: string;
  premiumRatePercentage?: number;
  sumInsuredPerAcre?: number;
}

export function normalizeSchemeUrl(url?: string | null): string {
  if (!url || !url.trim()) return 'https://www.tnagrisnet.tn.gov.in/';
  let clean = url.trim();
  clean = clean.replace(/tntagrisnet\.tn\.gov\.in/gi, 'www.tnagrisnet.tn.gov.in');
  clean = clean.replace(/^(https?:\/\/)?(www\.)?tnagrisnet\.tn\.gov\.in/gi, 'https://www.tnagrisnet.tn.gov.in');
  clean = clean.replace(/^http:\/\/www\.tnagrisnet\.tn\.gov\.in/gi, 'https://www.tnagrisnet.tn.gov.in');
  if (!/^https?:\/\//i.test(clean)) {
    clean = 'https://' + clean;
  }
  return clean;
}

export function isSchemeUpToDate(lastVerifiedDate?: string | null): boolean {
  if (!lastVerifiedDate) return false;
  // Parse date string like '2026-09-19'
  const parts = lastVerifiedDate.split('-');
  let verifiedTime: number;
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    verifiedTime = new Date(year, month, day).getTime();
  } else {
    verifiedTime = new Date(lastVerifiedDate).getTime();
  }

  if (isNaN(verifiedTime)) return false;
  const now = Date.now();
  const diffDays = (now - verifiedTime) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 90;
}

export function formatVerifiedDate(lastVerifiedDate?: string | null): string {
  if (!lastVerifiedDate) return 'Never verified';
  try {
    const parts = lastVerifiedDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    const d = new Date(lastVerifiedDate);
    if (isNaN(d.getTime())) return lastVerifiedDate;
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return lastVerifiedDate;
  }
}

export function getDaysAgoText(lastVerifiedDate?: string | null): string {
  if (!lastVerifiedDate) return 'Stale — No verification date on record';
  const parts = lastVerifiedDate.split('-');
  let verifiedTime: number;
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    verifiedTime = new Date(year, month, day).getTime();
  } else {
    verifiedTime = new Date(lastVerifiedDate).getTime();
  }

  if (isNaN(verifiedTime)) return '';
  const now = Date.now();
  const diffDays = Math.floor((now - verifiedTime) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Verified today';
  if (diffDays === 1) return 'Verified yesterday';
  if (diffDays <= 90) return `Verified ${diffDays} days ago`;
  return `Overdue by ${diffDays - 90} days (${diffDays} days since check)`;
}

export const BASELINE_SUBSIDY_SCHEMES: Partial<UnifiedScheme>[] = [
  {
    id: 1,
    name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    nameTa: "பிஎம்-கிசான் (பிரதம மந்திரி கிசான் சம்மான் நிதி)",
    description: "Income support of ₹6,000/year in 3 installments to landholding farmer families.",
    descriptionTa: "நில உரிமையாளர் விவசாய குடும்பங்களுக்கு ஆண்டிற்கு ₹6,000 வருமான உதவி 3 தவணைகளில் வழங்கப்படுகிறது.",
    category: 'SUBSIDY',
    applicableCrops: "All",
    applicableCropsTa: "அனைத்தும்",
    applicableDistricts: "All",
    subsidyAmount: "₹6,000/year",
    sourceUrl: "https://pmkisan.gov.in/",
    lastVerifiedDate: "2026-09-17"
  },
  {
    id: 2,
    name: "Sub-Mission on Agricultural Mechanization (SMAM)",
    nameTa: "வேளாண் இயந்திரமயமாக்கல் துணை மிஷன் (SMAM)",
    description: "Subsidy on purchase of tractors, power tillers, and farm machinery/implements.",
    descriptionTa: "ட்ராக்டர்கள், பவர் டில்லர்கள் மற்றும் விவசாய இயந்திரங்கள் வாங்க மானியம்.",
    category: 'SUBSIDY',
    applicableCrops: "All",
    applicableCropsTa: "அனைத்தும்",
    applicableDistricts: "All",
    subsidyAmount: "Varies by machinery type",
    sourceUrl: "https://agrimachinery.nic.in/",
    lastVerifiedDate: "2026-09-12"
  },
  {
    id: 3,
    name: "Per Drop More Crop – Micro Irrigation (PMKSY-MI)",
    nameTa: "சொட்டு நீர் பாசன திட்டம் (PMKSY-MI)",
    description: "Subsidy for drip and sprinkler irrigation systems; TN adds a state top-up for small/marginal farmers.",
    descriptionTa: "சொட்டு நீர் மற்றும் தெளிப்பு நீர் பாசன அமைப்புகளுக்கு மானியம்; சிறு/குறு விவசாயிகளுக்கு சிறப்பு மானியம்.",
    category: 'SUBSIDY',
    applicableCrops: "Horticulture, Sugarcane, Cotton, Banana",
    applicableCropsTa: "தோட்டக்கலை, கரும்பு, பருத்தி, வாழை",
    applicableDistricts: "All",
    subsidyAmount: "Varies by category",
    sourceUrl: "https://tnhorticulture.tn.gov.in/",
    lastVerifiedDate: "2026-09-07"
  },
  {
    id: 4,
    name: "National Food Security Mission (NFSM)",
    nameTa: "தேசிய உணவு பாதுகாப்பு திட்டம் (NFSM)",
    description: "Input subsidies (seed, INM/IPM kits) for rice, wheat, pulses, coarse cereals, oilseeds, commercial crops.",
    descriptionTa: "நெல், கோதுமை, பருப்பு வகைகளுக்கான விதை மற்றும் உள்ளீட்டு மானியங்கள்.",
    category: 'SUBSIDY',
    applicableCrops: "Paddy, Maize, Pulses, Oilseeds, Cotton",
    applicableCropsTa: "நெல், மக்காச்சோளம், பருப்பு வகைகள், எண்ணெய் வித்துக்கள், பருத்தி",
    applicableDistricts: "All",
    subsidyAmount: "Input subsidies",
    sourceUrl: "https://nfsm.gov.in/",
    lastVerifiedDate: "2026-03-21"
  },
  {
    id: 5,
    name: "Soil Health Card Scheme",
    nameTa: "மண் வள அட்டை திட்டம்",
    description: "Free soil testing and nutrient recommendation card every 2 years.",
    descriptionTa: "2 ஆண்டுகளுக்கு ஒருமுறை இலவச மண் பரிசோதனை மற்றும் ஊட்டச்சத்து ஆலோசனை அட்டை.",
    category: 'SUBSIDY',
    applicableCrops: "All",
    applicableCropsTa: "அனைத்தும்",
    applicableDistricts: "All",
    subsidyAmount: "Free",
    sourceUrl: "https://soilhealth.dac.gov.in/",
    lastVerifiedDate: "2026-09-30"
  },
  {
    id: 6,
    name: "Rashtriya Krishi Vikas Yojana (RKVY)",
    nameTa: "ராஷ்ட்ரிய கிரிஷி விகாஸ் யோஜனா (RKVY)",
    description: "Flexible funding for state-specific agri infrastructure, value chain and innovation projects.",
    descriptionTa: "வேளாண் உள்கட்டமைப்பு மற்றும் மதிப்பு கூட்டல் திட்டங்களுக்கான நிதி உதவி.",
    category: 'SUBSIDY',
    applicableCrops: "All",
    applicableCropsTa: "அனைத்தும்",
    applicableDistricts: "All",
    subsidyAmount: "Flexible funding",
    sourceUrl: "https://www.tnagrisnet.tn.gov.in/",
    lastVerifiedDate: "2026-05-10"
  },
  {
    id: 7,
    name: "Paramparagat Krishi Vikas Yojana (PKVY) – Organic Farming",
    nameTa: "பரம்பராகத் கிரிஷி விகாஸ் யோஜனா (PKVY) - இயற்கை விவசாயம்",
    description: "Cluster-based organic farming support including certification and inputs.",
    descriptionTa: "சான்றளிப்பு மற்றும் உள்ளீடுகள் உட்பட குழு அடிப்படையிலான இயற்கை விவசாய ஆதரவு.",
    category: 'SUBSIDY',
    applicableCrops: "Vegetables, Millets, Pulses",
    applicableCropsTa: "காய்கறிகள், சிறுதானியங்கள், பருப்பு வகைகள்",
    applicableDistricts: "All",
    subsidyAmount: "Organic farming inputs and certification",
    sourceUrl: "https://pgsindia-ncof.gov.in/",
    lastVerifiedDate: "2026-04-30"
  },
  {
    id: 8,
    name: "Kisan Credit Card (KCC)",
    nameTa: "கிசான் கிரெடிட் கார்டு (KCC)",
    description: "Short-term credit for crop production and post-harvest expenses at subsidized interest.",
    descriptionTa: "மானிய வட்டி விகிதத்தில் பயிர் உற்பத்திக்கான குறுகிய கால கடன் வசதி.",
    category: 'SUBSIDY',
    applicableCrops: "All",
    applicableCropsTa: "அனைத்தும்",
    applicableDistricts: "All",
    subsidyAmount: "Subsidized credit",
    sourceUrl: "https://www.myscheme.gov.in/schemes/kcc",
    lastVerifiedDate: "2026-04-20"
  },
  {
    id: 9,
    name: "National Bamboo Mission",
    nameTa: "தேசிய மூங்கில் மிஷன்",
    description: "Support for bamboo plantation and processing infrastructure.",
    descriptionTa: "மூங்கில் தோட்டம் மற்றும் பதப்படுத்துதல் உள்கட்டமைப்புக்கான ஆதரவு.",
    category: 'SUBSIDY',
    applicableCrops: "Bamboo",
    applicableCropsTa: "மூங்கில்",
    applicableDistricts: "All",
    subsidyAmount: "Plantation support",
    sourceUrl: "https://tnhorticulture.tn.gov.in/",
    lastVerifiedDate: "2026-04-10"
  },
  {
    id: 10,
    name: "Tamil Nadu Mission on Sustainable Dryland Agriculture (TNMSDA)",
    nameTa: "தமிழ்நாடு நிலையான மானாவாரி விவசாய மிஷன் (TNMSDA)",
    description: "State mission promoting resilient dryland/rainfed cropping systems.",
    descriptionTa: "மானாவாரி விவசாய முறைகளை ஊக்குவிக்கும் மாநில மிஷன்.",
    category: 'SUBSIDY',
    applicableCrops: "Millets, Pulses, Oilseeds",
    applicableCropsTa: "சிறுதானியங்கள், பருப்பு வகைகள், எண்ணெய் வித்துக்கள்",
    applicableDistricts: "All",
    subsidyAmount: "Resilient farming support",
    sourceUrl: "https://www.tnagrisnet.tn.gov.in/",
    lastVerifiedDate: "2026-03-31"
  }
];

export const BASELINE_INSURANCE_SCHEMES: Partial<UnifiedScheme>[] = [
  {
    id: 101,
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY) - Kharif",
    nameTa: "பிரதம மந்திரி பயிர் காப்பீட்டு திட்டம் (PMFBY) - கார்/காரீஃப்",
    description: "Yield-based crop insurance scheme covering crop loss due to non-preventable natural risks during Kharif season. Premium rate is 2% of sum insured.",
    descriptionTa: "காரீஃப் பருவத்தில் இயற்கையான இடர்பாடுகளால் ஏற்படும் பயிர் இழப்பை ஈடுசெய்யும் விளைச்சல் சார்ந்த காப்பீட்டுத் திட்டம். பிரீமியம் விகிதம் 2%.",
    category: 'INSURANCE',
    schemeType: "YIELD_BASED",
    applicableCrops: "Paddy, Maize, Millets, Pulses",
    applicableCropsTa: "நெல், மக்காச்சோளம், சிறுதானியங்கள், பருப்பு வகைகள்",
    premiumRatePercentage: 2.00,
    sumInsuredPerAcre: 35000.00,
    lastVerifiedDate: "2026-09-12"
  },
  {
    id: 102,
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY) - Rabi",
    nameTa: "பிரதம மந்திரி பயிர் காப்பீட்டு திட்டம் (PMFBY) - ரபி",
    description: "Yield-based crop insurance scheme covering crop loss due to non-preventable natural risks during Rabi season. Premium rate is 1.5% of sum insured.",
    descriptionTa: "ரபி பருவத்தில் ஏற்படும் பயிர் இழப்பை ஈடுசெய்யும் காப்பீட்டுத் திட்டம். பிரீமியம் விகிதம் 1.5%.",
    category: 'INSURANCE',
    schemeType: "YIELD_BASED",
    applicableCrops: "Wheat, Barley, Mustard, Pulses",
    applicableCropsTa: "கோதுமை, பார்லி, கடுகு, பருப்பு வகைகள்",
    premiumRatePercentage: 1.50,
    sumInsuredPerAcre: 30000.00,
    lastVerifiedDate: "2026-09-02"
  },
  {
    id: 103,
    name: "Restructured Weather Based Crop Insurance Scheme (RWBCIS) - Rainfall Index",
    nameTa: "சீரமைக்கப்பட்ட வானிலை சார்ந்த பயிர் காப்பீட்டு திட்டம் (RWBCIS) - மழைக் குறியீடு",
    description: "Weather-index based insurance addressing crop losses due to adverse rainfall (deficit/excess) and temperature anomalies. Premium rate is 5.0% of sum insured.",
    descriptionTa: "மழைப்பொழிவு மாறுபாடுகளால் ஏற்படும் இழப்புகளை ஈடுசெய்யும் வானிலை குறியீட்டு காப்பீடு. பிரீமியம் 5.0%.",
    category: 'INSURANCE',
    schemeType: "WEATHER_BASED",
    applicableCrops: "Cotton, Groundnut, Sugarcane",
    applicableCropsTa: "பருத்தி, நிலக்கடலை, கரும்பு",
    premiumRatePercentage: 5.00,
    sumInsuredPerAcre: 40000.00,
    lastVerifiedDate: "2026-05-25"
  },
  {
    id: 104,
    name: "Unified Package Insurance Scheme (UPIS) - Revenue Guard",
    nameTa: "ஒருங்கிணைந்த தொகுப்பு காப்பீட்டு திட்டம் (UPIS) - வருவாய் பாதுகாப்பு",
    description: "Protects farmers against post-harvest loss and market price fluctuations. Premium rate is 4.5% of sum insured.",
    descriptionTa: "அறுவடைக்குப் பிந்தைய இழப்பு மற்றும் சந்தை விலை ஏற்ற இறக்கங்களிலிருந்து விவசாயிகளைப் பாதுகாக்கிறது.",
    category: 'INSURANCE',
    schemeType: "REVENUE_BASED",
    applicableCrops: "Banana, Mango, Turmeric, Potato, Ginger",
    applicableCropsTa: "வாழை, மாம்பழம், மஞ்சள், உருளைக்கிழங்கு, இஞ்சி",
    premiumRatePercentage: 4.50,
    sumInsuredPerAcre: 55000.00,
    lastVerifiedDate: "2026-05-15"
  },
  {
    id: 105,
    name: "Coconut Palm Insurance Scheme (CPIS)",
    nameTa: "தென்னை மர காப்பீட்டு திட்டம் (CPIS)",
    description: "Insures individual coconut palms against natural calamities, pest and disease attack, and fire damage. Offered jointly by the Coconut Development Board and empanelled insurers. Premium rate is 3.5% of sum insured.",
    descriptionTa: "இயற்கை சீற்றங்கள், பூச்சி மற்றும் நோய் தாக்குதல்களுக்கு எதிராக தென்னை மரங்களுக்கு காப்பீடு.",
    category: 'INSURANCE',
    schemeType: "YIELD_BASED",
    applicableCrops: "Coconut",
    applicableCropsTa: "தென்னை",
    premiumRatePercentage: 3.50,
    sumInsuredPerAcre: 50000.00,
    lastVerifiedDate: "2026-05-05"
  }
];

export async function fetchAllAdminSchemes(): Promise<UnifiedScheme[]> {
  let subsidiesData: any[] = [];
  let insuranceData: any[] = [];

  // Tier 1: Try Authenticated Admin Endpoints first
  const [adminSubRes, adminInsRes] = await Promise.allSettled([
    subsidyApi.get<any[]>('/api/admin/subsidies'),
    insuranceApi.get<any[]>('/api/admin/insurance'),
  ]);

  if (adminSubRes.status === 'fulfilled' && Array.isArray(adminSubRes.value.data) && adminSubRes.value.data.length > 0) {
    subsidiesData = adminSubRes.value.data;
  }
  if (adminInsRes.status === 'fulfilled' && Array.isArray(adminInsRes.value.data) && adminInsRes.value.data.length > 0) {
    insuranceData = adminInsRes.value.data;
  }

  // Tier 2: Fallback to Public Open Endpoints if admin endpoints didn't return data (e.g. 401/403/network)
  if (subsidiesData.length === 0 || insuranceData.length === 0) {
    const [pubSubRes, pubInsRes] = await Promise.allSettled([
      subsidiesData.length === 0 ? subsidyApi.get<any[]>('/api/subsidies') : Promise.resolve({ data: [] }),
      insuranceData.length === 0 ? insuranceApi.get<any[]>('/api/insurance') : Promise.resolve({ data: [] }),
    ]);

    if (subsidiesData.length === 0 && pubSubRes.status === 'fulfilled' && Array.isArray(pubSubRes.value.data) && pubSubRes.value.data.length > 0) {
      subsidiesData = pubSubRes.value.data;
    }
    if (insuranceData.length === 0 && pubInsRes.status === 'fulfilled' && Array.isArray(pubInsRes.value.data) && pubInsRes.value.data.length > 0) {
      insuranceData = pubInsRes.value.data;
    }
  }

  // Tier 3: Resilient Curated Baseline Fallback (guarantees Scheme Manager NEVER shows empty table)
  if (subsidiesData.length === 0) {
    subsidiesData = BASELINE_SUBSIDY_SCHEMES as any[];
  }
  if (insuranceData.length === 0) {
    insuranceData = BASELINE_INSURANCE_SCHEMES as any[];
  }

  const subsidies: UnifiedScheme[] = subsidiesData.map((s, idx) => ({
    id: s.id ?? idx + 1,
    name: s.name,
    nameTa: s.nameTa,
    description: s.description,
    descriptionTa: s.descriptionTa,
    category: 'SUBSIDY',
    applicableCrops: s.applicableCrops || 'All',
    applicableCropsTa: s.applicableCropsTa,
    lastVerifiedDate: s.lastVerifiedDate || null,
    applicableDistricts: s.applicableDistricts || 'All',
    subsidyAmount: s.subsidyAmount || '',
    sourceUrl: s.sourceUrl || '',
  }));

  const insurances: UnifiedScheme[] = insuranceData.map((i, idx) => ({
    id: i.id ?? 100 + idx + 1,
    name: i.name,
    nameTa: i.nameTa,
    description: i.description,
    descriptionTa: i.descriptionTa,
    category: 'INSURANCE',
    applicableCrops: i.applicableCrops || 'All',
    applicableCropsTa: i.applicableCropsTa,
    lastVerifiedDate: i.lastVerifiedDate || null,
    schemeType: i.schemeType || 'WEATHER_BASED',
    premiumRatePercentage: i.premiumRatePercentage != null ? Number(i.premiumRatePercentage) : undefined,
    sumInsuredPerAcre: i.sumInsuredPerAcre != null ? Number(i.sumInsuredPerAcre) : undefined,
  }));

  return [...subsidies, ...insurances];
}
