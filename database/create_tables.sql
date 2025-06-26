-- HoloCard Database Schema Creation
-- Create all tables for holocard_db database

-- ===========================================
-- CREATE DATABASE (if needed)
-- ===========================================
CREATE DATABASE IF NOT EXISTS holocard_db;
USE holocard_db;

-- ===========================================
-- CREATE USER TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS user (
    UID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(100) NOT NULL,
    Email_Address VARCHAR(50) NOT NULL UNIQUE,
    isDeleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ===========================================
-- CREATE HOLOCARD TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS holocard (
    HoloCardID INT AUTO_INCREMENT PRIMARY KEY,
    CardType TINYINT(1) NOT NULL COMMENT '1 for personal, 2 for company',
    Address VARCHAR(100),
    ContactNo VARCHAR(15),
    Email VARCHAR(50),
    isDeleted TINYINT(1) DEFAULT 0,
    QRCode LONGBLOB,
    UID INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UID) REFERENCES user(UID) ON DELETE CASCADE
);

-- ===========================================
-- CREATE PERSONAL TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS personal (
    HoloCardID INT PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Suffix VARCHAR(15),
    BirthDate DATE,
    Profession VARCHAR(25),
    ProfilePicture LONGBLOB,
    MiddleName VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (HoloCardID) REFERENCES holocard(HoloCardID) ON DELETE CASCADE
);

-- ===========================================
-- CREATE COMPANY TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS company (
    HoloCardID INT PRIMARY KEY,
    CompanyName VARCHAR(50) NOT NULL,
    CompanyLogo LONGBLOB,
    ContactPerson_FirstName VARCHAR(50),
    ContactPerson_LastName VARCHAR(50),
    ContactPerson_Suffix VARCHAR(15),
    Position VARCHAR(25),
    ContactPerson_MiddleName VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (HoloCardID) REFERENCES holocard(HoloCardID) ON DELETE CASCADE
);

-- ===========================================
-- CREATE CONTACTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS contacts (
    ContactID INT AUTO_INCREMENT PRIMARY KEY,
    UID INT NOT NULL,
    HoloCardID INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UID) REFERENCES user(UID) ON DELETE CASCADE,
    FOREIGN KEY (HoloCardID) REFERENCES holocard(HoloCardID) ON DELETE CASCADE,
    UNIQUE KEY unique_contact (UID, HoloCardID)
);

-- ===========================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- ===========================================

-- Index on user table
CREATE INDEX idx_user_username ON user(Username);
CREATE INDEX idx_user_email ON user(Email_Address);
CREATE INDEX idx_user_deleted ON user(isDeleted);

-- Index on holocard table
CREATE INDEX idx_holocard_uid ON holocard(UID);
CREATE INDEX idx_holocard_type ON holocard(CardType);
CREATE INDEX idx_holocard_deleted ON holocard(isDeleted);
CREATE INDEX idx_holocard_email ON holocard(Email);

-- Index on personal table
CREATE INDEX idx_personal_name ON personal(FirstName, LastName);
CREATE INDEX idx_personal_profession ON personal(Profession);

-- Index on company table
CREATE INDEX idx_company_name ON company(CompanyName);
CREATE INDEX idx_company_contact ON company(ContactPerson_FirstName, ContactPerson_LastName);

-- Index on contacts table
CREATE INDEX idx_contacts_uid ON contacts(UID);
CREATE INDEX idx_contacts_holocardid ON contacts(HoloCardID);

-- ===========================================
-- INSERT SAMPLE DATA (OPTIONAL)
-- ===========================================

-- Sample users
INSERT IGNORE INTO user (Username, Password, Email_Address) VALUES
('john_doe', '$2y$10$example_hashed_password_1', 'john@example.com'),
('jane_smith', '$2y$10$example_hashed_password_2', 'jane@example.com'),
('company_admin', '$2y$10$example_hashed_password_3', 'admin@company.com');

-- Sample holocards
INSERT IGNORE INTO holocard (HoloCardID, CardType, Address, ContactNo, Email, UID) VALUES
(1, 1, '123 Main St, City, State', '+1234567890', 'john@example.com', 1),
(2, 1, '456 Oak Ave, City, State', '+0987654321', 'jane@example.com', 2),
(3, 2, '789 Business Blvd, City, State', '+1122334455', 'contact@company.com', 3);

-- Sample personal cards
INSERT IGNORE INTO personal (HoloCardID, FirstName, LastName, Profession, MiddleName) VALUES
(1, 'John', 'Doe', 'Software Developer', 'Michael'),
(2, 'Jane', 'Smith', 'Graphic Designer', 'Marie');

-- Sample company card
INSERT IGNORE INTO company (HoloCardID, CompanyName, ContactPerson_FirstName, ContactPerson_LastName, Position) VALUES
(3, 'Tech Solutions Inc.', 'Alice', 'Johnson', 'CEO');

-- Sample contacts (John has Jane's card, Jane has company card)
INSERT IGNORE INTO contacts (UID, HoloCardID) VALUES
(1, 2),  -- John has Jane's card
(2, 3);  -- Jane has company card

-- ===========================================
-- SHOW TABLES TO VERIFY CREATION
-- ===========================================
SHOW TABLES;

-- ===========================================
-- SHOW TABLE STRUCTURES
-- ===========================================
DESCRIBE user;
DESCRIBE holocard;
DESCRIBE personal;
DESCRIBE company;
DESCRIBE contacts;
