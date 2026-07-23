package com.smartuzhavar.subsidyservice.security;

import com.smartuzhavar.subsidyservice.entity.Farmer;
import com.smartuzhavar.subsidyservice.repository.FarmerRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final FarmerRepository farmerRepository;

    public CustomUserDetailsService(FarmerRepository farmerRepository) {
        this.farmerRepository = farmerRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Farmer farmer = farmerRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Farmer not found with username: " + username));

        return new User(farmer.getUsername(), farmer.getPassword(), new ArrayList<>());
    }
}
