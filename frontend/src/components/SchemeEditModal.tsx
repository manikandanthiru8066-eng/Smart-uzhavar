import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Save, ExternalLink } from 'lucide-react';
import { UnifiedScheme, normalizeSchemeUrl } from '../utils/schemeUtils';
import { subsidyApi, insuranceApi } from '../api/client';

interface SchemeEditModalProps {
  scheme: UnifiedScheme | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SchemeEditModal: React.FC<SchemeEditModalProps> = ({
  scheme,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (scheme) {
      setFormData({
        name: scheme.name || '',
        nameTa: scheme.nameTa || '',
        description: scheme.description || '',
        descriptionTa: scheme.descriptionTa || '',
        applicableCrops: scheme.applicableCrops || 'All',
        applicableCropsTa: scheme.applicableCropsTa || '',
        applicableDistricts: scheme.applicableDistricts || 'All',
        subsidyAmount: scheme.subsidyAmount || '',
        sourceUrl: scheme.sourceUrl || '',
        schemeType: scheme.schemeType || 'WEATHER_BASED',
        premiumRatePercentage: scheme.premiumRatePercentage ?? 2.0,
        sumInsuredPerAcre: scheme.sumInsuredPerAcre ?? 35000,
      });
      setError(null);
    }
  }, [scheme]);

  if (!isOpen || !scheme) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('Scheme name is required');
      return;
    }
    if (!formData.description?.trim()) {
      setError('Description is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (scheme.category === 'SUBSIDY') {
        await subsidyApi.put(`/api/admin/subsidies/${scheme.id}`, {
          name: formData.name.trim(),
          nameTa: formData.nameTa?.trim() || null,
          description: formData.description.trim(),
          descriptionTa: formData.descriptionTa?.trim() || null,
          applicableCrops: formData.applicableCrops.trim(),
          applicableCropsTa: formData.applicableCropsTa?.trim() || null,
          applicableDistricts: formData.applicableDistricts.trim(),
          subsidyAmount: formData.subsidyAmount?.trim() || '',
          sourceUrl: formData.sourceUrl?.trim() ? normalizeSchemeUrl(formData.sourceUrl.trim()) : '',
        });
      } else {
        await insuranceApi.put(`/api/admin/insurance/${scheme.id}`, {
          name: formData.name.trim(),
          nameTa: formData.nameTa?.trim() || null,
          description: formData.description.trim(),
          descriptionTa: formData.descriptionTa?.trim() || null,
          schemeType: formData.schemeType,
          applicableCrops: formData.applicableCrops.trim(),
          applicableCropsTa: formData.applicableCropsTa?.trim() || null,
          premiumRatePercentage: parseFloat(formData.premiumRatePercentage) || 0,
          sumInsuredPerAcre: parseFloat(formData.sumInsuredPerAcre) || 0,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to update scheme:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to update scheme');
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
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${
                scheme.category === 'SUBSIDY' 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
              }`}>
                {scheme.category === 'SUBSIDY' ? 'Subsidy Scheme' : 'Insurance Scheme'}
              </span>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Edit Scheme #{scheme.id}
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Updating will automatically verify this scheme and set Last Verified Date to today.
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Scheme Name (English) *
              </label>
              <input
                type="text"
                required
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
                value={formData.nameTa}
                onChange={(e) => setFormData({ ...formData, nameTa: e.target.value })}
                placeholder="திட்டத்தின் பெயர்"
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
              value={formData.descriptionTa}
              onChange={(e) => setFormData({ ...formData, descriptionTa: e.target.value })}
              placeholder="திட்ட விவரம்"
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
                value={formData.applicableCrops}
                onChange={(e) => setFormData({ ...formData, applicableCrops: e.target.value })}
                placeholder="Paddy, Sugarcane, Cotton or All"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {scheme.category === 'SUBSIDY' ? (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Applicable Districts
                </label>
                <input
                  type="text"
                  value={formData.applicableDistricts}
                  onChange={(e) => setFormData({ ...formData, applicableDistricts: e.target.value })}
                  placeholder="All or Thanjavur, Tiruvarur"
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

          {scheme.category === 'SUBSIDY' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Subsidy Amount / Coverage
                </label>
                <input
                  type="text"
                  value={formData.subsidyAmount}
                  onChange={(e) => setFormData({ ...formData, subsidyAmount: e.target.value })}
                  placeholder="e.g. 50% subsidy up to ₹25,000"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  Source URL
                  {formData.sourceUrl && (
                    <a href={normalizeSchemeUrl(formData.sourceUrl)} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                      <ExternalLink size={12} />
                    </a>
                  )}
                </label>
                <input
                  type="url"
                  value={formData.sourceUrl}
                  onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                  placeholder="https://tnhorticulture.tn.gov.in"
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
                  value={formData.sumInsuredPerAcre}
                  onChange={(e) => setFormData({ ...formData, sumInsuredPerAcre: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Verification indicator */}
          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              <strong>Automated Staleness Reset:</strong> Saving these changes will automatically stamp this scheme's last verified date as <strong>today ({new Date().toISOString().split('T')[0]})</strong>, keeping it marked <strong>Up to date</strong> for 90 days.
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
              <Save size={16} />
              <span>{loading ? 'Saving Scheme...' : 'Save & Verify Today'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchemeEditModal;
