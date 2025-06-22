-- Create contacts table for HoloCard application
-- This table stores relationships between users and the cards they've scanned/added to contacts

CREATE TABLE IF NOT EXISTS contacts (
    ContactID INT PRIMARY KEY AUTO_INCREMENT,
    UID INT NOT NULL,
    HoloCardID INT NOT NULL,
    DateAdded TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UID) REFERENCES users(UID) ON DELETE CASCADE,
    FOREIGN KEY (HoloCardID) REFERENCES cards(HoloCardID) ON DELETE CASCADE,
    UNIQUE KEY unique_contact (UID, HoloCardID) -- Prevent duplicate contacts
);

-- Create index for better performance on common queries
CREATE INDEX idx_contacts_uid ON contacts(UID);
CREATE INDEX idx_contacts_holocardid ON contacts(HoloCardID);
CREATE INDEX idx_contacts_date ON contacts(DateAdded);
