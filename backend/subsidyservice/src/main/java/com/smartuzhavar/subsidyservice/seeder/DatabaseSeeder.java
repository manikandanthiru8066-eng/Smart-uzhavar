package com.smartuzhavar.subsidyservice.seeder;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartuzhavar.subsidyservice.entity.Block;
import com.smartuzhavar.subsidyservice.entity.District;
import com.smartuzhavar.subsidyservice.entity.DistrictCropStat;
import com.smartuzhavar.subsidyservice.entity.SubsidyScheme;
import com.smartuzhavar.subsidyservice.entity.Taluk;
import com.smartuzhavar.subsidyservice.repository.BlockRepository;
import com.smartuzhavar.subsidyservice.repository.DistrictCropStatRepository;
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
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final DistrictRepository districtRepository;
    private final TalukRepository talukRepository;
    private final BlockRepository blockRepository;
    private final SubsidySchemeRepository subsidySchemeRepository;
    private final DistrictCropStatRepository districtCropStatRepository;
    private final ObjectMapper objectMapper;

    public DatabaseSeeder(DistrictRepository districtRepository,
                          TalukRepository talukRepository,
                          BlockRepository blockRepository,
                          SubsidySchemeRepository subsidySchemeRepository,
                          DistrictCropStatRepository districtCropStatRepository,
                          ObjectMapper objectMapper) {
        this.districtRepository = districtRepository;
        this.talukRepository = talukRepository;
        this.blockRepository = blockRepository;
        this.subsidySchemeRepository = subsidySchemeRepository;
        this.districtCropStatRepository = districtCropStatRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) throws Exception {
        seedDistricts();
        seedTalukBlockHierarchy();
        seedDistrictCropStats();
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

    private District getOrCreateDistrict(String distName) {
        if (distName == null || distName.trim().isEmpty()) {
            return null;
        }
        String name = distName.trim();
        return districtRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> districtRepository.save(new District(name)));
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
                districtsNode = rootNode;
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
                        String talukName = talukNode.has("taluk") ? talukNode.get("taluk").asText() : talukNode.get("name").asText();
                        Integer lgdSubdistrictCode = talukNode.has("lgd_subdistrict_code") ? talukNode.get("lgd_subdistrict_code").asInt() : null;

                        Taluk taluk = (lgdSubdistrictCode != null)
                                ? talukRepository.findByLgdSubdistrictCode(lgdSubdistrictCode).orElse(null)
                                : null;

                        if (taluk == null) {
                            taluk = talukRepository.findByNameIgnoreCaseAndDistrictId(talukName, district.getId())
                                    .orElseGet(() -> talukRepository.save(new Taluk(talukName, lgdSubdistrictCode != null ? lgdSubdistrictCode : 0, district)));
                        }

                        JsonNode blocksNode = talukNode.get("blocks");
                        if (blocksNode != null && blocksNode.isArray()) {
                            for (JsonNode blockNode : blocksNode) {
                                String blockName = blockNode.isObject() ? blockNode.get("block").asText() : blockNode.asText();
                                String lgdBlockCode = blockNode.isObject() && blockNode.has("lgd_block_code") ? blockNode.get("lgd_block_code").asText() : blockName;

                                Block block = blockRepository.findByLgdBlockCode(lgdBlockCode)
                                        .orElseGet(() -> blockRepository.save(new Block(blockName, lgdBlockCode)));

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
