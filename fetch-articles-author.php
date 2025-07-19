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
    // Validate authorID parameter
    if (!isset($_GET['authorID'])) {
        throw new Exception("authorID parameter is required");
    }
    $authorID = (int)$_GET['authorID'];
    if ($authorID <= 0) {
        throw new Exception("Invalid authorID");
    }

    // Increase GROUP_CONCAT length limit
    $conn->query("SET SESSION group_concat_max_len = 1000000;");
    
    $sql = "SELECT 
        a.articleID,
        a.title,
        a.dateof_pub,
        CONVERT(a.image_path USING utf8mb4) AS image_path
    FROM article a
    JOIN article_authors aa ON a.articleID = aa.articleID
    WHERE aa.authorID = ?
    GROUP BY a.articleID
    ORDER BY a.dateof_pub DESC
    LIMIT 4";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("i", $authorID);
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception("No articles found for this author");
    }
    
    $articles = [];
    while ($row = $result->fetch_assoc()) {
        error_log("Raw image_path from DB: " . $row['image_path']); // Check for corruption
        
        // Clean up the data
        $row = array_map('trim', $row);
        
        $articles[] = [
            'id' => $row['articleID'],
            'title' => $row['title'],
            'date' => date('F j, Y', strtotime($row['dateof_pub'])),
            'image' => $row['image_path']
        ];
    }

    echo json_encode([
        'status' => 'success',
        'data' => $articles
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    http_response_code(400);
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