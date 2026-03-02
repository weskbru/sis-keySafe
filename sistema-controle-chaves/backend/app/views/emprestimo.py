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

    def get_queryset(self):
        qs = Emprestimo.objects.select_related(
            'chave', 'pessoa', 'pessoa__setor'
        ).order_by('-data_retirada')

        params = self.request.query_params

        # ?historico=true → apenas empréstimos com devolução registrada
        if params.get('historico', '').lower() == 'true':
            qs = qs.filter(data_devolucao__isnull=False)

        # ?data_from=YYYY-MM-DD → retirada a partir de
        if params.get('data_from'):
            qs = qs.filter(data_retirada__date__gte=params['data_from'])

        # ?data_to=YYYY-MM-DD → retirada até
        if params.get('data_to'):
            qs = qs.filter(data_retirada__date__lte=params['data_to'])

        # ?nome=texto → busca parcial no nome da pessoa
        if params.get('nome'):
            qs = qs.filter(pessoa__nome_completo__icontains=params['nome'])

        # ?chave=Chave A-01 → código exato da chave
        if params.get('chave'):
            qs = qs.filter(chave__codigo=params['chave'])

        # ?tipo_vinculo=SERVIDOR|PRESTADOR
        if params.get('tipo_vinculo'):
            qs = qs.filter(pessoa__tipo_vinculo=params['tipo_vinculo'].upper())

        return qs

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
