package com.smartuzhavar.insuranceservice.repository;

import com.smartuzhavar.insuranceservice.entity.MachineryBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface MachineryBookingRepository extends JpaRepository<MachineryBooking, Long> {

    @Query("SELECT b FROM MachineryBooking b WHERE " +
           "((:blockId IS NOT NULL AND b.blockId = :blockId) OR " +
           "(:blockName IS NOT NULL AND LOWER(b.blockName) = LOWER(:blockName))) " +
           "AND b.createdAt >= :since " +
           "ORDER BY b.createdAt DESC")
    List<MachineryBooking> findRecentActivity(
            @Param("blockId") Long blockId,
            @Param("blockName") String blockName,
            @Param("since") Instant since
    );

    @Query("SELECT b FROM MachineryBooking b WHERE b.createdAt >= :since ORDER BY b.createdAt DESC")
    List<MachineryBooking> findAllRecentActivity(@Param("since") Instant since);
}
