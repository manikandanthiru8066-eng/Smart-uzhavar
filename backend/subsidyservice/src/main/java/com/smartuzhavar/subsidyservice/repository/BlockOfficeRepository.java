package com.smartuzhavar.subsidyservice.repository;

import com.smartuzhavar.subsidyservice.entity.BlockOffice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BlockOfficeRepository extends JpaRepository<BlockOffice, Long> {
    Optional<BlockOffice> findByBlockId(Long blockId);
    Optional<BlockOffice> findFirstByBlockNameIgnoreCase(String blockName);
    Optional<BlockOffice> findFirstByDistrictNameIgnoreCaseAndBlockNameIgnoreCase(String districtName, String blockName);
}
