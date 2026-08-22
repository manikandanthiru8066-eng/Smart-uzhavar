package com.smartuzhavar.subsidyservice.seeder;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartuzhavar.subsidyservice.entity.Block;
import com.smartuzhavar.subsidyservice.entity.District;
import com.smartuzhavar.subsidyservice.entity.SubsidyScheme;
import com.smartuzhavar.subsidyservice.entity.Taluk;
import com.smartuzhavar.subsidyservice.repository.BlockRepository;
import com.smartuzhavar.subsidyservice.repository.DistrictRepository;
import com.smartuzhavar.subsidyservice.repository.SubsidySchemeRepository;
import com.smartuzhavar.subsidyservice.repository.TalukRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final DistrictRepository districtRepository;
    private final TalukRepository talukRepository;
    private final BlockRepository blockRepository;
    private final SubsidySchemeRepository subsidySchemeRepository;
    private final ObjectMapper objectMapper;

    public DatabaseSeeder(DistrictRepository districtRepository,
                          TalukRepository talukRepository,
                          BlockRepository blockRepository,
                          SubsidySchemeRepository subsidySchemeRepository,
                          ObjectMapper objectMapper) {
        this.districtRepository = districtRepository;
        this.talukRepository = talukRepository;
        this.blockRepository = blockRepository;
        this.subsidySchemeRepository = subsidySchemeRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) throws Exception {
        seedDistricts();
        seedTalukBlockHierarchy();
        seedSubsidySchemes();
    }


    private void seedDistricts() {
        try {
            long existing = districtRepository.count();
            boolean missingCoordinates = existing > 0 && districtRepository.findAll().stream().anyMatch(d -> d.getLatitude() == null);
            if (existing >= 38 && !missingCoordinates) {
                log.info("Districts table already has {} districts with coordinates — skipping seed.", existing);
                return;
            }
            if (existing > 0) {
                log.info("Districts table needs re-seeding/updating with coordinates (count={}, missingCoords={}).", existing, missingCoordinates);
                districtRepository.deleteAll();
            }

            File file = findFile("database/tn_district_coordinates.json");
            if (file == null || !file.exists()) {
                file = findFile("database/tn_districts.json");
            }

            if (file == null || !file.exists()) {
                log.error("Could not find district JSON file for seeding!");
                return;
            }

            List<District> districts = objectMapper.readValue(file, new TypeReference<List<District>>() {});
            districtRepository.saveAll(districts);
            log.info("Successfully seeded {} districts with coordinates from {}.", districts.size(), file.getName());
        } catch (Exception e) {
            log.warn("District seeding skipped or completed by parallel service: {}", e.getMessage());
        }
    }

    @Transactional
    public void seedTalukBlockHierarchy() {
        if (talukRepository.count() > 0 && blockRepository.count() > 0) {
            log.info("Taluks and Blocks tables already seeded (taluks={}, blocks={}).", talukRepository.count(), blockRepository.count());
            return;
        }

        File file = findFile("database/tn_taluk_block_hierarchy.json");
        if (file == null || !file.exists()) {
            log.error("Could not find tn_taluk_block_hierarchy.json file for seeding!");
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

            log.info("Successfully seeded LGD hierarchy: {} taluks and {} unique blocks across districts.",
                    talukRepository.count(), blockRepository.count());
        } catch (Exception e) {
            log.error("Error seeding taluk and block hierarchy: {}", e.getMessage(), e);
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
