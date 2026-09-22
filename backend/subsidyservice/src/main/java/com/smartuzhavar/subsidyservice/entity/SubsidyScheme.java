package com.smartuzhavar.subsidyservice.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "subsidy_schemes")
public class SubsidyScheme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "name_ta", length = 255)
    private String nameTa;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "description_ta", columnDefinition = "TEXT")
    private String descriptionTa;

    @Column(name = "applicable_crops", length = 255)
    private String applicableCrops;

    @Column(name = "applicable_crops_ta", length = 255)
    private String applicableCropsTa;

    @Column(name = "applicable_districts", length = 255)
    private String applicableDistricts;

    @Column(name = "subsidy_amount", length = 100)
    private String subsidyAmount;

    @Column(name = "source_url", length = 255)
    private String sourceUrl;

    @Column(name = "last_verified_date")
    private LocalDate lastVerifiedDate;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public SubsidyScheme() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getNameTa() {
        return nameTa;
    }

    public void setNameTa(String nameTa) {
        this.nameTa = nameTa;
    }

    public String getDescriptionTa() {
        return descriptionTa;
    }

    public void setDescriptionTa(String descriptionTa) {
        this.descriptionTa = descriptionTa;
    }

    public String getApplicableCropsTa() {
        return applicableCropsTa;
    }

    public void setApplicableCropsTa(String applicableCropsTa) {
        this.applicableCropsTa = applicableCropsTa;
    }

    public String getApplicableCrops() {
        return applicableCrops;
    }

    public void setApplicableCrops(String applicableCrops) {
        this.applicableCrops = applicableCrops;
    }

    public String getApplicableDistricts() {
        return applicableDistricts;
    }

    public void setApplicableDistricts(String applicableDistricts) {
        this.applicableDistricts = applicableDistricts;
    }

    public String getSubsidyAmount() {
        return subsidyAmount;
    }

    public void setSubsidyAmount(String subsidyAmount) {
        this.subsidyAmount = subsidyAmount;
    }

    private String sanitizeUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return url;
        }
        String clean = url.trim();
        clean = clean.replaceAll("(?i)tntagrisnet\\.tn\\.gov\\.in", "www.tnagrisnet.tn.gov.in");
        clean = clean.replaceAll("(?i)^https?://tnagrisnet\\.tn\\.gov\\.in", "https://www.tnagrisnet.tn.gov.in");
        if (!clean.matches("(?i)^https?://.*")) {
            clean = "https://" + clean;
        }
        return clean;
    }

    public String getSourceUrl() {
        return sanitizeUrl(sourceUrl);
    }

    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sanitizeUrl(sourceUrl);
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDate getLastVerifiedDate() {
        return lastVerifiedDate;
    }

    public void setLastVerifiedDate(LocalDate lastVerifiedDate) {
        this.lastVerifiedDate = lastVerifiedDate;
    }
}
 