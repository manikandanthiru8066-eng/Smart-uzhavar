package com.smartuzhavar.insuranceservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.smartuzhavar.insuranceservice.entity.District;
import com.smartuzhavar.insuranceservice.repository.DistrictRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WeatherService {

    private static final Logger log = LoggerFactory.getLogger(WeatherService.class);
    private static final long CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes in-memory cache

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
        String key = (districtName != null && !districtName.trim().isEmpty()) 
                ? districtName.trim().toLowerCase() 
                : "thanjavur";

        // 1. Check in-memory cache
        CachedWeatherData cached = cache.get(key);
        if (cached != null && !cached.isExpired()) {
            log.info("Returning cached weather data for district: {}", key);
            Map<String, Object> copy = new HashMap<>(cached.data);
            copy.put("cached", true);
            return copy;
        }

        // 2. Lookup district coordinates
        double lat = 10.7870;
        double lng = 79.1378;
        String canonicalName = "Thanjavur";

        if (districtName != null && !districtName.trim().isEmpty()) {
            Optional<District> dOpt = districtRepository.findByNameIgnoreCase(districtName.trim());
            if (dOpt.isPresent()) {
                District d = dOpt.get();
                canonicalName = d.getName();
                if (d.getLatitude() != null && d.getLongitude() != null) {
                    lat = d.getLatitude();
                    lng = d.getLongitude();
                }
            } else {
                canonicalName = districtName.trim();
            }
        }

        // 3. Call Open-Meteo live API
        try {
            String url = String.format(Locale.US,
                "https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=Asia/Kolkata",
                lat, lng
            );

            log.info("Fetching live weather from Open-Meteo API for district '{}' ({}, {})", canonicalName, lat, lng);
            JsonNode root = restTemplate.getForObject(url, JsonNode.class);

            Map<String, Object> result = new HashMap<>();
            result.put("district", canonicalName);
            result.put("latitude", lat);
            result.put("longitude", lng);

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
                        dayMap.put("condition", dayCond[0]);
                        dayMap.put("conditionTa", dayCond[1]);

                        forecastList.add(dayMap);
                    }
                }
                result.put("forecast", forecastList);
            }

            // Put into in-memory cache
            cache.put(key, new CachedWeatherData(result, System.currentTimeMillis()));

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
            fallback.put("conditionTa", "பகுதி மேகமூட்டம்");
            fallback.put("cached", false);
            return fallback;
        }
    }

    private String[] decodeWeatherCode(int code) {
        switch (code) {
            case 0:
                return new String[]{"Clear Sky", "தெளிவான வானிலை"};
            case 1:
                return new String[]{"Mainly Clear", "பெரும்பாலும் தெளிவான வானிலை"};
            case 2:
                return new String[]{"Partly Cloudy", "பகுதி மேகமூட்டம்"};
            case 3:
                return new String[]{"Overcast", "மேகமூட்டம்"};
            case 45:
            case 48:
                return new String[]{"Foggy", "பனிமூட்டம்"};
            case 51:
            case 53:
            case 55:
                return new String[]{"Drizzle", "தூறல்"};
            case 61:
            case 63:
            case 65:
                return new String[]{"Rain", "மழை"};
            case 80:
            case 81:
            case 82:
                return new String[]{"Scattered Showers", "சிதறிய மழை"};
            case 95:
            case 96:
            case 99:
                return new String[]{"Thunderstorm", "இடியுடன் கூடிய மழை"};
            default:
                return new String[]{"Fair", "நல்ல வானிலை"};
        }
    }
}
