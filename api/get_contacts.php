<?php
session_start();

// Handle CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (strpos($origin, 'localhost') !== false || strpos($origin, '127.0.0.1') !== false) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include database connection
require_once '../database/connection.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false, 
        'error' => 'User not logged in'
    ]);
    exit;
}

$currentUID = $_SESSION['user_id'];

try {
    // Get all contacts for the current user with HoloCard details
    $stmt = $pdo->prepare("
        SELECT 
            c.ContactID,
            c.HoloCardID,
            h.CardType,
            h.Address,
            h.ContactNo,
            h.Email,
            p.FirstName,
            p.LastName,
            p.Suffix,
            p.Profession,
            comp.CompanyName,
            comp.ContactPerson_FirstName,
            comp.ContactPerson_LastName,
            comp.Position
        FROM contacts c
        JOIN holocard h ON c.HoloCardID = h.HoloCardID        LEFT JOIN personal p ON h.HoloCardID = p.HoloCardID
        LEFT JOIN company comp ON h.HoloCardID = comp.HoloCardID
        WHERE c.UID = ? AND h.isDeleted = 0
        ORDER BY c.ContactID DESC
    ");
    
    $stmt->execute([$currentUID]);
    $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'contacts' => $contacts,
        'count' => count($contacts)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
