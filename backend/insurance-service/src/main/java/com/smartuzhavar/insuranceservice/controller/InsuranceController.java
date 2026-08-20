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
    public ResponseEntity<List<com.smartuzhavar.insuranceservice.dto.RecommendedInsuranceResponse>> getRecommendedSchemes(
            @RequestParam(required = false) Long cropProfileId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Farmer farmer = farmerRepository.findByUsernameIgnoreCase(username)
                .orElseGet(() -> farmerRepository.findByUsername(username).orElse(null));

        List<FarmerProfile> farmerProfiles = new java.util.ArrayList<>();
        if (farmer != null) {
            if (cropProfileId != null) {
                farmerProfileRepository.findById(cropProfileId)
                        .filter(p -> p.getFarmer().getId().equals(farmer.getId()))
                        .ifPresent(farmerProfiles::add);
            }
            if (farmerProfiles.isEmpty()) {
                farmerProfiles = farmerProfileRepository.findByFarmer(farmer);
            }
        }

        List<InsuranceScheme> allSchemes = insuranceSchemeRepository.findAll();
        List<com.smartuzhavar.insuranceservice.dto.RecommendedInsuranceResponse> recommendations = new java.util.ArrayList<>();

        if (!farmerProfiles.isEmpty()) {
            for (FarmerProfile profile : farmerProfiles) {
                String farmerCrop = profile.getCropGrown();
                String farmerSeason = profile.getSeason();
                String farmerDistrict = profile.getDistrict() != null ? profile.getDistrict().getName() : null;
                String farmerIrrigation = profile.getIrrigationType();

                for (InsuranceScheme scheme : allSchemes) {
                    List<String> reasons = new java.util.ArrayList<>();
                    double score = 0.0;

                    // 1. Crop Match (+40 pts)
                    if (farmerCrop != null && !farmerCrop.trim().isEmpty() && matchesValue(farmerCrop, scheme.getApplicableCrops())) {
                        score += 40.0;
                        reasons.add("Matches your crop: " + farmerCrop.trim());
                    }

                    // 2. Season Match (+25 pts)
                    if (farmerSeason != null && !farmerSeason.trim().isEmpty()) {
                        String text = (scheme.getName() + " " + scheme.getDescription()).toLowerCase();
                        if (text.contains(farmerSeason.trim().toLowerCase())) {
                            score += 25.0;
                            reasons.add("Matches your season: " + farmerSeason.trim());
                        }
                    }

                    // 3. District Match (+20 pts)
                    if (farmerDistrict != null && !farmerDistrict.trim().isEmpty()) {
                        score += 20.0;
                        reasons.add("Applicable for your district: " + farmerDistrict.trim());
                    }

                    // 4. Irrigation/Risk relevance (+15 pts)
                    if (farmerIrrigation != null && (farmerIrrigation.equalsIgnoreCase("Rainfed") || farmerIrrigation.equalsIgnoreCase("Canal"))) {
                        score += 15.0;
                        reasons.add("Protects against drought/weather risks for " + farmerIrrigation + " farming");
                    }

                    if (score > 0.0) {
                        recommendations.add(new com.smartuzhavar.insuranceservice.dto.RecommendedInsuranceResponse(
                                scheme.getId(),
                                scheme.getName(),
                                scheme.getNameTa(),
                                scheme.getDescription(),
                                scheme.getDescriptionTa(),
                                scheme.getSchemeType(),
                                scheme.getApplicableCrops(),
                                scheme.getApplicableCropsTa(),
                                scheme.getPremiumRatePercentage(),
                                scheme.getSumInsuredPerAcre(),
                                score,
                                reasons
                        ));
                    }
                }
            }
        }

        // Sort descending by matchScore
        recommendations.sort(java.util.Comparator.comparingDouble(com.smartuzhavar.insuranceservice.dto.RecommendedInsuranceResponse::getMatchScore).reversed());

        if (recommendations.isEmpty()) {
            for (InsuranceScheme scheme : allSchemes) {
                List<String> defaultReasons = new java.util.ArrayList<>();
                defaultReasons.add("Government Insurance Scheme");
                recommendations.add(new com.smartuzhavar.insuranceservice.dto.RecommendedInsuranceResponse(
                        scheme.getId(),
                        scheme.getName(),
                        scheme.getNameTa(),
                        scheme.getDescription(),
                        scheme.getDescriptionTa(),
                        scheme.getSchemeType(),
                        scheme.getApplicableCrops(),
                        scheme.getApplicableCropsTa(),
                        scheme.getPremiumRatePercentage(),
                        scheme.getSumInsuredPerAcre(),
                        50.0,
                        defaultReasons
                ));
            }
        }

        return ResponseEntity.ok(recommendations);
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
