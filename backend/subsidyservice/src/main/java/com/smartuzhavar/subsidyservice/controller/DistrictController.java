package com.smartuzhavar.subsidyservice.controller;

import com.smartuzhavar.subsidyservice.entity.District;
import com.smartuzhavar.subsidyservice.entity.DistrictCropStat;
import com.smartuzhavar.subsidyservice.entity.Taluk;
import com.smartuzhavar.subsidyservice.repository.DistrictCropStatRepository;
import com.smartuzhavar.subsidyservice.repository.DistrictRepository;
import com.smartuzhavar.subsidyservice.repository.TalukRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/districts")
@CrossOrigin(origins = "*")
public class DistrictController {

    private final DistrictRepository districtRepository;
    private final TalukRepository talukRepository;
    private final DistrictCropStatRepository districtCropStatRepository;

    public DistrictController(DistrictRepository districtRepository,
                              TalukRepository talukRepository,
                              DistrictCropStatRepository districtCropStatRepository) {
        this.districtRepository = districtRepository;
        this.talukRepository = talukRepository;
        this.districtCropStatRepository = districtCropStatRepository;
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

    @GetMapping("/{districtId}/crop-stats")
    public ResponseEntity<List<DistrictCropStat>> getCropStatsByDistrictId(@PathVariable("districtId") Long districtId) {
        List<DistrictCropStat> stats = districtCropStatRepository.findByDistrictId(districtId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/name/{districtName}/crop-stats")
    public ResponseEntity<List<DistrictCropStat>> getCropStatsByDistrictName(@PathVariable("districtName") String districtName) {
        String normalized = normalizeDistrictName(districtName);
        List<DistrictCropStat> stats = districtCropStatRepository.findByDistrictNameIgnoreCase(normalized);
        if (stats.isEmpty() && !normalized.equalsIgnoreCase(districtName)) {
            stats = districtCropStatRepository.findByDistrictNameIgnoreCase(districtName);
        }
        return ResponseEntity.ok(stats);
    }
}
