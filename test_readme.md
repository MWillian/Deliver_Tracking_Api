
# 🧪 Documentação de Testes - Delivery Tracker

Este documento detalha a arquitetura, configuração e execução da suíte completa de testes automatizados do sistema Delivery Tracker.

A estratégia de qualidade do projeto foi baseada na **Pirâmide de Testes**, garantindo desde a validação isolada de regras de negócio (Unitários), passando pela comunicação entre rotas e banco de dados (Integração), até chegar à simulação real do usuário na interface gráfica (End-to-End).


## ⚙️ Configuração do Ambiente de Testes

Para garantir que os testes não poluam o banco de dados de desenvolvimento ou produção, o projeto utiliza um ambiente isolado (Sandboxing).

### 1. Variáveis de Ambiente

Certifique-se de que o arquivo `.env.test` existe na raiz do projeto. Ele instrui o Jest e o Playwright a usarem um banco de dados temporário e uma porta exclusiva para testes.

**Exemplo de `.env.test`:**

```
# Porta exclusiva para o servidor de testes (evita conflito com o modo dev)
PORT=3001
NODE_ENV=test

# Banco de dados temporário (SQLite)
DATABASE_URL="file:./test.db"

# Chave JWT de testes
JWT_SECRET="segredo_de_teste_123"

```

### 2. Preparação do Banco de Dados

Antes de rodar a suíte pela primeira vez, é necessário gerar a tabela do banco de testes:

```bash
# Sobe as tabelas do Prisma apontando para o arquivo test.db
npx dotenv -e .env.test -- npx prisma db push

```

---

## 🚀 Como Executar os Testes

O projeto possui scripts facilitadores no `package.json` para executar diferentes camadas da pirâmide de testes.

1. `"npm test"`: Executa todos os testes Unitários e de Integração (API e Services).
2. `"npm run test:coverage"`: Executa os testes do Jest e gera o relatório detalhado de cobertura de código.
3. `"npm run test:e2e"`: Executa a suíte do Playwright, abrindo o navegador em segundo plano para testar o Frontend.
4. `"npm run test:e2e -- --headed"`: Executa o Playwright no modo visual (Abre o navegador e mostra o robô clicando).

> **Dica:** Ao executar os testes E2E, garanta que o servidor de desenvolvimento **não** esteja rodando para evitar conflito de portas.

---

## 📂 Estrutura de Diretórios (`/tests`)


```
A suíte de testes foi arquitetada de forma semântica, isolando as configurações globais na raiz do projeto e dividindo as responsabilidades lógicas dentro do diretório `/tests`.

```text

📦 Raiz do Projeto
 ┣ 📜 .env.test                 # Variáveis de ambiente exclusivas para o ambiente de testes
 ┣ 📜 jest.config.js            # Configurações gerais do framework de backend (Jest)
 ┣ 📜 playwright.config.js      # Configurações do robô de automação frontend (Playwright)
 ┣ 🛢️ test.db                   # Banco de dados SQLite isolado (Sandboxing)
 ┗ 📂 tests                     # Diretório central da suíte de qualidade
    ┣ 📂 e2e                    # 🤖 Testes End-to-End (Simulação de Usuário)
    ┃  ┣ 📂 pages               # Padrão POM (Page Object Model) para mapear telas
    ┃  ┃  ┣ 📜 EntregasPage.js
    ┃  ┃  ┗ 📜 LoginPage.js
    ┃  ┣ 📜 entregas.spec.js    # Fluxos visuais da tabela de entregas e botão de logout
    ┃  ┗ 📜 login.spec.js       # Fluxos visuais de autenticação, alertas e redirecionamentos
    ┃
    ┣ 📂 integration            # 🔗 Testes de Integração (API e Banco de Dados)
    ┃  ┣ 📜 auth.routes.test.js     # Disparos contra os endpoints de Login e Registro
    ┃  ┗ 📜 entregas.routes.test.js # Disparos validando autenticação, RBAC e IDOR em rotas
    ┃
    ┣ 📂 unit                   # 🧩 Testes Unitários (Lógica de Negócio e Mocks)
    ┃  ┣ 📂 middlewares         
    ┃  ┃  ┗ 📜 erros.middlewares.test.js # Validação de formatação de erros (HTML, JSON, 404, 500)
    ┃  ┗ 📂 services            
    ┃     ┣ 📜 AuthService.test.js       # Regras de geração de token e hash de senhas
    ┃     ┣ 📜 EntregasService.test.js   # Regras de transição de status e atribuições
    ┃     ┗ 📜 MotoristasService.test.js # Validações de CPF, status e filtros cruzados
    ┃
    ┗ 📜 setup.js               # Hook Global do Jest (Limpa o banco antes e depois dos testes)

```

### O que compõe cada camada?

* **Arquivos Globais:** Garantem que os testes rodem em um ambiente estéril (`test.db`), sem risco de apagar dados reais do sistema em desenvolvimento.
* **/unit:** A base da pirâmide. Testa os serviços e middlewares isoladamente, injetando repositórios falsos (Mocks) para forçar cenários de sucesso e erro instantaneamente.
* **/integration:** O meio da pirâmide. Sobe a aplicação Express em memória e faz requisições HTTP reais usando o `Supertest` para validar permissões, middlewares e respostas da API.
* **/e2e:** O topo da pirâmide. O Playwright assume o controle do navegador, acessando a interface gráfica (EJS) para validar se o usuário consegue interagir com os formulários e tabelas corretamente.


## 🧩 Testes Unitários

Os testes unitários validam a lógica interna das classes de serviço sem a necessidade de acessar o banco de dados real. Isso garante uma execução ultrarrápida e permite testar cenários de erro complexos isoladamente.

**Ferramentas Utilizadas:** `Jest` (Framework) e `Jest Mocks` (Simulação de dependências).

### 1. `AuthService.test.js`
Responsável por validar as regras de segurança mais críticas da aplicação: o registro de novos usuários e o fluxo de login. Isola as dependências através do mock do banco de dados, da criptografia (`bcrypt`) e do gerador de tokens (`jwt.js`).

* **`registrar`**: Impede o cadastro de e-mails duplicados (Erro `409`), garante a criptografia da senha via `bcrypt` para não salvar em texto plano, e remove o campo de senha do objeto retornado ao Frontend por questões de segurança.
* **`login`**: Mantém a segurança do sistema retornando erro genérico (`401` - Credenciais inválidas) para não expor a existência de e-mails fantasmas ou qual parte da credencial (e-mail ou senha) estava incorreta. Assegura a emissão conjunta do `accessToken` e `refreshToken` no sucesso.

### 2. `EntregasService.test.js`
Valida as lógicas primárias de negócio do sistema e o ciclo de vida das entregas, utilizando repositórios falsos (`criarEntregasRepoFalso` e `criarMotoristasRepoFalso`) para manipular os cenários lógicos.

* **Criação (`criar`)**: Rejeita criações sem os campos obrigatórios (Erro `400`), impede logicamente que a `Origem` seja igual ao `Destino` e bloqueia via banco a criação de pacotes ativos duplicados (Erro `409`). Verifica se o histórico inicial é inserido com a descrição `CRIADA`.
* **Transições de Status (`avancarStatus`, `atualizarStatus`, `cancelarEntrega`)**: Restringe o fluxo linear de status, impedindo retrocessos (ex: voltar de `ENTREGUE` para `EM_TRANSITO`) e pulos (de `CRIADA` direto para `ENTREGUE`), gerando o Erro `422`. Impede também o cancelamento de entregas já finalizadas e injeta automaticamente a data de entrega após sucesso no avanço final.
* **Consultas (`listarTodos`, `listarPorStatus`, `buscarPorId`, `obterHistorico`)**: Valida o acesso correto aos dados pelo ID e proíbe a consulta filtrada utilizando strings de status inexistentes (Erro `400`).
* **Atribuição de Motoristas (`atribuirEntrega`)**: Bloqueia a atribuição caso os perfis consultados não existam (`404`), se a entrega já saiu da fase `CRIADA` (`422`) ou se o motorista acionado estiver `INATIVO`. Alimenta dinamicamente o histórico detalhando se o evento trata-se de uma "Atribuição de primeiro motorista" ou de uma "Substituição".

### 3. `MotoristasService.test.js`

Este arquivo valida todas as regras envolvendo o cadastro, alteração de status e vinculação de entregas aos motoristas da plataforma. Assim como os serviços anteriores, a comunicação com o Prisma foi isolada utilizando instâncias mockadas dos repositórios (`motoristasRepoMock` e `entregasRepoMock`).

Os principais cenários garantidos por esta suíte incluem:

#### Algoritmo de Validação de CPF (`validarCpf`)
O serviço possui uma etapa rígida de tratamento de dados sensíveis antes de qualquer interação com o banco:
* **Sanitização de Formato:** Testa se o serviço remove corretamente traços e pontos de um CPF formatado (ex: `123.456.789-10` vira `12345678910`).
* **Regras de Exceção:** Força e verifica os lançamentos do erro `400` caso o usuário envie letras, caracteres especiais não permitidos (ex: `@`) ou tamanhos inválidos (diferente de 11 dígitos numéricos).

#### Criação e Inativação (`criar` e `inativar`)
Garante os requisitos de negócio e consistência dos perfis de frota:
* **Requisitos Mínimos:** Exige a presença de `nome`, `cpf` e `placaVeiculo`, validando se o nome possui no mínimo 2 caracteres.
* **Bloqueio de Duplicidade:** Simula a existência de um motorista e impede que um novo registro seja criado com o mesmo CPF (`Erro 409`), assegurando que a validação de CPF ocorra com a string já higienizada.
* **Regra de Desligamento:** A inativação atua com defesa. Se for tentada a inativação de um motorista cujo status já seja `INATIVO`, o serviço lança um `AppError 422`, bloqueando ações redundantes.

#### Filtros e Consultas (`listarComFiltros` e `listarEntregasPorId`)
Garante as permissões de consulta e cruzamento de dados de relatórios:
* **Busca Pessoal e Cruzada:** Verifica se é possível listar todas as entregas já atribuídas a um motorista específico consultando o array de históricos.
* **Validação de Parâmetros de Filtro:** Bloqueia strings inválidas ou maliciosas na URL quando o sistema busca entregas (`CRIADA`, `EM_TRANSITO`, etc.) ou filtra status de motoristas (`ATIVO`, `INATIVO`). Exceções de *Bad Request* (`400`) são disparadas se os *enums* não coincidirem.

### 4. `erros.middlewares.test.js`

Este arquivo valida a camada de proteção final da aplicação, garantindo que exceções não tratadas não quebrem o servidor e que as mensagens de erro sejam formatadas adequadamente conforme o cliente (Navegador ou API). Os objetos do Express (`req`, `res`, `next`) foram mockados para simular requisições HTTP.

Abaixo estão os cenários garantidos por esta suíte:

#### Tratamento de Rotas Inexistentes (`naoEncontrado`)
* **Captura de 404:** Simula uma requisição a uma rota fantasma e valida se o middleware intercepta a chamada, definindo o status HTTP como `404` e acionando o motor de template (`res.render`) para exibir a página amigável `erros/404.ejs`.

#### Conversão de Formatos e Segurança (`middlewareDeErros`)
* **Negociação de Conteúdo (Content Negotiation):** Simula requisições com o header `Accept: application/json` e garante que as exceções conhecidas (`AppError`) sejam convertidas em objetos JSON, retornando o `statusCode` adequado para o consumo da API.
* **Renderização para Navegadores:** Altera o header para `text/html` e verifica se o mesmo `AppError` aciona a renderização da página visual (`erros/erro.ejs`), passando o código e a mensagem para a interface gráfica.
* **Ocultação de Rastros em Produção:** Simula um erro grave de servidor (`Erro 500`) em ambiente de desenvolvimento, permitindo que a mensagem técnica (ex: "Banco de dados caiu") chegue à tela para facilitar o debug. Em seguida, altera a variável global `NODE_ENV` para `production` e assegura que a mensagem técnica seja substituída por uma genérica ("Ocorreu um erro inesperado..."), evitando o vazamento de infraestrutura para o usuário final.
* **Auditoria de Logs:** Força a variável de ambiente para `development` e espiona (`jest.spyOn`) a função `console.error` para garantir que o erro seja logado no terminal do servidor, mas sem poluir a execução contínua dos testes.


## 🔗 Testes de Integração 

Diferente dos testes unitários, a camada de integração valida o fluxo completo da requisição, desde o momento em que a rota do `Express` é acionada até o commit final no banco de dados (`Prisma`), passando pelos middlewares e controladores. 

**Ferramentas Utilizadas:** `Supertest` (Cliente HTTP simulado) e `Prisma Client` apontando para o banco isolado (`test.db`).

### 1. Rotas de Autenticação (`/api/auth`)

O teste de integração da rota de autenticação comprova que os serviços e as rotas conversam corretamente e gravam dados verídicos no banco.

#### Cadastro (`POST /api/auth/register`)
* **Fluxo de Sucesso (Status 201):** Dispara uma requisição HTTP real para a rota, confirmando que o Prisma gravou a linha no banco de dados e que a API omitiu a senha no retorno do Payload.
* **Validação de Entrada (Status 400):** Submete um JSON com uma senha menor que 8 caracteres e garante que a requisição seja barrada na borda da API.
* **Consistência de Banco (Status 409):** Injeta um usuário forçado no `test.db` e tenta disparar a rota criando um usuário com o mesmo e-mail, atestando a interceptação de duplicidade.

#### Autenticação (`POST /api/auth/login`)
* **Fluxo de Sucesso (Status 200):** Cria um usuário com uma senha explicitamente criptografada pelo `bcrypt` e simula um request de login, garantindo que o servidor Express devolva o pacote completo (`accessToken` e `refreshToken`).
* **Blindagem de Retorno (Status 401):** Efetua duas chamadas HTTP separadas: uma com e-mail correto e senha errada, e outra com e-mail inexistente. O teste prova que a API devolve o exato mesmo texto ("Credenciais inválidas") em ambos os cenários, comprovando a eficácia contra ataques de varredura.

### 2. Rotas de Entregas (`/api/entregas`)

O teste de integração da rota de entregas não foca nas regras de negócio (que já foram cobertas pelos testes unitários), mas sim nas **camadas de proteção, Middlewares e Autorização (RBAC)**, garantindo que o servidor rejeite requisições maliciosas ou não autorizadas antes mesmo de atingirem os controladores.

Para validar o Controle de Acesso Baseado em Papéis (RBAC), o script popula o banco com um `OPERADOR` e um `GESTOR`, gerando `JWTs` reais assinados com o `JWT_SECRET` do ambiente de testes.

#### Segurança de Autenticação (Middlewares JWT)
* **Barreira de Acesso (Status 401):** Dispara uma requisição de leitura (`GET /api/entregas`) sem nenhum token no `header`. O teste comprova que o middleware bloqueia a invasão imediatamente informando "Token não fornecido".
* **Impedimento de Falsificação (Status 401):** Tenta injetar uma string maliciosa (`'adulterado123'`) no final de um token válido. O servidor intercepta a falha de assinatura criptográfica e rejeita o acesso.
* **Bloqueio de Sessão Expirada:** Assina propositalmente um token com tempo de expiração negativo (`{ expiresIn: -1 }`). O teste garante que o middleware de autenticação intercepta a data vencida e retorna `401` avisando sobre a expiração.

#### Controle de Acesso Baseado em Papéis (RBAC)
* **Prevenção de Escalonamento de Privilégio (Status 403):** Utiliza o token válido de um usuário comum (`OPERADOR`) e tenta forçar uma requisição do tipo `PATCH` na rota crítica de cancelamento de pacotes (`/api/entregas/:id/cancelar`). O teste garante que a requisição seja barrada com o status `403 Acesso Negado`.
* **Fluxo Autorizado (Status 200):** Cria de fato uma entrega no banco de dados e repete a mesma requisição `PATCH`, mas desta vez portando o token do `GESTOR`. O teste atesta que a API não barra a chamada e efetiva a ação com status `200`.


## 🤖 Testes End-to-End 

Os testes E2E simulam a experiência real do usuário no navegador. Ao contrário dos testes unitários, aqui validamos a integração total: frontend (EJS), backend (rotas), autenticação e persistência no banco de dados.

**Ferramentas Utilizadas:** `Playwright` e padrão `Page Object Model (POM)`.

### 1. Estratégia POM 
Para evitar repetição de código e facilitar a manutenção, utilizamos o padrão **POM**. Cada tela do sistema possui uma classe dedicada que mapeia os elementos (via `data-testid`) e encapsula as ações do usuário.

* **Exemplo: `LoginPage.js`**: Abstrai a interação com os inputs de e-mail/senha e o botão de login. Se o ID de um campo na tela mudar, ajustamos em um único local, e todos os testes que utilizam a `LoginPage` continuam funcionando automaticamente.

### 2. Fluxos Automação (`login.spec.js`)
A suíte de login testa a robustez da segurança na camada de interface:

* **Login Inválido:** Verifica se, ao inserir credenciais incorretas, o sistema permanece na página de login e exibe o alerta de erro apropriado, validando a tratativa de falhas via frontend.
* **Fluxo de Sucesso:** Valida a integração completa: usuário insere credenciais, o sistema processa a autenticação, gera o token e o Playwright aguarda o redirecionamento para a rota protegida (`/painel`).
* **Proteção de Rotas:** Testa o comportamento "defensivo" do frontend. Ao tentar navegar diretamente para `/painel` sem estar logado, o Playwright confirma que o middleware de sessão redireciona o usuário para o `/login`, garantindo que não haja acesso à área administrativa sem autenticação.  
  
> **Nota:** Todos os testes E2E realizam um setup de banco de dados (`beforeAll`) criando um usuário temporário no `test.db` com senha hasheada, garantindo um ambiente limpo e previsível para cada execução.

### 3. Fluxos de Dados e Sessão (`entregas.spec.js`)
Esta suíte valida a renderização dinâmica de dados vindos do banco de dados e a integridade da sessão do usuário:

* **Persistência e Exibição:** O teste inicia injetando uma "Entrega de Teste" diretamente via Prisma. O Playwright então acessa a interface de listagem e verifica se o componente de tabela (`tabela-entregas`) está visível e se o conteúdo ("Pacote Playwright") foi renderizado corretamente na tela, validando a conexão real entre **Banco ➔ Backend ➔ Frontend**.
* **Gerenciamento de Sessão (Logout):** Valida o ciclo completo de encerramento de sessão. Ao clicar no botão de logout, o teste garante que o usuário seja removido da área protegida e redirecionado para a página de `/login`, fechando o ciclo de segurança do sistema.
---

## 📊 Relatório de Cobertura (Coverage)

A cobertura de código (Code Coverage) é a métrica que define qual porcentagem do código-fonte foi efetivamente executada e validada pela suíte de testes. O projeto utilizou o gerador de relatórios embutido no Jest (`--coverage`) para atingir e superar as metas rigorosas estabelecidas para a camada de serviços e middlewares.

### Metas Atingidas e Superadas

A barreira de qualidade mínima exigida para a aprovação dos testes foi configurada para **80% de cobertura nos serviços** e **85% nos middlewares**. O resultado final demonstrou a robustez da suíte:

* **`src/services/`**: Exigido 80% ➔ **Atingido 94.3%**
* **`src/middlewares/`**: Exigido 85% ➔ **Atingido 97.05%**

### Análise Detalhada dos Resultados

O console reportou o seguinte panorama após a injeção dos cenários de teste unitário (`npm run test:coverage`):

```text
----------------------------------------|---------|----------|---------|---------|-------------------
File                                    | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------------------------------------|---------|----------|---------|---------|-------------------
 src/middlewares                        |   97.05 |     92.3 |     100 |   97.05 |                   
  autenticacao.middleware.js            |   94.73 |    91.66 |     100 |   94.73 | 24                
  erros.middlewares.js                  |     100 |    91.66 |     100 |     100 | 20                
  locals.middleware.js                  |     100 |      100 |     100 |     100 |                   
 src/services                           |    94.3 |    91.75 |      90 |   94.19 |                   
  auth.service.js                       |      92 |    84.21 |     100 |      92 | 14,41             
  entregas.services.js                  |     100 |    97.56 |     100 |     100 | 156               
  motoristas.service.js                 |     100 |    94.28 |     100 |     100 | 47,74             
----------------------------------------|---------|----------|---------|---------|-------------------
```

### Principais Ganhos e Estratégias de Cobertura

1.  **Mocking Extensivo nos Services:**
    * **EntregasService (100% de Stmts):** Todas as funções foram mockadas, garantindo que exceções complexas, como proibições de retrocesso de status (ex: não permitir voltar uma entrega `ENTREGUE` para `EM_TRANSITO`) e regras de atribuição de motorista (primeira viagem vs. substituição), fossem lidas e validadadas.
    * **MotoristasService (100% de Stmts):** A cobertura máxima foi alcançada testando todas as variações da função `validarCpf` (letras, caracteres especiais, tamanho inválido) e as validações de status (bloqueio de inativação de motoristas já inativos).
2.  **Middlewares de Erro Blindados:**
    * Para ultrapassar a meta de 85%, foi construída uma suíte específica (`erros.middlewares.test.js`) que não apenas testou requisições de API (`application/json`), mas forçou requisições do navegador (`text/html`) para garantir que os retornos das páginas EJS (404 e 500) estivessem funcionando até mesmo em variáveis de ambiente simulando produção (`process.env.NODE_ENV = 'production'`).
3.  **Branches e Uncovered Lines:**
    * As poucas linhas listadas como "Uncovered" (não cobertas) referem-se a verificações de segurança em blocos de Catch genéricos ou validações redundantes que o próprio framework (como o Prisma) já cobre nativamente, não comprometendo a lógica principal.
