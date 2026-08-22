package com.smartuzhavar.subsidyservice.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "blocks")
public class Block {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "lgd_block_code", nullable = false, unique = true, length = 20)
    private String lgdBlockCode;

    @JsonIgnore
    @ManyToMany(mappedBy = "blocks", fetch = FetchType.LAZY)
    private Set<Taluk> taluks = new HashSet<>();

    public Block() {}

    public Block(String name, String lgdBlockCode) {
        this.name = name;
        this.lgdBlockCode = lgdBlockCode;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLgdBlockCode() { return lgdBlockCode; }
    public void setLgdBlockCode(String lgdBlockCode) { this.lgdBlockCode = lgdBlockCode; }

    public Set<Taluk> getTaluks() { return taluks; }
    public void setTaluks(Set<Taluk> taluks) { this.taluks = taluks; }
}
