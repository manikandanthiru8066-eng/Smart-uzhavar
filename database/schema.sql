-- database/schema.sql

-- 1. Districts table
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);
ALTER TABLE districts ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE districts ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 1b. Taluks table
CREATE TABLE IF NOT EXISTS taluks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    lgd_subdistrict_code INTEGER UNIQUE NOT NULL,
    district_id INTEGER NOT NULL REFERENCES districts(id) ON DELETE CASCADE
);

-- 1c. Blocks table
CREATE TABLE IF NOT EXISTS blocks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    lgd_block_code VARCHAR(20) UNIQUE NOT NULL
);

-- 1d. Taluk Blocks join table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS taluk_blocks (
    taluk_id INTEGER NOT NULL REFERENCES taluks(id) ON DELETE CASCADE,
    block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    PRIMARY KEY (taluk_id, block_id)
);


-- 2. Farmers table (Authentication details)
CREATE TABLE IF NOT EXISTS farmers (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone_number VARCHAR(20) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Taluks table
CREATE TABLE IF NOT EXISTS taluks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    district_id INTEGER NOT NULL REFERENCES districts(id) ON DELETE CASCADE
);

-- 4. Blocks table
CREATE TABLE IF NOT EXISTS blocks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    taluk_id INTEGER NOT NULL REFERENCES taluks(id) ON DELETE CASCADE
);

-- 5. District Crop Statistics table
CREATE TABLE IF NOT EXISTS district_crop_stats (
    id SERIAL PRIMARY KEY,
    district_id INTEGER NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    crop VARCHAR(100) NOT NULL,
    season VARCHAR(50),
    year VARCHAR(20),
    area_hectares DECIMAL(12, 2),
    production_tonnes DECIMAL(12, 2),
    yield_kg_per_ha DECIMAL(12, 2),
    is_top_crop BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Farmer Profiles table (One farmer can have MULTIPLE crop profiles)
CREATE TABLE IF NOT EXISTS farmer_profiles (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    full_name VARCHAR(100),
    district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL,
    taluk_id INTEGER REFERENCES taluks(id) ON DELETE SET NULL,
    block_id INTEGER REFERENCES blocks(id) ON DELETE SET NULL,
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
ALTER TABLE farmer_profiles ADD COLUMN IF NOT EXISTS taluk_id INTEGER REFERENCES taluks(id) ON DELETE SET NULL;
ALTER TABLE farmer_profiles ADD COLUMN IF NOT EXISTS block_id INTEGER REFERENCES blocks(id) ON DELETE SET NULL;




-- 4. Subsidy Schemes table
CREATE TABLE IF NOT EXISTS subsidy_schemes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    name_ta VARCHAR(255),
    description TEXT NOT NULL,
    description_ta TEXT,
    applicable_crops VARCHAR(255), -- Comma-separated list of crops, or "All"
    applicable_crops_ta VARCHAR(255),
    applicable_districts VARCHAR(255), -- Comma-separated list of district names, or "All"
    subsidy_amount VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Subsidy Applications table
CREATE TABLE IF NOT EXISTS subsidy_applications (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    scheme_id INTEGER NOT NULL REFERENCES subsidy_schemes(id) ON DELETE CASCADE,
    application_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PENDING',
    remarks TEXT,
    CONSTRAINT unique_farmer_scheme UNIQUE (farmer_id, scheme_id)
);

-- 6. Insurance Schemes table
CREATE TABLE IF NOT EXISTS insurance_schemes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    name_ta VARCHAR(255),
    description TEXT NOT NULL,
    description_ta TEXT,
    scheme_type VARCHAR(50) NOT NULL, -- WEATHER_BASED, YIELD_BASED, REVENUE_BASED
    applicable_crops VARCHAR(255) NOT NULL, -- Comma-separated list of crops, or "All"
    applicable_crops_ta VARCHAR(255),
    premium_rate_percentage DECIMAL(5, 2) NOT NULL,
    sum_insured_per_acre DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Insurance Estimates table
CREATE TABLE IF NOT EXISTS insurance_estimates (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    scheme_id INTEGER NOT NULL REFERENCES insurance_schemes(id) ON DELETE CASCADE,
    land_size_acres DECIMAL(10, 2) NOT NULL,
    crop VARCHAR(100) NOT NULL,
    premium_estimate DECIMAL(12, 2) NOT NULL,
    sum_insured DECIMAL(12, 2) NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

