"""
View-функции для обработки всех запросов
"""
import json
from io import BytesIO
from fastapi import HTTPException, Response
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from backend.db.models import *
from backend.db.utils import *
from backend.application.utils import *
from .schemas import LoginFormData, RegisterFormData, CreateFieldFormData, EditProfileFormData
from .config import config, security


async def register_view(data: RegisterFormData, db: AsyncSession, response: Response) -> dict:
    """
    Регистрирует нового пользователя.

    Args:
        data (RegisterFormData): Данные для регистрации.
        db (AsyncSession): Сессия базы данных.

    Returns:
        dict: Статус операции.
    """
    db_user_by_username = await get_user_by_username(data.username, db)

    if db_user_by_username:
        raise HTTPException(
            status_code=400,
            detail="Пользователь с таким юзернеймом уже существует."
        )

    new_user = User(
        username=data.username,
        password=hash_password(data.password)
    )
    await add_and_refresh_object(new_user, db)
    token = security.create_access_token(uid=str(new_user.id))
    response.set_cookie(config.JWT_ACCESS_COOKIE_NAME, token)

    return {'status': 'ok'}


async def login_view(data: LoginFormData, response: Response, db: AsyncSession) -> dict:
    """
    Авторизует пользователя.

    Args:
        data (LoginFormData): Данные для входа.
        response (Response): Объект ответа FastAPI.
        db (AsyncSession): Сессия базы данных.

    Returns:
        dict: Токен аутентификации.
    """
    user = await get_user_by_username(data.username, db)
    if user is None:
        raise HTTPException(status_code=400, detail="Такого пользователя не существует!")
    if not verify_password(user.password, data.password):
        raise HTTPException(status_code=400, detail="Неверный пароль!")

    token = security.create_access_token(uid=str(user.id))
    response.set_cookie(config.JWT_ACCESS_COOKIE_NAME, token)
    return {"auth_token": token}


async def get_my_fields_view(user_id: int, db: AsyncSession):
    fields = await get_user_fields(user_id, db)
    return {'fields':[
        {'id':field.id, 'name':field.name} for field in fields
    ]}


async def create_field_view(data: CreateFieldFormData, db: AsyncSession, user_id: int):
    new_field = Field(
        name=data.field_name,
        author_id=user_id
    )
    await add_and_refresh_object(new_field, db)
    return {'status':'ok'}
