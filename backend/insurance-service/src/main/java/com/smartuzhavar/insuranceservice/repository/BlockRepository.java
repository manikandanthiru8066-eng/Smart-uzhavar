package com.smartuzhavar.insuranceservice.repository;

import com.smartuzhavar.insuranceservice.entity.Block;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlockRepository extends JpaRepository<Block, Long> {
    Optional<Block> findByLgdBlockCode(String lgdBlockCode);

    @Query("SELECT b FROM Block b JOIN b.taluks t WHERE t.id = :talukId ORDER BY b.name ASC")
    List<Block> findByTalukId(@Param("talukId") Long talukId);
}
