package com.smartuzhavar.insuranceservice.seeder;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartuzhavar.insuranceservice.entity.Block;
import com.smartuzhavar.insuranceservice.entity.District;
import com.smartuzhavar.insuranceservice.entity.InsuranceScheme;
import com.smartuzhavar.insuranceservice.entity.Taluk;
import com.smartuzhavar.insuranceservice.repository.BlockRepository;
import com.smartuzhavar.insuranceservice.repository.DistrictRepository;
import com.smartuzhavar.insuranceservice.repository.InsuranceSchemeRepository;
import com.smartuzhavar.insuranceservice.repository.TalukRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.InputStream;
import java.util.List;
import java.util.Optional;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);
    private static final String SCHEMES_CLASSPATH = "insurance_schemes.json";
    private static final long EXPECTED_SCHEME_COUNT = 5;

    private final InsuranceSchemeRepository insuranceSchemeRepository;
    private final DistrictRepository districtRepository;
    private final TalukRepository talukRepository;
    private final BlockRepository blockRepository;
    private final ObjectMapper objectMapper;

    public DatabaseSeeder(InsuranceSchemeRepository insuranceSchemeRepository,
                          DistrictRepository districtRepository,
                          TalukRepository talukRepository,
                          BlockRepository blockRepository,
                          ObjectMapper objectMapper) {
        this.insuranceSchemeRepository = insuranceSchemeRepository;
        this.districtRepository = districtRepository;
        this.talukRepository = talukRepository;
        this.blockRepository = blockRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) throws Exception {
        seedDistricts();
        seedTalukBlockHierarchy();
        seedInsuranceSchemes();
    }


    private void seedDistricts() {
        try {
            long existing = districtRepository.count();
            boolean missingCoordinates = existing > 0 && districtRepository.findAll().stream().anyMatch(d -> d.getLatitude() == null);
            if (existing >= 38 && !missingCoordinates) {
                log.info("Districts table in insurance-service already has {} districts with coordinates — skipping seed.", existing);
                return;
            }
            if (existing > 0) {
                log.info("Districts table in insurance-service needs re-seeding/updating with coordinates (count={}, missingCoords={}).", existing, missingCoordinates);
                districtRepository.deleteAll();
            }

            java.io.File file = findFile("database/tn_district_coordinates.json");
            if (file == null || !file.exists()) {
                file = findFile("database/tn_districts.json");
            }

            if (file != null && file.exists()) {
                List<District> districts = objectMapper.readValue(file, new TypeReference<List<District>>() {});
                districtRepository.saveAll(districts);
                log.info("Successfully seeded {} districts with coordinates from {} in insurance-service.", districts.size(), file.getName());
            } else {
                log.error("Could not find tn_district_coordinates.json file for insurance-service seeding!");
            }
        } catch (Exception e) {
            log.warn("District seeding skipped or completed by parallel service: {}", e.getMessage());
        }
    }

    @Transactional
    public void seedTalukBlockHierarchy() {
        if (talukRepository.count() > 0 && blockRepository.count() > 0) {
            log.info("Taluks and Blocks tables already seeded in insurance-service (taluks={}, blocks={}).", talukRepository.count(), blockRepository.count());
            return;
        }

        File file = findFile("database/tn_taluk_block_hierarchy.json");
        if (file == null || !file.exists()) {
            log.error("Could not find tn_taluk_block_hierarchy.json file for insurance-service seeding!");
            return;
        }

        try {
            JsonNode rootNode = objectMapper.readTree(file);
            JsonNode districtsNode = rootNode.get("districts");
            if (districtsNode == null || !districtsNode.isArray()) {
                log.error("Invalid format in tn_taluk_block_hierarchy.json: missing districts array.");
                return;
            }

            for (JsonNode distNode : districtsNode) {
                String distName = distNode.get("district").asText();
                Optional<District> districtOpt = districtRepository.findByNameIgnoreCase(distName);
                if (districtOpt.isEmpty()) {
                    District newDist = new District();
                    newDist.setName(distName);
                    districtOpt = Optional.of(districtRepository.save(newDist));
                }
                District district = districtOpt.get();

                JsonNode taluksNode = distNode.get("taluks");
                if (taluksNode != null && taluksNode.isArray()) {
                    for (JsonNode talukNode : taluksNode) {
                        String talukName = talukNode.get("taluk").asText();
                        int lgdSubdistrictCode = talukNode.get("lgd_subdistrict_code").asInt();

                        Taluk taluk = talukRepository.findByLgdSubdistrictCode(lgdSubdistrictCode)
                                .orElseGet(() -> {
                                    Taluk t = new Taluk(talukName, lgdSubdistrictCode, district);
                                    return talukRepository.save(t);
                                });

                        JsonNode blocksNode = talukNode.get("blocks");
                        if (blocksNode != null && blocksNode.isArray()) {
                            for (JsonNode blockNode : blocksNode) {
                                String blockName = blockNode.get("block").asText();
                                String lgdBlockCode = blockNode.get("lgd_block_code").asText();

                                Block block = blockRepository.findByLgdBlockCode(lgdBlockCode)
                                        .orElseGet(() -> {
                                            Block b = new Block(blockName, lgdBlockCode);
                                            return blockRepository.save(b);
                                        });

                                taluk.getBlocks().add(block);
                            }
                            talukRepository.save(taluk);
                        }
                    }
                }
            }

            log.info("Successfully seeded LGD hierarchy in insurance-service: {} taluks and {} unique blocks across districts.",
                    talukRepository.count(), blockRepository.count());
        } catch (Exception e) {
            log.error("Error seeding taluk and block hierarchy in insurance-service: {}", e.getMessage(), e);
        }
    }


    private java.io.File findFile(String relativePath) {
        java.io.File f1 = new java.io.File(relativePath);
        if (f1.exists()) return f1;
        java.io.File f2 = new java.io.File("../../" + relativePath);
        if (f2.exists()) return f2;
        java.io.File f3 = new java.io.File("../" + relativePath);
        if (f3.exists()) return f3;
        return null;
    }


    private void seedInsuranceSchemes() {
        long currentCount = insuranceSchemeRepository.count();
        boolean hasMissingTa = insuranceSchemeRepository.findAll().stream().anyMatch(s -> s.getNameTa() == null);

        if (currentCount == EXPECTED_SCHEME_COUNT && !hasMissingTa) {
            log.info("Insurance schemes table already has {} schemes with Tamil translations — skipping seed.", currentCount);
            return;
        }

        if (currentCount > 0) {
            log.warn("Insurance schemes table needs re-seeding for Tamil translations. Clearing and re-seeding...");
            insuranceSchemeRepository.deleteAll();
        }

        try {
            ClassPathResource resource = new ClassPathResource(SCHEMES_CLASSPATH);
            if (!resource.exists()) {
                log.error("Classpath resource '{}' not found. Cannot seed insurance schemes.", SCHEMES_CLASSPATH);
                return;
            }

            try (InputStream is = resource.getInputStream()) {
                List<InsuranceScheme> schemes = objectMapper.readValue(is,
                        new TypeReference<List<InsuranceScheme>>() {});
                insuranceSchemeRepository.saveAll(schemes);
                log.info("Successfully seeded {} insurance schemes from classpath:{}",
                        schemes.size(), SCHEMES_CLASSPATH);
            }
        } catch (Exception e) {
            log.error("Error reading or seeding insurance schemes: {}", e.getMessage(), e);
        }
    }
}
