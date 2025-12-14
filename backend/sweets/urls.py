from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .auth import SweetTokenObtainPairView
from .views import RegisterView, SweetViewSet

router = DefaultRouter()
router.register("sweets", SweetViewSet, basename="sweet")

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", SweetTokenObtainPairView.as_view(), name="login"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("", include(router.urls)),
]
