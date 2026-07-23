package com.smartuzhavar.subsidyservice.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "subsidy_schemes")
public class SubsidyScheme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "applicable_crops", length = 255)
    private String applicableCrops;

    @Column(name = "applicable_districts", length = 255)
    private String applicableDistricts;

    @Column(name = "subsidy_amount", length = 100)
    private String subsidyAmount;

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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
