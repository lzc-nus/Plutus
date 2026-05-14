from pydantic import BaseModel, EmailStr, Field
from uuid import UUID, uuid4

class User(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    username: str
    email: EmailStr
    full_name: str | None = None
    
    base_currency: str = "SGD"

    is_active: bool = True
    is_verified: bool = False