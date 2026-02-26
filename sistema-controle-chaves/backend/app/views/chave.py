from rest_framework import viewsets
from app.models import Chave
from app.serializers import ChaveSerializer


class ChaveViewSet(viewsets.ModelViewSet):
    serializer_class = ChaveSerializer

    def get_queryset(self):
        qs = Chave.objects.all().order_by('id')
        status_param = self.request.query_params.get('status')
        ativo = self.request.query_params.get('ativo')
        if status_param:
            qs = qs.filter(status=status_param.upper())
        if ativo is not None:
            qs = qs.filter(ativo=ativo.lower() == 'true')
        return qs
