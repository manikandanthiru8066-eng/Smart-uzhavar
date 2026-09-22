package com.smartuzhavar.subsidyservice.controller;

import com.smartuzhavar.subsidyservice.dto.RecommendedSubsidyResponse;
import com.smartuzhavar.subsidyservice.entity.Farmer;
import com.smartuzhavar.subsidyservice.entity.FarmerProfile;
import com.smartuzhavar.subsidyservice.entity.SubsidyScheme;
import com.smartuzhavar.subsidyservice.exception.ResourceNotFoundException;
import com.smartuzhavar.subsidyservice.repository.FarmerProfileRepository;
import com.smartuzhavar.subsidyservice.repository.FarmerRepository;
import com.smartuzhavar.subsidyservice.repository.SubsidySchemeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/subsidies")
public class SubsidyController {

    private final SubsidySchemeRepository subsidySchemeRepository;
    private final FarmerRepository farmerRepository;
    private final FarmerProfileRepository farmerProfileRepository;

    public SubsidyController(SubsidySchemeRepository subsidySchemeRepository,
                             FarmerRepository farmerRepository,
                             FarmerProfileRepository farmerProfileRepository) {
        this.subsidySchemeRepository = subsidySchemeRepository;
        this.farmerRepository = farmerRepository;
        this.farmerProfileRepository = farmerProfileRepository;
    }

    @GetMapping
    public ResponseEntity<List<SubsidyScheme>> getSubsidies(
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String crop) {

        List<SubsidyScheme> allSchemes = subsidySchemeRepository.findAll();

        List<SubsidyScheme> filtered = allSchemes.stream()
                .filter(scheme -> {
                    boolean cropMatches = true;
                    boolean districtMatches = true;

                    if (crop != null && !crop.trim().isEmpty()) {
                        cropMatches = matchesValue(crop, scheme.getApplicableCrops());
                    }

                    if (district != null && !district.trim().isEmpty()) {
                        districtMatches = matchesValue(district, scheme.getApplicableDistricts());
                    }

                    return cropMatches && districtMatches;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(filtered);
    }

    @GetMapping("/recommended")
    public ResponseEntity<List<RecommendedSubsidyResponse>> getRecommendedSubsidies(
            @RequestParam(required = false) Long cropProfileId) {

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Farmer farmer = farmerRepository.findByUsernameIgnoreCase(username)
                .orElseGet(() -> farmerRepository.findByUsername(username).orElse(null));

        List<FarmerProfile> farmerProfiles = new ArrayList<>();
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

        List<SubsidyScheme> allSchemes = subsidySchemeRepository.findAll();
        List<RecommendedSubsidyResponse> recommendations = new ArrayList<>();

        if (!farmerProfiles.isEmpty()) {
            for (FarmerProfile profile : farmerProfiles) {
                String farmerCrop = profile.getCropGrown();
                String farmerDistrict = profile.getDistrict() != null ? profile.getDistrict().getName() : null;
                String farmerSeason = profile.getSeason();
                String farmerIrrigation = profile.getIrrigationType();

                for (SubsidyScheme scheme : allSchemes) {
                    List<String> reasons = new ArrayList<>();
                    double score = calculateMatchScoreAndReasons(farmerCrop, farmerDistrict, farmerSeason, farmerIrrigation, scheme, reasons);
                    if (score > 0.0) {
                        recommendations.add(new RecommendedSubsidyResponse(
                                scheme.getId(),
                                scheme.getName(),
                                scheme.getNameTa(),
                                scheme.getDescription(),
                                scheme.getDescriptionTa(),
                                scheme.getApplicableCrops(),
                                scheme.getApplicableCropsTa(),
                                scheme.getApplicableDistricts(),
                                scheme.getSubsidyAmount(),
                                scheme.getSourceUrl(),
                                scheme.getCreatedAt(),
                                score,
                                reasons
                        ));
                    }
                }
            }
        }

        // Sort descending by matchScore
        recommendations.sort(Comparator.comparingDouble(RecommendedSubsidyResponse::getMatchScore).reversed());

        if (recommendations.isEmpty()) {
            for (SubsidyScheme scheme : allSchemes) {
                List<String> defaultReasons = new ArrayList<>();
                defaultReasons.add("General Government Scheme");
                recommendations.add(new RecommendedSubsidyResponse(
                        scheme.getId(),
                        scheme.getName(),
                        scheme.getNameTa(),
                        scheme.getDescription(),
                        scheme.getDescriptionTa(),
                        scheme.getApplicableCrops(),
                        scheme.getApplicableCropsTa(),
                        scheme.getApplicableDistricts(),
                        scheme.getSubsidyAmount(),
                        scheme.getSourceUrl(),
                        scheme.getCreatedAt(),
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

    private double calculateMatchScoreAndReasons(String farmerCrop, String farmerDistrict, String farmerSeason, String farmerIrrigation, SubsidyScheme scheme, List<String> reasons) {
        double score = 0.0;

        // 1. Crop Match (+40 points)
        if (farmerCrop != null && !farmerCrop.trim().isEmpty() && matchesValue(farmerCrop, scheme.getApplicableCrops())) {
            score += 40.0;
            reasons.add("Matches your crop: " + farmerCrop.trim());
        }

        // 2. District Match (+25 points)
        if (farmerDistrict != null && !farmerDistrict.trim().isEmpty() && matchesValue(farmerDistrict, scheme.getApplicableDistricts())) {
            score += 25.0;
            reasons.add("Matches your district: " + farmerDistrict.trim());
        }

        // 3. Season Match (+20 points)
        if (farmerSeason != null && !farmerSeason.trim().isEmpty()) {
            String text = (scheme.getName() + " " + scheme.getDescription()).toLowerCase();
            if (text.contains(farmerSeason.trim().toLowerCase())) {
                score += 20.0;
                reasons.add("Matches your season: " + farmerSeason.trim());
            }
        }

        // 4. Irrigation Type Relevance (+15 points)
        String schemeText = (scheme.getName() + " " + scheme.getDescription()).toLowerCase();
        boolean isIrrigationScheme = schemeText.contains("drip") || schemeText.contains("sprinkler") || schemeText.contains("micro") || schemeText.contains("irrigation") || schemeText.contains("pmksy");
        
        if (isIrrigationScheme) {
            if (farmerIrrigation != null && (farmerIrrigation.equalsIgnoreCase("Canal") || farmerIrrigation.equalsIgnoreCase("Borewell") || farmerIrrigation.equalsIgnoreCase("Rainfed"))) {
                score += 15.0;
                reasons.add("Recommended for upgrading to micro-irrigation from " + farmerIrrigation);
            } else if (farmerIrrigation != null && farmerIrrigation.toLowerCase().contains("drip")) {
                score += 10.0;
                reasons.add("Supports your " + farmerIrrigation + " system");
            }
        }

        return score;
    }

}
