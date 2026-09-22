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

export async function fetchAllAdminSchemes(): Promise<UnifiedScheme[]> {
  const [subsidyRes, insuranceRes] = await Promise.all([
    subsidyApi.get<any[]>('/api/admin/subsidies').catch(() => ({ data: [] })),
    insuranceApi.get<any[]>('/api/admin/insurance').catch(() => ({ data: [] })),
  ]);

  const subsidies: UnifiedScheme[] = (subsidyRes.data || []).map((s) => ({
    id: s.id,
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

  const insurances: UnifiedScheme[] = (insuranceRes.data || []).map((i) => ({
    id: i.id,
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
