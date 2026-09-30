package com.smartuzhavar.subsidyservice.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class AdminUserDto {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String role;
    private Instant createdAt;

    // Farm / location summary from primary profile
    private String district;
    private String taluk;
    private String block;
    private String primaryCrop;
    private BigDecimal landSizeAcres;
    private int cropProfileCount;

    public AdminUserDto() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getTaluk() {
        return taluk;
    }

    public void setTaluk(String taluk) {
        this.taluk = taluk;
    }

    public String getBlock() {
        return block;
    }

    public void setBlock(String block) {
        this.block = block;
    }

    public String getPrimaryCrop() {
        return primaryCrop;
    }

    public void setPrimaryCrop(String primaryCrop) {
        this.primaryCrop = primaryCrop;
    }

    public BigDecimal getLandSizeAcres() {
        return landSizeAcres;
    }

    public void setLandSizeAcres(BigDecimal landSizeAcres) {
        this.landSizeAcres = landSizeAcres;
    }

    public int getCropProfileCount() {
        return cropProfileCount;
    }

    public void setCropProfileCount(int cropProfileCount) {
        this.cropProfileCount = cropProfileCount;
    }
}
