<?php
session_start();

// Handle CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (strpos($origin, 'localhost') !== false || strpos($origin, '127.0.0.1') !== false) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
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

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['contactId'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing contact ID']);
    exit;
}

$contactId = $input['contactId'];

try {
    // First, verify that the contact belongs to the current user
    $verifyStmt = $pdo->prepare("SELECT ContactID FROM contacts WHERE ContactID = ? AND UID = ?");
    $verifyStmt->execute([$contactId, $currentUID]);
    
    if (!$verifyStmt->fetch()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Contact not found or access denied']);
        exit;
    }
    
    // Delete the contact
    $deleteStmt = $pdo->prepare("DELETE FROM contacts WHERE ContactID = ? AND UID = ?");
    $deleteStmt->execute([$contactId, $currentUID]);
    
    if ($deleteStmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Contact deleted successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Failed to delete contact'
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
