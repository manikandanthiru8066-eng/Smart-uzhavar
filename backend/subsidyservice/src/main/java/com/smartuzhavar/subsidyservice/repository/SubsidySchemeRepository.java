package com.smartuzhavar.subsidyservice.repository;

import com.smartuzhavar.subsidyservice.entity.SubsidyScheme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubsidySchemeRepository extends JpaRepository<SubsidyScheme, Long> {
    Optional<SubsidyScheme> findByName(String name);
    Optional<SubsidyScheme> findByNameIgnoreCase(String name);
}
