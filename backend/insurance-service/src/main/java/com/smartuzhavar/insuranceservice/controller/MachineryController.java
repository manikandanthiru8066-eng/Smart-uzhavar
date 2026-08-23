package com.smartuzhavar.insuranceservice.controller;

import com.smartuzhavar.insuranceservice.dto.MachineryRequestDto;
import com.smartuzhavar.insuranceservice.entity.Farmer;
import com.smartuzhavar.insuranceservice.entity.MachineryBooking;
import com.smartuzhavar.insuranceservice.repository.FarmerRepository;
import com.smartuzhavar.insuranceservice.repository.MachineryBookingRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/machinery")
public class MachineryController {

    private final MachineryBookingRepository machineryBookingRepository;
    private final FarmerRepository farmerRepository;

    public MachineryController(
            MachineryBookingRepository machineryBookingRepository,
            FarmerRepository farmerRepository
    ) {
        this.machineryBookingRepository = machineryBookingRepository;
        this.farmerRepository = farmerRepository;
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<Map<String, Object>>> getNearbyMachinery(
            @RequestParam String district,
            @RequestParam String block) {

        List<Map<String, Object>> machineryList = new ArrayList<>();

        Map<String, Object> item1 = new HashMap<>();
        item1.put("id", 1L);
        item1.put("name", "Mahindra Arjun 555 Tractor");
        item1.put("nameTa", "மகிந்திரா அர்ஜுன் 555 டிராக்டர்");
        item1.put("type", "TRACTOR");
        item1.put("typeTa", "டிராக்டர்");
        item1.put("district", district);
        item1.put("block", block);
        item1.put("ownerName", "Ramesh Kumar");
        item1.put("ownerPhone", "+91 98765 43210");
        item1.put("ratePerHour", 800.0);
        item1.put("status", "AVAILABLE");
        machineryList.add(item1);

        Map<String, Object> item2 = new HashMap<>();
        item2.put("id", 2L);
        item2.put("name", "John Deere Harvester");
        item2.put("nameTa", "ஜான் டீர் அறுவடை இயந்திரம்");
        item2.put("type", "HARVESTER");
        item2.put("typeTa", "அறுவடை இயந்திரம்");
        item2.put("district", district);
        item2.put("block", block);
        item2.put("ownerName", "Suresh Mani");
        item2.put("ownerPhone", "+91 87654 32109");
        item2.put("ratePerHour", 2500.0);
        item2.put("status", "AVAILABLE");
        machineryList.add(item2);

        return ResponseEntity.ok(machineryList);
    }

    @PostMapping("/request")
    public ResponseEntity<Map<String, Object>> createMachineryRequest(
            @RequestBody MachineryRequestDto requestDto,
            Authentication authentication
    ) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        Farmer currentFarmer = null;

        if (currentUsername != null && !"anonymousUser".equalsIgnoreCase(currentUsername)) {
            currentFarmer = farmerRepository.findByUsernameIgnoreCase(currentUsername).orElse(null);
        }

        MachineryBooking booking = new MachineryBooking();
        booking.setMachineType(requestDto.getMachineType() != null ? requestDto.getMachineType() : "Tractor");
        booking.setRequiredDate(requestDto.getRequiredDate());
        booking.setVillage(requestDto.getVillage());
        booking.setAcres(requestDto.getAcres() != null ? requestDto.getAcres() : 2.5);
        booking.setDistrictName(requestDto.getDistrict());
        booking.setBlockName(requestDto.getBlock());
        booking.setBlockId(requestDto.getBlockId());
        booking.setCreatedAt(Instant.now());
        booking.setStatus("REQUESTED");

        if (currentFarmer != null) {
            booking.setFarmer(currentFarmer);
            booking.setFarmerUsername(currentFarmer.getUsername());
            booking.setFarmerName(
                    currentFarmer.getFullName() != null && !currentFarmer.getFullName().isBlank()
                            ? currentFarmer.getFullName()
                            : currentFarmer.getUsername()
            );
        } else {
            booking.setFarmerUsername(currentUsername != null ? currentUsername : "Guest");
            booking.setFarmerName(
                    requestDto.getFarmerName() != null && !requestDto.getFarmerName().isBlank()
                            ? requestDto.getFarmerName()
                            : (currentUsername != null ? currentUsername : "Farmer")
            );
        }

        MachineryBooking saved = machineryBookingRepository.save(booking);

        Map<String, Object> response = new HashMap<>();
        response.put("id", saved.getId());
        response.put("farmerName", saved.getFarmerName());
        response.put("farmerUsername", saved.getFarmerUsername());
        response.put("machineType", saved.getMachineType());
        response.put("district", saved.getDistrictName());
        response.put("block", saved.getBlockName());
        response.put("blockId", saved.getBlockId());
        response.put("village", saved.getVillage());
        response.put("acres", saved.getAcres());
        response.put("requiredDate", saved.getRequiredDate());
        response.put("status", saved.getStatus());
        response.put("createdAt", saved.getCreatedAt().toString());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/nearby-activity")
    public ResponseEntity<List<Map<String, Object>>> getNearbyActivity(
            @RequestParam(required = false) Long blockId,
            @RequestParam(required = false) String block,
            @RequestParam(required = false) String district,
            Authentication authentication
    ) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        Instant last24Hours = Instant.now().minus(24, ChronoUnit.HOURS);

        List<MachineryBooking> bookings;
        if (blockId != null || (block != null && !block.isBlank())) {
            bookings = machineryBookingRepository.findRecentActivity(blockId, block != null ? block.trim() : null, last24Hours);
        } else {
            bookings = machineryBookingRepository.findAllRecentActivity(last24Hours);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        Instant now = Instant.now();

        for (MachineryBooking b : bookings) {
            // Exclude current logged-in farmer's own booking
            if (currentUsername != null &&
                !"anonymousUser".equalsIgnoreCase(currentUsername) &&
                b.getFarmerUsername() != null &&
                b.getFarmerUsername().equalsIgnoreCase(currentUsername)) {
                continue;
            }

            Map<String, Object> item = new HashMap<>();
            item.put("id", b.getId());
            item.put("farmerName", b.getFarmerName() != null ? b.getFarmerName() : "A neighboring farmer");
            item.put("farmerUsername", b.getFarmerUsername());
            item.put("machineType", b.getMachineType());
            item.put("district", b.getDistrictName());
            item.put("block", b.getBlockName());
            item.put("blockId", b.getBlockId());
            item.put("village", b.getVillage());
            item.put("acres", b.getAcres());
            item.put("requiredDate", b.getRequiredDate());
            item.put("createdAt", b.getCreatedAt().toString());

            // Human readable relative time
            Duration duration = Duration.between(b.getCreatedAt(), now);
            String timeAgo;
            if (duration.toMinutes() < 1) {
                timeAgo = "just now";
            } else if (duration.toMinutes() < 60) {
                timeAgo = duration.toMinutes() + "m ago";
            } else if (duration.toHours() < 24) {
                timeAgo = duration.toHours() + "h ago";
            } else {
                timeAgo = "yesterday";
            }
            item.put("timeAgo", timeAgo);

            result.add(item);
        }

        return ResponseEntity.ok(result);
    }
}
