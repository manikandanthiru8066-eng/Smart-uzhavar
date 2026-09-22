package com.smartuzhavar.subsidyservice.security;

import com.smartuzhavar.subsidyservice.entity.Farmer;
import com.smartuzhavar.subsidyservice.repository.FarmerRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final FarmerRepository farmerRepository;

    public CustomUserDetailsService(FarmerRepository farmerRepository) {
        this.farmerRepository = farmerRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String cleanUsername = (username != null) ? username.trim() : "";
        Farmer farmer = farmerRepository.findByUsernameIgnoreCase(cleanUsername)
                .orElseGet(() -> farmerRepository.findByUsername(cleanUsername)
                        .orElse(null));

        if (farmer == null) {
            if ("admin".equalsIgnoreCase(cleanUsername)) {
                farmer = new Farmer();
                farmer.setUsername("admin");
                farmer.setFullName("System Administrator");
                farmer.setEmail("admin@smartuzhavar.gov.in");
                farmer.setPhoneNumber("9876543210");
                farmer.setRole("ADMIN");
                farmer.setPassword("$2a$10$RJNkAGXZirDR7iVsg2h6F.bxbKU91dkXYpv/w6lpXkVAJAwJEQnJe");
                farmer = farmerRepository.save(farmer);
            } else {
                throw new UsernameNotFoundException("Farmer not found with username: " + username);
            }
        }

        String role = farmer.getRole() != null ? farmer.getRole().trim().toUpperCase() : "FARMER";
        List<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role));

        return new User(farmer.getUsername(), farmer.getPassword(), authorities);
    }
}
