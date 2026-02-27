# Arquitetura do Backend

## Estrutura de Pastas

```
backend/
├── manage.py                   # Ponto de entrada CLI do Django
├── Dockerfile                  # Build da imagem Python
├── requirements.txt            # Dependências Python
│
└── app/                        # Aplicação Django principal
    ├── main.py                 # Ponto de entrada WSGI
    ├── apps.py                 # Configuração do app Django (AppConfig)
    ├── urls.py                 # Roteador DRF — registra todos os ViewSets
    │
    ├── core/                   # Configurações do projeto Django
    │   ├── settings.py         # Variáveis de configuração (DB, apps, middleware)
    │   ├── urls.py             # URL raiz (inclui app.urls + Swagger)
    │   ├── wsgi.py             # Ponto de entrada WSGI (produção)
    │   └── asgi.py             # Ponto de entrada ASGI (async)
    │
    ├── models/                 # Entidades ORM — mapeiam as tabelas do banco
    │   ├── __init__.py         # Exporta todos os models
    │   ├── setor.py            # Model Setor
    │   ├── pessoa.py           # Model Pessoa
    │   ├── chave.py            # Model Chave
    │   └── emprestimo.py       # Model Emprestimo
    │
    ├── serializers/            # Contratos de entrada e saída (validação + serialização)
    │   ├── __init__.py         # Exporta todos os serializers
    │   ├── setor.py            # SetorSerializer
    │   ├── pessoa.py           # PessoaSerializer (com validação de setor por vínculo)
    │   ├── chave.py            # ChaveSerializer
    │   └── emprestimo.py       # EmprestimoSerializer / CreateSerializer / DevolucaoSerializer
    │
    ├── views/                  # ViewSets DRF — lógica HTTP (CRUD + actions customizadas)
    │   ├── __init__.py         # Exporta todos os ViewSets
    │   ├── setor.py            # SetorViewSet
    │   ├── pessoa.py           # PessoaViewSet
    │   ├── chave.py            # ChaveViewSet
    │   └── emprestimo.py       # EmprestimoViewSet (inclui action /devolver/)
    │
    ├── service/                # Lógica de negócio isolada (sem dependência HTTP)
    │   └── emprestimo.py       # EmprestimoService.emprestar() / .devolver()
    │
    ├── migrations/             # Migrações do banco geradas pelo Django
    │
    ├── management/
    │   └── commands/           # Comandos CLI customizados (manage.py <comando>)
    │
    ├── tests/                  # Testes automatizados
    └── utils/                  # Funções auxiliares reutilizáveis
```

---

## Fluxo de uma Requisição

```
HTTP Request
    │
    ▼
core/urls.py          ← distribui para admin, api/, swagger
    │
    ▼
app/urls.py           ← DefaultRouter → ViewSet correto
    │
    ▼
views/<entidade>.py   ← recebe request, delega para serializer
    │
    ▼
serializers/<entidade>.py  ← valida dados, chama service se necessário
    │
    ▼
service/emprestimo.py ← executa regras de negócio, acessa models
    │
    ▼
models/<entidade>.py  ← persiste no banco via ORM
    │
    ▼
HTTP Response
```

---

## Decisões de Design

### Separação `serializers/` × `service/`

Os **serializers** são responsáveis pela validação e transformação dos dados HTTP.
Os **services** são responsáveis pela lógica de negócio — não conhecem `request`, `response` nem HTTP.

Isso permite que a mesma lógica de negócio seja chamada tanto por um endpoint REST quanto por um comando CLI (`management/commands/`) no futuro, sem duplicação.

### `models/` como pacote

Em vez de um único `models.py`, cada entidade tem seu próprio arquivo.
O `models/__init__.py` exporta tudo, então o Django encontra os models normalmente via `app.models`.

### Tabelas gerenciadas via `init.sql`

O schema do banco é definido em `database/init.sql` e executado pelo PostgreSQL na primeira inicialização.
O Django usa `migrate --fake-initial` no startup para reconhecer as tabelas existentes sem recriá-las.

---

## Dependências

```
Django>=5.0.0               # Framework web
djangorestframework>=3.14.0 # API REST
drf-spectacular>=0.27.0     # Geração automática de schema OpenAPI 3 / Swagger
psycopg2-binary>=2.9.0      # Driver PostgreSQL
django-cors-headers>=4.3.0  # Headers CORS para o frontend React
```
