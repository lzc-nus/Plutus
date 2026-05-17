from pydantic import BaseModel, EmailStr, Field, ConfigDict
from uuid import UUID, uuid4
from pydantic.alias_generators import to_camel

class UserResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

    id: UUID = Field(default_factory=uuid4)
    username: str
    email: EmailStr
    full_name: str | None = None
    
    base_currency: str = "SGD"

    is_active: bool = True
    is_verified: bool = False