package com.smartuzhavar.insuranceservice.controller;

import com.smartuzhavar.insuranceservice.entity.Block;
import com.smartuzhavar.insuranceservice.repository.BlockRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/taluks")
public class TalukController {

    private final BlockRepository blockRepository;

    public TalukController(BlockRepository blockRepository) {
        this.blockRepository = blockRepository;
    }

    @GetMapping("/{talukId}/blocks")
    public ResponseEntity<List<Block>> getBlocksByTaluk(@PathVariable("talukId") Long talukId) {
        List<Block> blocks = blockRepository.findByTalukId(talukId);
        return ResponseEntity.ok(blocks);
    }
}
