<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Show errors as JSON for debugging (remove in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once '../database/connection.php';

$response = ['success' => false, 'cards' => [], 'error' => 'Unknown error'];

try {
    $uid = isset($_GET['uid']) ? intval($_GET['uid']) : null;
    if (!$uid) {
        throw new Exception('User ID is required');
    }    // Get all cards for the user with detailed information
    $stmt = $pdo->prepare("
        SELECT 
            h.HoloCardID,
            h.CardType,
            h.Address,
            h.ContactNo,
            h.BirthDate,
            h.Email,
            h.QRCode,
            CASE 
                WHEN h.CardType = 0 THEN CONCAT(p.FirstName, ' ', p.LastName)
                ELSE c.CompanyName
            END as CardName,
            CASE 
                WHEN h.CardType = 0 THEN 'Personal'
                ELSE 'Corporate'
            END as CardTypeText,
            -- Personal fields
            p.FirstName,
            p.LastName,
            p.Suffix,
            p.Profession,
            -- Company fields  
            c.CompanyName,
            c.ContactPerson_FirstName,
            c.ContactPerson_LastName,
            c.Position
        FROM HoloCard h
        LEFT JOIN Personal p ON h.HoloCardID = p.HoloCardID
        LEFT JOIN Company c ON h.HoloCardID = c.HoloCardID
        WHERE h.UID = ? AND h.isDeleted = FALSE
        ORDER BY h.HoloCardID DESC
    ");    $stmt->execute([$uid]);
    $cards = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Process and enhance card data for frontend compatibility
    foreach ($cards as &$card) {
        // Convert QR codes to base64 for frontend
        if (isset($card['QRCode']) && $card['QRCode']) {
            $card['QRCode'] = base64_encode($card['QRCode']);
        }
        
        // Add computed fields for compatibility
        if ($card['CardType'] == 0) { // Personal
            $card['ContactPerson'] = trim(($card['ContactPerson_FirstName'] ?? '') . ' ' . ($card['ContactPerson_LastName'] ?? ''));
        } else { // Corporate
            $card['ContactPerson'] = trim(($card['ContactPerson_FirstName'] ?? '') . ' ' . ($card['ContactPerson_LastName'] ?? ''));
        }
        
        // Clean up null values
        foreach ($card as $key => $value) {
            if ($value === null) {
                $card[$key] = '';
            }
        }
    }
    $response['success'] = true;
    $response['cards'] = $cards;
    unset($response['error']);
} catch (Exception $e) {
    http_response_code(200); // Always return 200 so frontend can parse JSON
    $response['error'] = $e->getMessage();
}
echo json_encode($response);