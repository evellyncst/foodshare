// Chave usada para guardar os dados no navegador (sem banco de dados por enquanto)
const CHAVE = 'foodshare_alimentos';
 
const alimentosIniciais = [
  { id: 1, estab: 'Restaurante Sabor Sincero', nome: '15 marmitas de hoje', categoria: 'Refeições Preparadas', qtd: '15 marmitas', validade: 'Retirar até 16h', status: 'Disponível' },
  { id: 2, estab: 'Padaria do Bairro', nome: 'Pães e salgados do dia', categoria: 'Padaria e Confeitaria', qtd: 'cerca de 10 kg', validade: 'Retirar até 19h', status: 'Disponível' },
  { id: 3, estab: 'Hortifrúti Vida Verde', nome: 'Caixa de frutas e legumes', categoria: 'Hortifrúti', qtd: '1 caixa', validade: 'Retirar até 18h', status: 'Disponível' }
];
 
let alimentos = JSON.parse(localStorage.getItem(CHAVE)) || alimentosIniciais;
let filtroAtual = 'Todos';
 
const lista = document.getElementById('lista');
const selectItem = document.getElementById('itemSolicitado');
 
function salvar() {
  localStorage.setItem(CHAVE, JSON.stringify(alimentos));
}
 
function mostrarAviso(id, texto, erro) {
  const p = document.getElementById(id);
  p.textContent = texto;
  p.className = erro ? 'aviso erro' : 'aviso';
}
 
// monta os cartões de acordo com o filtro escolhido
function mostrarLista() {
  lista.innerHTML = '';
 
  const filtrados = alimentos.filter(a => filtroAtual === 'Todos' || a.categoria === filtroAtual);
 
  if (filtrados.length === 0) {
    lista.textContent = 'Nenhum alimento nessa categoria no momento.';
    return;
  }
 
  filtrados.forEach(a => {
    const cartao = document.createElement('article');
    cartao.className = 'cartao';
 
    const titulo = document.createElement('h3');
    titulo.textContent = a.estab;
    cartao.appendChild(titulo);
 
    [['Item', a.nome], ['Quantidade', a.qtd], ['Prazo', a.validade], ['Status', a.status]].forEach(par => {
      const p = document.createElement('p');
      p.textContent = par[0] + ': ' + par[1];
      cartao.appendChild(p);
    });
 
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.textContent = a.status === 'Disponível' ? 'Solicitar doação' : a.status;
    botao.disabled = a.status !== 'Disponível';
    botao.addEventListener('click', () => {
      selectItem.value = a.id;
      location.hash = '#receber';
    });
    cartao.appendChild(botao);
 
    lista.appendChild(cartao);
  });
}
 
// o select da instituição só mostra o que ainda está disponível
function atualizarSelect() {
  selectItem.innerHTML = '<option value="">-- Escolha um item --</option>';
 
  alimentos.filter(a => a.status === 'Disponível').forEach(a => {
    const op = document.createElement('option');
    op.value = a.id;
    op.textContent = a.nome + ' - ' + a.estab;
    selectItem.appendChild(op);
  });
}
 
function atualizarTudo() {
  mostrarLista();
  atualizarSelect();
}
 
// filtros de categoria
document.querySelectorAll('#filtros button').forEach(botao => {
  botao.addEventListener('click', () => {
    document.querySelector('#filtros .ativo').classList.remove('ativo');
    botao.classList.add('ativo');
    filtroAtual = botao.dataset.cat;
    mostrarLista();
  });
});
 
// cadastro de alimento pelo doador
document.getElementById('formDoador').addEventListener('submit', e => {
  e.preventDefault();
 
  const estab = document.getElementById('nomeEstab').value.trim();
  const nome = document.getElementById('nomeAlimento').value.trim();
  const categoria = document.getElementById('categoriaAlimento').value;
  const qtd = document.getElementById('qtdAlimento').value.trim();
  const validade = document.getElementById('validade').value.trim();
 
  if (!estab || !nome || !categoria || !qtd || !validade) {
    mostrarAviso('msgDoador', 'Preencha todos os campos obrigatórios.', true);
    return;
  }
 
  alimentos.unshift({
    id: Date.now(),
    tipo: document.querySelector('input[name="tipo_estab"]:checked').value,
    estab: estab,
    nome: nome,
    categoria: categoria,
    qtd: qtd,
    validade: validade,
    obs: document.getElementById('obs').value.trim(),
    status: 'Disponível'
  });
 
  salvar();
  atualizarTudo();
  e.target.reset();
  mostrarAviso('msgDoador', 'Alimento cadastrado com sucesso!', false);
});
 
// solicitação feita pela instituição
document.getElementById('formOng').addEventListener('submit', e => {
  e.preventDefault();
 
  const ong = document.getElementById('nomeOng').value.trim();
  const id = Number(selectItem.value);
 
  if (!ong || !id) {
    mostrarAviso('msgOng', 'Informe o nome da instituição e escolha um alimento.', true);
    return;
  }
 
  const item = alimentos.find(a => a.id === id);
  item.status = 'Solicitado';
  item.ong = ong;
  item.transporte = document.getElementById('temTransporte').checked;
  item.mensagem = document.getElementById('mensagem').value.trim();
 
  salvar();
  atualizarTudo();
  e.target.reset();
  mostrarAviso('msgOng', 'Solicitação enviada! O doador será avisado.', false);
});
 
atualizarTudo();
 