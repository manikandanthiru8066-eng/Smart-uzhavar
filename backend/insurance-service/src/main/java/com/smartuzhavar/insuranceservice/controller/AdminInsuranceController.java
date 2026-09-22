package com.smartuzhavar.insuranceservice.controller;

import com.smartuzhavar.insuranceservice.entity.InsuranceScheme;
import com.smartuzhavar.insuranceservice.repository.InsuranceSchemeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/insurance")
@PreAuthorize("hasRole('ADMIN')")
public class AdminInsuranceController {

    private final InsuranceSchemeRepository insuranceSchemeRepository;

    public AdminInsuranceController(InsuranceSchemeRepository insuranceSchemeRepository) {
        this.insuranceSchemeRepository = insuranceSchemeRepository;
    }

    @GetMapping
    public ResponseEntity<List<InsuranceScheme>> getAllInsuranceSchemes() {
        return ResponseEntity.ok(insuranceSchemeRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InsuranceScheme> getInsuranceSchemeById(@PathVariable Long id) {
        InsuranceScheme scheme = insuranceSchemeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Insurance scheme not found with id: " + id));
        return ResponseEntity.ok(scheme);
    }

    @PostMapping
    public ResponseEntity<InsuranceScheme> createInsuranceScheme(@RequestBody InsuranceScheme scheme) {
        if (scheme.getName() == null || scheme.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Scheme name is required");
        }
        if (scheme.getDescription() == null || scheme.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Scheme description is required");
        }
        if (scheme.getSchemeType() == null || scheme.getSchemeType().trim().isEmpty()) {
            scheme.setSchemeType("WEATHER_BASED");
        }
        if (scheme.getApplicableCrops() == null || scheme.getApplicableCrops().trim().isEmpty()) {
            scheme.setApplicableCrops("All");
        }
        if (scheme.getPremiumRatePercentage() == null) {
            scheme.setPremiumRatePercentage(new java.math.BigDecimal("2.00"));
        }
        if (scheme.getSumInsuredPerAcre() == null) {
            scheme.setSumInsuredPerAcre(new java.math.BigDecimal("30000.00"));
        }

        scheme.setLastVerifiedDate(LocalDate.now());
        InsuranceScheme saved = insuranceSchemeRepository.save(scheme);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<InsuranceScheme> updateInsuranceScheme(
            @PathVariable Long id,
            @RequestBody InsuranceScheme updateData) {
        InsuranceScheme existing = insuranceSchemeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Insurance scheme not found with id: " + id));

        if (updateData.getName() != null && !updateData.getName().trim().isEmpty()) {
            existing.setName(updateData.getName().trim());
        }
        if (updateData.getNameTa() != null) {
            existing.setNameTa(updateData.getNameTa().trim());
        }
        if (updateData.getDescription() != null && !updateData.getDescription().trim().isEmpty()) {
            existing.setDescription(updateData.getDescription().trim());
        }
        if (updateData.getDescriptionTa() != null) {
            existing.setDescriptionTa(updateData.getDescriptionTa().trim());
        }
        if (updateData.getSchemeType() != null && !updateData.getSchemeType().trim().isEmpty()) {
            existing.setSchemeType(updateData.getSchemeType().trim());
        }
        if (updateData.getApplicableCrops() != null && !updateData.getApplicableCrops().trim().isEmpty()) {
            existing.setApplicableCrops(updateData.getApplicableCrops().trim());
        }
        if (updateData.getApplicableCropsTa() != null) {
            existing.setApplicableCropsTa(updateData.getApplicableCropsTa().trim());
        }
        if (updateData.getPremiumRatePercentage() != null) {
            existing.setPremiumRatePercentage(updateData.getPremiumRatePercentage());
        }
        if (updateData.getSumInsuredPerAcre() != null) {
            existing.setSumInsuredPerAcre(updateData.getSumInsuredPerAcre());
        }

        // Automatically set lastVerifiedDate to today's date
        existing.setLastVerifiedDate(LocalDate.now());

        InsuranceScheme saved = insuranceSchemeRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInsuranceScheme(@PathVariable Long id) {
        if (!insuranceSchemeRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Insurance scheme not found with id: " + id);
        }
        insuranceSchemeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
