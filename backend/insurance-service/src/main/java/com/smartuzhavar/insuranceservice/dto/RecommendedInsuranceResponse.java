package com.smartuzhavar.insuranceservice.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class RecommendedInsuranceResponse {
    private Long id;
    private String name;
    private String nameTa;
    private String description;
    private String descriptionTa;
    private String schemeType;
    private String applicableCrops;
    private String applicableCropsTa;
    private BigDecimal premiumRatePercentage;
    private BigDecimal sumInsuredPerAcre;
    private double matchScore;
    private List<String> matchReasons = new ArrayList<>();

    public RecommendedInsuranceResponse() {}

    public RecommendedInsuranceResponse(Long id, String name, String nameTa, String description, String descriptionTa,
                                         String schemeType, String applicableCrops, String applicableCropsTa,
                                         BigDecimal premiumRatePercentage, BigDecimal sumInsuredPerAcre,
                                         double matchScore, List<String> matchReasons) {
        this.id = id;
        this.name = name;
        this.nameTa = nameTa;
        this.description = description;
        this.descriptionTa = descriptionTa;
        this.schemeType = schemeType;
        this.applicableCrops = applicableCrops;
        this.applicableCropsTa = applicableCropsTa;
        this.premiumRatePercentage = premiumRatePercentage;
        this.sumInsuredPerAcre = sumInsuredPerAcre;
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

    public String getApplicableCropsTa() {
        return applicableCropsTa;
    }

    public void setApplicableCropsTa(String applicableCropsTa) {
        this.applicableCropsTa = applicableCropsTa;
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
