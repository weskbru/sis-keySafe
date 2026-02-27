from django.db import models
from .setor import Setor


class Pessoa(models.Model):
    TIPO_VINCULO_CHOICES = [
        ('SERVIDOR', 'Servidor'),
        ('PRESTADOR', 'Prestador'),
    ]

    nome_completo = models.CharField(max_length=150)
    cpf = models.CharField(max_length=14, unique=True)
    tipo_vinculo = models.CharField(max_length=20, choices=TIPO_VINCULO_CHOICES)
    setor = models.ForeignKey(
        Setor, null=True, blank=True,
        on_delete=models.SET_NULL, db_column='setor_id',
        related_name='pessoas'
    )
    foto = models.ImageField(upload_to='pessoas/', null=True, blank=True)
    telefone = models.CharField(max_length=20, blank=True, default='')
    observacao = models.TextField(blank=True, default='')
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pessoa'
        verbose_name = 'Pessoa'
        verbose_name_plural = 'Pessoas'

    def __str__(self):
        return self.nome_completo
