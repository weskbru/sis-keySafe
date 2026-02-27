"""
Migration 0004
  1. Converte dados existentes: tipo_vinculo='TERCEIRIZADO' → 'PRESTADOR'
  2. Atualiza choices do campo para refletir a nomenclatura operacional correta
"""
from django.db import migrations, models


def renomear_terceirizado_para_prestador(apps, schema_editor):
    Pessoa = apps.get_model('app', 'Pessoa')
    Pessoa.objects.filter(tipo_vinculo='TERCEIRIZADO').update(tipo_vinculo='PRESTADOR')


def reverter_prestador_para_terceirizado(apps, schema_editor):
    Pessoa = apps.get_model('app', 'Pessoa')
    Pessoa.objects.filter(tipo_vinculo='PRESTADOR').update(tipo_vinculo='TERCEIRIZADO')


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0003_chave_descricao_not_null_emprestimo_prazo'),
    ]

    operations = [
        # Passo 1: migra dados existentes antes de alterar os choices
        migrations.RunPython(
            renomear_terceirizado_para_prestador,
            reverter_prestador_para_terceirizado,
        ),
        # Passo 2: atualiza choices no schema do Django
        migrations.AlterField(
            model_name='pessoa',
            name='tipo_vinculo',
            field=models.CharField(
                choices=[('SERVIDOR', 'Servidor'), ('PRESTADOR', 'Prestador')],
                max_length=20,
            ),
        ),
    ]
