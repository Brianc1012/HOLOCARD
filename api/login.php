<?php
header('Content-Type: application/json');
require_once '../database/connection.php';

$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

if (!$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'Missing email or password.']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT UID, Username, Password, Email_Address FROM user WHERE Email_Address = ? AND isDeleted = 0 LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['Password'])) {
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
