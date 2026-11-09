// Tela da Instituição. Os dados ficam no localStorage para simular o backend.
const CHAVE_ALIMENTOS = 'foodshare_alimentos';
const CHAVE_SOLICITACOES = 'foodshare_solicitacoes';
const CHAVE_SESSAO = 'foodshare_sessao';

const sessao = JSON.parse(localStorage.getItem(CHAVE_SESSAO));
let filtroAtual = 'Todos';

// só instituição logada pode ver essa tela (RN-03)
if (!sessao || sessao.tipo !== 'Instituição') {
  location.href = 'login.html';
} else {
  iniciar();
}

function ler(chave) {
  return JSON.parse(localStorage.getItem(chave)) || [];
}

function salvar(chave, dados) {
  localStorage.setItem(chave, JSON.stringify(dados));
}

function iniciar() {
  document.getElementById('saudacao').textContent = 'Olá, ' + sessao.nome;

  document.getElementById('btnSair').addEventListener('click', e => {
    e.preventDefault();
    localStorage.removeItem(CHAVE_SESSAO);
    location.href = 'index.html';
  });

  // filtros de categoria
  document.querySelectorAll('#filtros button').forEach(botao => {
    botao.addEventListener('click', () => {
      document.querySelector('#filtros .ativo').classList.remove('ativo');
      botao.classList.add('ativo');
      filtroAtual = botao.dataset.cat;
      atualizarTela();
    });
  });

  document.getElementById('formSolicitacao').addEventListener('submit', enviarSolicitacao);
  atualizarTela();
}

function mostrarAviso(id, texto, erro) {
  const p = document.getElementById(id);
  p.textContent = texto;
  p.className = erro ? 'aviso erro' : 'aviso';
}

// monta um cartão com título, linhas de texto e botões (opcionais)
function criarCartao(titulo, linhas, acoes) {
  const cartao = document.createElement('article');
  cartao.className = 'cartao';

  const h = document.createElement('h3');
  h.textContent = titulo;
  cartao.appendChild(h);

  linhas.forEach(texto => {
    const p = document.createElement('p');
    p.textContent = texto;
    cartao.appendChild(p);
  });

  if (acoes && acoes.length > 0) {
    const div = document.createElement('div');
    div.className = 'acoes';
    acoes.forEach(a => {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.textContent = a.texto;
      botao.addEventListener('click', a.acao);
      div.appendChild(botao);
    });
    cartao.appendChild(div);
  }

  return cartao;
}

function preencherLista(idLista, cartoes, msgVazia) {
  const lista = document.getElementById(idLista);
  lista.innerHTML = '';

  if (cartoes.length === 0) {
    const p = document.createElement('p');
    p.className = 'vazio';
    p.textContent = msgVazia;
    lista.appendChild(p);
    return;
  }

  cartoes.forEach(c => lista.appendChild(c));
}

// RF-05 - solicitar doação
function enviarSolicitacao(e) {
  e.preventDefault();

  const select = document.getElementById('itemSolicitado');
  const idAlimento = Number(select.value);

  if (!idAlimento) {
    mostrarAviso('msgSolicitacao', 'Escolha um alimento.', true);
    return;
  }

  const alimentos = ler(CHAVE_ALIMENTOS);
  const alimento = alimentos.find(a => a.id === idAlimento);

  // RN-06 - só dá para solicitar alimento disponível
  if (!alimento || alimento.status !== 'Disponível') {
    mostrarAviso('msgSolicitacao', 'Alimento não está mais disponível.', true);
    atualizarTela();
    return;
  }

  const solicitacoes = ler(CHAVE_SOLICITACOES);
  solicitacoes.push({
    id: Date.now(),
    alimento_id: alimento.id,
    instituicao_id: sessao.id,
    instituicao_nome: sessao.nome,
    tem_transporte: document.getElementById('temTransporte').checked,
    mensagem: document.getElementById('mensagem').value.trim(),
    status: 'Pendente',
    data_solicitacao: new Date().toISOString()
  });

  // RN-07 - ao solicitar, o alimento passa para "Solicitado"
  alimento.status = 'Solicitado';

  salvar(CHAVE_SOLICITACOES, solicitacoes);
  salvar(CHAVE_ALIMENTOS, alimentos);

  e.target.reset();
  mostrarAviso('msgSolicitacao', 'Solicitação enviada! O doador será avisado.', false);
  atualizarTela();
}

function atualizarTela() {
  const alimentos = ler(CHAVE_ALIMENTOS);
  const solicitacoes = ler(CHAVE_SOLICITACOES);

  // RF-04 - alimentos disponíveis, com filtro por categoria
  const disponiveis = alimentos.filter(a => a.status === 'Disponível');
  const filtrados = disponiveis.filter(a => filtroAtual === 'Todos' || a.categoria === filtroAtual);

  preencherLista('listaAlimentos', filtrados.reverse().map(a => {
    const linhas = [a.nome, a.quantidade, a.validade];
    if (a.observacoes) linhas.push('Retirada: ' + a.observacoes);

    return criarCartao(a.estab, linhas, [{
      texto: 'Solicitar doação',
      acao: () => {
        document.getElementById('itemSolicitado').value = a.id;
        location.hash = '#solicitar';
      }
    }]);
  }), 'Nenhum alimento disponível nessa categoria no momento.');

  // o select do formulário mostra tudo que está disponível
  const select = document.getElementById('itemSolicitado');
  select.innerHTML = '<option value="">-- Escolha um item --</option>';
  disponiveis.forEach(a => {
    const op = document.createElement('option');
    op.value = a.id;
    op.textContent = a.nome + ' - ' + a.estab;
    select.appendChild(op);
  });

  // RF-08 - minhas solicitações (RN-12: só as da própria instituição)
  const minhas = solicitacoes.filter(s => s.instituicao_id === sessao.id).reverse();

  preencherLista('listaSolicitacoes', minhas.map(s => {
    const alimento = alimentos.find(a => a.id === s.alimento_id);
    return criarCartao(alimento.nome, [
      alimento.estab,
      'Status: ' + s.status,
      'Enviada em ' + new Date(s.data_solicitacao).toLocaleDateString('pt-BR')
    ]);
  }), 'Você ainda não fez nenhuma solicitação.');

  // RF-09 - histórico (RN-13: só doações concluídas)
  const concluidas = minhas.filter(s => s.status === 'Concluída');

  preencherLista('listaHistorico', concluidas.map(s => {
    const alimento = alimentos.find(a => a.id === s.alimento_id);
    return criarCartao(alimento.nome, [
      alimento.estab,
      'Solicitada em ' + new Date(s.data_solicitacao).toLocaleDateString('pt-BR')
    ]);
  }), 'Nenhuma doação recebida ainda.');
}