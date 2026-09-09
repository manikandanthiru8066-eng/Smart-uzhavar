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

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Component
@Transactional
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);
    private static final long EXPECTED_SCHEME_COUNT = 5;

    private final InsuranceSchemeRepository insuranceSchemeRepository;
    private final DistrictRepository districtRepository;
    private final TalukRepository talukRepository;
    private final BlockRepository blockRepository;
    private final ObjectMapper objectMapper;

    @PersistenceContext
    private EntityManager entityManager;

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
    @Transactional
    public void run(String... args) throws Exception {
        seedDistricts();
        seedTalukBlockHierarchy();
        seedInsuranceSchemes();
        syncSequences();
    }

    private void syncSequences() {
        String[] tables = {"farmers", "farmer_profiles", "districts", "taluks", "blocks", "insurance_schemes", "insurance_estimates", "machinery_bookings"};
        for (String table : tables) {
            try {
                String sql = "SELECT setval(pg_get_serial_sequence('" + table + "', 'id'), COALESCE((SELECT MAX(id) FROM " + table + "), 1))";
                entityManager.createNativeQuery(sql).getSingleResult();
            } catch (Exception ignored) {
                // Non-PostgreSQL or sequence already synced
            }
        }
        log.info("PostgreSQL sequences synchronized for insurance-service tables.");
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
            if (existing == 38 && !missingCoordinates) {
                log.info("Districts table in insurance-service already has 38 districts with coordinates — skipping seed.");
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

    public static String normalizeDistrictName(String name) {
        if (name == null) return null;
        String trimmed = name.trim();
        String lower = trimmed.toLowerCase();
        switch (lower) {
            case "thoothukkudi":
            case "tuticorin":
                return "Thoothukudi";
            case "kancheepuram":
                return "Kanchipuram";
            case "kanniyakumari":
            case "kanya kumari":
                return "Kanyakumari";
            case "the nilgiris":
            case "the nilgiri":
            case "nilgiri":
                return "Nilgiris";
            case "thiruvallur":
                return "Tiruvallur";
            case "thiruvarur":
                return "Tiruvarur";
            case "trichy":
            case "tiruchy":
                return "Tiruchirappalli";
            case "tirupattur":
                return "Tirupathur";
            case "villupuram":
                return "Viluppuram";
            case "sivagangai":
                return "Sivaganga";
            default:
                return trimmed;
        }
    }

    @Transactional
    public void cleanupDuplicateDistricts() {
        try {
            List<District> allDistricts = districtRepository.findAll();
            for (District d : allDistricts) {
                String canonicalName = normalizeDistrictName(d.getName());
                if (canonicalName != null && !canonicalName.equalsIgnoreCase(d.getName())) {
                    Optional<District> canonicalOpt = districtRepository.findByNameIgnoreCase(canonicalName);
                    if (canonicalOpt.isPresent() && !canonicalOpt.get().getId().equals(d.getId())) {
                        District canonicalDist = canonicalOpt.get();
                        log.info("Merging duplicate district '{}' (id={}) into canonical district '{}' (id={}) in insurance-service",
                                d.getName(), d.getId(), canonicalName, canonicalDist.getId());

                        // Reassign taluks
                        List<Taluk> taluks = talukRepository.findByDistrictIdOrderByNameAsc(d.getId());
                        for (Taluk t : taluks) {
                            t.setDistrict(canonicalDist);
                            talukRepository.save(t);
                        }

                        districtRepository.delete(d);
                    } else if (canonicalOpt.isEmpty()) {
                        d.setName(canonicalName);
                        districtRepository.save(d);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Duplicate district cleanup note in insurance-service: {}", e.getMessage());
        }
    }

    @Transactional
    public void seedTalukBlockHierarchy() {
        long talukCount = talukRepository.count();
        long blockCount = blockRepository.count();
        long distCount = districtRepository.count();

        if (talukCount == 317 && blockCount >= 675 && distCount == 38) {
            log.info("Taluk & Block hierarchy already fully seeded in insurance-service (taluks={}, blocks={}, districts={}) — skipping seed.",
                    talukCount, blockCount, distCount);
            return;
        }

        cleanupDuplicateDistricts();

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
                String rawDistName = distNode.get("district").asText();
                String distName = normalizeDistrictName(rawDistName);
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
                        int lgdSubdistrictCode = talukNode.has("lgd_subdistrict_code") ? talukNode.get("lgd_subdistrict_code").asInt() : 0;

                        Taluk taluk = (lgdSubdistrictCode > 0)
                                ? talukRepository.findByLgdSubdistrictCode(lgdSubdistrictCode).orElse(null)
                                : null;

                        if (taluk == null) {
                            taluk = talukRepository.findByNameIgnoreCaseAndDistrictId(talukName, district.getId())
                                    .orElseGet(() -> {
                                        Taluk t = new Taluk(talukName, lgdSubdistrictCode, district);
                                        return talukRepository.save(t);
                                    });
                        } else {
                            taluk.setName(talukName);
                            taluk.setDistrict(district);
                            talukRepository.save(taluk);
                        }

                        JsonNode blocksNode = talukNode.get("blocks");
                        if (blocksNode != null && blocksNode.isArray()) {
                            for (JsonNode blockNode : blocksNode) {
                                String blockName = blockNode.isObject() ? blockNode.get("block").asText() : blockNode.asText();
                                String lgdBlockCode = blockNode.isObject() && blockNode.has("lgd_block_code") ? blockNode.get("lgd_block_code").asText() : blockName;

                                Block block = blockRepository.findByLgdBlockCode(lgdBlockCode)
                                        .orElseGet(() -> {
                                            Block b = new Block(blockName, lgdBlockCode);
                                            return blockRepository.save(b);
                                        });
                                block.setName(blockName);
                                if (taluk.getBlocks() == null) {
                                    taluk.setBlocks(new java.util.HashSet<>());
                                }
                                if (!taluk.getBlocks().contains(block)) {
                                    taluk.getBlocks().add(block);
                                }
                            }
                            talukRepository.save(taluk);
                        }
                    }
                }
            }

            log.info("Successfully seeded/synced LGD hierarchy in insurance-service: {} taluks and {} unique blocks across {} districts.",
                    talukRepository.count(), blockRepository.count(), districtRepository.count());
        } catch (Exception e) {
            log.error("Error seeding taluk and block hierarchy in insurance-service: {}", e.getMessage(), e);
        }
    }

    private void seedInsuranceSchemes() {
        long currentCount = insuranceSchemeRepository.count();
        boolean hasMissingTa = currentCount > 0 && insuranceSchemeRepository.findAll().stream().anyMatch(s -> s.getNameTa() == null);

        if (currentCount == EXPECTED_SCHEME_COUNT && !hasMissingTa) {
            log.info("Insurance schemes table already has {} schemes with Tamil translations — skipping seed.", currentCount);
            return;
        }

        InputStream is = openResourceStream("insurance_schemes.json");
        if (is == null) {
            log.error("Could not find insurance_schemes.json resource for insurance-service seeding!");
            return;
        }

        try (InputStream stream = is) {
            List<InsuranceScheme> schemes = objectMapper.readValue(stream,
                    new TypeReference<List<InsuranceScheme>>() {});
            for (InsuranceScheme scheme : schemes) {
                Optional<InsuranceScheme> existing = insuranceSchemeRepository.findByNameIgnoreCase(scheme.getName());
                if (existing.isPresent()) {
                    InsuranceScheme s = existing.get();
                    s.setNameTa(scheme.getNameTa());
                    s.setDescription(scheme.getDescription());
                    s.setDescriptionTa(scheme.getDescriptionTa());
                    s.setSchemeType(scheme.getSchemeType());
                    s.setApplicableCrops(scheme.getApplicableCrops());
                    s.setApplicableCropsTa(scheme.getApplicableCropsTa());
                    s.setPremiumRatePercentage(scheme.getPremiumRatePercentage());
                    s.setSumInsuredPerAcre(scheme.getSumInsuredPerAcre());
                    insuranceSchemeRepository.save(s);
                } else {
                    insuranceSchemeRepository.save(scheme);
                }
            }
            log.info("Successfully seeded/synced {} insurance schemes into insurance-service.", schemes.size());
        } catch (Exception e) {
            log.error("Error reading or seeding insurance schemes: {}", e.getMessage(), e);
        }
    }
}
