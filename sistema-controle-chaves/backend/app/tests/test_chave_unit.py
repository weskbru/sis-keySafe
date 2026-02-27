"""
TESTES UNITÁRIOS — Cadastro de Chaves

Cobre:
  Model Chave (constraints, defaults, __str__)
  ChaveSerializer (validação de campos)
  ChaveViewSet (filtros query param)
  Edge cases: campo vazio, código duplicado, status inválido
"""
from django.test import TestCase
from django.db import IntegrityError
from rest_framework.test import APIClient
from rest_framework import status

from app.models import Chave, Emprestimo
from app.serializers import ChaveSerializer


def make_chave(**kwargs) -> Chave:
    """Cria uma Chave com valores padrão sobrescrevíveis."""
    defaults = {
        "codigo": "TI-TEST-01",
        "descricao": "Sala de Servidores",
        "status": "DISPONIVEL",
        "ativo": True,
    }
    defaults.update(kwargs)
    return Chave.objects.create(**defaults)


class ChaveModelTest(TestCase):
    """1. Testes de Model"""

    def test_criacao_com_campos_minimos(self):
        """TC-CHV-001 | Criar chave apenas com código obrigatório."""
        chave = Chave.objects.create(codigo="MIN-01")
        self.assertEqual(chave.codigo, "MIN-01")
        self.assertEqual(chave.status, "DISPONIVEL")
        self.assertTrue(chave.ativo)
        self.assertIsNone(chave.descricao)

    def test_criacao_com_todos_os_campos(self):
        """TC-CHV-002 | Criar chave com código, descrição, status e ativo."""
        chave = make_chave(status="MANUTENCAO", ativo=False)
        self.assertEqual(chave.status, "MANUTENCAO")
        self.assertFalse(chave.ativo)

    def test_str_representa_codigo_e_descricao(self):
        """TC-CHV-003 | __str__ deve conter código e descrição."""
        chave = make_chave(codigo="TI-01", descricao="Sala TI")
        self.assertIn("TI-01", str(chave))
        self.assertIn("Sala TI", str(chave))

    def test_str_sem_descricao(self):
        """TC-CHV-004 | __str__ com descricao=None não deve lançar exceção."""
        chave = Chave.objects.create(codigo="SEM-DESC-01", descricao=None)
        self.assertIn("SEM-DESC-01", str(chave))

    def test_codigo_duplicado_levanta_integrity_error(self):
        """TC-CHV-005 | Código único: segundo insert com mesmo código deve falhar."""
        Chave.objects.create(codigo="DUPLO-01")
        with self.assertRaises(IntegrityError):
            Chave.objects.create(codigo="DUPLO-01")

    def test_codigo_em_branco_deve_falhar(self):
        """TC-CHV-006 | full_clean() deve rejeitar código em branco (blank=False)."""
        chave = Chave(codigo="", descricao="Teste")
        with self.assertRaises(Exception):
            chave.full_clean()

    def test_status_invalido_rejeitado_por_full_clean(self):
        """TC-CHV-007 | Status fora dos choices deve ser rejeitado por full_clean."""
        chave = Chave(codigo="STATUS-ERR", status="VENCIDO")
        with self.assertRaises(Exception):
            chave.full_clean()

    def test_codigo_com_50_caracteres_e_aceito(self):
        """TC-CHV-008 | Código com max_length=50 exato deve ser salvo."""
        codigo_max = "X" * 50
        chave = Chave.objects.create(codigo=codigo_max)
        self.assertEqual(len(chave.codigo), 50)

    def test_codigo_com_51_caracteres_e_rejeitado(self):
        """TC-CHV-009 | Código com 51 chars deve falhar na validação do Django."""
        chave = Chave(codigo="X" * 51)
        with self.assertRaises(Exception):
            chave.full_clean()

    def test_descricao_com_200_caracteres_aceita(self):
        """TC-CHV-010 | Descrição com max_length=200 exato deve ser salva."""
        chave = make_chave(descricao="D" * 200)
        self.assertEqual(len(chave.descricao), 200)

    def test_soft_delete_via_campo_ativo(self):
        """TC-CHV-011 | Desativar chave (ativo=False) mantém registro no banco."""
        chave = make_chave()
        chave.ativo = False
        chave.save(update_fields=["ativo"])
        chave.refresh_from_db()
        self.assertFalse(chave.ativo)
        self.assertEqual(Chave.objects.filter(pk=chave.pk).count(), 1)


class ChaveSerializerTest(TestCase):
    """2. Testes de Serializer"""

    def test_serializer_valida_payload_minimo(self):
        """TC-SER-001 | Payload apenas com código deve ser válido."""
        s = ChaveSerializer(data={"codigo": "API-01"})
        self.assertTrue(s.is_valid(), s.errors)

    def test_serializer_valida_payload_completo(self):
        """TC-SER-002 | Payload com todos os campos válidos."""
        s = ChaveSerializer(data={
            "codigo": "API-02",
            "descricao": "Sala de Reunião",
            "status": "DISPONIVEL",
            "ativo": True,
        })
        self.assertTrue(s.is_valid(), s.errors)

    def test_serializer_serializa_objeto_existente(self):
        """TC-SER-003 | Serializer deve expor todos os campos do modelo."""
        chave = make_chave()
        data = ChaveSerializer(chave).data
        for campo in ["id", "codigo", "descricao", "status", "ativo"]:
            self.assertIn(campo, data)

    def test_serializer_rejeita_codigo_vazio(self):
        """TC-SER-004 | Código em branco deve invalidar o serializer."""
        s = ChaveSerializer(data={"codigo": ""})
        self.assertFalse(s.is_valid())
        self.assertIn("codigo", s.errors)

    def test_serializer_rejeita_codigo_ausente(self):
        """TC-SER-005 | Payload sem código deve invalidar o serializer."""
        s = ChaveSerializer(data={"descricao": "Sem codigo"})
        self.assertFalse(s.is_valid())
        self.assertIn("codigo", s.errors)

    def test_serializer_rejeita_status_invalido(self):
        """TC-SER-006 | Status fora dos choices deve ser rejeitado."""
        s = ChaveSerializer(data={"codigo": "X-01", "status": "VENCIDO"})
        self.assertFalse(s.is_valid())
        self.assertIn("status", s.errors)

    def test_serializer_rejeita_codigo_duplicado(self):
        """TC-SER-007 | Código já existente deve falhar na criação via serializer."""
        make_chave(codigo="DUP-SER-01")
        s = ChaveSerializer(data={"codigo": "DUP-SER-01"})
        self.assertFalse(s.is_valid())
        self.assertIn("codigo", s.errors)


class ChaveAPITest(TestCase):
    """3. Testes de API (ViewSet) — Cadastro de Chaves com JWT ativo."""

    def setUp(self):
        from django.contrib.auth.models import User
        self.client = APIClient()
        self.base_url = "/api/chaves/"
        user = User.objects.create_user(username="tester", is_staff=True, is_superuser=True)
        self.client.force_authenticate(user=user)

    def test_listar_chaves_retorna_200(self):
        """TC-API-CHV-001 | GET /api/chaves/ deve retornar 200."""
        make_chave(codigo="LIST-01")
        r = self.client.get(self.base_url)
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_criar_chave_retorna_201(self):
        """TC-API-CHV-002 | POST /api/chaves/ com payload válido retorna 201."""
        r = self.client.post(self.base_url, {"codigo": "POST-01"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data["status"], "DISPONIVEL")

    def test_detalhar_chave_retorna_200(self):
        """TC-API-CHV-003 | GET /api/chaves/{id}/ deve retornar 200 com dados."""
        chave = make_chave(codigo="DET-01")
        r = self.client.get(f"{self.base_url}{chave.pk}/")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["codigo"], "DET-01")

    def test_atualizar_descricao_retorna_200(self):
        """TC-API-CHV-004 | PATCH /api/chaves/{id}/ atualiza descrição."""
        chave = make_chave(codigo="PATCH-01")
        r = self.client.patch(
            f"{self.base_url}{chave.pk}/",
            {"descricao": "Nova Descrição"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["descricao"], "Nova Descrição")

    def test_deletar_chave_retorna_204(self):
        """TC-API-CHV-005 | DELETE /api/chaves/{id}/ retorna 204."""
        chave = make_chave(codigo="DEL-01")
        r = self.client.delete(f"{self.base_url}{chave.pk}/")
        self.assertEqual(r.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Chave.objects.filter(pk=chave.pk).exists())

    def test_filtro_por_status_disponivel(self):
        """TC-API-CHV-006 | ?status=DISPONIVEL deve retornar apenas chaves disponíveis."""
        make_chave(codigo="DISP-01", status="DISPONIVEL")
        make_chave(codigo="EMP-01", status="EMPRESTADA")
        r = self.client.get(f"{self.base_url}?status=DISPONIVEL")
        codigos = [c["codigo"] for c in r.data]
        self.assertIn("DISP-01", codigos)
        self.assertNotIn("EMP-01", codigos)

    def test_filtro_por_status_case_insensitive(self):
        """TC-API-CHV-007 | ?status=disponivel (minúsculo) deve funcionar igual."""
        make_chave(codigo="CI-01", status="DISPONIVEL")
        r = self.client.get(f"{self.base_url}?status=disponivel")
        codigos = [c["codigo"] for c in r.data]
        self.assertIn("CI-01", codigos)

    def test_filtro_por_ativo_true(self):
        """TC-API-CHV-008 | ?ativo=true deve retornar apenas chaves ativas."""
        make_chave(codigo="ATIV-01", ativo=True)
        make_chave(codigo="INAT-01", ativo=False)
        r = self.client.get(f"{self.base_url}?ativo=true")
        codigos = [c["codigo"] for c in r.data]
        self.assertIn("ATIV-01", codigos)
        self.assertNotIn("INAT-01", codigos)

    def test_filtro_por_ativo_false(self):
        """TC-API-CHV-009 | ?ativo=false deve retornar apenas chaves inativas."""
        make_chave(codigo="INAT-02", ativo=False)
        r = self.client.get(f"{self.base_url}?ativo=false")
        codigos = [c["codigo"] for c in r.data]
        self.assertIn("INAT-02", codigos)

    def test_filtro_status_invalido_retorna_lista_vazia(self):
        """TC-API-CHV-010 | ?status=INVALIDO não deve retornar resultados."""
        make_chave(codigo="FLT-01")
        r = self.client.get(f"{self.base_url}?status=INVALIDO")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(len(r.data), 0)

    def test_criar_chave_codigo_duplicado_retorna_400(self):
        """TC-API-CHV-011 | POST com código já existente deve retornar 400."""
        make_chave(codigo="DUP-API-01")
        r = self.client.post(self.base_url, {"codigo": "DUP-API-01"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("codigo", r.data)

    def test_criar_chave_sem_codigo_retorna_400(self):
        """TC-API-CHV-012 | POST sem campo 'codigo' deve retornar 400."""
        r = self.client.post(self.base_url, {"descricao": "Sem código"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_criar_chave_status_invalido_retorna_400(self):
        """TC-API-CHV-013 | POST com status='VENCIDO' deve retornar 400."""
        r = self.client.post(
            self.base_url,
            {"codigo": "ERR-01", "status": "VENCIDO"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_detalhar_chave_inexistente_retorna_404(self):
        """TC-API-CHV-014 | GET /api/chaves/9999/ deve retornar 404."""
        r = self.client.get(f"{self.base_url}9999/")
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    def test_deletar_chave_emprestada_deve_falhar(self):
        """TC-API-CHV-015 | BUG-004 CORRIGIDO: DELETE em chave com empréstimo retorna 409."""
        from app.models import Pessoa, Setor
        setor = Setor.objects.create(nome="TI-DEL-TEST")
        pessoa = Pessoa.objects.create(
            nome_completo="João Teste",
            cpf="000.000.000-01",
            tipo_vinculo="SERVIDOR",
            setor=setor,
        )
        chave = make_chave(codigo="RESTR-01", status="EMPRESTADA")
        Emprestimo.objects.create(chave=chave, pessoa=pessoa)

        r = self.client.delete(f"{self.base_url}{chave.pk}/")
        self.assertEqual(r.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("empréstimos", r.data["detail"])
