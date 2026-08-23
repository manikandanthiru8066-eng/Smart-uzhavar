import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { insuranceApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { TranslatedText } from '../components/TranslatedText';
import { useMachineryActivity } from '../hooks/useMachineryActivity';
import { MachineryToast } from '../components/MachineryToast';
import { Search, Users, Phone, ChevronRight, CheckCircle2, Clock, Activity } from 'lucide-react';

interface NearbyMachineryItem {
  id: number;
  name: string;
  nameTa?: string;
  type: string;
  typeTa?: string;
  district: string;
  block: string;
  ownerName: string;
  ownerPhone: string;
  ratePerHour: number;
  status: string;
}

export const MachineryPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';
  const { profile } = useAuth();

  const [machineType, setMachineType] = useState('Tractor');
  const [requiredDate, setRequiredDate] = useState('2026-08-15');
  const [village, setVillage] = useState('Kondiyur');
  const [acres, setAcres] = useState('2.5');
  
  const initialDistrict = profile?.crops?.[0]?.districtName || profile?.districtName || 'Thanjavur';
  const initialBlock = profile?.crops?.[0]?.block || profile?.block || 'Thiruvaiyaru';

  const [district, setDistrict] = useState(initialDistrict);
  const [block, setBlock] = useState(initialBlock);

  const [showGroupResult, setShowGroupResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [apiNearbyList, setApiNearbyList] = useState<NearbyMachineryItem[]>([]);

  // Real-time polling for nearby booking activity in this block
  const { latestNotification, activities, dismissNotification } = useMachineryActivity({
    block,
    district,
    enabled: true,
    pollIntervalMs: 15000,
  });

  useEffect(() => {
    if (profile?.crops && profile.crops.length > 0) {
      if (profile.crops[0].districtName) setDistrict(profile.crops[0].districtName);
      if (profile.crops[0].block) setBlock(profile.crops[0].block);
    } else if (profile?.districtName) {
      setDistrict(profile.districtName);
      if (profile.block) setBlock(profile.block);
    }
    fetchNearbyMachinery(initialDistrict, initialBlock);
  }, [profile]);

  const fetchNearbyMachinery = async (districtName: string, blockName: string) => {
    try {
      const res = await insuranceApi.get('/api/machinery/nearby', {
        params: { district: districtName, block: blockName },
      });
      if (Array.isArray(res.data)) {
        setApiNearbyList(res.data);
      }
    } catch {
      // Fallback
    }
  };

  const handleSearchNearby = async () => {
    setIsSubmitting(true);
    setRequestSuccess(null);

    try {
      // 1. Post machinery booking request to record with block & timestamp
      await insuranceApi.post('/api/machinery/request', {
        machineType,
        requiredDate,
        village,
        acres: parseFloat(acres) || 2.5,
        district,
        block,
        farmerName: profile?.fullName || profile?.username || 'Farmer',
      });

      setRequestSuccess(
        isTa
          ? `${machineType} முன்பதிவு கோரிக்கை ${block} வட்டாரத்தில் வெற்றிகரமாக பதிவு செய்யப்பட்டது!`
          : `Booking request for ${machineType} in ${block} block successfully recorded!`
      );
    } catch (err) {
      console.error('Failed to record machinery booking request:', err);
    } finally {
      setIsSubmitting(false);
    }

    setShowGroupResult(true);
    await fetchNearbyMachinery(district, block);
  };

  return (
    <div className="page-view fade-in">
      <div className="page-hd">
        <h1>{t('machineryPageTitle')}</h1>
        <p>{t('machineryPageSub')}</p>
      </div>

      {/* Machine Request Form */}
      <div className="card p-6">
        <h4 className="text-base font-semibold mb-4">{t('requestMachineTitle')}</h4>

        {requestSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>{requestSuccess}</span>
          </div>
        )}

        <div className="field-row">
          <div className="field">
            <label>{t('machineTypeLabel')}</label>
            <select
              value={machineType}
              onChange={(e) => setMachineType(e.target.value)}
            >
              <option value="Tractor">Tractor</option>
              <option value="Harvester">Harvester</option>
              <option value="Rotavator">Rotavator</option>
              <option value="Power Tiller">Power Tiller</option>
            </select>
          </div>

          <div className="field">
            <label>{t('requiredDateLabel')}</label>
            <input
              type="date"
              value={requiredDate}
              onChange={(e) => setRequiredDate(e.target.value)}
            />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>{t('villageLabel')}</label>
            <input
              placeholder="e.g. Kondiyur"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
            />
          </div>

          <div className="field">
            <label>{t('acresLabel')}</label>
            <input
              value={acres}
              onChange={(e) => setAcres(e.target.value)}
            />
          </div>
        </div>

        <button
          className="btn btn-primary btn-lg"
          onClick={handleSearchNearby}
          disabled={isSubmitting}
        >
          <Search size={16} />
          {isSubmitting
            ? (isTa ? 'பதிவு செய்யப்படுகிறது...' : 'Processing...')
            : t('searchNearbyBtn')}
        </button>

        {/* Group Result Card */}
        {showGroupResult && (
          <div className="group-result-card fade-in mt-4">
            <div className="flex justify-between items-center mb-2.5">
              <h4 className="text-sm font-semibold">
                <TranslatedText text={`3 nearby farmers found in ${block} block`} />
              </h4>
              <span className="badge badge-green">{t('combinedAcresBadge')}</span>
            </div>

            <div className="group-farmer-row">
              <span><TranslatedText text="Selvam K. — 3.0 acres" /></span>
              <span className="badge badge-neutral">{t('sameDateBadge')}</span>
            </div>
            <div className="group-farmer-row">
              <span><TranslatedText text="Rajeshwari M. — 2.0 acres" /></span>
              <span className="badge badge-neutral">{t('sameDateBadge')}</span>
            </div>
            <div className="group-farmer-row">
              <span><TranslatedText text="Palani S. — 2.0 acres" /></span>
              <span className="badge badge-neutral">{t('plusMinus1DayBadge')}</span>
            </div>

            <div className="cost-share-box">
              <span className="text-xs text-gray-600">
                {t('costShareNote')}
              </span>
              <span
                className="font-mono font-bold"
                style={{ color: 'var(--emerald-deep)' }}
              >
                ₹850 {t('perFarmerSuffix')}
              </span>
            </div>

            <button className="btn btn-primary w-full justify-center mt-3.5">
              <Users size={16} />
              {t('joinGroupBtn')}
            </button>
          </div>
        )}
      </div>

      {/* Live Recent Pooling Activity in the Block */}
      {activities.length > 0 && (
        <div className="my-6">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={18} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-ink">
              {isTa
                ? `${block} வட்டாரத்தில் அண்மைக்கால பகிர்வு முன்பதிவுகள் (24 மணி நேரம்)`
                : `Live Pooling Activity in ${block} Block (Last 24 Hours)`}
            </h3>
            <span className="badge badge-green text-[10px] ml-auto">Live</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activities.map((act) => (
              <div
                key={act.id}
                className="card p-3.5 rounded-xl border border-border/80 bg-surface flex items-start justify-between gap-2 shadow-sm hover:border-emerald-500/40 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-xs text-ink">{act.farmerName}</span>
                    <span className="badge badge-neutral text-[10px] py-0 px-1.5 font-mono">
                      {act.machineType}
                    </span>
                  </div>
                  <p className="text-xs text-ink-soft">
                    {act.village ? `${act.village} · ` : ''}{act.acres || 2.5} acres · Needed: {act.requiredDate || 'Soon'}
                  </p>
                </div>
                <span className="text-[11px] text-ink-faint flex items-center gap-1 shrink-0 font-mono">
                  <Clock size={11} />
                  {act.timeAgo}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Government Machinery Availability */}
      <h3 className="text-sm font-semibold my-5">
        {t('govtMachineryHeader')}
      </h3>
      <div className="card p-4 flex justify-between items-center mb-5">
        <span className="text-sm">
          <TranslatedText text={`Tractors and harvesters available at ${district} Custom Hiring Centre`} />
        </span>
        <span className="badge badge-green">{t('availableBadge')}</span>
      </div>

      {/* Local Tractor Owners / Service Listings */}
      <h3 className="text-sm font-semibold mb-3">{t('localOwnersHeader')}</h3>

      {apiNearbyList.length > 0 ? (
        apiNearbyList.map((item) => (
          <div
            key={item.id}
            className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5"
          >
            <div>
              <b className="text-sm"><TranslatedText text={item.name} taField={item.nameTa} /></b>
              <div className="text-xs text-gray-500">
                <TranslatedText text={item.type} taField={item.typeTa} /> · Owner: {item.ownerName} (₹{item.ratePerHour}/hr)
              </div>
            </div>
            <button className="btn btn-ghost btn-sm self-start sm:self-auto min-h-[38px]">
              <Phone size={13} />
              {item.ownerPhone}
            </button>
          </div>
        ))
      ) : (
        <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
          <div>
            <b className="text-sm"><TranslatedText text="Murugan Agro Services" /></b>
            <div className="text-xs text-gray-500">
              <TranslatedText text="Tractor + Rotavator · Custom Hiring" />
            </div>
          </div>
          <button className="btn btn-ghost btn-sm self-start sm:self-auto min-h-[38px]">
            <Phone size={13} />
            9876543210
          </button>
        </div>
      )}

      <div className="text-center mt-4">
        <button className="btn btn-ghost">
          {t('viewAllMachineryBtn')} <ChevronRight size={14} />
        </button>
      </div>

      {/* Real-time Nearby Machinery Booking Notification Toast */}
      <MachineryToast
        notification={latestNotification}
        onDismiss={dismissNotification}
      />
    </div>
  );
};
