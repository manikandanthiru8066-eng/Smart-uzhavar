package com.smartuzhavar.subsidyservice.controller;

import com.smartuzhavar.subsidyservice.entity.SubsidyScheme;
import com.smartuzhavar.subsidyservice.exception.ResourceNotFoundException;
import com.smartuzhavar.subsidyservice.repository.SubsidySchemeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/subsidies")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSubsidyController {

    private final SubsidySchemeRepository subsidySchemeRepository;

    public AdminSubsidyController(SubsidySchemeRepository subsidySchemeRepository) {
        this.subsidySchemeRepository = subsidySchemeRepository;
    }

    @GetMapping
    public ResponseEntity<List<SubsidyScheme>> getAllSubsidies() {
        return ResponseEntity.ok(subsidySchemeRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubsidyScheme> getSubsidyById(@PathVariable Long id) {
        SubsidyScheme scheme = subsidySchemeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subsidy scheme not found with id: " + id));
        return ResponseEntity.ok(scheme);
    }

    @PostMapping
    public ResponseEntity<SubsidyScheme> createSubsidy(@RequestBody SubsidyScheme scheme) {
        if (scheme.getName() == null || scheme.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Scheme name is required");
        }
        if (scheme.getDescription() == null || scheme.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Scheme description is required");
        }

        // Newly created or verified schemes have lastVerifiedDate set to today
        scheme.setLastVerifiedDate(LocalDate.now());
        scheme.setSourceUrl(sanitizeSourceUrl(scheme.getSourceUrl()));
        SubsidyScheme saved = subsidySchemeRepository.save(scheme);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SubsidyScheme> updateSubsidy(
            @PathVariable Long id,
            @RequestBody SubsidyScheme updateData) {
        SubsidyScheme existing = subsidySchemeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subsidy scheme not found with id: " + id));

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
        if (updateData.getApplicableCrops() != null) {
            existing.setApplicableCrops(updateData.getApplicableCrops().trim());
        }
        if (updateData.getApplicableCropsTa() != null) {
            existing.setApplicableCropsTa(updateData.getApplicableCropsTa().trim());
        }
        if (updateData.getApplicableDistricts() != null) {
            existing.setApplicableDistricts(updateData.getApplicableDistricts().trim());
        }
        if (updateData.getSubsidyAmount() != null) {
            existing.setSubsidyAmount(updateData.getSubsidyAmount().trim());
        }
        if (updateData.getSourceUrl() != null) {
            existing.setSourceUrl(sanitizeSourceUrl(updateData.getSourceUrl()));
        }

        // On successful save, automatically set lastVerifiedDate to today's date
        existing.setLastVerifiedDate(LocalDate.now());

        SubsidyScheme saved = subsidySchemeRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubsidy(@PathVariable Long id) {
        if (!subsidySchemeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Subsidy scheme not found with id: " + id);
        }
        subsidySchemeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private String sanitizeSourceUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return null;
        }
        String clean = url.trim();
        clean = clean.replaceAll("(?i)tntagrisnet\\.tn\\.gov\\.in", "www.tnagrisnet.tn.gov.in");
        clean = clean.replaceAll("(?i)^https?://tnagrisnet\\.tn\\.gov\\.in", "https://www.tnagrisnet.tn.gov.in");
        if (!clean.matches("(?i)^https?://.*")) {
            clean = "https://" + clean;
        }
        return clean;
    }
}
