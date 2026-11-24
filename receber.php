
<?php

header("Content-Type: application/json; charset=utf-8");

require_once "../conexao.php";

// Token compartilhado com o ESP32
$TOKEN = "TROQUE_POR_UMA_CHAVE_SECRETA";

try {

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405);
        throw new Exception("Método não permitido.");
    }

    $dados = json_decode(
        file_get_contents("php://input"),
        true
    );

    if (!is_array($dados)) {
        http_response_code(400);
        throw new Exception("Dados inválidos.");
    }

    if (
        !isset($dados["token"]) ||
        !hash_equals($TOKEN, (string)$dados["token"])
    ) {
        http_response_code(401);
        throw new Exception("Acesso não autorizado.");
    }

    $temperatura = $dados["temperatura"] ?? null;
    $umidade = $dados["umidade"] ?? null;
    $latitude = $dados["latitude"] ?? null;
    $longitude = $dados["longitude"] ?? null;

    // Validar temperatura
    if (
        $temperatura !== null &&
        (!is_numeric($temperatura) ||
        $temperatura < -55 ||
        $temperatura > 125)
    ) {
        throw new Exception("Temperatura inválida.");
    }

    // Validar umidade
    if (
        $umidade !== null &&
        (!is_numeric($umidade) ||
        $umidade < 0 ||
        $umidade > 100)
    ) {
        throw new Exception("Umidade inválida.");
    }

    // Validar coordenadas
    if (
        $latitude !== null &&
        (!is_numeric($latitude) ||
        $latitude < -90 ||
        $latitude > 90)
    ) {
        throw new Exception("Latitude inválida.");
    }

    if (
        $longitude !== null &&
        (!is_numeric($longitude) ||
        $longitude < -180 ||
        $longitude > 180)
    ) {
        throw new Exception("Longitude inválida.");
    }

    $sql = "
        INSERT INTO ninhos_tartarugas
        (temperatura, umidade, latitude, longitude)
        VALUES
        (:temperatura, :umidade, :latitude, :longitude)
    ";

    $consulta = $conexao->prepare($sql);

    $consulta->execute([
        ":temperatura" => $temperatura,
        ":umidade" => $umidade,
        ":latitude" => $latitude,
        ":longitude" => $longitude
    ]);

    echo json_encode([
        "sucesso" => true,
        "mensagem" => "Leitura armazenada com sucesso.",
        "id_ninho" => $conexao->lastInsertId()
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $erro) {

    if (http_response_code() < 400) {
        http_response_code(400);
    }

    error_log($erro->getMessage());

    echo json_encode([
        "sucesso" => false,
        "mensagem" => $erro->getMessage()
    ], JSON_UNESCAPED_UNICODE);

}
?>