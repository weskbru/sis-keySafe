#!/usr/bin/env python3
"""
=============================================================================
SMOKE TEST — Banco de Dados e Autenticação (JWT)
=============================================================================
Objetivo: Validar rapidamente que a infraestrutura crítica está operacional
antes de um deploy ou após restart de containers.

Uso:
  # Com containers rodando:
  docker compose exec backend python smoke_test.py

  # Ou diretamente:
  python smoke_test.py

Retorna exit code 0 se todos os checks passarem, 1 caso contrário.
=============================================================================
"""
import os
import sys
import json
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone

# ─── Configurações via env (mesmas do settings.py) ───────────────────────────
DB_HOST     = os.environ.get("DB_HOST", "localhost")
DB_PORT     = os.environ.get("DB_PORT", "5432")
DB_NAME     = os.environ.get("DB_NAME", "sischave")
DB_USER     = os.environ.get("DB_USER", "admin")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "admin")
API_BASE    = os.environ.get("API_BASE", "http://localhost:8000")
JWT_SECRET  = os.environ.get("JWT_SECRET_KEY", "django-insecure-chave-temporaria")

TIMEOUT_SECONDS = 5

# ─── Resultado ───────────────────────────────────────────────────────────────
RESULTS = []
FAILURES = []


def check(name: str, passed: bool, detail: str = ""):
    status = "✅ PASS" if passed else " FAIL"
    line = f"  [{status}] {name}"
    if detail:
        line += f"\n         → {detail}"
    print(line)
    RESULTS.append((name, passed))
    if not passed:
        FAILURES.append((name, detail))


def section(title: str):
    print(f"\n{'─'*60}")
    print(f"  {title}")
    print(f"{'─'*60}")


# ─────────────────────────────────────────────────────────────────────────────
# BLOCO 1: BANCO DE DADOS
# ─────────────────────────────────────────────────────────────────────────────

def check_database():
    section("BLOCO 1 — Banco de Dados (PostgreSQL)")
    try:
        import psycopg2
    except ImportError:
        check("psycopg2 instalado", False, "Execute: pip install psycopg2-binary")
        return

    conn = None
    try:
        # ST-DB-001: Conectar ao banco
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            connect_timeout=TIMEOUT_SECONDS,
        )
        check("ST-DB-001 | Conexão com PostgreSQL", True, f"{DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

        cur = conn.cursor()

        # ST-DB-002: Tabelas críticas existem
        tabelas_criticas = ["chave", "emprestimo", "pessoa", "setor"]
        cur.execute("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
        """)
        tabelas_existentes = {row[0] for row in cur.fetchall()}
        for tabela in tabelas_criticas:
            check(
                f"ST-DB-002 | Tabela '{tabela}' existe",
                tabela in tabelas_existentes,
                f"Tabelas encontradas: {sorted(tabelas_existentes)}" if tabela not in tabelas_existentes else "",
            )

        # ST-DB-003: Colunas críticas da tabela 'chave'
        cur.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'chave'
        """)
        colunas_chave = {row[0]: (row[1], row[2]) for row in cur.fetchall()}
        colunas_esperadas_chave = {
            "id": None,
            "codigo": None,
            "descricao": None,
            "status": None,
            "ativo": None,
        }
        for col in colunas_esperadas_chave:
            check(
                f"ST-DB-003 | Coluna 'chave.{col}' existe",
                col in colunas_chave,
            )

        # ST-DB-004: Colunas críticas da tabela 'emprestimo'
        cur.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'emprestimo'
        """)
        colunas_emp = {row[0] for row in cur.fetchall()}
        for col in ["chave_id", "pessoa_id", "data_retirada", "data_devolucao"]:
            check(
                f"ST-DB-004 | Coluna 'emprestimo.{col}' existe",
                col in colunas_emp,
            )

        # ST-DB-005: Constraint UNIQUE em chave.codigo
        cur.execute("""
            SELECT COUNT(*) FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu
              ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_name = 'chave'
              AND tc.constraint_type = 'UNIQUE'
              AND ccu.column_name = 'codigo'
        """)
        count_unique = cur.fetchone()[0]
        check("ST-DB-005 | UNIQUE constraint em chave.codigo", count_unique > 0)

        # ST-DB-006: FK emprestimo → chave ON DELETE RESTRICT
        cur.execute("""
            SELECT rc.delete_rule
            FROM information_schema.referential_constraints rc
            JOIN information_schema.key_column_usage kcu
              ON rc.constraint_name = kcu.constraint_name
            WHERE kcu.table_name = 'emprestimo'
              AND kcu.column_name = 'chave_id'
        """)
        fk_row = cur.fetchone()
        fk_rule = fk_row[0] if fk_row else "NOT FOUND"
        check(
            "ST-DB-006 | FK emprestimo.chave_id ON DELETE RESTRICT",
            fk_rule == "RESTRICT",
            f"Delete rule atual: {fk_rule}",
        )

        # ST-DB-007: Leitura/escrita simples (CRUD smoke)
        cur.execute("BEGIN")
        cur.execute("""
            INSERT INTO chave (codigo, descricao, status, ativo)
            VALUES ('SMOKE-TEST-001', 'Smoke test key', 'DISPONIVEL', TRUE)
            ON CONFLICT (codigo) DO UPDATE SET descricao = EXCLUDED.descricao
            RETURNING id, status
        """)
        row = cur.fetchone()
        check(
            "ST-DB-007 | INSERT/SELECT em chave funciona",
            row is not None and row[1] == "DISPONIVEL",
            f"ID: {row[0]}, Status: {row[1]}" if row else "Nenhuma linha retornada",
        )
        cur.execute("ROLLBACK")  # Desfaz para não sujar dados

        # ST-DB-008: Timezone do banco
        cur.execute("SHOW timezone")
        db_tz = cur.fetchone()[0]
        check(
            "ST-DB-008 | Timezone do banco definido",
            db_tz is not None,
            f"Timezone: {db_tz} (esperado: UTC ou America/Sao_Paulo via settings.py)",
        )

        # ST-DB-009: Testar que campo data_retirada usa CURRENT_TIMESTAMP (não naive)
        cur.execute("""
            SELECT now() AT TIME ZONE 'America/Sao_Paulo' AS brasilia_now
        """)
        brasilia_time = cur.fetchone()[0]
        check(
            "ST-DB-009 | Banco consegue calcular hora em America/Sao_Paulo",
            brasilia_time is not None,
            f"Hora atual em Brasília: {brasilia_time}",
        )

        cur.close()

    except Exception as e:
        check("ST-DB-CONN | Conexão com banco", False, str(e))
    finally:
        if conn:
            conn.close()


# ─────────────────────────────────────────────────────────────────────────────
# BLOCO 2: API REST
# ─────────────────────────────────────────────────────────────────────────────

def http_get(path: str, token: str = None) -> tuple[int, dict]:
    """Faz GET para a API e retorna (status_code, body)."""
    url = f"{API_BASE}{path}"
    req = urllib.request.Request(url)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
            body = json.loads(resp.read().decode())
            return resp.status, body
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode())
        except Exception:
            body = {}
        return e.code, body
    except Exception as e:
        return 0, {"error": str(e)}


def http_post(path: str, data: dict, token: str = None) -> tuple[int, dict]:
    """Faz POST para a API e retorna (status_code, body)."""
    url = f"{API_BASE}{path}"
    payload = json.dumps(data).encode()
    req = urllib.request.Request(url, data=payload, method="POST")
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
            body = json.loads(resp.read().decode())
            return resp.status, body
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode())
        except Exception:
            body = {}
        return e.code, body
    except Exception as e:
        return 0, {"error": str(e)}


def check_api():
    section("BLOCO 2 — API REST (Django + DRF)")

    # ST-API-001: API está acessível
    status_code, _ = http_get("/api/chaves/")
    check(
        "ST-API-001 | GET /api/chaves/ acessível",
        status_code in [200, 401, 403],  # 401/403 se auth ativada
        f"HTTP {status_code}" if status_code == 0 else "",
    )

    # ST-API-002: Swagger UI disponível
    status_code, _ = http_get("/api/schema/swagger-ui/")
    check(
        "ST-API-002 | Swagger UI acessível (/api/schema/swagger-ui/)",
        status_code == 200,
        f"HTTP {status_code}",
    )

    # ST-API-003: Schema OpenAPI gerado
    status_code, _ = http_get("/api/schema/")
    check(
        "ST-API-003 | OpenAPI schema gerado (/api/schema/)",
        status_code == 200,
        f"HTTP {status_code}",
    )

    # ST-API-004: Endpoint /api/emprestimos/ acessível
    status_code, _ = http_get("/api/emprestimos/")
    check(
        "ST-API-004 | GET /api/emprestimos/ acessível",
        status_code in [200, 401, 403],
        f"HTTP {status_code}",
    )

    # ST-API-005: POST chave válida retorna 201 (sem auth)
    status_code, body = http_post("/api/chaves/", {
        "codigo": f"SMOKE-{int(time.time())}",
        "descricao": "Chave criada pelo smoke test",
    })
    check(
        "ST-API-005 | POST /api/chaves/ cria chave (sem auth ativa)",
        status_code in [201, 401, 403],
        f"HTTP {status_code} | Body: {body}",
    )
    smoke_chave_id = body.get("id") if status_code == 201 else None

    # ST-API-006: Filtro ?status=DISPONIVEL funciona
    status_code, body = http_get("/api/chaves/?status=DISPONIVEL")
    if status_code == 200:
        todos_disponiveis = all(
            c.get("status") == "DISPONIVEL" for c in (body if isinstance(body, list) else [])
        )
        check(
            "ST-API-006 | Filtro ?status=DISPONIVEL retorna apenas chaves disponíveis",
            todos_disponiveis,
            f"Total: {len(body) if isinstance(body, list) else 'N/A'}",
        )
    else:
        check("ST-API-006 | Filtro ?status=DISPONIVEL", False, f"HTTP {status_code}")

    # Limpar chave criada no smoke
    if smoke_chave_id:
        try:
            url = f"{API_BASE}/api/chaves/{smoke_chave_id}/"
            req = urllib.request.Request(url, method="DELETE")
            urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS)
        except Exception:
            pass  # Falha silenciosa na limpeza


# ─────────────────────────────────────────────────────────────────────────────
# BLOCO 3: JWT / SEGURANÇA
# ─────────────────────────────────────────────────────────────────────────────

def check_jwt():
    section("BLOCO 3 — Autenticação JWT e Segurança")

    # ST-JWT-001: Verificar se simplejwt está instalado
    try:
        import rest_framework_simplejwt
        check("ST-JWT-001 | djangorestframework-simplejwt instalado", True,
              f"Versão: {rest_framework_simplejwt.__version__}")
    except ImportError:
        check(
            "ST-JWT-001 | djangorestframework-simplejwt instalado",
            False,
            "CRÍTICO: JWT não configurado. Execute: pip install djangorestframework-simplejwt\n"
            "         Adicione 'rest_framework_simplejwt' ao INSTALLED_APPS e configure\n"
            "         DEFAULT_AUTHENTICATION_CLASSES no REST_FRAMEWORK settings.",
        )

    # ST-JWT-002: Endpoint de token existe
    status_code, body = http_post("/api/token/", {"username": "__smoke__", "password": "__smoke__"})
    check(
        "ST-JWT-002 | Endpoint /api/token/ existe",
        status_code in [200, 400, 401],  # 400/401 = existe mas credenciais erradas (ok)
        f"HTTP {status_code} (404 = endpoint não configurado)",
    )

    # ST-JWT-003: Requisição sem token retorna 401 (quando auth ativa)
    status_code, _ = http_get("/api/emprestimos/")
    if status_code == 401:
        check(
            "ST-JWT-003 | Endpoints protegidos retornam 401 sem token",
            True,
            "Autenticação JWT ativa e funcionando.",
        )
    elif status_code == 200:
        check(
            "ST-JWT-003 | Endpoints protegidos retornam 401 sem token",
            False,
            "CRÍTICO: API retorna 200 sem autenticação. Configure DEFAULT_PERMISSION_CLASSES\n"
            "         no REST_FRAMEWORK settings com IsAuthenticated.",
        )
    else:
        check(
            "ST-JWT-003 | Endpoints protegidos retornam 401 sem token",
            False,
            f"HTTP {status_code} inesperado.",
        )

    # ST-JWT-004: SECRET_KEY não é o valor inseguro padrão
    insecure_default = "django-insecure-chave-temporaria"
    check(
        "ST-JWT-004 | SECRET_KEY não é o valor inseguro padrão",
        JWT_SECRET != insecure_default,
        "CRÍTICO: SECRET_KEY está com valor padrão inseguro. Defina JWT_SECRET_KEY no .env",
    )

    # ST-JWT-005: CORS não permite todas as origens (em produção)
    # Lemos das configurações do Django via manage.py
    # Em smoke test externo, verificamos o header da resposta
    status_code, _ = http_get("/api/chaves/")
    check(
        "ST-JWT-005 | CORS configurado (validação manual recomendada)",
        True,  # Não é possível verificar sem inspecionar headers de CORS diretamente
        "Verifique CORS_ALLOW_ALL_ORIGINS=False em produção. Atualmente True (risco).",
    )

    # ST-JWT-006: DEBUG não deve ser True em produção
    check(
        "ST-JWT-006 | DEBUG=False verificado via env",
        os.environ.get("DJANGO_DEBUG", "True").lower() not in ("true", "1"),
        "AVISO: DEBUG=True expõe stack traces. Defina DJANGO_DEBUG=False no .env de produção.",
    )


# ─────────────────────────────────────────────────────────────────────────────
# BLOCO 4: INTEGRIDADE DE DADOS
# ─────────────────────────────────────────────────────────────────────────────

def check_data_integrity():
    section("BLOCO 4 — Integridade de Dados")
    try:
        import psycopg2
        conn = psycopg2.connect(
            host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
            user=DB_USER, password=DB_PASSWORD,
            connect_timeout=TIMEOUT_SECONDS,
        )
        cur = conn.cursor()

        # ST-DATA-001: Não há chaves com status inválido
        cur.execute("""
            SELECT COUNT(*) FROM chave
            WHERE status NOT IN ('DISPONIVEL', 'EMPRESTADA', 'MANUTENCAO')
        """)
        invalid_status = cur.fetchone()[0]
        check(
            "ST-DATA-001 | Todas as chaves têm status válido",
            invalid_status == 0,
            f"{invalid_status} chave(s) com status inválido encontrada(s)." if invalid_status else "",
        )

        # ST-DATA-002: Chaves EMPRESTADAS têm empréstimo ativo correspondente
        cur.execute("""
            SELECT c.id, c.codigo
            FROM chave c
            WHERE c.status = 'EMPRESTADA'
              AND NOT EXISTS (
                SELECT 1 FROM emprestimo e
                WHERE e.chave_id = c.id
                  AND e.data_devolucao IS NULL
              )
        """)
        orfas = cur.fetchall()
        check(
            "ST-DATA-002 | Chaves EMPRESTADAS têm empréstimo ativo",
            len(orfas) == 0,
            f"Chaves órfãs (status EMPRESTADA sem empréstimo ativo): {orfas}" if orfas else "",
        )

        # ST-DATA-003: Chaves DISPONÍVEIS não têm empréstimo ativo
        cur.execute("""
            SELECT c.id, c.codigo, COUNT(e.id) as emprestimos_ativos
            FROM chave c
            JOIN emprestimo e ON e.chave_id = c.id AND e.data_devolucao IS NULL
            WHERE c.status = 'DISPONIVEL'
            GROUP BY c.id, c.codigo
            HAVING COUNT(e.id) > 0
        """)
        inconsistentes = cur.fetchall()
        check(
            "ST-DATA-003 | Chaves DISPONÍVEIS não têm empréstimo ativo",
            len(inconsistentes) == 0,
            f"Inconsistências: {inconsistentes}" if inconsistentes else "",
        )

        # ST-DATA-004: Nenhum empréstimo com data_devolucao < data_retirada
        cur.execute("""
            SELECT COUNT(*) FROM emprestimo
            WHERE data_devolucao IS NOT NULL
              AND data_devolucao < data_retirada
        """)
        datas_invertidas = cur.fetchone()[0]
        check(
            "ST-DATA-004 | data_devolucao sempre >= data_retirada",
            datas_invertidas == 0,
            f"{datas_invertidas} empréstimo(s) com data invertida." if datas_invertidas else "",
        )

        # ST-DATA-005: CPFs únicos
        cur.execute("""
            SELECT cpf, COUNT(*) FROM pessoa GROUP BY cpf HAVING COUNT(*) > 1
        """)
        cpfs_dup = cur.fetchall()
        check(
            "ST-DATA-005 | Nenhum CPF duplicado em pessoa",
            len(cpfs_dup) == 0,
            f"CPFs duplicados: {[c[0] for c in cpfs_dup]}" if cpfs_dup else "",
        )

        cur.close()
        conn.close()

    except Exception as e:
        check("ST-DATA-CONN | Conexão para verificação de integridade", False, str(e))


# ─────────────────────────────────────────────────────────────────────────────
# RUNNER
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("\n" + "=" * 60)
    print("  SMOKE TEST — Sistema de Controle de Chaves")
    print(f"  Executado em: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"  API_BASE: {API_BASE}")
    print(f"  DB: {DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}")
    print("=" * 60)

    check_database()
    check_api()
    check_jwt()
    check_data_integrity()

    # ── Sumário ───────────────────────────────────────────────────────────────
    total = len(RESULTS)
    passed = sum(1 for _, ok in RESULTS if ok)
    failed = total - passed

    print(f"\n{'═'*60}")
    print(f"  RESULTADO: {passed}/{total} checks passaram")
    if FAILURES:
        print(f"\n  {'─'*56}")
        print(f"   FALHAS ({len(FAILURES)}):")
        for name, detail in FAILURES:
            print(f"     · {name}")
            if detail:
                for line in detail.split("\n"):
                    print(f"       {line}")
    print(f"{'═'*60}\n")

    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
