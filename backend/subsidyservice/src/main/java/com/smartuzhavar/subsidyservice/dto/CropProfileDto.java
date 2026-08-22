package com.smartuzhavar.subsidyservice.dto;

import java.math.BigDecimal;

public class CropProfileDto {
    private Long id;
    private String cropGrown;
    private Long districtId;
    private String districtName;
    private Long talukId;
    private String talukName;
    private Long blockId;
    private String block;
    private BigDecimal landSizeAcres;
    private BigDecimal landSizeHectares;
    private String irrigationType;
    private Integer cropDurationMonths;
    private String season;

    public CropProfileDto() {}

    public CropProfileDto(Long id, String cropGrown, Long districtId, String districtName, 
                          Long talukId, String talukName, Long blockId, String block, 
                          BigDecimal landSizeAcres, BigDecimal landSizeHectares, 
                          String irrigationType, Integer cropDurationMonths, String season) {
        this.id = id;
        this.cropGrown = cropGrown;
        this.districtId = districtId;
        this.districtName = districtName;
        this.talukId = talukId;
        this.talukName = talukName;
        this.blockId = blockId;
        this.block = block;
        this.landSizeAcres = landSizeAcres;
        this.landSizeHectares = landSizeHectares;
        this.irrigationType = irrigationType;
        this.cropDurationMonths = cropDurationMonths;
        this.season = season;
    }

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

    public Long getDistrictId() {
        return districtId;
    }

    public void setDistrictId(Long districtId) {
        this.districtId = districtId;
    }

    public String getDistrictName() {
        return districtName;
    }

    public void setDistrictName(String districtName) {
        this.districtName = districtName;
    }

    public Long getTalukId() {
        return talukId;
    }

    public void setTalukId(Long talukId) {
        this.talukId = talukId;
    }

    public String getTalukName() {
        return talukName;
    }

    public void setTalukName(String talukName) {
        this.talukName = talukName;
    }

    public Long getBlockId() {
        return blockId;
    }

    public void setBlockId(Long blockId) {
        this.blockId = blockId;
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

