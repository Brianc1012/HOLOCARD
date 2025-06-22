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

require_once '../database/connection.php';

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);
$email = $input['email'] ?? $_POST['email'] ?? '';
$password = $input['password'] ?? $_POST['password'] ?? '';

if (!$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'Missing email or password.']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT UID, Username, Password, Email_Address FROM user WHERE Email_Address = ? AND isDeleted = 0 LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();    if ($user && (password_verify($password, $user['Password']) || $user['Password'] === $password)) {
        // Store user information in session
        $_SESSION['user_id'] = $user['UID'];
        $_SESSION['username'] = $user['Username'];
        $_SESSION['email'] = $user['Email_Address'];
        $_SESSION['logged_in'] = true;
        
        echo json_encode(['success' => true, 'user' => [
            'UID' => $user['UID'],
            'Username' => $user['Username'],
            'Email_Address' => $user['Email_Address']
        ]]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
