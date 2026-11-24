<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

require_once __DIR__ . '/conexao.php';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Retorna todos os registros incluindo latitude e longitude, mais recentes primeiro.
        $sql = 'SELECT id_registro, temperatura, umidade, latitude, longitude, data_hora
                FROM ninhos_tartarugas
                ORDER BY data_hora DESC, id_registro DESC';
        
        $consulta = $conexao->query($sql);
        $dados = $consulta->fetchAll();

        foreach ($dados as &$linha) {
            $linha['id_registro'] = (int) $linha['id_registro'];
            $linha['temperatura'] = $linha['temperatura'] !== null ? (float) $linha['temperatura'] : null;
            $linha['umidade'] = $linha['umidade'] !== null ? (float) $linha['umidade'] : null;
            $linha['latitude'] = $linha['latitude'] !== null ? (float) $linha['latitude'] : null;
            $linha['longitude'] = $linha['longitude'] !== null ? (float) $linha['longitude'] : null;
        }
        unset($linha);

        echo json_encode(['sucesso' => true, 'dados' => $dados], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $entrada = json_decode(file_get_contents('php://input'), true);
        if (!is_array($entrada)) {
            http_response_code(400);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Envie um JSON válido.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $id = filter_var($entrada['id_registro'] ?? $entrada['id_ninho'] ?? null, FILTER_VALIDATE_INT);
        $temperatura = $entrada['temperatura'] ?? null;
        $umidade = $entrada['umidade'] ?? null;
        $latitude = $entrada['latitude'] ?? null;
        $longitude = $entrada['longitude'] ?? null;

        if (!$id || !is_numeric($temperatura) || !is_numeric($umidade)) {
            http_response_code(422);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Informe ID, temperatura e umidade válidos.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $temperatura = (float) $temperatura;
        $umidade = (float) $umidade;
        
        if ($temperatura < -50 || $temperatura > 100 || $umidade < 0 || $umidade > 100) {
            http_response_code(422);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Valores fora dos limites aceitos pela API.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $stmt = $conexao->prepare('UPDATE ninhos_tartarugas SET temperatura = ?, umidade = ?, latitude = ?, longitude = ? WHERE id_registro = ?');
        $stmt->execute([$temperatura, $umidade, $latitude, $longitude, $id]);

        if ($stmt->rowCount() === 0) {
            $verifica = $conexao->prepare('SELECT id_registro FROM ninhos_tartarugas WHERE id_registro = ?');
            $verifica->execute([$id]);
            $existe = $verifica->fetch();
            if (!$existe) {
                http_response_code(404);
                echo json_encode(['sucesso' => false, 'mensagem' => 'Registro não encontrado.'], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }

        echo json_encode(['sucesso' => true, 'mensagem' => 'Leitura atualizada.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    header('Allow: GET, POST');
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.'], JSON_UNESCAPED_UNICODE);
} catch (Throwable $erro) {
    error_log('Turtle Monitor - API ninhos: ' . $erro->getMessage());
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao consultar ou atualizar os dados.'], JSON_UNESCAPED_UNICODE);
}
?>