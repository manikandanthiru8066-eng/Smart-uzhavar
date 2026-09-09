import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, FarmerCropItem } from '../context/AuthContext';
import { subsidyApi } from '../api/client';
import { User, Mail, Phone, Sprout, Plus, Trash2, Edit3, CheckCircle, AlertCircle, Save, X } from 'lucide-react';

interface DistrictItem {
  id: number;
  name: string;
}

interface TalukItem {
  id: number;
  name: string;
}

interface BlockItem {
  id: number;
  name: string;
}

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { profile, username, updateProfile, addCropProfile, updateCropProfile, deleteCropProfile } = useAuth();

  // Core Identity State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountSuccessMsg, setAccountSuccessMsg] = useState('');
  const [accountErrMsg, setAccountErrMsg] = useState('');

  // District options & Cascading Taluk/Block options
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [taluks, setTaluks] = useState<TalukItem[]>([]);
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [loadingTaluks, setLoadingTaluks] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  // Add / Edit Crop Modal State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCropId, setEditingCropId] = useState<number | null>(null);

  // New / Edit Crop Form State
  const [cropGrown, setCropGrown] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [selectedTalukId, setSelectedTalukId] = useState('');
  const [selectedTalukName, setSelectedTalukName] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [selectedBlockName, setSelectedBlockName] = useState('');
  const [block, setBlock] = useState('');
  const [landSizeAcres, setLandSizeAcres] = useState('');
  const [irrigationType, setIrrigationType] = useState('');
  const [cropDurationMonths, setCropDurationMonths] = useState('');
  const [season, setSeason] = useState('');
  const [cropSaving, setCropSaving] = useState(false);
  const [cropErrMsg, setCropErrMsg] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || profile.username || '');
      setEmail(profile.email || '');
      setPhoneNumber(profile.phoneNumber || '');

      if (!profile.crops || profile.crops.length === 0) {
        handleOpenAddCrop();
      }
    }
    fetchDistricts();
  }, [profile]);

  const fetchDistricts = async () => {
    try {
      const res = await subsidyApi.get<DistrictItem[]>('/api/districts');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const seen = new Set<string>();
        const unique = res.data.filter(d => {
          const lower = d.name.toLowerCase();
          if (seen.has(lower)) return false;
          seen.add(lower);
          return true;
        });
        setDistricts(unique);
      }
    } catch {
      setDistricts([
        { id: 1, name: 'Ariyalur' },
        { id: 2, name: 'Chengalpattu' },
        { id: 3, name: 'Chennai' },
        { id: 4, name: 'Coimbatore' },
        { id: 5, name: 'Cuddalore' },
        { id: 6, name: 'Dharmapuri' },
        { id: 7, name: 'Dindigul' },
        { id: 8, name: 'Erode' },
        { id: 9, name: 'Kallakurichi' },
        { id: 10, name: 'Kanchipuram' },
        { id: 11, name: 'Kanyakumari' },
        { id: 12, name: 'Karur' },
        { id: 13, name: 'Krishnagiri' },
        { id: 14, name: 'Madurai' },
        { id: 15, name: 'Mayiladuthurai' },
        { id: 16, name: 'Nagapattinam' },
        { id: 17, name: 'Namakkal' },
        { id: 18, name: 'Nilgiris' },
        { id: 19, name: 'Perambalur' },
        { id: 20, name: 'Pudukkottai' },
        { id: 21, name: 'Ramanathapuram' },
        { id: 22, name: 'Ranipet' },
        { id: 23, name: 'Salem' },
        { id: 24, name: 'Sivaganga' },
        { id: 25, name: 'Tenkasi' },
        { id: 26, name: 'Thanjavur' },
        { id: 27, name: 'Theni' },
        { id: 28, name: 'Thoothukudi' },
        { id: 29, name: 'Tiruchirappalli' },
        { id: 30, name: 'Tirunelveli' },
        { id: 31, name: 'Tirupathur' },
        { id: 32, name: 'Tiruppur' },
        { id: 33, name: 'Tiruvallur' },
        { id: 34, name: 'Tiruvannamalai' },
        { id: 35, name: 'Tiruvarur' },
        { id: 36, name: 'Vellore' },
        { id: 37, name: 'Viluppuram' },
        { id: 38, name: 'Virudhunagar' }
      ]);
    }
  };

  const fetchTaluksForDistrict = async (distName: string) => {
    if (!distName) {
      setTaluks([]);
      return;
    }
    setLoadingTaluks(true);
    try {
      const res = await subsidyApi.get<TalukItem[]>(`/api/districts/name/${encodeURIComponent(distName)}/taluks`);
      setTaluks(Array.isArray(res.data) ? res.data : []);
    } catch {
      setTaluks([]);
    } finally {
      setLoadingTaluks(false);
    }
  };

  const fetchBlocksForTaluk = async (talukIdStr: string) => {
    if (!talukIdStr) {
      setBlocks([]);
      return;
    }
    setLoadingBlocks(true);
    try {
      const res = await subsidyApi.get<BlockItem[]>(`/api/taluks/${talukIdStr}/blocks`);
      const fetched = Array.isArray(res.data) ? res.data : [];
      if (fetched.length === 0) {
        const foundTaluk = taluks.find(t => String(t.id) === talukIdStr);
        const fallbackName = foundTaluk ? `${foundTaluk.name} (Urban)` : 'Urban Block';
        setBlocks([{ id: parseInt(talukIdStr) * 1000, name: fallbackName }]);
      } else {
        setBlocks(fetched);
      }
    } catch {
      setBlocks([]);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const handleDistrictChange = (distName: string) => {
    setDistrictName(distName);
    setSelectedTalukId('');
    setSelectedTalukName('');
    setSelectedBlockId('');
    setSelectedBlockName('');
    setBlock('');
    setBlocks([]);
    fetchTaluksForDistrict(distName);
  };

  const handleTalukChange = (talukIdStr: string) => {
    setSelectedTalukId(talukIdStr);
    const foundTaluk = taluks.find(t => String(t.id) === talukIdStr);
    const tName = foundTaluk ? foundTaluk.name : '';
    setSelectedTalukName(tName);
    setSelectedBlockId('');
    setSelectedBlockName('');
    setBlock('');
    if (talukIdStr) {
      fetchBlocksForTaluk(talukIdStr);
    } else {
      setBlocks([]);
    }
  };

  const handleBlockChange = (blockIdStr: string) => {
    setSelectedBlockId(blockIdStr);
    const foundBlock = blocks.find(b => String(b.id) === blockIdStr);
    const bName = foundBlock ? foundBlock.name : '';
    setSelectedBlockName(bName);
    setBlock(bName);
  };

  // Save Core Personal Account Details
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAccount(true);
    setAccountSuccessMsg('');
    setAccountErrMsg('');

    try {
      await updateProfile({
        fullName,
        email,
        phoneNumber,
      });
      setAccountSuccessMsg('Farmer account details updated successfully!');
    } catch (err: any) {
      setAccountErrMsg(err?.response?.data?.message || 'Failed to update personal details.');
    } finally {
      setSavingAccount(false);
    }
  };

  // Open Form for NEW Crop - STARTS COMPLETELY BLANK
  const handleOpenAddCrop = () => {
    setEditingCropId(null);
    setCropGrown('');
    setDistrictName('');
    setSelectedTalukId('');
    setSelectedTalukName('');
    setSelectedBlockId('');
    setSelectedBlockName('');
    setBlock('');
    setTaluks([]);
    setBlocks([]);
    setLandSizeAcres('');
    setIrrigationType('');
    setCropDurationMonths('');
    setSeason('');
    setCropErrMsg('');
    setShowAddForm(true);
  };

  // Open Form to EDIT existing Crop
  const handleOpenEditCrop = async (cropItem: FarmerCropItem) => {
    if (!cropItem.id) return;
    setEditingCropId(cropItem.id);
    setCropGrown(cropItem.cropGrown || '');
    const dist = cropItem.districtName || '';
    setDistrictName(dist);
    setLandSizeAcres(cropItem.landSizeAcres ? String(cropItem.landSizeAcres) : '');
    setIrrigationType(cropItem.irrigationType || '');
    setCropDurationMonths(cropItem.cropDurationMonths ? String(cropItem.cropDurationMonths) : '');
    setSeason(cropItem.season || '');
    setCropErrMsg('');

    if (dist) {
      await fetchTaluksForDistrict(dist);
    }

    if (cropItem.talukId) {
      const tId = String(cropItem.talukId);
      setSelectedTalukId(tId);
      setSelectedTalukName(cropItem.talukName || '');
      await fetchBlocksForTaluk(tId);
    } else {
      setSelectedTalukId('');
      setSelectedTalukName(cropItem.talukName || '');
    }

    if (cropItem.blockId) {
      setSelectedBlockId(String(cropItem.blockId));
      setSelectedBlockName(cropItem.block || '');
      setBlock(cropItem.block || '');
    } else {
      setSelectedBlockId('');
      setSelectedBlockName(cropItem.block || '');
      setBlock(cropItem.block || '');
    }

    setShowAddForm(true);
  };

  // Save (Add or Update) Crop Profile
  const handleSaveCropProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setCropSaving(true);
    setCropErrMsg('');

    const finalBlockName = selectedBlockName || block;

    if (!cropGrown || !districtName || !selectedTalukId || !finalBlockName || !landSizeAcres || !irrigationType || !cropDurationMonths || !season) {
      setCropErrMsg('Please select your District, Taluk, and Block from the cascading dropdowns.');
      setCropSaving(false);
      return;
    }

    const payload = {
      cropGrown,
      districtName,
      talukId: selectedTalukId ? parseInt(selectedTalukId) : undefined,
      talukName: selectedTalukName,
      blockId: selectedBlockId ? parseInt(selectedBlockId) : undefined,
      block: finalBlockName,
      landSizeAcres: parseFloat(landSizeAcres) || 1.0,
      irrigationType,
      cropDurationMonths: parseInt(cropDurationMonths) || 4,
      season,
    };

    try {
      if (editingCropId !== null) {
        await updateCropProfile(editingCropId, payload);
      } else {
        await addCropProfile(payload);
      }
      setShowAddForm(false);
    } catch (err: any) {
      setCropErrMsg(err?.response?.data?.message || 'Failed to save crop profile.');
    } finally {
      setCropSaving(false);
    }
  };

  // Delete specific Crop Profile
  const handleDeleteCrop = async (id?: number) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this crop profile?')) return;
    try {
      await deleteCropProfile(id);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete crop profile.');
    }
  };

  const registeredCrops: FarmerCropItem[] = Array.isArray(profile?.crops) ? profile.crops : [];

  return (
    <div className="page-view fade-in">
      <div className="page-hd mb-6">
        <h1>{t('completeProfileTitle')}</h1>
        <p>{t('completeProfileSub')}</p>
      </div>

      {/* SECTION 1: Farmer Core Account Information */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
          <User className="text-emerald-700" size={20} />
          <h3 className="text-base font-bold text-gray-900">Farmer Account Identity</h3>
          <span className="text-xs text-gray-400 font-medium ml-auto">(Fixed for login account)</span>
        </div>

        {accountSuccessMsg && (
          <div className="p-3 mb-4 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
            <CheckCircle size={16} /> {accountSuccessMsg}
          </div>
        )}
        {accountErrMsg && (
          <div className="p-3 mb-4 text-xs font-semibold text-red-800 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertCircle size={16} /> {accountErrMsg}
          </div>
        )}

        <form onSubmit={handleSaveAccount}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="field">
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t('usernameLabel')}</label>
              <div className="relative flex items-center">
                <User size={16} className="absolute left-3 text-gray-400 pointer-events-none z-10" />
                <input
                  type="text"
                  value={profile?.username || username || ''}
                  disabled
                  className="w-full has-icon pl-10 pr-3.5 py-2.5 bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="field">
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t('fullNameLabel')} *</label>
              <div className="relative flex items-center">
                <User size={16} className="absolute left-3 text-gray-400 pointer-events-none z-10" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full has-icon pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="field">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3 text-gray-400 pointer-events-none z-10" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@example.com"
                  className="w-full has-icon pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            <div className="field">
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t('phoneLabel')}</label>
              <div className="relative flex items-center">
                <Phone size={16} className="absolute left-3 text-gray-400 pointer-events-none z-10" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full has-icon pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingAccount}
            className="btn btn-primary btn-md flex items-center gap-2 cursor-pointer"
          >
            <Save size={16} />
            {savingAccount ? 'Saving...' : 'Save Personal Details'}
          </button>
        </form>
      </div>

      {/* SECTION 2: Crop Profiles List & Add Crop Form */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Sprout className="text-emerald-700" size={20} />
            <h3 className="text-base font-bold text-gray-900">
              Cultivated Crop Profiles ({registeredCrops.length})
            </h3>
          </div>

          {!showAddForm && (
            <button
              onClick={handleOpenAddCrop}
              className="btn btn-primary btn-sm flex items-center gap-1 cursor-pointer font-bold"
            >
              <Plus size={16} /> Add Crop Profile
            </button>
          )}
        </div>

        {/* Form Modal / Inline Card for adding or editing a crop profile */}
        {showAddForm && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
              <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <Sprout size={16} className="text-emerald-700" />
                {editingCropId !== null ? 'Edit Crop Profile' : 'Add New Crop Profile'}
              </h4>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {cropErrMsg && (
              <div className="p-3 mb-3 text-xs font-semibold text-red-800 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                <AlertCircle size={15} /> {cropErrMsg}
              </div>
            )}

            <form onSubmit={handleSaveCropProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="field">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t('cropLabel')} *</label>
                  <select
                    value={cropGrown}
                    onChange={(e) => setCropGrown(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="" disabled>-- Select Crop --</option>
                    <option value="Paddy">Paddy (Rice)</option>
                    <option value="Sugarcane">Sugarcane</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Banana">Banana</option>
                    <option value="Groundnut">Groundnut</option>
                    <option value="Maize">Maize</option>
                    <option value="Pulses">Pulses / Grams</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Coconut">Coconut</option>
                    <option value="Turmeric">Turmeric</option>
                  </select>
                </div>

                <div className="field">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t('districtLabel')} *</label>
                  <select
                    value={districtName}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="" disabled>-- Select District --</option>
                    {districts.map((d) => (
                      <option key={d.id || d.name} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CASCADING TALUK & BLOCK DROPDOWNS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="field">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Taluk * {loadingTaluks && <span className="text-emerald-600 animate-pulse">(Loading...)</span>}
                  </label>
                  <select
                    value={selectedTalukId}
                    onChange={(e) => handleTalukChange(e.target.value)}
                    disabled={!districtName || loadingTaluks}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="" disabled>
                      {!districtName ? '-- Select District First --' : loadingTaluks ? '-- Loading Taluks... --' : '-- Select Taluk --'}
                    </option>
                    {taluks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Block * {loadingBlocks && <span className="text-emerald-600 animate-pulse">(Loading...)</span>}
                  </label>
                  <select
                    value={selectedBlockId}
                    onChange={(e) => handleBlockChange(e.target.value)}
                    disabled={!selectedTalukId || loadingBlocks}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="" disabled>
                      {!selectedTalukId ? '-- Select Taluk First --' : loadingBlocks ? '-- Loading Blocks... --' : '-- Select Block --'}
                    </option>
                    {blocks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="field">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Land Size (Acres) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={landSizeAcres}
                    onChange={(e) => setLandSizeAcres(e.target.value)}
                    placeholder="e.g. 2.5"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="field">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Irrigation Type *</label>
                  <select
                    value={irrigationType}
                    onChange={(e) => setIrrigationType(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="" disabled>-- Select Irrigation Type --</option>
                    <option value="Canal">Canal / River</option>
                    <option value="Borewell">Borewell / Well</option>
                    <option value="Drip/Sprinkler">Drip / Sprinkler</option>
                    <option value="Rainfed">Rainfed</option>
                  </select>
                </div>

                <div className="field">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (Months) *</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={cropDurationMonths}
                    onChange={(e) => setCropDurationMonths(e.target.value)}
                    placeholder="e.g. 4"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="field mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cropping Season *</label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="" disabled>-- Select Season --</option>
                  <option value="Kharif">Kharif (Monsoon / Kuruvai)</option>
                  <option value="Rabi">Rabi (Winter / Samba)</option>
                  <option value="Zaid">Zaid (Summer / Thaladi)</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  disabled={cropSaving}
                  className="btn btn-primary btn-md flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                >
                  <Save size={16} />
                  {cropSaving ? 'Saving...' : editingCropId !== null ? 'Update Crop' : 'Save Crop Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn btn-ghost btn-md cursor-pointer justify-center w-full sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Existing Crop Cards List */}
        {registeredCrops.length === 0 && !showAddForm ? (
          <div className="text-center p-8 bg-emerald-50/60 rounded-2xl border border-emerald-200">
            <Sprout className="mx-auto text-emerald-600 mb-2" size={36} />
            <h4 className="text-base font-bold text-emerald-950 mb-1">Welcome! Add Your First Crop Profile</h4>
            <p className="text-xs text-gray-600 mb-4 max-w-md mx-auto">
              You haven't added any crop profiles yet. Please add your first crop profile to unlock personalized subsidy, insurance, weather forecasts, and custom machinery options.
            </p>
            <button onClick={handleOpenAddCrop} className="btn btn-primary btn-md flex items-center gap-2 mx-auto font-bold cursor-pointer">
              <Plus size={16} /> Add Crop Profile #1
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registeredCrops.map((c, i) => {
              const cropAcres = c.landSizeAcres || (c.landSizeHectares ? Number((c.landSizeHectares * 2.47105).toFixed(1)) : 2.5);
              return (
                <div
                  key={c.id || i}
                  className="p-5 bg-white border border-emerald-100 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
                        {i === 0 ? 'Crop Profile 1' : `Crop Profile ${i + 1}`}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {cropAcres} Acres
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-gray-900 mb-3">{c.cropGrown || 'Paddy'}</h4>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50/80 p-3 rounded-xl mb-4">
                      <div>📍 <strong>District:</strong> {c.districtName || 'Thanjavur'}</div>
                      <div>🏘️ <strong>Block:</strong> {c.block || 'Central Block'}</div>
                      <div>🌧️ <strong>Irrigation:</strong> {c.irrigationType || 'Canal'}</div>
                      <div>⏱️ <strong>Duration:</strong> {c.cropDurationMonths || 4} Months</div>
                      <div className="col-span-2">☀️ <strong>Season:</strong> {c.season || 'Kharif'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleOpenEditCrop(c)}
                      className="flex-1 py-1.5 px-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCrop(c.id)}
                      className="py-1.5 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
