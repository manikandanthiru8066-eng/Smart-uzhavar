package com.smartuzhavar.subsidyservice.dto;

import java.math.BigDecimal;

public class AdminCropProfileDto {
    private Long id;
    private String cropGrown;
    private String district;
    private String taluk;
    private String block;
    private BigDecimal landSizeAcres;
    private BigDecimal landSizeHectares;
    private String irrigationType;
    private Integer cropDurationMonths;
    private String season;

    public AdminCropProfileDto() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCropGrown() {
        return cropGrown;
    }

    public void setCropGrown(String cropGrown) {
        this.cropGrown = cropGrown;
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

    public String getIrrigationType() {
        return irrigationType;
    }

    public void setIrrigationType(String irrigationType) {
        this.irrigationType = irrigationType;
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
}
