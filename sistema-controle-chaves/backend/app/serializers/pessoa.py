from rest_framework import serializers
from app.models import Pessoa


class PessoaSerializer(serializers.ModelSerializer):
    setor_nome = serializers.CharField(source='setor.nome', read_only=True)

    class Meta:
        model = Pessoa
        fields = [
            'id', 'nome_completo', 'cpf', 'tipo_vinculo',
            'setor', 'setor_nome', 'ativo', 'criado_em', 'atualizado_em',
        ]
        read_only_fields = ['criado_em', 'atualizado_em']
