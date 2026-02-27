# Gestão de Usuários do Sistema

Este documento detalha como criar, gerenciar, desativar e redefinir a senha dos usuários que **operam** o Sistema de Controle de Chaves.

> **Importante:** Estes são os usuários do sistema (operadores de portaria), não as pessoas cadastradas que retiram chaves. As pessoas que retiram chaves são gerenciadas em `POST /api/pessoas/`.

---

## Índice

1. [Tipos de usuário](#1-tipos-de-usuário)
2. [Configuração inicial — primeiro superadmin](#2-configuração-inicial--primeiro-superadmin)
3. [Usuários atuais do sistema](#3-usuários-atuais-do-sistema)
4. [Criar novos usuários](#4-criar-novos-usuários)
5. [Desativar um usuário (pagamento / desligamento)](#5-desativar-um-usuário-pagamento--desligamento)
6. [Reativar um usuário](#6-reativar-um-usuário)
7. [Alterar senha](#7-alterar-senha)
8. [Excluir permanentemente](#8-excluir-permanentemente)
9. [Consultar via API](#9-consultar-via-api)
10. [Painel Django Admin](#10-painel-django-admin)

---

## 1. Tipos de usuário

O sistema possui dois níveis de acesso:

| Tipo | `is_staff` | `is_superuser` | O que pode fazer |
|---|---|---|---|
| **Superadmin** | ✅ | ✅ | Tudo: operar + criar/remover outros admins |
| **Operador** | ✅ | ❌ | Operar o sistema (chaves, empréstimos, pessoas) |

Usuários sem `is_staff=True` **não conseguem fazer login** — receberão HTTP 403.

---

## 2. Configuração inicial — primeiro superadmin

Executado **uma única vez** após subir o Docker pela primeira vez.

```bash
docker compose exec backend python manage.py createsuperuser
```

O comando pedirá interativamente:
```
Username: admin
Email address: admin@exemplo.com
Password: ************
Password (again): ************
Superuser created successfully.
```

---

## 3. Usuários atuais do sistema

Os dois operadores configurados para o funcionamento atual:

| Usuário | Bloco | Nível |
|---|---|---|
| `admin` | — | Superadmin |
| `bloco_a` | Bloco A | Operador |
| `bloco_f` | Bloco F | Operador |

Para listar todos os usuários cadastrados:

```bash
docker compose exec backend python manage.py shell -c "
from django.contrib.auth.models import User
print(f'{'Username':<20} {'Bloco/Cargo':<20} {'Ativo':<8} {'Superadmin':<12}')
print('-' * 62)
for u in User.objects.filter(is_staff=True).order_by('username'):
    cargo = 'Superadmin' if u.is_superuser else 'Operador'
    print(f'{u.username:<20} {cargo:<20} {str(u.is_active):<8} {str(u.is_superuser):<12}')
"
```

---

## 4. Criar novos usuários

### 4.1 Via terminal (recomendado para configuração inicial)

```bash
docker compose exec backend python manage.py shell -c "
from django.contrib.auth.models import User

User.objects.create_user(
    username='bloco_c',           # nome de login (sem espaços)
    password='senha-segura-456',  # mínimo 8 caracteres
    first_name='Operador',        # opcional
    last_name='Bloco C',          # opcional
    email='blococ@exemplo.com',   # opcional
    is_staff=True,                # obrigatório — dá acesso ao sistema
    is_superuser=False,           # False para operadores comuns
)
print('Usuário criado com sucesso.')
"
```

### 4.2 Via API (requer token de superadmin)

**Passo 1 — Obter token do superadmin:**
```bash
curl -s -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "sua-senha"}' \
  | python -m json.tool
```

Copie o valor de `access` da resposta.

**Passo 2 — Criar o usuário:**
```bash
curl -X POST http://localhost:8000/api/admin-users/ \
  -H "Authorization: Bearer <TOKEN_AQUI>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bloco_c",
    "password": "senha-segura-456",
    "first_name": "Operador",
    "last_name": "Bloco C",
    "email": "blococ@exemplo.com"
  }'
```

Resposta esperada (HTTP 201):
```json
{
  "id": 4,
  "username": "bloco_c",
  "email": "blococ@exemplo.com",
  "first_name": "Operador",
  "last_name": "Bloco C",
  "is_staff": true,
  "is_superuser": false,
  "is_active": true,
  "date_joined": "2025-01-15T10:30:00Z"
}
```

> A senha **nunca** aparece na resposta — é armazenada como hash seguro (bcrypt).

### 4.3 Criar múltiplos usuários de uma vez

```bash
docker compose exec backend python manage.py shell -c "
from django.contrib.auth.models import User

usuarios = [
    {'username': 'bloco_b', 'password': 'senha-b-789', 'last_name': 'Bloco B'},
    {'username': 'bloco_c', 'password': 'senha-c-012', 'last_name': 'Bloco C'},
    {'username': 'supervisor', 'password': 'senha-sup-345', 'last_name': 'Supervisão'},
]

for dados in usuarios:
    if User.objects.filter(username=dados['username']).exists():
        print(f'Já existe: {dados[\"username\"]}')
        continue
    User.objects.create_user(**dados, is_staff=True)
    print(f'Criado: {dados[\"username\"]}')
"
```

---

## 5. Desativar um usuário (pagamento / desligamento)

**Desativar** é a forma correta de encerrar o acesso de um operador. O usuário fica registrado no histórico mas não consegue mais fazer login.

### Via terminal

```bash
docker compose exec backend python manage.py shell -c "
from django.contrib.auth.models import User
u = User.objects.get(username='bloco_f')
u.is_active = False
u.save()
print(f'Usuário {u.username} desativado com sucesso.')
"
```

### Via API (requer token de superadmin)

```bash
curl -X PATCH http://localhost:8000/api/admin-users/<ID>/ \
  -H "Authorization: Bearer <TOKEN_SUPERADMIN>" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

> Após desativação, qualquer token JWT que o usuário possuía é automaticamente rejeitado na próxima requisição, pois o Django valida `is_active` a cada chamada autenticada.

---

## 6. Reativar um usuário

```bash
docker compose exec backend python manage.py shell -c "
from django.contrib.auth.models import User
u = User.objects.get(username='bloco_f')
u.is_active = True
u.save()
print(f'Usuário {u.username} reativado com sucesso.')
"
```

---

## 7. Alterar senha

### O próprio superadmin redefine a senha de outro usuário

```bash
docker compose exec backend python manage.py shell -c "
from django.contrib.auth.models import User
u = User.objects.get(username='bloco_a')
u.set_password('nova-senha-segura-789')
u.save()
print('Senha alterada com sucesso.')
"
```

> Use sempre `set_password()` — **nunca** atribua direto ao campo `password`, pois o Django precisa gerar o hash.

### Via API (requer token de superadmin)

```bash
curl -X PATCH http://localhost:8000/api/admin-users/<ID>/ \
  -H "Authorization: Bearer <TOKEN_SUPERADMIN>" \
  -H "Content-Type: application/json" \
  -d '{"password": "nova-senha-segura-789"}'
```

### Usando o comando nativo do Django

```bash
docker compose exec backend python manage.py changepassword bloco_a
```

O comando pede a nova senha interativamente (com confirmação).

---

## 8. Excluir permanentemente

> Use apenas se tiver certeza. Prefira **desativar** (seção 5) para manter o histórico.

```bash
docker compose exec backend python manage.py shell -c "
from django.contrib.auth.models import User
u = User.objects.get(username='bloco_x')
nome = u.username
u.delete()
print(f'Usuário {nome} excluído permanentemente.')
"
```

---

## 9. Consultar via API

Todos os endpoints abaixo requerem token JWT de admin no header:
`Authorization: Bearer <TOKEN>`

| Método | Endpoint | Permissão | Descrição |
|---|---|---|---|
| `GET` | `/api/admin-users/` | Admin | Lista todos os admins |
| `GET` | `/api/admin-users/{id}/` | Admin | Detalhe de um admin |
| `POST` | `/api/admin-users/` | **Superadmin** | Cria novo admin |
| `PATCH` | `/api/admin-users/{id}/` | **Superadmin** | Atualiza parcialmente |
| `PUT` | `/api/admin-users/{id}/` | **Superadmin** | Atualiza completamente |
| `DELETE` | `/api/admin-users/{id}/` | **Superadmin** | Remove permanentemente |

**Listar todos os admins:**
```bash
curl http://localhost:8000/api/admin-users/ \
  -H "Authorization: Bearer <TOKEN>"
```

**Ver um usuário específico:**
```bash
curl http://localhost:8000/api/admin-users/2/ \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 10. Painel Django Admin

O Django Admin oferece interface gráfica completa para gestão de usuários.

**Acesso:** http://localhost:8000/admin/

**Login:** Use as credenciais do superadmin.

No painel, navegue até **Autenticação e Autorização → Usuários** para:
- Criar, editar e desativar usuários via formulário visual
- Ver histórico de datas de login
- Gerenciar senhas com segurança

> O Django Admin é recomendado para operações pontuais e diagnóstico. Para automação e integração, use os endpoints da API.

---

## Referência rápida de comandos

```bash
# Criar superadmin (interativo)
docker compose exec backend python manage.py createsuperuser

# Alterar senha (interativo)
docker compose exec backend python manage.py changepassword <username>

# Listar todos os usuários admin
docker compose exec backend python manage.py shell -c "
from django.contrib.auth.models import User
User.objects.filter(is_staff=True).values('username','is_active','is_superuser')
"

# Desativar
docker compose exec backend python manage.py shell -c "
from django.contrib.auth.models import User
User.objects.filter(username='<username>').update(is_active=False)
"

# Reativar
docker compose exec backend python manage.py shell -c "
from django.contrib.auth.models import User
User.objects.filter(username='<username>').update(is_active=True)
"
```
