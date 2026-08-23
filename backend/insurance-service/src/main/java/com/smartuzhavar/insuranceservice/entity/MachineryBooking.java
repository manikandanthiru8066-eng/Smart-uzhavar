package com.smartuzhavar.insuranceservice.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "machinery_bookings")
public class MachineryBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id")
    private Farmer farmer;

    @Column(name = "farmer_name", length = 100)
    private String farmerName;

    @Column(name = "farmer_username", length = 50)
    private String farmerUsername;

    @Column(name = "block_id")
    private Long blockId;

    @Column(name = "block_name", length = 100)
    private String blockName;

    @Column(name = "district_name", length = 100)
    private String districtName;

    @Column(name = "village", length = 100)
    private String village;

    @Column(name = "machine_type", nullable = false, length = 100)
    private String machineType;

    @Column(name = "acres")
    private Double acres;

    @Column(name = "required_date", length = 50)
    private String requiredDate;

    @Column(name = "status", length = 50)
    private String status = "REQUESTED";

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.status == null) {
            this.status = "REQUESTED";
        }
    }

    public MachineryBooking() {}

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

    public String getFarmerName() {
        return farmerName;
    }

    public void setFarmerName(String farmerName) {
        this.farmerName = farmerName;
    }

    public String getFarmerUsername() {
        return farmerUsername;
    }

    public void setFarmerUsername(String farmerUsername) {
        this.farmerUsername = farmerUsername;
    }

    public Long getBlockId() {
        return blockId;
    }

    public void setBlockId(Long blockId) {
        this.blockId = blockId;
    }

    public String getBlockName() {
        return blockName;
    }

    public void setBlockName(String blockName) {
        this.blockName = blockName;
    }

    public String getDistrictName() {
        return districtName;
    }

    public void setDistrictName(String districtName) {
        this.districtName = districtName;
    }

    public String getVillage() {
        return village;
    }

    public void setVillage(String village) {
        this.village = village;
    }

    public String getMachineType() {
        return machineType;
    }

    public void setMachineType(String machineType) {
        this.machineType = machineType;
    }

    public Double getAcres() {
        return acres;
    }

    public void setAcres(Double acres) {
        this.acres = acres;
    }

    public String getRequiredDate() {
        return requiredDate;
    }

    public void setRequiredDate(String requiredDate) {
        this.requiredDate = requiredDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
