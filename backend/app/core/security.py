from __future__ import annotations

import datetime
import os
import jwt
import uuid
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = os.getenv('ALGORITHM')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES'))

if not SECRET_KEY:
    raise ValueError('SECRET_KEY environmental variable is missing from security config.')

# Setup password hashing context using safe bcrypt algorithm
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str):
    return pwd_context.hash(password)

def create_access_token(user_id: uuid.UUID):
    '''Encode user identity payload into a signed, expiring JWT token.'''
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode = {
        'exp': expire,
        'sub': str(user_id)
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)