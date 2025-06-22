<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../database/connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Debug: log input to file
    file_put_contents(__DIR__ . '/add_card_debug.log', date('c') . "\n" . print_r($input, true) . "\n", FILE_APPEND);
      // Validate required fields
    $required_fields = ['cardType', 'address', 'contactNo', 'email', 'qrCode', 'uid'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    // Verify user exists (fix table name)
    $stmt = $pdo->prepare("SELECT UID FROM user WHERE UID = ? AND isDeleted = FALSE");
    $stmt->execute([$input['uid']]);
    if (!$stmt->fetch()) {
        throw new Exception("Invalid user ID");
    }
    
    // Start transaction
    $pdo->beginTransaction();
    
    // Insert into HoloCard table
    $stmt = $pdo->prepare("        INSERT INTO HoloCard (CardType, Address, ContactNo, Email, QRCode, UID) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
      $stmt->execute([
        $input['cardType'] === 'Corporate' ? 1 : 0,
        $input['address'],
        $input['contactNo'],
        $input['email'],
        base64_decode($input['qrCode']), // Assuming QR code is base64 encoded
        $input['uid']
    ]);
    
    $holocardId = $pdo->lastInsertId();
    
    // Insert into specific table based on card type
    if ($input['cardType'] === 'Personal') {        $stmt = $pdo->prepare("
            INSERT INTO Personal (HoloCardID, FirstName, LastName, Suffix, Profession, ProfilePicture) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $holocardId,
            $input['firstName'],
            $input['lastName'],
            $input['suffix'] ?? null,
            $input['profession'] ?? null,
            isset($input['profilePicture']) ? base64_decode($input['profilePicture']) : null
        ]);
    } else {
        $stmt = $pdo->prepare("
            INSERT INTO Company (HoloCardID, CompanyName, CompanyLogo, ContactPerson_FirstName, ContactPerson_LastName, ContactPerson_Suffix, Position) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $holocardId,
            $input['companyName'],
            isset($input['companyLogo']) ? base64_decode($input['companyLogo']) : null,
            $input['contactFirstName'],
            $input['contactLastName'],
            $input['contactSuffix'] ?? null,
            $input['position'] ?? null
        ]);
    }
    
    // Commit transaction
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Card added successfully',
        'holocardId' => $holocardId
    ]);
    
} catch (Exception $e) {
    // Rollback transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollback();
    }
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>