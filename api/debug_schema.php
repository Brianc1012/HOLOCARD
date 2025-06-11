<?php
require_once '../database/connection.php';

header('Content-Type: text/plain');

echo "=== DATABASE SCHEMA CHECK ===\n\n";

try {
    echo "Company table structure:\n";
    $stmt = $pdo->query("DESCRIBE Company");
    while ($row = $stmt->fetch()) {
        echo "- " . $row['Field'] . " (" . $row['Type'] . ")\n";
    }
    
    echo "\nPersonal table structure:\n";
    $stmt = $pdo->query("DESCRIBE Personal");
    while ($row = $stmt->fetch()) {
        echo "- " . $row['Field'] . " (" . $row['Type'] . ")\n";
    }
    
    echo "\nHoloCard table structure:\n";
    $stmt = $pdo->query("DESCRIBE HoloCard");
    while ($row = $stmt->fetch()) {
        echo "- " . $row['Field'] . " (" . $row['Type'] . ")\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
