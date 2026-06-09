from django.urls import path

from prices.views import auth_login, prices_api


urlpatterns = [
    path("api/auth/login", auth_login, name="auth_login"),
    path("api/auth/login/", auth_login, name="auth_login_slash"),
    path("api/prices", prices_api, name="prices_api"),
    path("api/prices/", prices_api, name="prices_api_slash"),
]
