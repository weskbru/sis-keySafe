from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0005_pessoa_add_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='chave',
            name='localizacao',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='chave',
            name='permitir_servidor',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='chave',
            name='permitir_prestador',
            field=models.BooleanField(default=True),
        ),
    ]
