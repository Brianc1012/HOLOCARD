<?php
require_once 'database/connection.php';

header('Content-Type: application/json');

try {
    $stmt = $pdo->prepare("
        SELECT 
            h.HoloCardID,
            h.CardType,
            h.Address,
            h.ContactNo,
            h.Email,
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
            c.ContactPerson_Suffix,
            c.Position
        FROM HoloCard h
        LEFT JOIN Personal p ON h.HoloCardID = p.HoloCardID
        LEFT JOIN Company c ON h.HoloCardID = c.HoloCardID
        WHERE h.HoloCardID = ?
    ");
      $stmt->execute(['42']);
    $card = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($card) {
        // Build ContactPerson field only for Corporate cards
        if ($card['CardType'] == 1) { // Corporate only
            $card['ContactPerson'] = trim(($card['ContactPerson_FirstName'] ?? '') . ' ' . ($card['ContactPerson_LastName'] ?? ''));
            // For Corporate cards, also map the ContactPerson fields to more accessible names
            $card['firstName'] = $card['ContactPerson_FirstName'] ?? '';
            $card['lastName'] = $card['ContactPerson_LastName'] ?? '';
            $card['suffix'] = $card['ContactPerson_Suffix'] ?? '';
            $card['middleName'] = ''; // Not available in database
        } else { // Personal cards don't have contact person
            $card['ContactPerson'] = '';
            // For Personal cards, use the Personal table fields
            $card['firstName'] = $card['FirstName'] ?? '';
            $card['lastName'] = $card['LastName'] ?? '';
            $card['suffix'] = $card['Suffix'] ?? '';
            $card['middleName'] = ''; // Not available in Personal table either
        }
        
        echo json_encode($card, JSON_PRETTY_PRINT);
    } else {
        echo json_encode(['error' => 'Card not found']);
    }
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
