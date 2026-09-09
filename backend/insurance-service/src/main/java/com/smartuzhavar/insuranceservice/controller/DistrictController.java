package com.smartuzhavar.insuranceservice.controller;

import com.smartuzhavar.insuranceservice.entity.District;
import com.smartuzhavar.insuranceservice.entity.Taluk;
import com.smartuzhavar.insuranceservice.repository.DistrictRepository;
import com.smartuzhavar.insuranceservice.repository.TalukRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/districts")
public class DistrictController {

    private final DistrictRepository districtRepository;
    private final TalukRepository talukRepository;

    public DistrictController(DistrictRepository districtRepository, TalukRepository talukRepository) {
        this.districtRepository = districtRepository;
        this.talukRepository = talukRepository;
    }

    public static String normalizeDistrictName(String name) {
        if (name == null) return null;
        String trimmed = name.trim();
        String lower = trimmed.toLowerCase();
        switch (lower) {
            case "thoothukkudi":
            case "tuticorin":
                return "Thoothukudi";
            case "kancheepuram":
                return "Kanchipuram";
            case "kanniyakumari":
            case "kanya kumari":
                return "Kanyakumari";
            case "the nilgiris":
            case "the nilgiri":
            case "nilgiri":
                return "Nilgiris";
            case "thiruvallur":
                return "Tiruvallur";
            case "thiruvarur":
                return "Tiruvarur";
            case "trichy":
            case "tiruchy":
                return "Tiruchirappalli";
            case "tirupattur":
                return "Tirupathur";
            case "villupuram":
                return "Viluppuram";
            case "sivagangai":
                return "Sivaganga";
            default:
                return trimmed;
        }
    }

    @GetMapping
    public ResponseEntity<List<District>> getAllDistricts() {
        return ResponseEntity.ok(districtRepository.findAll());
    }

    @GetMapping("/{districtId}/taluks")
    public ResponseEntity<List<Taluk>> getTaluksByDistrict(@PathVariable("districtId") Long districtId) {
        List<Taluk> taluks = talukRepository.findByDistrictIdOrderByNameAsc(districtId);
        return ResponseEntity.ok(taluks);
    }

    @GetMapping("/name/{districtName}/taluks")
    public ResponseEntity<List<Taluk>> getTaluksByDistrictName(@PathVariable("districtName") String districtName) {
        String normalized = normalizeDistrictName(districtName);
        List<Taluk> taluks = talukRepository.findByDistrictNameIgnoreCaseOrderByNameAsc(normalized);
        if (taluks.isEmpty() && !normalized.equalsIgnoreCase(districtName)) {
            taluks = talukRepository.findByDistrictNameIgnoreCaseOrderByNameAsc(districtName);
        }
        return ResponseEntity.ok(taluks);
    }
}

