from django.db.models import Q
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Sweet
from .serializers import QuantityActionSerializer, RegisterSerializer, SweetSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class SweetViewSet(viewsets.ModelViewSet):
    serializer_class = SweetSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Sweet.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        name = self.request.query_params.get("name")
        category = self.request.query_params.get("category")
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")

        filters = Q()
        if name:
            filters &= Q(name__icontains=name)
        if category:
            filters &= Q(category__icontains=category)
        if min_price:
            filters &= Q(price__gte=min_price)
        if max_price:
            filters &= Q(price__lte=max_price)

        if filters:
            queryset = queryset.filter(filters)
        return queryset

    def perform_create(self, serializer):
        self._ensure_admin(self.request.user, "Only admins can add sweets.")
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        self._ensure_admin(self.request.user, "Only admins can update sweets.")
        serializer.save()

    def perform_destroy(self, instance):
        self._ensure_admin(self.request.user, "Only admins can delete sweets.")
        return super().perform_destroy(instance)

    @action(detail=True, methods=["post"])
    def purchase(self, request, pk=None):
        sweet = self.get_object()
        serializer = QuantityActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            sweet.purchase(serializer.validated_data["amount"])
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(SweetSerializer(sweet, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def restock(self, request, pk=None):
        self._ensure_admin(request.user, "Only admins can restock.")
        sweet = self.get_object()
        serializer = QuantityActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sweet.restock(serializer.validated_data["amount"])
        return Response(SweetSerializer(sweet, context={"request": request}).data)


    @action(detail=False, methods=["get"])
    def search(self, request):
        sweets = self.get_queryset()
        page = self.paginate_queryset(sweets)
        serializer = self.get_serializer(page or sweets, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    @staticmethod
    def _ensure_admin(user, message):
        if not user.is_staff:
            raise PermissionDenied(message)
