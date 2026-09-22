package com.smartuzhavar.insuranceservice.controller;

import com.smartuzhavar.insuranceservice.dto.AuthResponse;
import com.smartuzhavar.insuranceservice.dto.LoginRequest;
import com.smartuzhavar.insuranceservice.dto.SignupRequest;
import com.smartuzhavar.insuranceservice.entity.District;
import com.smartuzhavar.insuranceservice.entity.Farmer;
import com.smartuzhavar.insuranceservice.entity.FarmerProfile;
import com.smartuzhavar.insuranceservice.repository.DistrictRepository;
import com.smartuzhavar.insuranceservice.repository.FarmerProfileRepository;
import com.smartuzhavar.insuranceservice.repository.FarmerRepository;
import com.smartuzhavar.insuranceservice.security.JwtTokenProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final FarmerRepository farmerRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final DistrictRepository districtRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthController(AuthenticationManager authenticationManager,
                          FarmerRepository farmerRepository,
                          FarmerProfileRepository farmerProfileRepository,
                          DistrictRepository districtRepository,
                          PasswordEncoder passwordEncoder,
                          JwtTokenProvider tokenProvider) {
        this.authenticationManager = authenticationManager;
        this.farmerRepository = farmerRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.districtRepository = districtRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerFarmer(@RequestBody SignupRequest signupRequest) {
        if (signupRequest.getUsername() == null || signupRequest.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (signupRequest.getPassword() == null || signupRequest.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }

        if (farmerRepository.existsByUsername(signupRequest.getUsername())) {
            throw new IllegalArgumentException("Username is already taken!");
        }

        if (signupRequest.getEmail() != null && !signupRequest.getEmail().trim().isEmpty() &&
                farmerRepository.existsByEmail(signupRequest.getEmail())) {
            throw new IllegalArgumentException("Email is already in use!");
        }

        if (signupRequest.getPhoneNumber() != null && !signupRequest.getPhoneNumber().trim().isEmpty() &&
                farmerRepository.existsByPhoneNumber(signupRequest.getPhoneNumber())) {
            throw new IllegalArgumentException("Phone number is already in use!");
        }

        // Create farmer account
        Farmer farmer = new Farmer();
        farmer.setUsername(signupRequest.getUsername());
        farmer.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
        farmer.setEmail(signupRequest.getEmail());
        farmer.setPhoneNumber(signupRequest.getPhoneNumber());

        Farmer savedFarmer = farmerRepository.save(farmer);

        // Create farmer profile
        FarmerProfile profile = new FarmerProfile();
        profile.setFarmer(savedFarmer);
        profile.setFullName(signupRequest.getFullName() != null && !signupRequest.getFullName().trim().isEmpty()
                ? signupRequest.getFullName() : signupRequest.getUsername());
        profile.setCropGrown(signupRequest.getCropGrown());
        profile.setLandSizeHectares(signupRequest.getLandSizeHectares());

        if (signupRequest.getDistrictName() != null && !signupRequest.getDistrictName().trim().isEmpty()) {
            District district = districtRepository.findByName(signupRequest.getDistrictName())
                    .orElseThrow(() -> new IllegalArgumentException("District not found: " + signupRequest.getDistrictName()));
            profile.setDistrict(district);
        }

        farmerProfileRepository.save(profile);

        // Generate token
        String jwt = tokenProvider.generateToken(savedFarmer.getUsername());
        return ResponseEntity.ok(new AuthResponse(jwt, savedFarmer.getUsername()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateFarmer(@RequestBody LoginRequest loginRequest) {
        if (loginRequest.getUsername() == null || loginRequest.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (loginRequest.getPassword() == null || loginRequest.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        Farmer farmer = farmerRepository.findByUsernameIgnoreCase(loginRequest.getUsername())
                .orElseGet(() -> farmerRepository.findByUsername(loginRequest.getUsername()).orElse(null));
        String role = (farmer != null && farmer.getRole() != null) ? farmer.getRole().trim().toUpperCase() : "FARMER";

        String jwt = tokenProvider.generateToken(loginRequest.getUsername(), role);
        return ResponseEntity.ok(new AuthResponse(jwt, loginRequest.getUsername(), role));
    }
}
