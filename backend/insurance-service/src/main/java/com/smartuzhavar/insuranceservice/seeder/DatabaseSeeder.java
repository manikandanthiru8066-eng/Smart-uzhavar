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
    private final ObjectMapper objectMapper;

    public DatabaseSeeder(InsuranceSchemeRepository insuranceSchemeRepository,
                          ObjectMapper objectMapper) {
        this.insuranceSchemeRepository = insuranceSchemeRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) throws Exception {
        seedInsuranceSchemes();
    }

    private void seedInsuranceSchemes() {
        long currentCount = insuranceSchemeRepository.count();

        if (currentCount == EXPECTED_SCHEME_COUNT) {
            log.info("Insurance schemes table already has {} schemes — skipping seed.", currentCount);
            return;
        }

        if (currentCount > 0 && currentCount != EXPECTED_SCHEME_COUNT) {
            log.warn("Insurance schemes table has {} rows but expected {}. Clearing and re-seeding...",
                    currentCount, EXPECTED_SCHEME_COUNT);
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
