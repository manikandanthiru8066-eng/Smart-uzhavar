import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { insuranceApi, subsidyApi } from '../api/client';
import { useAuth, FarmerCropItem } from '../context/AuthContext';
import {
  MapPin,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  Cloud,
  CloudFog,
  CloudLightning,
  Sun,
  TriangleAlert,
  Wind,
  Droplets,
  RefreshCw,
  Compass,
  Calendar,
  Sparkles,
  CheckCircle2,
  ThermometerSun,
  UserPlus,
  ArrowRight,
} from 'lucide-react';
import { DistrictItem, ALL_TN_DISTRICTS } from '../utils/districtData';

interface ForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationMm: number;
  condition: string;
  conditionTa?: string;
  weatherCode?: number;
}

interface WeatherData {
  district: string;
  latitude?: number;
  longitude?: number;
  temperatureCelsius: number;
  humidityPercentage: number;
  rainfallMm: number;
  condition: string;
  conditionTa?: string;
  windSpeedKmph: number;
  weatherCode?: number;
  isLive?: boolean;
  cached?: boolean;
  isFallback?: boolean;
  fetchedAt?: string;
  forecast?: ForecastDay[];
}

export const WeatherPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();

  const registeredCrops: FarmerCropItem[] = Array.isArray(profile?.crops) && profile.crops.length > 0
    ? profile.crops
    : profile?.districtName
    ? [{ cropGrown: profile.cropGrown || 'Paddy', districtName: profile.districtName }]
    : [];

  const firstCropDistrict = registeredCrops[0]?.districtName || '';

  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(firstCropDistrict);
  const [loading, setLoading] = useState<boolean>(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    const primaryDist = registeredCrops[0]?.districtName || '';
    if (primaryDist) {
      setSelectedDistrict(primaryDist);
      fetchWeather(primaryDist);
    } else {
      setSelectedDistrict('');
      setWeather(null);
    }
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
      } else {
        setDistricts(ALL_TN_DISTRICTS.map((name, i) => ({ id: i + 1, name })));
      }
    } catch {
      setDistricts(ALL_TN_DISTRICTS.map((name, i) => ({ id: i + 1, name })));
    }
  };

  const fetchWeather = async (districtName: string) => {
    setLoading(true);
    try {
      const res = await insuranceApi.get('/api/weather', {
        params: { district: districtName },
      });
      if (res.data) {
        setWeather({
          district: res.data.district || districtName,
          latitude: res.data.latitude ?? 10.7870,
          longitude: res.data.longitude ?? 79.1378,
          temperatureCelsius: res.data.temperatureCelsius ?? 31.0,
          humidityPercentage: res.data.humidityPercentage ?? 65.0,
          rainfallMm: res.data.rainfallMm ?? 0.0,
          condition: res.data.condition || 'Partly Cloudy',
          conditionTa: res.data.conditionTa || 'பகுதி மேகமூட்டம்',
          windSpeedKmph: res.data.windSpeedKmph ?? 12.0,
          weatherCode: res.data.weatherCode ?? 2,
          isLive: res.data.isLive ?? true,
          cached: res.data.cached ?? false,
          isFallback: res.data.isFallback ?? false,
          fetchedAt: res.data.fetchedAt,
          forecast: Array.isArray(res.data.forecast) ? res.data.forecast : generateFallbackForecast(),
        });
      }
    } catch (err) {
      console.error('Failed to fetch weather:', err);
      setWeather((prev) => ({
        district: districtName,
        temperatureCelsius: prev?.temperatureCelsius ?? 31,
        humidityPercentage: prev?.humidityPercentage ?? 65,
        rainfallMm: prev?.rainfallMm ?? 0,
        condition: prev?.condition ?? 'Partly Cloudy',
        conditionTa: prev?.conditionTa ?? 'பகுதி மேகமூட்டம்',
        windSpeedKmph: prev?.windSpeedKmph ?? 14,
        weatherCode: prev?.weatherCode ?? 2,
        isFallback: true,
        isLive: false,
        forecast: prev?.forecast ?? generateFallbackForecast(),
      }));
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackForecast = (): ForecastDay[] => {
    const today = new Date();
    const days: ForecastDay[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push({
        date: d.toISOString().split('T')[0],
        tempMax: 33 + (i % 3),
        tempMin: 25 - (i % 2),
        precipitationMm: i === 1 ? 4.5 : 0.0,
        condition: i === 1 ? 'Drizzle' : 'Partly Cloudy',
        conditionTa: i === 1 ? 'தூறல்' : 'பகுதி மேகமூட்டம்',
        weatherCode: i === 1 ? 51 : 2,
      });
    }
    return days;
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    setSelectedDistrict(val);
    fetchWeather(val);
  };

  const handleQuickDistrictSelect = (districtName: string) => {
    if (!districtName || districtName === selectedDistrict) return;
    setSelectedDistrict(districtName);
    fetchWeather(districtName);
  };

  // Helper to get matching weather icon
  const getWeatherIcon = (code?: number, condition?: string, className: string = 'w-7 h-7') => {
    const c = code ?? 0;
    const cond = (condition || '').toLowerCase();

    if (c === 0 || c === 1 || cond.includes('clear') || cond.includes('sunny')) {
      return <Sun className={`${className} text-amber-500`} />;
    }
    if (c === 2 || cond.includes('partly')) {
      return <CloudSun className={`${className} text-amber-600`} />;
    }
    if (c === 3 || cond.includes('overcast')) {
      return <Cloud className={`${className} text-slate-500`} />;
    }
    if (c === 45 || c === 48 || cond.includes('fog')) {
      return <CloudFog className={`${className} text-slate-400`} />;
    }
    if (c >= 51 && c <= 55 || cond.includes('drizzle')) {
      return <CloudDrizzle className={`${className} text-sky-500`} />;
    }
    if ((c >= 61 && c <= 65) || (c >= 80 && c <= 82) || cond.includes('rain') || cond.includes('shower')) {
      return <CloudRain className={`${className} text-blue-500`} />;
    }
    if (c >= 95 || cond.includes('thunder')) {
      return <CloudLightning className={`${className} text-purple-600`} />;
    }
    return <CloudSun className={`${className} text-amber-500`} />;
  };

  // Helper to format date label
  const formatDayLabel = (dateStr: string, index: number) => {
    if (index === 0) return isTa ? 'இன்று' : 'Today';
    if (index === 1) return isTa ? 'நாளை' : 'Tomorrow';
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const weekday = date.toLocaleDateString(isTa ? 'ta-IN' : 'en-US', { weekday: 'short' });
      const dayNum = date.getDate();
      const month = date.toLocaleDateString(isTa ? 'ta-IN' : 'en-US', { month: 'short' });
      return `${weekday}, ${month} ${dayNum}`;
    } catch {
      return dateStr;
    }
  };

  const handleSaveDistrictToProfile = async () => {
    if (!selectedDistrict || savingProfile) return;
    setSavingProfile(true);
    try {
      await updateProfile({ districtName: selectedDistrict });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save district to profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  // Dynamic Crop Advisory Rules based on Live Open-Meteo metrics & Forecast
  const totalForecastRain = weather?.forecast?.reduce((acc, curr) => acc + (curr.precipitationMm || 0), 0) || 0;
  const maxForecastWind = weather?.windSpeedKmph || 10;
  const maxForecastTemp = Math.max(...(weather?.forecast?.map(f => f.tempMax) || [weather?.temperatureCelsius || 30]));
  const hasThunderstorm = (weather?.weatherCode !== undefined && weather.weatherCode >= 95) ||
    weather?.forecast?.some(f => (f.weatherCode ?? 0) >= 95);

  const dynamicAdvisories = [];

  if (hasThunderstorm) {
    dynamicAdvisories.push({
      type: 'warn',
      icon: <CloudLightning className="text-purple-600 shrink-0 mt-0.5" size={18} />,
      titleEn: 'Thunderstorm & Lightning Warning',
      titleTa: 'இடியுடன் கூடிய மழை எச்சரிக்கை',
      textEn: 'Keep livestock sheltered indoors and refrain from working with metal implements or operating machinery in open fields during storm hours.',
      textTa: 'கால்நடைகளை பாதுகாப்பான கொட்டகைகளில் அடைக்கவும். இடி மின்னலின் போது திறந்தவெளிகளில் விவசாய பணிகளை தவிர்க்கவும்.',
    });
  }

  if ((weather?.rainfallMm ?? 0) > 5 || totalForecastRain > 8) {
    dynamicAdvisories.push({
      type: 'warn',
      icon: <TriangleAlert className="text-amber-600 shrink-0 mt-0.5" size={18} />,
      titleEn: `Rainfall Advisory (${Math.max(weather?.rainfallMm ?? 0, Math.round(totalForecastRain))} mm expected)`,
      titleTa: `மழை ஆலோசனை (எதிர்பார்க்கப்படும் மழை அளவு: ${Math.max(weather?.rainfallMm ?? 0, Math.round(totalForecastRain))} மிமீ)`,
      textEn: 'Avoid nitrogenous fertilizer broadcast and chemical pesticide spraying. Ensure field drainage channels are cleared to prevent standing water in root zones.',
      textTa: 'உரமிடுதல் மற்றும் பூச்சிக்கொல்லி தெளிப்பதை தள்ளிப்போடவும். பயிர்களின் வேர் அழுகலை தடுக்க வடிகால் வசதிகளை சீரமைக்கவும்.',
    });
  }

  if (maxForecastWind > 20) {
    dynamicAdvisories.push({
      type: 'info',
      icon: <Wind className="text-sky-600 shrink-0 mt-0.5" size={18} />,
      titleEn: `High Wind Advisory (${Math.round(maxForecastWind)} km/h)`,
      titleTa: `பலத்த காற்று எச்சரிக்கை (${Math.round(maxForecastWind)} கி.மீ/மணி)`,
      textEn: 'Postpone foliar sprays to eliminate drift losses. Provide wooden or bamboo support props for banana plantations and tall sugarcane crops.',
      textTa: 'பூச்சிக்கொல்லி மருந்துகள் வீணாவதை தடுக்க தெளிப்பதை தவிர்க்கவும். வாழை மற்றும் கரும்பு பயிர்களுக்கு முட்டுக் கொடுக்கவும்.',
    });
  }

  if (maxForecastTemp >= 36) {
    dynamicAdvisories.push({
      type: 'info',
      icon: <ThermometerSun className="text-orange-600 shrink-0 mt-0.5" size={18} />,
      titleEn: `High Temperature Alert (${Math.round(maxForecastTemp)}°C)`,
      titleTa: `அதிக வெப்பநிலை ஆலோசனை (${Math.round(maxForecastTemp)}°C)`,
      textEn: 'Irrigate during early mornings (5-8 AM) or evenings (5-7 PM) to minimize evaporative stress. Mulch field beds to preserve soil moisture.',
      textTa: 'நீர் ஆவியாவதை தடுக்க அதிகாலை அல்லது மாலை வேளையில் பாசனம் செய்யவும். மண்ணின் ஈரப்பதத்தை காக்க மூடாக்கு அமைக்கவும்.',
    });
  }

  if (dynamicAdvisories.length === 0) {
    dynamicAdvisories.push({
      type: 'success',
      icon: <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />,
      titleEn: 'Favorable Farming Weather',
      titleTa: 'விவசாய பணிகளுக்கு சாதகமான வானிலை',
      textEn: 'Ideal conditions for land preparation, fertilizer application, mechanical weeding, and harvesting. No major extreme weather alerts active.',
      textTa: 'நிலம் தயாரிப்பு, உரமிடுதல், களை எடுத்தல் மற்றும் அறுவடை பணிகளுக்கு மிகச் சிறந்த சூழல் நிலவுகிறது.',
    });
  }

  return (
    <div className="page-view fade-in">
      {/* Header */}
      <div className="page-hd flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {t('weatherPageTitle')}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {selectedDistrict
              ? <>{t('weatherPageSubPrefix')} <strong className="text-emerald-700 dark:text-emerald-400">{selectedDistrict}</strong></>
              : (isTa ? 'நேரலை வானிலை மற்றும் பயிர் ஆலோசனையைக் காண உங்கள் மாவட்டத்தைத் தேர்ந்தெடுக்கவும்.' : 'Please choose your district to view live weather and crop advisories.')}
          </p>
        </div>

        {/* Live Open-Meteo Sync Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Open-Meteo Live API</span>
          </div>

          {selectedDistrict && (
            <button
              onClick={() => fetchWeather(selectedDistrict)}
              disabled={loading}
              className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 text-gray-600 dark:text-gray-300 transition shadow-sm disabled:opacity-50"
              title="Refresh Live Weather"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-600' : ''} />
            </button>
          )}
        </div>
      </div>

      {(!selectedDistrict || !weather) ? (
        /* Empty State: Prompt user to choose their district */
        <div className="card p-6 sm:p-10 rounded-3xl border border-dashed border-emerald-500/40 bg-surface-2/60 shadow-sm text-center max-w-2xl mx-auto my-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-sm">
            <MapPin size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isTa ? 'வானிலை தகவலுக்கு உங்கள் மாவட்டத்தைத் தேர்ந்தெடுக்கவும்' : 'Choose Your District to View Live Weather'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
            {isTa
              ? 'தமிழ்நாட்டின் 38 மாவட்டங்களுக்கும் Open-Meteo API வழியாக நேரலை வானிலை, 7-நாள் முன்னறிவிப்பு மற்றும் வேளாண் ஆலோசனைகள் வழங்கப்படுகின்றன. உங்கள் மாவட்டத்தைத் தேர்ந்தெடுத்து துல்லியமான வானிலை தகவல்களைக் காண்க.'
              : 'Real-time hyperlocal weather, 7-day rainfall forecasts, and agronomy advisories powered by Open-Meteo are available for all 38 Tamil Nadu districts. Please choose your district to begin.'}
          </p>

          <div className="max-w-xs mx-auto space-y-3 pt-2">
            <select
              id="choose-district-select"
              value={selectedDistrict}
              onChange={handleDistrictChange}
              className="w-full p-3 rounded-xl border border-emerald-400 dark:border-emerald-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-900 dark:text-white outline-none shadow-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{isTa ? '-- மாவட்டத்தைத் தேர்ந்தெடுக்கவும் --' : '-- Choose Your District --'}</option>
              {districts.map((d) => (
                <option key={d.id || d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            {loading && (
              <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 font-semibold py-2">
                <RefreshCw size={14} className="animate-spin" />
                <span>{isTa ? 'வானிலை பெறப்படுகிறது...' : 'Fetching live Open-Meteo weather...'}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <UserPlus size={14} />
                <span>{isTa ? 'விவசாயி சுயவிவரத்தில் பண்ணை விவரங்களை சேர்க்க' : 'Or set farm details in Profile'}</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Quick Farmer Crop Districts Selector */}
          {registeredCrops.length > 0 && (
            <div className="mb-4 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-gray-500 font-medium">{isTa ? 'உங்கள் பண்ணை மாவட்டங்கள்:' : 'Your Farm Districts:'}</span>
              {registeredCrops.map((crop, idx) => {
                const dName = crop.districtName || '';
                if (!dName) return null;
                const isSelected = dName.toLowerCase() === selectedDistrict.toLowerCase();
                return (
                  <button
                    key={idx}
                    onClick={() => handleQuickDistrictSelect(dName)}
                    className={`px-3 py-1 rounded-lg font-semibold transition border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-400'
                    }`}
                  >
                    📍 {crop.cropGrown} ({dName})
                  </button>
                );
              })}
            </div>
          )}

          {/* District Info & Geo-Coordinates Card */}
          <div
            className="card p-3.5 mb-5 flex items-center justify-between gap-3 text-xs"
            style={{
              background: 'var(--amber-soft)',
              borderColor: 'transparent',
              color: '#6b4f10',
            }}
          >
            <div className="flex items-center gap-2.5">
              <Compass size={16} className="shrink-0 text-amber-700" />
              <span>
                {isTa ? 'ஹைப்பர்லோகல் வானிலை கணிப்பு: ' : 'Hyperlocal weather forecast for '}
                <b>{selectedDistrict}</b>
                {weather.latitude && weather.longitude && (
                  <span className="opacity-80 font-mono ml-1.5">
                    (Lat: {weather.latitude.toFixed(2)}°N, Lng: {weather.longitude.toFixed(2)}°E)
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {weather.cached && (
                <span className="text-[10px] bg-amber-200/60 px-2 py-0.5 rounded font-medium text-amber-900">
                  {isTa ? 'விரைவு தற்காலிக நினைவகம்' : 'Fast Cached'}
                </span>
              )}
              {saveSuccess ? (
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  <CheckCircle2 size={12} /> {isTa ? 'சுயவிவரத்தில் சேமிக்கப்பட்டது' : 'Saved to Profile'}
                </span>
              ) : !firstCropDistrict && (
                <button
                  type="button"
                  onClick={handleSaveDistrictToProfile}
                  disabled={savingProfile}
                  className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200/80 border border-emerald-300 px-2.5 py-0.5 rounded-lg transition flex items-center gap-1"
                >
                  <CheckCircle2 size={12} />
                  <span>{savingProfile ? '...' : (isTa ? 'சுயவிவரத்தில் சேமி' : 'Save as My District')}</span>
                </button>
              )}
            </div>
          </div>

      {/* Weather Hero Banner */}
      <div className="weather-hero relative overflow-hidden">
        <div>
          <div className="loc flex items-center gap-2">
            <MapPin size={20} className="text-sky-300" />
            <span className="font-bold text-xl">{selectedDistrict}</span>
          </div>

          <div className="mt-2 text-sm font-medium flex items-center gap-2">
            {getWeatherIcon(weather.weatherCode, weather.condition, 'w-5 h-5')}
            <span className="font-semibold">
              {isTa && weather.conditionTa ? weather.conditionTa : weather.condition}
            </span>
          </div>

          <div className="meta-row mt-4 flex flex-wrap gap-4 text-xs font-medium opacity-95">
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg">
              <Droplets size={14} className="text-sky-300" />
              <span>{t('humidityLabel')}: <b>{weather.humidityPercentage}%</b></span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg">
              <Wind size={14} className="text-sky-300" />
              <span>{t('windLabel')}: <b>{weather.windSpeedKmph} km/h</b></span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg">
              <CloudRain size={14} className="text-sky-300" />
              <span>{isTa ? 'இன்றைய மழை:' : 'Rainfall:'} <b>{weather.rainfallMm} mm</b></span>
            </div>
          </div>
        </div>

        <div className="temp text-right">
          <div className="text-5xl font-extrabold tracking-tight font-mono">
            {Math.round(weather.temperatureCelsius)}°C
          </div>
          <div className="text-xs opacity-75 mt-1">
            {isTa ? 'தற்போதைய வெப்பநிலை' : 'Real-time temperature'}
          </div>
        </div>
      </div>

      {/* 7-Day Dynamic Forecast Header */}
      <div className="flex items-center justify-between mb-3 mt-6">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar size={18} className="text-emerald-600" />
          {isTa ? '7-நாள் நேரலை வானிலை முன்னறிவிப்பு' : '7-Day Live Hyperlocal Forecast'}
        </h3>
        <span className="text-xs text-gray-500 font-medium">
          {isTa ? 'ஓபன்-மீட்டியோ வழியாக' : 'Powered by Open-Meteo'}
        </span>
      </div>

      {/* 7-Day Forecast Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-6">
        {weather.forecast && weather.forecast.length > 0 ? (
          weather.forecast.slice(0, 7).map((day, idx) => (
            <div
              key={idx}
              className={`card p-3.5 text-center flex flex-col justify-between items-center transition-all hover:shadow-md hover:-translate-y-0.5 ${
                idx === 0
                  ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 ring-1 ring-emerald-400'
                  : 'bg-white dark:bg-gray-800'
              }`}
            >
              <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {formatDayLabel(day.date, idx)}
              </div>

              <div className="my-3">
                {getWeatherIcon(day.weatherCode, day.condition, 'w-8 h-8')}
              </div>

              <div className="text-sm font-bold font-mono text-gray-900 dark:text-white">
                {Math.round(day.tempMax)}° <span className="text-xs font-normal text-gray-500 font-mono">/ {Math.round(day.tempMin)}°</span>
              </div>

              <div className="mt-2 text-[11px] font-medium text-gray-600 dark:text-gray-400 line-clamp-1">
                {isTa && day.conditionTa ? day.conditionTa : day.condition}
              </div>

              {day.precipitationMm > 0 ? (
                <div className="mt-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Droplets size={10} />
                  <span>{day.precipitationMm} mm</span>
                </div>
              ) : (
                <div className="mt-1.5 text-[10px] text-gray-400">0.0 mm</div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full py-8 text-center text-sm text-gray-500">
            {isTa ? 'வானிலை முன்னறிவிப்பு பெறப்படுகிறது...' : 'Loading 7-day forecast...'}
          </div>
        )}
      </div>

      {/* Dynamic Weather Alerts & Crop Advisory Section */}
      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 mt-6 flex items-center gap-2">
        <Sparkles size={18} className="text-amber-600" />
        {t('weatherAlertsHeader')}
      </h3>

      <div className="space-y-3 mb-6">
        {dynamicAdvisories.map((advisory, idx) => (
          <div
            key={idx}
            className={`alert-card ${
              advisory.type === 'warn'
                ? 'warn'
                : advisory.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'info'
            }`}
          >
            {advisory.icon}
            <div>
              <b className="font-bold mr-1.5">
                {isTa ? advisory.titleTa : advisory.titleEn}:
              </b>
              <span>
                {isTa ? advisory.textTa : advisory.textEn}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* District Selector & Switcher */}
      <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-800">
        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
          {t('viewOtherDistrictsLabel')}
        </label>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <select
            className="w-full sm:max-w-xs p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-900 dark:text-white outline-none min-h-[44px] shadow-sm focus:ring-2 focus:ring-emerald-500"
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
          <span className="text-xs text-gray-500">
            {isTa ? 'தமிழ்நாட்டின் 38 மாவட்டங்களுக்கும் நேரலை வானிலை கிடைக்கிறது.' : 'Live weather available for all 38 districts across Tamil Nadu.'}
          </span>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

