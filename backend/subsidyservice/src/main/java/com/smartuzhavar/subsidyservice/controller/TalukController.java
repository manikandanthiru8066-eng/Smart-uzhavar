package com.smartuzhavar.subsidyservice.controller;

import com.smartuzhavar.subsidyservice.entity.Block;
import com.smartuzhavar.subsidyservice.repository.BlockRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/taluks")
@CrossOrigin(origins = "*")
public class TalukController {

    private final BlockRepository blockRepository;

    public TalukController(BlockRepository blockRepository) {
        this.blockRepository = blockRepository;
    }

    @GetMapping("/{talukId}/blocks")
    public ResponseEntity<List<Block>> getBlocksByTaluk(@PathVariable("talukId") Long talukId) {
        List<Block> blocks = blockRepository.findByTalukIdOrderByNameAsc(talukId);
        return ResponseEntity.ok(blocks);
    }
}
