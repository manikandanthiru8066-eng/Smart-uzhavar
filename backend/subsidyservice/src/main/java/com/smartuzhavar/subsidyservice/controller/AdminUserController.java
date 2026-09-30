package com.smartuzhavar.subsidyservice.controller;

import com.smartuzhavar.subsidyservice.dto.AdminUserDto;
import com.smartuzhavar.subsidyservice.dto.AdminUsersSummaryResponse;
import com.smartuzhavar.subsidyservice.entity.Farmer;
import com.smartuzhavar.subsidyservice.entity.FarmerProfile;
import com.smartuzhavar.subsidyservice.repository.FarmerProfileRepository;
import com.smartuzhavar.subsidyservice.repository.FarmerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final FarmerRepository farmerRepository;
    private final FarmerProfileRepository farmerProfileRepository;

    public AdminUserController(FarmerRepository farmerRepository,
                               FarmerProfileRepository farmerProfileRepository) {
        this.farmerRepository = farmerRepository;
        this.farmerProfileRepository = farmerProfileRepository;
    }

    @GetMapping
    public ResponseEntity<AdminUsersSummaryResponse> getAllRegisteredUsers() {
        List<Farmer> farmers = farmerRepository.findAll();

        // Sort descending: newest registered users first
        farmers.sort((a, b) -> {
            if (a.getCreatedAt() != null && b.getCreatedAt() != null) {
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            }
            if (a.getCreatedAt() != null) return -1;
            if (b.getCreatedAt() != null) return 1;
            Long idA = a.getId() != null ? a.getId() : 0L;
            Long idB = b.getId() != null ? b.getId() : 0L;
            return idB.compareTo(idA);
        });

        // Preload profiles to avoid N+1 queries
        List<FarmerProfile> allProfiles = farmerProfileRepository.findAll();
        Map<Long, List<FarmerProfile>> profilesByFarmerId = allProfiles.stream()
                .filter(p -> p.getFarmer() != null && p.getFarmer().getId() != null)
                .collect(Collectors.groupingBy(p -> p.getFarmer().getId()));

        long farmerCount = 0;
        long adminCount = 0;
        List<AdminUserDto> dtos = new ArrayList<>(farmers.size());

        for (Farmer f : farmers) {
            String role = f.getRole() != null ? f.getRole().toUpperCase() : "FARMER";
            if ("ADMIN".equals(role)) {
                adminCount++;
            } else {
                farmerCount++;
            }

            AdminUserDto dto = new AdminUserDto();
            dto.setId(f.getId());
            dto.setUsername(f.getUsername());
            dto.setFullName(f.getFullName());
            dto.setEmail(f.getEmail());
            dto.setPhoneNumber(f.getPhoneNumber());
            dto.setRole(role);
            dto.setCreatedAt(f.getCreatedAt());

            List<FarmerProfile> userProfiles = profilesByFarmerId.getOrDefault(f.getId(), List.of());
            dto.setCropProfileCount(userProfiles.size());

            if (!userProfiles.isEmpty()) {
                FarmerProfile primary = userProfiles.get(0);
                if (primary.getDistrict() != null) {
                    dto.setDistrict(primary.getDistrict().getName());
                }
                if (primary.getTaluk() != null) {
                    dto.setTaluk(primary.getTaluk().getName());
                }
                if (primary.getBlockEntity() != null) {
                    dto.setBlock(primary.getBlockEntity().getName());
                } else if (primary.getBlock() != null) {
                    dto.setBlock(primary.getBlock());
                }
                dto.setPrimaryCrop(primary.getCropGrown());
                dto.setLandSizeAcres(primary.getLandSizeAcres());
            }

            dtos.add(dto);
        }

        AdminUsersSummaryResponse response = new AdminUsersSummaryResponse();
        response.setTotalUsers(farmers.size());
        response.setTotalFarmers(farmerCount);
        response.setTotalAdmins(adminCount);
        response.setUsers(dtos);

        return ResponseEntity.ok(response);
    }
}
