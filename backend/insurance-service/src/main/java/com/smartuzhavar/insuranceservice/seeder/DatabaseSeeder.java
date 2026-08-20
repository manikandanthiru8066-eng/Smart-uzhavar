package com.smartuzhavar.insuranceservice.seeder;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartuzhavar.insuranceservice.entity.InsuranceScheme;
import com.smartuzhavar.insuranceservice.repository.InsuranceSchemeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);
    private static final String SCHEMES_CLASSPATH = "insurance_schemes.json";
    // How many schemes are defined in the canonical JSON file
    private static final long EXPECTED_SCHEME_COUNT = 5;

    private final InsuranceSchemeRepository insuranceSchemeRepository;
    private final com.smartuzhavar.insuranceservice.repository.DistrictRepository districtRepository;
    private final ObjectMapper objectMapper;

    public DatabaseSeeder(InsuranceSchemeRepository insuranceSchemeRepository,
                          com.smartuzhavar.insuranceservice.repository.DistrictRepository districtRepository,
                          ObjectMapper objectMapper) {
        this.insuranceSchemeRepository = insuranceSchemeRepository;
        this.districtRepository = districtRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) throws Exception {
        seedDistricts();
        seedInsuranceSchemes();
    }

    private void seedDistricts() {
        try {
            if (districtRepository.count() == 0) {
                List<String> defaultDistricts = List.of(
                    "Thanjavur", "Thiruvarur", "Nagapattinam", "Trichy", "Ariyalur", "Karur",
                    "Pudukkottai", "Madurai", "Coimbatore", "Chennai", "Cuddalore", "Dharmapuri",
                    "Dindigul", "Erode", "Kanchipuram", "Kanyakumari", "Krishnagiri", "Namakkal",
                    "Perambalur", "Ramanathapuram", "Salem", "Sivaganga", "Tenkasi", "Theni",
                    "Thoothukudi", "Tirunelveli", "Tiruppur", "Tiruvallur", "Tiruvannamalai",
                    "Vellore", "Viluppuram", "Virudhunagar"
                );
                List<com.smartuzhavar.insuranceservice.entity.District> districts = defaultDistricts.stream()
                    .map(com.smartuzhavar.insuranceservice.entity.District::new)
                    .toList();
                districtRepository.saveAll(districts);
                log.info("Successfully seeded {} districts in insurance-service.", districts.size());
            }
        } catch (Exception e) {
            log.warn("District seeding skipped or completed by parallel service: {}", e.getMessage());
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
