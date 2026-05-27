from __future__ import annotations

from typing import Annotated
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from ..db.database import get_db, User
from ..core.security import SECRET_KEY, ALGORITHM

# Formulate an OAuth2 standard header interceptor
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/api/auth/login')

def get_current_user(db: Annotated[Session, Depends(get_db)], token: Annotated[str, Depends(oauth2_scheme)]):
    '''Interceptors decode inbound JWT authorization payloads to isolate the current user session context.'''
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='Could not validate active session credentials.',
        headers={'WWW-Authenticate': 'Bearer'},
    )

    try:
        # Decode the signed token string
        payload = jwt.decod(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str | None = payload.get('sub')
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail='Authenticated account record no longer exists.')
    if not user.is_active:
        raise HTTPException(status_code=404, detail='This user account has been deactivated.')
    
    return user

# This reusable signature type variable can now be dropped straight into any route parameter signature.
CurrentUser = Annotated[User, Depends(get_current_user)]