from rest_framework import viewsets, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from app.models import Pessoa
from app.serializers import PessoaSerializer


class PessoaViewSet(viewsets.ModelViewSet):
    serializer_class = PessoaSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = Pessoa.objects.select_related('setor').order_by('id')
        ativo = self.request.query_params.get('ativo')
        # Por padrão mostra apenas pessoas ativas; ?ativo=false mostra inativas
        if ativo is not None:
            qs = qs.filter(ativo=ativo.lower() == 'true')
        else:
            qs = qs.filter(ativo=True)
        return qs

    def perform_create(self, serializer):
        # BooleanField via multipart/form-data sem o campo = False (comportamento HTML checkbox).
        # Toda pessoa criada deve começar ativa; desativação é feita explicitamente via PATCH.
        serializer.save(ativo=True)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.emprestimos.filter(data_devolucao__isnull=True).exists():
            return Response(
                {'detail': 'Esta pessoa possui chaves emprestadas e não pode ser removida. '
                           'Registre a devolução antes de removê-la.'},
                status=status.HTTP_409_CONFLICT,
            )
        # Soft delete: preserva o histórico de empréstimos
        instance.ativo = False
        instance.save(update_fields=['ativo'])
        return Response(status=status.HTTP_204_NO_CONTENT)
