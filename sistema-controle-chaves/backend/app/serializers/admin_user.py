from django.contrib.auth.models import User
from rest_framework import serializers


class AdminUserSerializer(serializers.ModelSerializer):
    """
    Serializer para criação e gestão de usuários administradores.

    Regras:
      - password é write-only e obrigatório apenas na criação.
      - is_superuser só pode ser concedido por outro superusuário.
      - Todo usuário criado por esta rota recebe is_staff=True automaticamente.
    """

    password = serializers.CharField(
        write_only=True, min_length=8, required=False,
        style={'input_type': 'password'},
    )

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email',
            'first_name', 'last_name',
            'is_staff', 'is_superuser', 'is_active',
            'date_joined', 'password',
        ]
        read_only_fields = ['id', 'date_joined']

    def validate(self, data):
        request = self.context.get('request')

        # Senha obrigatória na criação
        if self.instance is None and not data.get('password'):
            raise serializers.ValidationError(
                {'password': 'A senha é obrigatória ao criar um administrador.'}
            )

        # Apenas superusuários podem conceder is_superuser
        if data.get('is_superuser'):
            is_superuser = request and request.user and request.user.is_superuser
            if not is_superuser:
                raise serializers.ValidationError(
                    {'is_superuser': 'Apenas superusuários podem conceder este privilégio.'}
                )

        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data['is_staff'] = True
        validated_data['is_active'] = True
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
