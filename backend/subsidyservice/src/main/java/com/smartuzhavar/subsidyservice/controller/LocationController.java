package com.smartuzhavar.subsidyservice.controller;

import com.smartuzhavar.subsidyservice.entity.Block;
import com.smartuzhavar.subsidyservice.entity.DistrictCropStat;
import com.smartuzhavar.subsidyservice.entity.Taluk;
import com.smartuzhavar.subsidyservice.repository.BlockRepository;
import com.smartuzhavar.subsidyservice.repository.DistrictCropStatRepository;
import com.smartuzhavar.subsidyservice.repository.TalukRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class LocationController {

    private final TalukRepository talukRepository;
    private final BlockRepository blockRepository;
    private final DistrictCropStatRepository districtCropStatRepository;

    public LocationController(TalukRepository talukRepository,
                              BlockRepository blockRepository,
                              DistrictCropStatRepository districtCropStatRepository) {
        this.talukRepository = talukRepository;
        this.blockRepository = blockRepository;
        this.districtCropStatRepository = districtCropStatRepository;
    }

    @GetMapping("/districts/{districtId}/taluks")
    public ResponseEntity<List<Taluk>> getTaluksByDistrictId(@PathVariable Long districtId) {
        return ResponseEntity.ok(talukRepository.findByDistrictIdOrderByNameAsc(districtId));
    }

    @GetMapping("/districts/name/{districtName}/taluks")
    public ResponseEntity<List<Taluk>> getTaluksByDistrictName(@PathVariable String districtName) {
        return ResponseEntity.ok(talukRepository.findByDistrictNameIgnoreCaseOrderByNameAsc(districtName));
    }

    @GetMapping("/taluks/{talukId}/blocks")
    public ResponseEntity<List<Block>> getBlocksByTalukId(@PathVariable Long talukId) {
        return ResponseEntity.ok(blockRepository.findByTalukIdOrderByNameAsc(talukId));
    }

    @GetMapping("/districts/{districtId}/crop-stats")
    public ResponseEntity<List<DistrictCropStat>> getCropStatsByDistrictId(@PathVariable Long districtId) {
        return ResponseEntity.ok(districtCropStatRepository.findByDistrictId(districtId));
    }

    @GetMapping("/districts/name/{districtName}/crop-stats")
    public ResponseEntity<List<DistrictCropStat>> getCropStatsByDistrictName(@PathVariable String districtName) {
        return ResponseEntity.ok(districtCropStatRepository.findByDistrictNameIgnoreCase(districtName));
    }
}
