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
    // Increase GROUP_CONCAT length limit
    $conn->query("SET SESSION group_concat_max_len = 1000000;");
    
    $sql = "SELECT a.articleID,
    a.title,
    a.description,
    a.dateof_pub,
    CONVERT(a.image_path USING utf8mb4) AS image_path,
    GROUP_CONCAT(DISTINCT CONCAT(au.first_name, ' ', au.last_name) SEPARATOR '|') AS authorNames,
    GROUP_CONCAT(DISTINCT au.authorID SEPARATOR ',') AS authorIDs
    FROM article a
    LEFT JOIN article_authors aa ON a.articleID = aa.articleID
    LEFT JOIN author au ON aa.authorID = au.authorID
    GROUP BY a.articleID
    ORDER BY a.dateof_pub DESC
    LIMIT 3";
    
    $result = $conn->query($sql);

    
    if (!$result) {
    die("SQL Error: " . $conn->error);
} elseif ($result->num_rows === 0) {
        throw new Exception("No articles found");
    }
    
    $articles = [];
   while ($row = $result->fetch_assoc()) {
    error_log("Raw image_path from DB: " . $row['image_path']); // Check for corruption
    $row = array_combine(
        array_map('trim', array_keys($row)),
        array_values($row)
    );
        $authorNames = !empty($row['authorNames']) ? explode('|', $row['authorNames']) : [];
        $authorIDs = !empty($row['authorIDs']) ? explode(',', $row['authorIDs']) : [];
        

    $authors = [];
        foreach ($authorIDs as $index => $id) {
            if (isset($authorNames[$index])) {
                $authors[] = [
                    'id' => $id,
                    'name' => $authorNames[$index]
                ];
            }
        }
        
        $articles[] = [
            'id' => $row['articleID'],
            'title' => $row['title'],
            'description' => $row['description'],
            'date' => date('F j, Y', strtotime($row['dateof_pub'])),
            'image' => $row['image_path'],
            'authors' => $authors
        ];
    }

    echo json_encode([
        'status' => 'success',
        'data' => $articles
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