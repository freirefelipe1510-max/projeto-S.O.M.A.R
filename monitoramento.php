
<?php

header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/conexao.php";

try {

    $sql = "
        SELECT
            id_ninho,
            temperatura,
            umidade,
            data_hora
        FROM ninhos_tartarugas
        ORDER BY data_hora DESC, id_ninho DESC
        LIMIT 30
    ";

    $consulta = $conexao->prepare($sql);
    $consulta->execute();

    $dados = $consulta->fetchAll();

    echo json_encode([
        "sucesso" => true,
        "quantidade" => count($dados),
        "dados" => $dados
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $erro) {

    error_log($erro->getMessage());

    http_response_code(500);

    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Erro ao consultar o banco."
    ], JSON_UNESCAPED_UNICODE);

}
?>