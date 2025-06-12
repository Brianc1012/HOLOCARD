<?php
function getImageMimeType($imageData) {
    $finfo = finfo_open();
    $mimeType = finfo_buffer($finfo, $imageData, FILEINFO_MIME_TYPE);
    finfo_close($finfo);
    return $mimeType;
}

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
    $cardId = isset($_GET['id']) ? intval($_GET['id']) : null;
    
    if (!$uid && !$cardId) {
        throw new Exception('User ID or Card ID is required');
    }

    // Base query for card information
    $baseQuery = "
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
            p.ProfilePicture,
            -- Company fields  
            c.CompanyName,
            c.ContactPerson_FirstName,
            c.ContactPerson_LastName,
            c.Position,
            c.CompanyLogo
        FROM HoloCard h
        LEFT JOIN Personal p ON h.HoloCardID = p.HoloCardID
        LEFT JOIN Company c ON h.HoloCardID = c.HoloCardID
        WHERE h.isDeleted = FALSE
    ";
    
    if ($cardId) {
        // Fetch specific card by ID (for AR scanner)
        $stmt = $pdo->prepare($baseQuery . " AND h.HoloCardID = ?");
        $stmt->execute([$cardId]);
    } else {
        // Fetch all cards for user (for dashboard)
        $stmt = $pdo->prepare($baseQuery . " AND h.UID = ? ORDER BY h.HoloCardID DESC");
        $stmt->execute([$uid]);
    }    $cards = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Debug log: Output fetched DB rows to error_log
    error_log('[API get_cards.php] DB rows fetched: ' . print_r($cards, true));
    
    // If fetching by card ID, return single card object instead of array
    if ($cardId) {
        if (empty($cards)) {
            throw new Exception('Card not found');
        }
        $card = $cards[0];
        
        // Process single card
        if (isset($card['QRCode']) && $card['QRCode']) {
            $card['QRCode'] = base64_encode($card['QRCode']);
        }
        
        // Add profile picture or company logo as base64 data URL
        if ($card['CardType'] == 0 && isset($card['ProfilePicture']) && $card['ProfilePicture']) {
            $mime = getImageMimeType($card['ProfilePicture']);
            $card['ProfilePicture'] = 'data:' . $mime . ';base64,' . base64_encode($card['ProfilePicture']);
            $card['profileImage'] = $card['ProfilePicture'];
        } elseif ($card['CardType'] == 1 && isset($card['CompanyLogo']) && $card['CompanyLogo']) {
            $mime = getImageMimeType($card['CompanyLogo']);
            $card['CompanyLogo'] = 'data:' . $mime . ';base64,' . base64_encode($card['CompanyLogo']);
            $card['profileImage'] = $card['CompanyLogo'];
        } else {
            $card['profileImage'] = '';
        }
        
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
        
        $response['success'] = true;
        $response['card'] = $card; // Single card for ID lookup
        unset($response['cards']);
        unset($response['error']);
    } else {
        // Process multiple cards for user
        foreach ($cards as &$card) {
            // Convert QR codes to base64 for frontend
            if (isset($card['QRCode']) && $card['QRCode']) {
                $card['QRCode'] = base64_encode($card['QRCode']);
            }
            
            // Add profile picture or company logo as base64 data URL
            if ($card['CardType'] == 0 && isset($card['ProfilePicture']) && $card['ProfilePicture']) {
                $mime = getImageMimeType($card['ProfilePicture']);
                $card['ProfilePicture'] = 'data:' . $mime . ';base64,' . base64_encode($card['ProfilePicture']);
                $card['profileImage'] = $card['ProfilePicture'];
            } elseif ($card['CardType'] == 1 && isset($card['CompanyLogo']) && $card['CompanyLogo']) {
                $mime = getImageMimeType($card['CompanyLogo']);
                $card['CompanyLogo'] = 'data:' . $mime . ';base64,' . base64_encode($card['CompanyLogo']);
                $card['profileImage'] = $card['CompanyLogo'];
            } else {
                $card['profileImage'] = '';
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
    }

    // Output fetched card(s) as part of the JSON response for debugging
    $response['debug_fetched'] = $cardId ? $card : $cards;
} catch (Exception $e) {
    http_response_code(200); // Always return 200 so frontend can parse JSON
    $response['error'] = $e->getMessage();
}
echo json_encode($response);