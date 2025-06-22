<?php
require_once 'database/connection.php';

try {
    // Show all tables
    $stmt = $pdo->query('SHOW TABLES');
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables in database: " . implode(', ', $tables) . "\n\n";
    
    // Check if contacts table exists and its structure
    if (in_array('contacts', $tables)) {
        echo "Contacts table structure:\n";
        $stmt = $pdo->query('DESCRIBE contacts');
        while ($row = $stmt->fetch()) {
            echo $row['Field'] . " - " . $row['Type'] . " - " . $row['Key'] . "\n";
        }
        echo "\n";
    } else {
        echo "Contacts table does not exist!\n\n";
    }
      // Check if holocard table exists and its structure
    if (in_array('holocard', $tables)) {
        echo "Holocard table structure:\n";
        $stmt = $pdo->query('DESCRIBE holocard');
        while ($row = $stmt->fetch()) {
            echo $row['Field'] . " - " . $row['Type'] . " - " . $row['Key'] . "\n";
        }
        echo "\n";
    } else {
        echo "Holocard table does not exist!\n\n";
    }
    
    // Check user table
    if (in_array('user', $tables)) {
        echo "User table structure:\n";
        $stmt = $pdo->query('DESCRIBE user');
        while ($row = $stmt->fetch()) {
            echo $row['Field'] . " - " . $row['Type'] . " - " . $row['Key'] . "\n";
        }
    } else {
        echo "User table does not exist!\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
