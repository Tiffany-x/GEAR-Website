<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require 'connect.php';


$sql = "SELECT articleID, title, description, dateof_pub, image_path FROM article"; // Remove WHERE clause
$query = mysqli_query($con, $sql);
$response = array('success' => false, 'data' => array());
$product = array();
$row_count = 0;

if ($query -> num_rows > 0) {
    while ($row = mysqli_fetch_assoc($query)) {
        $event = array(
            'title' => $row['title'],
            'description' => $row['description'],
            'dateof_pub' => $row['dateof_pub'], // Use correct column name in array
            'image_path' => $row['image_path'],
        );
        echo 
        
        $response['data'][] = $event;
        $row_count++;
        if ($row_count == 3) {
            exit();
        }
    }
    $response['success'] = true;
} else {
    $response['error'] = 'Failed to execute query: ' . mysqli_error($con);
}

mysqli_close($con);
echo json_encode($response);
?>

