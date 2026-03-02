from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


class MeView(APIView):
    """Retorna os dados do usuário autenticado."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        full_name = f'{user.first_name} {user.last_name}'.strip() or user.username
        return Response({
            'id': user.id,
            'username': user.username,
            'full_name': full_name,
            'email': user.email,
            'is_superuser': user.is_superuser,
        })
