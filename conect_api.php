<?php
// ceepprovas/api/db_connect.php
$servername = "localhost";
$username = "aluno"; 
$password = "ceep@1234"; 
$dbname = "ninhos"; 

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    header('Content-Type: application/json');
    http_response_code(500); 
    echo json_encode([
        'success' => false,
        'message' => 'Falha na conexão com o banco de dados local.'
    ]);
    exit; 
}
$conn->set_charset("utf8mb4");

?>