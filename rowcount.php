<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// fetch-articles.php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

require_once 'connect.php';
$conn->set_charset("utf8mb4");  // Critical for Unicode

try {
    $sql = "SELECT COUNT(*) AS total_rows FROM article;";
    
    $result = $conn->query($sql);
    
    if (!$result) {
    die("SQL Error: " . $conn->error);
} elseif ($result->num_rows === 0) {
        throw new Exception("No articles found");
    }

    $row = $result->fetch_assoc();
    echo json_encode([
        'status' => 'success',
        'data' => $row
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
} finally {
    $conn->close();
}
?>