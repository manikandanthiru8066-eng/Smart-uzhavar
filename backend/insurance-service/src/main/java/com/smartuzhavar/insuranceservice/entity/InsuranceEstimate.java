package com.smartuzhavar.insuranceservice.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "insurance_estimates")
public class InsuranceEstimate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id", nullable = false)
    private Farmer farmer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "scheme_id", nullable = false)
    private InsuranceScheme scheme;

    @Column(name = "land_size_acres", nullable = false, precision = 10, scale = 2)
    private BigDecimal landSizeAcres;

    @Column(nullable = false, length = 100)
    private String crop;

    @Column(name = "premium_estimate", nullable = false, precision = 12, scale = 2)
    private BigDecimal premiumEstimate;

    @Column(name = "sum_insured", nullable = false, precision = 12, scale = 2)
    private BigDecimal sumInsured;

    @Column(name = "calculated_at", updatable = false)
    private Instant calculatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.calculatedAt == null) {
            this.calculatedAt = Instant.now();
        }
    }

    public InsuranceEstimate() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Farmer getFarmer() {
        return farmer;
    }

    public void setFarmer(Farmer farmer) {
        this.farmer = farmer;
    }

    public InsuranceScheme getScheme() {
        return scheme;
    }

    public void setScheme(InsuranceScheme scheme) {
        this.scheme = scheme;
    }

    public BigDecimal getLandSizeAcres() {
        return landSizeAcres;
    }

    public void setLandSizeAcres(BigDecimal landSizeAcres) {
        this.landSizeAcres = landSizeAcres;
    }

    public String getCrop() {
        return crop;
    }

    public void setCrop(String crop) {
        this.crop = crop;
    }

    public BigDecimal getPremiumEstimate() {
        return premiumEstimate;
    }

    public void setPremiumEstimate(BigDecimal premiumEstimate) {
        this.premiumEstimate = premiumEstimate;
    }

    public BigDecimal getSumInsured() {
        return sumInsured;
    }

    public void setSumInsured(BigDecimal sumInsured) {
        this.sumInsured = sumInsured;
    }

    public Instant getCalculatedAt() {
        return calculatedAt;
    }

    public void setCalculatedAt(Instant calculatedAt) {
        this.calculatedAt = calculatedAt;
    }
}
