package com.smartuzhavar.subsidyservice.repository;

import com.smartuzhavar.subsidyservice.entity.Block;
import com.smartuzhavar.subsidyservice.entity.Taluk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlockRepository extends JpaRepository<Block, Long> {
    List<Block> findByTaluk(Taluk taluk);
    List<Block> findByTalukIdOrderByNameAsc(Long talukId);
    Optional<Block> findByNameIgnoreCaseAndTalukId(String name, Long talukId);
}
