import re

from rest_framework import serializers

from app.models import Pessoa

_CPF_RE = re.compile(r'^\d{3}\.\d{3}\.\d{3}-\d{2}$')


class PessoaSerializer(serializers.ModelSerializer):
    setor_nome = serializers.CharField(source='setor.nome', read_only=True)
    cpf_display = serializers.SerializerMethodField()
    foto = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Pessoa
        fields = [
            'id', 'nome_completo', 'cpf', 'cpf_display', 'tipo_vinculo',
            'setor', 'setor_nome', 'foto', 'telefone', 'observacao',
            'ativo', 'criado_em', 'atualizado_em',
        ]
        read_only_fields = ['criado_em', 'atualizado_em']

    def _usuario_privilegiado(self) -> bool:
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        user = request.user
        return user.is_staff or user.groups.filter(name='Operadores').exists()

    def get_cpf_display(self, obj: Pessoa) -> str:
        cpf = obj.cpf  # ex: "123.456.789-00"
        if self._usuario_privilegiado():
            return cpf
        # Mantém apenas os 5 últimos caracteres visíveis: "89-00"
        return f'***.***.**{cpf[-5:]}'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if instance.foto and request:
            data['foto'] = request.build_absolute_uri(instance.foto.url)
        return data

    def validate_cpf(self, value: str) -> str:
        if not _CPF_RE.match(value):
            raise serializers.ValidationError(
                'CPF deve estar no formato 000.000.000-00.'
            )
        return value

    def validate(self, data):
        tipo_vinculo = data.get('tipo_vinculo') or getattr(self.instance, 'tipo_vinculo', None)
        setor = data.get('setor') or getattr(self.instance, 'setor', None)

        if tipo_vinculo == 'SERVIDOR' and setor is None:
            raise serializers.ValidationError(
                {'setor': 'O setor é obrigatório para servidores.'}
            )
        return data
