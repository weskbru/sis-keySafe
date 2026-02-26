from rest_framework import viewsets
from app.models import Pessoa
from app.serializers import PessoaSerializer


class PessoaViewSet(viewsets.ModelViewSet):
    serializer_class = PessoaSerializer

    def get_queryset(self):
        qs = Pessoa.objects.select_related('setor').order_by('id')
        ativo = self.request.query_params.get('ativo')
        if ativo is not None:
            qs = qs.filter(ativo=ativo.lower() == 'true')
        return qs
