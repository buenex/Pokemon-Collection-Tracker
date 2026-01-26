# Pokémon Collection Tracker

Projeto desenvolvido com foco em organização, busca e controle de uma coleção de Pokémons, permitindo marcar quais Pokémons o usuário já possui (`have`), aplicar filtros, ordenações e paginação de forma eficiente.

O projeto foi desenvolvido em **duas abordagens diferentes**, refletindo uma evolução consciente de escopo e decisões arquiteturais.

---

## Objetivo do Projeto

Criar uma interface simples e funcional para:
- Listar Pokémons
- Filtrar por ID, nome, geração e jogo
- Ordenar os dados por diferentes colunas
- Paginar os resultados
- Marcar Pokémons já obtidos pelo usuário

Além da funcionalidade, o foco foi **avaliar e decidir a melhor arquitetura para o problema**, evitando complexidade desnecessária.

---

## Versões do Projeto

### Versão 1 — Full Stack (Escopo Inicial)

**Tecnologias:**
- Node.js
- Express
- PostgreSQL
- Docker
- API REST
- SQL para filtros, paginação e ordenação

**Características:**
- API responsável por consultas filtradas
- Banco de dados contendo a massa de Pokémons
- Paginação e ordenação no backend
- Comunicação via Fetch API

**Motivação inicial:**
> Exercitar conceitos de backend, banco de dados, APIs e integração frontend/backend.

---

### Versão 2 — Front-end Only (Escopo Refinado)

Após análise do problema, foi criada uma segunda versão do projeto com **escopo reduzido e arquitetura mais adequada**.

**Tecnologias:**
- HTML
- CSS / Bootstrap
- JavaScript
- DataTables
- JSON estático
- localStorage

**Principais mudanças:**
- A massa de dados (~1025 Pokémons) passou a ser carregada a partir de um arquivo `pokemons.json`
- Filtros, ordenação e paginação feitos totalmente no client-side
- Estado do usuário (`have`) armazenado via `localStorage`
- Eliminação de backend, banco e Docker

---

## Decisões Arquiteturais

### Por que remover o backend?

Após avaliar o cenário, foi identificado que:
- A massa de dados é **estática**
- O volume (~250–300 KB em JSON) é pequeno
- Não há necessidade de multiusuário ou sincronização
- Não há dados sensíveis

Manter uma API e um banco de dados para esse cenário foi considerado **overengineering**.

### Solução adotada:
- Dados base → JSON estático
- Estado do usuário → localStorage
- UI rica → DataTables

Essa abordagem:
- Reduz complexidade
- Elimina problemas de CORS
- Funciona offline após a primeira carga
- Mantém ótima performance

---

## Persistência de Dados

- A lista de Pokémons é carregada a partir de um arquivo JSON
- O progresso do usuário (`have`) é salvo no `localStorage`, associando o estado ao ID do Pokémon

```js
{
  "25": true,
  "150": true
}
```

Essa separação facilita uma futura migração para backend, caso necessário.

## Tabela de Pokémons

- Paginação automática (50 itens por página)
- Ordenação em todas as colunas, exceto sprite
- Busca integrada
- Atualização dinâmica sem recarregar a página

## Evolução Futura (Opcional)

O projeto está preparado para evoluir facilmente para:

Autenticação de usuários

Sincronização do progresso entre dispositivos

Backend apenas para salvar o estado do usuário

Consumo do mesmo JSON via API

## Aprendizados

Durante o desenvolvimento foram trabalhados e consolidados conceitos como:

- Async / Await e Promises
- Fetch API e CORS
- Manipulação dinâmica de DOM
- Integração com DataTables
- Decisão de escopo e arquitetura
- Debugging de problemas reais (duplicação de dados, estado, eventos)

## Observação Final

Apesar do uso de ferramentas de apoio (documentação, IA, etc.), todas as decisões técnicas e resolução de problemas foram feitas de forma consciente, com foco em entendimento e melhoria contínua.