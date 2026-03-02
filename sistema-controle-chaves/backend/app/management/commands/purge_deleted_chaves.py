"""
Comando: python manage.py purge_deleted_chaves [--days 90]

Apaga permanentemente as chaves que foram soft-deletadas (deleted_at preenchido)
há mais de N dias, junto com seus empréstimos históricos associados.

Flags:
  --days N   Número de dias de retenção (padrão: 90)
"""
from datetime import timedelta

from django.utils import timezone
from django.core.management.base import BaseCommand

from app.models import Chave, Emprestimo


class Command(BaseCommand):
    help = 'Apaga permanentemente chaves soft-deletadas há mais de N dias (padrão: 90).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=90,
            help='Dias de retenção antes da exclusão definitiva (padrão: 90).',
        )

    def handle(self, *args, **kwargs):
        days = kwargs['days']
        cutoff = timezone.now() - timedelta(days=days)

        to_purge = Chave.objects.filter(deleted_at__lt=cutoff)
        count = to_purge.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS(
                f'Nenhuma chave soft-deletada há mais de {days} dias. Nada a apagar.'
            ))
            return

        self.stdout.write(f'Apagando {count} chave(s) soft-deletada(s) há mais de {days} dias...')

        # Apaga empréstimos históricos primeiro (FK RESTRICT impediria deleção direta)
        emp_count, _ = Emprestimo.objects.filter(chave__in=to_purge).delete()
        self.stdout.write(f'  {emp_count} empréstimo(s) histórico(s) removido(s).')

        to_purge.delete()
        self.stdout.write(self.style.SUCCESS(
            f'  {count} chave(s) apagada(s) definitivamente.'
        ))
