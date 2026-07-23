package com.smartuzhavar.subsidyservice.controller;

import com.smartuzhavar.subsidyservice.dto.ProfileResponse;
import com.smartuzhavar.subsidyservice.dto.ProfileUpdateRequest;
import com.smartuzhavar.subsidyservice.entity.District;
import com.smartuzhavar.subsidyservice.entity.Farmer;
import com.smartuzhavar.subsidyservice.entity.FarmerProfile;
import com.smartuzhavar.subsidyservice.exception.ResourceNotFoundException;
import com.smartuzhavar.subsidyservice.repository.DistrictRepository;
import com.smartuzhavar.subsidyservice.repository.FarmerProfileRepository;
import com.smartuzhavar.subsidyservice.repository.FarmerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final FarmerRepository farmerRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final DistrictRepository districtRepository;

    public ProfileController(FarmerRepository farmerRepository,
                             FarmerProfileRepository farmerProfileRepository,
                             DistrictRepository districtRepository) {
        this.farmerRepository = farmerRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.districtRepository = districtRepository;
    }

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Farmer farmer = farmerRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found"));

        FarmerProfile profile = farmerProfileRepository.findByFarmer(farmer)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for farmer: " + username));

        return ResponseEntity.ok(convertToProfileResponse(farmer, profile));
    }

    @PutMapping
    public ResponseEntity<ProfileResponse> updateProfile(@RequestBody ProfileUpdateRequest updateRequest) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Farmer farmer = farmerRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found"));

        FarmerProfile profile = farmerProfileRepository.findByFarmer(farmer)
                .orElseGet(() -> {
                    FarmerProfile p = new FarmerProfile();
                    p.setFarmer(farmer);
                    return p;
                });

        // Update profile details
        if (updateRequest.getFullName() != null) {
            profile.setFullName(updateRequest.getFullName());
        }
        if (updateRequest.getCropGrown() != null) {
            profile.setCropGrown(updateRequest.getCropGrown());
        }
        if (updateRequest.getLandSizeHectares() != null) {
            profile.setLandSizeHectares(updateRequest.getLandSizeHectares());
        }

        if (updateRequest.getDistrictName() != null) {
            if (updateRequest.getDistrictName().trim().isEmpty()) {
                profile.setDistrict(null);
            } else {
                District district = districtRepository.findByName(updateRequest.getDistrictName())
                        .orElseThrow(() -> new IllegalArgumentException("District not found: " + updateRequest.getDistrictName()));
                profile.setDistrict(district);
            }
        }

        // Update farmer details
        if (updateRequest.getEmail() != null && !updateRequest.getEmail().trim().isEmpty()) {
            if (!updateRequest.getEmail().equalsIgnoreCase(farmer.getEmail()) && 
                    farmerRepository.existsByEmail(updateRequest.getEmail())) {
                throw new IllegalArgumentException("Email is already in use by another user");
            }
            farmer.setEmail(updateRequest.getEmail());
        }

        if (updateRequest.getPhoneNumber() != null && !updateRequest.getPhoneNumber().trim().isEmpty()) {
            if (!updateRequest.getPhoneNumber().equalsIgnoreCase(farmer.getPhoneNumber()) && 
                    farmerRepository.existsByPhoneNumber(updateRequest.getPhoneNumber())) {
                throw new IllegalArgumentException("Phone number is already in use by another user");
            }
            farmer.setPhoneNumber(updateRequest.getPhoneNumber());
        }

        farmerRepository.save(farmer);
        FarmerProfile savedProfile = farmerProfileRepository.save(profile);

        return ResponseEntity.ok(convertToProfileResponse(farmer, savedProfile));
    }

    private ProfileResponse convertToProfileResponse(Farmer farmer, FarmerProfile profile) {
        return new ProfileResponse(
                farmer.getUsername(),
                profile.getFullName(),
                farmer.getEmail(),
                farmer.getPhoneNumber(),
                profile.getDistrict() != null ? profile.getDistrict().getName() : null,
                profile.getCropGrown(),
                profile.getLandSizeHectares()
        );
    }
}
