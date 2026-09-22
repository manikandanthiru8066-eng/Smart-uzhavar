-- ============================================================
-- Smart Uzhavar - Complete Neon PostgreSQL Unified Schema
-- Run this in the Neon SQL Editor (neon.tech)
-- ============================================================

-- 1. Districts table
CREATE TABLE IF NOT EXISTS districts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

-- 2. Taluks table
CREATE TABLE IF NOT EXISTS taluks (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    lgd_subdistrict_code INT UNIQUE NOT NULL,
    district_id BIGINT NOT NULL REFERENCES districts(id) ON DELETE CASCADE
);

-- 3. Blocks table
CREATE TABLE IF NOT EXISTS blocks (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    lgd_block_code VARCHAR(20) UNIQUE NOT NULL
);

-- 4. Taluk Blocks join table
CREATE TABLE IF NOT EXISTS taluk_blocks (
    taluk_id BIGINT NOT NULL REFERENCES taluks(id) ON DELETE CASCADE,
    block_id BIGINT NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    PRIMARY KEY (taluk_id, block_id)
);

-- 5. District Crop Statistics table
CREATE TABLE IF NOT EXISTS district_crop_stats (
    id BIGSERIAL PRIMARY KEY,
    district_id BIGINT NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    crop VARCHAR(100) NOT NULL,
    season VARCHAR(50),
    year VARCHAR(20),
    area_hectares DECIMAL(12, 2),
    production_tonnes DECIMAL(12, 2),
    yield_kg_per_ha DECIMAL(12, 2),
    is_top_crop BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Farmers table
CREATE TABLE IF NOT EXISTS farmers (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone_number VARCHAR(20) UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'FARMER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'FARMER';

-- Ensure default admin user exists (Default credentials: admin / AdminPassword123!)
INSERT INTO farmers (username, password, full_name, email, phone_number, role)
VALUES ('admin', '$2a$10$RJNkAGXZirDR7iVsg2h6F.bxbKU91dkXYpv/w6lpXkVAJAwJEQnJe', 'System Administrator', 'admin@smartuzhavar.gov.in', '9876543210', 'ADMIN')
ON CONFLICT (username) DO UPDATE 
SET role = 'ADMIN', password = '$2a$10$RJNkAGXZirDR7iVsg2h6F.bxbKU91dkXYpv/w6lpXkVAJAwJEQnJe';

-- 7. Farmer Profiles table
CREATE TABLE IF NOT EXISTS farmer_profiles (
    id BIGSERIAL PRIMARY KEY,
    farmer_id BIGINT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    full_name VARCHAR(100),
    district_id BIGINT REFERENCES districts(id) ON DELETE SET NULL,
    taluk_id BIGINT REFERENCES taluks(id) ON DELETE SET NULL,
    block_id BIGINT REFERENCES blocks(id) ON DELETE SET NULL,
    block VARCHAR(100),
    crop_grown VARCHAR(100),
    crop_duration_months INTEGER,
    season VARCHAR(50),
    irrigation_type VARCHAR(50),
    land_size_acres DECIMAL(10, 2),
    land_size_hectares DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Subsidy Schemes table
CREATE TABLE IF NOT EXISTS subsidy_schemes (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    name_ta VARCHAR(255),
    description TEXT NOT NULL,
    description_ta TEXT,
    applicable_crops VARCHAR(255),
    applicable_crops_ta VARCHAR(255),
    applicable_districts VARCHAR(255),
    subsidy_amount VARCHAR(100),
    source_url VARCHAR(255),
    last_verified_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE subsidy_schemes ADD COLUMN IF NOT EXISTS source_url VARCHAR(255);
ALTER TABLE subsidy_schemes ADD COLUMN IF NOT EXISTS last_verified_date DATE;

-- 9. Insurance Schemes table
CREATE TABLE IF NOT EXISTS insurance_schemes (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    name_ta VARCHAR(255),
    description TEXT NOT NULL,
    description_ta TEXT,
    scheme_type VARCHAR(50) NOT NULL,
    applicable_crops VARCHAR(255) NOT NULL,
    applicable_crops_ta VARCHAR(255),
    premium_rate_percentage DECIMAL(5, 2) NOT NULL,
    sum_insured_per_acre DECIMAL(12, 2) NOT NULL,
    last_verified_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE insurance_schemes ADD COLUMN IF NOT EXISTS last_verified_date DATE;

-- 10. Subsidy Applications table
CREATE TABLE IF NOT EXISTS subsidy_applications (
    id BIGSERIAL PRIMARY KEY,
    farmer_id BIGINT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    scheme_id BIGINT NOT NULL REFERENCES subsidy_schemes(id) ON DELETE CASCADE,
    application_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PENDING',
    remarks TEXT,
    CONSTRAINT unique_farmer_scheme UNIQUE (farmer_id, scheme_id)
);

-- 11. Insurance Estimates table
CREATE TABLE IF NOT EXISTS insurance_estimates (
    id BIGSERIAL PRIMARY KEY,
    farmer_id BIGINT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    scheme_id BIGINT NOT NULL REFERENCES insurance_schemes(id) ON DELETE CASCADE,
    land_size_acres DECIMAL(10, 2) NOT NULL,
    crop VARCHAR(100) NOT NULL,
    premium_estimate DECIMAL(12, 2) NOT NULL,
    sum_insured DECIMAL(12, 2) NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Machinery Bookings table
CREATE TABLE IF NOT EXISTS machinery_bookings (
    id BIGSERIAL PRIMARY KEY,
    farmer_id BIGINT REFERENCES farmers(id) ON DELETE SET NULL,
    farmer_name VARCHAR(100),
    farmer_username VARCHAR(50),
    block_id BIGINT,
    block_name VARCHAR(100),
    district_name VARCHAR(100),
    village VARCHAR(100),
    machine_type VARCHAR(100) NOT NULL,
    acres DECIMAL(10, 2),
    required_date VARCHAR(50),
    status VARCHAR(50) DEFAULT 'REQUESTED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    farmer_id BIGINT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Block Agriculture Offices table
CREATE TABLE IF NOT EXISTS block_offices (
    id BIGSERIAL PRIMARY KEY,
    block_id BIGINT REFERENCES blocks(id) ON DELETE CASCADE,
    district_name VARCHAR(100) NOT NULL,
    block_name VARCHAR(100) NOT NULL,
    office_name VARCHAR(255),
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    phone VARCHAR(50),
    source VARCHAR(255),
    verification_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_block_offices_block_id ON block_offices(block_id);
CREATE INDEX IF NOT EXISTS idx_block_offices_block_name ON block_offices(block_name);
