package com.smartuzhavar.subsidyservice.controller;

import com.smartuzhavar.subsidyservice.dto.BlockOfficeResponse;
import com.smartuzhavar.subsidyservice.entity.BlockOffice;
import com.smartuzhavar.subsidyservice.exception.ResourceNotFoundException;
import com.smartuzhavar.subsidyservice.repository.BlockOfficeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/blocks")
public class BlockOfficeController {

    private final BlockOfficeRepository blockOfficeRepository;

    public BlockOfficeController(BlockOfficeRepository blockOfficeRepository) {
        this.blockOfficeRepository = blockOfficeRepository;
    }

    /**
     * GET /api/blocks/{blockId}/office
     * Returns the Agricultural Extension Center Office details for the given block ID.
     */
    @GetMapping("/{blockId}/office")
    public ResponseEntity<BlockOfficeResponse> getOfficeByBlockId(@PathVariable Long blockId) {
        BlockOffice office = blockOfficeRepository.findByBlockId(blockId)
                .orElseThrow(() -> new ResourceNotFoundException("Office location not available for block ID: " + blockId));
        return ResponseEntity.ok(BlockOfficeResponse.fromEntity(office));
    }

    /**
     * GET /api/blocks/office?district=Thanjavur&block=Papanasam
     * Allows searching for block office by block name (and optional district name).
     */
    @GetMapping("/office")
    public ResponseEntity<BlockOfficeResponse> getOfficeByName(
            @RequestParam(required = false) String district,
            @RequestParam String block) {

        Optional<BlockOffice> officeOpt;
        if (district != null && !district.trim().isEmpty()) {
            officeOpt = blockOfficeRepository.findFirstByDistrictNameIgnoreCaseAndBlockNameIgnoreCase(district.trim(), block.trim());
        } else {
            officeOpt = blockOfficeRepository.findFirstByBlockNameIgnoreCase(block.trim());
        }

        if (officeOpt.isEmpty()) {
            // Fallback: search without case/spacing
            officeOpt = blockOfficeRepository.findAll().stream()
                    .filter(o -> o.getBlockName().equalsIgnoreCase(block.trim()) ||
                                 o.getBlockName().replaceAll("[^a-zA-Z0-9]", "").equalsIgnoreCase(block.replaceAll("[^a-zA-Z0-9]", "")))
                    .findFirst();
        }

        BlockOffice office = officeOpt
                .orElseThrow(() -> new ResourceNotFoundException("Office location not available for block: " + block));

        return ResponseEntity.ok(BlockOfficeResponse.fromEntity(office));
    }
}
