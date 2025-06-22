<?php
require_once '../database/connection.php';

header('Content-Type: text/plain');

echo "=== USER DATA CHECK ===\n\n";

try {
    $stmt = $pdo->query("SELECT * FROM user WHERE isDeleted = 0");
    $users = $stmt->fetchAll();
    
    foreach ($users as $user) {
        echo "UID: " . $user['UID'] . "\n";
        echo "Username: " . $user['Username'] . "\n";
        echo "Email: " . $user['Email_Address'] . "\n";
        echo "Password: " . $user['Password'] . "\n";
        echo "isDeleted: " . $user['isDeleted'] . "\n";
        echo "---\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
