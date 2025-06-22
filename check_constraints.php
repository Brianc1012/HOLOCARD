<?php
require_once 'database/connection.php';

try {
    // Check foreign key constraints on contacts table
    $stmt = $pdo->query("
        SELECT 
            CONSTRAINT_NAME,
            COLUMN_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_NAME = 'contacts' 
        AND TABLE_SCHEMA = 'holocard_db'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    ");
    
    echo "Foreign key constraints on contacts table:\n";
    while ($row = $stmt->fetch()) {
        echo "Constraint: " . $row['CONSTRAINT_NAME'] . "\n";
        echo "Column: " . $row['COLUMN_NAME'] . "\n";
        echo "References: " . $row['REFERENCED_TABLE_NAME'] . "." . $row['REFERENCED_COLUMN_NAME'] . "\n\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
