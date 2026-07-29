package com.smartuzhavar.insuranceservice.repository;

import com.smartuzhavar.insuranceservice.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);
}
