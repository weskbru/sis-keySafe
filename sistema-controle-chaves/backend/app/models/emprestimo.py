from django.db import models
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
    data_devolucao = models.DateTimeField(null=True, blank=True)
    observacao = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'emprestimo'
        verbose_name = 'Empréstimo'
        verbose_name_plural = 'Empréstimos'

    def __str__(self):
        return f'Empréstimo #{self.pk} — {self.chave.codigo} para {self.pessoa.nome_completo}'
