package com.smartuzhavar.subsidyservice.controller;

import com.smartuzhavar.subsidyservice.dto.AuthResponse;
import com.smartuzhavar.subsidyservice.dto.LoginRequest;
import com.smartuzhavar.subsidyservice.dto.SignupRequest;
import com.smartuzhavar.subsidyservice.entity.District;
import com.smartuzhavar.subsidyservice.entity.Farmer;
import com.smartuzhavar.subsidyservice.entity.FarmerProfile;
import com.smartuzhavar.subsidyservice.repository.DistrictRepository;
import com.smartuzhavar.subsidyservice.repository.FarmerProfileRepository;
import com.smartuzhavar.subsidyservice.repository.FarmerRepository;
import com.smartuzhavar.subsidyservice.security.JwtTokenProvider;
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

        // Password strength: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit
        String pwd = signupRequest.getPassword();
        if (pwd.length() < 8 || !pwd.matches(".*[A-Z].*") || !pwd.matches(".*[a-z].*") || !pwd.matches(".*\\d.*")) {
            throw new IllegalArgumentException(
                "Password must be at least 8 characters and include uppercase, lowercase, and a number.");
        }

        String username = signupRequest.getUsername().trim();
        if (farmerRepository.existsByUsernameIgnoreCase(username)) {
            throw new IllegalArgumentException("Username '" + username + "' is already taken. Please choose another username.");
        }

        String cleanEmail = (signupRequest.getEmail() != null && !signupRequest.getEmail().trim().isEmpty())
                ? signupRequest.getEmail().trim() : null;
        String cleanPhone = (signupRequest.getPhoneNumber() != null && !signupRequest.getPhoneNumber().trim().isEmpty())
                ? signupRequest.getPhoneNumber().trim() : null;

        // Phone number: must be exactly 10 digits
        if (cleanPhone != null && !cleanPhone.matches("^\\d{10}$")) {
            throw new IllegalArgumentException("Phone number must be exactly 10 digits.");
        }

        if (cleanEmail != null && farmerRepository.existsByEmailIgnoreCase(cleanEmail)) {
            throw new IllegalArgumentException("Email address '" + cleanEmail + "' is already in use.");
        }

        if (cleanPhone != null && farmerRepository.existsByPhoneNumber(cleanPhone)) {
            throw new IllegalArgumentException("Phone number '" + cleanPhone + "' is already in use.");
        }

        // Creating farmer account (Identity details ONLY, no crop profiles created during signup)
        Farmer farmer = new Farmer();
        farmer.setUsername(signupRequest.getUsername().trim());
        farmer.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
        farmer.setFullName(signupRequest.getFullName() != null && !signupRequest.getFullName().trim().isEmpty() 
                ? signupRequest.getFullName().trim() : signupRequest.getUsername().trim());
        farmer.setEmail(cleanEmail);
        farmer.setPhoneNumber(cleanPhone);

        Farmer savedFarmer = farmerRepository.save(farmer);

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
        String jwt = tokenProvider.generateToken(loginRequest.getUsername());
        return ResponseEntity.ok(new AuthResponse(jwt, loginRequest.getUsername()));
    }
}
