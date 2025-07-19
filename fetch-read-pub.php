<?php
header("Access-Control-Allow-Origin: https://www.gearhub.africa");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

require_once 'connect.php';
$conn->set_charset("utf8mb4");  // Critical for Unicode

try {
    // Get article ID from request
    $articleId = (int)$_GET['id'];  // Force integer to prevent SQL injection
    

    // Increase GROUP_CONCAT length limit
    $conn->query("SET SESSION group_concat_max_len = 1000000;");
    
    $sql = "SELECT a.articleID, a.title, a.description, a.document_path,
            a.dateof_pub, CONVERT(a.image_path USING utf8mb4) AS image_path,
            GROUP_CONCAT(DISTINCT CONCAT(au.first_name, ' ', au.last_name) SEPARATOR '|') AS authorNames,
            GROUP_CONCAT(DISTINCT au.authorID SEPARATOR ',') AS authorIDs, 
            GROUP_CONCAT(DISTINCT ac.topic_name SEPARATOR '|') AS articleTags
            FROM article a
            LEFT JOIN article_authors aa ON a.articleID = aa.articleID
            LEFT JOIN author au ON aa.authorID = au.authorID
            LEFT JOIN entity_tags ab ON a.articleID = ab.entityID
            LEFT JOIN topic ac ON ab.tagID = ac.topicID
            WHERE a.articleID = ?";

            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $articleId);

    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception("No articles found");
    }
    
    $articles = [];
    while ($row = $result->fetch_assoc()) {
        $row = array_map('trim', $row);
        
        $authorNames = !empty($row['authorNames']) ? explode('|', $row['authorNames']) : [];
        $authorIDs = !empty($row['authorIDs']) ? explode(',', $row['authorIDs']) : [];
        $tags = !empty($row['articleTags']) ? explode('|', $row['articleTags']) : [];

        $authors = array_map(function($id, $name) {
            return ['id' => $id, 'name' => $name];
        }, $authorIDs, $authorNames);
        
        $articles[] = [
            'id' => $row['articleID'],
            'title' => $row['title'],
            'description' => $row['description'],
            'document' => $row['document_path'],
            'date' => date('F j, Y', strtotime($row['dateof_pub'])),
            'image' => $row['image_path'],
            'authors' => $authors,
            'topics' => $tags
        ];
    }

    echo json_encode([
        'status' => 'success',
        'data' => $articles[0] // Return single article (since we queried by ID)
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($stmt)) $stmt->close();
    $conn->close();
}
?>