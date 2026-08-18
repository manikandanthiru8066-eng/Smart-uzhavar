package com.smartuzhavar.subsidyservice.repository;

import com.smartuzhavar.subsidyservice.entity.District;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DistrictRepository extends JpaRepository<District, Long> {
    Optional<District> findByName(String name);
    Optional<District> findByNameIgnoreCase(String name);
}
