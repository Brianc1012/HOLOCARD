<?php
// Script to create the contacts table
require_once 'connection.php';

try {
    // Read the SQL file
    $sql = file_get_contents(__DIR__ . '/create_contacts_table.sql');
    
    // Split the SQL into individual statements
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    // Execute each statement
    foreach ($statements as $statement) {
        if (!empty($statement)) {
            $pdo->exec($statement);
            echo "✓ Executed: " . substr($statement, 0, 50) . "...\n";
        }
    }
    
    echo "\n✅ Contacts table created successfully!\n";
    echo "Table structure:\n";
    echo "- ContactID (Primary Key, Auto-increment)\n";
    echo "- UID (Foreign Key to users table)\n";
    echo "- HoloCardID (Foreign Key to cards table)\n";
    echo "- DateAdded (Timestamp)\n";
    echo "- Unique constraint on (UID, HoloCardID) to prevent duplicates\n";
    
} catch (PDOException $e) {
    echo "❌ Error creating contacts table: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "❌ General error: " . $e->getMessage() . "\n";
}
?>
