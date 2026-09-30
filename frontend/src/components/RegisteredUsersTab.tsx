import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  ShieldCheck,
  MapPin,
  Search,
  Filter,
  RefreshCw,
  Download,
  Phone,
  Mail,
  Calendar,
  Building2,
  Sprout,
  X,
  ExternalLink,
  ChevronDown,
  Eye,
  Droplets,
  Layers,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import {
  AdminUser,
  AdminUsersSummary,
  fetchAdminUsers,
  exportUsersToCSV
} from '../utils/adminUsersApi';

export const RegisteredUsersTab: React.FC = () => {
  const [summary, setSummary] = useState<AdminUsersSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'FARMER' | 'ADMIN'>('ALL');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'district'>('newest');

  // Modal State for inspecting complete registered profile details on-screen
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const loadUsers = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError(null);
    try {
      const data = await fetchAdminUsers();
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to load registered users:', err);
      setError(err?.response?.data?.message || 'Failed to fetch registered users. Please check your admin privileges.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Distinct districts present in dataset for dropdown filter
  const distinctDistricts = useMemo(() => {
    if (!summary?.users) return [];
    const set = new Set<string>();
    summary.users.forEach((u) => {
      if (u.district && u.district.trim()) {
        set.add(u.district.trim());
      }
    });
    return Array.from(set).sort();
  }, [summary]);

  // Derived metrics
  const totalUsers = summary?.totalUsers ?? 0;
  const totalFarmers = summary?.totalFarmers ?? 0;
  const totalAdmins = summary?.totalAdmins ?? 0;
  const withProfileCount = useMemo(() => {
    if (!summary?.users) return 0;
    return summary.users.filter((u) => (u.district && u.district.trim()) || (u.cropProfileCount && u.cropProfileCount > 0)).length;
  }, [summary]);

  // Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    if (!summary?.users) return [];
    let list = summary.users.filter((u) => {
      // 1. Role Filter
      if (roleFilter !== 'ALL') {
        const uRole = (u.role || 'FARMER').toUpperCase();
        if (roleFilter === 'ADMIN' && uRole !== 'ADMIN') return false;
        if (roleFilter === 'FARMER' && uRole === 'ADMIN') return false;
      }

      // 2. District Filter
      if (districtFilter !== 'ALL') {
        if (!u.district || u.district.toLowerCase() !== districtFilter.toLowerCase()) {
          return false;
        }
      }

      // 3. Search Term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesUsername = u.username?.toLowerCase().includes(q);
        const matchesFullName = u.fullName?.toLowerCase().includes(q);
        const matchesPhone = u.phoneNumber?.includes(q);
        const matchesEmail = u.email?.toLowerCase().includes(q);
        const matchesDistrict = u.district?.toLowerCase().includes(q);
        const matchesTaluk = u.taluk?.toLowerCase().includes(q);
        const matchesBlock = u.block?.toLowerCase().includes(q);
        const matchesCrop = u.primaryCrop?.toLowerCase().includes(q);
        const matchesSeason = u.season?.toLowerCase().includes(q);
        const matchesIrrigation = u.irrigationType?.toLowerCase().includes(q);

        if (
          !matchesUsername &&
          !matchesFullName &&
          !matchesPhone &&
          !matchesEmail &&
          !matchesDistrict &&
          !matchesTaluk &&
          !matchesBlock &&
          !matchesCrop &&
          !matchesSeason &&
          !matchesIrrigation
        ) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === 'newest') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      }
      if (sortBy === 'oldest') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      }
      if (sortBy === 'name') {
        const nameA = a.fullName || a.username || '';
        const nameB = b.fullName || b.username || '';
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'district') {
        const distA = a.district || 'ZZZ';
        const distB = b.district || 'ZZZ';
        return distA.localeCompare(distB);
      }
      return 0;
    });

    return list;
  }, [summary, roleFilter, districtFilter, searchTerm, sortBy]);

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'Not recorded';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return 'Not recorded';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const getRelativeTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 30) return `${diffDays}d ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
      return `${Math.floor(diffDays / 365)}y ago`;
    } catch {
      return '';
    }
  };

  const getUserInitials = (user: AdminUser) => {
    const name = user.fullName || user.username || 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-600/10 text-blue-700 dark:text-blue-400 rounded-xl">
              <Users size={22} />
            </span>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Registered Users Directory
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Complete real-time directory of farmers and administrators registered on Smart Uzhavar with their regional, contact, and agricultural profiles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadUsers(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300 transition-colors"
            title="Refresh user directory"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => exportUsersToCSV(filteredUsers)}
            disabled={filteredUsers.length === 0}
            className="px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-zinc-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 text-sm font-semibold shadow-xs flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            title="Export complete registered user profiles to CSV spreadsheet"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div
          onClick={() => {
            setRoleFilter('ALL');
            setDistrictFilter('ALL');
            setSearchTerm('');
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            roleFilter === 'ALL'
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-500/20'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-semibold">
            <span>TOTAL USERS REGISTERED</span>
            <Users size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white mt-2">
            {loading ? '...' : totalUsers}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            All accounts registered so far
          </div>
        </div>

        {/* Total Farmers */}
        <div
          onClick={() => setRoleFilter('FARMER')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            roleFilter === 'FARMER'
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <span>FARMER ACCOUNTS</span>
            <UserCheck size={16} />
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {loading ? '...' : totalFarmers}
          </div>
          <div className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1">
            Registered farmers & growers
          </div>
        </div>

        {/* Total Admins */}
        <div
          onClick={() => setRoleFilter('ADMIN')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            roleFilter === 'ADMIN'
              ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 shadow-md ring-2 ring-purple-500/20'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 text-xs font-semibold">
            <span>ADMINISTRATORS</span>
            <ShieldCheck size={16} />
          </div>
          <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {loading ? '...' : totalAdmins}
          </div>
          <div className="text-xs text-purple-700/80 dark:text-purple-400/80 mt-1">
            Platform administrators
          </div>
        </div>

        {/* Profiles Configured */}
        <div className="p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <span>WITH FARM PROFILES</span>
            <MapPin size={16} />
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {loading ? '...' : withProfileCount}
          </div>
          <div className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">
            Location / crops configured
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Role Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                roleFilter === 'ALL'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              All Users ({totalUsers})
            </button>

            <button
              type="button"
              onClick={() => setRoleFilter('FARMER')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                roleFilter === 'FARMER'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                  : 'border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
            >
              Farmers ({totalFarmers})
            </button>

            <button
              type="button"
              onClick={() => setRoleFilter('ADMIN')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                roleFilter === 'ADMIN'
                  ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                  : 'border-purple-200 dark:border-purple-900/50 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
              }`}
            >
              Admins ({totalAdmins})
            </button>
          </div>

          {/* District & Sort Dropdowns */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {distinctDistricts.length > 0 && (
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="ALL">All Districts ({distinctDistricts.length})</option>
                {distinctDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="district">Sort: District</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search registered users by name, username, phone, email, district, taluk, block, or crop..."
            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Result summary indicator */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-1">
          <span>
            Showing <strong className="text-gray-900 dark:text-white">{filteredUsers.length}</strong> of{' '}
            {totalUsers} registered users
          </span>
          {(searchTerm || roleFilter !== 'ALL' || districtFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('ALL');
                setDistrictFilter('ALL');
              }}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <RefreshCw size={28} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Loading registered users directory...
          </p>
        </div>
      )}

      {/* Desktop & Tablet Users Table with Complete Profile Columns */}
      {!loading && filteredUsers.length > 0 && (
        <div className="hidden lg:block bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 dark:bg-zinc-800/60 border-b border-gray-200 dark:border-zinc-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Farmer / User</th>
                  <th className="py-3.5 px-3">Role</th>
                  <th className="py-3.5 px-3">Contact</th>
                  <th className="py-3.5 px-3">District, Taluk & Block</th>
                  <th className="py-3.5 px-3">Crop & Land</th>
                  <th className="py-3.5 px-3">Farming Profile</th>
                  <th className="py-3.5 px-3">Registered</th>
                  <th className="py-3.5 px-4 text-center">Profile Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {filteredUsers.map((user) => {
                  const isAdmin = (user.role || '').toUpperCase() === 'ADMIN';
                  return (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors cursor-pointer group"
                    >
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                              isAdmin
                                ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
                                : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                            }`}
                          >
                            {getUserInitials(user)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {user.fullName || user.username}
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                              @{user.username} • #{user.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Pill */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isAdmin
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {isAdmin ? <ShieldCheck size={12} /> : <UserCheck size={12} />}
                          {isAdmin ? 'ADMIN' : 'FARMER'}
                        </span>
                      </td>

                      {/* Contact Details */}
                      <td className="py-3.5 px-3 text-xs" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          {user.phoneNumber ? (
                            <a
                              href={`tel:${user.phoneNumber}`}
                              className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium"
                            >
                              <Phone size={13} className="text-emerald-600 shrink-0" />
                              <span>{user.phoneNumber}</span>
                            </a>
                          ) : (
                            <span className="text-gray-400 flex items-center gap-1.5">
                              <Phone size={13} /> No phone
                            </span>
                          )}

                          {user.email ? (
                            <a
                              href={`mailto:${user.email}`}
                              className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-[170px]"
                              title={user.email}
                            >
                              <Mail size={13} className="text-blue-600 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </a>
                          ) : (
                            <span className="text-gray-400 flex items-center gap-1.5">
                              <Mail size={13} /> No email
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Complete Regional Location: District, Taluk, Block */}
                      <td className="py-3.5 px-3 text-xs">
                        {user.district ? (
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                              <MapPin size={13} className="text-emerald-600 shrink-0" />
                              <span>{user.district}</span>
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 pl-4 mt-0.5 space-y-0.5">
                              {user.taluk && <div>Tk: <span className="font-medium text-gray-700 dark:text-gray-300">{user.taluk}</span></div>}
                              {user.block && <div>Blk: <span className="font-medium text-gray-700 dark:text-gray-300">{user.block}</span></div>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Not configured</span>
                        )}
                      </td>

                      {/* Primary Crop & Land Size (Acres & Ha) */}
                      <td className="py-3.5 px-3 text-xs">
                        {user.primaryCrop || user.landSizeAcres != null ? (
                          <div>
                            <div className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <Sprout size={13} className="text-emerald-600 shrink-0" />
                              <span>{user.primaryCrop || 'General Farming'}</span>
                            </div>
                            <div className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5">
                              {user.landSizeAcres != null && (
                                <span className="font-medium">{user.landSizeAcres} Acres</span>
                              )}
                              {user.landSizeHectares != null && (
                                <span className="text-gray-400 ml-1">({user.landSizeHectares} Ha)</span>
                              )}
                              {user.cropProfileCount && user.cropProfileCount > 1 ? (
                                <div className="mt-0.5">
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                                    +{user.cropProfileCount - 1} more crop(s)
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No crop profile</span>
                        )}
                      </td>

                      {/* Farming Details: Season, Irrigation, Duration */}
                      <td className="py-3.5 px-3 text-xs">
                        {user.season || user.irrigationType || user.cropDurationMonths ? (
                          <div className="space-y-0.5 text-[11px]">
                            {user.season && (
                              <div className="text-amber-700 dark:text-amber-400 font-medium">
                                Season: {user.season}
                              </div>
                            )}
                            {user.irrigationType && (
                              <div className="text-blue-700 dark:text-blue-400 flex items-center gap-1">
                                <Droplets size={11} className="shrink-0" />
                                <span>{user.irrigationType}</span>
                              </div>
                            )}
                            {user.cropDurationMonths != null && (
                              <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Clock size={11} className="shrink-0" />
                                <span>{user.cropDurationMonths} Months</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">--</span>
                        )}
                      </td>

                      {/* Registration Date */}
                      <td className="py-3.5 px-3 text-xs">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatDate(user.createdAt)}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {getRelativeTime(user.createdAt)}
                        </div>
                      </td>

                      {/* Action Button: View Profile Details */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-semibold text-xs border border-blue-200 dark:border-blue-800/60 shadow-2xs transition-all active:scale-95"
                          title="View complete farmer profile details"
                        >
                          <Eye size={13} />
                          <span>View Profile</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile & Medium Tablet Stacked Cards with Comprehensive Details */}
      {!loading && filteredUsers.length > 0 && (
        <div className="lg:hidden space-y-3">
          {filteredUsers.map((user) => {
            const isAdmin = (user.role || '').toUpperCase() === 'ADMIN';
            return (
              <div
                key={user.id}
                className="p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-3"
              >
                {/* Header: Avatar, Name, Role */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isAdmin
                          ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
                          : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                      }`}
                    >
                      {getUserInitials(user)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm">
                        {user.fullName || user.username}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        @{user.username} • #{user.id}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isAdmin
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    {isAdmin ? <ShieldCheck size={11} /> : <UserCheck size={11} />}
                    {isAdmin ? 'ADMIN' : 'FARMER'}
                  </span>
                </div>

                {/* Contact Links */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-100 dark:border-zinc-800">
                  {user.phoneNumber ? (
                    <a
                      href={`tel:${user.phoneNumber}`}
                      className="p-2 rounded-xl bg-gray-50 dark:bg-zinc-800/80 hover:bg-emerald-50 text-gray-700 dark:text-gray-300 flex items-center gap-1.5 font-medium truncate"
                    >
                      <Phone size={13} className="text-emerald-600 shrink-0" />
                      <span className="truncate">{user.phoneNumber}</span>
                    </a>
                  ) : (
                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-zinc-800/80 text-gray-400 flex items-center gap-1.5 text-[11px]">
                      <Phone size={13} /> None
                    </div>
                  )}

                  {user.email ? (
                    <a
                      href={`mailto:${user.email}`}
                      className="p-2 rounded-xl bg-gray-50 dark:bg-zinc-800/80 hover:bg-blue-50 text-gray-700 dark:text-gray-300 flex items-center gap-1.5 font-medium truncate"
                      title={user.email}
                    >
                      <Mail size={13} className="text-blue-600 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </a>
                  ) : (
                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-zinc-800/80 text-gray-400 flex items-center gap-1.5 text-[11px]">
                      <Mail size={13} /> None
                    </div>
                  )}
                </div>

                {/* Location & Crop Details Box */}
                {(user.district || user.primaryCrop) && (
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700/60 text-xs space-y-2">
                    {/* District, Taluk, Block */}
                    {user.district && (
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">
                            {user.district} District
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">
                            {user.taluk ? `${user.taluk} Taluk` : ''}
                            {user.taluk && user.block ? ' • ' : ''}
                            {user.block ? `${user.block} Block` : ''}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Crop, Land Size, Season, Irrigation */}
                    {user.primaryCrop && (
                      <div className="flex items-start gap-2 pt-1 border-t border-gray-200/60 dark:border-zinc-700/40">
                        <Sprout size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                            {user.primaryCrop}
                            {user.landSizeAcres != null ? ` (${user.landSizeAcres} Acres / ${user.landSizeHectares ?? (user.landSizeAcres * 0.404686).toFixed(2)} Ha)` : ''}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                            {user.season && <span>Season: {user.season}</span>}
                            {user.irrigationType && <span>• {user.irrigationType}</span>}
                            {user.cropDurationMonths != null && <span>• {user.cropDurationMonths} mo</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer: Registration Date & View Profile Action Button */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-gray-400">
                    <span>{formatDate(user.createdAt)}</span>
                    <span className="ml-1.5">({getRelativeTime(user.createdAt)})</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedUser(user)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all active:scale-95"
                  >
                    <Eye size={13} />
                    <span>View Profile</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredUsers.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-zinc-800 text-gray-400 flex items-center justify-center mx-auto">
            <Users size={24} />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white text-base">
            No registered users found
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {searchTerm || roleFilter !== 'ALL' || districtFilter !== 'ALL'
              ? 'No users match your active search or filters. Try adjusting your search query or reset filters.'
              : 'There are currently no registered users in the database.'}
          </p>
          {(searchTerm || roleFilter !== 'ALL' || districtFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('ALL');
                setDistrictFilter('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPLETE REGISTERED PROFILE DETAILS MODAL (FULL ON-SCREEN INSPECTION) */}
      {/* ========================================================================= */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex items-start justify-between gap-4 bg-gray-50/50 dark:bg-zinc-800/40">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-13 h-13 rounded-2xl flex items-center justify-center font-bold text-base shadow-sm ${
                    (selectedUser.role || '').toUpperCase() === 'ADMIN'
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
                      : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                  }`}
                >
                  {getUserInitials(selectedUser)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                      {selectedUser.fullName || selectedUser.username}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        (selectedUser.role || '').toUpperCase() === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {(selectedUser.role || '').toUpperCase() === 'ADMIN' ? (
                        <ShieldCheck size={12} />
                      ) : (
                        <UserCheck size={12} />
                      )}
                      {(selectedUser.role || '').toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5 flex items-center gap-2">
                    <span>@{selectedUser.username}</span>
                    <span>•</span>
                    <span>User ID #{selectedUser.id}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                title="Close profile details"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Registration Timestamp Banner */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-medium">
                  <Calendar size={15} className="text-blue-600 shrink-0" />
                  <span>
                    Registered on <strong>{formatDateTime(selectedUser.createdAt)}</strong>
                  </span>
                </div>
                <span className="text-blue-700 dark:text-blue-300 font-semibold bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800 text-[11px]">
                  {getRelativeTime(selectedUser.createdAt) || 'Recent'}
                </span>
              </div>

              {/* 1. Contact Information Card */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Phone size={13} />
                  <span>Contact Information</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Phone */}
                  <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700/60 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">Phone Number</div>
                      <div className="font-semibold text-gray-900 dark:text-white mt-0.5">
                        {selectedUser.phoneNumber || 'Not provided'}
                      </div>
                    </div>
                    {selectedUser.phoneNumber && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedUser.phoneNumber || '', 'phone')}
                          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 dark:text-gray-400 transition-colors"
                          title="Copy phone number"
                        >
                          {copiedField === 'phone' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                        <a
                          href={`tel:${selectedUser.phoneNumber}`}
                          className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 transition-colors"
                          title="Call phone"
                        >
                          <Phone size={14} />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700/60 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">Email Address</div>
                      <div className="font-semibold text-gray-900 dark:text-white mt-0.5 truncate" title={selectedUser.email || ''}>
                        {selectedUser.email || 'Not provided'}
                      </div>
                    </div>
                    {selectedUser.email && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedUser.email || '', 'email')}
                          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 dark:text-gray-400 transition-colors"
                          title="Copy email address"
                        >
                          {copiedField === 'email' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                        <a
                          href={`mailto:${selectedUser.email}`}
                          className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-200 transition-colors"
                          title="Send email"
                        >
                          <Mail size={14} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Regional Location Hierarchy Card */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <MapPin size={13} />
                  <span>Regional Location Details</span>
                </h4>
                <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                      <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">District</div>
                      <div className="font-extrabold text-gray-900 dark:text-white mt-0.5 text-base">
                        {selectedUser.district || 'Not Set'}
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                      <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Taluk</div>
                      <div className="font-extrabold text-gray-900 dark:text-white mt-0.5 text-base">
                        {selectedUser.taluk || 'Not Set'}
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                      <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Block</div>
                      <div className="font-extrabold text-gray-900 dark:text-white mt-0.5 text-base">
                        {selectedUser.block || 'Not Set'}
                      </div>
                    </div>
                  </div>

                  {selectedUser.district && (
                    <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2 pt-1">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      <span>
                        Full Jurisdiction: {selectedUser.district} &gt; {selectedUser.taluk || 'General'} &gt; {selectedUser.block || 'Block HQ'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Primary Agricultural Profile Card */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Sprout size={13} />
                  <span>Agricultural &amp; Land Profile</span>
                </h4>
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700/60 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* Primary Crop */}
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                      <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                        <Sprout size={11} className="text-emerald-600" /> Primary Crop
                      </div>
                      <div className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 text-base">
                        {selectedUser.primaryCrop || 'None'}
                      </div>
                    </div>

                    {/* Land Size (Acres) */}
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                      <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Land in Acres</div>
                      <div className="font-extrabold text-gray-900 dark:text-white mt-0.5 text-base">
                        {selectedUser.landSizeAcres != null ? `${selectedUser.landSizeAcres} Acres` : 'Not specified'}
                      </div>
                    </div>

                    {/* Land Size (Hectares) */}
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                      <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Land in Hectares</div>
                      <div className="font-extrabold text-gray-900 dark:text-white mt-0.5 text-base">
                        {selectedUser.landSizeHectares != null
                          ? `${selectedUser.landSizeHectares} Ha`
                          : selectedUser.landSizeAcres != null
                          ? `${(selectedUser.landSizeAcres * 0.404686).toFixed(2)} Ha`
                          : 'Not specified'}
                      </div>
                    </div>

                    {/* Season */}
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                      <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Primary Season</div>
                      <div className="font-semibold text-gray-900 dark:text-white mt-0.5">
                        {selectedUser.season || 'Not recorded'}
                      </div>
                    </div>

                    {/* Irrigation Type */}
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                      <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                        <Droplets size={11} className="text-blue-500" /> Irrigation Type
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white mt-0.5">
                        {selectedUser.irrigationType || 'Not recorded'}
                      </div>
                    </div>

                    {/* Crop Duration */}
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                      <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                        <Clock size={11} className="text-amber-500" /> Crop Duration
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white mt-0.5">
                        {selectedUser.cropDurationMonths != null ? `${selectedUser.cropDurationMonths} Months` : 'Not recorded'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Multiple Crop Profiles List (If multiple crops registered) */}
              {selectedUser.crops && selectedUser.crops.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Layers size={13} />
                      <span>All Registered Crop Plots ({selectedUser.crops.length})</span>
                    </h4>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      Detailed Breakdown
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedUser.crops.map((crop, idx) => (
                      <div
                        key={crop.id ?? idx}
                        className="p-3.5 bg-gray-50 dark:bg-zinc-800/70 rounded-2xl border border-gray-200 dark:border-zinc-700/80 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-gray-900 dark:text-white">
                              {crop.cropGrown || 'General Crop'}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            {crop.landSizeAcres != null ? `${crop.landSizeAcres} Acres` : ''}
                            {crop.landSizeHectares != null ? ` (${crop.landSizeHectares} Ha)` : ''}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-gray-600 dark:text-gray-300 pt-1 border-t border-gray-200/60 dark:border-zinc-700/50">
                          <div>
                            <span className="text-gray-400">Location:</span> {crop.district || selectedUser.district || '--'}
                          </div>
                          <div>
                            <span className="text-gray-400">Season:</span> {crop.season || '--'}
                          </div>
                          <div>
                            <span className="text-gray-400">Irrigation:</span> {crop.irrigationType || '--'}
                          </div>
                          <div>
                            <span className="text-gray-400">Duration:</span> {crop.cropDurationMonths ? `${crop.cropDurationMonths} mo` : '--'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const summaryText = `Farmer: ${selectedUser.fullName || selectedUser.username} (@${selectedUser.username})\nPhone: ${selectedUser.phoneNumber || 'N/A'}\nEmail: ${selectedUser.email || 'N/A'}\nLocation: ${selectedUser.district || 'N/A'}, ${selectedUser.taluk || 'N/A'}, ${selectedUser.block || 'N/A'}\nPrimary Crop: ${selectedUser.primaryCrop || 'N/A'} (${selectedUser.landSizeAcres || 0} Acres / ${selectedUser.landSizeHectares || 0} Ha)\nSeason: ${selectedUser.season || 'N/A'}\nIrrigation: ${selectedUser.irrigationType || 'N/A'}\nDuration: ${selectedUser.cropDurationMonths || 'N/A'} Months`;
                  copyToClipboard(summaryText, 'all');
                }}
                className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedField === 'all' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copiedField === 'all' ? 'Copied Profile Summary!' : 'Copy Summary'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2 rounded-xl bg-gray-900 dark:bg-zinc-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 text-xs font-bold transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisteredUsersTab;
