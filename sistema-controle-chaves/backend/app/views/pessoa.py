from rest_framework import viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from app.models import Pessoa
from app.serializers import PessoaSerializer


class PessoaViewSet(viewsets.ModelViewSet):
    serializer_class = PessoaSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = Pessoa.objects.select_related('setor').order_by('id')
        ativo = self.request.query_params.get('ativo')
        if ativo is not None:
            qs = qs.filter(ativo=ativo.lower() == 'true')
        return qs

    def perform_create(self, serializer):
        # BooleanField via multipart/form-data sem o campo = False (comportamento HTML checkbox).
        # Toda pessoa criada deve começar ativa; desativação é feita explicitamente via PATCH.
        serializer.save(ativo=True)
