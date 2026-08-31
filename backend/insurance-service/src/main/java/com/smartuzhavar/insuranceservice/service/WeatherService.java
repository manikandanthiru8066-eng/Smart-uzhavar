package com.smartuzhavar.insuranceservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.smartuzhavar.insuranceservice.entity.District;
import com.smartuzhavar.insuranceservice.repository.DistrictRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WeatherService {

    private static final Logger log = LoggerFactory.getLogger(WeatherService.class);
    private static final long CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes in-memory cache

    // Static coordinate registry for all 38 Tamil Nadu districts & common name variations
    private static final Map<String, double[]> TN_COORDINATES = new HashMap<>();
    static {
        TN_COORDINATES.put("ariyalur", new double[]{11.1401, 79.0782});
        TN_COORDINATES.put("chengalpattu", new double[]{12.6841, 79.9836});
        TN_COORDINATES.put("chennai", new double[]{13.0827, 80.2707});
        TN_COORDINATES.put("coimbatore", new double[]{11.0168, 76.9558});
        TN_COORDINATES.put("cuddalore", new double[]{11.7480, 79.7714});
        TN_COORDINATES.put("dharmapuri", new double[]{12.1211, 78.1582});
        TN_COORDINATES.put("dindigul", new double[]{10.3673, 77.9803});
        TN_COORDINATES.put("erode", new double[]{11.3410, 77.7172});
        TN_COORDINATES.put("kallakurichi", new double[]{11.7384, 78.9639});
        TN_COORDINATES.put("kanchipuram", new double[]{12.8342, 79.7036});
        TN_COORDINATES.put("kancheepuram", new double[]{12.8342, 79.7036});
        TN_COORDINATES.put("kanyakumari", new double[]{8.1833, 77.4119});
        TN_COORDINATES.put("kanniyakumari", new double[]{8.1833, 77.4119});
        TN_COORDINATES.put("karur", new double[]{10.9601, 78.0766});
        TN_COORDINATES.put("krishnagiri", new double[]{12.5186, 78.2137});
        TN_COORDINATES.put("madurai", new double[]{9.9252, 78.1198});
        TN_COORDINATES.put("mayiladuthurai", new double[]{11.1018, 79.6522});
        TN_COORDINATES.put("nagapattinam", new double[]{10.7672, 79.8449});
        TN_COORDINATES.put("namakkal", new double[]{11.2189, 78.1674});
        TN_COORDINATES.put("nilgiris", new double[]{11.4102, 76.6950});
        TN_COORDINATES.put("the nilgiris", new double[]{11.4102, 76.6950});
        TN_COORDINATES.put("perambalur", new double[]{11.2342, 78.8820});
        TN_COORDINATES.put("pudukkottai", new double[]{10.3797, 78.8202});
        TN_COORDINATES.put("ramanathapuram", new double[]{9.3639, 78.8395});
        TN_COORDINATES.put("ranipet", new double[]{12.9272, 79.3331});
        TN_COORDINATES.put("salem", new double[]{11.6643, 78.1460});
        TN_COORDINATES.put("sivaganga", new double[]{9.8433, 78.4809});
        TN_COORDINATES.put("sivagangai", new double[]{9.8433, 78.4809});
        TN_COORDINATES.put("tenkasi", new double[]{8.9593, 77.3150});
        TN_COORDINATES.put("thanjavur", new double[]{10.7870, 79.1378});
        TN_COORDINATES.put("theni", new double[]{10.0104, 77.4768});
        TN_COORDINATES.put("thoothukudi", new double[]{8.7642, 78.1348});
        TN_COORDINATES.put("thoothukkudi", new double[]{8.7642, 78.1348});
        TN_COORDINATES.put("tiruchirappalli", new double[]{10.7905, 78.7047});
        TN_COORDINATES.put("trichy", new double[]{10.7905, 78.7047});
        TN_COORDINATES.put("tirunelveli", new double[]{8.7139, 77.7567});
        TN_COORDINATES.put("tirupathur", new double[]{12.4926, 78.5678});
        TN_COORDINATES.put("tirupattur", new double[]{12.4926, 78.5678});
        TN_COORDINATES.put("tiruppur", new double[]{11.1085, 77.3411});
        TN_COORDINATES.put("tiruvallur", new double[]{13.1432, 79.9080});
        TN_COORDINATES.put("thiruvallur", new double[]{13.1432, 79.9080});
        TN_COORDINATES.put("tiruvannamalai", new double[]{12.2253, 79.0747});
        TN_COORDINATES.put("tiruvarur", new double[]{10.7711, 79.6367});
        TN_COORDINATES.put("thiruvarur", new double[]{10.7711, 79.6367});
        TN_COORDINATES.put("vellore", new double[]{12.9165, 79.1325});
        TN_COORDINATES.put("viluppuram", new double[]{11.9401, 79.4861});
        TN_COORDINATES.put("villupuram", new double[]{11.9401, 79.4861});
        TN_COORDINATES.put("virudhunagar", new double[]{9.5872, 77.9604});
    }

    private final DistrictRepository districtRepository;
    private final RestTemplate restTemplate;
    private final Map<String, CachedWeatherData> cache = new ConcurrentHashMap<>();

    public WeatherService(DistrictRepository districtRepository) {
        this.districtRepository = districtRepository;
        this.restTemplate = new RestTemplate();
    }

    private static class CachedWeatherData {
        final Map<String, Object> data;
        final long timestamp;

        CachedWeatherData(Map<String, Object> data, long timestamp) {
            this.data = data;
            this.timestamp = timestamp;
        }

        boolean isExpired() {
            return System.currentTimeMillis() - timestamp > CACHE_TTL_MS;
        }
    }

    public Map<String, Object> getWeatherForDistrict(String districtName) {
        String query = (districtName != null && !districtName.trim().isEmpty()) 
                ? districtName.trim() 
                : "Thanjavur";
        String normalizedKey = query.toLowerCase();

        // 1. Check in-memory cache
        CachedWeatherData cached = cache.get(normalizedKey);
        if (cached != null && !cached.isExpired()) {
            log.info("Returning cached weather data for district: {}", normalizedKey);
            Map<String, Object> copy = new HashMap<>(cached.data);
            copy.put("cached", true);
            return copy;
        }

        // 2. Resolve district coordinates (Database -> Static registry -> Default)
        double lat = 10.7870;
        double lng = 79.1378;
        String canonicalName = query;

        Optional<District> dOpt = districtRepository.findByNameIgnoreCase(query);
        if (dOpt.isPresent()) {
            District d = dOpt.get();
            canonicalName = d.getName();
            if (d.getLatitude() != null && d.getLongitude() != null) {
                lat = d.getLatitude();
                lng = d.getLongitude();
            } else if (TN_COORDINATES.containsKey(canonicalName.toLowerCase())) {
                double[] coords = TN_COORDINATES.get(canonicalName.toLowerCase());
                lat = coords[0];
                lng = coords[1];
            }
        } else if (TN_COORDINATES.containsKey(normalizedKey)) {
            double[] coords = TN_COORDINATES.get(normalizedKey);
            lat = coords[0];
            lng = coords[1];
        }

        // 3. Call Open-Meteo live API
        try {
            String url = String.format(Locale.US,
                "https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=Asia/Kolkata",
                lat, lng
            );

            log.info("Fetching live weather from Open-Meteo for district '{}' ({}, {})", canonicalName, lat, lng);
            JsonNode root = restTemplate.getForObject(url, JsonNode.class);

            Map<String, Object> result = new HashMap<>();
            result.put("district", canonicalName);
            result.put("latitude", lat);
            result.put("longitude", lng);
            result.put("isLive", true);
            result.put("fetchedAt", Instant.now().toString());

            if (root != null && root.has("current")) {
                JsonNode current = root.get("current");
                double temp = current.has("temperature_2m") ? current.get("temperature_2m").asDouble() : 30.0;
                double humidity = current.has("relative_humidity_2m") ? current.get("relative_humidity_2m").asDouble() : 65.0;
                double rain = current.has("precipitation") ? current.get("precipitation").asDouble() : 0.0;
                double wind = current.has("wind_speed_10m") ? current.get("wind_speed_10m").asDouble() : 10.0;
                int weatherCode = current.has("weather_code") ? current.get("weather_code").asInt() : 0;

                String[] cond = decodeWeatherCode(weatherCode);

                result.put("temperatureCelsius", temp);
                result.put("humidityPercentage", humidity);
                result.put("rainfallMm", rain);
                result.put("windSpeedKmph", wind);
                result.put("condition", cond[0]);
                result.put("conditionTa", cond[1]);
                result.put("weatherCode", weatherCode);
            }

            // Parse 7-day forecast
            if (root != null && root.has("daily")) {
                JsonNode daily = root.get("daily");
                List<Map<String, Object>> forecastList = new ArrayList<>();

                if (daily.has("time") && daily.get("time").isArray()) {
                    JsonNode times = daily.get("time");
                    JsonNode maxTemps = daily.get("temperature_2m_max");
                    JsonNode minTemps = daily.get("temperature_2m_min");
                    JsonNode precip = daily.get("precipitation_sum");
                    JsonNode codes = daily.get("weather_code");

                    for (int i = 0; i < times.size(); i++) {
                        Map<String, Object> dayMap = new HashMap<>();
                        dayMap.put("date", times.get(i).asText());
                        dayMap.put("tempMax", maxTemps != null && i < maxTemps.size() ? maxTemps.get(i).asDouble() : 32.0);
                        dayMap.put("tempMin", minTemps != null && i < minTemps.size() ? minTemps.get(i).asDouble() : 24.0);
                        dayMap.put("precipitationMm", precip != null && i < precip.size() ? precip.get(i).asDouble() : 0.0);
                        
                        int code = codes != null && i < codes.size() ? codes.get(i).asInt() : 0;
                        String[] dayCond = decodeWeatherCode(code);
                        dayMap.put("weatherCode", code);
                        dayMap.put("condition", dayCond[0]);
                        dayMap.put("conditionTa", dayCond[1]);

                        forecastList.add(dayMap);
                    }
                }
                result.put("forecast", forecastList);
            }

            // Put into in-memory cache
            cache.put(normalizedKey, new CachedWeatherData(result, System.currentTimeMillis()));

            Map<String, Object> response = new HashMap<>(result);
            response.put("cached", false);
            return response;

        } catch (Exception e) {
            log.error("Failed to fetch live weather from Open-Meteo for {}: {}", canonicalName, e.getMessage(), e);
            // Fallback response if external API network issue occurs
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("district", canonicalName);
            fallback.put("latitude", lat);
            fallback.put("longitude", lng);
            fallback.put("temperatureCelsius", 31.0);
            fallback.put("humidityPercentage", 68.0);
            fallback.put("rainfallMm", 0.0);
            fallback.put("windSpeedKmph", 12.0);
            fallback.put("condition", "Partly Cloudy");
            fallback.put("conditionTa", "\u0BAA\u0B95\u0BC1\u0BA4\u0BBF \u0BAE\u0BC7\u0B95\u0BAE\u0BC2\u0B9F\u0BCD\u0B9F\u0BAE\u0BCD"); // பகுதி மேகமூட்டம்
            fallback.put("weatherCode", 2);
            fallback.put("cached", false);
            fallback.put("isLive", false);
            fallback.put("isFallback", true);
            return fallback;
        }
    }

    private String[] decodeWeatherCode(int code) {
        switch (code) {
            case 0:
                return new String[]{"Clear Sky", "\u0BA4\u0BC6\u0BB3\u0BBF\u0BB5\u0BBE\u0BA9 \u0BB5\u0BBE\u0BA9\u0BB8\u0BCD\u0BA4\u0BBF\u0BB2\u0BC8"}; // தெளிவான வானிலை
            case 1:
                return new String[]{"Mainly Clear", "\u0BAA\u0BC6\u0BB0\u0BC1\u0BAE\u0BCD\u0BAA\u0BBE\u0BB2\u0BC1\u0BAE\u0BCD \u0BA4\u0BC6\u0BB3\u0BBF\u0BB5\u0BBE\u0BA9 \u0BB5\u0BBE\u0BA9\u0BB8\u0BCD\u0BA4\u0BBF\u0BB2\u0BC8"}; // பெரும்பாலும் தெளிவான வானிலை
            case 2:
                return new String[]{"Partly Cloudy", "\u0BAA\u0B95\u0BC1\u0BA4\u0BBF \u0BAE\u0BC7\u0B95\u0BAE\u0BC2\u0B9F\u0BCD\u0B9F\u0BAE\u0BCD"}; // பகுதி மேகமூட்டம்
            case 3:
                return new String[]{"Overcast", "\u0BAE\u0BC7\u0B95\u0BAE\u0BC2\u0B9F\u0BCD\u0B9F\u0BAE\u0BCD"}; // மேகமூட்டம்
            case 45:
            case 48:
                return new String[]{"Foggy", "\u0BAA\u0BA9\u0BBF\u0BAE\u0BC2\u0B9F\u0BCD\u0B9F\u0BAE\u0BCD"}; // பனிமூட்டம்
            case 51:
            case 53:
            case 55:
                return new String[]{"Drizzle", "\u0BA4\u0BC2\u0BB1\u0BB2\u0BCD"}; // தூறல்
            case 61:
            case 63:
            case 65:
                return new String[]{"Rain", "\u0BAE\u0BB4\u0BC8"}; // மழை
            case 80:
            case 81:
            case 82:
                return new String[]{"Scattered Showers", "\u0B9A\u0BBF\u0BA4\u0BB1\u0BBF\u0BAF \u0BAE\u0BB4\u0BC8"}; // சிதறிய மழை
            case 95:
            case 96:
            case 99:
                return new String[]{"Thunderstorm", "\u0B87\u0B9F\u0BBF\u0BAF\u0BC1\u0B9F\u0BA9\u0BCD \u0B95\u0BC2\u0B9F\u0BBF\u0BAF \u0BAE\u0BB4\u0BC8"}; // இடியுடன் கூடிய மழை
            default:
                return new String[]{"Fair", "\u0BA8\u0BB2\u0BCD\u0BB2 \u0BB5\u0BBE\u0BA9\u0BB8\u0BCD\u0BA4\u0BBF\u0BB2\u0BC8"}; // நல்ல வானிலை
        }
    }
}

