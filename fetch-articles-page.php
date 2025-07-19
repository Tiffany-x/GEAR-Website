<?php
header("Access-Control-Allow-Origin: https://www.gearhub.africa");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

require_once 'connect.php';
$conn->set_charset("utf8mb4");

try {
    // Get parameters from both GET and POST
    $data = json_decode(file_get_contents('php://input'), true);
    
    $topicIDs = isset($_GET['topic_ids']) ? (array)$_GET['topic_ids'] : (isset($data['id']) ? (array)$data['id'] : []);
    $searchTerm = isset($_GET['search']) ? $_GET['search'] : (isset($data['search']) ? $data['search'] : '');
    
    $page = max(1, intval($_GET['page'] ?? $data['page'] ?? 1));
    $perPage = max(1, intval($_GET['per_page'] ?? $data['per_page'] ?? 10));
    $offset = ($page - 1) * $perPage;

    // Base query parts
    $select = "SELECT a.articleID, a.title, a.description, a.dateof_pub, CONVERT(a.image_path USING utf8mb4) AS image_path";
    $from = " FROM article a";
    $where = " WHERE 1=1";
    $groupBy = "";
    $orderBy = " ORDER BY a.dateof_pub DESC";
    $limit = " LIMIT ?, ?";
    
    $params = [];
    $types = "";
    
    // Handle topic filtering
    if (!empty($topicIDs)) {
        $topicIDs = array_filter(array_map('intval', $topicIDs));
        if (!empty($topicIDs)) {
            $from .= " JOIN entity_tags at ON a.articleID = at.entityID";
            $where .= " AND at.entity_type = 'article' AND at.tagID IN (" . 
                     implode(',', array_fill(0, count($topicIDs), '?')) . ")";
            $groupBy = " GROUP BY a.articleID";
            $params = array_merge($params, $topicIDs);
            $types .= str_repeat('i', count($topicIDs));
        }
    }
    
    // Handle search term filtering
    if (!empty($searchTerm)) {
        $where .= " AND (a.title LIKE ?)";
        $searchParam = "%" . $conn->real_escape_string($searchTerm) . "%";
        $params = array_merge($params, [$searchParam]);
        $types .= "s";
    }
    
    // Always add pagination parameters
    $params = array_merge($params, [$offset, $perPage]);
    $types .= "ii";
    
    // Build main query
    $sql = $select . $from . $where . $groupBy . $orderBy . $limit;
    
    // Debug output (remove in production)
    error_log("SQL: " . $sql);
    error_log("Types: " . $types);
    error_log("Params: " . print_r($params, true));
    
    // Prepare and execute main query
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    // Bind parameters only if we have them
    if ($types !== "") {
        if (!$stmt->bind_param($types, ...$params)) {
            throw new Exception("Bind failed: " . $stmt->error);
        }
    }
    
    // Build count query (without LIMIT)
    $countSql = "SELECT COUNT(DISTINCT a.articleID) as total_count" . $from . $where;
    
    // Prepare count statement
    $countStmt = $conn->prepare($countSql);
    if (!$countStmt) {
        throw new Exception("Prepare failed for count query: " . $conn->error);
    }
    
    // For count query, we remove the last 2 pagination params
    $countParams = array_slice($params, 0, count($params) - 2);
    $countTypes = substr($types, 0, -2);
    
    if ($countTypes !== "") {
        if (!$countStmt->bind_param($countTypes, ...$countParams)) {
            throw new Exception("Count bind failed: " . $countStmt->error);
        }
    }
    
    // Execute count query first
    if (!$countStmt->execute()) {
        throw new Exception("Count query execute failed: " . $countStmt->error);
    }
    $countResult = $countStmt->get_result();
    $totalCount = $countResult->fetch_assoc()['total_count'];
    $countStmt->close();
    
    // Execute main query
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    if (!$result) {
        throw new Exception("SQL Error: " . $conn->error);
    }
    
    $articles = [];
    while ($row = $result->fetch_assoc()) {
        $articles[] = [
            'id' => $row['articleID'],
            'title' => $row['title'],
            'description' => $row['description'],
            'date' => $row['dateof_pub'],
            'image' => $row['image_path']
        ];
    }
    
    $fetchedCount = count($articles);
    
    echo json_encode([
        'status' => 'success',
        'data' => [
            'articles' => $articles,
            'count' => [
                'total' => (int)$totalCount,
                'fetched' => $fetchedCount
            ]
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'debug' => [
            'sql' => $sql ?? null,
            'types' => $types ?? null,
            'params' => $params ?? null
        ]
    ], JSON_PRETTY_PRINT);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>