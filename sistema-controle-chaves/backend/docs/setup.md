# Guia de Configuração e Execução

---

## Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Docker Desktop | 4.x |
| Docker Compose | v2 (embutido no Docker Desktop) |
| Git | qualquer |

> Python **não** precisa estar instalado na máquina — tudo roda dentro do container.

---

## Variáveis de Ambiente

O arquivo `.env` fica em `sistema-controle-chaves/.env`. **Nunca commitar este arquivo em produção.**

```env
# Banco de Dados
DB_USER=admin
DB_PASSWORD=admin
DB_NAME=sischave
DB_PORT_LOCAL=5432        # porta exposta no host
DB_PORT_CONTAINER=5432    # porta interna do container

# Django
SECRET_KEY=django-insecure-chave-temporaria-para-development
DEBUG=True

# API
API_PORT=8000
```

---

## Executando com Docker Compose

### Subir tudo (banco + backend)
```bash
cd sistema-controle-chaves
docker compose up -d
```

### Subir apenas o banco
```bash
docker compose up -d database
```

### Subir apenas o backend (banco já rodando)
```bash
docker compose up -d backend
```

### Ver logs do backend em tempo real
```bash
docker logs -f sischave_backend
```

### Parar todos os serviços
```bash
docker compose down
```

### Parar e remover volumes (reseta o banco)
```bash
docker compose down -v
```

---

## O que acontece no startup do backend

O `docker-compose.yml` executa o seguinte ao iniciar o container:

```bash
python manage.py makemigrations   # gera a migration 0001_initial (se não existir)
python manage.py migrate --fake-initial  # aplica migrações; "fakes" as do app pois as tabelas já existem
python manage.py runserver 0.0.0.0:8000  # inicia o servidor de desenvolvimento
```

> `--fake-initial` é necessário porque as tabelas (`setor`, `pessoa`, `chave`, `emprestimo`) foram criadas
> pelo `database/init.sql` na primeira inicialização do PostgreSQL, e não pelo Django.

---

## Schema do Banco

O arquivo `database/init.sql` é executado automaticamente pelo PostgreSQL **apenas na primeira vez** que o volume `db_data` é criado.

Se o banco já existir e você quiser reaplicar o SQL:
```bash
docker exec -i sischave_db psql -U admin -d sischave < database/init.sql
```

---

## Acessando o Banco Diretamente

```bash
# Abrir o psql interativo
docker exec -it sischave_db psql -U admin -d sischave

# Listar tabelas
\dt

# Consultar chaves
SELECT * FROM chave;

# Sair
\q
```

---

## Ambiente de Desenvolvimento Local (sem Docker)

Caso queira rodar o Django diretamente na máquina (para debug com IDE, por exemplo):

```bash
cd sistema-controle-chaves/backend

# Criar e ativar virtual environment
python3 -m venv .venv
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\activate         # Windows

# Instalar dependências
pip install -r requirements.txt

# Exportar variáveis de ambiente (banco precisa estar acessível)
export DJANGO_SETTINGS_MODULE=app.core.settings
export DB_HOST=localhost
export DB_USER=admin
export DB_PASSWORD=admin
export DB_NAME=sischave

# Rodar migrations
python manage.py migrate --fake-initial

# Iniciar servidor
python manage.py runserver
```

---

## Verificação Rápida

Após o startup, confirme que a API está respondendo:

```bash
# Root da API (lista os endpoints disponíveis)
curl http://localhost:8080/api/

# Setores cadastrados
curl http://localhost:8080/api/setores/

# Chaves disponíveis
curl http://localhost:8080/api/chaves/?status=DISPONIVEL

# Swagger UI (abrir no navegador)
http://localhost:8080/api/docs/
```

---

## Rebuild da Imagem

Se você alterar o `requirements.txt` ou o `Dockerfile`, é necessário rebuildar:

```bash
docker compose build backend
docker compose up -d backend
```
