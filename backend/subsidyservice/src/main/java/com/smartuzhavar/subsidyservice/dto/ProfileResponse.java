package com.smartuzhavar.subsidyservice.dto;

import java.math.BigDecimal;

public class ProfileResponse {
    private String username;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String districtName;
    private String cropGrown;
    private BigDecimal landSizeHectares;

    public ProfileResponse() {}

    public ProfileResponse(String username, String fullName, String email, String phoneNumber, 
                           String districtName, String cropGrown, BigDecimal landSizeHectares) {
        this.username = username;
        this.fullName = fullName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.districtName = districtName;
        this.cropGrown = cropGrown;
        this.landSizeHectares = landSizeHectares;
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

    public String getCropGrown() {
        return cropGrown;
    }

    public void setCropGrown(String cropGrown) {
        this.cropGrown = cropGrown;
    }

    public BigDecimal getLandSizeHectares() {
        return landSizeHectares;
    }

    public void setLandSizeHectares(BigDecimal landSizeHectares) {
        this.landSizeHectares = landSizeHectares;
    }
}
