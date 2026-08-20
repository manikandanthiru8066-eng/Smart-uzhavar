package com.smartuzhavar.insuranceservice.repository;

import com.smartuzhavar.insuranceservice.entity.Farmer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FarmerRepository extends JpaRepository<Farmer, Long> {
    Optional<Farmer> findByUsername(String username);
    Optional<Farmer> findByUsernameIgnoreCase(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);
}
