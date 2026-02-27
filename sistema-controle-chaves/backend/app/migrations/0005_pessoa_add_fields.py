from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0004_alter_pessoa_tipo_vinculo_prestador'),
    ]

    operations = [
        migrations.AddField(
            model_name='pessoa',
            name='foto',
            field=models.ImageField(blank=True, null=True, upload_to='pessoas/'),
        ),
        migrations.AddField(
            model_name='pessoa',
            name='telefone',
            field=models.CharField(blank=True, default='', max_length=20),
        ),
        migrations.AddField(
            model_name='pessoa',
            name='observacao',
            field=models.TextField(blank=True, default=''),
        ),
    ]
