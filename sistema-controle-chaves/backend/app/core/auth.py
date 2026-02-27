from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class AdminTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Estende o serializer padrão do SimpleJWT com duas responsabilidades:
      1. Rejeita com 403 qualquer usuário que não tenha is_staff=True.
      2. Embute claims extras no payload do JWT para uso no frontend.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['is_superuser'] = user.is_superuser
        return token

    def validate(self, attrs):
        # super().validate() autentica credenciais e preenche self.user
        data = super().validate(attrs)

        if not self.user.is_staff:
            raise PermissionDenied(
                'Acesso negado. Apenas administradores podem acessar o sistema.'
            )

        return data


class AdminTokenObtainPairView(TokenObtainPairView):
    serializer_class = AdminTokenObtainPairSerializer
