DROP TABLE IF EXISTS subsidy_applications CASCADE;
DROP TABLE IF EXISTS subsidy_schemes CASCADE;
DROP TABLE IF EXISTS farmer_profiles CASCADE;
DROP TABLE IF EXISTS farmers CASCADE;
DROP TABLE IF EXISTS districts CASCADE;

-- 1. Districts table
CREATE TABLE districts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- 2. Farmers table (Authentication details)
CREATE TABLE farmers (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone_number VARCHAR(20) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 3. Farmer Profiles table (One farmer can have MULTIPLE crop profiles)
CREATE TABLE farmer_profiles (
    id BIGSERIAL PRIMARY KEY,
    farmer_id BIGINT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    full_name VARCHAR(100),
    district_id BIGINT REFERENCES districts(id) ON DELETE SET NULL,
    block VARCHAR(100),
    crop_grown VARCHAR(100),
    crop_duration_months INT,
    season VARCHAR(50),
    irrigation_type VARCHAR(50),
    land_size_acres DECIMAL(10, 2),
    land_size_hectares DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 4. Subsidy Schemes table
CREATE TABLE subsidy_schemes (
    id BIGSERIAL PRIMARY KEY,
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
CREATE TABLE subsidy_applications (
    id BIGSERIAL PRIMARY KEY,
    farmer_id BIGINT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    scheme_id BIGINT NOT NULL REFERENCES subsidy_schemes(id) ON DELETE CASCADE,
    application_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PENDING',
    remarks TEXT,
    CONSTRAINT unique_farmer_scheme UNIQUE (farmer_id, scheme_id)
);
