# Banco de Dados — Guia de Estudo e Extensão

Este documento explica como o banco de dados do sistema funciona, como cada tabela se relaciona e como adicionar novas tabelas ou colunas com segurança.

---

## Índice

- [Stack e Configuração](#stack-e-configuração)
- [Diagrama de Entidades](#diagrama-de-entidades)
- [Tabelas Existentes](#tabelas-existentes)
- [Como o Django gerencia o banco](#como-o-django-gerencia-o-banco)
- [Passo a passo: adicionar uma coluna](#passo-a-passo-adicionar-uma-coluna)
- [Passo a passo: adicionar uma nova tabela](#passo-a-passo-adicionar-uma-nova-tabela)
- [Passo a passo: migração de dados](#passo-a-passo-migração-de-dados)
- [Regras do projeto](#regras-do-projeto)
- [Referência de tipos de campo](#referência-de-tipos-de-campo)

---

## Stack e Configuração

| Item | Valor |
|---|---|
| Banco | PostgreSQL 15 |
| ORM | Django 6 (models) |
| Driver Python | `psycopg2-binary` |
| Timezone | `America/Sao_Paulo` (com `USE_TZ = True`) |
| Charset | UTF-8 |

A conexão é configurada via variáveis de ambiente em `settings.py`:

```python
# backend/app/core/settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'sischave'),
        'USER': os.environ.get('DB_USER', 'admin'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'admin'),
        'HOST': os.environ.get('DB_HOST', 'database'),  # nome do serviço Docker
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}
```

---

## Diagrama de Entidades

```
┌─────────────┐        ┌──────────────┐
│    setor    │        │    chave     │
│─────────────│        │──────────────│
│ id (PK)     │        │ id (PK)      │
│ nome        │        │ codigo UNIQUE│
│ ativo       │        │ descricao    │
└──────┬──────┘        │ status       │
       │ 1             │ ativo        │
       │               └──────┬───────┘
       │ N                    │ 1
       │                      │
┌──────┴──────┐        ┌──────┴───────┐
│   pessoa    │        │  emprestimo  │
│─────────────│  N   1 │──────────────│
│ id (PK)     ├────────┤ id (PK)      │
│ nome_compl. │        │ chave_id FK  │  ← RESTRICT (não deleta chave com empréstimo)
│ cpf UNIQUE  │        │ pessoa_id FK │  ← RESTRICT
│ tipo_vinculo│        │ data_retirada│
│ setor_id FK │        │ data_prev_dv │
│ ativo       │        │ data_devoluc.│
│ criado_em   │        │ observacao   │
│ atualiz._em │        └──────────────┘
└─────────────┘
```

**Regras de integridade do banco:**
- `chave.codigo` — `UNIQUE` (não pode duplicar)
- `pessoa.cpf` — `UNIQUE`
- `setor.nome` — `UNIQUE`
- `emprestimo.chave_id` — `ON DELETE RESTRICT` (impede deletar chave com empréstimos)
- `emprestimo.pessoa_id` — `ON DELETE RESTRICT`
- `pessoa.setor_id` — `ON DELETE SET NULL` (setor deletado vira NULL)

---

## Tabelas Existentes

### `setor`

| Coluna | Tipo SQL | Django Field | Observação |
|---|---|---|---|
| `id` | `bigint` | `BigAutoField` | PK, auto-increment |
| `nome` | `varchar(100)` | `CharField(max_length=100, unique=True)` | Único |
| `ativo` | `boolean` | `BooleanField(default=True)` | Soft delete |

### `pessoa`

| Coluna | Tipo SQL | Django Field | Observação |
|---|---|---|---|
| `id` | `bigint` | `BigAutoField` | PK |
| `nome_completo` | `varchar(150)` | `CharField(max_length=150)` | |
| `cpf` | `varchar(14)` | `CharField(max_length=14, unique=True)` | Formato `000.000.000-00` |
| `tipo_vinculo` | `varchar(20)` | `CharField(choices=...)` | `SERVIDOR` ou `PRESTADOR` |
| `setor_id` | `bigint` | `ForeignKey(Setor, null=True)` | Nullable |
| `ativo` | `boolean` | `BooleanField(default=True)` | Soft delete |
| `criado_em` | `timestamptz` | `DateTimeField(auto_now_add=True)` | Preenchido na criação |
| `atualizado_em` | `timestamptz` | `DateTimeField(auto_now=True)` | Atualizado em cada save |

### `chave`

| Coluna | Tipo SQL | Django Field | Observação |
|---|---|---|---|
| `id` | `bigint` | `BigAutoField` | PK |
| `codigo` | `varchar(50)` | `CharField(max_length=50, unique=True)` | Único |
| `descricao` | `varchar(200)` | `CharField(blank=True, default='')` | Pode ser vazio |
| `status` | `varchar(20)` | `CharField(choices=...)` | `DISPONIVEL`, `EMPRESTADA`, `MANUTENCAO` |
| `ativo` | `boolean` | `BooleanField(default=True)` | Soft delete |

> `VENCIDO` **nunca é gravado no banco**. É calculado em tempo real pela property `status_calculado` do model.

### `emprestimo`

| Coluna | Tipo SQL | Django Field | Observação |
|---|---|---|---|
| `id` | `bigint` | `BigAutoField` | PK |
| `chave_id` | `bigint` | `ForeignKey(Chave, RESTRICT)` | FK obrigatória |
| `pessoa_id` | `bigint` | `ForeignKey(Pessoa, RESTRICT)` | FK obrigatória |
| `data_retirada` | `timestamptz` | `DateTimeField(auto_now_add=True)` | Preenchido automaticamente |
| `data_prevista_devolucao` | `timestamptz` | `DateTimeField(null=True, blank=True)` | Prazo máximo |
| `data_devolucao` | `timestamptz` | `DateTimeField(null=True, blank=True)` | `NULL` = em aberto |
| `observacao` | `text` | `TextField(null=True, blank=True)` | Livre |

**Como identificar empréstimo ativo:** `data_devolucao IS NULL`

---

## Como o Django gerencia o banco

O Django usa **migrações** para sincronizar os models Python com o esquema do banco. Nunca altere o banco diretamente via SQL para mudar a estrutura — sempre passe pelo sistema de migrações.

```
Model Python  →  makemigrations  →  arquivo .py  →  migrate  →  PostgreSQL
```

### Histórico de migrações do projeto

| Arquivo | O que fez |
|---|---|
| `0001_initial.py` | Criou todas as tabelas iniciais |
| `0002_alter_pessoa_tipo_vinculo.py` | Reduziu os choices de `tipo_vinculo` |
| `0003_chave_descricao_not_null_emprestimo_prazo.py` | Removeu `null` de `descricao`; adicionou `data_prevista_devolucao` |
| `0004_alter_pessoa_tipo_vinculo_prestador.py` | Renomeou `TERCEIRIZADO` → `PRESTADOR` (com migração de dados) |

---

## Passo a passo: adicionar uma coluna

**Exemplo:** adicionar `telefone` em `Pessoa`.

### 1. Edite o model

```python
# app/models/pessoa.py
class Pessoa(models.Model):
    # ... campos existentes ...
    telefone = models.CharField(max_length=20, blank=True, default='')
```

**Regras:**
- Colunas novas em tabelas existentes **precisam** de `default` ou `null=True` — o PostgreSQL não aceita `NOT NULL` sem valor padrão em linhas existentes.
- Prefira `blank=True, default=''` a `null=True` em `CharField` (evita dois estados "vazio").

### 2. Gere a migração

```bash
docker compose exec backend python manage.py makemigrations
```

Django cria automaticamente um arquivo como `0005_pessoa_telefone.py`.

### 3. Aplique no banco

```bash
docker compose exec backend python manage.py migrate
```

### 4. Verifique

```bash
# Confirma a coluna no banco
docker compose exec database psql -U admin -d sischave -c "\d pessoa"
```

---

## Passo a passo: adicionar uma nova tabela

**Exemplo:** criar uma tabela `Localizacao` para registrar onde cada chave fica guardada.

### 1. Crie o arquivo do model

```python
# app/models/localizacao.py
from django.db import models


class Localizacao(models.Model):
    descricao = models.CharField(max_length=150)
    bloco = models.CharField(max_length=50, blank=True, default='')
    ativo = models.BooleanField(default=True)

    class Meta:
        db_table = 'localizacao'          # nome exato da tabela no PostgreSQL
        verbose_name = 'Localização'
        verbose_name_plural = 'Localizações'

    def __str__(self):
        return self.descricao
```

### 2. Exporte pelo `__init__.py` do pacote models

```python
# app/models/__init__.py  — adicione a linha:
from .localizacao import Localizacao
```

### 3. Gere e aplique a migração

```bash
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
```

### 4. Se quiser relacionar com outra tabela (FK)

```python
# Em Chave, adicione uma FK para Localizacao:
localizacao = models.ForeignKey(
    'Localizacao',
    null=True, blank=True,
    on_delete=models.SET_NULL,
    related_name='chaves',
)
```

Opções para `on_delete`:

| Opção | Comportamento |
|---|---|
| `CASCADE` | Deleta filhos ao deletar o pai |
| `RESTRICT` | Impede deletar o pai se tiver filhos |
| `SET_NULL` | Coloca `NULL` nos filhos (requer `null=True`) |
| `PROTECT` | Similar a `RESTRICT`, lança `ProtectedError` |

---

## Passo a passo: migração de dados

Quando uma mudança de esquema precisa converter dados existentes (ex: renomear um valor de `choices`), use `RunPython`:

```python
# app/migrations/0005_exemplo_migracao_dados.py
from django.db import migrations, models


def converter_dados(apps, schema_editor):
    # Use apps.get_model para pegar o model histórico (não o model atual)
    MinhaTabela = apps.get_model('app', 'MinhaTabela')
    MinhaTabela.objects.filter(campo='VALOR_ANTIGO').update(campo='VALOR_NOVO')


def reverter_dados(apps, schema_editor):
    MinhaTabela = apps.get_model('app', 'MinhaTabela')
    MinhaTabela.objects.filter(campo='VALOR_NOVO').update(campo='VALOR_ANTIGO')


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0004_alter_pessoa_tipo_vinculo_prestador'),
    ]

    operations = [
        # Sempre migre os dados ANTES de alterar o schema
        migrations.RunPython(converter_dados, reverter_dados),
        migrations.AlterField(
            model_name='minhatabela',
            name='campo',
            field=models.CharField(
                choices=[('VALOR_NOVO', 'Novo')],
                max_length=20,
            ),
        ),
    ]
```

> **Por que `apps.get_model` e não o import direto?**
> Porque as migrações são executadas em sequência histórica. Se você importar o model diretamente (`from app.models import Pessoa`), estará usando o model **atual** — mas naquele ponto da história o modelo pode ter campos diferentes. `apps.get_model` retorna o model **tal como era** quando a migração foi criada.

---

## Regras do projeto

| Regra | Motivo |
|---|---|
| Nunca use `null=True` em `CharField` ou `TextField` | Evita dois estados "vazio" (`NULL` e `''`). Use `blank=True, default=''` |
| Sempre defina `db_table` no `Meta` | Garante nome previsível no PostgreSQL |
| Use `auto_now_add=True` para data de criação | Preenchido automaticamente, nunca editável |
| Use `auto_now=True` para data de atualização | Atualizado a cada `save()` automaticamente |
| Timestamps sempre com `USE_TZ = True` | Datas gravadas em UTC, convertidas para `America/Sao_Paulo` na exibição |
| Soft delete via campo `ativo` | Nunca deletar registros com histórico de empréstimos |
| Status calculado nunca vai ao banco | `VENCIDO` é uma property Python, evita inconsistência |

---

## Referência de tipos de campo

| Necessidade | Django Field | Tipo SQL resultante |
|---|---|---|
| Texto curto | `CharField(max_length=N)` | `varchar(N)` |
| Texto longo | `TextField()` | `text` |
| Número inteiro | `IntegerField()` | `integer` |
| Número inteiro grande | `BigIntegerField()` | `bigint` |
| Número decimal | `DecimalField(max_digits, decimal_places)` | `numeric` |
| Verdadeiro/Falso | `BooleanField()` | `boolean` |
| Data e hora (com tz) | `DateTimeField()` | `timestamptz` |
| Apenas data | `DateField()` | `date` |
| FK para outra tabela | `ForeignKey(Modelo, on_delete=...)` | `bigint` + constraint |
| Chave única | Adicionar `unique=True` em qualquer field | Constraint `UNIQUE` |
| PK auto | `BigAutoField` (padrão via `DEFAULT_AUTO_FIELD`) | `bigserial` |

---

## Comandos úteis do dia a dia

```bash
# Criar arquivo de migração baseado nas mudanças nos models
docker compose exec backend python manage.py makemigrations

# Aplicar migrações pendentes no banco
docker compose exec backend python manage.py migrate

# Ver quais migrações já foram aplicadas
docker compose exec backend python manage.py showmigrations

# Ver o SQL que uma migração vai executar (sem aplicar)
docker compose exec backend python manage.py sqlmigrate app 0005

# Abrir o shell Python com o Django carregado (para inspecionar dados)
docker compose exec backend python manage.py shell

# Inspecionar tabela diretamente no PostgreSQL
docker compose exec database psql -U admin -d sischave -c "\d nome_da_tabela"
```
