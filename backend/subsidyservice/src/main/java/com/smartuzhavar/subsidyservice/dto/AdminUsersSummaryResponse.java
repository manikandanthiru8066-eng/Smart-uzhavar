package com.smartuzhavar.subsidyservice.dto;

import java.util.List;

public class AdminUsersSummaryResponse {
    private long totalUsers;
    private long totalFarmers;
    private long totalAdmins;
    private List<AdminUserDto> users;

    public AdminUsersSummaryResponse() {}

    public AdminUsersSummaryResponse(long totalUsers, long totalFarmers, long totalAdmins, List<AdminUserDto> users) {
        this.totalUsers = totalUsers;
        this.totalFarmers = totalFarmers;
        this.totalAdmins = totalAdmins;
        this.users = users;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalFarmers() {
        return totalFarmers;
    }

    public void setTotalFarmers(long totalFarmers) {
        this.totalFarmers = totalFarmers;
    }

    public long getTotalAdmins() {
        return totalAdmins;
    }

    public void setTotalAdmins(long totalAdmins) {
        this.totalAdmins = totalAdmins;
    }

    public List<AdminUserDto> getUsers() {
        return users;
    }

    public void setUsers(List<AdminUserDto> users) {
        this.users = users;
    }
}
