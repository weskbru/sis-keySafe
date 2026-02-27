# Backend — Sistema de Controle de Chaves

API RESTful desenvolvida em **Django 6 + Django REST Framework** para gerenciar o empréstimo e devolução de chaves físicas entre pessoas vinculadas à organização.

---

## Índice

| Documento | Conteúdo |
|---|---|
| [architecture.md](./architecture.md) | Estrutura de pastas e decisões de design |
| [models.md](./models.md) | Entidades do banco de dados |
| [api.md](./api.md) | Referência completa dos endpoints |
| [business-rules.md](./business-rules.md) | Regras de negócio |
| [setup.md](./setup.md) | Como executar localmente |
| [tests.md](./tests.md) | Documentação completa da suite de testes |
| [database.md](./database.md) | Guia do banco de dados e como estender o schema |
| [user-management.md](./user-management.md) | Criar, desativar e gerenciar usuários operadores |
| [pessoas-management.md](./pessoas-management.md) | Cadastrar servidores e prestadores que retiram chaves |

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Django 6.0 |
| API | Django REST Framework 3.14 |
| Documentação | drf-spectacular (Swagger / OpenAPI 3) |
| Banco de Dados | PostgreSQL 15 |
| Containerização | Docker + Docker Compose |
| Linguagem | Python 3.12 |

---

## Início Rápido

```bash
# Na raiz do projeto (onde fica o docker-compose.yml)
cd sistema-controle-chaves

# Subir banco + backend
docker compose up -d

# Verificar se está funcionando
curl http://localhost:8080/api/
```

Acesse a documentação interativa: **http://localhost:8080/api/docs/**

---

## Portas

| Serviço | Porta Externa | Porta Interna |
|---|---|---|
| Backend (Django) | `8080` | `8000` |
| Banco (PostgreSQL) | `5432` | `5432` |
