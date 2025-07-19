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
    $mediaID = (int)$_GET['id']; 
    
    $sql = "SELECT 
        a.title,
        a.link,
        a.description_link,
        a.upload_date,
        GROUP_CONCAT(DISTINCT t.topic_name SEPARATOR ', ') AS topic_names
    FROM media a
    LEFT JOIN entity_tags ar ON a.mediaID = ar.entityID AND ar.entity_type = 'media'
    LEFT JOIN topic t ON ar.tagID = t.topicID 
    WHERE a.mediaID = ?;";

           $stmt = $conn->prepare($sql);
if (!$stmt) {
    throw new Exception("Prepare failed: " . $conn->error);
}
$stmt->bind_param("i", $mediaID);
if (!$stmt->execute()) {
    throw new Exception("Execute failed: " . $stmt->error);
}
$result = $stmt->get_result();
    if (!$result) {
        throw new Exception("SQL Error: " . $conn->error);
    } elseif ($result->num_rows === 0) {
        throw new Exception("media not found");
    }
    
    $row = $result->fetch_assoc();
    
    // Process the data
    $mediaData = [
        'title' => $row['title'],
        'link' => $row['link'],
        'descLink' => $row['description_link'],
        'upload_date' => $row['upload_date'],
        'topics' => !empty($row['topic_names']) ? explode(', ', $row['topic_names']) : []
    ];

    echo json_encode([
        'status' => 'success',
        'data' => $mediaData
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