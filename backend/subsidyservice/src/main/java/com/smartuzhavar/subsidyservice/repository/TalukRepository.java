package com.smartuzhavar.subsidyservice.repository;

import com.smartuzhavar.subsidyservice.entity.District;
import com.smartuzhavar.subsidyservice.entity.Taluk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TalukRepository extends JpaRepository<Taluk, Long> {
    List<Taluk> findByDistrict(District district);
    List<Taluk> findByDistrictIdOrderByNameAsc(Long districtId);
    List<Taluk> findByDistrictNameIgnoreCaseOrderByNameAsc(String districtName);
    Optional<Taluk> findByNameIgnoreCaseAndDistrictId(String name, Long districtId);
}
