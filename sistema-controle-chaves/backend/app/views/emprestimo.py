from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from app.models import Emprestimo
from app.serializers import (
    EmprestimoSerializer,
    EmprestimoCreateSerializer,
    EmprestimoDevolucaoSerializer,
)


class EmprestimoViewSet(viewsets.ModelViewSet):
    queryset = Emprestimo.objects.select_related('chave', 'pessoa').order_by('-data_retirada')

    def get_serializer_class(self):
        if self.action == 'create':
            return EmprestimoCreateSerializer
        if self.action == 'devolver':
            return EmprestimoDevolucaoSerializer
        return EmprestimoSerializer

    @action(detail=True, methods=['patch'], url_path='devolver')
    def devolver(self, request, pk=None):
        emprestimo = self.get_object()
        serializer = EmprestimoDevolucaoSerializer(
            emprestimo, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(EmprestimoSerializer(emprestimo).data, status=status.HTTP_200_OK)
