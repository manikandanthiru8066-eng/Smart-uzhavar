package com.smartuzhavar.insuranceservice.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/machinery")
public class MachineryController {

    @GetMapping("/nearby")
    public ResponseEntity<List<Map<String, Object>>> getNearbyMachinery(
            @RequestParam String district,
            @RequestParam String block) {
        
        List<Map<String, Object>> machineryList = new ArrayList<>();

        Map<String, Object> item1 = new HashMap<>();
        item1.put("id", 1L);
        item1.put("name", "Mahindra Arjun 555 Tractor");
        item1.put("type", "TRACTOR");
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
        item2.put("type", "HARVESTER");
        item2.put("district", district);
        item2.put("block", block);
        item2.put("ownerName", "Suresh Mani");
        item2.put("ownerPhone", "+91 87654 32109");
        item2.put("ratePerHour", 2500.0);
        item2.put("status", "AVAILABLE");
        machineryList.add(item2);

        return ResponseEntity.ok(machineryList);
    }
}
