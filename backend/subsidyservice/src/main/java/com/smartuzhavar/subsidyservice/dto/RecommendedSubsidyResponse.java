package com.smartuzhavar.subsidyservice.dto;

import java.time.Instant;

public class RecommendedSubsidyResponse {
    private Long id;
    private String name;
    private String description;
    private String applicableCrops;
    private String applicableDistricts;
    private String subsidyAmount;
    private Instant createdAt;
    private double matchScore;

    public RecommendedSubsidyResponse() {}

    public RecommendedSubsidyResponse(Long id, String name, String description, 
                                      String applicableCrops, String applicableDistricts, 
                                      String subsidyAmount, Instant createdAt, double matchScore) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.applicableCrops = applicableCrops;
        this.applicableDistricts = applicableDistricts;
        this.subsidyAmount = subsidyAmount;
        this.createdAt = createdAt;
        this.matchScore = matchScore;
    }

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

    public double getMatchScore() {
        return matchScore;
    }

    public void setMatchScore(double matchScore) {
        this.matchScore = matchScore;
    }
}
