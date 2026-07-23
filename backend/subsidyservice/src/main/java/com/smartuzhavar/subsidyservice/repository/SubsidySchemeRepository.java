package com.smartuzhavar.subsidyservice.repository;

import com.smartuzhavar.subsidyservice.entity.SubsidyScheme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubsidySchemeRepository extends JpaRepository<SubsidyScheme, Long> {
}
