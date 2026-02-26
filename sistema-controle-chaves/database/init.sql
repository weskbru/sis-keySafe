-- 1. Tabela de Setores
CREATE TABLE setor (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) UNIQUE NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
);

-- 2. Tabela de Pessoas
CREATE TABLE pessoa (
    id SERIAL PRIMARY KEY,
    nome_completo VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    tipo_vinculo VARCHAR(20) NOT NULL, -- SERVIDOR, TERCEIRIZADO, ESTAGIARIO, VISITANTE
    setor_id INTEGER REFERENCES setor(id) ON DELETE SET NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Chaves
CREATE TABLE chave (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    descricao VARCHAR(200),
    status VARCHAR(20) DEFAULT 'DISPONIVEL', -- DISPONIVEL, EMPRESTADA, MANUTENCAO
    ativo BOOLEAN DEFAULT TRUE
);

-- 4. Tabela de Empréstimos (Transacional)
CREATE TABLE emprestimo (
    id SERIAL PRIMARY KEY,
    chave_id INTEGER NOT NULL REFERENCES chave(id) ON DELETE RESTRICT,
    pessoa_id INTEGER NOT NULL REFERENCES pessoa(id) ON DELETE RESTRICT,
    data_retirada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_devolucao TIMESTAMP,
    observacao TEXT
);

-- Carga inicial de dados
INSERT INTO setor (nome) VALUES ('TI'), ('Manutenção'), ('Administrativo');

INSERT INTO chave (codigo, descricao) VALUES
('TI-01', 'Sala de Servidores'),
('MAN-01', 'Almoxarifado de Ferramentas'),
('GERAL-01', 'Porta Principal');
