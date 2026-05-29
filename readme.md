# Deliver Tracking API

Esta API foi desenvolvida para a gestão logística de entregas e motoristas, aplicando padrões de arquitetura avançados como **Repository Pattern** e **Inversão de Dependência**.

## Tecnologias e Arquitetura

- **Node.js + Express:** O framework Express é a base do servidor, responsável tanto pela criação das rotas da API REST quanto por gerenciar as rotas visuais. Ele orquestra os middlewares (arquivos estáticos, tratamento de erros) para o funcionamento completo da aplicação.
    
- **Server-Side Rendering (SSR):** Utilizando a engine **EJS**, as visualizações (telas) são pré-processadas no servidor (SSR). O servidor Express obtém os dados através dos *Controllers* e renderiza o HTML final mesclado a esses dados dinamicamente, enviando-os prontos para o cliente.
    
- **Banco de dados:** SQLite com Prisma ORM
    
- **Arquitetura:** Controller -> Service -> Repository
    
- **Design:** Inversão de Dependência (Dependency Injection) via interfaces/contratos.
    
    
## Como Executar

1. Instale as dependências:
    
    ```
    npm install
    ```

2. Configure o banco de dados:

  - Defina a variável `DATABASE_URL` no arquivo .env
  - Exemplo: `DATABASE_URL="file:./prisma/dev.db"`
  - Defina a variável `JWT_SECRET` no arquivo .env para a assinatura dos tokens (ex: `JWT_SECRET="sua_chave_secreta"`).

3. Execute as migrations:

  ```
  npx prisma migrate dev
  ```

4. (Opcional) Popular dados de demonstração:

  ```
  node prisma/seed.js
  ```
    
5. Inicie o servidor:
    
    ```
    npm start
    ```

## Dependências Necessárias

- `express`
- `ejs`
- `dotenv`
- `@prisma/client`
- `prisma`
- `jsonwebtoken`
- `bcrypt` ou equivalente (se aplicável ao AuthService)

## Autenticação via JWT

A API foi atualizada para aumentar a segurança restringindo o acesso através do protocolo de **JSON Web Token (JWT)**.
Todas as requisições para as rotas da API (`/api/entregas`, `/api/motoristas` e `/api/relatorios`) necessitam de um token JWT válido, que deve ser enviado no cabeçalho (*Header*) da requisição:

`Authorization: Bearer <seu_token_jwt_aqui>`

### Rotas de Autenticação (Abertas)

#### Registrar Usuário
- **URL:** `/api/auth/registrar` | **Método:** `POST`
- **Corpo:** `{"nome": "Nome", "email": "admin@teste.com", "senha": "123", "papel": "ADMIN"}` (Dependendo do schema)
- **Retorno:** Registra o usuário com a senha hasheada.

#### Login
- **URL:** `/api/auth/login` | **Método:** `POST`
- **Corpo:** `{"email": "admin@teste.com", "senha": "123"}`
- **Retorno (200 OK):**
    ```json
    {
      "message": "Login realizado com sucesso",
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
    }
    ```

## Interface Web e Painel Administrativo

Através do SSR implementado utilizando o EJS, a aplicação possui um Dashboard acessível pelo navegador. Todas as operações de gestão também podem ser feitas por lá através de uma interface amigável.

- **Acesso ao Painel:** Navegue para a rota `/painel` no seu navegador (exemplo: `http://localhost:3000/painel`).

### Documentação das Rotas do `/painel`

A área visual do painel é dividida em diferentes módulos para gerir facilmente a logística. 

#### Dashboard Inicial e Relatórios
- **`GET /painel/`**: Retorna a página inicial (dashboard principal).
- **`GET /painel/relatorios`**: Exibe o Dashboard completo de relatórios e métricas de desempenho.
- **`GET /painel/relatorios/entregas-por-status`**: Visualização das métricas de entrega distribuídas por status atual.
- **`GET /painel/relatorios/motoristas-ativos`**: Visualização dos motoristas em operação e quantidade de entregas em aberto.

#### Gestão de Entregas
- **`GET /painel/entregas`**: Interface para listar todas as entregas (suporta filtros de listagem e visualização de status).
- **`GET /painel/entregas/novo`**: Formulário web (EJS) para criar a solicitação de uma nova entrega.
- **`POST /painel/entregas`**: Ação de formulário que insere e persiste uma nova entrega.
- **`GET /painel/entregas/:id`**: Página de detalhes exclusivos de uma entrega específica contendo todo o histórico de eventos.
- **`GET /painel/atribuir-motorista`**: Tela em formulário para associar rapidamente um veículo/motorista em atividade à uma entrega `CRIADA`.
- **`POST /painel/atribuir-motorista`**: Ação que efetiva a atribuição informada no formulário.
- **`PATCH /painel/entregas/:id/avancar`**: Ação rápida (geralmente executada via botão no painel) que avança o status logístico da entrega.
- **`PATCH /painel/entregas/:id/cancelar`**: Ação para cancelar a entrega atual desde que viável pela regra de negócios.

#### Gestão de Motoristas
- **`GET /painel/motoristas`**: Interface completa de listagem de motoristas (Ativos e Inativos).
- **`GET /painel/motoristas/novo`**: Formulário web (EJS) de cadastro para adicionar novos motoristas.
- **`POST /painel/motoristas`**: Ação de formulário que persiste o cadastro.
- **`GET /painel/motoristas/:id`**: Interface de visualização detalhada de um motorista específico.
- **`GET /painel/motoristas/:id/inativar`**: Ação via interface que realiza a inativação ("Sotf delete") de um motorista.

##  Documentação da API Rest

**Base URL:** `/api`

###  Motoristas 

#### Criar Motorista

- **URL:** `/motoristas` | **Método:** `POST`
    
- **Corpo:** `{"nome": "Willian", "cpf": "111.222.333-44", "placaVeiculo": "OPA-1346"}`
    
- **Exemplo de Retorno (201):**
    
    ```
    {
      "id": 1,
      "nome": "Willian",
      "placaVeiculo": "OPA-1346",
      "cpf": "11122233344",
      "status": "ATIVO"
    }
    ```
    
- **Erro (409 Conflict):** `{"erro": "Cpf já cadastrado."}`
    

#### Listar Todos os Motoristas

- **URL:** `/motoristas` | **Método:** `GET`
- **Query params (opcional):** `status=ATIVO|INATIVO`
    
- **Exemplo de Retorno:** `[ { "id": 1, ... }, { "id": 2, ... } ]`
    

#### Buscar Motorista por ID

- **URL:** `/motoristas/:id` | **Método:** `GET`
    
- **Exemplo de Retorno:**
    
    ```
    {
      "id": 1,
      "nome": "Matheus",
      "placaVeiculo": "AAA-2223",
      "cpf": "12549383440",
      "status": "ATIVO"
    }
    ```
    

#### Inativar Motorista

- **URL:** `/motoristas/:id/inativar` | **Método:** `PATCH`
    
- **Exemplo de Retorno:** `{"mensagem": "Motorista desativado"}`
    

#### Listar Entregas por Motorista

- **URL:** `/motoristas/:id/entregas` | **Método:** `GET`
- **Query params (opcional):** `status=CRIADA|EM_TRANSITO|ENTREGUE|CANCELADA`
    
- **Exemplo de Retorno (com status=CRIADA):**
    
    ```
    [
      {
        "id": 2,
        "descricao": "Entrega de milho",
        "status": "CRIADA",
        "historico": [ ... ]
      }
    ]
    ```
    

### Entregas

#### Criar Entrega

- **URL:** `/entregas` | **Método:** `POST`
    
- **Exemplo de Retorno:** `{"id": 1, "descricao": "Entrega de milho", "status": "CRIADA", ...}`
    

#### Atribuir Motorista

- **URL:** `/entregas/:id/atribuir` | **Método:** `PATCH`
    
- **Corpo:** `{"motoristaId": "2"}`
    
- **Sucesso (200):** `{"mensagem": "Entrega atribuida com sucesso ao motorista."}`
    
- **Erro (422 - Status Inválido):** `{"erro": "Só é possível atribuir um motorista para uma entrega recém criada."}`
    
- **Erro (422 - Motorista Inativo):** `{"erro": "Motorista inativo."}`
    

#### Avançar Estado

- **URL:** `/entregas/:id/avancar` | **Método:** `PATCH`
    
- **Exemplo de Retorno:**
    
    ```
    {
      "mensagem": "Status avançado com sucesso",
      "entrega": {
        "id": 1,
        "status": "EM_TRANSITO",
        "historico": [
          { "data": "30/3/2026", "descricacao": "CRIADA" },
          { "data": "30/3/2026", "descricacao": "EM_TRANSITO" }
        ]
      }
    }
    ```
    

#### Histórico de Eventos
#### Listar Entregas (com filtros e paginação)

- **URL:** `/entregas` | **Método:** `GET`
- **Query params (opcional):**
  - `status=CRIADA|EM_TRANSITO|ENTREGUE|CANCELADA`
  - `createdDe=YYYY-MM-DD`
  - `createdAte=YYYY-MM-DD`
  - `page` (padrão 1)
  - `limit` (padrão 10, máximo 50)

- **Exemplo:** `/entregas?status=EM_TRANSITO&page=2&limit=5`

- **Exemplo de Retorno:**

    ```
    {
      "data": [ ... ],
      "total": 10,
      "page": 2,
      "limit": 5,
      "totalPages": 2
    }
    ```


- **URL:** `/entregas/:id/historico` | **Método:** `GET`
    
- **Exemplo de Retorno:**
    
    ```
    [
      { "data": "30/3/2026", "descricacao": "CRIADA" }
    ]
    ```

### Relatórios

#### Entregas por Status

- **URL:** `/relatorios/entregas-por-status` | **Método:** `GET`

- **Exemplo de Retorno:**

    ```
    { "CRIADA": 5, "EM_TRANSITO": 3, "ENTREGUE": 12, "CANCELADA": 2 }
    ```

#### Motoristas Ativos (entregas em aberto)

- **URL:** `/relatorios/motoristas-ativos` | **Método:** `GET`

- **Exemplo de Retorno:**

    ```
    [
      { "motoristaId": 1, "nome": "Willian", "entregasEmAberto": 2 }
    ]
    ```
    

## Regras de Negócio e Validações (Status HTTP)

| Cenário                          | Status HTTP         | Mensagem de Erro / Comportamento                                               |
| -------------------------------- | ------------------- | ------------------------------------------------------------------------------ |
| **CPF Duplicado**                | `409 Conflict`      | `"erro": "Cpf já cadastrado."`                                                 |
| **Atribuição Inválida (Status)** | `422 Unprocessable` | `"erro": "Só é possível atribuir um motorista para uma entrega recém criada."` |
| **Motorista Inativo**            | `422 Unprocessable` | `"erro": "Motorista inativo."`                                                 |
| **Histórico**                    | `200 OK`            | Eventos de atribuição e mudança de status são registrados automaticamente.     |

## Diagrama de Dependências

A aplicação segue o princípio da **Inversão de Dependência**, onde os services dependem de abstrações (contratos/interfaces) e não de classes concretas.

```
[ Database ]
     ▼
[ EntregasRepository ] <----- Contrato: IEntregasRepository
[ MotoristasRepository ] <--- Contrato: IMotoristasRepository
[ RelatoriosRepository ] <--- RelatoriosRepository
     ▼
[ EntregasService ] <------- Recebe Repositories via Constructor
[ MotoristasService ] <----- Recebe Repository via Constructor
[ RelatoriosService ] <----- Recebe Repository via Constructor
     ▼
[ Controllers ] <----------- Orquestram os inputs/outputs
```

### Testes no Postman

Uma coleção completa do Postman com todos os cenários de sucesso e erro (409, 422, 404) está disponível na pasta `/postman` do repositório.
