from django.conf import settings
from django.db import models
from django.utils import timezone


class Sweet(models.Model):
    name = models.CharField(max_length=150, unique=True)
    category = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    quantity = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="sweets",
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.category})"

    @property
    def is_available(self) -> bool:
        return self.quantity > 0

    def purchase(self, amount: int) -> None:
        if amount <= 0:
            raise ValueError("Amount must be positive")
        if amount > self.quantity:
            raise ValueError("Insufficient stock")
        self.quantity -= amount
        self.save(update_fields=["quantity", "updated_at"])

    def restock(self, amount: int) -> None:
        if amount <= 0:
            raise ValueError("Amount must be positive")
        self.quantity += amount
        self.save(update_fields=["quantity", "updated_at"])
