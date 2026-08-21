package com.smartuzhavar.subsidyservice.seeder;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartuzhavar.subsidyservice.entity.*;
import com.smartuzhavar.subsidyservice.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final DistrictRepository districtRepository;
    private final SubsidySchemeRepository subsidySchemeRepository;
    private final TalukRepository talukRepository;
    private final BlockRepository blockRepository;
    private final DistrictCropStatRepository districtCropStatRepository;
    private final ObjectMapper objectMapper;

    public DatabaseSeeder(DistrictRepository districtRepository,
                          SubsidySchemeRepository subsidySchemeRepository,
                          TalukRepository talukRepository,
                          BlockRepository blockRepository,
                          DistrictCropStatRepository districtCropStatRepository,
                          ObjectMapper objectMapper) {
        this.districtRepository = districtRepository;
        this.subsidySchemeRepository = subsidySchemeRepository;
        this.talukRepository = talukRepository;
        this.blockRepository = blockRepository;
        this.districtCropStatRepository = districtCropStatRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) throws Exception {
        seedDistricts();
        seedTaluksAndBlocks();
        seedDistrictCropStats();
        seedSubsidySchemes();
    }

    private void seedDistricts() {
        try {
            long existing = districtRepository.count();
            if (existing >= 38) {
                log.info("Districts table already has {} districts — skipping seed.", existing);
                return;
            }
            if (existing > 0) {
                log.info("Districts table has only {} entries — re-seeding from tn_districts.json.", existing);
                districtRepository.deleteAll();
            }

            File file = findFile("database/tn_districts.json");
            if (file == null || !file.exists()) {
                log.error("Could not find tn_districts.json file for seeding!");
                return;
            }

            List<District> districts = objectMapper.readValue(file, new TypeReference<List<District>>() {});
            districtRepository.saveAll(districts);
            log.info("Successfully seeded {} districts.", districts.size());
        } catch (Exception e) {
            log.warn("District seeding skipped or completed by parallel service: {}", e.getMessage());
        }
    }

    private District getOrCreateDistrict(String distName) {
        if (distName == null || distName.trim().isEmpty()) {
            return null;
        }
        String name = distName.trim();
        return districtRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> districtRepository.save(new District(name)));
    }

    private void seedTaluksAndBlocks() {
        try {
            if (talukRepository.count() >= 100) {
                log.info("Taluks & Blocks tables already seeded with {} taluks.", talukRepository.count());
                return;
            }

            log.info("Seeding Taluks & Blocks from tn_taluk_block_hierarchy.json...");
            blockRepository.deleteAll();
            talukRepository.deleteAll();

            File file = findFile("database/tn_taluk_block_hierarchy.json");
            if (file == null || !file.exists()) {
                log.error("Could not find tn_taluk_block_hierarchy.json file for seeding!");
                return;
            }

            JsonNode rootNode = objectMapper.readTree(file);
            int talukCount = 0;
            int blockCount = 0;

            for (JsonNode distNode : rootNode) {
                String distName = distNode.path("district").asText();
                District district = getOrCreateDistrict(distName);
                if (district == null) {
                    continue;
                }

                JsonNode taluksNode = distNode.path("taluks");
                for (JsonNode talukNode : taluksNode) {
                    String talukName = talukNode.path("name").asText();
                    Taluk taluk = new Taluk(talukName, district);
                    taluk = talukRepository.save(taluk);
                    talukCount++;

                    JsonNode blocksNode = talukNode.path("blocks");
                    for (JsonNode blockNode : blocksNode) {
                        String blockName = blockNode.asText();
                        Block block = new Block(blockName, taluk);
                        blockRepository.save(block);
                        blockCount++;
                    }
                }
            }

            log.info("Successfully seeded {} taluks and {} blocks across Tamil Nadu.", talukCount, blockCount);
        } catch (Exception e) {
            log.error("Error seeding Taluks & Blocks: {}", e.getMessage(), e);
        }
    }

    private void seedDistrictCropStats() {
        try {
            if (districtCropStatRepository.count() >= 20) {
                log.info("District crop statistics table already seeded with {} records.", districtCropStatRepository.count());
                return;
            }

            log.info("Seeding District Crop Stats from tn_district_crop_data.json...");
            districtCropStatRepository.deleteAll();

            File file = findFile("database/tn_district_crop_data.json");
            if (file == null || !file.exists()) {
                log.error("Could not find tn_district_crop_data.json file for seeding!");
                return;
            }

            JsonNode rootNode = objectMapper.readTree(file);
            int statCount = 0;

            for (JsonNode distNode : rootNode) {
                String distName = distNode.path("district").asText();
                District district = getOrCreateDistrict(distName);
                if (district == null) {
                    continue;
                }

                JsonNode statsNode = distNode.path("cropStats");
                for (JsonNode statNode : statsNode) {
                    DistrictCropStat stat = new DistrictCropStat();
                    stat.setDistrict(district);
                    stat.setCrop(statNode.path("crop").asText());
                    stat.setSeason(statNode.path("season").asText());
                    stat.setYear(statNode.path("year").asText("2024-25"));
                    stat.setAreaHectares(new BigDecimal(statNode.path("areaHectares").asText("0")));
                    stat.setProductionTonnes(new BigDecimal(statNode.path("productionTonnes").asText("0")));
                    stat.setYieldKgPerHa(new BigDecimal(statNode.path("yieldKgPerHa").asText("0")));
                    stat.setIsTopCrop(statNode.path("isTopCrop").asBoolean(false));

                    districtCropStatRepository.save(stat);
                    statCount++;
                }
            }

            log.info("Successfully seeded {} district crop yield stat records.", statCount);
        } catch (Exception e) {
            log.error("Error seeding District Crop Stats: {}", e.getMessage(), e);
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
        File f1 = new File(relativePath);
        if (f1.exists()) {
            log.info("Found file at: {}", f1.getAbsolutePath());
            return f1;
        }
        File f2 = new File("../../" + relativePath);
        if (f2.exists()) {
            log.info("Found file at: {}", f2.getAbsolutePath());
            return f2;
        }
        File f3 = new File("../" + relativePath);
        if (f3.exists()) {
            log.info("Found file at: {}", f3.getAbsolutePath());
            return f3;
        }
        log.warn("File not found in paths: {}, {}, {}", f1.getAbsolutePath(), f2.getAbsolutePath(), f3.getAbsolutePath());
        return null;
    }
}
