-- CreateTable
CREATE TABLE "entregas" (
    "id" SERIAL NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "origem" VARCHAR(120) NOT NULL,
    "destino" VARCHAR(120) NOT NULL,
    "status" VARCHAR(15) NOT NULL,

    CONSTRAINT "entregas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "motoristas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "placa_veiculo" VARCHAR(20) NOT NULL,
    "cpf" VARCHAR(11) NOT NULL,
    "status" VARCHAR(10) NOT NULL,

    CONSTRAINT "motoristas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_entrega" (
    "id" SERIAL NOT NULL,
    "entrega_id" INTEGER NOT NULL,
    "data_evento" VARCHAR(20) NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "motorista_id" INTEGER,

    CONSTRAINT "eventos_entrega_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "motoristas_cpf_key" ON "motoristas"("cpf");

-- AddForeignKey
ALTER TABLE "eventos_entrega" ADD CONSTRAINT "eventos_entrega_entrega_id_fkey" FOREIGN KEY ("entrega_id") REFERENCES "entregas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_entrega" ADD CONSTRAINT "eventos_entrega_motorista_id_fkey" FOREIGN KEY ("motorista_id") REFERENCES "motoristas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
