package com.smartuzhavar.insuranceservice.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "insurance_schemes")
public class InsuranceScheme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "scheme_type", nullable = false, length = 50)
    private String schemeType; // WEATHER_BASED, YIELD_BASED, REVENUE_BASED

    @Column(name = "applicable_crops", nullable = false, length = 255)
    private String applicableCrops; // Comma-separated list of crops, or "All"

    @Column(name = "premium_rate_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal premiumRatePercentage;

    @Column(name = "sum_insured_per_acre", nullable = false, precision = 12, scale = 2)
    private BigDecimal sumInsuredPerAcre;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public InsuranceScheme() {}

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

    public String getSchemeType() {
        return schemeType;
    }

    public void setSchemeType(String schemeType) {
        this.schemeType = schemeType;
    }

    public String getApplicableCrops() {
        return applicableCrops;
    }

    public void setApplicableCrops(String applicableCrops) {
        this.applicableCrops = applicableCrops;
    }

    public BigDecimal getPremiumRatePercentage() {
        return premiumRatePercentage;
    }

    public void setPremiumRatePercentage(BigDecimal premiumRatePercentage) {
        this.premiumRatePercentage = premiumRatePercentage;
    }

    public BigDecimal getSumInsuredPerAcre() {
        return sumInsuredPerAcre;
    }

    public void setSumInsuredPerAcre(BigDecimal sumInsuredPerAcre) {
        this.sumInsuredPerAcre = sumInsuredPerAcre;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
