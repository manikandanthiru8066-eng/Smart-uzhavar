package com.smartuzhavar.subsidyservice.repository;

import com.smartuzhavar.subsidyservice.entity.Farmer;
import com.smartuzhavar.subsidyservice.entity.FarmerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FarmerProfileRepository extends JpaRepository<FarmerProfile, Long> {
    java.util.List<FarmerProfile> findByFarmer(Farmer farmer);
    java.util.List<FarmerProfile> findByFarmerId(Long farmerId);
    Optional<FarmerProfile> findFirstByFarmerOrderByIdAsc(Farmer farmer);
}

