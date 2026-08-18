package com.smartuzhavar.insuranceservice.controller;

import com.smartuzhavar.insuranceservice.entity.Farmer;
import com.smartuzhavar.insuranceservice.entity.FarmerProfile;
import com.smartuzhavar.insuranceservice.entity.InsuranceEstimate;
import com.smartuzhavar.insuranceservice.entity.InsuranceScheme;
import com.smartuzhavar.insuranceservice.repository.FarmerProfileRepository;
import com.smartuzhavar.insuranceservice.repository.FarmerRepository;
import com.smartuzhavar.insuranceservice.repository.InsuranceEstimateRepository;
import com.smartuzhavar.insuranceservice.repository.InsuranceSchemeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@RestController
@RequestMapping("/api/insurance")
public class InsuranceController {

    private final InsuranceSchemeRepository insuranceSchemeRepository;
    private final FarmerRepository farmerRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final InsuranceEstimateRepository insuranceEstimateRepository;

    public InsuranceController(InsuranceSchemeRepository insuranceSchemeRepository,
                               FarmerRepository farmerRepository,
                               FarmerProfileRepository farmerProfileRepository,
                               InsuranceEstimateRepository insuranceEstimateRepository) {
        this.insuranceSchemeRepository = insuranceSchemeRepository;
        this.farmerRepository = farmerRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.insuranceEstimateRepository = insuranceEstimateRepository;
    }

    @GetMapping
    public ResponseEntity<List<InsuranceScheme>> getSchemes(@RequestParam(required = false) String crop) {
        if (crop != null && !crop.trim().isEmpty()) {
            return ResponseEntity.ok(insuranceSchemeRepository.findByCrop(crop));
        }
        return ResponseEntity.ok(insuranceSchemeRepository.findAll());
    }

    @GetMapping("/recommended")
    public ResponseEntity<List<InsuranceScheme>> getRecommendedSchemes() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Farmer farmer = farmerRepository.findByUsernameIgnoreCase(username)
                .orElseGet(() -> farmerRepository.findByUsername(username).orElse(null));

        String farmerCrop = null;
        String farmerSeason = null;

        if (farmer != null) {
            FarmerProfile profile = farmerProfileRepository.findByFarmer(farmer).orElse(null);
            if (profile != null) {
                farmerCrop = profile.getCropGrown();
                farmerSeason = profile.getSeason();
            }
        }

        List<InsuranceScheme> allSchemes = insuranceSchemeRepository.findAll();
        if (allSchemes.isEmpty()) {
            return ResponseEntity.ok(allSchemes);
        }

        if (farmerCrop == null || farmerCrop.trim().isEmpty()) {
            return ResponseEntity.ok(allSchemes);
        }

        String finalCrop = farmerCrop.trim();
        String finalSeason = (farmerSeason != null && !farmerSeason.trim().isEmpty()) ? farmerSeason.trim() : null;

        // Filter schemes matching crop & optionally season
        List<InsuranceScheme> matched = allSchemes.stream()
                .filter(scheme -> {
                    boolean cropMatches = matchesValue(finalCrop, scheme.getApplicableCrops());
                    if (!cropMatches) {
                        return false;
                    }
                    if (finalSeason != null) {
                        String text = (scheme.getName() + " " + scheme.getDescription()).toLowerCase();
                        if (text.contains("kharif") || text.contains("rabi") || text.contains("zaid")) {
                            return text.contains(finalSeason.toLowerCase());
                        }
                    }
                    return true;
                })
                .toList();

        if (matched.isEmpty()) {
            // Fallback: match by crop only
            matched = insuranceSchemeRepository.findByCrop(finalCrop);
        }

        if (matched.isEmpty()) {
            return ResponseEntity.ok(allSchemes);
        }

        return ResponseEntity.ok(matched);
    }

    private boolean matchesValue(String value, String commaSeparatedTargets) {
        if (commaSeparatedTargets == null || commaSeparatedTargets.trim().isEmpty()) {
            return false;
        }
        if (commaSeparatedTargets.equalsIgnoreCase("All")) {
            return true;
        }
        String[] targets = commaSeparatedTargets.split(",");
        for (String target : targets) {
            if (target.trim().equalsIgnoreCase(value.trim())) {
                return true;
            }
        }
        return false;
    }

    @PostMapping("/estimate")
    public ResponseEntity<InsuranceEstimate> createEstimate(@RequestBody EstimateRequest request) {
        if (request.getSchemeId() == null || request.getLandSizeAcres() == null || request.getCrop() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required fields");
        }

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Farmer farmer = farmerRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Farmer not found"));

        InsuranceScheme scheme = insuranceSchemeRepository.findById(request.getSchemeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Insurance scheme not found"));

        // Calculation:
        // sumInsured = landSizeAcres * sumInsuredPerAcre
        // premiumEstimate = sumInsured * premiumRatePercentage / 100
        BigDecimal sumInsured = request.getLandSizeAcres().multiply(scheme.getSumInsuredPerAcre());
        BigDecimal premiumEstimate = sumInsured.multiply(scheme.getPremiumRatePercentage())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        InsuranceEstimate estimate = new InsuranceEstimate();
        estimate.setFarmer(farmer);
        estimate.setScheme(scheme);
        estimate.setLandSizeAcres(request.getLandSizeAcres());
        estimate.setCrop(request.getCrop());
        estimate.setSumInsured(sumInsured);
        estimate.setPremiumEstimate(premiumEstimate);

        InsuranceEstimate saved = insuranceEstimateRepository.save(estimate);
        return ResponseEntity.ok(saved);
    }

    public static class EstimateRequest {
        private Long schemeId;
        private BigDecimal landSizeAcres;
        private String crop;

        public Long getSchemeId() {
            return schemeId;
        }

        public void setSchemeId(Long schemeId) {
            this.schemeId = schemeId;
        }

        public BigDecimal getLandSizeAcres() {
            return landSizeAcres;
        }

        public void setLandSizeAcres(BigDecimal landSizeAcres) {
            this.landSizeAcres = landSizeAcres;
        }

        public String getCrop() {
            return crop;
        }

        public void setCrop(String crop) {
            this.crop = crop;
        }
    }
}
