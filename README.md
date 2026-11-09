Projeto de extensão universitária.

# FoodShare - Sistema de Doação de Alimentos

Plataforma web que conecta estabelecimentos com alimentos excedentes (restaurantes, padarias e supermercados) a instituições beneficentes. O objetivo é reduzir o desperdício de alimentos e dar mais organização e transparência ao processo de doação.

Projeto desenvolvido para a atividade de extensão universitária.

## Como funciona

- **Doadores** cadastram os alimentos disponíveis, acompanham as solicitações recebidas e aprovam, recusam ou concluem cada uma.
- **Instituições** veem os alimentos disponíveis, filtram por categoria, solicitam doações e acompanham o status dos pedidos.
- O sistema registra o histórico das doações e mostra ao doador o seu nível de conquistas (Bronze, Prata e Ouro).

## Telas

| Arquivo | Descrição |
| --- | --- |
| `index.html` | Tela inicial, apresenta o projeto |
| `login.html` | Login e cadastro de usuário |
| `doador.html` | Área do doador |
| `instituicao.html` | Área da instituição |

## Tecnologias

- HTML, CSS e JavaScript
- Dados salvos no `localStorage` do navegador, apenas para simular o backend
- Backend previsto: C# (ASP.NET Core Web API) com MySQL

## Como executar

Não precisa instalar nada. Baixe o projeto e abra o arquivo `index.html` no navegador.

Para testar o fluxo completo, crie uma conta de doador e cadastre um alimento. Depois use o botão **Sair**, crie uma conta de instituição e faça uma solicitação. Os dois usuários precisam estar no mesmo navegador, porque os dados ficam no `localStorage`.

## Estrutura

```
index.html
login.html
doador.html
instituicao.html
css/style.css
js/login.js
js/doador.js
js/instituicao.js
img/
docs/
```

## Documentação

Os documentos do projeto (especificação de processos e especificação de requisitos do backend) ficam na pasta `docs`.

## Autoria

Projeto desenvolvido por [seu nome].
