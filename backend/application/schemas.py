"""
Схемы для валидации данных
"""
from typing import Optional, Dict, Any
from pydantic import BaseModel, constr, Field


class RegisterFormData(BaseModel):
    """
    Схема валидации данных для формы регистрации
    """
    username: str = Field(min_length=3, max_length=50)
    password: str


class LoginFormData(BaseModel):
    """
    Схема валидации данных для формы логина
    """
    username: str = Field(min_length=3, max_length=50)
    password: str

class EditProfileFormData(BaseModel):
    """
    Схема валидации данных для формы редактирования профиля
    """
    username: Optional[constr(min_length=3, max_length=10000)] = None
    password: Optional[str] = None


class CreateFieldFormData(BaseModel):
    """
    Схема валидации данных для регистрации нового игрового поля
    """
    field_name: str = Field(min_length=1, max_length=50)


class AnyJsonResponse(BaseModel):
    """
    схема обновления канваса
    """
    data: Dict[str, Any]


class AccessData(BaseModel):
    """
    схема валидации при создании доступа
    """
    username: str = Field(min_length=3, max_length=50)
