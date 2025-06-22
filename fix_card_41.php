<?php
require_once 'database/connection.php';

header('Content-Type: text/plain');

try {
    // First, check what exists for card 41
    echo "=== CHECKING CARD 41 DATA ===\n\n";
    
    $stmt = $pdo->prepare("SELECT * FROM HoloCard WHERE HoloCardID = 41");
    $stmt->execute();
    $holocard = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($holocard) {
        echo "HoloCard data:\n";
        foreach ($holocard as $key => $value) {
            echo "  $key: " . ($value ?? 'NULL') . "\n";
        }
    } else {
        echo "No HoloCard found with ID 41\n";
        exit;
    }
    
    $stmt = $pdo->prepare("SELECT * FROM Company WHERE HoloCardID = 41");
    $stmt->execute();
    $company = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($company) {
        echo "\nCompany data:\n";
        foreach ($company as $key => $value) {
            echo "  $key: " . ($value ?? 'NULL') . "\n";
        }
        
        // Check if contact person fields are empty
        if (empty($company['ContactPerson_FirstName']) && empty($company['ContactPerson_LastName'])) {
            echo "\n=== CONTACT PERSON FIELDS ARE EMPTY ===\n";
            echo "Updating with sample contact person data...\n";
            
            $updateStmt = $pdo->prepare("
                UPDATE Company 
                SET ContactPerson_FirstName = ?, 
                    ContactPerson_LastName = ?, 
                    ContactPerson_Suffix = ?
                WHERE HoloCardID = 41
            ");
            
            $updateStmt->execute(['John', 'Doe', 'Jr.']);
            
            echo "Updated contact person: John Doe Jr.\n";
            
            // Verify the update
            $stmt = $pdo->prepare("SELECT ContactPerson_FirstName, ContactPerson_LastName, ContactPerson_Suffix FROM Company WHERE HoloCardID = 41");
            $stmt->execute();
            $updated = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo "\nVerified update:\n";
            foreach ($updated as $key => $value) {
                echo "  $key: " . ($value ?? 'NULL') . "\n";
            }
        } else {
            echo "\nContact person fields already have data:\n";
            echo "  ContactPerson_FirstName: " . ($company['ContactPerson_FirstName'] ?? 'NULL') . "\n";
            echo "  ContactPerson_LastName: " . ($company['ContactPerson_LastName'] ?? 'NULL') . "\n";
            echo "  ContactPerson_Suffix: " . ($company['ContactPerson_Suffix'] ?? 'NULL') . "\n";
        }
    } else {
        echo "\nNo Company data found for HoloCardID 41\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
