import os
import secrets
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from backend.app.db.database import User

security = HTTPBasic()

def get_current_user(credentials: Annotated[HTTPBasicCredentials, Depends(security)]):
    correct_username = os.getenv("HTTP_BASIC_USERNAME", "admin").encode("utf8")
    correct_password = os.getenv("HTTP_BASIC_PASSWORD", "password").encode("utf8")

    current_username_bytes = credentials.username.encode("utf8")
    current_password_bytes = credentials.password.encode("utf8")

    is_correct_username = secrets.compare_digits(current_username_bytes, correct_username)
    is_correct_password = secrets.compare_digits(current_password_bytes, correct_password)

    if not (is_correct_username and is_correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Basic"}
        )
    
    return User(
        id=...,
        username=credentials.username,
        email=...,
        full_name=...,
        base_currency=...,
        is_active=...,
        is_verified=...,
    )

CurrentUser = Annotated[User, Depends(get_current_user)]