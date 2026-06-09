from django.db import models


class PriceState(models.Model):
    singleton_key = models.CharField(max_length=32, unique=True, default="current")
    prices = models.JSONField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "price state"
        verbose_name_plural = "price states"

    def save(self, *args, **kwargs):
        self.singleton_key = "current"
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.singleton_key


class AdminSession(models.Model):
    token = models.CharField(max_length=128, unique=True, db_index=True)
    username = models.CharField(max_length=150, db_index=True)
    expires_at = models.DateTimeField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "admin session"
        verbose_name_plural = "admin sessions"

    def __str__(self) -> str:
        return f"{self.username}:{self.token[:8]}"
