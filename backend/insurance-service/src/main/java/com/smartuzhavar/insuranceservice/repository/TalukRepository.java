package com.smartuzhavar.insuranceservice.repository;

import com.smartuzhavar.insuranceservice.entity.Taluk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TalukRepository extends JpaRepository<Taluk, Long> {
    @Query("SELECT DISTINCT t FROM Taluk t LEFT JOIN FETCH t.blocks WHERE t.district.id = :districtId ORDER BY t.name ASC")
    List<Taluk> findByDistrictIdOrderByNameAsc(@Param("districtId") Long districtId);

    @Query("SELECT DISTINCT t FROM Taluk t LEFT JOIN FETCH t.blocks WHERE LOWER(t.district.name) = LOWER(:districtName) ORDER BY t.name ASC")
    List<Taluk> findByDistrictNameIgnoreCaseOrderByNameAsc(@Param("districtName") String districtName);

    @Query("SELECT DISTINCT t FROM Taluk t LEFT JOIN FETCH t.blocks WHERE t.lgdSubdistrictCode = :lgdSubdistrictCode")
    Optional<Taluk> findByLgdSubdistrictCode(@Param("lgdSubdistrictCode") Integer lgdSubdistrictCode);

    @Query("SELECT DISTINCT t FROM Taluk t LEFT JOIN FETCH t.blocks WHERE LOWER(t.name) = LOWER(:name) AND t.district.id = :districtId")
    Optional<Taluk> findByNameIgnoreCaseAndDistrictId(@Param("name") String name, @Param("districtId") Long districtId);
}
