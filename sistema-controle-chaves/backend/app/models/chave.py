from django.db import models


class Chave(models.Model):
    STATUS_CHOICES = [
        ('DISPONIVEL', 'Disponível'),
        ('EMPRESTADA', 'Emprestada'),
        ('MANUTENCAO', 'Manutenção'),
    ]

    codigo = models.CharField(max_length=50, unique=True)
    descricao = models.CharField(max_length=200, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DISPONIVEL')
    ativo = models.BooleanField(default=True)

    class Meta:
        db_table = 'chave'
        verbose_name = 'Chave'
        verbose_name_plural = 'Chaves'

    def __str__(self):
        return f'{self.codigo} — {self.descricao}'
