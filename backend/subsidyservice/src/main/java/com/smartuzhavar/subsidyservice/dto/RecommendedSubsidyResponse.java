package com.smartuzhavar.subsidyservice.dto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class RecommendedSubsidyResponse {
    private Long id;
    private String name;
    private String nameTa;
    private String description;
    private String descriptionTa;
    private String applicableCrops;
    private String applicableCropsTa;
    private String applicableDistricts;
    private String subsidyAmount;
    private String sourceUrl;
    private Instant createdAt;
    private double matchScore;
    private List<String> matchReasons = new ArrayList<>();

    public RecommendedSubsidyResponse() {}

    public RecommendedSubsidyResponse(Long id, String name, String nameTa, String description, String descriptionTa,
                                       String applicableCrops, String applicableCropsTa, String applicableDistricts, 
                                       String subsidyAmount, Instant createdAt, double matchScore, List<String> matchReasons) {
        this(id, name, nameTa, description, descriptionTa, applicableCrops, applicableCropsTa, applicableDistricts, subsidyAmount, null, createdAt, matchScore, matchReasons);
    }

    public RecommendedSubsidyResponse(Long id, String name, String nameTa, String description, String descriptionTa,
                                       String applicableCrops, String applicableCropsTa, String applicableDistricts, 
                                       String subsidyAmount, String sourceUrl, Instant createdAt, double matchScore, List<String> matchReasons) {
        this.id = id;
        this.name = name;
        this.nameTa = nameTa;
        this.description = description;
        this.descriptionTa = descriptionTa;
        this.applicableCrops = applicableCrops;
        this.applicableCropsTa = applicableCropsTa;
        this.applicableDistricts = applicableDistricts;
        this.subsidyAmount = subsidyAmount;
        this.sourceUrl = sourceUrl;
        this.createdAt = createdAt;
        this.matchScore = matchScore;
        this.matchReasons = matchReasons != null ? matchReasons : new ArrayList<>();
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

    public String getNameTa() {
        return nameTa;
    }

    public void setNameTa(String nameTa) {
        this.nameTa = nameTa;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDescriptionTa() {
        return descriptionTa;
    }

    public void setDescriptionTa(String descriptionTa) {
        this.descriptionTa = descriptionTa;
    }

    public String getApplicableCrops() {
        return applicableCrops;
    }

    public void setApplicableCrops(String applicableCrops) {
        this.applicableCrops = applicableCrops;
    }

    public String getApplicableCropsTa() {
        return applicableCropsTa;
    }

    public void setApplicableCropsTa(String applicableCropsTa) {
        this.applicableCropsTa = applicableCropsTa;
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

    public double getMatchScore() {
        return matchScore;
    }

    public void setMatchScore(double matchScore) {
        this.matchScore = matchScore;
    }

    public List<String> getMatchReasons() {
        return matchReasons;
    }

    public void setMatchReasons(List<String> matchReasons) {
        this.matchReasons = matchReasons;
    }
}
