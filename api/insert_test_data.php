<?php
// Insert test data for testing
require_once '../database/connection.php';

header('Content-Type: text/plain');

echo "=== INSERTING TEST DATA ===\n\n";

try {
    // First, check if user with ID 1 exists
    $stmt = $pdo->prepare("SELECT * FROM user WHERE UID = 1");
    $stmt->execute();
    $user = $stmt->fetch();
    
    if (!$user) {
        echo "Creating test user...\n";
        $stmt = $pdo->prepare("INSERT INTO user (UID, username, email, password) VALUES (1, 'testuser', 'test@example.com', 'password123')");
        $stmt->execute();
        echo "✅ Test user created\n";
    } else {
        echo "✅ User with ID 1 already exists\n";
    }
    
    // Insert a test HoloCard
    echo "Creating test HoloCard...\n";
    $stmt = $pdo->prepare("INSERT INTO HoloCard (UID, CardType, Address, ContactNo, Email, BirthDate, isDeleted) VALUES (1, 0, '123 Test St', '555-0123', 'john.doe@example.com', '1990-01-01', FALSE)");
    $stmt->execute();
    $cardId = $pdo->lastInsertId();
    echo "✅ HoloCard created with ID: $cardId\n";
    
    // Insert personal data for the card
    echo "Creating personal data...\n";
    $stmt = $pdo->prepare("INSERT INTO Personal (HoloCardID, FirstName, LastName, MiddleName, Suffix) VALUES (?, 'John', 'Doe', 'Middle', '')");
    $stmt->execute([$cardId]);
    echo "✅ Personal data created\n";
    
    // Insert another corporate card
    echo "Creating corporate card...\n";
    $stmt = $pdo->prepare("INSERT INTO HoloCard (UID, CardType, Address, ContactNo, Email, isDeleted) VALUES (1, 1, '456 Business Ave', '555-0456', 'contact@testcorp.com', FALSE)");
    $stmt->execute();
    $corpCardId = $pdo->lastInsertId();
    echo "✅ Corporate HoloCard created with ID: $corpCardId\n";
    
    // Insert company data
    echo "Creating company data...\n";
    $stmt = $pdo->prepare("INSERT INTO Company (HoloCardID, CompanyName, CompanyEmail, CompanyContact) VALUES (?, 'Test Corporation', 'contact@testcorp.com', '555-0456')");
    $stmt->execute([$corpCardId]);
    echo "✅ Company data created\n";
    
    echo "\n=== TEST DATA INSERTED SUCCESSFULLY ===\n";
    echo "You should now see cards when you refresh the page.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>
