package com.smartuzhavar.subsidyservice.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
    name = "subsidy_applications",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"farmer_id", "scheme_id"})
    }
)
public class SubsidyApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id", nullable = false)
    private Farmer farmer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scheme_id", nullable = false)
    private SubsidyScheme scheme;

    @Column(name = "application_date", updatable = false)
    private Instant applicationDate;

    @Column(nullable = false, length = 50)
    private String status = "PENDING";

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @PrePersist
    protected void onCreate() {
        if (this.applicationDate == null) {
            this.applicationDate = Instant.now();
        }
        if (this.status == null) {
            this.status = "PENDING";
        }
    }

    public SubsidyApplication() {}

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

    public SubsidyScheme getScheme() {
        return scheme;
    }

    public void setScheme(SubsidyScheme scheme) {
        this.scheme = scheme;
    }

    public Instant getApplicationDate() {
        return applicationDate;
    }

    public void setApplicationDate(Instant applicationDate) {
        this.applicationDate = applicationDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
