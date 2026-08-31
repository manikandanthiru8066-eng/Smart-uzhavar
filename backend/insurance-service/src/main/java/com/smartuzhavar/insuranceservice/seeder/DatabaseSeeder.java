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
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.List;
import java.util.Optional;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);
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

    private InputStream openResourceStream(String filename) {
        // 1. Try classpath: database/<filename>
        try {
            ClassPathResource cpr = new ClassPathResource("database/" + filename);
            if (cpr.exists()) {
                log.info("Loading seed resource from classpath: database/{}", filename);
                return cpr.getInputStream();
            }
        } catch (Exception ignored) {}

        // 2. Try classpath: <filename>
        try {
            ClassPathResource cpr = new ClassPathResource(filename);
            if (cpr.exists()) {
                log.info("Loading seed resource from classpath: {}", filename);
                return cpr.getInputStream();
            }
        } catch (Exception ignored) {}

        // 3. Try classLoader getResourceAsStream
        try {
            InputStream is = getClass().getClassLoader().getResourceAsStream("database/" + filename);
            if (is != null) {
                log.info("Loading seed resource via classLoader: database/{}", filename);
                return is;
            }
            is = getClass().getClassLoader().getResourceAsStream(filename);
            if (is != null) {
                log.info("Loading seed resource via classLoader: {}", filename);
                return is;
            }
        } catch (Exception ignored) {}

        // 4. Try filesystem paths as fallback
        String[] paths = {
            "database/" + filename,
            "backend/insurance-service/src/main/resources/database/" + filename,
            "../../database/" + filename,
            "../database/" + filename
        };
        for (String p : paths) {
            File f = new File(p);
            if (f.exists()) {
                try {
                    log.info("Loading seed resource from filesystem path: {}", f.getAbsolutePath());
                    return new FileInputStream(f);
                } catch (Exception ignored) {}
            }
        }

        log.warn("Could not find seed resource for filename in insurance-service: {}", filename);
        return null;
    }

    private void seedDistricts() {
        try {
            long existing = districtRepository.count();
            boolean missingCoordinates = existing > 0 && districtRepository.findAll().stream().anyMatch(d -> d.getLatitude() == null);
            if (existing >= 38 && !missingCoordinates) {
                log.info("Districts table in insurance-service already has {} districts with coordinates — skipping seed.", existing);
                return;
            }

            InputStream is = openResourceStream("tn_district_coordinates.json");
            if (is == null) {
                is = openResourceStream("tn_districts.json");
            }

            if (is != null) {
                try (InputStream stream = is) {
                    List<District> seedDistricts = objectMapper.readValue(stream, new TypeReference<List<District>>() {});
                    for (District seed : seedDistricts) {
                        Optional<District> existingOpt = districtRepository.findByNameIgnoreCase(seed.getName());
                        if (existingOpt.isPresent()) {
                            District d = existingOpt.get();
                            d.setLatitude(seed.getLatitude());
                            d.setLongitude(seed.getLongitude());
                            districtRepository.save(d);
                        } else {
                            districtRepository.save(seed);
                        }
                    }
                    log.info("Successfully seeded/updated {} districts with coordinates into insurance-service.", seedDistricts.size());
                }
            } else {
                log.error("Could not find tn_district_coordinates.json resource for insurance-service seeding!");
            }
        } catch (Exception e) {
            log.warn("District seeding note in insurance-service: {}", e.getMessage());
        }
    }

    @Transactional
    public void seedTalukBlockHierarchy() {
        if (talukRepository.count() > 0 && blockRepository.count() > 0) {
            log.info("Taluks and Blocks tables already seeded in insurance-service (taluks={}, blocks={}).", talukRepository.count(), blockRepository.count());
            return;
        }

        InputStream is = openResourceStream("tn_taluk_block_hierarchy.json");
        if (is == null) {
            log.error("Could not find tn_taluk_block_hierarchy.json resource for insurance-service seeding!");
            return;
        }

        try (InputStream stream = is) {
            JsonNode rootNode = objectMapper.readTree(stream);
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

        InputStream is = openResourceStream("insurance_schemes.json");
        if (is == null) {
            log.error("Could not find insurance_schemes.json resource for insurance-service seeding!");
            return;
        }

        try (InputStream stream = is) {
            List<InsuranceScheme> schemes = objectMapper.readValue(stream,
                    new TypeReference<List<InsuranceScheme>>() {});
            insuranceSchemeRepository.saveAll(schemes);
            log.info("Successfully seeded {} insurance schemes into insurance-service.", schemes.size());
        } catch (Exception e) {
            log.error("Error reading or seeding insurance schemes: {}", e.getMessage(), e);
        }
    }
}
