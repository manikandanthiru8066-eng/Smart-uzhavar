package com.smartuzhavar.subsidyservice;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

public class BCryptPasswordCheckTest {

    @Test
    void testStoredAdminHash() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String storedHash = "$2a$10$dnwD//AIJvgjxpLW9l3oLOgN0FdEwJxz9sHYvgBY.3kg3bKf0fM3S";

        String[] testPasswords = {
            "admin",
            "admin123",
            "Admin123",
            "Admin@123",
            "AdminPassword123!",
            "password",
            "123456",
            "admin@123",
            "root",
            "smartuzhavar"
        };

        System.out.println("=== TESTING STORED ADMIN HASH: " + storedHash + " ===");
        boolean matchedAny = false;
        for (String pwd : testPasswords) {
            boolean matches = false;
            try {
                matches = encoder.matches(pwd, storedHash);
            } catch (Exception e) {
                System.out.println("Error matching password '" + pwd + "': " + e.getMessage());
            }
            System.out.println("Password: '" + pwd + "' -> matches: " + matches);
            if (matches) matchedAny = true;
        }

        System.out.println("\n=== FRESH ENCODED HASHES ===");
        System.out.println("AdminPassword123! -> " + encoder.encode("AdminPassword123!"));
        System.out.println("admin123          -> " + encoder.encode("admin123"));
        System.out.println("Admin@123         -> " + encoder.encode("Admin@123"));
    }
}
