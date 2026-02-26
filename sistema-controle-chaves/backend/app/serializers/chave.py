from rest_framework import serializers
from app.models import Chave


class ChaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chave
        fields = '__all__'
