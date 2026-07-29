package com.smartuzhavar.insuranceservice.repository;

import com.smartuzhavar.insuranceservice.entity.InsuranceScheme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InsuranceSchemeRepository extends JpaRepository<InsuranceScheme, Long> {

    @Query("SELECT s FROM InsuranceScheme s WHERE LOWER(s.applicableCrops) = 'all' OR LOWER(s.applicableCrops) LIKE LOWER(CONCAT('%', :crop, '%'))")
    List<InsuranceScheme> findByCrop(@Param("crop") String crop);
}
