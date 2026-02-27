# Gestão de Pessoas — Quem Retira Chaves

Este documento explica como cadastrar, gerenciar e importar as **pessoas** que retiram chaves no sistema (servidores e prestadores).

> **Não confunda com usuários do sistema.** Veja a distinção completa na seção 1.

---

## Índice

1. [Dois tipos de cadastro: diferença fundamental](#1-dois-tipos-de-cadastro-diferença-fundamental)
2. [Fluxo em homologação](#2-fluxo-em-homologação)
3. [Opção 1 — Painel Django Admin](#3-opção-1--painel-django-admin)
4. [Opção 2 — Frontend (RegisterPersonModal)](#4-opção-2--frontend-registerpersonmodal)
5. [Opção 3 — Importação em lote via CSV](#5-opção-3--importação-em-lote-via-csv)
6. [Gerenciar pessoas existentes](#6-gerenciar-pessoas-existentes)
7. [Referência da API](#7-referência-da-api)

---

## 1. Dois tipos de cadastro: diferença fundamental

| | **Usuários do sistema** | **Pessoas (quem retira chave)** |
|---|---|---|
| **O que são** | Operadores: você, `bloco_a`, `bloco_f` | Servidores e prestadores da instituição |
| **Quem cria** | Somente superadmin | Qualquer operador logado |
| **Onde fica** | Tabela `auth_user` (Django interno) | Tabela `pessoa` (nosso modelo) |
| **Como criar** | `create_initial_users` / shell | Frontend ou `POST /api/pessoas/` |
| **Fazem login?** | ✅ Sim, acessam o sistema | ❌ Não, apenas retiram chaves fisicamente |
| **Documentação** | [user-management.md](./user-management.md) | Este documento |

---

## 2. Fluxo em homologação

Como superadmin, você tem três formas de cadastrar pessoas. Escolha de acordo com o volume e o momento:

| Situação | Forma recomendada |
|---|---|
| Poucos registros, imediato | Django Admin |
| Uso contínuo pela equipe | Frontend (RegisterPersonModal) |
| Carga inicial com muitos registros | Importação CSV |

---

## 3. Opção 1 — Painel Django Admin

Disponível **agora**, sem nenhuma configuração adicional.

**Acesso:** `http://localhost:8080/admin/`
**Login:** credenciais do superadmin (`admin` / senha definida no `.env`)

**Passos:**
1. Acesse o painel e faça login
2. Navegue até **App → Pessoas → Adicionar pessoa**
3. Preencha os campos:
   - **Nome completo** — nome do servidor ou prestador
   - **CPF** — formato `000.000.000-00`
   - **Tipo de vínculo** — `SERVIDOR` ou `PRESTADOR`
   - **Setor** — opcional para prestadores, obrigatório para servidores
   - **Ativo** — marque para permitir retirada de chaves
4. Clique em **Salvar**

> Use o Django Admin para cadastros pontuais durante a fase de testes. Para uso contínuo em produção, prefira o frontend.

---

## 4. Opção 2 — Frontend (RegisterPersonModal)

O modal `RegisterPersonModal.tsx` já existe na interface. Quando conectado à API real, qualquer operador logado (`bloco_a`, `bloco_f` ou superadmin) poderá cadastrar pessoas diretamente pela tela, sem precisar de terminal ou painel admin.

**Endpoint utilizado:**
```
POST /api/pessoas/
Authorization: Bearer <token>
Content-Type: application/json

{
  "nome_completo": "João da Silva",
  "cpf": "123.456.789-00",
  "tipo_vinculo": "SERVIDOR",
  "setor": 1,
  "telefone": "(61) 98765-4321",
  "observacao": ""
}
```

**Resposta (HTTP 201):**
```json
{
  "id": 5,
  "nome_completo": "João da Silva",
  "cpf": "123.456.789-00",
  "cpf_display": "***.***.**9-00",
  "tipo_vinculo": "SERVIDOR",
  "setor": 1,
  "setor_nome": "TI",
  "foto": null,
  "telefone": "(61) 98765-4321",
  "observacao": "",
  "ativo": true,
  "criado_em": "2025-01-15T10:30:00Z",
  "atualizado_em": "2025-01-15T10:30:00Z"
}
```

**Validações automáticas do backend:**
- CPF deve estar no formato `000.000.000-00`
- CPF deve ser único (duplicata retorna HTTP 400)
- Servidores (`SERVIDOR`) devem informar o setor
- Prestadores (`PRESTADOR`) podem omitir o setor

---

## 5. Opção 3 — Importação em lote via CSV

Recomendado para a **carga inicial** quando há muitos servidores a cadastrar de uma planilha existente (RH, lista de funcionários, etc.).

### Formato do arquivo CSV

Crie o arquivo `pessoas.csv` com o seguinte formato:

```csv
nome_completo,cpf,tipo_vinculo,setor_id,telefone
João da Silva,123.456.789-00,SERVIDOR,1,(61) 98765-4321
Maria Oliveira,987.654.321-00,SERVIDOR,2,(61) 91234-5678
Carlos Prestador,111.222.333-44,PRESTADOR,,(61) 99999-0000
```

> `setor_id` pode ficar vazio para prestadores. Consulte os IDs dos setores em `GET /api/setores/`.

### Copiar o arquivo para o container

```bash
# Coloque o arquivo na pasta backend/ do projeto
# Ele estará acessível dentro do container em /app/pessoas.csv
docker compose cp pessoas.csv backend:/app/pessoas.csv
```

### Executar a importação

```bash
docker compose exec backend python manage.py shell -c "
import csv
from app.models import Pessoa, Setor

criados = 0
ignorados = 0

with open('/app/pessoas.csv') as f:
    for row in csv.DictReader(f):
        setor = None
        if row.get('setor_id'):
            try:
                setor = Setor.objects.get(pk=int(row['setor_id']))
            except Setor.DoesNotExist:
                print(f'Setor {row[\"setor_id\"]} não encontrado para {row[\"nome_completo\"]}')

        _, created = Pessoa.objects.get_or_create(
            cpf=row['cpf'],
            defaults={
                'nome_completo': row['nome_completo'],
                'tipo_vinculo': row['tipo_vinculo'],
                'setor': setor,
                'telefone': row.get('telefone', ''),
            }
        )
        if created:
            criados += 1
        else:
            ignorados += 1

print(f'Importação concluída: {criados} criados, {ignorados} já existiam.')
"
```

> O `get_or_create` usa o CPF como chave — se a pessoa já existir, ela é **ignorada** (não duplicada). Seguro para rodar mais de uma vez.

---

## 6. Gerenciar pessoas existentes

### Listar todas as pessoas ativas

```bash
curl http://localhost:8080/api/pessoas/?ativo=true \
  -H "Authorization: Bearer <TOKEN>"
```

### Desativar uma pessoa (impede retirada de chaves)

```bash
curl -X PATCH http://localhost:8080/api/pessoas/<ID>/ \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"ativo": false}'
```

> Ao desativar, a pessoa não pode mais retirar chaves. Empréstimos em aberto não são cancelados — devem ser devolvidos normalmente.

### Atualizar dados de uma pessoa

```bash
curl -X PATCH http://localhost:8080/api/pessoas/<ID>/ \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"telefone": "(61) 91111-2222", "setor": 3}'
```

### Atualizar foto via frontend (multipart)

```bash
curl -X PATCH http://localhost:8080/api/pessoas/<ID>/ \
  -H "Authorization: Bearer <TOKEN>" \
  -F "foto=@/caminho/para/foto.jpg"
```

---

## 7. Referência da API

Todos os endpoints requerem `Authorization: Bearer <TOKEN>`.

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/pessoas/` | Lista pessoas (`?ativo=true/false`) |
| `GET` | `/api/pessoas/{id}/` | Detalhe de uma pessoa |
| `POST` | `/api/pessoas/` | Cadastra nova pessoa |
| `PATCH` | `/api/pessoas/{id}/` | Atualiza parcialmente (ex: desativar) |
| `PUT` | `/api/pessoas/{id}/` | Atualiza completamente |
| `DELETE` | `/api/pessoas/{id}/` | Remove permanentemente |
| `GET` | `/api/setores/` | Lista setores (para preencher o campo setor) |

**Campos do model Pessoa:**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `nome_completo` | texto | ✅ | Máximo 150 caracteres |
| `cpf` | texto | ✅ | Formato `000.000.000-00`, único |
| `tipo_vinculo` | enum | ✅ | `SERVIDOR` ou `PRESTADOR` |
| `setor` | FK | Servidores | ID do setor; obrigatório para `SERVIDOR` |
| `foto` | imagem | ❌ | Upload via `multipart/form-data` |
| `telefone` | texto | ❌ | Máximo 20 caracteres |
| `observacao` | texto longo | ❌ | Informações adicionais |
| `ativo` | boolean | — | `true` por padrão; `false` bloqueia retirada |
