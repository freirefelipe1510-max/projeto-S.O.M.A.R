'use strict';

/* =====================================
   CONFIGURAÇÕES DO SISTEMA
===================================== */

const API_NINHOS = './api/ninhos.php';
const INTERVALO_ATUALIZACAO = 10000;

let paginaAtual = 'inicio';
let dadoAtual = 'temperatura';
let dadosMonitoramento = [];
let mapaCarregado = false;

const $ = (id) => document.getElementById(id);

/* =====================================
   FORMATAÇÃO DE DATA
===================================== */

function formatarData(data) {
    if (!data) {
        return 'Data não informada';
    }

    const valor = String(data).replace(' ', 'T');
    const dataObj = new Date(valor);

    if (Number.isNaN(dataObj.getTime())) {
        return String(data);
    }

    return dataObj.toLocaleString('pt-BR');
}

/* =====================================
   NAVEGAÇÃO ENTRE PÁGINAS
===================================== */

function mostrarPagina(id) {
    const paginas = document.querySelectorAll('.pagina');

    paginas.forEach(pagina => {
        pagina.classList.remove('ativa');
    });

    const paginaSelecionada = $(id);

    if (!paginaSelecionada) {
        console.error('Página não encontrada:', id);
        return;
    }

    paginaSelecionada.classList.add('ativa');
    paginaAtual = id;

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    if (id === 'monitoramento') {
        carregarMonitoramento();
    }
}

/* =====================================
   SELEÇÃO DOS INDICADORES
===================================== */

function selecionarDado(tipo, botao) {
    const indicador = $('area-indicador');
    const mapa = $('area-mapa');
    const historico = $('area-historico');

    indicador.classList.add('escondido');
    mapa.classList.add('escondido');
    historico.classList.add('escondido');

    document.querySelectorAll('.botao-dado').forEach(btn => {
        btn.classList.remove('ativo');
    });

    if (botao) {
        botao.classList.add('ativo');
    }

    dadoAtual = tipo;

    switch (tipo) {
        case 'temperatura':
            indicador.classList.remove('escondido');
            $('titulo-indicador').textContent = 'Temperatura';
            $('unidade').textContent = '°C';
            atualizarIndicador();
            break;

        case 'umidade':
            indicador.classList.remove('escondido');
            $('titulo-indicador').textContent = 'Umidade';
            $('unidade').textContent = '%';
            atualizarIndicador();
            break;

        case 'localizacao':
            mapa.classList.remove('escondido');
            carregarLocalizacao();
            break;

        case 'historico':
            historico.classList.remove('escondido');
            carregarHistorico();
            break;

        default:
            console.error('Indicador desconhecido:', tipo);
    }
}

/* =====================================
   BUSCAR DADOS NA API
===================================== */

async function buscarDados() {
    const resposta = await fetch(API_NINHOS, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        },
        cache: 'no-store'
    });

    const resultado = await resposta.json();

    if (!resposta.ok || resultado.sucesso !== true) {
        throw new Error(
            resultado.mensagem || 'Erro ao consultar os dados.'
        );
    }

    if (!Array.isArray(resultado.dados)) {
        throw new Error('Formato de dados inválido.');
    }

    return resultado.dados;
}

/* =====================================
   CARREGAR MONITORAMENTO
===================================== */

async function carregarMonitoramento() {
    try {
        const dados = await buscarDados();
        dadosMonitoramento = dados;

        if (dados.length === 0) {
            mostrarSemDados();
            return;
        }

        atualizarIndicador();
        atualizarMapaNaTela();
        atualizarHistoricoNaTela();

        if ($('ultima-atualizacao')) {
            $('ultima-atualizacao').textContent =
                'Última atualização: ' +
                formatarData(dados[0].data_hora);
        }

    } catch (erro) {
        console.error('Falha ao carregar monitoramento:', erro);

        $('mensagem-dados').textContent = 'Sem conexão com o servidor.';
        $('ultima-atualizacao').textContent = 'Não foi possível atualizar os dados.';
        $('mensagem-mapa').textContent = 'Não foi possível consultar a localização.';
    }
}

/* =====================================
   MOSTRAR SEM DADOS
===================================== */

function mostrarSemDados() {
    $('valor-atual').textContent = '--';
    $('mensagem-dados').textContent = 'Nenhum dado disponível no momento.';
    $('ultima-atualizacao').textContent = 'Última atualização: sem dados recebidos.';

    $('latitude').textContent = '--';
    $('longitude').textContent = '--';
    $('mensagem-mapa').textContent = 'Aguardando localização.';

    $('tabela-historico').innerHTML = `
        <tr>
            <td colspan="6">Nenhum registro encontrado.</td>
        </tr>
    `;

    limparGrafico();
}

/* =====================================
   ATUALIZAR INDICADORES
===================================== */

function atualizarIndicador() {
    if (!dadosMonitoramento.length) {
        $('valor-atual').textContent = '--';
        return;
    }

    const ninho = dadosMonitoramento[0];
    let valor;

    if (dadoAtual === 'temperatura') {
        valor = ninho.temperatura;
    } else if (dadoAtual === 'umidade') {
        valor = ninho.umidade;
    } else {
        return;
    }

    if (valor === null || valor === '') {
        $('valor-atual').textContent = '--';
        $('mensagem-dados').textContent = 'Aguardando leitura do sensor.';
        limparGrafico();
        return;
    }

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        $('valor-atual').textContent = '--';
        $('mensagem-dados').textContent = 'Valor recebido inválido.';
        limparGrafico();
        return;
    }

    $('valor-atual').textContent =
        dadoAtual === 'temperatura'
            ? numero.toFixed(1)
            : numero.toFixed(0);

    $('mensagem-dados').textContent = 'Leitura recebida do dispositivo.';
    $('ultima-atualizacao').textContent =
        'Última atualização: ' +
        formatarData(ninho.data_hora);

    desenharGrafico();
}

/* =====================================
   GRÁFICO
===================================== */

function limparGrafico() {
    const canvas = $('grafico');
    const contexto = canvas.getContext('2d');
    contexto.clearRect(0, 0, canvas.width, canvas.height);
}

function desenharGrafico() {
    const canvas = $('grafico');
    const contexto = canvas.getContext('2d');

    const largura = canvas.clientWidth;
    const altura = 230;

    if (!largura) return;

    const escala = window.devicePixelRatio || 1;

    canvas.width = largura * escala;
    canvas.height = altura * escala;

    contexto.setTransform(escala, 0, 0, escala, 0, 0);
    contexto.clearRect(0, 0, largura, altura);

    const registros = dadosMonitoramento
        .slice(0, 10)
        .reverse()
        .filter(item => {
            const valor = dadoAtual === 'temperatura'
                ? item.temperatura
                : item.umidade;

            return valor !== null &&
                valor !== '' &&
                Number.isFinite(Number(valor));
        });

    if (registros.length === 0) return;

    const valores = registros.map(item => {
        return Number(
            dadoAtual === 'temperatura'
                ? item.temperatura
                : item.umidade
        );
    });

    const maior = Math.max(...valores);
    const menor = Math.min(...valores);

    const margem = 25;
    const area = altura - margem * 2;
    const diferenca = maior - menor || 1;

    contexto.strokeStyle = 'rgba(23,54,75,0.12)';
    contexto.lineWidth = 1;

    for (let i = 0; i < 4; i++) {
        const y = margem + (area / 3) * i;

        contexto.beginPath();
        contexto.moveTo(10, y);
        contexto.lineTo(largura - 10, y);
        contexto.stroke();
    }

    contexto.beginPath();
    contexto.strokeStyle = '#17364B';
    contexto.lineWidth = 3;
    contexto.lineJoin = 'round';
    contexto.lineCap = 'round';

    valores.forEach((valor, index) => {
        const x = valores.length === 1
            ? largura / 2
            : 15 + index * ((largura - 30) / (valores.length - 1));

        const y = altura - margem - ((valor - menor) / diferenca) * area;

        if (index === 0) {
            contexto.moveTo(x, y);
        } else {
            contexto.lineTo(x, y);
        }
    });

    contexto.stroke();

    valores.forEach((valor, index) => {
        const x = valores.length === 1
            ? largura / 2
            : 15 + index * ((largura - 30) / (valores.length - 1));

        const y = altura - margem - ((valor - menor) / diferenca) * area;

        contexto.beginPath();
        contexto.arc(x, y, 4, 0, Math.PI * 2);
        contexto.fillStyle = '#17364B';
        contexto.fill();
    });
}

/* =====================================
   LOCALIZAÇÃO GPS
===================================== */

function atualizarMapaNaTela() {
    if (dadosMonitoramento.length === 0) return;

    const ninho = dadosMonitoramento[0];
    const latitude = Number(ninho.latitude);
    const longitude = Number(ninho.longitude);

    if (
        ninho.latitude === null ||
        ninho.latitude === '' ||
        ninho.longitude === null ||
        ninho.longitude === '' ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        $('latitude').textContent = '--';
        $('longitude').textContent = '--';
        $('mapa').removeAttribute('src');
        $('mensagem-mapa').textContent = 'Coordenadas não cadastradas.';
        mapaCarregado = false;
        return;
    }

    $('latitude').textContent = latitude.toFixed(5);
    $('longitude').textContent = longitude.toFixed(5);

    $('mapa').src = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;
    $('mensagem-mapa').textContent = 'Localização GPS recebida.';
    mapaCarregado = true;
}

function carregarLocalizacao() {
    if (!dadosMonitoramento.length) {
        $('mensagem-mapa').textContent = 'Aguardando dados de localização.';
        return;
    }
    atualizarMapaNaTela();
}

/* =====================================
   HISTÓRICO DE LEITURAS
===================================== */

function escaparHTML(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, caractere => {
        const entidades = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return entidades[caractere];
    });
}

function atualizarHistoricoNaTela() {
    const tabela = $('tabela-historico');

    if (!dadosMonitoramento.length) {
        tabela.innerHTML = `
            <tr>
                <td colspan="6">Nenhum registro encontrado.</td>
            </tr>
        `;
        return;
    }

    tabela.innerHTML = dadosMonitoramento.map(ninho => {
        const latFormatada = (ninho.latitude !== null && ninho.latitude !== '') ? Number(ninho.latitude).toFixed(5) : '--';
        const lonFormatada = (ninho.longitude !== null && ninho.longitude !== '') ? Number(ninho.longitude).toFixed(5) : '--';

        return `
            <tr>
                <td>${escaparHTML(ninho.id_registro ?? '--')}</td>
                <td>${escaparHTML(ninho.temperatura ?? '--')} °C</td>
                <td>${escaparHTML(ninho.umidade ?? '--')} %</td>
                <td>${escaparHTML(latFormatada)}</td>
                <td>${escaparHTML(lonFormatada)}</td>
                <td>${escaparHTML(formatarData(ninho.data_hora))}</td>
            </tr>
        `;
    }).join('');
}

function carregarHistorico() {
    atualizarHistoricoNaTela();
}

/* =====================================
   EXPORTAR HISTÓRICO PARA CSV
===================================== */

function exportarHistoricoCSV() {
    if (!dadosMonitoramento || dadosMonitoramento.length === 0) {
        alert('Não há dados disponíveis para exportar.');
        return;
    }

    let csv = 'ID Registro,Temperatura (C),Umidade (%),Latitude,Longitude,Data e Hora\n';

    dadosMonitoramento.forEach(ninho => {
        const id = ninho.id_registro ?? '';
        const temp = ninho.temperatura ?? '';
        const umidade = ninho.umidade ?? '';
        const lat = ninho.latitude ?? '';
        const lon = ninho.longitude ?? '';
        const data = ninho.data_hora ?? '';

        csv += `"${id}","${temp}","${umidade}","${lat}","${lon}","${data}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'historico_ninhos_tartarugas.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/* =====================================
   REDIMENSIONAMENTO DO GRÁFICO
===================================== */

window.addEventListener('resize', () => {
    if (
        paginaAtual === 'monitoramento' &&
        !$('area-indicador').classList.contains('escondido')
    ) {
        desenharGrafico();
    }
});

/* =====================================
   INICIALIZAÇÃO DO SISTEMA
===================================== */

document.addEventListener('DOMContentLoaded', () => {
    mostrarPagina('inicio');
    carregarMonitoramento();

    window.setInterval(() => {
        carregarMonitoramento();
    }, INTERVALO_ATUALIZACAO);
});