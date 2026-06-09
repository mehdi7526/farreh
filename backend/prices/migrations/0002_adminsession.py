from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("prices", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="AdminSession",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("token", models.CharField(db_index=True, max_length=128, unique=True)),
                ("username", models.CharField(db_index=True, max_length=150)),
                ("expires_at", models.DateTimeField(db_index=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "admin session",
                "verbose_name_plural": "admin sessions",
            },
        ),
    ]
