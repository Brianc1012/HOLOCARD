<?php
// Simple test to check if API is working
echo "Testing API...\n";

// Test database connection
try {
    require_once 'database/connection.php';
    echo "✅ Database connection successful\n";
    
    // Test if tables exist
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "📋 Tables found: " . implode(", ", $tables) . "\n";
    
    // Test if user table has data
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM user");
    $result = $stmt->fetch();
    echo "👤 Users in database: " . $result['count'] . "\n";
    
    // Test get_cards API
    $_GET['uid'] = 1;
    ob_start();
    include 'api/get_cards.php';
    $output = ob_get_clean();
    echo "📋 get_cards.php output: " . $output . "\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
