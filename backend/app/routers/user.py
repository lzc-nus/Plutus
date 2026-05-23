from fastapi import APIRouter
from ..schemas.user import UserResponse

router = APIRouter(prefix="/api/user", tags=["User Profile"])

@router.get("/", response_model=UserResponse)
async def get_user_profile():
    return {
        "id": "250",
        "username": "realtonalddrump",
        "email": "td@gmail.com",
        "full_name": "Tonald Drump",
        "base_currency": "SGD",
        "is_active": "True",
        "is_verified": "False"
    }