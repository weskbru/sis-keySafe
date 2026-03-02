from .setor import SetorViewSet
from .pessoa import PessoaViewSet
from .chave import ChaveViewSet
from .emprestimo import EmprestimoViewSet
from .admin_user import AdminUserViewSet
from .me import MeView

__all__ = [
    'SetorViewSet', 'PessoaViewSet', 'ChaveViewSet',
    'EmprestimoViewSet', 'AdminUserViewSet', 'MeView',
]
