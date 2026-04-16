CREATE TABLE IF NOT EXISTS motoristas(
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    placa_veiculo VARCHAR(20) NOT NULL,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    status VARCHAR(10) NOT NULL CHECK (status IN ('ATIVO', 'INATIVO'))
);

CREATE TABLE IF NOT EXISTS entregas(
    id SERIAL PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    origem VARCHAR(120) NOT NULL,
    destino VARCHAR(120) NOT NULL,
    status VARCHAR(15) NOT NULL CHECK(status IN ('CRIADA', 'EM_TRANSITO','ENTREGUE','CANCELADA'))
);

CREATE TABLE IF NOT EXISTS eventos_entrega (
    id SERIAL PRIMARY KEY,
    entrega_id INTEGER NOT NULL,
    data_evento VARCHAR(20) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    motorista_id INTEGER,
    CONSTRAINT fk_evento_entrega FOREIGN KEY (entrega_id) REFERENCES entregas(id) ON DELETE CASCADE,
    CONSTRAINT fk_evento_motorista FOREIGN KEY (motorista_id) REFERENCES motoristas(id)
);
