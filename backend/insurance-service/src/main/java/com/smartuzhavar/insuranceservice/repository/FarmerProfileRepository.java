package com.smartuzhavar.insuranceservice.repository;

import com.smartuzhavar.insuranceservice.entity.Farmer;
import com.smartuzhavar.insuranceservice.entity.FarmerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FarmerProfileRepository extends JpaRepository<FarmerProfile, Long> {
    Optional<FarmerProfile> findByFarmer(Farmer farmer);
    Optional<FarmerProfile> findByFarmerId(Long farmerId);
}
