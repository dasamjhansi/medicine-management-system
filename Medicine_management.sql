
-- 1. Create the database
CREATE DATABASE IF NOT EXISTS medicine_db;

-- 2. Select the database
USE medicine_db;

-- 3. Create the medicines table
CREATE TABLE IF NOT EXISTS medicines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    batch_no VARCHAR(100) NOT NULL,
    tablets_per_strip INT NOT NULL,
    strips_in_stock INT NOT NULL DEFAULT 0,
    loose_tablets INT NOT NULL DEFAULT 0,
    strip_price DECIMAL(10,2) NOT NULL,
    strip_discount DECIMAL(5,2) NOT NULL DEFAULT 0,
    tablet_discount DECIMAL(5,2) NOT NULL DEFAULT 0,
    expiry DATE NOT NULL,
    UNIQUE KEY unique_medicine_batch (name, batch_no)
);

-- 4. Check the table
DESCRIBE medicines;

-- 5. View saved records
SELECT * FROM medicines;
