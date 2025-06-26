<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../database/connection.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['id']) || empty($input['id'])) {
        throw new Exception('Missing card ID');
    }
    $cardId = intval($input['id']);
    // Soft delete: set isDeleted = TRUE
    $stmt = $pdo->prepare('UPDATE holocard SET isDeleted = TRUE WHERE HoloCardID = ?');
    $stmt->execute([$cardId]);
    if ($stmt->rowCount() === 0) {
        throw new Exception('Card not found or already deleted');
    }
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(200);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
