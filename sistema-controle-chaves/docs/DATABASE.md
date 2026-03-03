# Documentação do Banco de Dados — Sistema de Controle de Chaves (AEB)

**Versão:** 1.0
**Data:** 2026-03-03
**Sistema:** Sistema de Controle de Chaves da Agência Espacial Brasileira
**Engine:** PostgreSQL 15
**Framework ORM:** Django 5 (django.db.backends.postgresql)
**Timezone:** America/Sao_Paulo

---

## 1. Visão Geral

O sistema controla o empréstimo e devolução de chaves físicas entre servidores e prestadores de serviço da AEB. O banco possui **4 tabelas de negócio** mais as tabelas padrão do Django (auth_user, django_migrations, etc.).

---

## 2. Diagrama Entidade-Relacionamento (ER)

```
┌──────────────────┐         ┌──────────────────────────────────────────────┐
│      SETOR       │         │                   PESSOA                     │
├──────────────────┤         ├──────────────────────────────────────────────┤
│ PK id            │◄────┐   │ PK id                                        │
│    nome  UNQ     │     │   │    nome_completo                             │
│    ativo         │     └───│ FK setor_id  → setor.id  ON DELETE SET NULL  │
└──────────────────┘         │    cpf  UNQ                                  │
                             │    tipo_vinculo  {SERVIDOR, PRESTADOR}       │
                             │    foto                                      │
                             │    telefone                                  │
                             │    observacao                                │
                             │    ativo                                     │
                             │    criado_em                                 │
                             │    atualizado_em                             │
                             └──────────────────┬───────────────────────────┘
                                                │ ON DELETE RESTRICT
                                                │
┌─────────────────────────────────┐             │
│             CHAVE               │             │
├─────────────────────────────────┤             ▼
│ PK id                           │   ┌─────────────────────────────────────┐
│    codigo  UNQ                  │   │             EMPRESTIMO              │
│    descricao                    │   ├─────────────────────────────────────┤
│    localizacao                  │   │ PK id                               │
│    status  {DISPONIVEL,         │◄──│ FK chave_id  → chave.id  RESTRICT   │
│             EMPRESTADA,         │   │ FK pessoa_id → pessoa.id RESTRICT   │
│             MANUTENCAO}         │   │    data_retirada  (auto)            │
│    permitir_servidor            │   │    data_prevista_devolucao  NULL    │
│    permitir_prestador           │   │    data_devolucao  NULL             │
│    ativo                        │   │    observacao  NULL                 │
│    deleted_at  NULL  IDX        │   └─────────────────────────────────────┘
└─────────────────────────────────┘
```

---

## 3. Diagrama de Classes (Modelo de Domínio)

```
┌────────────────────────────────────────────┐
│                  Setor                     │
├────────────────────────────────────────────┤
│ + id: BigAutoField (PK)                    │
│ + nome: CharField(100) [UNIQUE]            │
│ + ativo: BooleanField = True               │
├────────────────────────────────────────────┤
│ + __str__(): str                           │
└────────────────────────────────────────────┘
                      ▲
                      │  0..* pessoas
                      │  FK setor_id (SET NULL)
                      │
┌────────────────────────────────────────────┐
│                  Pessoa                    │
├────────────────────────────────────────────┤
│ + id: BigAutoField (PK)                    │
│ + nome_completo: CharField(150)            │
│ + cpf: CharField(14) [UNIQUE]              │
│   formato: XXX.XXX.XXX-XX                  │
│ + tipo_vinculo: CharField(20)              │
│   choices: SERVIDOR | PRESTADOR            │
│ + setor: FK → Setor [NULL]                 │
│ + foto: ImageField [NULL]                  │
│   upload_to: 'pessoas/'                    │
│ + telefone: CharField(20) = ''             │
│ + observacao: TextField = ''               │
│ + ativo: BooleanField = True               │
│ + criado_em: DateTimeField (auto_add)      │
│ + atualizado_em: DateTimeField (auto)      │
├────────────────────────────────────────────┤
│ + __str__(): str                           │
└────────────────────────────────────────────┘
                      ▲
                      │  0..* emprestimos
                      │  FK pessoa_id (RESTRICT)
                      │
┌────────────────────────────────────────────┐      ┌────────────────────────────────────────────┐
│               Emprestimo                   │      │                  Chave                     │
├────────────────────────────────────────────┤      ├────────────────────────────────────────────┤
│ + id: BigAutoField (PK)                    │      │ + id: BigAutoField (PK)                    │
│ + chave: FK → Chave (RESTRICT)             │◄─────│ + codigo: CharField(50) [UNIQUE]           │
│ + pessoa: FK → Pessoa (RESTRICT)           │      │ + descricao: CharField(200) = ''           │
│ + data_retirada: DateTimeField (auto_add)  │      │ + localizacao: CharField(100) = ''         │
│ + data_prevista_devolucao: DTField [NULL]  │      │ + status: CharField(20)                    │
│ + data_devolucao: DateTimeField [NULL]     │      │   choices: DISPONIVEL|EMPRESTADA|MANUTENCAO│
│ + observacao: TextField [NULL]             │      │   default: DISPONIVEL                      │
├────────────────────────────────────────────┤      │ + permitir_servidor: BooleanField = True   │
│ + vencido: bool (property)                 │      │ + permitir_prestador: BooleanField = True  │
│   True se data_devolucao IS NULL AND       │      │ + ativo: BooleanField = True               │
│   data_prevista_devolucao < NOW()          │      │ + deleted_at: DateTimeField [NULL, IDX]    │
│ + __str__(): str                           │      ├────────────────────────────────────────────┤
└────────────────────────────────────────────┘      │ + status_calculado: str (property)         │
                                                    │   Nunca persiste VENCIDO no banco.         │
                                                    │   Calculado via emprestimos ativos.        │
                                                    │ + __str__(): str                           │
                                                    └────────────────────────────────────────────┘
```

---

## 4. Dicionário de Dados

### 4.1 Tabela `setor`

| Coluna  | Tipo          | Nulo | Padrão | Restrições | Descrição                      |
|---------|---------------|------|--------|------------|--------------------------------|
| `id`    | BIGSERIAL     | NÃO  | auto   | PK         | Identificador único            |
| `nome`  | VARCHAR(100)  | NÃO  | —      | UNIQUE     | Nome do setor/coordenação AEB  |
| `ativo` | BOOLEAN       | NÃO  | TRUE   |            | Indica se o setor está ativo   |

**Índices:**
- `PRIMARY KEY (id)`
- `UNIQUE (nome)`

---

### 4.2 Tabela `pessoa`

| Coluna             | Tipo              | Nulo | Padrão | Restrições                       | Descrição                                     |
|--------------------|-------------------|------|--------|----------------------------------|-----------------------------------------------|
| `id`               | BIGSERIAL         | NÃO  | auto   | PK                               | Identificador único                           |
| `nome_completo`    | VARCHAR(150)      | NÃO  | —      |                                  | Nome completo (normalizado: title case)       |
| `cpf`              | VARCHAR(14)       | NÃO  | —      | UNIQUE                           | CPF no formato XXX.XXX.XXX-XX                 |
| `tipo_vinculo`     | VARCHAR(20)       | NÃO  | —      | CHECK IN ('SERVIDOR','PRESTADOR')| Tipo de vínculo com a AEB                    |
| `setor_id`         | BIGINT            | SIM  | NULL   | FK → setor.id ON DELETE SET NULL | Setor ao qual pertence (obrigatório p/ SERVIDOR)|
| `foto`             | VARCHAR(255)      | SIM  | NULL   |                                  | Caminho relativo da foto (media/pessoas/)     |
| `telefone`         | VARCHAR(20)       | NÃO  | ''     |                                  | Telefone de contato                           |
| `observacao`       | TEXT              | NÃO  | ''     |                                  | Informações adicionais (ex: empresa)          |
| `ativo`            | BOOLEAN           | NÃO  | TRUE   |                                  | Indica se a pessoa pode retirar chaves        |
| `criado_em`        | TIMESTAMPTZ       | NÃO  | NOW()  |                                  | Timestamp de criação (preenchido automaticamente) |
| `atualizado_em`    | TIMESTAMPTZ       | NÃO  | NOW()  |                                  | Timestamp da última atualização               |

**Índices:**
- `PRIMARY KEY (id)`
- `UNIQUE (cpf)`
- `INDEX (setor_id)`  ← gerado pela FK

**Regras de negócio:**
- `tipo_vinculo = 'SERVIDOR'` exige `setor_id IS NOT NULL` (validado no serializer)
- `ativo = FALSE` impede a pessoa de realizar novos empréstimos
- CPF validado por regex: `^\d{3}\.\d{3}\.\d{3}-\d{2}$`
- `nome_completo` é normalizado para Title Case no momento do cadastro

---

### 4.3 Tabela `chave`

| Coluna               | Tipo              | Nulo | Padrão      | Restrições                            | Descrição                                        |
|----------------------|-------------------|------|-------------|---------------------------------------|--------------------------------------------------|
| `id`                 | BIGSERIAL         | NÃO  | auto        | PK                                    | Identificador único                              |
| `codigo`             | VARCHAR(50)       | NÃO  | —           | UNIQUE                                | Código da chave (normalizado: UPPER CASE)        |
| `descricao`          | VARCHAR(200)      | NÃO  | ''          |                                       | Descrição da sala/ambiente                       |
| `localizacao`        | VARCHAR(100)      | NÃO  | ''          |                                       | Bloco/localização física                         |
| `status`             | VARCHAR(20)       | NÃO  | 'DISPONIVEL'| CHECK IN ('DISPONIVEL','EMPRESTADA','MANUTENCAO') | Status persistido no banco         |
| `permitir_servidor`  | BOOLEAN           | NÃO  | TRUE        |                                       | Se servidores podem retirar esta chave           |
| `permitir_prestador` | BOOLEAN           | NÃO  | TRUE        |                                       | Se prestadores podem retirar esta chave          |
| `ativo`              | BOOLEAN           | NÃO  | TRUE        |                                       | Se a chave está disponível para o sistema        |
| `deleted_at`         | TIMESTAMPTZ       | SIM  | NULL        | INDEX                                 | Soft delete: NULL = ativa; preenchido = excluída |

**Índices:**
- `PRIMARY KEY (id)`
- `UNIQUE (codigo)`
- `INDEX (deleted_at)`

**Campo calculado (não persistido):**

| Campo              | Tipo   | Descrição                                                                              |
|--------------------|--------|----------------------------------------------------------------------------------------|
| `status_calculado` | string | Retorna `'VENCIDO'` se `status='EMPRESTADA'` E existe empréstimo ativo com prazo vencido. **Nunca gravado no banco.** |

**Regras de negócio:**
- `status` NUNCA recebe o valor `'VENCIDO'` — o estado vencido é calculado em tempo de execução
- Soft delete: quando `deleted_at IS NOT NULL`, a chave é tratada como excluída
- `codigo` é normalizado para maiúsculas no momento do cadastro

---

### 4.4 Tabela `emprestimo`

| Coluna                    | Tipo        | Nulo | Padrão | Restrições                     | Descrição                                               |
|---------------------------|-------------|------|--------|--------------------------------|---------------------------------------------------------|
| `id`                      | BIGSERIAL   | NÃO  | auto   | PK                             | Identificador único                                     |
| `chave_id`                | BIGINT      | NÃO  | —      | FK → chave.id ON DELETE RESTRICT | Chave emprestada                                      |
| `pessoa_id`               | BIGINT      | NÃO  | —      | FK → pessoa.id ON DELETE RESTRICT | Pessoa que retirou a chave                           |
| `data_retirada`           | TIMESTAMPTZ | NÃO  | NOW()  |                                | Momento da retirada (preenchido automaticamente)        |
| `data_prevista_devolucao` | TIMESTAMPTZ | SIM  | NULL   |                                | Prazo máximo de devolução (opcional)                    |
| `data_devolucao`          | TIMESTAMPTZ | SIM  | NULL   |                                | Momento da devolução; NULL = empréstimo ativo           |
| `observacao`              | TEXT        | SIM  | NULL   |                                | Motivo do empréstimo / observações                      |

**Índices:**
- `PRIMARY KEY (id)`
- `INDEX (chave_id)`  ← gerado pela FK
- `INDEX (pessoa_id)` ← gerado pela FK

**Campo calculado (não persistido):**

| Campo     | Tipo | Descrição                                                                                              |
|-----------|------|--------------------------------------------------------------------------------------------------------|
| `vencido` | bool | `True` quando `data_devolucao IS NULL AND data_prevista_devolucao IS NOT NULL AND data_prevista_devolucao < NOW()` |

**Regras de negócio:**
- **Empréstimo ativo:** `data_devolucao IS NULL`
- **Empréstimo encerrado:** `data_devolucao IS NOT NULL`
- **Empréstimo vencido:** `data_devolucao IS NULL AND data_prevista_devolucao < NOW()`
- `data_prevista_devolucao` deve ser data futura (validado no serializer)
- `data_devolucao` não pode ser futura nem anterior a `data_retirada`
- Não é possível deletar `chave` ou `pessoa` que possuam empréstimos (ON DELETE RESTRICT)
- Criação usa `SELECT FOR UPDATE` na chave para evitar condição de corrida (race condition)

---

## 5. Histórico de Migrações

| Migration | Criado em    | Mudanças                                                                                        |
|-----------|--------------|-------------------------------------------------------------------------------------------------|
| `0001`    | 2026-02-26   | Criação inicial das 4 tabelas: setor, pessoa, chave, emprestimo                                 |
| `0002`    | 2026-02-27   | Simplificação de `tipo_vinculo`: removidos ESTAGIARIO e VISITANTE                              |
| `0003`    | 2026-02-27   | `chave.descricao` passou de NULL para `default=''`; adicionado `emprestimo.data_prevista_devolucao` |
| `0004`    | 2026-02-28   | Renomeação de dado: `TERCEIRIZADO` → `PRESTADOR` (migração de dados + atualização de choices)  |
| `0005`    | 2026-03-01   | Adicionados em `pessoa`: `foto`, `telefone`, `observacao`                                       |
| `0006`    | 2026-03-01   | Adicionados em `chave`: `localizacao`, `permitir_servidor`, `permitir_prestador`                |
| `0007`    | 2026-03-02   | Adicionado `chave.deleted_at` (suporte a soft delete)                                           |

---

## 6. Regras de Integridade e Negócio

### 6.1 Integridade Referencial

| FK                        | Comportamento ao deletar o pai   | Motivo                                               |
|---------------------------|----------------------------------|------------------------------------------------------|
| `pessoa.setor_id → setor` | SET NULL                         | Setor pode ser excluído sem perder histórico de pessoas |
| `emprestimo.chave_id → chave` | RESTRICT                    | Proíbe exclusão de chave com empréstimos vinculados  |
| `emprestimo.pessoa_id → pessoa` | RESTRICT                  | Proíbe exclusão de pessoa com empréstimos vinculados |

### 6.2 Controle de Concorrência

O serviço `EmprestimoService.emprestar()` utiliza **SELECT FOR UPDATE** (lock de linha no PostgreSQL) dentro de uma transação atômica para garantir que dois empréstimos simultâneos da mesma chave não causem inconsistência:

```sql
-- Equivalente ao que o ORM executa
BEGIN;
  SELECT * FROM chave WHERE id = :id FOR UPDATE;  -- bloqueia a linha
  -- validação: status = 'DISPONIVEL'
  INSERT INTO emprestimo (...) VALUES (...);
  UPDATE chave SET status = 'EMPRESTADA' WHERE id = :id;
COMMIT;
```

### 6.3 Status da Chave

O campo `status` na tabela `chave` aceita apenas os valores abaixo. O valor `VENCIDO` **não existe no banco** — é calculado pela aplicação:

| Valor DB     | Significado                                                   |
|--------------|---------------------------------------------------------------|
| `DISPONIVEL` | Chave disponível para retirada                                |
| `EMPRESTADA` | Chave emprestada (pode estar "em dia" ou "vencida")           |
| `MANUTENCAO` | Chave indisponível por manutenção                             |
| *(calculado)* `VENCIDO` | `status='EMPRESTADA'` + empréstimo ativo com prazo expirado |

---

## 7. Configuração do Banco (PostgreSQL)

```ini
ENGINE   = postgresql
DATABASE = sischave
USER     = admin  (configurado via env DB_USER)
PASSWORD = ***    (configurado via env DB_PASSWORD)
HOST     = database  (nome do serviço Docker)
PORT     = 5432
TIMEZONE = America/Sao_Paulo
```

**Variáveis de ambiente necessárias (.env):**

| Variável      | Padrão      | Descrição                      |
|---------------|-------------|--------------------------------|
| `DB_NAME`     | sischave    | Nome do banco de dados         |
| `DB_USER`     | admin       | Usuário do PostgreSQL          |
| `DB_PASSWORD` | admin       | Senha do PostgreSQL            |
| `DB_HOST`     | database    | Host do servidor PostgreSQL    |
| `DB_PORT`     | 5432        | Porta do PostgreSQL            |

---

## 8. Tabelas do Django (criadas automaticamente pelo framework)

Além das tabelas de negócio, o Django cria as seguintes tabelas no schema:

| Tabela                        | Descrição                                           |
|-------------------------------|-----------------------------------------------------|
| `auth_user`                   | Usuários administradores do sistema                 |
| `auth_group`                  | Grupos de permissão                                 |
| `auth_permission`             | Permissões individuais                              |
| `auth_user_groups`            | Relação N:M usuário ↔ grupo                        |
| `auth_user_user_permissions`  | Permissões específicas por usuário                  |
| `django_admin_log`            | Log de ações do painel administrativo               |
| `django_content_type`         | Tipos de conteúdo (necessário para permissões)      |
| `django_migrations`           | Histórico de migrações aplicadas                    |
| `django_session`              | Sessões (não usadas — autenticação via JWT)         |

### Campos relevantes de `auth_user` para o sistema:

| Campo          | Descrição                                                   |
|----------------|-------------------------------------------------------------|
| `username`     | Login do usuário administrador                              |
| `password`     | Senha hasheada (PBKDF2)                                     |
| `is_staff`     | TRUE = pode acessar a API                                   |
| `is_superuser` | TRUE = acesso total, inclusive à gestão de admins           |
| `is_active`    | FALSE = usuário desativado                                  |

---

## 9. Script SQL — Estrutura Final (DDL Equivalente)

```sql
-- ============================================================
-- SCHEMA: Sistema de Controle de Chaves (AEB)
-- Engine: PostgreSQL 15
-- Gerado em: 2026-03-03
-- ============================================================

CREATE TABLE setor (
    id      BIGSERIAL    PRIMARY KEY,
    nome    VARCHAR(100) NOT NULL UNIQUE,
    ativo   BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE pessoa (
    id              BIGSERIAL    PRIMARY KEY,
    nome_completo   VARCHAR(150) NOT NULL,
    cpf             VARCHAR(14)  NOT NULL UNIQUE,
    tipo_vinculo    VARCHAR(20)  NOT NULL
                    CHECK (tipo_vinculo IN ('SERVIDOR', 'PRESTADOR')),
    setor_id        BIGINT       REFERENCES setor(id) ON DELETE SET NULL,
    foto            VARCHAR(255),
    telefone        VARCHAR(20)  NOT NULL DEFAULT '',
    observacao      TEXT         NOT NULL DEFAULT '',
    ativo           BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE chave (
    id                  BIGSERIAL    PRIMARY KEY,
    codigo              VARCHAR(50)  NOT NULL UNIQUE,
    descricao           VARCHAR(200) NOT NULL DEFAULT '',
    localizacao         VARCHAR(100) NOT NULL DEFAULT '',
    status              VARCHAR(20)  NOT NULL DEFAULT 'DISPONIVEL'
                        CHECK (status IN ('DISPONIVEL', 'EMPRESTADA', 'MANUTENCAO')),
    permitir_servidor   BOOLEAN      NOT NULL DEFAULT TRUE,
    permitir_prestador  BOOLEAN      NOT NULL DEFAULT TRUE,
    ativo               BOOLEAN      NOT NULL DEFAULT TRUE,
    deleted_at          TIMESTAMPTZ  DEFAULT NULL
);

CREATE INDEX idx_chave_deleted_at ON chave(deleted_at);

CREATE TABLE emprestimo (
    id                        BIGSERIAL   PRIMARY KEY,
    chave_id                  BIGINT      NOT NULL
                              REFERENCES chave(id) ON DELETE RESTRICT,
    pessoa_id                 BIGINT      NOT NULL
                              REFERENCES pessoa(id) ON DELETE RESTRICT,
    data_retirada             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_prevista_devolucao   TIMESTAMPTZ,
    data_devolucao            TIMESTAMPTZ,
    observacao                TEXT
);

-- Comentários documentais
COMMENT ON COLUMN chave.status IS
  'Nunca persiste VENCIDO. O status VENCIDO é calculado pela aplicação
   quando status=EMPRESTADA e existe empréstimo ativo com data_prevista_devolucao < NOW()';

COMMENT ON COLUMN chave.deleted_at IS
  'Soft delete: NULL = chave ativa; preenchido = chave excluída logicamente';

COMMENT ON COLUMN emprestimo.data_devolucao IS
  'NULL = empréstimo em aberto; preenchido = chave devolvida';

COMMENT ON COLUMN emprestimo.data_prevista_devolucao IS
  'Prazo máximo opcional. Quando vencido sem devolução, a chave aparece como VENCIDA na interface';

COMMENT ON COLUMN pessoa.cpf IS
  'Formato obrigatório: XXX.XXX.XXX-XX. Validado pela aplicação (regex).
   A API retorna apenas os 4 últimos dígitos mascarados: ***.***.*XX-XX';
```

---

## 10. Fluxo de Dados — Ciclo de Vida de um Empréstimo

```
CHAVE.status = 'DISPONIVEL'
       │
       │  POST /api/emprestimos/
       │  { chave, pessoa, data_prevista_devolucao? }
       │
       ▼
  ┌─────────────────────────────────────────┐
  │  EmprestimoService.emprestar()          │
  │  1. SELECT chave FOR UPDATE             │
  │  2. Valida status = 'DISPONIVEL'        │
  │  3. INSERT INTO emprestimo (...)        │
  │  4. UPDATE chave SET status='EMPRESTADA'│
  └─────────────────────────────────────────┘
       │
       ▼
CHAVE.status = 'EMPRESTADA'
EMPRESTIMO.data_devolucao = NULL  ← empréstimo ativo

       │  (se data_prevista_devolucao < NOW())
       ▼
CHAVE.status_calculado = 'VENCIDO'  ← apenas na leitura, não persistido

       │  PATCH /api/emprestimos/{id}/devolver/
       │
       ▼
  ┌─────────────────────────────────────────┐
  │  EmprestimoService.devolver()           │
  │  1. UPDATE emprestimo SET               │
  │       data_devolucao = NOW()            │
  │  2. UPDATE chave SET status='DISPONIVEL'│
  └─────────────────────────────────────────┘
       │
       ▼
CHAVE.status = 'DISPONIVEL'
EMPRESTIMO.data_devolucao = NOW()  ← empréstimo encerrado
```
