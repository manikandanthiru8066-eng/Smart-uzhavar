package com.smartuzhavar.subsidyservice.controller;

import com.smartuzhavar.subsidyservice.entity.District;
import com.smartuzhavar.subsidyservice.entity.Taluk;
import com.smartuzhavar.subsidyservice.repository.DistrictRepository;
import com.smartuzhavar.subsidyservice.repository.TalukRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/districts")
public class DistrictController {

    private final DistrictRepository districtRepository;
    private final TalukRepository talukRepository;

    public DistrictController(DistrictRepository districtRepository, TalukRepository talukRepository) {
        this.districtRepository = districtRepository;
        this.talukRepository = talukRepository;
    }

    @GetMapping
    public ResponseEntity<List<District>> getAllDistricts() {
        return ResponseEntity.ok(districtRepository.findAll());
    }

    @GetMapping("/{districtId}/taluks")
    public ResponseEntity<List<Taluk>> getTaluksByDistrict(@PathVariable("districtId") Long districtId) {
        List<Taluk> taluks = talukRepository.findByDistrictIdOrderByNameAsc(districtId);
        return ResponseEntity.ok(taluks);
    }
}

