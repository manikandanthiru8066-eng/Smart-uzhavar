import { subsidyApi } from '../api/client';

export interface AdminCropProfile {
  id?: number;
  cropGrown?: string | null;
  district?: string | null;
  taluk?: string | null;
  block?: string | null;
  landSizeAcres?: number | null;
  landSizeHectares?: number | null;
  irrigationType?: string | null;
  cropDurationMonths?: number | null;
  season?: string | null;
}

export interface AdminUser {
  id: number;
  username: string;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  role: string;
  createdAt?: string | null;
  district?: string | null;
  taluk?: string | null;
  block?: string | null;
  primaryCrop?: string | null;
  landSizeAcres?: number | null;
  landSizeHectares?: number | null;
  irrigationType?: string | null;
  cropDurationMonths?: number | null;
  season?: string | null;
  cropProfileCount?: number;
  crops?: AdminCropProfile[];
}

export interface AdminUsersSummary {
  totalUsers: number;
  totalFarmers: number;
  totalAdmins: number;
  users: AdminUser[];
}

/**
 * Fetches all registered users and basic details (requires ADMIN role)
 */
export async function fetchAdminUsers(): Promise<AdminUsersSummary> {
  const response = await subsidyApi.get<AdminUsersSummary>('/api/admin/users');
  return response.data;
}

/**
 * Exports user records to CSV file download
 */
export function exportUsersToCSV(users: AdminUser[], filename = 'smart_uzhavar_registered_users.csv'): void {
  const headers = [
    'ID',
    'Username',
    'Full Name',
    'Role',
    'Phone Number',
    'Email',
    'District',
    'Taluk',
    'Block',
    'Primary Crop',
    'Land Size (Acres)',
    'Land Size (Hectares)',
    'Irrigation Type',
    'Season',
    'Crop Duration (Months)',
    'Total Crop Profiles',
    'Registered Date'
  ];

  const rows = users.map((u) => [
    u.id,
    `"${(u.username || '').replace(/"/g, '""')}"`,
    `"${(u.fullName || '').replace(/"/g, '""')}"`,
    u.role || 'FARMER',
    `"${(u.phoneNumber || '').replace(/"/g, '""')}"`,
    `"${(u.email || '').replace(/"/g, '""')}"`,
    `"${(u.district || 'Not Set').replace(/"/g, '""')}"`,
    `"${(u.taluk || '').replace(/"/g, '""')}"`,
    `"${(u.block || '').replace(/"/g, '""')}"`,
    `"${(u.primaryCrop || '').replace(/"/g, '""')}"`,
    u.landSizeAcres != null ? u.landSizeAcres : '',
    u.landSizeHectares != null ? u.landSizeHectares : '',
    `"${(u.irrigationType || '').replace(/"/g, '""')}"`,
    `"${(u.season || '').replace(/"/g, '""')}"`,
    u.cropDurationMonths != null ? u.cropDurationMonths : '',
    u.cropProfileCount ?? (u.crops ? u.crops.length : 0),
    u.createdAt ? new Date(u.createdAt).toISOString() : ''
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
