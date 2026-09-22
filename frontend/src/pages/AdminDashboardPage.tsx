import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Edit3,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Layers,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  UnifiedScheme,
  fetchAllAdminSchemes,
  isSchemeUpToDate,
  formatVerifiedDate,
  getDaysAgoText,
  normalizeSchemeUrl,
} from '../utils/schemeUtils';
import { SchemeEditModal } from '../components/SchemeEditModal';
import { SchemeAddModal } from '../components/SchemeAddModal';

export const AdminDashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [schemes, setSchemes] = useState<UnifiedScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'needs-review' | 'up-to-date' | 'subsidies' | 'insurance'>(() => {
    return searchParams.get('filter') === 'needs-review' ? 'needs-review' : 'all';
  });

  const [editingScheme, setEditingScheme] = useState<UnifiedScheme | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const data = await fetchAllAdminSchemes();
      setSchemes(data);
    } catch (err) {
      console.error('Failed to load schemes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync activeFilter when searchParams change (e.g. user clicks staleness banner from topbar)
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'needs-review') {
      setActiveFilter('needs-review');
    }
  }, [searchParams]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Metrics
  const totalCount = schemes.length;
  const staleSchemes = useMemo(() => schemes.filter((s) => !isSchemeUpToDate(s.lastVerifiedDate)), [schemes]);
  const freshSchemes = useMemo(() => schemes.filter((s) => isSchemeUpToDate(s.lastVerifiedDate)), [schemes]);
  const staleCount = staleSchemes.length;
  const freshCount = freshSchemes.length;
  const subsidyCount = useMemo(() => schemes.filter((s) => s.category === 'SUBSIDY').length, [schemes]);
  const insuranceCount = useMemo(() => schemes.filter((s) => s.category === 'INSURANCE').length, [schemes]);

  // Filtered schemes
  const filteredSchemes = useMemo(() => {
    return schemes.filter((s) => {
      // 1. Status/Category filter
      if (activeFilter === 'needs-review' && isSchemeUpToDate(s.lastVerifiedDate)) {
        return false;
      }
      if (activeFilter === 'up-to-date' && !isSchemeUpToDate(s.lastVerifiedDate)) {
        return false;
      }
      if (activeFilter === 'subsidies' && s.category !== 'SUBSIDY') {
        return false;
      }
      if (activeFilter === 'insurance' && s.category !== 'INSURANCE') {
        return false;
      }

      // 2. Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = s.name?.toLowerCase().includes(q);
        const matchesNameTa = s.nameTa?.toLowerCase().includes(q);
        const matchesDesc = s.description?.toLowerCase().includes(q);
        const matchesCrops = s.applicableCrops?.toLowerCase().includes(q);
        if (!matchesName && !matchesNameTa && !matchesDesc && !matchesCrops) {
          return false;
        }
      }

      return true;
    });
  }, [schemes, activeFilter, searchTerm]);

  const handleEditClick = (scheme: UnifiedScheme) => {
    setEditingScheme(scheme);
    setIsEditModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-800 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-700 animate-bounce">
          <CheckCircle2 size={20} className="text-emerald-300" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 rounded-xl">
              <Layers size={22} />
            </span>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Admin Portal — Scheme Management
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Maintain subsidy and crop insurance schemes with automated staleness detection and verification stamps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300 transition-colors"
            title="Refresh schemes data"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md hover:shadow-lg flex items-center gap-2 transition-all active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>Add New Scheme</span>
          </button>
        </div>
      </div>

      {/* Staleness Overview Banner (if any stale) */}
      {staleCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <span className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5 sm:mt-0">
              <AlertCircle size={20} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                {staleCount} {staleCount === 1 ? 'Scheme Needs' : 'Schemes Need'} Review
              </h3>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                These schemes haven't been verified within the last 90 days or lack verification dates. Review and edit to update their verified status.
              </p>
            </div>
          </div>
          {activeFilter !== 'needs-review' && (
            <button
              type="button"
              onClick={() => {
                setActiveFilter('needs-review');
                setSearchParams({ filter: 'needs-review' });
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 transition-colors self-start sm:self-auto"
            >
              Filter Needs Review ({staleCount})
            </button>
          )}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div
          onClick={() => {
            setActiveFilter('all');
            setSearchParams({});
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeFilter === 'all'
              ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-semibold">
            <span>TOTAL SCHEMES</span>
            <Layers size={16} />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
            {totalCount}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {subsidyCount} Subsidies • {insuranceCount} Insurance
          </div>
        </div>

        {/* Needs Review */}
        <div
          onClick={() => {
            setActiveFilter('needs-review');
            setSearchParams({ filter: 'needs-review' });
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeFilter === 'needs-review'
              ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20 shadow-md ring-2 ring-red-500/20'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between text-red-600 dark:text-red-400 text-xs font-semibold">
            <span>NEEDS REVIEW</span>
            <ShieldAlert size={16} />
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-2">
            {staleCount}
          </div>
          <div className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
            Older than 90 days or unverified
          </div>
        </div>

        {/* Up to Date */}
        <div
          onClick={() => {
            setActiveFilter('up-to-date');
            setSearchParams({});
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeFilter === 'up-to-date'
              ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <span>UP TO DATE</span>
            <ShieldCheck size={16} />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {freshCount}
          </div>
          <div className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
            Verified within last 90 days
          </div>
        </div>

        {/* Subsidies & Insurance Count */}
        <div
          onClick={() => {
            setActiveFilter(activeFilter === 'subsidies' ? 'insurance' : 'subsidies');
            setSearchParams({});
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeFilter === 'subsidies' || activeFilter === 'insurance'
              ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-500/20'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs font-semibold">
            <span>ACTIVE FILTER</span>
            <Filter size={16} />
          </div>
          <div className="text-sm font-bold text-gray-900 dark:text-white mt-3 capitalize">
            {activeFilter.replace('-', ' ')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Showing {filteredSchemes.length} of {totalCount}
          </div>
        </div>
      </div>

      {/* Table Filter & Search Controls */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveFilter('all');
                setSearchParams({});
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                activeFilter === 'all'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                  : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              All ({totalCount})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveFilter('needs-review');
                setSearchParams({ filter: 'needs-review' });
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all ${
                activeFilter === 'needs-review'
                  ? 'bg-red-600 border-red-600 text-white shadow-sm'
                  : 'border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
              }`}
            >
              <span>Needs Review</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeFilter === 'needs-review' ? 'bg-white text-red-600' : 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300'
              }`}>
                {staleCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveFilter('up-to-date');
                setSearchParams({});
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all ${
                activeFilter === 'up-to-date'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                  : 'border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
            >
              <span>Up to Date</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeFilter === 'up-to-date' ? 'bg-white text-emerald-600' : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
              }`}>
                {freshCount}
              </span>
            </button>

            <div className="h-5 w-[1px] bg-gray-200 dark:bg-zinc-700 mx-1 hidden sm:block"></div>

            <button
              type="button"
              onClick={() => {
                setActiveFilter('subsidies');
                setSearchParams({});
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                activeFilter === 'subsidies'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              Subsidies ({subsidyCount})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveFilter('insurance');
                setSearchParams({});
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                activeFilter === 'insurance'
                  ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                  : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              Insurance ({insuranceCount})
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search scheme, crop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Scheme Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-800/80 text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-zinc-800">
              <tr>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Last Verified Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-medium">Loading scheme catalog...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSchemes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={32} className="text-gray-400" />
                      <p className="font-medium text-gray-700 dark:text-gray-300">No schemes found</p>
                      <p className="text-xs text-gray-400">
                        Try changing your filter or search criteria, or click "Add New Scheme".
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSchemes.map((scheme) => {
                  const upToDate = isSchemeUpToDate(scheme.lastVerifiedDate);
                  const daysAgoText = getDaysAgoText(scheme.lastVerifiedDate);

                  return (
                    <tr
                      key={`${scheme.category}-${scheme.id}`}
                      className="hover:bg-emerald-50/20 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      {/* Name */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <span>{scheme.name}</span>
                          {scheme.sourceUrl && (
                            <a
                              href={normalizeSchemeUrl(scheme.sourceUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-emerald-600 transition-colors"
                              title="Visit official portal"
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </div>
                        {scheme.nameTa && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {scheme.nameTa}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300">
                            Crops: {scheme.applicableCrops}
                          </span>
                          {scheme.subsidyAmount && (
                            <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                              {scheme.subsidyAmount}
                            </span>
                          )}
                          {scheme.premiumRatePercentage != null && (
                            <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                              Premium: {scheme.premiumRatePercentage}%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide ${
                            scheme.category === 'SUBSIDY'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40'
                          }`}
                        >
                          {scheme.category === 'SUBSIDY' ? '🌾 Subsidy' : '🛡️ Insurance'}
                        </span>
                      </td>

                      {/* Last Verified Date */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-gray-800 dark:text-gray-200">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{formatVerifiedDate(scheme.lastVerifiedDate)}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                          <Clock size={11} />
                          <span>{daysAgoText}</span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {upToDate ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Up to date
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border border-red-300 dark:border-red-800">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            Needs Review
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => handleEditClick(scheme)}
                          className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-gray-700 dark:text-gray-200 hover:text-emerald-700 dark:hover:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-all active:scale-[0.97]"
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Scheme Modal */}
      <SchemeEditModal
        scheme={editingScheme}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingScheme(null);
        }}
        onSuccess={() => {
          loadData();
          showToast(`Scheme "${editingScheme?.name}" successfully verified and updated to today's date!`);
        }}
      />

      {/* Add Scheme Modal */}
      <SchemeAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          loadData();
          showToast('New scheme added successfully and marked Up to date!');
        }}
      />
    </div>
  );
};

export default AdminDashboardPage;
