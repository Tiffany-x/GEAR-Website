<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'connect.php';
$conn->set_charset("utf8mb4");  // Critical for Unicode

try {
    // Increase GROUP_CONCAT length limit
    $conn->query("SET SESSION group_concat_max_len = 1000000;");
    
    $sql = "SELECT 
        CONCAT(a.first_name, ' ', a.last_name) AS full_name,
        a.bio_path,
        a.position,
        a.email,
        a.linkedin,
        CONVERT(a.profile_image USING utf8mb4) AS image_path,
        GROUP_CONCAT(DISTINCT aa.articleID) AS article_ids,
        GROUP_CONCAT(DISTINCT t.topic_name SEPARATOR ', ') AS topic_names
    FROM author a
    LEFT JOIN article_authors aa ON a.authorID = aa.authorID
    LEFT JOIN entity_tags ar ON a.authorID = ar.entityID AND ar.entity_type = 'author'
    LEFT JOIN topic t ON ar.tagID = t.topicID
    WHERE a.authorID = 1
    GROUP BY a.authorID";
    
    $result = $conn->query($sql);

    if (!$result) {
        throw new Exception("SQL Error: " . $conn->error);
    } elseif ($result->num_rows === 0) {
        throw new Exception("Author not found");
    }
    
    $row = $result->fetch_assoc();
    
    // Process the data
    $authorData = [
        'name' => $row['full_name'],
        'about' => $row['bio_path'],
        'position' => $row['position'],
        'image' => $row['image_path'],
        'email' => $row['email'],
        'linkedin' => $row['linkedin'],
        'article_ids' => !empty($row['article_ids']) ? explode(',', $row['article_ids']) : [],
        'topics' => !empty($row['topic_names']) ? explode(', ', $row['topic_names']) : []
    ];

    echo json_encode([
        'status' => 'success',
        'data' => $authorData
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