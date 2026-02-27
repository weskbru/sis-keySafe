from rest_framework.routers import DefaultRouter
from app.views import SetorViewSet, PessoaViewSet, ChaveViewSet, EmprestimoViewSet, AdminUserViewSet

router = DefaultRouter()
router.register('setores', SetorViewSet, basename='setor')
router.register('pessoas', PessoaViewSet, basename='pessoa')
router.register('chaves', ChaveViewSet, basename='chave')
router.register('emprestimos', EmprestimoViewSet, basename='emprestimo')
router.register('admin-users', AdminUserViewSet, basename='admin-user')

urlpatterns = router.urls
