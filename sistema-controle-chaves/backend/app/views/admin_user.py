from django.contrib.auth.models import User
from rest_framework import viewsets
from rest_framework.permissions import BasePermission, IsAdminUser

from app.serializers.admin_user import AdminUserSerializer


class IsSuperUser(BasePermission):
    """Permite somente superusuários em operações de escrita."""

    message = 'Apenas superusuários podem realizar esta operação.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Gerencia usuários administradores do sistema.

    Leitura (list/retrieve): qualquer admin (is_staff=True).
    Escrita (create/update/delete): apenas superusuários.
    """

    serializer_class = AdminUserSerializer

    def get_queryset(self):
        return User.objects.filter(is_staff=True).order_by('username')

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsSuperUser()]
        return [IsAdminUser()]
