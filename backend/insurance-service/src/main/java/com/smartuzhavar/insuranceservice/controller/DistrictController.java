package com.smartuzhavar.insuranceservice.controller;

import com.smartuzhavar.insuranceservice.entity.District;
import com.smartuzhavar.insuranceservice.repository.DistrictRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/districts")
public class DistrictController {

    private final DistrictRepository districtRepository;

    public DistrictController(DistrictRepository districtRepository) {
        this.districtRepository = districtRepository;
    }

    @GetMapping
    public ResponseEntity<List<District>> getAllDistricts() {
        return ResponseEntity.ok(districtRepository.findAll());
    }
}
