import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { insuranceApi } from '../api/client';
import { TranslatedText } from '../components/TranslatedText';
import { Search, Users, Phone, ChevronRight } from 'lucide-react';

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
  const { t } = useTranslation();
  const [machineType, setMachineType] = useState('Tractor');
  const [requiredDate, setRequiredDate] = useState('2026-08-15');
  const [village, setVillage] = useState('Kondiyur');
  const [acres, setAcres] = useState('2.5');
  const [district] = useState('Thanjavur');
  const [block] = useState('Thiruvaiyaru');

  const [showGroupResult, setShowGroupResult] = useState(false);
  const [apiNearbyList, setApiNearbyList] = useState<NearbyMachineryItem[]>([]);

  const handleSearchNearby = async () => {
    setShowGroupResult(true);
    try {
      const res = await insuranceApi.get('/api/machinery/nearby', {
        params: { district, block },
      });
      if (Array.isArray(res.data)) {
        setApiNearbyList(res.data);
      }
    } catch {
      // Fallback API error handler
    }
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
        >
          <Search size={16} />
          {t('searchNearbyBtn')}
        </button>

        {/* Group Result Card */}
        {showGroupResult && (
          <div className="group-result-card fade-in mt-4">
            <div className="flex justify-between items-center mb-2.5">
              <h4 className="text-sm font-semibold">
                <TranslatedText text="3 nearby farmers found in Thiruvaiyaru block" />
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

      {/* Government Machinery Availability */}
      <h3 className="text-sm font-semibold my-5">
        {t('govtMachineryHeader')}
      </h3>
      <div className="card p-4 flex justify-between items-center mb-5">
        <span className="text-sm">
          <TranslatedText text="2 tractors, 1 harvester available at Thiruvaiyaru Custom Hiring Centre" />
        </span>
        <span className="badge badge-green">{t('availableBadge')}</span>
      </div>

      {/* Local Tractor Owners / Service Listings */}
      <h3 className="text-sm font-semibold mb-3">{t('localOwnersHeader')}</h3>

      {apiNearbyList.length > 0 ? (
        apiNearbyList.map((item) => (
          <div
            key={item.id}
            className="card p-4 flex justify-between items-center mb-2.5"
          >
            <div>
              <b className="text-sm"><TranslatedText text={item.name} taField={item.nameTa} /></b>
              <div className="text-xs text-gray-500">
                <TranslatedText text={item.type} taField={item.typeTa} /> · Owner: {item.ownerName} (₹{item.ratePerHour}/hr)
              </div>
            </div>
            <button className="btn btn-ghost btn-sm">
              <Phone size={13} />
              {item.ownerPhone}
            </button>
          </div>
        ))
      ) : (
        <div className="card p-4 flex justify-between items-center mb-2.5">
          <div>
            <b className="text-sm"><TranslatedText text="Murugan Agro Services" /></b>
            <div className="text-xs text-gray-500">
              <TranslatedText text="Tractor + Rotavator · Thiruvaiyaru" />
            </div>
          </div>
          <button className="btn btn-ghost btn-sm">
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
    </div>
  );
};
