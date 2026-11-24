<?php
$host = 'localhost';
$usuario = 'aluno';
$senha = 'ceep@1234';
$banco = 'MONITORAMENTO_TARTARUGAS';

try {
    // Cria a conexão usando PDO e define a variável $conexao
    $conexao = new PDO("mysql:host=$host;dbname=$banco;charset=utf8mb4", $usuario, $senha, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $erro) {
    error_log('Turtle Monitor - conexão MySQL: ' . $erro->getMessage());
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Não foi possível conectar ao banco de dados.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
?>