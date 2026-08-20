-- database/schema.sql

-- 1. Districts table
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
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


-- 3. Farmer Profiles table (One farmer can have MULTIPLE crop profiles)
CREATE TABLE IF NOT EXISTS farmer_profiles (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    full_name VARCHAR(100),
    district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL,
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

