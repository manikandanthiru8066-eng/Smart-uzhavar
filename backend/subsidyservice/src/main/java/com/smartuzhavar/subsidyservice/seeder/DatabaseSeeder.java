package com.smartuzhavar.subsidyservice.seeder;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartuzhavar.subsidyservice.entity.District;
import com.smartuzhavar.subsidyservice.entity.SubsidyScheme;
import com.smartuzhavar.subsidyservice.repository.DistrictRepository;
import com.smartuzhavar.subsidyservice.repository.SubsidySchemeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final DistrictRepository districtRepository;
    private final SubsidySchemeRepository subsidySchemeRepository;
    private final ObjectMapper objectMapper;

    public DatabaseSeeder(DistrictRepository districtRepository,
                          SubsidySchemeRepository subsidySchemeRepository,
                          ObjectMapper objectMapper) {
        this.districtRepository = districtRepository;
        this.subsidySchemeRepository = subsidySchemeRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) throws Exception {
        seedDistricts();
        seedSubsidySchemes();
    }

    private void seedDistricts() {
        if (districtRepository.count() > 0) {
            log.info("Districts table already seeded.");
            return;
        }

        File file = findFile("database/tn_districts.json");
        if (file == null || !file.exists()) {
            log.error("Could not find tn_districts.json file for seeding!");
            return;
        }

        try {
            List<District> districts = objectMapper.readValue(file, new TypeReference<List<District>>() {});
            districtRepository.saveAll(districts);
            log.info("Successfully seeded {} districts.", districts.size());
        } catch (IOException e) {
            log.error("Error reading or seeding districts: {}", e.getMessage(), e);
        }
    }

    private void seedSubsidySchemes() {
        boolean needsReseed = subsidySchemeRepository.count() == 0 ||
                subsidySchemeRepository.findAll().stream().anyMatch(s -> s.getNameTa() == null);
        if (!needsReseed) {
            log.info("Subsidy schemes table already seeded with Tamil translations.");
            return;
        }

        subsidySchemeRepository.deleteAll();

        File file = findFile("database/subsidy_schemes.json");
        if (file == null || !file.exists()) {
            log.error("Could not find subsidy_schemes.json file for seeding!");
            return;
        }

        try {
            List<SubsidyScheme> schemes = objectMapper.readValue(file, new TypeReference<List<SubsidyScheme>>() {});
            subsidySchemeRepository.saveAll(schemes);
            log.info("Successfully seeded {} subsidy schemes.", schemes.size());
        } catch (IOException e) {
            log.error("Error reading or seeding subsidy schemes: {}", e.getMessage(), e);
        }
    }

    private File findFile(String relativePath) {
        // Try current folder (workspace root if run from there)
        File f1 = new File(relativePath);
        if (f1.exists()) {
            log.info("Found file at: {}", f1.getAbsolutePath());
            return f1;
        }
        // Try two levels up (if run from backend/subsidyservice)
        File f2 = new File("../../" + relativePath);
        if (f2.exists()) {
            log.info("Found file at: {}", f2.getAbsolutePath());
            return f2;
        }
        // Try one level up (if run from backend)
        File f3 = new File("../" + relativePath);
        if (f3.exists()) {
            log.info("Found file at: {}", f3.getAbsolutePath());
            return f3;
        }
        return null;
    }
}
