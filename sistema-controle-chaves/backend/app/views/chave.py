from django.db.models import Prefetch
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.response import Response

from app.models import Chave, Emprestimo
from app.serializers import ChaveSerializer


class ChaveViewSet(viewsets.ModelViewSet):
    serializer_class = ChaveSerializer

    def get_queryset(self):
        # Pré-carrega apenas empréstimos ativos em _emprestimos_ativos_cache.
        # A property Chave.status_calculado usa esse atributo para evitar N+1.
        emprestimos_ativos = Prefetch(
            'emprestimos',
            queryset=Emprestimo.objects.filter(data_devolucao__isnull=True),
            to_attr='_emprestimos_ativos_cache',
        )
        qs = Chave.objects.prefetch_related(emprestimos_ativos).order_by('id')

        # Oculta chaves soft-deletadas (deleted_at preenchido)
        qs = qs.filter(deleted_at__isnull=True)

        status_param = self.request.query_params.get('status')
        ativo = self.request.query_params.get('ativo')

        if status_param:
            status_upper = status_param.upper()
            if status_upper == 'VENCIDO':
                # BUG-007: VENCIDO não é armazenado no banco; traduzimos para
                # uma query sobre chaves emprestadas com prazo expirado.
                qs = qs.filter(
                    status='EMPRESTADA',
                    emprestimos__data_devolucao__isnull=True,
                    emprestimos__data_prevista_devolucao__lt=timezone.now(),
                )
            else:
                qs = qs.filter(status=status_upper)

        if ativo is not None:
            qs = qs.filter(ativo=ativo.lower() == 'true')

        return qs

    def destroy(self, request, *args, **kwargs):
        chave = self.get_object()
        if chave.status == 'EMPRESTADA':
            return Response(
                {'detail': 'Não é possível excluir uma chave que está emprestada. '
                           'Registre a devolução antes de excluí-la.'},
                status=status.HTTP_409_CONFLICT,
            )
        # Soft delete: marca como excluída e inativa, permanece no banco por 90 dias
        chave.deleted_at = timezone.now()
        chave.ativo = False
        chave.save(update_fields=['deleted_at', 'ativo'])
        return Response(status=status.HTTP_204_NO_CONTENT)
