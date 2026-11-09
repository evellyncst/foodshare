// Os dados ficam no navegador (localStorage) só para simular o backend.
// Depois, cada função vai chamar a API: POST /api/usuarios e POST /api/login
const CHAVE_USUARIOS = 'foodshare_usuarios';
const CHAVE_SESSAO = 'foodshare_sessao';

let usuarios = JSON.parse(localStorage.getItem(CHAVE_USUARIOS)) || [];

const painelLogin = document.getElementById('painelLogin');
const painelCadastro = document.getElementById('painelCadastro');
const abaLogin = document.getElementById('abaLogin');
const abaCadastro = document.getElementById('abaCadastro');

function mostrarAviso(id, texto, erro) {
  const p = document.getElementById(id);
  p.textContent = texto;
  p.className = erro ? 'aviso erro' : 'aviso';
}

// alterna entre as abas Entrar e Criar conta
function mostrarAba(aba) {
  const login = aba === 'login';
  painelLogin.hidden = !login;
  painelCadastro.hidden = login;
  abaLogin.classList.toggle('ativo', login);
  abaCadastro.classList.toggle('ativo', !login);
}

abaLogin.addEventListener('click', () => mostrarAba('login'));
abaCadastro.addEventListener('click', () => mostrarAba('cadastro'));

// o tipo de estabelecimento só faz sentido para doador
function ajustarCamposTipo() {
  const tipo = document.querySelector('input[name="tipo"]:checked').value;
  const doador = tipo === 'Doador';
  document.getElementById('campoEstab').hidden = !doador;
  document.getElementById('labelNome').textContent = doador ? 'Nome do estabelecimento' : 'Nome da instituição';
}

document.querySelectorAll('input[name="tipo"]').forEach(radio => {
  radio.addEventListener('change', ajustarCamposTipo);
});

// se veio da tela inicial com ?tipo=..., já abre o cadastro com o tipo escolhido
const tipoUrl = new URLSearchParams(location.search).get('tipo');
if (tipoUrl === 'doador' || tipoUrl === 'instituicao') {
  document.querySelector('input[name="tipo"][value="' + (tipoUrl === 'doador' ? 'Doador' : 'Instituição') + '"]').checked = true;
  mostrarAba('cadastro');
}
ajustarCamposTipo();

// RF-01 - cadastrar usuário
document.getElementById('formCadastro').addEventListener('submit', e => {
  e.preventDefault();

  const tipo = document.querySelector('input[name="tipo"]:checked').value;
  const nome = document.getElementById('cadNome').value.trim();
  const email = document.getElementById('cadEmail').value.trim().toLowerCase();
  const senha = document.getElementById('cadSenha').value;

  if (!nome || !email || !senha) {
    mostrarAviso('msgCadastro', 'Preencha todos os campos obrigatórios.', true);
    return;
  }
  if (senha.length < 8) {
    mostrarAviso('msgCadastro', 'A senha deve ter no mínimo 8 caracteres.', true);
    return;
  }
  if (usuarios.some(u => u.email === email)) {
    mostrarAviso('msgCadastro', 'E-mail já cadastrado.', true);
    return;
  }

  usuarios.push({
    id: Date.now(),
    nome: nome,
    email: email,
    senha: senha,
    tipo: tipo,
    tipo_estabelecimento: tipo === 'Doador' ? document.getElementById('cadEstab').value : null
  });
  localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(usuarios));

  e.target.reset();
  ajustarCamposTipo();
  document.getElementById('loginEmail').value = email;
  mostrarAba('login');
  mostrarAviso('msgLogin', 'Conta criada! Digite sua senha para entrar.', false);
});

// RF-02 - autenticar usuário
document.getElementById('formLogin').addEventListener('submit', e => {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const senha = document.getElementById('loginSenha').value;

  const usuario = usuarios.find(u => u.email === email && u.senha === senha);

  if (!usuario) {
    mostrarAviso('msgLogin', 'E-mail ou senha inválidos.', true);
    return;
  }

  // guarda quem está logado (no backend isso será o token JWT)
  localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ id: usuario.id, nome: usuario.nome, tipo: usuario.tipo }));

  // cada tipo de usuário vai para a sua tela
  location.href = usuario.tipo === 'Doador' ? 'doador.html' : 'instituicao.html';
});