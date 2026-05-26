import re # regular expressions
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from uuid import UUID, uuid4
from pydantic.alias_generators import to_camel

class UserResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

    id: UUID
    username: str
    email: EmailStr
    base_currency: str = "SGD"
    is_active: bool = True
    is_verified: bool = False

class UserCreate(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )

    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str
    full_name: str | None = None
    base_currency: str = 'SGD'

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, p: str) -> str:
        if len(p) < 8:
            raise ValueError('Password must be at least 8 characters long.')
        if not re.search(r'[A-Z]', p):
            raise ValueError('Password must contain at least one uppercase letter.')
        if not re.search(r'[a-z]', p):
            raise ValueError('Password must contain at least one lowercase letter.')
        if not re.search(r'[0-9]', p):
            raise ValueError('Password must contain at least one numeric digit.')
        if not re.search(r'[^A-Za-z0-9]', p):
            raise ValueError('Password must contain at least one special symbol.')
        
        return p

class UserLogin(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )
    email: EmailStr
    password: str

class Token(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )
    access_token: str
    token_type: str = "bearer"