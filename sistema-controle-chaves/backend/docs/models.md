# Modelos de Dados

Todas as tabelas são criadas via `database/init.sql`. O Django mapeia essas tabelas com `db_table` explícito em cada model.

---

## Diagrama de Relacionamento

```
┌──────────┐        ┌─────────────────────┐
│  setor   │◄───────│       pessoa        │
├──────────┤  0..*  ├─────────────────────┤
│ id       │        │ id                  │
│ nome     │        │ nome_completo        │
│ ativo    │        │ cpf (único)         │
└──────────┘        │ tipo_vinculo        │
                    │ setor_id (FK)       │
                    │ ativo               │
                    │ criado_em           │
                    │ atualizado_em       │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │      emprestimo     │
                    ├─────────────────────┤
┌──────────┐        │ id                  │
│  chave   │◄───────│ chave_id (FK)       │
├──────────┤        │ pessoa_id (FK)      │
│ id       │        │ data_retirada       │
│ codigo   │        │ data_devolucao      │
│ descricao│        │ observacao          │
│ status   │        └─────────────────────┘
│ ativo    │
└──────────┘
```

---

## Setor

**Tabela:** `setor`
**Arquivo:** `app/models/setor.py`

Representa uma área/departamento da organização. Obrigatório para servidores.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `SERIAL` | auto | Chave primária |
| `nome` | `VARCHAR(100)` | sim | Nome do setor. Único no banco |
| `ativo` | `BOOLEAN` | não | Padrão `true` |

---

## Pessoa

**Tabela:** `pessoa`
**Arquivo:** `app/models/pessoa.py`

Representa qualquer indivíduo que pode retirar uma chave.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `SERIAL` | auto | Chave primária |
| `nome_completo` | `VARCHAR(150)` | sim | Nome completo |
| `cpf` | `VARCHAR(14)` | sim | CPF. Único no banco. Formato: `000.000.000-00` |
| `tipo_vinculo` | `VARCHAR(20)` | sim | Veja tabela de valores abaixo |
| `setor_id` | `INTEGER FK` | condicional | Obrigatório apenas para `SERVIDOR` |
| `ativo` | `BOOLEAN` | não | Padrão `true` |
| `criado_em` | `TIMESTAMP` | auto | Preenchido na criação |
| `atualizado_em` | `TIMESTAMP` | auto | Atualizado a cada `save()` |

**Valores de `tipo_vinculo`:**

| Valor | Descrição | `setor` obrigatório? |
|---|---|---|
| `SERVIDOR` | Funcionário público efetivo | Sim |
| `TERCEIRIZADO` | Prestador de serviço externo | Não |

---

## Chave

**Tabela:** `chave`
**Arquivo:** `app/models/chave.py`

Representa uma chave física do patrimônio.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `SERIAL` | auto | Chave primária |
| `codigo` | `VARCHAR(50)` | sim | Código identificador. Único no banco |
| `descricao` | `VARCHAR(200)` | não | Descrição do local/uso |
| `status` | `VARCHAR(20)` | não | Veja tabela abaixo. Padrão `DISPONIVEL` |
| `ativo` | `BOOLEAN` | não | Padrão `true` |

**Valores de `status`:**

| Valor | Descrição | Transição |
|---|---|---|
| `DISPONIVEL` | Chave disponível para retirada | → `EMPRESTADA` ao criar empréstimo |
| `EMPRESTADA` | Chave retirada por alguém | → `DISPONIVEL` ao registrar devolução |
| `MANUTENCAO` | Chave fora de uso temporariamente | Alterado manualmente via PATCH |

---

## Emprestimo

**Tabela:** `emprestimo`
**Arquivo:** `app/models/emprestimo.py`

Registro transacional de cada retirada e devolução de chave. Nunca é deletado — é o histórico.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `SERIAL` | auto | Chave primária |
| `chave_id` | `INTEGER FK` | sim | Referência à chave. `ON DELETE RESTRICT` |
| `pessoa_id` | `INTEGER FK` | sim | Referência à pessoa. `ON DELETE RESTRICT` |
| `data_retirada` | `TIMESTAMP` | auto | Preenchido na criação |
| `data_devolucao` | `TIMESTAMP` | não | `null` enquanto a chave ainda está com a pessoa |
| `observacao` | `TEXT` | não | Observação livre |

> `ON DELETE RESTRICT` impede a exclusão de uma chave ou pessoa que tenha empréstimos vinculados.
