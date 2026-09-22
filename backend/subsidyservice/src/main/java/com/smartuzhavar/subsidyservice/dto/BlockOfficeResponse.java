package com.smartuzhavar.subsidyservice.dto;

import com.smartuzhavar.subsidyservice.entity.BlockOffice;

public class BlockOfficeResponse {
    private Long id;
    private Long blockId;
    private String districtName;
    private String blockName;
    private String officeName;
    private String address;
    private Double latitude;
    private Double longitude;
    private String phone;
    private String source;
    private String verificationNote;

    public BlockOfficeResponse() {}

    public static BlockOfficeResponse fromEntity(BlockOffice office) {
        if (office == null) return null;
        BlockOfficeResponse res = new BlockOfficeResponse();
        res.setId(office.getId());
        res.setBlockId(office.getBlock() != null ? office.getBlock().getId() : null);
        res.setDistrictName(office.getDistrictName());
        res.setBlockName(office.getBlockName());
        res.setOfficeName(office.getOfficeName());
        res.setAddress(office.getAddress());
        res.setLatitude(office.getLatitude());
        res.setLongitude(office.getLongitude());
        res.setPhone(office.getPhone());
        res.setSource(office.getSource());
        res.setVerificationNote(office.getVerificationNote());
        return res;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getBlockId() { return blockId; }
    public void setBlockId(Long blockId) { this.blockId = blockId; }

    public String getDistrictName() { return districtName; }
    public void setDistrictName(String districtName) { this.districtName = districtName; }

    public String getBlockName() { return blockName; }
    public void setBlockName(String blockName) { this.blockName = blockName; }

    public String getOfficeName() { return officeName; }
    public void setOfficeName(String officeName) { this.officeName = officeName; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getVerificationNote() { return verificationNote; }
    public void setVerificationNote(String verificationNote) { this.verificationNote = verificationNote; }
}
