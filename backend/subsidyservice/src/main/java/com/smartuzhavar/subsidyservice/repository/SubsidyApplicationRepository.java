package com.smartuzhavar.subsidyservice.repository;

import com.smartuzhavar.subsidyservice.entity.SubsidyApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubsidyApplicationRepository extends JpaRepository<SubsidyApplication, Long> {
    List<SubsidyApplication> findByFarmerId(Long farmerId);
}
