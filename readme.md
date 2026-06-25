
# Deliver Tracking API

Esta API foi desenvolvida para a gestão logística de entregas e motoristas, aplicando padrões de arquitetura avançados como **Repository Pattern** e **Inversão de Dependência**.

## Tecnologias e Arquitetura

* **Node.js + Express:** O framework Express é a base do servidor, responsável tanto pela criação das rotas da API REST quanto por gerenciar as rotas visuais. Ele orquestra os middlewares (autenticação, arquivos estáticos, tratamento de erros) para o funcionamento completo da aplicação.
* **Server-Side Rendering (SSR):** Utilizando a engine **EJS**, as telas são pré-processadas no servidor. O Express obtém os dados através dos Controllers e renderiza o HTML final com cálculos e lógicas nativas, dispensando requisições extras do lado do cliente.
* **Banco de dados:** SQLite operado via Prisma ORM.
* **Arquitetura:** Fluxo em camadas lógicas divididas em `Controller` -> `Service` -> `Repository`.
* **Design:** Inversão de Dependência (Dependency Injection) via interfaces/contratos.
* **Testes Automatizados:** Testes End-to-End (E2E) estruturados com **Playwright** utilizando o padrão Page Object Model (POM).

---

## Como Executar

1. Instale as dependências rodando `npm install`.
2. Defina a variável `DATABASE_URL` no arquivo `.env` com o caminho do banco (Exemplo: `DATABASE_URL="file:./prisma/dev.db"`).
3. Defina a variável `JWT_SECRET` no arquivo `.env` para a assinatura dos tokens (Exemplo: `JWT_SECRET="sua_chave_secreta_super_segura"`).
4. Execute as migrations do banco de dados com `npx prisma migrate dev`.
5. Popule o banco com dados e usuários de demonstração executando `node prisma/seed.js`.
6. Inicie o servidor executando `npm run dev` (ou `npm start`).

---

## Dependências Essenciais

* `express`
* `ejs`
* `dotenv`
* `@prisma/client` / `prisma`
* `jsonwebtoken`
* `bcrypt`
* `cookie-parser`
* `@playwright/test` (Dev)

---

## Autenticação e Autorização (RBAC)

O sistema possui uma camada de segurança robusta baseada em **JWT** e **Controle de Acesso Baseado em Papéis (RBAC)**.
O sistema trabalha de forma híbrida para autenticação:

* **API REST:** Exige o token no cabeçalho da requisição (`Authorization: Bearer <token>`).
* **Painel SSR:** Utiliza *Cookies HTTP-Only* gerados automaticamente no momento do login.

### Papéis Disponíveis

* **GESTOR:** Acesso total. Único com permissão para criar/inativar motoristas, cancelar entregas e visualizar os painéis de relatórios.
* **OPERADOR:** Acesso restrito. Pode visualizar listas e criar entregas, mas não possui privilégios de destruição ou métricas globais.

### Rotas de Autenticação (Abertas)

**Registrar Usuário**

* **URL:** `/api/auth/registrar` | **Método:** `POST`
* **Corpo:** `{"nome": "Nome", "email": "operador@teste.com", "senha": "123"}`
* **Retorno:** Registra o usuário com a senha hasheada no banco (Papel padrão: `OPERADOR`).

**Login**

* **URL:** `/api/auth/login` | **Método:** `POST`
* **Corpo:** `{"email": "gestor@teste.com", "senha": "123"}`
* **Retorno (200 OK):** Injeta o Cookie de sessão e retorna o JSON com o `accessToken`.

---

## Interface Web e Painel Administrativo

A aplicação possui um Dashboard acessível pelo navegador com renderização do lado do servidor (SSR). Todas as rotas estão protegidas e farão o redirecionamento para `/login` caso o usuário não esteja autenticado.

**Acesso ao Painel:** Navegue para a rota `http://localhost:3000/painel`.

### Documentação das Rotas do `/painel`

**Dashboard e Relatórios (Acesso: GESTOR)**

* **`GET /painel/`**: Retorna a página inicial (dashboard principal).
* **`GET /painel/relatorios`**: Exibe o Dashboard completo de relatórios e métricas de desempenho.
* **`GET /painel/relatorios/entregas-por-status`**: Métricas de entrega distribuídas por status.
* **`GET /painel/relatorios/motoristas-ativos`**: Motoristas em operação e entregas em aberto.

**Gestão de Entregas (Acesso: Autenticados)**

* **`GET /painel/entregas`**: Listagem de todas as entregas com suporte a filtros.
* **`GET /painel/entregas/novo`**: Formulário de criação de nova entrega (registra o `criadorId` automaticamente).
* **`POST /painel/entregas`**: Ação que persiste a entrega.
* **`GET /painel/entregas/:id`**: Detalhes da entrega e histórico de eventos.
* **`GET /painel/atribuir-motorista`**: Formulário para associar motorista à entrega `CRIADA`.
* **`POST /painel/atribuir-motorista`**: Efetiva a atribuição.
* **`PATCH /painel/entregas/:id/avancar`**: Avança o status logístico da entrega.
* **`PATCH /painel/entregas/:id/cancelar`**: Cancela a entrega (Acesso restrito: **GESTOR**).

**Gestão de Motoristas (Acesso: GESTOR)**

* **`GET /painel/motoristas`**: Listagem de motoristas (Ativos e Inativos).
* **`GET /painel/motoristas/novo`**: Formulário de cadastro de motoristas.
* **`POST /painel/motoristas`**: Persiste o cadastro.
* **`GET /painel/motoristas/:id`**: Visualização detalhada de um motorista.
* **`GET /painel/motoristas/:id/inativar`**: Realiza a inativação ("Soft delete") do motorista.

---

## Documentação da API Rest

**Base URL:** `/api`

### Motoristas

**Criar Motorista (Acesso: GESTOR)**

* **URL:** `/motoristas` | **Método:** `POST`
* **Corpo:** `{"nome": "Willian", "cpf": "111.222.333-44", "placaVeiculo": "OPA-1346"}`
* **Exemplo de Retorno (201):** `{"id": 1, "nome": "Willian", "placaVeiculo": "OPA-1346", "cpf": "11122233344", "status": "ATIVO"}`

**Listar Todos os Motoristas**

* **URL:** `/motoristas` | **Método:** `GET`
* **Query params (opcional):** `status=ATIVO|INATIVO`

**Inativar Motorista (Acesso: GESTOR)**

* **URL:** `/motoristas/:id/inativar` | **Método:** `PATCH`
* **Exemplo de Retorno:** `{"mensagem": "Motorista desativado"}`

**Listar Entregas por Motorista**

* **URL:** `/motoristas/:id/entregas` | **Método:** `GET`
* **Query params (opcional):** `status=CRIADA|EM_TRANSITO|ENTREGUE|CANCELADA`

### Entregas

**Criar Entrega**

* **URL:** `/entregas` | **Método:** `POST`
* **Exemplo de Retorno:** `{"id": 1, "descricao": "Entrega", "status": "CRIADA", "criadorId": 1}`

**Atribuir Motorista**

* **URL:** `/entregas/:id/atribuir` | **Método:** `PATCH`
* **Corpo:** `{"motoristaId": "2"}`

**Avançar Estado**

* **URL:** `/entregas/:id/avancar` | **Método:** `PATCH`

**Listar Entregas (Filtros e Paginação)**

* **URL:** `/entregas` | **Método:** `GET`
* **Query params (opcional):** `status`, `createdDe`, `createdAte`, `page`, `limit`.

---

## Regras de Negócio e Validações (Status HTTP)

| Cenário | Status HTTP | Mensagem de Erro / Comportamento |
| --- | --- | --- |
| **CPF/Email Duplicado** | `409 Conflict` | `"erro": "Já cadastrado no sistema."` |
| **Atribuição Inválida** | `422 Unprocessable` | `"erro": "Só é possível atribuir um motorista para entrega recém criada."` |
| **Motorista Inativo** | `422 Unprocessable` | `"erro": "Motorista inativo."` |
| **Acesso Restrito (RBAC)** | `403 Forbidden` | `"erro": "Acesso negado"` (Redirecionamento com Flash no painel) |
| **Token Ausente/Inválido** | `401 Unauthorized` | `"erro": "Token não fornecido / inválido"` |

---

## Como Rodar os Testes (E2E)

O projeto conta com testes automatizados de fluxo (End-to-End) gerenciados pelo **Playwright**, operando em um ambiente de banco de dados isolado via `.env.test`.

Para executar a suíte de testes com a interface gráfica do navegador ativada:

```bash
npm run test:e2e -- --headed

```

Para executar em modo headless (silencioso, ideal para CI/CD):

```bash
npm run test:e2e

```

---

## Diagrama de Dependências

A aplicação segue o princípio da **Inversão de Dependência**, onde os services dependem de abstrações (contratos/interfaces) e não de classes concretas.

```text
[ Database ]
     ▼
[ EntregasRepository ] <----- Contrato: IEntregasRepository
[ MotoristasRepository ] <--- Contrato: IMotoristasRepository
     ▼
[ EntregasService ] <------- Recebe Repositories via Constructor
[ MotoristasService ] <----- Recebe Repository via Constructor
     ▼
[ Controllers ] <----------- Orquestram inputs e validam permissões (JWT)

```