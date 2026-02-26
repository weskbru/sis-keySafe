from rest_framework import serializers
from app.models import Emprestimo, Chave, Pessoa


class ChaveResumoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chave
        fields = ['id', 'codigo', 'descricao', 'status']


class PessoaResumoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pessoa
        fields = ['id', 'nome_completo', 'cpf', 'tipo_vinculo']


class EmprestimoSerializer(serializers.ModelSerializer):
    """Leitura com dados aninhados."""
    chave = ChaveResumoSerializer(read_only=True)
    pessoa = PessoaResumoSerializer(read_only=True)

    class Meta:
        model = Emprestimo
        fields = ['id', 'chave', 'pessoa', 'data_retirada', 'data_devolucao', 'observacao']


class EmprestimoCreateSerializer(serializers.ModelSerializer):
    """Escrita: valida disponibilidade e delega ao service."""

    class Meta:
        model = Emprestimo
        fields = ['id', 'chave', 'pessoa', 'observacao']

    def validate_chave(self, chave):
        if chave.status != 'DISPONIVEL':
            raise serializers.ValidationError(
                f'A chave "{chave.codigo}" não está disponível (status atual: {chave.status}).'
            )
        return chave

    def create(self, validated_data):
        from app.service.emprestimo import EmprestimoService
        return EmprestimoService.emprestar(
            chave=validated_data['chave'],
            pessoa=validated_data['pessoa'],
            observacao=validated_data.get('observacao'),
        )


class EmprestimoDevolucaoSerializer(serializers.ModelSerializer):
    """Escrita: registra a devolução e delega ao service."""

    class Meta:
        model = Emprestimo
        fields = ['data_devolucao', 'observacao']

    def validate(self, data):
        if self.instance and self.instance.data_devolucao:
            raise serializers.ValidationError('Esta chave já foi devolvida.')
        return data

    def update(self, instance, validated_data):
        from app.service.emprestimo import EmprestimoService
        return EmprestimoService.devolver(
            emprestimo=instance,
            data_devolucao=validated_data.get('data_devolucao'),
            observacao=validated_data.get('observacao', instance.observacao),
        )
