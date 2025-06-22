<?php
require_once '../database/connection.php';

header('Content-Type: text/plain');

echo "=== CREATE TEST CARD FOR USER 2 ===\n\n";

try {
    // Insert a test HoloCard for user 2
    echo "Creating test HoloCard for user 2...\n";
    $stmt = $pdo->prepare("INSERT INTO HoloCard (UID, CardType, Address, ContactNo, Email, isDeleted) VALUES (2, 0, '789 Another St', '555-0789', 'jane.smith@example.com', FALSE)");
    $stmt->execute();
    $cardId = $pdo->lastInsertId();
    echo "✅ HoloCard created with ID: $cardId\n";
    
    // Insert personal data for the card
    echo "Creating personal data...\n";
    $stmt = $pdo->prepare("INSERT INTO Personal (HoloCardID, FirstName, LastName, Suffix) VALUES (?, 'Jane', 'Smith', '')");
    $stmt->execute([$cardId]);
    echo "✅ Personal data created\n";
    
    echo "\n=== CARD CREATED FOR TESTING ===\n";
    echo "Card ID: $cardId (owned by user 2)\n";
    echo "Now user 1 can add this card to their contacts.\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
