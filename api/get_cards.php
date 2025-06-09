<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once '../database/connection.php';

try {
    $uid = $_GET['uid'] ?? null;
    
    if (!$uid) {
        throw new Exception('User ID is required');
    }
    
    // Get all cards for the user
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
            END as CardTypeText
        FROM HoloCard h
        LEFT JOIN Personal p ON h.HoloCardID = p.HoloCardID
        LEFT JOIN Company c ON h.HoloCardID = c.HoloCardID
        WHERE h.UID = ? AND h.isDeleted = FALSE
        ORDER BY h.HoloCardID DESC
    ");
    
    $stmt->execute([$uid]);
    $cards = $stmt->fetchAll();
    
    // Convert QR codes to base64 for frontend
    foreach ($cards as &$card) {
        if ($card['QRCode']) {
            $card['QRCode'] = base64_encode($card['QRCode']);
        }
    }
    
    echo json_encode([
        'success' => true,
        'cards' => $cards
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>