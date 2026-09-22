package com.smartuzhavar.subsidyservice.seeder;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartuzhavar.subsidyservice.entity.Block;
import com.smartuzhavar.subsidyservice.entity.BlockOffice;
import com.smartuzhavar.subsidyservice.entity.District;
import com.smartuzhavar.subsidyservice.entity.DistrictCropStat;
import com.smartuzhavar.subsidyservice.entity.SubsidyScheme;
import com.smartuzhavar.subsidyservice.entity.Taluk;
import com.smartuzhavar.subsidyservice.entity.Farmer;
import com.smartuzhavar.subsidyservice.repository.FarmerRepository;
import com.smartuzhavar.subsidyservice.repository.BlockOfficeRepository;
import com.smartuzhavar.subsidyservice.repository.BlockRepository;
import com.smartuzhavar.subsidyservice.repository.DistrictCropStatRepository;
import com.smartuzhavar.subsidyservice.repository.DistrictRepository;
import com.smartuzhavar.subsidyservice.repository.SubsidySchemeRepository;
import com.smartuzhavar.subsidyservice.repository.TalukRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final DistrictRepository districtRepository;
    private final TalukRepository talukRepository;
    private final BlockRepository blockRepository;
    private final BlockOfficeRepository blockOfficeRepository;
    private final SubsidySchemeRepository subsidySchemeRepository;
    private final DistrictCropStatRepository districtCropStatRepository;
    private final FarmerRepository farmerRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    @PersistenceContext
    private EntityManager entityManager;

    public DatabaseSeeder(DistrictRepository districtRepository,
                          TalukRepository talukRepository,
                          BlockRepository blockRepository,
                          BlockOfficeRepository blockOfficeRepository,
                          SubsidySchemeRepository subsidySchemeRepository,
                          DistrictCropStatRepository districtCropStatRepository,
                          FarmerRepository farmerRepository,
                          PasswordEncoder passwordEncoder,
                          ObjectMapper objectMapper) {
        this.districtRepository = districtRepository;
        this.talukRepository = talukRepository;
        this.blockRepository = blockRepository;
        this.blockOfficeRepository = blockOfficeRepository;
        this.subsidySchemeRepository = subsidySchemeRepository;
        this.districtCropStatRepository = districtCropStatRepository;
        this.farmerRepository = farmerRepository;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) throws Exception {
        seedAdminUser();
        seedDistricts();
        seedTalukBlockHierarchy();
        seedDistrictCropStats();
        seedSubsidySchemes();
        seedSchemeVerificationDates();
        seedBlockOffices();
        syncSequences();
    }

    private void syncSequences() {
        try {
            Object ver = entityManager.createNativeQuery("SELECT version()").getSingleResult();
            if (ver == null || !ver.toString().toLowerCase().contains("postgresql") || ver.toString().toLowerCase().contains("h2")) {
                return;
            }
        } catch (Exception e) {
            return;
        }

        String[] tables = {"farmers", "farmer_profiles", "districts", "taluks", "blocks", "district_crop_stats", "subsidy_schemes", "subsidy_applications", "machinery_bookings", "block_offices"};
        for (String table : tables) {
            try {
                String sql = "SELECT setval(pg_get_serial_sequence('" + table + "', 'id'), COALESCE((SELECT MAX(id) FROM " + table + "), 1))";
                entityManager.createNativeQuery(sql).getSingleResult();
            } catch (Exception ignored) {
                // Sequence already synced or non-serial
            }
        }
        log.info("PostgreSQL sequences synchronized for subsidyservice tables.");
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
            "backend/subsidyservice/src/main/resources/database/" + filename,
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

        log.warn("Could not find seed resource for filename: {}", filename);
        return null;
    }

    private void seedDistricts() {
        try {
            long existing = districtRepository.count();
            boolean missingCoordinates = existing > 0 && districtRepository.findAll().stream().anyMatch(d -> d.getLatitude() == null);
            if (existing == 38 && !missingCoordinates) {
                log.info("Districts table already has 38 districts with coordinates — skipping seed.");
                return;
            }

            InputStream is = openResourceStream("tn_district_coordinates.json");
            if (is == null) {
                is = openResourceStream("tn_districts.json");
            }

            if (is == null) {
                log.error("Could not find district JSON resource for seeding!");
                return;
            }

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
                log.info("Successfully seeded/updated {} districts with coordinates into subsidyservice.", seedDistricts.size());
            }
        } catch (Exception e) {
            log.warn("District seeding encountered note: {}", e.getMessage());
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

    private District getOrCreateDistrict(String distName) {
        if (distName == null || distName.trim().isEmpty()) {
            return null;
        }
        String name = normalizeDistrictName(distName);
        return districtRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> districtRepository.save(new District(name)));
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
                        log.info("Merging duplicate district '{}' (id={}) into canonical district '{}' (id={})",
                                d.getName(), d.getId(), canonicalName, canonicalDist.getId());

                        // Reassign taluks
                        List<Taluk> taluks = talukRepository.findByDistrictIdOrderByNameAsc(d.getId());
                        for (Taluk t : taluks) {
                            t.setDistrict(canonicalDist);
                            talukRepository.save(t);
                        }

                        // Reassign crop stats
                        List<DistrictCropStat> stats = districtCropStatRepository.findByDistrictId(d.getId());
                        for (DistrictCropStat s : stats) {
                            s.setDistrict(canonicalDist);
                            districtCropStatRepository.save(s);
                        }

                        districtRepository.delete(d);
                    } else if (canonicalOpt.isEmpty()) {
                        d.setName(canonicalName);
                        districtRepository.save(d);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Duplicate district cleanup note in subsidyservice: {}", e.getMessage());
        }
    }

    @Transactional
    public void seedTalukBlockHierarchy() {
        long talukCount = talukRepository.count();
        long blockCount = blockRepository.count();
        long distCount = districtRepository.count();

        if (talukCount == 317 && blockCount >= 675 && distCount == 38) {
            log.info("Taluk & Block hierarchy already fully seeded (taluks={}, blocks={}, districts={}) — skipping seed.",
                    talukCount, blockCount, distCount);
            return;
        }

        cleanupDuplicateDistricts();

        InputStream is = openResourceStream("tn_taluk_block_hierarchy.json");
        if (is == null) {
            log.error("Could not find tn_taluk_block_hierarchy.json resource for seeding!");
            return;
        }

        try (InputStream stream = is) {
            JsonNode rootNode = objectMapper.readTree(stream);
            JsonNode districtsNode = rootNode.get("districts");
            if (districtsNode == null || !districtsNode.isArray()) {
                districtsNode = rootNode;
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
                        Integer lgdSubdistrictCode = talukNode.has("lgd_subdistrict_code") ? talukNode.get("lgd_subdistrict_code").asInt() : null;

                        Taluk taluk = (lgdSubdistrictCode != null && lgdSubdistrictCode > 0)
                                ? talukRepository.findByLgdSubdistrictCode(lgdSubdistrictCode).orElse(null)
                                : null;

                        if (taluk == null) {
                            taluk = talukRepository.findByNameIgnoreCaseAndDistrictId(talukName, district.getId())
                                    .orElseGet(() -> talukRepository.save(new Taluk(talukName, lgdSubdistrictCode != null ? lgdSubdistrictCode : 0, district)));
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
                                        .orElseGet(() -> blockRepository.save(new Block(blockName, lgdBlockCode)));
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

            log.info("Successfully seeded/synced LGD hierarchy: {} taluks and {} unique blocks across {} districts in subsidyservice.",
                    talukRepository.count(), blockRepository.count(), districtRepository.count());
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

            InputStream is = openResourceStream("tn_district_crop_data.json");
            if (is == null) {
                log.error("Could not find tn_district_crop_data.json resource for seeding!");
                return;
            }

            try (InputStream stream = is) {
                JsonNode rootNode = objectMapper.readTree(stream);
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
            }
        } catch (Exception e) {
            log.error("Error seeding District Crop Stats: {}", e.getMessage(), e);
        }
    }

    private void seedSubsidySchemes() {
        // Unconditionally auto-correct any schemes with typo in database
        for (SubsidyScheme s : subsidySchemeRepository.findAll()) {
            if (s.getSourceUrl() != null && s.getSourceUrl().contains("tntagrisnet")) {
                s.setSourceUrl(s.getSourceUrl().replace("tntagrisnet.tn.gov.in", "www.tnagrisnet.tn.gov.in"));
                subsidySchemeRepository.save(s);
                log.info("Auto-corrected typo in subsidy scheme '{}' sourceUrl", s.getName());
            }
        }

        long currentCount = subsidySchemeRepository.count();
        boolean hasMissingTa = currentCount > 0 && subsidySchemeRepository.findAll().stream().anyMatch(s -> s.getNameTa() == null);
        boolean hasMissingUrl = currentCount > 0 && subsidySchemeRepository.findAll().stream().anyMatch(s -> s.getSourceUrl() == null);
        if (currentCount == 10 && !hasMissingTa && !hasMissingUrl) {
            log.info("Subsidy schemes table already has 10 schemes with Tamil translations and source URLs — skipping seed.");
            return;
        }

        InputStream is = openResourceStream("subsidy_schemes.json");
        if (is == null) {
            log.error("Could not find subsidy_schemes.json resource for seeding!");
            return;
        }

        try (InputStream stream = is) {
            List<SubsidyScheme> schemes = objectMapper.readValue(stream, new TypeReference<List<SubsidyScheme>>() {});
            for (SubsidyScheme scheme : schemes) {
                Optional<SubsidyScheme> existing = subsidySchemeRepository.findFirstByNameIgnoreCase(scheme.getName());
                if (existing.isPresent()) {
                    SubsidyScheme s = existing.get();
                    s.setNameTa(scheme.getNameTa());
                    s.setDescription(scheme.getDescription());
                    s.setDescriptionTa(scheme.getDescriptionTa());
                    s.setApplicableCrops(scheme.getApplicableCrops());
                    s.setApplicableCropsTa(scheme.getApplicableCropsTa());
                    s.setApplicableDistricts(scheme.getApplicableDistricts());
                    s.setSubsidyAmount(scheme.getSubsidyAmount());
                    s.setSourceUrl(scheme.getSourceUrl());
                    subsidySchemeRepository.save(s);
                } else {
                    subsidySchemeRepository.save(scheme);
                }
            }

            // Also auto-correct any existing custom or legacy schemes with the tntagrisnet typo
            for (SubsidyScheme s : subsidySchemeRepository.findAll()) {
                if (s.getSourceUrl() != null && s.getSourceUrl().contains("tntagrisnet")) {
                    s.setSourceUrl(s.getSourceUrl().replace("tntagrisnet.tn.gov.in", "www.tnagrisnet.tn.gov.in"));
                    subsidySchemeRepository.save(s);
                    log.info("Auto-corrected typo in subsidy scheme '{}' sourceUrl", s.getName());
                }
            }

            log.info("Successfully seeded/synced {} subsidy schemes.", schemes.size());
        } catch (IOException e) {
            log.error("Error reading or seeding subsidy schemes: {}", e.getMessage(), e);
        }
    }

    private void seedAdminUser() {
        Farmer admin = farmerRepository.findByUsernameIgnoreCase("admin")
                .orElseGet(() -> {
                    Farmer f = new Farmer();
                    f.setUsername("admin");
                    f.setFullName("System Administrator");
                    f.setEmail("admin@smartuzhavar.gov.in");
                    f.setPhoneNumber("9876543210");
                    return f;
                });
        admin.setRole("ADMIN");
        admin.setPassword(passwordEncoder.encode("AdminPassword123!"));
        farmerRepository.save(admin);
        log.info("Default ADMIN account seeded/verified successfully with role ADMIN (username: admin)");
    }

    private void seedSchemeVerificationDates() {
        List<SubsidyScheme> schemes = subsidySchemeRepository.findAll();
        if (!schemes.isEmpty()) {
            LocalDate today = LocalDate.now();
            for (int i = 0; i < schemes.size(); i++) {
                SubsidyScheme s = schemes.get(i);
                if (s.getLastVerifiedDate() == null) {
                    // First 3 schemes: verified recently within 90 days
                    // Remaining schemes: verified > 90 days ago so they show "Needs Review"
                    if (i < 3) {
                        s.setLastVerifiedDate(today.minusDays(5 * (i + 1)));
                    } else {
                        s.setLastVerifiedDate(today.minusDays(95 + (i * 10)));
                    }
                    subsidySchemeRepository.save(s);
                }
            }
            log.info("Baseline lastVerifiedDates initialized for subsidy schemes.");
        }
    }

    private void seedBlockOffices() {
        long currentCount = blockOfficeRepository.count();
        if (currentCount >= 55) {
            log.info("Block offices table already seeded ({} records) — skipping.", currentCount);
            return;
        }

        InputStream is = openResourceStream("tn_block_office_locations.json");
        if (is == null) {
            log.error("Could not find tn_block_office_locations.json resource for seeding!");
            return;
        }

        Map<String, String> blockAliases = new HashMap<>();
        blockAliases.put("kumaratchi", "Komaratchi");
        blockAliases.put("vridhachalam", "Vriddhachalam");
        blockAliases.put("kilpennathur", "Keelpennathur");
        blockAliases.put("chetpet", "Chetput");
        blockAliases.put("elachipalayam", "Elacipalayam");
        blockAliases.put("kabilarmalai", "Kabilamalai");
        blockAliases.put("tiruchengode", "Tiruchengodu");
        blockAliases.put("anthiyur", "Andiyur");
        blockAliases.put("sathyamangalam", "Satyamangalam");
        blockAliases.put("orathanadu", "Orattanadu");
        blockAliases.put("thiruvidaimarudur", "Tiruvidaimarudur");
        blockAliases.put("sethubavachatram", "Sethubhavachatram");

        List<Block> allDbBlocks = blockRepository.findAll();

        try (InputStream stream = is) {
            JsonNode root = objectMapper.readTree(stream);
            JsonNode districtsNode = root.get("districts");
            if (districtsNode != null && districtsNode.isArray()) {
                int officeCount = 0;
                for (JsonNode distNode : districtsNode) {
                    String districtName = distNode.get("district").asText();
                    JsonNode blocksNode = distNode.get("blocks");
                    if (blocksNode != null && blocksNode.isArray()) {
                        for (JsonNode bNode : blocksNode) {
                            String rawBlockName = bNode.get("block").asText();
                            JsonNode officeNameNode = bNode.get("officeName");
                            String officeName = (officeNameNode != null && !officeNameNode.isNull()) ? officeNameNode.asText() : null;
                            JsonNode addressNode = bNode.get("address");
                            String address = (addressNode != null && !addressNode.isNull()) ? addressNode.asText() : null;

                            // Only seed verified offices with actual officeName or address
                            if (officeName == null && address == null) {
                                continue;
                            }

                            // Match block entity
                            String cleanName = rawBlockName.trim().toLowerCase();
                            String alias = blockAliases.getOrDefault(cleanName, rawBlockName.trim());

                            Block matchedBlock = allDbBlocks.stream()
                                    .filter(b -> b.getName().equalsIgnoreCase(rawBlockName.trim()) ||
                                                 b.getName().equalsIgnoreCase(alias) ||
                                                 b.getName().replaceAll("[^a-zA-Z0-9]", "").equalsIgnoreCase(cleanName.replaceAll("[^a-zA-Z0-9]", "")))
                                    .findFirst()
                                    .orElse(null);

                            Optional<BlockOffice> existing = blockOfficeRepository.findFirstByDistrictNameIgnoreCaseAndBlockNameIgnoreCase(districtName, rawBlockName);
                            BlockOffice bo = existing.orElseGet(BlockOffice::new);
                            bo.setBlock(matchedBlock);
                            bo.setDistrictName(districtName);
                            bo.setBlockName(rawBlockName);
                            bo.setOfficeName(officeName);
                            bo.setAddress(address);

                            JsonNode latNode = bNode.get("latitude");
                            if (latNode != null && !latNode.isNull() && latNode.isNumber()) {
                                bo.setLatitude(latNode.asDouble());
                            } else {
                                bo.setLatitude(null);
                            }

                            JsonNode lngNode = bNode.get("longitude");
                            if (lngNode != null && !lngNode.isNull() && lngNode.isNumber()) {
                                bo.setLongitude(lngNode.asDouble());
                            } else {
                                bo.setLongitude(null);
                            }

                            JsonNode phoneNode = bNode.get("phone");
                            if (phoneNode != null && !phoneNode.isNull() && !phoneNode.asText().trim().isEmpty()) {
                                bo.setPhone(phoneNode.asText().trim());
                            } else {
                                bo.setPhone(null);
                            }

                            JsonNode sourceNode = bNode.get("source");
                            bo.setSource((sourceNode != null && !sourceNode.isNull()) ? sourceNode.asText() : null);

                            JsonNode noteNode = bNode.get("verificationNote");
                            bo.setVerificationNote((noteNode != null && !noteNode.isNull()) ? noteNode.asText() : null);

                            blockOfficeRepository.save(bo);
                            officeCount++;
                        }
                    }
                }
                log.info("Successfully seeded {} verified block agriculture offices.", officeCount);
            }
        } catch (Exception e) {
            log.error("Error seeding block offices: {}", e.getMessage(), e);
        }
    }
}
