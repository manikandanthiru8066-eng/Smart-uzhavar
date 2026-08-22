package com.smartuzhavar.subsidyservice.repository;

import com.smartuzhavar.subsidyservice.entity.Taluk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TalukRepository extends JpaRepository<Taluk, Long> {
    List<Taluk> findByDistrictIdOrderByNameAsc(Long districtId);
    Optional<Taluk> findByLgdSubdistrictCode(Integer lgdSubdistrictCode);
    Optional<Taluk> findByNameIgnoreCaseAndDistrictId(String name, Long districtId);
}
