"""
Migration 0003
  1. Converte chave.descricao de NULL → '' (remove null=True, S6553)
  2. Adiciona emprestimo.data_prevista_devolucao (BUG-007)
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0002_alter_pessoa_tipo_vinculo'),
    ]

    operations = [
        # Passo 1: preenche NULLs existentes antes de remover a constraint
        migrations.RunSQL(
            sql="UPDATE chave SET descricao = '' WHERE descricao IS NULL",
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Passo 2: remove null=True do CharField (alinha com S6553)
        migrations.AlterField(
            model_name='chave',
            name='descricao',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
        # Passo 3: adiciona prazo de devolução ao empréstimo (BUG-007)
        migrations.AddField(
            model_name='emprestimo',
            name='data_prevista_devolucao',
            field=models.DateTimeField(
                blank=True,
                null=True,
                help_text='Prazo máximo para devolução. Quando vencido e não devolvido, '
                          'a chave aparece como VENCIDA na interface.',
            ),
        ),
    ]
