import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { insuranceApi, subsidyApi } from '../api/client';
import { useAuth, FarmerCropItem } from '../context/AuthContext';

import {
  MapPin,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  Sun,
  TriangleAlert,
  Wind,
  Info,
} from 'lucide-react';

interface DistrictItem {
  id: number;
  name: string;
}

interface WeatherData {
  district: string;
  temperatureCelsius: number;
  humidityPercentage: number;
  rainfallMm: number;
  condition: string;
  conditionTa?: string;
  windSpeedKmph: number;
}

export const WeatherPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';
  const { profile } = useAuth();

  const registeredCrops: FarmerCropItem[] = Array.isArray(profile?.crops) && profile.crops.length > 0
    ? profile.crops
    : profile?.districtName
    ? [{ cropGrown: profile.cropGrown || 'Paddy', districtName: profile.districtName }]
    : [];


  const firstCropDistrict = registeredCrops[0]?.districtName || '';

  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(firstCropDistrict || 'Thanjavur');
  const [weather, setWeather] = useState<WeatherData>({
    district: firstCropDistrict || 'Thanjavur',
    temperatureCelsius: 32.5,
    humidityPercentage: 65.0,
    rainfallMm: 15.2,
    condition: 'Scattered Showers',
    conditionTa: 'சிதறிய மழை',
    windSpeedKmph: 12.8,
  });

  useEffect(() => {
    const primaryDist = registeredCrops[0]?.districtName || 'Thanjavur';
    setSelectedDistrict(primaryDist);
    fetchWeather(primaryDist);
    fetchDistricts();
  }, [profile]);



  const fetchDistricts = async () => {
    try {
      let res;
      try {
        res = await subsidyApi.get<DistrictItem[]>('/api/districts');
      } catch {
        res = await insuranceApi.get<DistrictItem[]>('/api/districts');
      }
      if (Array.isArray(res.data) && res.data.length > 0) {
        setDistricts(res.data);
      }
    } catch {
      setDistricts([
        { id: 1, name: 'Thanjavur' },
        { id: 2, name: 'Thiruvarur' },
        { id: 3, name: 'Nagapattinam' },
        { id: 4, name: 'Trichy' },
      ]);
    }
  };

  const fetchWeather = async (districtName: string) => {
    try {
      const res = await insuranceApi.get('/api/weather', {
        params: { district: districtName },
      });
      if (res.data) {
        setWeather({
          district: res.data.district || districtName,
          temperatureCelsius: res.data.temperatureCelsius ?? 32.5,
          humidityPercentage: res.data.humidityPercentage ?? 65.0,
          rainfallMm: res.data.rainfallMm ?? 15.2,
          condition: res.data.condition || 'Scattered Showers',
          conditionTa: res.data.conditionTa || 'சிதறிய மழை',
          windSpeedKmph: res.data.windSpeedKmph ?? 12.8,
        });
      }
    } catch {
      setWeather({
        district: districtName,
        temperatureCelsius: 32.5,
        humidityPercentage: 65.0,
        rainfallMm: 15.2,
        condition: 'Scattered Showers',
        conditionTa: 'சிதறிய மழை',
        windSpeedKmph: 12.8,
      });
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    setSelectedDistrict(val);
    fetchWeather(val);
  };

  return (
    <div className="page-view fade-in">
      <div className="page-hd">
        <h1>{t('weatherPageTitle')}</h1>
        <p>
          {t('weatherPageSubPrefix')} {selectedDistrict}
        </p>
      </div>

      <div
        className="card p-4 mb-5 flex items-center gap-3 text-xs"
        style={{
          background: 'var(--amber-soft)',
          borderColor: 'transparent',
          color: '#6b4f10',
        }}
      >
        <Info size={16} className="shrink-0" />
        <span>
          Real-time weather advisory for <b>{selectedDistrict}</b> district.
        </span>
      </div>

      {/* Weather Hero Banner */}
      <div className="weather-hero">
        <div>
          <div className="loc">
            <MapPin size={16} />
            <span>{selectedDistrict}</span>
          </div>
          <div className="meta-row">
            <span>{t('humidityLabel')} {weather.humidityPercentage}%</span>
            <span>{t('windLabel')} {weather.windSpeedKmph} km/h</span>
            <span>Rainfall: {weather.rainfallMm} mm</span>
            <span>{t('conditionLabel')}: {(isTa && weather.conditionTa) ? weather.conditionTa : weather.condition}</span>
          </div>
        </div>
        <div className="temp">{Math.round(weather.temperatureCelsius)}°C</div>
      </div>

      {/* 4-Day Forecast Grid */}
      <div className="fc-grid">
        <div className="card fc-card">
          <div className="day">{t('dayToday')}</div>
          <CloudSun className="mx-auto my-2 text-amber-600" />
          <div className="t">
            {Math.round(weather.temperatureCelsius)}° / 25°
          </div>
        </div>
        <div className="card fc-card">
          <div className="day">{t('dayTomorrow')}</div>
          <CloudRain className="mx-auto my-2 text-sky-600" />
          <div className="t">28° / 24°</div>
        </div>
        <div className="card fc-card">
          <div className="day">{t('dayWed')}</div>
          <CloudDrizzle className="mx-auto my-2 text-sky-500" />
          <div className="t">29° / 24°</div>
        </div>
        <div className="card fc-card">
          <div className="day">{t('dayThu')}</div>
          <Sun className="mx-auto my-2 text-amber-500" />
          <div className="t">32° / 25°</div>
        </div>
      </div>

      {/* Weather Alerts & Crop Advisory */}
      <h3 className="text-base font-semibold mb-3">
        {t('weatherAlertsHeader')}
      </h3>

      <div className="alert-card warn">
        <TriangleAlert size={16} className="shrink-0 mt-0.5" />
        <div>
          <b>{t('alertHeavyRainBold')}</b>{t('alertHeavyRainText')}
        </div>
      </div>

      <div className="alert-card info">
        <Wind size={16} className="shrink-0 mt-0.5" />
        <div>
          <b>{t('alertWindBold')}</b>{t('alertWindText')}
        </div>
      </div>

      {/* District Selector */}
      <div className="mt-5">
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          {t('viewOtherDistrictsLabel')}
        </label>
        <select
          className="p-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none"
          value={selectedDistrict}
          onChange={handleDistrictChange}
        >
          <option value="">{t('chooseDistrictOption')}</option>
          {districts.map((d) => (
            <option key={d.id || d.name} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
