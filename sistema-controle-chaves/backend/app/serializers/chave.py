from rest_framework import serializers
from app.models import Chave


class ChaveSerializer(serializers.ModelSerializer):
    # BUG-007: status efetivo calculado em runtime; nunca grava 'VENCIDO' no banco.
    status_calculado = serializers.CharField(read_only=True)

    class Meta:
        model = Chave
        fields = '__all__'
