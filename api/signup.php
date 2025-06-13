<?php
header('Content-Type: application/json');
require_once '../database/connection.php';

$name = $_POST['name'] ?? '';
$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

if (!$name || !$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
    exit;
}

try {
    // Check for duplicate email
    $stmt = $pdo->prepare('SELECT UID FROM user WHERE Email_Address = ? AND isDeleted = 0 LIMIT 1');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Email already registered.']);
        exit;
    }

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert new user
    $stmt = $pdo->prepare('INSERT INTO user (Username, Password, Email_Address, isDeleted) VALUES (?, ?, ?, 0)');
    if ($stmt->execute([$name, $hashedPassword, $email])) {
        echo json_encode(['success' => true, 'message' => 'Signup successful!']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Signup failed.']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
