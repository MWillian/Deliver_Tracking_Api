import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

beforeAll(async () => {
  const caminhoDoTeste = expect.getState().testPath || '';

  if (caminhoDoTeste.includes('integration')) {
    const { prisma } = await import('../src/config/database.js');
    
    await prisma.$connect();
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "usuarios" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "nome" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "senha" TEXT NOT NULL,
          "papel" TEXT NOT NULL DEFAULT 'OPERADOR',
          "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_email_key" ON "usuarios"("email");`);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "refresh_tokens" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "token" TEXT NOT NULL,
          "usuario_id" INTEGER NOT NULL,
          "expires_at" DATETIME NOT NULL,
          "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "refresh_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_token_key" ON "refresh_tokens"("token");`);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "entregas" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "descricao" TEXT NOT NULL,
          "origem" TEXT NOT NULL,
          "destino" TEXT NOT NULL,
          "status" TEXT NOT NULL,
          "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "criador_id" INTEGER,
          CONSTRAINT "entregas_criador_id_fkey" FOREIGN KEY ("criador_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "motoristas" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "nome" TEXT NOT NULL,
          "placa_veiculo" TEXT NOT NULL,
          "cpf" TEXT NOT NULL,
          "status" TEXT NOT NULL,
          "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "motoristas_cpf_key" ON "motoristas"("cpf");`);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "eventos_entrega" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "entrega_id" INTEGER NOT NULL,
          "data_evento" TEXT NOT NULL,
          "descricao" TEXT NOT NULL,
          "motorista_id" INTEGER,
          "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "eventos_entrega_entrega_id_fkey" FOREIGN KEY ("entrega_id") REFERENCES "entregas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "eventos_entrega_motorista_id_fkey" FOREIGN KEY ("motorista_id") REFERENCES "motoristas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
        );
      `);

    } catch (error) {
      console.error("Erro ao preparar tabelas de teste de forma nativa:", error);
    }
  }
});

afterAll(async () => {
  const caminhoDoTeste = expect.getState().testPath || '';
  
  if (caminhoDoTeste.includes('integration')) {
    const { prisma } = await import('../src/config/database.js');
    await prisma.$disconnect();
  }
});