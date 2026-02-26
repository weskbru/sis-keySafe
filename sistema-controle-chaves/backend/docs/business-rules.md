# Regras de Negócio

Este documento descreve as restrições e comportamentos automáticos do sistema.

---

## Pessoas

### RN-01 — Setor obrigatório para Servidor
Ao cadastrar ou atualizar uma pessoa com `tipo_vinculo = SERVIDOR`, o campo `setor` é obrigatório.

```
SE tipo_vinculo == "SERVIDOR" E setor == null
  → ERRO 400: "O setor é obrigatório para servidores."
```

**Arquivo:** `app/serializers/pessoa.py` → método `validate()`

---

### RN-02 — Tipos de vínculo permitidos
Apenas dois tipos de vínculo são aceitos no cadastro:

| Tipo | Descrição |
|---|---|
| `SERVIDOR` | Funcionário público efetivo |
| `TERCEIRIZADO` | Prestador de serviço externo |

Qualquer outro valor retorna `400 — "X" não é um escolha válida.`

**Arquivo:** `app/models/pessoa.py` → `TIPO_VINCULO_CHOICES`

---

## Chaves

### RN-03 — Status da chave
Uma chave sempre possui um dos três status:

| Status | Significa |
|---|---|
| `DISPONIVEL` | Pode ser emprestada |
| `EMPRESTADA` | Já está com alguém; não pode ser emprestada novamente |
| `MANUTENCAO` | Fora de circulação; não pode ser emprestada |

O status padrão no cadastro é `DISPONIVEL`.

---

## Empréstimos

### RN-04 — Só empresta chave disponível
Não é possível criar um empréstimo para uma chave que não esteja com `status = DISPONIVEL`.

```
SE chave.status != "DISPONIVEL"
  → ERRO 400: "A chave '<codigo>' não está disponível (status atual: <status>)."
```

**Arquivo:** `app/serializers/emprestimo.py` → `validate_chave()`

---

### RN-05 — Criação de empréstimo altera o status da chave
Ao registrar com sucesso um novo empréstimo, o sistema automaticamente muda o status da chave.

```
POST /api/emprestimos/ com sucesso
  → chave.status = "EMPRESTADA"
```

**Arquivo:** `app/service/emprestimo.py` → `EmprestimoService.emprestar()`

---

### RN-06 — Devolução altera o status da chave
Ao registrar a devolução via `PATCH /api/emprestimos/{id}/devolver/`, o sistema automaticamente libera a chave.

```
PATCH /api/emprestimos/{id}/devolver/ com sucesso
  → emprestimo.data_devolucao = agora (se não informado)
  → chave.status = "DISPONIVEL"
```

**Arquivo:** `app/service/emprestimo.py` → `EmprestimoService.devolver()`

---

### RN-07 — Não é possível devolver duas vezes
Se o empréstimo já possuir `data_devolucao` preenchida, a tentativa de devolução retorna erro.

```
SE emprestimo.data_devolucao != null
  → ERRO 400: "Esta chave já foi devolvida."
```

**Arquivo:** `app/serializers/emprestimo.py` → `EmprestimoDevolucaoSerializer.validate()`

---

### RN-08 — Integridade referencial (RESTRICT)
Chaves e Pessoas que possuam empréstimos vinculados **não podem ser excluídas**.
A tentativa de `DELETE` retorna erro de integridade do banco de dados.

**Configuração:** `on_delete=models.RESTRICT` em `app/models/emprestimo.py`

---

## Resumo do Ciclo de Vida de um Empréstimo

```
[Chave DISPONIVEL]
       │
       │  POST /api/emprestimos/
       ▼
[Chave EMPRESTADA] ← emprestimo.data_devolucao = null
       │
       │  PATCH /api/emprestimos/{id}/devolver/
       ▼
[Chave DISPONIVEL] ← emprestimo.data_devolucao = timestamp
```
