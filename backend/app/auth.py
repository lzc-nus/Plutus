from __future__ import annotations

from fastapi import HTTPException, status
from sqlmodel import Session, select
from .db.database import User
from .schemas.user import UserCreate, UserLogin
from .core.security import get_password_hash, verify_password, create_access_token

class AuthService:
    @staticmethod
    def register_new_user(db: Session, payload: UserCreate) -> User:
        email_check = db.exec(select(User).where(User.email == payload.email)).first()
        if email_check:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='An account with this email already exists.'
            )
        
        username_check = db.exec(select(User).where(User.username == payload.username)).first()
        if username_check:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='This username is already taken.'
            )
        
        hashed_pw = get_password_hash(payload.password)

        new_user = User(
            username=payload.username,
            email=payload.email,
            hashed_password=hashed_pw,
            base_currency=payload.base_currency,
            is_active=True,
            is_verified=False
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    
    @staticmethod
    def authenticate_user(db: Session, credentials: UserLogin) -> str:
        user = db.exec(select(User).where(User.email == credentials.email)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={'WWW-Authenticate': 'Bearer'},
            )
        
        if not verify_password(credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Incorrent email or password.',
                headers={'WWW-Authenticate': 'Bearer'},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='This user account has been deactivated.'
            )
        
        # Issue a signed access token containing user's secure ID string
        return create_access_token(user_id=user.id)