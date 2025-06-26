<?php
/**
 * API Test Script - Tests all endpoints for correct table names and functionality
 * filepath: api/test_api_endpoints.php
 */

header('Content-Type: text/plain; charset=utf-8');

require_once 'connection.php';

echo "🧪 HoloCard API Endpoint Tests\n";
echo "==============================\n\n";

try {
    // Test database connection
    echo "1. Database Connection Test\n";
    echo "   Status: ✅ Connected to database\n\n";

    // Test table existence with correct names
    echo "2. Table Structure Test\n";
    $tables = ['user', 'holocard', 'personal', 'company', 'contacts'];
    
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("DESCRIBE `$table`");
            echo "   ✅ Table '$table' exists\n";
        } catch (PDOException $e) {
            echo "   ❌ Table '$table' missing or inaccessible\n";
        }
    }
    echo "\n";

    // Test sample data queries
    echo "3. Sample Data Queries\n";
    
    // Test holocard table
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM holocard WHERE isDeleted = FALSE");
        $result = $stmt->fetch();
        echo "   ✅ holocard table: {$result['count']} active cards\n";
    } catch (PDOException $e) {
        echo "   ❌ holocard table query failed: " . $e->getMessage() . "\n";
    }

    // Test personal table
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM personal");
        $result = $stmt->fetch();
        echo "   ✅ personal table: {$result['count']} personal records\n";
    } catch (PDOException $e) {
        echo "   ❌ personal table query failed: " . $e->getMessage() . "\n";
    }

    // Test company table
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM company");
        $result = $stmt->fetch();
        echo "   ✅ company table: {$result['count']} company records\n";
    } catch (PDOException $e) {
        echo "   ❌ company table query failed: " . $e->getMessage() . "\n";
    }

    // Test contacts table
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM contacts");
        $result = $stmt->fetch();
        echo "   ✅ contacts table: {$result['count']} contact records\n";
    } catch (PDOException $e) {
        echo "   ❌ contacts table query failed: " . $e->getMessage() . "\n";
    }

    // Test user table
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM user WHERE isDeleted = 0");
        $result = $stmt->fetch();
        echo "   ✅ user table: {$result['count']} active users\n";
    } catch (PDOException $e) {
        echo "   ❌ user table query failed: " . $e->getMessage() . "\n";
    }
    echo "\n";

    // Test complex JOIN query (like get_cards.php)
    echo "4. Complex Query Test (JOIN)\n";
    try {
        $stmt = $pdo->prepare("
            SELECT 
                h.HoloCardID,
                h.CardType,
                h.Email,
                h.ContactNo,
                h.Address,
                p.FirstName,
                p.LastName,
                p.Profession,
                c.CompanyName,
                c.Position
            FROM holocard h
            LEFT JOIN personal p ON h.HoloCardID = p.HoloCardID
            LEFT JOIN company c ON h.HoloCardID = c.HoloCardID
            WHERE h.isDeleted = FALSE
            LIMIT 1
        ");
        $stmt->execute();
        $result = $stmt->fetch();
        
        if ($result) {
            echo "   ✅ Complex JOIN query successful\n";
            echo "   Sample card ID: {$result['HoloCardID']}\n";
        } else {
            echo "   ✅ Complex JOIN query runs (no data found)\n";
        }
    } catch (PDOException $e) {
        echo "   ❌ Complex JOIN query failed: " . $e->getMessage() . "\n";
    }
    echo "\n";

    // Test API file accessibility
    echo "5. API File Accessibility Test\n";
    $apiFiles = [
        'get_cards.php',
        'add_card.php',
        'update_card.php',
        'delete_card.php',
        'get_contacts.php',
        'add_contact.php',
        'delete_contact.php',
        'login.php',
        'signup.php'
    ];

    foreach ($apiFiles as $file) {
        if (file_exists(__DIR__ . '/' . $file)) {
            echo "   ✅ $file exists\n";
        } else {
            echo "   ❌ $file missing\n";
        }
    }
    echo "\n";

    echo "🎉 API Test Complete!\n";
    echo "If all tests show ✅, your API should work correctly.\n";
    echo "If any tests show ❌, please check the database setup or file permissions.\n\n";

    echo "Next steps:\n";
    echo "1. Upload this project to AwardSpace\n";
    echo "2. Set up the database using the SQL files in /database/\n";
    echo "3. Update database/connection.php with AwardSpace database credentials\n";
    echo "4. Test the deployed application\n";

} catch (Exception $e) {
    echo "❌ Test suite failed: " . $e->getMessage() . "\n";
}
?>
