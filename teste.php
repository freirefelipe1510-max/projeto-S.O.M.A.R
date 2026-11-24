<?php
// Define o fuso horário oficial do Brasil para sincronizar a hora correta
date_default_timezone_set('America/Sao_Paulo');

// Este arquivo fica no servidor final (com Tailscale) e grava no BD definitivo
$servername = "localhost"; // ou o IP do banco do servidor final
$username = "aluno";       
$password = "ceep@1234";           
$dbname = "MONITORAMENTO_TARTARUGAS"; 

$conn = new mysqli($servername, $username, $password, $dbname);
$conn->set_charset("utf8");

if ($conn->connect_error) {
    die("Falha na ligação no servidor final: " . $conn->connect_error);
}

$colunas = array("data_hora");
// Utiliza a função date() do PHP sincronizada com o fuso brasileiro para garantir a hora exata
$valores = array("'" . date('Y-m-d H:i:s') . "'");

if (isset($_POST['temperatura']) && $_POST['temperatura'] !== '') {
    $colunas[] = "temperatura";
    $valores[] = "'" . $conn->real_escape_string($_POST['temperatura']) . "'";
}

if (isset($_POST['umidade']) && $_POST['umidade'] !== '') {
    $colunas[] = "umidade";
    $valores[] = "'" . $conn->real_escape_string($_POST['umidade']) . "'";
}

if (isset($_POST['latitude']) && $_POST['latitude'] !== '') {
    $colunas[] = "latitude";
    $valores[] = "'" . $conn->real_escape_string($_POST['latitude']) . "'";
}

if (isset($_POST['longitude']) && $_POST['longitude'] !== '') {
    $colunas[] = "longitude";
    $valores[] = "'" . $conn->real_escape_string($_POST['longitude']) . "'";
}

if (count($colunas) > 1) {
    $sqlColunas = implode(", ", $colunas);
    $sqlValores = implode(", ", $valores);
    $sql = "INSERT INTO ninhos_tartarugas ($sqlColunas) VALUES ($sqlValores)";

    if ($conn->query($sql) === TRUE) {
        echo "Gravado com sucesso no servidor final!";
    } else {
        echo "Erro ao gravar no BD final: " . $conn->error;
    }
} else {
    echo "Erro: Nenhum dado válido recebido no servidor final.";
}

$conn->close();
?>