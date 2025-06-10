<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../database/connection.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['cardId']) || empty($input['cardId'])) {
        throw new Exception('Missing card ID');
    }
    $cardId = intval($input['cardId']);
    // Update fields (add more as needed)
    $fields = [
        'CardType' => $input['cardType'] === 'Corporate' ? 1 : 0,
        'Address' => $input['address'],
        'ContactNo' => $input['contactNo'],
        'Email' => $input['email'],
        'BirthDate' => $input['birthDate']
    ];
    $set = [];
    $params = [];
    foreach ($fields as $k => $v) {
        $set[] = "$k = ?";
        $params[] = $v;
    }
    $params[] = $cardId;
    $sql = 'UPDATE HoloCard SET ' . implode(', ', $set) . ' WHERE HoloCardID = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(200);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
