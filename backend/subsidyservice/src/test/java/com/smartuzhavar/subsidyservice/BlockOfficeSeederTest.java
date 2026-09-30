package com.smartuzhavar.subsidyservice;

import com.smartuzhavar.subsidyservice.entity.BlockOffice;
import com.smartuzhavar.subsidyservice.repository.BlockOfficeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class BlockOfficeSeederTest {

    @Autowired
    private BlockOfficeRepository blockOfficeRepository;

    @Test
    void testSeedingResults() {
        long count = blockOfficeRepository.count();
        System.out.println("=== BLOCK OFFICES TOTAL COUNT: " + count + " ===");
        assertTrue(count >= 290, "Expected at least 290 block offices seeded, but found: " + count);

        // Spot check 5 different blocks across different districts
        String[][] spotChecks = {
            {"Kancheepuram", "Walajabad"},
            {"Salem", "Salem"},
            {"Tiruchirappalli", "Andhanallur"},
            {"Thanjavur", "Papanasam"},
            {"Virudhunagar", "Rajapalayam"},
            {"Dharmapuri", "Dharmapuri"},
            {"Tenkasi", "Alankulam"}
        };

        System.out.println("\n=== SPOT CHECKS ===");
        for (String[] check : spotChecks) {
            String district = check[0];
            String block = check[1];
            Optional<BlockOffice> opt = blockOfficeRepository.findFirstByDistrictNameIgnoreCaseAndBlockNameIgnoreCase(district, block);
            assertTrue(opt.isPresent(), "Block office not found for " + district + " / " + block);
            BlockOffice bo = opt.get();
            System.out.println("District: " + bo.getDistrictName() + 
                               " | Block: " + bo.getBlockName() + 
                               " | Office: " + bo.getOfficeName() + 
                               " | Address: " + bo.getAddress() + 
                               " | Phone: " + bo.getPhone() + 
                               " | Lat/Lng: " + bo.getLatitude() + "," + bo.getLongitude());
            assertNotNull(bo.getOfficeName(), "Office name should be populated");
        }
    }

    @Autowired
    private com.smartuzhavar.subsidyservice.controller.BlockOfficeController blockOfficeController;

    @Test
    void testControllerEndpointReturnsRealOfficeDetails() {
        // Farmer Profile 1: Walajabad, Kancheepuram (previously had no office data, returned 404 / fallback)
        var res1 = blockOfficeController.getOfficeByName("Kancheepuram", "Walajabad");
        assertNotNull(res1.getBody());
        assertEquals("Assistant Director Agriculture, Walajabath", res1.getBody().getOfficeName());
        assertEquals("044-27256760", res1.getBody().getPhone());
        System.out.println("Verified Farmer 1 (Kancheepuram/Walajabad): " + res1.getBody().getOfficeName() + ", Phone: " + res1.getBody().getPhone());

        // Farmer Profile 2: Dharmapuri, Dharmapuri (previously had no office data, returned 404 / fallback)
        var res2 = blockOfficeController.getOfficeByName("Dharmapuri", "Dharmapuri");
        assertNotNull(res2.getBody());
        assertEquals("Assistant Director of Agriculture, Dharmapuri", res2.getBody().getOfficeName());
        assertEquals("Taluk Office Backside, Dharmapuri", res2.getBody().getAddress());
        assertEquals("04342-268180", res2.getBody().getPhone());
        System.out.println("Verified Farmer 2 (Dharmapuri/Dharmapuri): " + res2.getBody().getOfficeName() + ", Address: " + res2.getBody().getAddress());

        // Farmer Profile 3: Andhanallur, Tiruchirappalli
        var res3 = blockOfficeController.getOfficeByName("Tiruchirappalli", "Andhanallur");
        assertNotNull(res3.getBody());
        assertEquals("Assistant Director of Agriculture, Andhanallur", res3.getBody().getOfficeName());
        assertEquals("7550216322", res3.getBody().getPhone());
        System.out.println("Verified Farmer 3 (Tiruchirappalli/Andhanallur): " + res3.getBody().getOfficeName() + ", Phone: " + res3.getBody().getPhone());
    }
}
