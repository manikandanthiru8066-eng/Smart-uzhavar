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
    public ResponseEntity<List<RecommendedSubsidyResponse>> getRecommendedSubsidies() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Farmer farmer = farmerRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found"));

        FarmerProfile profile = farmerProfileRepository.findByFarmer(farmer)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for farmer: " + username));

        String farmerCrop = profile.getCropGrown();
        String farmerDistrict = profile.getDistrict() != null ? profile.getDistrict().getName() : null;

        List<SubsidyScheme> allSchemes = subsidySchemeRepository.findAll();
        List<RecommendedSubsidyResponse> recommendations = new ArrayList<>();

        for (SubsidyScheme scheme : allSchemes) {
            double score = calculateMatchScore(farmerCrop, farmerDistrict, scheme);
            if (score > 0.0) {
                recommendations.add(new RecommendedSubsidyResponse(
                        scheme.getId(),
                        scheme.getName(),
                        scheme.getDescription(),
                        scheme.getApplicableCrops(),
                        scheme.getApplicableDistricts(),
                        scheme.getSubsidyAmount(),
                        scheme.getCreatedAt(),
                        score
                ));
            }
        }

        // Sort descending by matchScore
        recommendations.sort(Comparator.comparingDouble(RecommendedSubsidyResponse::getMatchScore).reversed());

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

    private double calculateMatchScore(String farmerCrop, String farmerDistrict, SubsidyScheme scheme) {
        boolean cropMatches = false;
        boolean districtMatches = false;

        if (farmerCrop != null && !farmerCrop.trim().isEmpty()) {
            cropMatches = matchesValue(farmerCrop, scheme.getApplicableCrops());
        }

        if (farmerDistrict != null && !farmerDistrict.trim().isEmpty()) {
            districtMatches = matchesValue(farmerDistrict, scheme.getApplicableDistricts());
        }

        if (cropMatches && districtMatches) {
            return 100.0; // Perfect match (both crop and district match)
        } else if (cropMatches) {
            return 60.0; // Crop matches, but district doesn't
        } else if (districtMatches) {
            return 40.0; // District matches, but crop doesn't
        }

        return 0.0;
    }
}
