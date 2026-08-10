package com.smartuzhavar.insuranceservice.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/weather")
public class WeatherController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> getWeather(@RequestParam String district) {
        Map<String, Object> response = new HashMap<>();
        response.put("district", district);
        response.put("temperatureCelsius", 32.5);
        response.put("humidityPercentage", 65.0);
        response.put("rainfallMm", 15.2);
        response.put("condition", "Scattered Showers");
        response.put("windSpeedKmph", 12.8);
        return ResponseEntity.ok(response);
    }
}
