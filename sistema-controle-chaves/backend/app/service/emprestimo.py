from django.utils import timezone
from app.models import Chave, Emprestimo


class EmprestimoService:

    @staticmethod
    def emprestar(chave: Chave, pessoa, observacao: str | None = None) -> Emprestimo:
        """Cria um empréstimo e marca a chave como EMPRESTADA."""
        emprestimo = Emprestimo.objects.create(
            chave=chave,
            pessoa=pessoa,
            observacao=observacao,
        )
        chave.status = 'EMPRESTADA'
        chave.save(update_fields=['status'])
        return emprestimo

    @staticmethod
    def devolver(emprestimo: Emprestimo, data_devolucao=None, observacao=None) -> Emprestimo:
        """Registra a devolução e marca a chave como DISPONIVEL."""
        emprestimo.data_devolucao = data_devolucao or timezone.now()
        if observacao is not None:
            emprestimo.observacao = observacao
        emprestimo.save()

        emprestimo.chave.status = 'DISPONIVEL'
        emprestimo.chave.save(update_fields=['status'])

        return emprestimo
