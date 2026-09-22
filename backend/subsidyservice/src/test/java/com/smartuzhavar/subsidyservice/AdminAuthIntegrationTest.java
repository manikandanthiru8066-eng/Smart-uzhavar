package com.smartuzhavar.subsidyservice;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartuzhavar.subsidyservice.dto.LoginRequest;
import com.smartuzhavar.subsidyservice.entity.Farmer;
import com.smartuzhavar.subsidyservice.repository.FarmerRepository;
import com.smartuzhavar.subsidyservice.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AdminAuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FarmerRepository farmerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        // Ensure clean test database state
        farmerRepository.deleteAll();

        // 1. Seed Admin Account with BCryptPasswordEncoder bean and role 'ADMIN'
        Farmer admin = new Farmer();
        admin.setUsername("admin");
        admin.setFullName("System Administrator");
        admin.setEmail("admin@smartuzhavar.gov.in");
        admin.setPhoneNumber("9876543210");
        admin.setRole("ADMIN");
        admin.setPassword(passwordEncoder.encode("AdminPassword123!"));
        farmerRepository.save(admin);

        // 2. Seed Regular Farmer Account with BCryptPasswordEncoder bean and role 'FARMER'
        Farmer farmer = new Farmer();
        farmer.setUsername("farmer_test");
        farmer.setFullName("Test Farmer");
        farmer.setEmail("farmer@smartuzhavar.gov.in");
        farmer.setPhoneNumber("9123456780");
        farmer.setRole("FARMER");
        farmer.setPassword(passwordEncoder.encode("FarmerPassword123!"));
        farmerRepository.save(farmer);
    }

    @Test
    @DisplayName("1. Admin password is verified as a valid BCrypt hash matching AdminPassword123!")
    void testAdminPasswordHashVerification() {
        Farmer admin = farmerRepository.findByUsernameIgnoreCase("admin").orElseThrow();
        assertNotNull(admin.getPassword());
        assertTrue(admin.getPassword().startsWith("$2a$"), "Stored password must be a BCrypt hash starting with $2a$");
        assertEquals("ADMIN", admin.getRole(), "Admin role must be ADMIN");

        // Verify matches logic
        assertTrue(passwordEncoder.matches("AdminPassword123!", admin.getPassword()), 
                "BCryptPasswordEncoder.matches must succeed for AdminPassword123!");
        assertFalse(passwordEncoder.matches("WrongPassword", admin.getPassword()), 
                "BCryptPasswordEncoder.matches must fail for wrong password");
    }

    @Test
    @DisplayName("2. Admin login succeeds with HTTP 200 and returns role=ADMIN and valid JWT")
    void testAdminLoginSuccess() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin", "AdminPassword123!");

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.token").isString())
                .andReturn();

        String responseStr = result.getResponse().getContentAsString();
        JsonNode json = objectMapper.readTree(responseStr);
        String token = json.get("token").asText();

        // Validate JWT claims
        assertTrue(jwtTokenProvider.validateToken(token), "JWT token must be valid");
        assertEquals("admin", jwtTokenProvider.getUsernameFromToken(token));
        assertEquals("ADMIN", jwtTokenProvider.getRoleFromToken(token), "JWT role claim must be ADMIN");
    }

    @Test
    @DisplayName("3. Admin login with incorrect password fails with HTTP 401 / Bad credentials")
    void testAdminLoginFailureBadCredentials() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin", "WrongPassword999!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("4. Admin JWT accesses /api/admin/subsidies successfully (HTTP 200)")
    void testAdminCanAccessAdminRoute() throws Exception {
        String adminToken = jwtTokenProvider.generateToken("admin", "ADMIN");

        mockMvc.perform(get("/api/admin/subsidies")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("5. Regular Farmer JWT is rejected from /api/admin/subsidies with HTTP 403 Forbidden")
    void testFarmerRejectedFromAdminRoute() throws Exception {
        String farmerToken = jwtTokenProvider.generateToken("farmer_test", "FARMER");

        mockMvc.perform(get("/api/admin/subsidies")
                        .header("Authorization", "Bearer " + farmerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("6. Unauthenticated request to /api/admin/subsidies is rejected with HTTP 401 Unauthorized")
    void testUnauthenticatedRejectedFromAdminRoute() throws Exception {
        mockMvc.perform(get("/api/admin/subsidies"))
                .andExpect(status().isUnauthorized());
    }
}
