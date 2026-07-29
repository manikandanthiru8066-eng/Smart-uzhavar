package com.smartuzhavar.insuranceservice.repository;

import com.smartuzhavar.insuranceservice.entity.InsuranceEstimate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InsuranceEstimateRepository extends JpaRepository<InsuranceEstimate, Long> {
    List<InsuranceEstimate> findByFarmerId(Long farmerId);
}
