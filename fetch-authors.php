<?php
header("Access-Control-Allow-Origin: https://www.gearhub.africa");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

require_once 'connect.php';
$conn->set_charset("utf8mb4");   // Critical for Unicode

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $topicIDs = isset($data['id']) ? $data['id'] : [];   
    $topicIDs = array_filter(array_map('intval', $topicIDs));

    if (!empty($topicIDs)) {
        // Query with topic filtering
        $placeholders = implode(',', array_fill(0, count($topicIDs), '?'));
        $types = str_repeat('i', count($topicIDs)); // 'ii' for two IDs, etc.
        
        $sql = "SELECT 
            a.authorID,
            CONCAT(a.first_name, ' ', a.last_name) AS full_name,
            a.position,
            CONVERT(a.profile_image USING utf8mb4) AS profile_image 
            FROM author a
            JOIN entity_tags at ON a.authorID = at.entityID
            WHERE at.entity_type = 'author' AND at.tagID IN ($placeholders)
            GROUP BY a.first_name ASC;";
        
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        // Bind parameters dynamically
        $stmt->bind_param($types, ...$topicIDs);
    } else {
        // Query without topic filtering
        $sql = "SELECT 
            authorID, 
            LOWER(CONCAT(first_name, ' ', last_name)) AS full_name, 
            profile_image, 
            position FROM author
            ORDER BY first_name ASC;";
        
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
    }

    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }

    $result = $stmt->get_result();
    if (!$result) {
        throw new Exception("SQL Error: " . $conn->error);
    }

    $authors = [];
    while ($row = $result->fetch_assoc()) {
        $authors[] = [
            'id' => $row['authorID'],
            'name' => $row['full_name'],
            'position' => $row['position'],
            'profile' => $row['profile_image'],
        ];
    }

    echo json_encode([
        'status' => 'success',
        'data' => $authors
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>