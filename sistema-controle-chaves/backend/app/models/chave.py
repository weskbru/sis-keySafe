from django.db import models


class Chave(models.Model):
    STATUS_CHOICES = [
        ('DISPONIVEL', 'Disponível'),
        ('EMPRESTADA', 'Emprestada'),
        ('MANUTENCAO', 'Manutenção'),
    ]

    codigo = models.CharField(max_length=50, unique=True)
    descricao = models.CharField(max_length=200, blank=True, default='')
    localizacao = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DISPONIVEL')
    permitir_servidor = models.BooleanField(default=True)
    permitir_prestador = models.BooleanField(default=True)
    ativo = models.BooleanField(default=True)

    class Meta:
        db_table = 'chave'
        verbose_name = 'Chave'
        verbose_name_plural = 'Chaves'

    def __str__(self):
        return f'{self.codigo} — {self.descricao}'

    @property
    def status_calculado(self) -> str:
        """
        Status efetivo da chave para exibição na interface.

        Retorna 'VENCIDO' quando a chave está EMPRESTADA e o empréstimo
        ativo ultrapassou o prazo — sem gravar esse valor no banco.

        Estratégia N+1:
          O ViewSet usa Prefetch('emprestimos', to_attr='_emprestimos_ativos_cache')
          com os empréstimos ativos já filtrados. Esta property consulta esse
          cache; caso ausente (chamada direta fora do ViewSet), faz uma query
          pontual como fallback.
        """
        if self.status != 'EMPRESTADA':
            return self.status

        cache = getattr(self, '_emprestimos_ativos_cache', None)
        if cache is None:
            cache = list(self.emprestimos.filter(data_devolucao__isnull=True))

        return 'VENCIDO' if any(e.vencido for e in cache) else self.status
