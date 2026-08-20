package com.smartuzhavar.subsidyservice.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "blocks")
public class Block {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "taluk_id", nullable = false)
    private Taluk taluk;

    public Block() {}

    public Block(String name, Taluk taluk) {
        this.name = name;
        this.taluk = taluk;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Taluk getTaluk() {
        return taluk;
    }

    public void setTaluk(Taluk taluk) {
        this.taluk = taluk;
    }
}
