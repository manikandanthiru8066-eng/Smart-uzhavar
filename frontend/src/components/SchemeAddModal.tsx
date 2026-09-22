import React, { useState } from 'react';
import { X, Plus, AlertTriangle, CheckCircle } from 'lucide-react';
import { SchemeCategory, normalizeSchemeUrl } from '../utils/schemeUtils';
import { subsidyApi, insuranceApi } from '../api/client';

interface SchemeAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SchemeAddModal: React.FC<SchemeAddModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [category, setCategory] = useState<SchemeCategory>('SUBSIDY');
  const [formData, setFormData] = useState({
    name: '',
    nameTa: '',
    description: '',
    descriptionTa: '',
    applicableCrops: 'All',
    applicableCropsTa: '',
    applicableDistricts: 'All',
    subsidyAmount: '',
    sourceUrl: '',
    schemeType: 'WEATHER_BASED',
    premiumRatePercentage: '2.00',
    sumInsuredPerAcre: '30000',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData({
      name: '',
      nameTa: '',
      description: '',
      descriptionTa: '',
      applicableCrops: 'All',
      applicableCropsTa: '',
      applicableDistricts: 'All',
      subsidyAmount: '',
      sourceUrl: '',
      schemeType: 'WEATHER_BASED',
      premiumRatePercentage: '2.00',
      sumInsuredPerAcre: '30000',
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Scheme name is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (category === 'SUBSIDY') {
        await subsidyApi.post('/api/admin/subsidies', {
          name: formData.name.trim(),
          nameTa: formData.nameTa.trim() || null,
          description: formData.description.trim(),
          descriptionTa: formData.descriptionTa.trim() || null,
          applicableCrops: formData.applicableCrops.trim(),
          applicableCropsTa: formData.applicableCropsTa.trim() || null,
          applicableDistricts: formData.applicableDistricts.trim(),
          subsidyAmount: formData.subsidyAmount.trim() || null,
          sourceUrl: formData.sourceUrl.trim() ? normalizeSchemeUrl(formData.sourceUrl.trim()) : null,
        });
      } else {
        await insuranceApi.post('/api/admin/insurance', {
          name: formData.name.trim(),
          nameTa: formData.nameTa.trim() || null,
          description: formData.description.trim(),
          descriptionTa: formData.descriptionTa.trim() || null,
          schemeType: formData.schemeType,
          applicableCrops: formData.applicableCrops.trim(),
          applicableCropsTa: formData.applicableCropsTa.trim() || null,
          premiumRatePercentage: parseFloat(formData.premiumRatePercentage) || 0,
          sumInsuredPerAcre: parseFloat(formData.sumInsuredPerAcre) || 0,
        });
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create scheme:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to create scheme');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-emerald-900/10 dark:border-emerald-500/20 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 bg-emerald-600 text-white rounded-lg">
                <Plus size={16} />
              </span>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Add New Scheme
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Create a new scheme entry directly in the system. Last verified date will be set to today.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-xl text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Category Selector Tabs */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Scheme Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCategory('SUBSIDY')}
                className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                  category === 'SUBSIDY'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-semibold ring-2 ring-emerald-600/20'
                    : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                🌾 Subsidy Scheme
              </button>
              <button
                type="button"
                onClick={() => setCategory('INSURANCE')}
                className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                  category === 'INSURANCE'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-semibold ring-2 ring-emerald-600/20'
                    : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                🛡️ Insurance Scheme
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Scheme Name (English) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. PM-KUSUM Solar Pump Scheme"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Scheme Name (Tamil)
              </label>
              <input
                type="text"
                placeholder="திட்டத்தின் பெயர்"
                value={formData.nameTa}
                onChange={(e) => setFormData({ ...formData, nameTa: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Description (English) *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Provide a comprehensive description of the scheme, eligibility, and benefits..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Description (Tamil)
            </label>
            <textarea
              rows={2}
              placeholder="திட்ட விவரம்"
              value={formData.descriptionTa}
              onChange={(e) => setFormData({ ...formData, descriptionTa: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Applicable Crops (Comma-separated or 'All') *
              </label>
              <input
                type="text"
                required
                placeholder="Paddy, Sugarcane or All"
                value={formData.applicableCrops}
                onChange={(e) => setFormData({ ...formData, applicableCrops: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {category === 'SUBSIDY' ? (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Applicable Districts
                </label>
                <input
                  type="text"
                  placeholder="All or Thanjavur, Madurai"
                  value={formData.applicableDistricts}
                  onChange={(e) => setFormData({ ...formData, applicableDistricts: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Scheme Type *
                </label>
                <select
                  value={formData.schemeType}
                  onChange={(e) => setFormData({ ...formData, schemeType: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="WEATHER_BASED">WEATHER_BASED</option>
                  <option value="YIELD_BASED">YIELD_BASED</option>
                  <option value="REVENUE_BASED">REVENUE_BASED</option>
                </select>
              </div>
            )}
          </div>

          {category === 'SUBSIDY' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Subsidy Amount / Coverage
                </label>
                <input
                  type="text"
                  placeholder="e.g. Up to 60% capital subsidy"
                  value={formData.subsidyAmount}
                  onChange={(e) => setFormData({ ...formData, subsidyAmount: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Source Official URL
                </label>
                <input
                  type="url"
                  placeholder="https://tnhorticulture.tn.gov.in"
                  value={formData.sourceUrl}
                  onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Premium Rate (%) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  placeholder="2.00"
                  value={formData.premiumRatePercentage}
                  onChange={(e) => setFormData({ ...formData, premiumRatePercentage: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Sum Insured Per Acre (₹) *
                </label>
                <input
                  type="number"
                  step="100"
                  min="0"
                  required
                  placeholder="30000"
                  value={formData.sumInsuredPerAcre}
                  onChange={(e) => setFormData({ ...formData, sumInsuredPerAcre: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              New schemes are created with Last Verified Date set to <strong>today ({new Date().toISOString().split('T')[0]})</strong> and immediately marked <strong>Up to date</strong>.
            </span>
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Plus size={16} />
              <span>{loading ? 'Creating Scheme...' : 'Create New Scheme'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchemeAddModal;
