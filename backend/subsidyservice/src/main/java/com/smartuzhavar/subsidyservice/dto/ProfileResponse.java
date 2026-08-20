package com.smartuzhavar.subsidyservice.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class ProfileResponse {
    private String username;
    private String fullName;
    private String email;
    private String phoneNumber;

    // Legacy fields for primary crop compatibility
    private String districtName;
    private String block;
    private String cropGrown;
    private Integer cropDurationMonths;
    private String season;
    private String irrigationType;
    private BigDecimal landSizeAcres;
    private BigDecimal landSizeHectares;

    // List of 1-to-many Crop Profiles
    private List<CropProfileDto> crops = new ArrayList<>();

    public ProfileResponse() {}

    public ProfileResponse(String username, String fullName, String email, String phoneNumber, 
                           List<CropProfileDto> crops) {
        this.username = username;
        this.fullName = fullName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        if (crops != null) {
            this.crops = crops;
            if (!crops.isEmpty()) {
                CropProfileDto first = crops.get(0);
                this.districtName = first.getDistrictName();
                this.block = first.getBlock();
                this.cropGrown = first.getCropGrown();
                this.cropDurationMonths = first.getCropDurationMonths();
                this.season = first.getSeason();
                this.irrigationType = first.getIrrigationType();
                this.landSizeAcres = first.getLandSizeAcres();
                this.landSizeHectares = first.getLandSizeHectares();
            }
        }
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getDistrictName() {
        return districtName;
    }

    public void setDistrictName(String districtName) {
        this.districtName = districtName;
    }

    public String getBlock() {
        return block;
    }

    public void setBlock(String block) {
        this.block = block;
    }

    public String getCropGrown() {
        return cropGrown;
    }

    public void setCropGrown(String cropGrown) {
        this.cropGrown = cropGrown;
    }

    public Integer getCropDurationMonths() {
        return cropDurationMonths;
    }

    public void setCropDurationMonths(Integer cropDurationMonths) {
        this.cropDurationMonths = cropDurationMonths;
    }

    public String getSeason() {
        return season;
    }

    public void setSeason(String season) {
        this.season = season;
    }

    public String getIrrigationType() {
        return irrigationType;
    }

    public void setIrrigationType(String irrigationType) {
        this.irrigationType = irrigationType;
    }

    public BigDecimal getLandSizeAcres() {
        return landSizeAcres;
    }

    public void setLandSizeAcres(BigDecimal landSizeAcres) {
        this.landSizeAcres = landSizeAcres;
    }

    public BigDecimal getLandSizeHectares() {
        return landSizeHectares;
    }

    public void setLandSizeHectares(BigDecimal landSizeHectares) {
        this.landSizeHectares = landSizeHectares;
    }

    public List<CropProfileDto> getCrops() {
        return crops;
    }

    public void setCrops(List<CropProfileDto> crops) {
        this.crops = crops;
    }
}
