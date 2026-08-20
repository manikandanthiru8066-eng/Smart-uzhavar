package com.smartuzhavar.subsidyservice.repository;

import com.smartuzhavar.subsidyservice.entity.Farmer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FarmerRepository extends JpaRepository<Farmer, Long> {
    Optional<Farmer> findByUsername(String username);
    Optional<Farmer> findByUsernameIgnoreCase(String username);
    boolean existsByUsername(String username);
    boolean existsByUsernameIgnoreCase(String username);
    boolean existsByEmail(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByPhoneNumber(String phoneNumber);
}
