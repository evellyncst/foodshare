// Tela do Doador. Os dados ficam no localStorage para simular o backend.
// Quando a API em C# estiver pronta, cada função abaixo vira uma chamada (fetch).
const CHAVE_ALIMENTOS = 'foodshare_alimentos';
const CHAVE_SOLICITACOES = 'foodshare_solicitacoes';
const CHAVE_SESSAO = 'foodshare_sessao';

const sessao = JSON.parse(localStorage.getItem(CHAVE_SESSAO));

// só doador logado pode ver essa tela (RN-03)
if (!sessao || sessao.tipo !== 'Doador') {
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

  document.getElementById('formAlimento').addEventListener('submit', cadastrarAlimento);
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
      if (a.classe) botao.className = a.classe;
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

// RF-03 - cadastrar alimento
function cadastrarAlimento(e) {
  e.preventDefault();

  const nome = document.getElementById('nomeAlimento').value.trim();
  const categoria = document.getElementById('categoriaAlimento').value;
  const quantidade = document.getElementById('qtdAlimento').value.trim();
  const validade = document.getElementById('validade').value.trim();

  if (!nome || !categoria || !quantidade || !validade) {
    mostrarAviso('msgAlimento', 'Preencha todos os campos obrigatórios.', true);
    return;
  }

  const alimentos = ler(CHAVE_ALIMENTOS);
  alimentos.push({
    id: Date.now(),
    doador_id: sessao.id,
    estab: sessao.nome,
    nome: nome,
    categoria: categoria,
    quantidade: quantidade,
    validade: validade,
    observacoes: document.getElementById('obs').value.trim(),
    status: 'Disponível',
    data_cadastro: new Date().toISOString()
  });
  salvar(CHAVE_ALIMENTOS, alimentos);

  e.target.reset();
  mostrarAviso('msgAlimento', 'Alimento cadastrado com sucesso!', false);
  atualizarTela();
}

// RF-07 - aprovar, recusar ou concluir uma solicitação
function atualizarStatus(idSolicitacao, novoStatus) {
  const solicitacoes = ler(CHAVE_SOLICITACOES);
  const alimentos = ler(CHAVE_ALIMENTOS);

  const solicitacao = solicitacoes.find(s => s.id === idSolicitacao);
  const alimento = alimentos.find(a => a.id === solicitacao.alimento_id);

  // RN-10 - só estas mudanças são permitidas
  const permitido =
    (solicitacao.status === 'Pendente' && (novoStatus === 'Aprovada' || novoStatus === 'Recusada')) ||
    (solicitacao.status === 'Aprovada' && novoStatus === 'Concluída');

  if (!permitido) {
    alert('Mudança de status não permitida.');
    return;
  }

  solicitacao.status = novoStatus;

  // RN-11 - ao recusar o alimento volta a ficar disponível, ao concluir vira doado
  if (novoStatus === 'Recusada') alimento.status = 'Disponível';
  if (novoStatus === 'Concluída') alimento.status = 'Doado';

  salvar(CHAVE_SOLICITACOES, solicitacoes);
  salvar(CHAVE_ALIMENTOS, alimentos);
  atualizarTela();
}

// RN-14 - nível do doador pelo total de doações concluídas
function calcularNivel(total) {
  if (total >= 30) return { nome: 'Ouro', falta: 0, proximo: '' };
  if (total >= 15) return { nome: 'Prata', falta: 30 - total, proximo: 'Ouro' };
  if (total >= 5) return { nome: 'Bronze', falta: 15 - total, proximo: 'Prata' };
  return { nome: 'Sem nível ainda', falta: 5 - total, proximo: 'Bronze' };
}

function atualizarTela() {
  const alimentos = ler(CHAVE_ALIMENTOS);
  const solicitacoes = ler(CHAVE_SOLICITACOES);

  // RN-12 - o doador só vê os próprios alimentos e as solicitações deles
  const meus = alimentos.filter(a => a.doador_id === sessao.id);
  const idsMeus = meus.map(a => a.id);
  const recebidas = solicitacoes.filter(s => idsMeus.includes(s.alimento_id)).reverse();

  // RF-10 - meus alimentos
  preencherLista('listaAlimentos', meus.slice().reverse().map(a =>
    criarCartao(a.nome, [a.categoria, a.quantidade, a.validade, 'Status: ' + a.status])
  ), 'Você ainda não cadastrou alimentos.');

  // RF-06 - solicitações recebidas
  preencherLista('listaSolicitacoes', recebidas.map(s => {
    const alimento = alimentos.find(a => a.id === s.alimento_id);
    const linhas = [
      'Instituição: ' + s.instituicao_nome,
      'Transporte próprio: ' + (s.tem_transporte ? 'Sim' : 'Não')
    ];
    if (s.mensagem) linhas.push('Mensagem: ' + s.mensagem);
    linhas.push('Status: ' + s.status);

    let acoes = [];
    if (s.status === 'Pendente') {
      acoes = [
        { texto: 'Aprovar', acao: () => atualizarStatus(s.id, 'Aprovada') },
        { texto: 'Recusar', classe: 'btn-recusar', acao: () => atualizarStatus(s.id, 'Recusada') }
      ];
    } else if (s.status === 'Aprovada') {
      acoes = [{ texto: 'Marcar como concluída', acao: () => atualizarStatus(s.id, 'Concluída') }];
    }

    return criarCartao(alimento.nome, linhas, acoes);
  }), 'Nenhuma solicitação recebida até agora.');

  // RF-09 - histórico (RN-13: só doações concluídas)
  const concluidas = recebidas.filter(s => s.status === 'Concluída');
  preencherLista('listaHistorico', concluidas.map(s => {
    const alimento = alimentos.find(a => a.id === s.alimento_id);
    return criarCartao(alimento.nome, [
      'Instituição: ' + s.instituicao_nome,
      'Solicitada em ' + new Date(s.data_solicitacao).toLocaleDateString('pt-BR')
    ]);
  }), 'Nenhuma doação concluída ainda.');

  // RF-11 - conquistas
  const total = concluidas.length;
  const nivel = calcularNivel(total);
  document.getElementById('nivel').textContent = nivel.nome === 'Sem nível ainda' ? nivel.nome : 'Nível ' + nivel.nome;

  let texto = 'Você concluiu ' + (total === 1 ? '1 doação.' : total + ' doações.');
  if (nivel.falta > 0) {
    texto += ' Faltam ' + nivel.falta + ' para o nível ' + nivel.proximo + '.';
  }
  document.getElementById('progresso').textContent = texto;
}