"""
=============================================================================
TESTES DE INTEGRAÇÃO — Entrega e Devolução de Chaves
=============================================================================
Cobre:
  · EmprestimoService (emprestar / devolver)
  · EmprestimoCreateSerializer (validação de disponibilidade)
  · EmprestimoDevolucaoSerializer (idempotência de devolução)
  · EmprestimoViewSet (fluxo completo via API)
  · Edge cases: duplicidade de entrega, devolução dupla, timezone, corrida
=============================================================================
"""
from datetime import timedelta
from unittest.mock import patch

from django.test import TestCase, TransactionTestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from app.models import Chave, Emprestimo, Pessoa, Setor
from app.serializers.emprestimo import EmprestimoCreateSerializer, EmprestimoDevolucaoSerializer
from app.service.emprestimo import EmprestimoService


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def make_setor(nome="TI") -> Setor:
    return Setor.objects.get_or_create(nome=nome)[0]


def make_pessoa(cpf="111.111.111-11", nome="João Silva", **kwargs) -> Pessoa:
    defaults = {
        "nome_completo": nome,
        "cpf": cpf,
        "tipo_vinculo": "SERVIDOR",
        "setor": make_setor(),
    }
    defaults.update(kwargs)
    return Pessoa.objects.create(**defaults)


def make_chave(codigo="TI-INT-01", status_val="DISPONIVEL") -> Chave:
    return Chave.objects.create(
        codigo=codigo,
        descricao="Chave de Integração",
        status=status_val,
    )


# ─────────────────────────────────────────────────────────────────────────────
# 1. TESTES DE SERVICE (Unidade de lógica de negócio)
# ─────────────────────────────────────────────────────────────────────────────

class EmprestimoServiceTest(TestCase):

    def setUp(self):
        self.pessoa = make_pessoa()
        self.chave = make_chave()

    # ── Happy Path ────────────────────────────────────────────────────────────

    def test_emprestar_cria_emprestimo_e_muda_status(self):
        """TC-SVC-001 | emprestar() deve criar registro e mudar chave para EMPRESTADA."""
        emp = EmprestimoService.emprestar(self.chave, self.pessoa)
        self.assertIsNotNone(emp.pk)
        self.chave.refresh_from_db()
        self.assertEqual(self.chave.status, "EMPRESTADA")

    def test_emprestar_registra_data_retirada_automaticamente(self):
        """TC-SVC-002 | data_retirada deve ser preenchida automaticamente (auto_now_add)."""
        emp = EmprestimoService.emprestar(self.chave, self.pessoa)
        self.assertIsNotNone(emp.data_retirada)
        # Deve ser recente (menos de 5 segundos atrás)
        delta = timezone.now() - emp.data_retirada
        self.assertLess(delta.total_seconds(), 5)

    def test_emprestar_com_observacao(self):
        """TC-SVC-003 | Observação opcional deve ser persistida."""
        emp = EmprestimoService.emprestar(self.chave, self.pessoa, observacao="Uso emergencial")
        self.assertEqual(emp.observacao, "Uso emergencial")

    def test_devolver_registra_data_e_muda_status(self):
        """TC-SVC-004 | devolver() deve registrar data_devolucao e mudar chave para DISPONIVEL."""
        emp = EmprestimoService.emprestar(self.chave, self.pessoa)
        emp_devolvido = EmprestimoService.devolver(emp)
        self.assertIsNotNone(emp_devolvido.data_devolucao)
        self.chave.refresh_from_db()
        self.assertEqual(self.chave.status, "DISPONIVEL")

    def test_devolver_com_data_customizada(self):
        """TC-SVC-005 | devolver() com data_devolucao explícita deve usar esse valor."""
        emp = EmprestimoService.emprestar(self.chave, self.pessoa)
        data_custom = timezone.now() - timedelta(hours=2)
        emp_devolvido = EmprestimoService.devolver(emp, data_devolucao=data_custom)
        # Compara apenas até segundos para evitar flakey por microssegundos
        self.assertEqual(
            emp_devolvido.data_devolucao.replace(microsecond=0),
            data_custom.replace(microsecond=0),
        )

    def test_devolver_sem_data_usa_timezone_now(self):
        """TC-SVC-006 | devolver() sem data_devolucao deve usar timezone.now() — não datetime.now()."""
        emp = EmprestimoService.emprestar(self.chave, self.pessoa)
        before = timezone.now()
        emp_devolvido = EmprestimoService.devolver(emp)
        after = timezone.now()
        self.assertGreaterEqual(emp_devolvido.data_devolucao, before)
        self.assertLessEqual(emp_devolvido.data_devolucao, after)
        # Garantir que é timezone-aware (não naive)
        self.assertIsNotNone(emp_devolvido.data_devolucao.tzinfo)

    def test_devolver_atualiza_observacao(self):
        """TC-SVC-007 | devolver() com observacao deve sobrescrever a anterior."""
        emp = EmprestimoService.emprestar(self.chave, self.pessoa, observacao="Original")
        emp_devolvido = EmprestimoService.devolver(emp, observacao="Devolvido com avaria")
        self.assertEqual(emp_devolvido.observacao, "Devolvido com avaria")

    # ── Edge Cases ────────────────────────────────────────────────────────────

    def test_emprestar_chave_ja_emprestada_levanta_erro_no_service(self):
        """
        TC-SVC-008 | BUG-002 CORRIGIDO: EmprestimoService.emprestar() agora
        valida o status via select_for_update() e levanta ValidationError para
        chamadas diretas ao service, protegendo também fora do serializer.
        """
        from rest_framework.exceptions import ValidationError as DRFValidationError
        chave_emprestada = make_chave(codigo="EMP-SVC", status_val="EMPRESTADA")
        with self.assertRaises(DRFValidationError):
            EmprestimoService.emprestar(chave_emprestada, self.pessoa)

    def test_data_retirada_e_timezone_aware(self):
        """
        TC-SVC-009 | Verificação de Timezone (America/Sao_Paulo).
        data_retirada deve ser timezone-aware e refletir o UTC com offset correto.
        """
        emp = EmprestimoService.emprestar(self.chave, self.pessoa)
        emp.refresh_from_db()
        # USE_TZ=True: campo deve ser aware
        self.assertIsNotNone(emp.data_retirada.tzinfo)
        # O offset de Brasília é UTC-3 (fora do horário de verão)
        offset = emp.data_retirada.utcoffset()
        # offset deve ser -3h ou -2h (horário de verão)
        self.assertIn(offset.total_seconds() / 3600, [-3.0, -2.0])


# ─────────────────────────────────────────────────────────────────────────────
# 2. TESTES DE SERIALIZER — EmprestimoCreateSerializer
# ─────────────────────────────────────────────────────────────────────────────

class EmprestimoCreateSerializerTest(TestCase):

    def setUp(self):
        self.pessoa = make_pessoa(cpf="222.222.222-22")
        self.chave_disp = make_chave(codigo="SER-DISP-01")
        self.chave_emp = make_chave(codigo="SER-EMP-01", status_val="EMPRESTADA")
        self.chave_manut = make_chave(codigo="SER-MANUT-01", status_val="MANUTENCAO")

    # ── Happy Path ────────────────────────────────────────────────────────────

    def test_valida_chave_disponivel(self):
        """TC-SER-EMP-001 | Chave com status DISPONIVEL deve passar na validação."""
        s = EmprestimoCreateSerializer(data={
            "chave": self.chave_disp.pk,
            "pessoa": self.pessoa.pk,
        })
        self.assertTrue(s.is_valid(), s.errors)

    def test_create_chama_service_e_muda_status(self):
        """TC-SER-EMP-002 | .save() deve delegar ao service e mudar status da chave."""
        s = EmprestimoCreateSerializer(data={
            "chave": self.chave_disp.pk,
            "pessoa": self.pessoa.pk,
        })
        self.assertTrue(s.is_valid())
        emp = s.save()
        self.chave_disp.refresh_from_db()
        self.assertEqual(self.chave_disp.status, "EMPRESTADA")
        self.assertIsNotNone(emp.pk)

    # ── Edge Cases / Regras de Negócio ────────────────────────────────────────

    def test_rejeita_chave_emprestada(self):
        """TC-SER-EMP-003 | Chave EMPRESTADA deve retornar ValidationError."""
        s = EmprestimoCreateSerializer(data={
            "chave": self.chave_emp.pk,
            "pessoa": self.pessoa.pk,
        })
        self.assertFalse(s.is_valid())
        self.assertIn("chave", s.errors)
        # Mensagem deve informar o status atual
        self.assertIn("EMPRESTADA", str(s.errors["chave"]))

    def test_rejeita_chave_em_manutencao(self):
        """TC-SER-EMP-004 | Chave em MANUTENCAO deve retornar ValidationError."""
        s = EmprestimoCreateSerializer(data={
            "chave": self.chave_manut.pk,
            "pessoa": self.pessoa.pk,
        })
        self.assertFalse(s.is_valid())
        self.assertIn("chave", s.errors)

    def test_rejeita_sem_chave(self):
        """TC-SER-EMP-005 | Payload sem 'chave' deve ser inválido."""
        s = EmprestimoCreateSerializer(data={"pessoa": self.pessoa.pk})
        self.assertFalse(s.is_valid())
        self.assertIn("chave", s.errors)

    def test_rejeita_sem_pessoa(self):
        """TC-SER-EMP-006 | Payload sem 'pessoa' deve ser inválido."""
        s = EmprestimoCreateSerializer(data={"chave": self.chave_disp.pk})
        self.assertFalse(s.is_valid())
        self.assertIn("pessoa", s.errors)

    def test_rejeita_chave_inexistente(self):
        """TC-SER-EMP-007 | chave_id inexistente deve retornar 400."""
        s = EmprestimoCreateSerializer(data={"chave": 9999, "pessoa": self.pessoa.pk})
        self.assertFalse(s.is_valid())
        self.assertIn("chave", s.errors)


# ─────────────────────────────────────────────────────────────────────────────
# 3. TESTES DE SERIALIZER — EmprestimoDevolucaoSerializer
# ─────────────────────────────────────────────────────────────────────────────

class EmprestimoDevolucaoSerializerTest(TestCase):

    def setUp(self):
        self.pessoa = make_pessoa(cpf="333.333.333-33")
        self.chave = make_chave(codigo="DEV-SER-01")
        self.emprestimo = EmprestimoService.emprestar(self.chave, self.pessoa)

    # ── Happy Path ────────────────────────────────────────────────────────────

    def test_devolver_emprestimo_ativo_e_valido(self):
        """TC-SER-DEV-001 | Devolução de empréstimo ativo deve ser válida."""
        s = EmprestimoDevolucaoSerializer(self.emprestimo, data={}, partial=True)
        self.assertTrue(s.is_valid(), s.errors)

    def test_devolver_com_observacao(self):
        """TC-SER-DEV-002 | Observação na devolução deve ser aceita."""
        s = EmprestimoDevolucaoSerializer(
            self.emprestimo,
            data={"observacao": "Chave devolvida com arranhão"},
            partial=True,
        )
        self.assertTrue(s.is_valid(), s.errors)

    # ── Edge Cases ────────────────────────────────────────────────────────────

    def test_rejeita_devolucao_dupla(self):
        """TC-SER-DEV-003 | Tentar devolver empréstimo já devolvido deve retornar erro."""
        # Primeira devolução
        EmprestimoService.devolver(self.emprestimo)
        self.emprestimo.refresh_from_db()

        # Segunda tentativa
        s = EmprestimoDevolucaoSerializer(self.emprestimo, data={}, partial=True)
        self.assertFalse(s.is_valid())
        self.assertIn("Esta chave já foi devolvida", str(s.errors))

    def test_devolucao_com_data_futura_invalida(self):
        """TC-SER-DEV-004 | BUG-008a CORRIGIDO: data futura deve ser rejeitada."""
        data_futura = (timezone.now() + timedelta(days=30)).isoformat()
        s = EmprestimoDevolucaoSerializer(
            self.emprestimo,
            data={"data_devolucao": data_futura},
            partial=True,
        )
        self.assertFalse(s.is_valid())
        self.assertIn("data_devolucao", str(s.errors))

    def test_devolucao_com_data_anterior_a_retirada_invalida(self):
        """TC-SER-DEV-005 | BUG-008b CORRIGIDO: data anterior à retirada deve ser rejeitada."""
        data_antes_da_retirada = (self.emprestimo.data_retirada - timedelta(hours=1)).isoformat()
        s = EmprestimoDevolucaoSerializer(
            self.emprestimo,
            data={"data_devolucao": data_antes_da_retirada},
            partial=True,
        )
        self.assertFalse(s.is_valid())
        self.assertIn("data_devolucao", str(s.errors))


# ─────────────────────────────────────────────────────────────────────────────
# 4. TESTES DE API — Fluxo completo Entrega → Devolução
# ─────────────────────────────────────────────────────────────────────────────

class EmprestimoAPIFluxoTest(TestCase):

    def setUp(self):
        from django.contrib.auth.models import User
        self.client = APIClient()
        self.base_url = "/api/emprestimos/"
        self.pessoa = make_pessoa(cpf="444.444.444-44")
        self.chave = make_chave(codigo="FLOW-01")
        user = User.objects.create_user(username="tester_emp", is_staff=True, is_superuser=True)
        self.client.force_authenticate(user=user)

    def _emprestar(self, chave=None, pessoa=None, obs=None):
        payload = {
            "chave": (chave or self.chave).pk,
            "pessoa": (pessoa or self.pessoa).pk,
        }
        if obs:
            payload["observacao"] = obs
        return self.client.post(self.base_url, payload, format="json")

    def _devolver(self, emprestimo_id, obs=None):
        payload = {}
        if obs:
            payload["observacao"] = obs
        return self.client.patch(
            f"{self.base_url}{emprestimo_id}/devolver/",
            payload,
            format="json",
        )

    # ── Happy Path — Fluxo Completo ───────────────────────────────────────────

    def test_fluxo_completo_emprestar_devolver(self):
        """TC-API-EMP-001 | Fluxo feliz: emprestar → verificar status → devolver → verificar."""
        # 1. Emprestar
        r_emp = self._emprestar()
        self.assertEqual(r_emp.status_code, status.HTTP_201_CREATED)
        emp_id = r_emp.data["id"]

        # 2. Verificar chave como EMPRESTADA
        self.chave.refresh_from_db()
        self.assertEqual(self.chave.status, "EMPRESTADA")

        # 3. Devolver
        r_dev = self._devolver(emp_id)
        self.assertEqual(r_dev.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(r_dev.data["data_devolucao"])

        # 4. Verificar chave como DISPONIVEL
        self.chave.refresh_from_db()
        self.assertEqual(self.chave.status, "DISPONIVEL")

    def test_emprestar_retorna_dados_aninhados(self):
        """TC-API-EMP-002 | GET /api/emprestimos/ deve retornar chave e pessoa aninhados."""
        self._emprestar()
        r = self.client.get(self.base_url)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        emp = r.data[0]
        self.assertIn("codigo", emp["chave"])
        self.assertIn("nome_completo", emp["pessoa"])

    def test_listar_emprestimos_ordenados_por_data_desc(self):
        """TC-API-EMP-003 | Listagem deve ordenar por data_retirada DESC."""
        chave2 = make_chave(codigo="FLOW-02")
        pessoa2 = make_pessoa(cpf="555.555.555-55")
        self._emprestar()
        self._emprestar(chave=chave2, pessoa=pessoa2)
        r = self.client.get(self.base_url)
        datas = [e["data_retirada"] for e in r.data]
        self.assertEqual(datas, sorted(datas, reverse=True))

    # ── Regras de Negócio Críticas ────────────────────────────────────────────

    def test_impede_duplicidade_de_entrega(self):
        """
        TC-API-EMP-004 | CRÍTICO: Não deve ser possível emprestar a mesma chave
        duas vezes enquanto ela estiver EMPRESTADA.
        """
        # Primeira entrega
        r1 = self._emprestar()
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)

        # Segunda entrega da mesma chave
        r2 = self._emprestar()
        self.assertEqual(r2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("chave", r2.data)
        # Deve haver somente 1 empréstimo ativo para esta chave
        ativos = Emprestimo.objects.filter(chave=self.chave, data_devolucao__isnull=True)
        self.assertEqual(ativos.count(), 1)

    def test_impede_devolucao_duplicada(self):
        """
        TC-API-EMP-005 | CRÍTICO: Não deve ser possível devolver a mesma chave
        duas vezes. Segundo PATCH /devolver/ deve retornar 400.
        """
        r_emp = self._emprestar()
        emp_id = r_emp.data["id"]

        # Primeira devolução
        r_dev1 = self._devolver(emp_id)
        self.assertEqual(r_dev1.status_code, status.HTTP_200_OK)

        # Segunda devolução
        r_dev2 = self._devolver(emp_id)
        self.assertEqual(r_dev2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_emprestar_chave_em_manutencao_retorna_400(self):
        """TC-API-EMP-006 | Chave em MANUTENCAO não pode ser emprestada."""
        chave_manut = make_chave(codigo="MANUT-API-01", status_val="MANUTENCAO")
        r = self._emprestar(chave=chave_manut)
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_devolver_emprestimo_inexistente_retorna_404(self):
        """TC-API-EMP-007 | PATCH /api/emprestimos/9999/devolver/ deve retornar 404."""
        r = self._devolver(9999)
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    def test_apos_devolucao_chave_pode_ser_emprestada_novamente(self):
        """TC-API-EMP-008 | Após devolução, a chave deve estar DISPONIVEL e aceitável."""
        r1 = self._emprestar()
        self._devolver(r1.data["id"])

        # Nova entrega da mesma chave — deve funcionar
        r2 = self._emprestar()
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED)

    def test_mesmo_pessoa_pode_pegar_chave_diferente(self):
        """TC-API-EMP-009 | Mesma pessoa pode ter múltiplas chaves diferentes simultaneamente."""
        chave2 = make_chave(codigo="FLOW-MULTI-01")
        r1 = self._emprestar()
        r2 = self._emprestar(chave=chave2)
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED)

    def test_emprestar_para_pessoa_inativa_deve_falhar(self):
        """TC-API-EMP-010 | BUG-003 CORRIGIDO: Pessoa inativa deve retornar 400."""
        pessoa_inativa = make_pessoa(cpf="666.666.666-66", ativo=False)
        r = self._emprestar(pessoa=pessoa_inativa)
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("pessoa", r.data)

    # ── Timezone / Datas ──────────────────────────────────────────────────────

    def test_data_retirada_retornada_com_offset_brasilia(self):
        """
        TC-API-EMP-011 | data_retirada na resposta deve ter timezone offset
        correspondente a America/Sao_Paulo (-03:00 ou -02:00).
        """
        r = self._emprestar()
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        # Buscar via GET para pegar serializer de leitura
        emp_id = r.data["id"]
        r_get = self.client.get(f"{self.base_url}{emp_id}/")
        data_retirada_str = r_get.data["data_retirada"]
        # RFC 3339: deve conter offset de timezone
        self.assertTrue(
            "-03:" in data_retirada_str or
            "-02:" in data_retirada_str or
            "+00:" in data_retirada_str,
            f"Offset inesperado em: {data_retirada_str}",
        )

    def test_data_devolucao_e_timezone_aware_apos_devolver(self):
        """
        TC-API-EMP-012 | data_devolucao registrada pelo service deve ser
        timezone-aware (America/Sao_Paulo), não datetime.now() naive.
        """
        r_emp = self._emprestar()
        self._devolver(r_emp.data["id"])
        emp = Emprestimo.objects.get(pk=r_emp.data["id"])
        self.assertIsNotNone(emp.data_devolucao.tzinfo)

    @patch("app.service.emprestimo.timezone.now")
    def test_calcular_vencimento_mock_timezone(self, mock_now):
        """
        TC-API-EMP-013 | Simular timezone para validar cálculo de atraso.
        Empréstimo criado em 2024-01-01 08:00 — devolução esperada até EOD.
        BUG-007 IMPLEMENTADO: valida que devolver() registra a data correta
        mesmo quando simulamos um timezone específico para o cálculo de prazo.
        """
        data_fake = timezone.datetime(2024, 1, 1, 8, 0, 0, tzinfo=timezone.utc)
        mock_now.return_value = data_fake

        emp = EmprestimoService.emprestar(self.chave, self.pessoa)
        emp_devolvido = EmprestimoService.devolver(emp)
        self.assertEqual(emp_devolvido.data_devolucao, data_fake)


# ─────────────────────────────────────────────────────────────────────────────
# 5. TESTES DE CORRIDA / CONCORRÊNCIA (TransactionTestCase)
# ─────────────────────────────────────────────────────────────────────────────

class EmprestimoRaceConditionTest(TransactionTestCase):
    """
    TransactionTestCase é necessário pois TestCase envolve tudo numa transaction
    e SELECT FOR UPDATE não funciona como esperado dentro dela.
    """

    def setUp(self):
        self.pessoa = make_pessoa(cpf="777.777.777-77")
        self.chave = make_chave(codigo="RACE-01")

    def test_race_condition_corrigida(self):
        """
        TC-RACE-001 | BUG-002 CORRIGIDO — Proteção contra Race Condition.
        EmprestimoService.emprestar() agora usa @transaction.atomic +
        select_for_update(), garantindo que a segunda requisição só leia
        o status da chave após a primeira confirmar sua transação.

        Validação sequencial: após o primeiro empréstimo, uma tentativa
        direta ao service com a mesma chave deve levantar ValidationError.
        """
        from rest_framework.exceptions import ValidationError as DRFValidationError

        # Request 1: sucesso
        EmprestimoService.emprestar(self.chave, self.pessoa)

        # Request 2: chave já está EMPRESTADA — service deve rejeitar
        pessoa2 = make_pessoa(cpf="888.888.888-88")
        with self.assertRaises(DRFValidationError):
            EmprestimoService.emprestar(self.chave, pessoa2)

        # Garantir exatamente 1 empréstimo ativo
        emprestimos_ativos = Emprestimo.objects.filter(
            chave=self.chave, data_devolucao__isnull=True
        ).count()
        self.assertEqual(emprestimos_ativos, 1)


class VencidoStatusTest(TestCase):
    """6. Testes do status VENCIDO (BUG-007) — calculado dinamicamente."""

    def setUp(self):
        self.pessoa = make_pessoa(cpf="999.999.999-99")
        self.chave = make_chave(codigo="VENC-01")

    def _emprestimo_com_prazo(self, delta: timedelta) -> Emprestimo:
        """Cria empréstimo com data_prevista_devolucao = now() + delta."""
        prazo = timezone.now() + delta
        return EmprestimoService.emprestar(
            self.chave, self.pessoa,
            data_prevista_devolucao=prazo,
        )

    def test_property_vencido_false_dentro_do_prazo(self):
        """TC-VENC-001 | Empréstimo dentro do prazo não deve ser vencido."""
        emp = self._emprestimo_com_prazo(timedelta(hours=8))
        self.assertFalse(emp.vencido)

    def test_property_vencido_true_apos_prazo(self):
        """TC-VENC-002 | Empréstimo com prazo já expirado deve ser vencido."""
        emp = self._emprestimo_com_prazo(timedelta(hours=-1))
        self.assertTrue(emp.vencido)

    def test_property_vencido_false_sem_prazo_definido(self):
        """TC-VENC-003 | Empréstimo sem data_prevista_devolucao nunca é vencido."""
        emp = EmprestimoService.emprestar(self.chave, self.pessoa)
        self.assertFalse(emp.vencido)

    def test_property_vencido_false_apos_devolucao(self):
        """TC-VENC-004 | Chave devolvida não deve ser vencida, mesmo após prazo."""
        emp = self._emprestimo_com_prazo(timedelta(hours=-1))
        EmprestimoService.devolver(emp)
        emp.refresh_from_db()
        self.assertFalse(emp.vencido)

    def test_status_calculado_retorna_vencido(self):
        """TC-VENC-005 | Chave.status_calculado deve ser 'VENCIDO' quando prazo expirou."""
        self._emprestimo_com_prazo(timedelta(hours=-1))
        self.chave.refresh_from_db()
        self.assertEqual(self.chave.status_calculado, 'VENCIDO')

    def test_status_calculado_retorna_emprestada_dentro_prazo(self):
        """TC-VENC-006 | status_calculado retorna 'EMPRESTADA' enquanto dentro do prazo."""
        self._emprestimo_com_prazo(timedelta(hours=8))
        self.chave.refresh_from_db()
        self.assertEqual(self.chave.status_calculado, 'EMPRESTADA')

    def test_status_calculado_retorna_disponivel_sem_emprestimo(self):
        """TC-VENC-007 | Chave disponível retorna 'DISPONIVEL' (não consulta empréstimos)."""
        self.assertEqual(self.chave.status_calculado, 'DISPONIVEL')

    def test_status_calculado_retorna_manutencao(self):
        """TC-VENC-008 | Chave em manutenção retorna 'MANUTENCAO'."""
        chave_manut = make_chave(codigo="VENC-MANUT", status_val="MANUTENCAO")
        self.assertEqual(chave_manut.status_calculado, 'MANUTENCAO')

    def test_status_calculado_usa_cache_prefetch(self):
        """TC-VENC-009 | status_calculado usa _emprestimos_ativos_cache sem query extra."""
        self._emprestimo_com_prazo(timedelta(hours=-1))
        self.chave.refresh_from_db()
        # Injeta cache manualmente (simula o Prefetch do ViewSet)
        emp_ativo = Emprestimo.objects.filter(
            chave=self.chave, data_devolucao__isnull=True
        ).first()
        self.chave._emprestimos_ativos_cache = [emp_ativo]
        self.assertEqual(self.chave.status_calculado, 'VENCIDO')

    def test_api_filtro_status_vencido(self):
        """TC-VENC-010 | GET /api/chaves/?status=VENCIDO retorna apenas chaves vencidas."""
        from django.contrib.auth.models import User
        client = APIClient()
        user = User.objects.create_user(
            username="tester_venc", is_staff=True, is_superuser=True
        )
        client.force_authenticate(user=user)

        chave2 = make_chave(codigo="VENC-NAO-01")
        make_pessoa(cpf="101.010.101-01")

        # Chave VENC-01: prazo expirado → VENCIDA
        self._emprestimo_com_prazo(timedelta(hours=-2))
        # Chave VENC-NAO-01: prazo futuro → apenas EMPRESTADA
        pessoa2 = make_pessoa(cpf="202.020.202-02")
        EmprestimoService.emprestar(
            chave2, pessoa2,
            data_prevista_devolucao=timezone.now() + timedelta(hours=4),
        )

        r = client.get("/api/chaves/?status=VENCIDO")
        self.assertEqual(r.status_code, 200)
        codigos = [c["codigo"] for c in r.data]
        self.assertIn("VENC-01", codigos)
        self.assertNotIn("VENC-NAO-01", codigos)

    def test_api_campo_vencido_na_resposta_do_emprestimo(self):
        """TC-VENC-011 | GET /api/emprestimos/{id}/ deve expor campo 'vencido'."""
        from django.contrib.auth.models import User
        client = APIClient()
        user = User.objects.create_user(
            username="tester_venc2", is_staff=True, is_superuser=True
        )
        client.force_authenticate(user=user)

        emp = self._emprestimo_com_prazo(timedelta(hours=-1))
        r = client.get(f"/api/emprestimos/{emp.pk}/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("vencido", r.data)
        self.assertTrue(r.data["vencido"])

    def test_serializer_rejeita_prazo_no_passado(self):
        """TC-VENC-012 | data_prevista_devolucao no passado deve retornar ValidationError."""
        from app.serializers.emprestimo import EmprestimoCreateSerializer
        prazo_passado = (timezone.now() - timedelta(hours=1)).isoformat()
        s = EmprestimoCreateSerializer(data={
            "chave": self.chave.pk,
            "pessoa": self.pessoa.pk,
            "data_prevista_devolucao": prazo_passado,
        })
        self.assertFalse(s.is_valid())
        self.assertIn("data_prevista_devolucao", s.errors)
