import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from sweets.models import Sweet


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def create_user(db):
    def _create(**kwargs):
        data = {
            "username": kwargs.get("username", "customer"),
            "email": kwargs.get("email", "customer@example.com"),
            "password": kwargs.get("password", "StrongPass123"),
        }
        user = get_user_model().objects.create_user(**data)
        if kwargs.get("is_staff"):
            user.is_staff = True
            user.save()
        return user

    return _create


def authenticate(client: APIClient, username: str, password: str):
    login = client.post(
        "/api/auth/login/",
        {"username": username, "password": password},
        format="json",
    )
    token = login.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return client


@pytest.mark.django_db
def test_register_endpoint_creates_user(api_client):
    payload = {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "NewPassword123",
    }
    response = api_client.post("/api/auth/register/", payload, format="json")
    assert response.status_code == 201
    assert response.data["username"] == payload["username"]


@pytest.mark.django_db
def test_admin_can_create_and_list_sweets(api_client, create_user):
    admin = create_user(username="boss", password="TopSecret123", is_staff=True)
    client = authenticate(api_client, admin.username, "TopSecret123")

    create_response = client.post(
        "/api/sweets/",
        {
            "name": "Caramel Fudge",
            "category": "Chocolate",
            "description": "Classic caramel with fudge center",
            "price": "3.50",
            "quantity": 10,
        },
        format="json",
    )
    assert create_response.status_code == 201

    list_response = client.get("/api/sweets/")
    assert list_response.status_code == 200
    assert list_response.data["results"][0]["name"] == "Caramel Fudge"


@pytest.mark.django_db
def test_purchase_endpoint_reduces_quantity(api_client, create_user):
    admin = create_user(username="boss2", password="TopSecret123", is_staff=True)
    customer = create_user(username="customer1", password="CustomerPass123")

    auth_admin = authenticate(APIClient(), admin.username, "TopSecret123")
    sweet_resp = auth_admin.post(
        "/api/sweets/",
        {
            "name": "Gummy Bears",
            "category": "Gummies",
            "description": "Rainbow gummies",
            "price": "2.50",
            "quantity": 5,
        },
        format="json",
    )
    sweet_id = sweet_resp.data["id"]

    client = authenticate(api_client, customer.username, "CustomerPass123")
    purchase_response = client.post(f"/api/sweets/{sweet_id}/purchase/", {"amount": 2}, format="json")

    assert purchase_response.status_code == 200
    sweet = Sweet.objects.get(id=sweet_id)
    assert sweet.quantity == 3
