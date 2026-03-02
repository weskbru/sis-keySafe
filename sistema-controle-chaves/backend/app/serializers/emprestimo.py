from django.utils import timezone
from rest_framework import serializers

from app.models import Emprestimo, Chave, Pessoa


class ChaveResumoSerializer(serializers.ModelSerializer):
    # BUG-007: inclui status_calculado para que a listagem de empréstimos
    # já reflita VENCIDO sem precisar de uma segunda chamada à API.
    status_calculado = serializers.CharField(read_only=True)

    class Meta:
        model = Chave
        fields = ['id', 'codigo', 'descricao', 'status', 'status_calculado']


class PessoaResumoSerializer(serializers.ModelSerializer):
    setor_nome = serializers.CharField(source='setor.nome', read_only=True)

    class Meta:
        model = Pessoa
        fields = ['id', 'nome_completo', 'cpf', 'tipo_vinculo', 'setor_nome']


class EmprestimoSerializer(serializers.ModelSerializer):
    """Leitura com dados aninhados."""
    chave = ChaveResumoSerializer(read_only=True)
    pessoa = PessoaResumoSerializer(read_only=True)
    # BUG-007: campo calculado — True quando prazo venceu e não houve devolução.
    vencido = serializers.BooleanField(read_only=True)

    class Meta:
        model = Emprestimo
        fields = [
            'id', 'chave', 'pessoa',
            'data_retirada', 'data_prevista_devolucao', 'data_devolucao',
            'observacao', 'vencido',
        ]


class EmprestimoCreateSerializer(serializers.ModelSerializer):
    """Escrita: valida disponibilidade e delega ao service."""

    class Meta:
        model = Emprestimo
        fields = ['id', 'chave', 'pessoa', 'data_prevista_devolucao', 'observacao']

    def validate_chave(self, chave):
        if chave.status != 'DISPONIVEL':
            raise serializers.ValidationError(
                f'A chave "{chave.codigo}" não está disponível (status atual: {chave.status}).'
            )
        return chave

    def validate_pessoa(self, pessoa):
        if not pessoa.ativo:
            raise serializers.ValidationError(
                f'A pessoa "{pessoa.nome_completo}" está inativa e não pode retirar chaves.'
            )
        return pessoa

    def validate_data_prevista_devolucao(self, value):
        if value and value <= timezone.now():
            raise serializers.ValidationError(
                'O prazo de devolução deve ser uma data futura.'
            )
        return value

    def validate(self, data):
        return data

    def create(self, validated_data):
        from app.service.emprestimo import EmprestimoService
        return EmprestimoService.emprestar(
            chave=validated_data['chave'],
            pessoa=validated_data['pessoa'],
            data_prevista_devolucao=validated_data.get('data_prevista_devolucao'),
            observacao=validated_data.get('observacao'),
        )


class EmprestimoDevolucaoSerializer(serializers.ModelSerializer):
    """Escrita: registra a devolução e delega ao service."""

    class Meta:
        model = Emprestimo
        fields = ['data_devolucao', 'observacao']

    def validate(self, data):
        emprestimo = self.instance

        if emprestimo and emprestimo.data_devolucao:
            raise serializers.ValidationError('Esta chave já foi devolvida.')

        data_devolucao = data.get('data_devolucao')

        if data_devolucao and data_devolucao > timezone.now():
            raise serializers.ValidationError(
                {'data_devolucao': 'A data de devolução não pode ser no futuro.'}
            )

        if emprestimo and data_devolucao and data_devolucao < emprestimo.data_retirada:
            raise serializers.ValidationError(
                {'data_devolucao': (
                    'A data de devolução não pode ser anterior à data de retirada '
                    f'({emprestimo.data_retirada.strftime("%d/%m/%Y %H:%M")}).'
                )}
            )

        return data

    def update(self, instance, validated_data):
        from app.service.emprestimo import EmprestimoService
        return EmprestimoService.devolver(
            emprestimo=instance,
            data_devolucao=validated_data.get('data_devolucao'),
            observacao=validated_data.get('observacao', instance.observacao),
        )
