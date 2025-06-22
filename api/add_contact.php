<?php
// add_contact.php - API endpoint to add a contact
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

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

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
    // Debug: Log session contents
    error_log("Session contents: " . print_r($_SESSION, true));
    
    http_response_code(401);
    echo json_encode([
        'success' => false, 
        'error' => 'User not logged in',
        'debug' => 'Session user_id not found',
        'session_data' => $_SESSION
    ]);
    exit;
}

$currentUID = $_SESSION['user_id'];

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['holocardId'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing HoloCard ID']);
    exit;
}

$holocardId = $input['holocardId'];

try {    // First, verify that the HoloCard exists
    $cardCheckStmt = $pdo->prepare("SELECT HoloCardID FROM holocard WHERE HoloCardID = ?");
    $cardCheckStmt->execute([$holocardId]);
    
    if (!$cardCheckStmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'HoloCard not found']);
        exit;
    }
    
    // Check if contact already exists (prevent duplicates)
    $duplicateCheckStmt = $pdo->prepare("SELECT ContactID FROM contacts WHERE UID = ? AND HoloCardID = ?");
    $duplicateCheckStmt->execute([$currentUID, $holocardId]);
    
    if ($duplicateCheckStmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Contact already exists in your contacts list', 'duplicate' => true]);
        exit;
    }
      // Prevent users from adding their own cards to contacts
    $ownCardCheckStmt = $pdo->prepare("SELECT HoloCardID FROM holocard WHERE HoloCardID = ? AND UID = ?");
    $ownCardCheckStmt->execute([$holocardId, $currentUID]);
    
    if ($ownCardCheckStmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Cannot add your own card to contacts']);
        exit;
    }
    
    // Insert new contact
    $insertStmt = $pdo->prepare("INSERT INTO contacts (UID, HoloCardID) VALUES (?, ?)");
    $insertStmt->execute([$currentUID, $holocardId]);
    
    $contactId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true, 
        'message' => 'Contact added successfully',
        'contactId' => $contactId
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in add_contact.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error occurred']);
} catch (Exception $e) {
    error_log("General error in add_contact.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}
?>
