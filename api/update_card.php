<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../database/connection.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    error_log('Update card input: ' . print_r($input, true));
    
    if (!isset($input['cardId']) || empty($input['cardId'])) {
        throw new Exception('Missing card ID');
    }
    $cardId = intval($input['cardId']);
    
    // Start transaction
    $pdo->beginTransaction();
      // Update HoloCard table
    $cardType = $input['cardType'] === 'Corporate' ? 1 : 0;
    $stmt = $pdo->prepare("UPDATE holocard SET CardType = ?, Address = ?, ContactNo = ?, Email = ? WHERE HoloCardID = ?");
    $stmt->execute([
        $cardType,
        $input['address'] ?? '',
        $input['contactNo'] ?? '',
        $input['email'] ?? '',
        $cardId
    ]);
    
    if ($cardType === 0) {
        // Personal card - update Personal table
        // First check if personal record exists
        $stmt = $pdo->prepare("SELECT * FROM personal WHERE HoloCardID = ?");
        $stmt->execute([$cardId]);
        $personalExists = $stmt->fetch();
          if ($personalExists) {
            // Update existing personal record
            $stmt = $pdo->prepare("UPDATE personal SET FirstName = ?, LastName = ?, MiddleName = ?, Suffix = ?, Profession = ? WHERE HoloCardID = ?");
            $stmt->execute([
                $input['firstName'] ?? '',
                $input['lastName'] ?? '',
                $input['middleName'] ?? '',
                $input['suffix'] ?? '',
                $input['profession'] ?? '',
                $cardId
            ]);
        } else {
            // Insert new personal record
            $stmt = $pdo->prepare("INSERT INTO personal (HoloCardID, FirstName, LastName, MiddleName, Suffix, Profession) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $cardId,
                $input['firstName'] ?? '',
                $input['lastName'] ?? '',
                $input['middleName'] ?? '',
                $input['suffix'] ?? '',
                $input['profession'] ?? ''
            ]);
        }
        
        // Remove any company record if it exists
        $stmt = $pdo->prepare("DELETE FROM company WHERE HoloCardID = ?");
        $stmt->execute([$cardId]);
        
    } else {
        // Corporate card - update Company table
        // First check if company record exists
        $stmt = $pdo->prepare("SELECT * FROM company WHERE HoloCardID = ?");
        $stmt->execute([$cardId]);
        $companyExists = $stmt->fetch();
          if ($companyExists) {
            // Update existing company record
            $stmt = $pdo->prepare("UPDATE company SET CompanyName = ?, CompanyEmail = ?, CompanyContact = ?, Position = ? WHERE HoloCardID = ?");
            $stmt->execute([
                $input['company'] ?? '',
                $input['email'] ?? '',
                $input['contactNo'] ?? '',
                $input['position'] ?? '',
                $cardId
            ]);
        } else {
            // Insert new company record
            $stmt = $pdo->prepare("INSERT INTO company (HoloCardID, CompanyName, CompanyEmail, CompanyContact, Position) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $cardId,
                $input['company'] ?? '',
                $input['email'] ?? '',
                $input['contactNo'] ?? '',
                $input['position'] ?? ''
            ]);
        }
        
        // Remove any personal record if it exists
        $stmt = $pdo->prepare("DELETE FROM personal WHERE HoloCardID = ?");
        $stmt->execute([$cardId]);
    }
    
    // --- Handle profile image/company logo update ---
    if ($cardType === 0 && !empty($input['profileImage'])) {
        // Personal card: update ProfilePicture
        $base64 = $input['profileImage'];
        if (strpos($base64, 'base64,') !== false) {
            $base64 = explode('base64,', $base64, 2)[1];
        }
        $imageData = base64_decode($base64);
        $stmt = $pdo->prepare("UPDATE personal SET ProfilePicture = ? WHERE HoloCardID = ?");
        $stmt->execute([$imageData, $cardId]);
    } elseif ($cardType === 1 && !empty($input['profileImage'])) {
        // Corporate card: update CompanyLogo
        $base64 = $input['profileImage'];
        if (strpos($base64, 'base64,') !== false) {
            $base64 = explode('base64,', $base64, 2)[1];
        }
        $imageData = base64_decode($base64);
        $stmt = $pdo->prepare("UPDATE company SET CompanyLogo = ? WHERE HoloCardID = ?");
        $stmt->execute([$imageData, $cardId]);
    }
    
    // Commit transaction
    $pdo->commit();
    
    error_log('Update successful for card ID: ' . $cardId);
    echo json_encode(['success' => true, 'message' => 'Card updated successfully']);
    
} catch (Exception $e) {
    // Rollback transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollback();
    }
    error_log('Update card error: ' . $e->getMessage());
    http_response_code(200);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
