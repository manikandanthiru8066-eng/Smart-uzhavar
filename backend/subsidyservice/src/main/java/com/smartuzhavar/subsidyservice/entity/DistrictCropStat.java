package com.smartuzhavar.subsidyservice.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "district_crop_stats")
public class DistrictCropStat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "district_id", nullable = false)
    private District district;

    @Column(name = "crop", nullable = false, length = 100)
    private String crop;

    @Column(name = "season", length = 50)
    private String season;

    @Column(name = "year", length = 20)
    private String year;

    @Column(name = "area_hectares", precision = 12, scale = 2)
    private BigDecimal areaHectares;

    @Column(name = "production_tonnes", precision = 12, scale = 2)
    private BigDecimal productionTonnes;

    @Column(name = "yield_kg_per_ha", precision = 12, scale = 2)
    private BigDecimal yieldKgPerHa;

    @Column(name = "is_top_crop")
    private Boolean isTopCrop = false;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public DistrictCropStat() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public District getDistrict() {
        return district;
    }

    public void setDistrict(District district) {
        this.district = district;
    }

    public String getCrop() {
        return crop;
    }

    public void setCrop(String crop) {
        this.crop = crop;
    }

    public String getSeason() {
        return season;
    }

    public void setSeason(String season) {
        this.season = season;
    }

    public String getYear() {
        return year;
    }

    public void setYear(String year) {
        this.year = year;
    }

    public BigDecimal getAreaHectares() {
        return areaHectares;
    }

    public void setAreaHectares(BigDecimal areaHectares) {
        this.areaHectares = areaHectares;
    }

    public BigDecimal getProductionTonnes() {
        return productionTonnes;
    }

    public void setProductionTonnes(BigDecimal productionTonnes) {
        this.productionTonnes = productionTonnes;
    }

    public BigDecimal getYieldKgPerHa() {
        return yieldKgPerHa;
    }

    public void setYieldKgPerHa(BigDecimal yieldKgPerHa) {
        this.yieldKgPerHa = yieldKgPerHa;
    }

    public Boolean getIsTopCrop() {
        return isTopCrop;
    }

    public void setIsTopCrop(Boolean isTopCrop) {
        this.isTopCrop = isTopCrop;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
