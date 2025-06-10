<?php
// Debug database content
require_once '../database/connection.php';

header('Content-Type: text/plain');

echo "=== DATABASE DEBUG ===\n\n";

try {
    // Check if database exists and is connected
    echo "✅ Database connection successful\n\n";
    
    // Show all tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "📋 Tables in database: " . implode(", ", $tables) . "\n\n";
    
    // Check user table
    if (in_array('user', $tables)) {
        $stmt = $pdo->query("SELECT * FROM user LIMIT 5");
        $users = $stmt->fetchAll();
        echo "👤 Users (first 5):\n";
        print_r($users);
        echo "\n";
    }
    
    // Check HoloCard table
    if (in_array('HoloCard', $tables)) {
        $stmt = $pdo->query("SELECT * FROM HoloCard WHERE isDeleted = FALSE LIMIT 10");
        $cards = $stmt->fetchAll();
        echo "🃏 HoloCards (first 10):\n";
        print_r($cards);
        echo "\n";
    }
    
    // Test the specific query from get_cards.php
    echo "🔍 Testing get_cards query for UID=1:\n";
    $stmt = $pdo->prepare("
        SELECT 
            h.HoloCardID,
            h.CardType,
            h.Address,
            h.ContactNo,
            h.BirthDate,
            h.Email,
            h.QRCode,
            CASE 
                WHEN h.CardType = 0 THEN CONCAT(p.FirstName, ' ', p.LastName)
                ELSE c.CompanyName
            END as CardName,
            CASE 
                WHEN h.CardType = 0 THEN 'Personal'
                ELSE 'Corporate'
            END as CardTypeText
        FROM HoloCard h
        LEFT JOIN Personal p ON h.HoloCardID = p.HoloCardID
        LEFT JOIN Company c ON h.HoloCardID = c.HoloCardID
        WHERE h.UID = ? AND h.isDeleted = FALSE
        ORDER BY h.HoloCardID DESC
    ");
    $stmt->execute([1]);
    $result = $stmt->fetchAll();
    echo "Query result:\n";
    print_r($result);
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>
