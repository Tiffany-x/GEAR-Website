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
    
    $sql = "SELECT eventID, title, date_of, time_start, venue, online FROM event;";

           $stmt = $conn->prepare($sql);
if (!$stmt) {
    throw new Exception("Prepare failed: " . $conn->error);
}

if (!$stmt->execute()) {
    throw new Exception("Execute failed: " . $stmt->error);
}
$result = $stmt->get_result();
    if (!$result) {
        throw new Exception("SQL Error: " . $conn->error);
    } elseif ($result->num_rows === 0) {
        throw new Exception("events not found");
    }
    
    $row = $result->fetch_assoc();
    
    // Process the data
    $eventData = [
        'eventID' => $row['eventID'],
        'title' => $row['title'],
        'date' => $row['date_of'],
        'start' => $row['time_start'],
        'venue' => $row['venue'],
        'online' => $row['online'],

    ];

    echo json_encode([
        'status' => 'success',
        'data' => $eventData
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