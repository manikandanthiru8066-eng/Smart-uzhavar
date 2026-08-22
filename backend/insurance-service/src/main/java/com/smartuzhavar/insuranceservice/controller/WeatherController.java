package com.smartuzhavar.insuranceservice.controller;

import com.smartuzhavar.insuranceservice.service.WeatherService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/weather")
public class WeatherController {

    private final WeatherService weatherService;

    public WeatherController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getWeather(@RequestParam(required = false, defaultValue = "Thanjavur") String district) {
        Map<String, Object> data = weatherService.getWeatherForDistrict(district);
        return ResponseEntity.ok(data);
    }
}
