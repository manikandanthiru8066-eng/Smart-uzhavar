package com.smartuzhavar.insuranceservice.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "taluks")
public class Taluk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "lgd_subdistrict_code", nullable = false, unique = true)
    private Integer lgdSubdistrictCode;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "district_id", nullable = false)
    private District district;

    @JsonIgnore
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "taluk_blocks",
        joinColumns = @JoinColumn(name = "taluk_id"),
        inverseJoinColumns = @JoinColumn(name = "block_id")
    )
    private Set<Block> blocks = new HashSet<>();

    public Taluk() {}

    public Taluk(String name, Integer lgdSubdistrictCode, District district) {
        this.name = name;
        this.lgdSubdistrictCode = lgdSubdistrictCode;
        this.district = district;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getLgdSubdistrictCode() { return lgdSubdistrictCode; }
    public void setLgdSubdistrictCode(Integer lgdSubdistrictCode) { this.lgdSubdistrictCode = lgdSubdistrictCode; }

    public District getDistrict() { return district; }
    public void setDistrict(District district) { this.district = district; }

    public Set<Block> getBlocks() { return blocks; }
    public void setBlocks(Set<Block> blocks) { this.blocks = blocks; }
}
