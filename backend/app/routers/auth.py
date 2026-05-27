from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from ..db.database import get_db
from ..schemas.user import Token, UserCreate, UserLogin, UserResponse
from ..auth import AuthService

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    return AuthService.register_new_user(db, payload)


@router.post("/login", response_model=Token)
def login_user(payload: UserLogin, db: Session = Depends(get_db)):
    access_token = AuthService.authenticate_user(db, payload)
    return Token(access_token=access_token)
