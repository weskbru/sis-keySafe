"""
Teste de Carga — Sistema de Controle de Chaves (AEB)
=====================================================
Ferramenta: Locust (https://locust.io)

Instalação:
    pip install locust

Execução (interface web):
    locust -f locustfile.py --host http://<IP_SERVIDOR>:8080

Execução headless (CI/automação):
    locust -f locustfile.py --host http://<IP_SERVIDOR>:8080 \
           --users 30 --spawn-rate 5 --run-time 2m --headless \
           --csv resultados/relatorio

Cenários simulados:
    - SysAdminUser  (10%): faz CRUD de chaves e pessoas
    - AtendimentoUser (90%): fluxo principal — login, consulta, concessão e devolução
"""

import random
from locust import HttpUser, SequentialTaskSet, between, task


# ─── Dados de teste ──────────────────────────────────────────────────────────
ADMIN_USER = {"username": "admin", "password": "admin"}

# IDs reais do seed_data — ajuste conforme o banco de homologação
CHAVE_IDS_DISPONIVEIS = list(range(1, 21))   # IDs das chaves do seed
PESSOA_IDS = list(range(1, 11))              # IDs das pessoas do seed


# ─── Task Sets ────────────────────────────────────────────────────────────────

class FluxoAtendimento(SequentialTaskSet):
    """
    Simula o fluxo principal do operador de portaria:
    1. Login → obtém JWT
    2. Consulta dashboard (lista de chaves)
    3. Consulta pessoas autorizadas
    4. Concede uma chave disponível
    5. Devolve a chave concedida
    6. Logout (limpa tokens locais)
    """
    access_token: str = ""
    emprestimo_id: int | None = None
    chave_id: int | None = None

    def on_start(self):
        self._login()

    def _login(self):
        resp = self.client.post(
            "/api/token/",
            json=ADMIN_USER,
            name="/api/token/ [login]",
        )
        if resp.status_code == 200:
            self.access_token = resp.json().get("access", "")
        else:
            self.access_token = ""

    def _headers(self):
        return {"Authorization": f"Bearer {self.access_token}"}

    @task
    def listar_chaves(self):
        self.client.get("/api/chaves/", headers=self._headers(), name="/api/chaves/ [list]")

    @task
    def listar_emprestimos(self):
        self.client.get(
            "/api/emprestimos/",
            headers=self._headers(),
            name="/api/emprestimos/ [list]",
        )

    @task
    def listar_pessoas(self):
        self.client.get("/api/pessoas/", headers=self._headers(), name="/api/pessoas/ [list]")

    @task
    def conceder_chave(self):
        self.chave_id = random.choice(CHAVE_IDS_DISPONIVEIS)
        pessoa_id = random.choice(PESSOA_IDS)
        resp = self.client.post(
            "/api/emprestimos/",
            json={"chave": self.chave_id, "pessoa": pessoa_id},
            headers=self._headers(),
            name="/api/emprestimos/ [create]",
        )
        if resp.status_code == 201:
            self.emprestimo_id = resp.json().get("id")

    @task
    def devolver_chave(self):
        if not self.emprestimo_id:
            return
        self.client.patch(
            f"/api/emprestimos/{self.emprestimo_id}/devolver/",
            json={},
            headers=self._headers(),
            name="/api/emprestimos/{id}/devolver/ [patch]",
        )
        self.emprestimo_id = None

    @task
    def logout(self):
        # JWT é stateless — apenas para medir ciclo completo de sessão
        self.access_token = ""
        self.interrupt()


class FluxoAdmin(SequentialTaskSet):
    """
    Simula o administrador do sistema:
    cadastro de chave, edição, listagem de usuários.
    """
    access_token: str = ""

    def on_start(self):
        resp = self.client.post(
            "/api/token/",
            json=ADMIN_USER,
            name="/api/token/ [login-admin]",
        )
        if resp.status_code == 200:
            self.access_token = resp.json().get("access", "")

    def _headers(self):
        return {"Authorization": f"Bearer {self.access_token}"}

    @task(3)
    def listar_chaves(self):
        self.client.get("/api/chaves/", headers=self._headers(), name="/api/chaves/ [admin-list]")

    @task(1)
    def listar_setores(self):
        self.client.get("/api/setores/", headers=self._headers(), name="/api/setores/ [list]")

    @task(1)
    def listar_usuarios_admin(self):
        self.client.get(
            "/api/admin-users/",
            headers=self._headers(),
            name="/api/admin-users/ [list]",
        )

    @task
    def logout(self):
        self.access_token = ""
        self.interrupt()


# ─── Usuários Virtuais ────────────────────────────────────────────────────────

class AtendimentoUser(HttpUser):
    """Operador de portaria — 90% do tráfego."""
    tasks = [FluxoAtendimento]
    wait_time = between(2, 6)   # pausa realista entre ações (segundos)
    weight = 9


class AdminUser(HttpUser):
    """Administrador do sistema — 10% do tráfego."""
    tasks = [FluxoAdmin]
    wait_time = between(3, 10)
    weight = 1
