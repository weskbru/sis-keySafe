"""
Comando: python manage.py create_initial_users

Cria os usuários iniciais do sistema a partir de variáveis de ambiente.
É idempotente: se o usuário já existir, nenhuma ação é realizada.
Deve ser executado automaticamente no startup do container (ver docker-compose.yml).
"""
import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Cria os usuários iniciais do sistema se ainda não existirem.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Verificando usuários iniciais...')

        self._criar(
            username=os.environ.get('ADMIN_USERNAME', 'admin'),
            password=os.environ.get('ADMIN_PASSWORD', ''),
            label='Superadmin',
            is_superuser=True,
        )
        self._criar(
            username='bloco_a',
            password=os.environ.get('BLOCO_A_PASSWORD', ''),
            label='Operador Bloco A',
        )
        self._criar(
            username='bloco_f',
            password=os.environ.get('BLOCO_F_PASSWORD', ''),
            label='Operador Bloco F',
        )

        self.stdout.write(self.style.SUCCESS('Verificação concluída.'))

    def _criar(self, username: str, password: str, label: str, is_superuser: bool = False):
        if not password:
            self.stdout.write(
                self.style.WARNING(
                    f'  [IGNORADO] {label}: defina a variável de ambiente correspondente no .env'
                )
            )
            return

        if User.objects.filter(username=username).exists():
            self.stdout.write(f'  [OK] {label} ({username}): já existe.')
            return

        User.objects.create_user(
            username=username,
            password=password,
            is_staff=True,
            is_superuser=is_superuser,
        )
        self.stdout.write(self.style.SUCCESS(f'  [CRIADO] {label} ({username})'))
