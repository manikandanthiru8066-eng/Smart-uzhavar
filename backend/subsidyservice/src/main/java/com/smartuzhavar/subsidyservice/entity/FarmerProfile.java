package com.smartuzhavar.subsidyservice.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "farmer_profiles")
public class FarmerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id", nullable = false)
    private Farmer farmer;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "district_id")
    private District district;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "taluk_id")
    private Taluk taluk;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "block_id")
    private Block blockEntity;

    @Column(name = "block", length = 100)
    private String block;


    @Column(name = "crop_grown", length = 100)
    private String cropGrown;

    @Column(name = "crop_duration_months")
    private Integer cropDurationMonths;

    @Column(name = "season", length = 50)
    private String season;

    @Column(name = "irrigation_type", length = 50)
    private String irrigationType;

    @Column(name = "land_size_acres", precision = 10, scale = 2)
    private BigDecimal landSizeAcres;

    @Column(name = "land_size_hectares", precision = 10, scale = 2)
    private BigDecimal landSizeHectares;


    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public FarmerProfile() {}

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

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public District getDistrict() {
        return district;
    }

    public void setDistrict(District district) {
        this.district = district;
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

    public String getBlock() {
        return block;
    }

    public void setBlock(String block) {
        this.block = block;
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


    public Taluk getTaluk() {
        return taluk;
    }

    public void setTaluk(Taluk taluk) {
        this.taluk = taluk;
    }

    public Block getBlockEntity() {
        return blockEntity;
    }

    public void setBlockEntity(Block blockEntity) {
        this.blockEntity = blockEntity;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

