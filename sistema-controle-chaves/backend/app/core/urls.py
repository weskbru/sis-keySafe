from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenRefreshView

from app.core.auth import AdminTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Autenticação JWT — aceita apenas usuários com is_staff=True
    path('api/token/', AdminTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # API transacional
    path('api/', include('app.urls')),

    # Documentação (AllowAny — Swagger não exige token)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
