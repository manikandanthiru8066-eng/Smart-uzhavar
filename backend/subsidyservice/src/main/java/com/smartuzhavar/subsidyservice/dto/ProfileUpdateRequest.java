package com.smartuzhavar.subsidyservice.dto;

import java.math.BigDecimal;

public class ProfileUpdateRequest {
    private String fullName;
    private String email;
    private String phoneNumber;
    private String districtName;
    private String cropGrown;
    private Integer cropDurationMonths;
    private String season;
    private BigDecimal landSizeHectares;

    public ProfileUpdateRequest() {}

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

    public BigDecimal getLandSizeHectares() {
        return landSizeHectares;
    }

    public void setLandSizeHectares(BigDecimal landSizeHectares) {
        this.landSizeHectares = landSizeHectares;
    }
}

