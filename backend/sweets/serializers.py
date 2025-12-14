from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from .models import Sweet


User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password")

    def create(self, validated_data):
        with transaction.atomic():
            user = User.objects.create_user(
                username=validated_data["username"],
                email=validated_data.get("email"),
                password=validated_data["password"],
            )
        return user


class SweetSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    is_available = serializers.BooleanField(read_only=True)

    class Meta:
        model = Sweet
        fields = (
            "id",
            "name",
            "category",
            "description",
            "price",
            "quantity",
            "is_available",
            "created_by",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_by", "created_at", "updated_at", "is_available")

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["created_by"] = user
        return super().create(validated_data)


class QuantityActionSerializer(serializers.Serializer):
    amount = serializers.IntegerField(min_value=1)
