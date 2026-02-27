from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from app.models import Chave, Emprestimo


class EmprestimoService:

    @staticmethod
    @transaction.atomic
    def emprestar(chave: Chave, pessoa, data_prevista_devolucao=None, observacao: str | None = None) -> Emprestimo:
        """
        Cria um empréstimo e marca a chave como EMPRESTADA.

        BUG-002: select_for_update() adquire lock de linha no PostgreSQL.
        Requisições concorrentes que tentem emprestar a mesma chave ficam
        bloqueadas até este bloco confirmar ou reverter — eliminando a race
        condition onde duas threads passavam pelo validate_chave() antes de
        qualquer uma atualizar o status.
        """
        chave_locked = (
            Chave.objects
            .select_for_update()
            .get(pk=chave.pk)
        )

        # Defesa em profundidade: o serializer já valida, mas o service
        # também protege para chamadas diretas (scripts, management commands).
        if chave_locked.status != 'DISPONIVEL':
            raise serializers.ValidationError(
                {'chave': f'A chave "{chave_locked.codigo}" não está disponível '
                          f'(status atual: {chave_locked.status}).'}
            )

        emprestimo = Emprestimo.objects.create(
            chave=chave_locked,
            pessoa=pessoa,
            data_prevista_devolucao=data_prevista_devolucao,
            observacao=observacao,
        )
        chave_locked.status = 'EMPRESTADA'
        chave_locked.save(update_fields=['status'])
        return emprestimo

    @staticmethod
    @transaction.atomic
    def devolver(emprestimo: Emprestimo, data_devolucao=None, observacao=None) -> Emprestimo:
        """Registra a devolução e marca a chave como DISPONIVEL."""
        emprestimo.data_devolucao = data_devolucao or timezone.now()
        if observacao is not None:
            emprestimo.observacao = observacao
        emprestimo.save()

        emprestimo.chave.status = 'DISPONIVEL'
        emprestimo.chave.save(update_fields=['status'])

        return emprestimo
