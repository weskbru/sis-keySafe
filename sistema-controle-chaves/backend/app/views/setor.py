from rest_framework import viewsets
from app.models import Setor
from app.serializers import SetorSerializer


class SetorViewSet(viewsets.ModelViewSet):
    queryset = Setor.objects.all().order_by('id')
    serializer_class = SetorSerializer
