package com.smartuzhavar.subsidyservice.controller;

import com.smartuzhavar.subsidyservice.dto.CropProfileDto;
import com.smartuzhavar.subsidyservice.dto.CropProfileRequest;
import com.smartuzhavar.subsidyservice.dto.ProfileResponse;
import com.smartuzhavar.subsidyservice.dto.ProfileUpdateRequest;
import com.smartuzhavar.subsidyservice.entity.Block;
import com.smartuzhavar.subsidyservice.entity.District;
import com.smartuzhavar.subsidyservice.entity.Farmer;
import com.smartuzhavar.subsidyservice.entity.FarmerProfile;
import com.smartuzhavar.subsidyservice.entity.Taluk;
import com.smartuzhavar.subsidyservice.exception.ResourceNotFoundException;
import com.smartuzhavar.subsidyservice.repository.BlockRepository;
import com.smartuzhavar.subsidyservice.repository.DistrictRepository;
import com.smartuzhavar.subsidyservice.repository.FarmerProfileRepository;
import com.smartuzhavar.subsidyservice.repository.FarmerRepository;
import com.smartuzhavar.subsidyservice.repository.TalukRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final FarmerRepository farmerRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final DistrictRepository districtRepository;
    private final TalukRepository talukRepository;
    private final BlockRepository blockRepository;

    public ProfileController(FarmerRepository farmerRepository,
                             FarmerProfileRepository farmerProfileRepository,
                             DistrictRepository districtRepository,
                             TalukRepository talukRepository,
                             BlockRepository blockRepository) {
        this.farmerRepository = farmerRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.districtRepository = districtRepository;
        this.talukRepository = talukRepository;
        this.blockRepository = blockRepository;
    }

    private Farmer getAuthenticatedFarmer() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return farmerRepository.findByUsernameIgnoreCase(username)
                .orElseGet(() -> farmerRepository.findByUsername(username)
                        .orElseThrow(() -> new ResourceNotFoundException("Farmer not found")));
    }

    private District resolveDistrict(String districtName) {
        if (districtName == null || districtName.trim().isEmpty()) {
            return null;
        }
        String targetDist = districtName.trim();
        return districtRepository.findByNameIgnoreCase(targetDist)
                .orElseGet(() -> districtRepository.findByName(targetDist)
                        .orElseGet(() -> {
                            District d = new District();
                            d.setName(targetDist);
                            return districtRepository.save(d);
                        }));
    }

    private District resolveDistrictFromRequest(CropProfileRequest request, District fallback) {
        if (request.getDistrictId() != null) {
            return districtRepository.findById(request.getDistrictId()).orElse(fallback);
        } else if (request.getDistrictName() != null && !request.getDistrictName().trim().isEmpty()) {
            return resolveDistrict(request.getDistrictName());
        }
        return fallback;
    }

    private void resolveLocationEntities(CropProfileRequest request, FarmerProfile cropProfile, District district) {
        if (district != null) {
            cropProfile.setDistrict(district);
        }

        // 1. Resolve Taluk
        Taluk taluk = null;
        if (request.getTalukId() != null) {
            taluk = talukRepository.findById(request.getTalukId()).orElse(null);
        } else if (request.getTalukName() != null && !request.getTalukName().trim().isEmpty() && district != null) {
            taluk = talukRepository.findByNameIgnoreCaseAndDistrictId(request.getTalukName().trim(), district.getId()).orElse(null);
        }
        cropProfile.setTaluk(taluk);

        // 2. Resolve Block
        Block block = null;
        String blockName = request.getBlock() != null ? request.getBlock().trim() : null;
        if (request.getBlockId() != null) {
            block = blockRepository.findById(request.getBlockId()).orElse(null);
            if (block != null) {
                blockName = block.getName();
            }
        } else if (blockName != null && taluk != null) {
            block = blockRepository.findByNameIgnoreCaseAndTalukId(blockName, taluk.getId()).orElse(null);
        }
        cropProfile.setBlockEntity(block);
        cropProfile.setBlock(blockName);
    }

    private CropProfileDto convertToCropDto(FarmerProfile profile) {
        Long talukId = profile.getTaluk() != null ? profile.getTaluk().getId() : null;
        String talukName = profile.getTaluk() != null ? profile.getTaluk().getName() : null;
        Long blockId = profile.getBlockEntity() != null ? profile.getBlockEntity().getId() : null;
        String blockName = profile.getBlockEntity() != null ? profile.getBlockEntity().getName() : profile.getBlock();

        return new CropProfileDto(
                profile.getId(),
                profile.getCropGrown(),
                profile.getDistrict() != null ? profile.getDistrict().getId() : null,
                profile.getDistrict() != null ? profile.getDistrict().getName() : null,
                talukId,
                talukName,
                blockId,
                blockName,
                profile.getLandSizeAcres(),
                profile.getLandSizeHectares(),
                profile.getIrrigationType(),
                profile.getCropDurationMonths(),
                profile.getSeason()
        );
    }

    private ProfileResponse buildProfileResponse(Farmer farmer) {
        List<FarmerProfile> profiles = farmerProfileRepository.findByFarmer(farmer).stream()
                .sorted(java.util.Comparator.comparing(FarmerProfile::getId))
                .collect(Collectors.toList());
        List<CropProfileDto> cropDtos = profiles.stream()
                .map(this::convertToCropDto)
                .collect(Collectors.toList());

        String fullName = (farmer.getFullName() != null && !farmer.getFullName().trim().isEmpty())
                ? farmer.getFullName()
                : profiles.stream()
                        .filter(p -> p.getFullName() != null && !p.getFullName().trim().isEmpty())
                        .map(FarmerProfile::getFullName)
                        .findFirst()
                        .orElse(farmer.getUsername());

        return new ProfileResponse(
                farmer.getUsername(),
                fullName,
                farmer.getEmail(),
                farmer.getPhoneNumber(),
                farmer.getRole(),
                cropDtos
        );
    }

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile() {
        Farmer farmer = getAuthenticatedFarmer();
        return ResponseEntity.ok(buildProfileResponse(farmer));
    }

    // POST /api/profile/crops - Add a new crop profile for the logged-in farmer
    @PostMapping("/crops")
    public ResponseEntity<ProfileResponse> addCropProfile(@RequestBody CropProfileRequest request) {
        Farmer farmer = getAuthenticatedFarmer();

        FarmerProfile cropProfile = new FarmerProfile();
        cropProfile.setFarmer(farmer);
        cropProfile.setFullName(farmer.getFullName() != null ? farmer.getFullName() : farmer.getUsername());
        cropProfile.setCropGrown(request.getCropGrown() != null ? request.getCropGrown().trim() : "Paddy");
        cropProfile.setCropDurationMonths(request.getCropDurationMonths() != null ? request.getCropDurationMonths() : 4);
        cropProfile.setSeason(request.getSeason() != null ? request.getSeason().trim() : "Kharif");
        cropProfile.setIrrigationType(request.getIrrigationType() != null ? request.getIrrigationType().trim() : "Canal");

        // Calculate acres and hectares
        BigDecimal acres = request.getLandSizeAcres();
        BigDecimal hectares = request.getLandSizeHectares();

        if (acres != null && acres.compareTo(BigDecimal.ZERO) > 0) {
            hectares = acres.divide(new BigDecimal("2.47105"), 2, RoundingMode.HALF_UP);
        } else if (hectares != null && hectares.compareTo(BigDecimal.ZERO) > 0) {
            acres = hectares.multiply(new BigDecimal("2.47105")).setScale(2, RoundingMode.HALF_UP);
        } else {
            acres = new BigDecimal("2.5");
            hectares = new BigDecimal("1.01");
        }

        cropProfile.setLandSizeAcres(acres);
        cropProfile.setLandSizeHectares(hectares);

        District district = resolveDistrictFromRequest(request, null);
        resolveLocationEntities(request, cropProfile, district);

        farmerProfileRepository.save(cropProfile);

        return ResponseEntity.ok(buildProfileResponse(farmer));
    }

    // PUT /api/profile/crops/{cropProfileId} - Edit a specific crop profile
    @PutMapping("/crops/{cropProfileId}")
    public ResponseEntity<ProfileResponse> updateCropProfile(
            @PathVariable Long cropProfileId,
            @RequestBody CropProfileRequest request) {

        Farmer farmer = getAuthenticatedFarmer();
        FarmerProfile cropProfile = farmerProfileRepository.findById(cropProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Crop profile not found with ID: " + cropProfileId));

        if (!cropProfile.getFarmer().getId().equals(farmer.getId())) {
            throw new IllegalArgumentException("Unauthorized to modify this crop profile");
        }

        if (request.getCropGrown() != null) {
            cropProfile.setCropGrown(request.getCropGrown().trim());
        }
        if (request.getCropDurationMonths() != null) {
            cropProfile.setCropDurationMonths(request.getCropDurationMonths());
        }
        if (request.getSeason() != null) {
            cropProfile.setSeason(request.getSeason().trim());
        }
        if (request.getIrrigationType() != null) {
            cropProfile.setIrrigationType(request.getIrrigationType().trim());
        }

        District district = resolveDistrictFromRequest(request, cropProfile.getDistrict());
        resolveLocationEntities(request, cropProfile, district);

        if (request.getLandSizeAcres() != null) {
            BigDecimal acres = request.getLandSizeAcres();
            BigDecimal hectares = acres.divide(new BigDecimal("2.47105"), 2, RoundingMode.HALF_UP);
            cropProfile.setLandSizeAcres(acres);
            cropProfile.setLandSizeHectares(hectares);
        } else if (request.getLandSizeHectares() != null) {
            BigDecimal hectares = request.getLandSizeHectares();
            BigDecimal acres = hectares.multiply(new BigDecimal("2.47105")).setScale(2, RoundingMode.HALF_UP);
            cropProfile.setLandSizeHectares(hectares);
            cropProfile.setLandSizeAcres(acres);
        }

        farmerProfileRepository.save(cropProfile);

        return ResponseEntity.ok(buildProfileResponse(farmer));
    }

    // DELETE /api/profile/crops/{cropProfileId} - Delete a specific crop profile
    @DeleteMapping("/crops/{cropProfileId}")
    public ResponseEntity<ProfileResponse> deleteCropProfile(@PathVariable Long cropProfileId) {
        Farmer farmer = getAuthenticatedFarmer();
        FarmerProfile cropProfile = farmerProfileRepository.findById(cropProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Crop profile not found with ID: " + cropProfileId));

        if (!cropProfile.getFarmer().getId().equals(farmer.getId())) {
            throw new IllegalArgumentException("Unauthorized to delete this crop profile");
        }

        farmerProfileRepository.delete(cropProfile);

        return ResponseEntity.ok(buildProfileResponse(farmer));
    }

    @PutMapping
    public ResponseEntity<ProfileResponse> updateProfile(@RequestBody ProfileUpdateRequest updateRequest) {
        Farmer farmer = getAuthenticatedFarmer();
        List<FarmerProfile> profiles = farmerProfileRepository.findByFarmer(farmer);

        FarmerProfile primaryProfile;
        if (profiles.isEmpty()) {
            primaryProfile = new FarmerProfile();
            primaryProfile.setFarmer(farmer);
            primaryProfile.setFullName(updateRequest.getFullName() != null && !updateRequest.getFullName().trim().isEmpty()
                    ? updateRequest.getFullName().trim() : farmer.getUsername());
        } else {
            primaryProfile = profiles.get(0);
        }

        if (updateRequest.getFullName() != null && !updateRequest.getFullName().trim().isEmpty()) {
            primaryProfile.setFullName(updateRequest.getFullName().trim());
        }
        if (updateRequest.getCropGrown() != null) {
            primaryProfile.setCropGrown(updateRequest.getCropGrown());
        }
        if (updateRequest.getCropDurationMonths() != null) {
            primaryProfile.setCropDurationMonths(updateRequest.getCropDurationMonths());
        }
        if (updateRequest.getSeason() != null) {
            primaryProfile.setSeason(updateRequest.getSeason());
        }
        if (updateRequest.getLandSizeHectares() != null) {
            primaryProfile.setLandSizeHectares(updateRequest.getLandSizeHectares());
            BigDecimal acres = updateRequest.getLandSizeHectares().multiply(new BigDecimal("2.47105")).setScale(2, RoundingMode.HALF_UP);
            primaryProfile.setLandSizeAcres(acres);
        }

        if (updateRequest.getDistrictName() != null) {
            primaryProfile.setDistrict(resolveDistrict(updateRequest.getDistrictName()));
        }

        // Update core farmer account details
        if (updateRequest.getEmail() != null && !updateRequest.getEmail().trim().isEmpty()) {
            if (!updateRequest.getEmail().equalsIgnoreCase(farmer.getEmail()) &&
                    farmerRepository.existsByEmail(updateRequest.getEmail())) {
                throw new IllegalArgumentException("Email is already in use by another user");
            }
            farmer.setEmail(updateRequest.getEmail().trim());
        }

        if (updateRequest.getPhoneNumber() != null && !updateRequest.getPhoneNumber().trim().isEmpty()) {
            if (!updateRequest.getPhoneNumber().equalsIgnoreCase(farmer.getPhoneNumber()) &&
                    farmerRepository.existsByPhoneNumber(updateRequest.getPhoneNumber())) {
                throw new IllegalArgumentException("Phone number is already in use by another user");
            }
            farmer.setPhoneNumber(updateRequest.getPhoneNumber().trim());
        }

        farmerRepository.save(farmer);
        farmerProfileRepository.save(primaryProfile);

        return ResponseEntity.ok(buildProfileResponse(farmer));
    }
}
