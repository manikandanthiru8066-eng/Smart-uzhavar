package com.smartuzhavar.subsidyservice.repository;

import com.smartuzhavar.subsidyservice.entity.District;
import com.smartuzhavar.subsidyservice.entity.DistrictCropStat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DistrictCropStatRepository extends JpaRepository<DistrictCropStat, Long> {
    List<DistrictCropStat> findByDistrict(District district);
    List<DistrictCropStat> findByDistrictId(Long districtId);
    List<DistrictCropStat> findByDistrictNameIgnoreCase(String districtName);
    List<DistrictCropStat> findByDistrictIdAndIsTopCropTrue(Long districtId);
    List<DistrictCropStat> findByDistrictNameIgnoreCaseAndIsTopCropTrue(String districtName);
}
