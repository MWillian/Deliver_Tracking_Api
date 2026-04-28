-- CreateTable
CREATE TABLE "entregas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "descricao" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "motoristas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "placa_veiculo" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "eventos_entrega" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entrega_id" INTEGER NOT NULL,
    "data_evento" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "motorista_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "eventos_entrega_entrega_id_fkey" FOREIGN KEY ("entrega_id") REFERENCES "entregas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "eventos_entrega_motorista_id_fkey" FOREIGN KEY ("motorista_id") REFERENCES "motoristas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "motoristas_cpf_key" ON "motoristas"("cpf");
