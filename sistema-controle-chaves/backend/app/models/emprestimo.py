from django.db import models
from django.utils import timezone

from .chave import Chave
from .pessoa import Pessoa


class Emprestimo(models.Model):
    chave = models.ForeignKey(
        Chave, on_delete=models.RESTRICT,
        db_column='chave_id', related_name='emprestimos'
    )
    pessoa = models.ForeignKey(
        Pessoa, on_delete=models.RESTRICT,
        db_column='pessoa_id', related_name='emprestimos'
    )
    data_retirada = models.DateTimeField(auto_now_add=True)
    data_prevista_devolucao = models.DateTimeField(
        null=True, blank=True,
        help_text='Prazo máximo para devolução. Quando vencido e não devolvido, '
                  'a chave aparece como VENCIDA na interface.',
    )
    data_devolucao = models.DateTimeField(null=True, blank=True)
    observacao = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'emprestimo'
        verbose_name = 'Empréstimo'
        verbose_name_plural = 'Empréstimos'

    def __str__(self):
        return f'Empréstimo #{self.pk} — {self.chave.codigo} para {self.pessoa.nome_completo}'

    @property
    def vencido(self) -> bool:
        """
        True quando o prazo de devolução foi ultrapassado e a chave ainda
        não foi devolvida. Calculado em tempo de execução — nunca persiste
        'VENCIDO' no banco para evitar inconsistência de dados.
        """
        return (
            self.data_devolucao is None
            and self.data_prevista_devolucao is not None
            and self.data_prevista_devolucao < timezone.now()
        )
