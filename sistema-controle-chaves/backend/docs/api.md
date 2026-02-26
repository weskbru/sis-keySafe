# Referência da API

**Base URL:** `http://localhost:8080`
**Swagger UI:** `http://localhost:8080/api/docs/`
**OpenAPI JSON:** `http://localhost:8080/api/schema/`

Todos os endpoints retornam e aceitam `Content-Type: application/json`.

---

## Setores

### `GET /api/setores/`
Lista todos os setores.

**Resposta 200:**
```json
[
  { "id": 1, "nome": "TI", "ativo": true },
  { "id": 2, "nome": "Manutenção", "ativo": true }
]
```

### `POST /api/setores/`
Cria um novo setor.

**Body:**
```json
{ "nome": "Financeiro" }
```

**Resposta 201:**
```json
{ "id": 4, "nome": "Financeiro", "ativo": true }
```

### `GET /api/setores/{id}/`
Retorna um setor pelo ID.

### `PUT /api/setores/{id}/`
Atualiza todos os campos de um setor.

### `PATCH /api/setores/{id}/`
Atualiza parcialmente um setor.

### `DELETE /api/setores/{id}/`
Remove um setor.

---

## Pessoas

### `GET /api/pessoas/`
Lista todas as pessoas.

**Query params:**
| Param | Tipo | Descrição |
|---|---|---|
| `ativo` | `true` / `false` | Filtra por status ativo |

**Resposta 200:**
```json
[
  {
    "id": 1,
    "nome_completo": "João Silva",
    "cpf": "123.456.789-00",
    "tipo_vinculo": "SERVIDOR",
    "setor": 1,
    "setor_nome": "TI",
    "ativo": true,
    "criado_em": "2026-02-26T15:20:28.046924-03:00",
    "atualizado_em": "2026-02-26T15:20:28.046934-03:00"
  }
]
```

### `POST /api/pessoas/`
Cadastra uma nova pessoa.

**Body — TERCEIRIZADO (setor opcional):**
```json
{
  "nome_completo": "Carlos Lima",
  "cpf": "555.666.777-88",
  "tipo_vinculo": "TERCEIRIZADO"
}
```

**Body — SERVIDOR (setor obrigatório):**
```json
{
  "nome_completo": "Maria Souza",
  "cpf": "111.222.333-44",
  "tipo_vinculo": "SERVIDOR",
  "setor": 1
}
```

**Erro 400 — SERVIDOR sem setor:**
```json
{ "setor": ["O setor é obrigatório para servidores."] }
```

**Erro 400 — tipo_vinculo inválido:**
```json
{ "tipo_vinculo": ["\"ESTAGIARIO\" não é um escolha válida."] }
```

### `GET /api/pessoas/{id}/`
Retorna uma pessoa pelo ID.

### `PUT /api/pessoas/{id}/`
Atualiza todos os campos de uma pessoa.

### `PATCH /api/pessoas/{id}/`
Atualiza parcialmente uma pessoa.

### `DELETE /api/pessoas/{id}/`
Remove uma pessoa (somente se não houver empréstimos vinculados).

---

## Chaves

### `GET /api/chaves/`
Lista todas as chaves.

**Query params:**
| Param | Tipo | Descrição |
|---|---|---|
| `status` | `DISPONIVEL` / `EMPRESTADA` / `MANUTENCAO` | Filtra pelo status da chave |
| `ativo` | `true` / `false` | Filtra por status ativo |

**Resposta 200:**
```json
[
  {
    "id": 1,
    "codigo": "TI-01",
    "descricao": "Sala de Servidores",
    "status": "DISPONIVEL",
    "ativo": true
  }
]
```

### `POST /api/chaves/`
Cadastra uma nova chave.

**Body:**
```json
{
  "codigo": "ADM-01",
  "descricao": "Sala da Diretoria"
}
```

### `GET /api/chaves/{id}/`
Retorna uma chave pelo ID.

### `PUT /api/chaves/{id}/`
Atualiza todos os campos de uma chave.

### `PATCH /api/chaves/{id}/`
Atualiza parcialmente uma chave (ex: colocar em manutenção).

```json
{ "status": "MANUTENCAO" }
```

### `DELETE /api/chaves/{id}/`
Remove uma chave (somente se não houver empréstimos vinculados).

---

## Empréstimos

### `GET /api/emprestimos/`
Lista todos os empréstimos, ordenados do mais recente para o mais antigo.

**Resposta 200:**
```json
[
  {
    "id": 1,
    "chave": { "id": 1, "codigo": "TI-01", "descricao": "Sala de Servidores", "status": "EMPRESTADA" },
    "pessoa": { "id": 1, "nome_completo": "João Silva", "cpf": "123.456.789-00", "tipo_vinculo": "SERVIDOR" },
    "data_retirada": "2026-02-26T18:20:32.950271-03:00",
    "data_devolucao": null,
    "observacao": null
  }
]
```

### `POST /api/emprestimos/`
Registra a retirada de uma chave. A chave deve estar com `status = DISPONIVEL`.

**Body:**
```json
{
  "chave": 1,
  "pessoa": 1,
  "observacao": "Retirada para manutenção preventiva"
}
```

**Resposta 201:**
```json
{ "id": 2, "chave": 1, "pessoa": 1, "observacao": "..." }
```

**Efeito colateral:** `chave.status` é alterado para `EMPRESTADA`.

**Erro 400 — chave não disponível:**
```json
{ "chave": ["A chave \"TI-01\" não está disponível (status atual: EMPRESTADA)."] }
```

### `GET /api/emprestimos/{id}/`
Retorna um empréstimo pelo ID com dados aninhados de chave e pessoa.

### `PATCH /api/emprestimos/{id}/devolver/`
Registra a devolução da chave.

**Body (campos opcionais):**
```json
{
  "data_devolucao": "2026-02-26T20:00:00-03:00",
  "observacao": "Devolvida sem avarias"
}
```

Se `data_devolucao` não for enviada, é preenchida automaticamente com a hora atual.

**Resposta 200:** retorna o empréstimo completo com dados aninhados.

**Efeito colateral:** `chave.status` é alterado de volta para `DISPONIVEL`.

**Erro 400 — já devolvida:**
```json
{ "non_field_errors": ["Esta chave já foi devolvida."] }
```

### `DELETE /api/emprestimos/{id}/`
Remove um registro de empréstimo.

---

## Respostas de Erro Padrão

| HTTP | Situação |
|---|---|
| `400 Bad Request` | Dados inválidos ou violação de regra de negócio |
| `404 Not Found` | Recurso não encontrado pelo ID informado |
| `405 Method Not Allowed` | Método HTTP não suportado pelo endpoint |
