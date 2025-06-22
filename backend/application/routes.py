"""
Модуль routes.py содержит маршруты FastAPI для обработки HTTP-запросов и WebSocket-соединений.
"""
from typing import Generator, Annotated
from fastapi import Response, WebSocket, APIRouter, Depends, UploadFile, Query
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from backend.db.models import engine
from .utils import get_current_user_id, WebSocketConnectionManager
from .config import security, config
from .views import (
    register_view, login_view, create_post_view, create_comment_view,
    create_friendship_request_view, edit_profile_view, create_or_delete_like_view,
    vote_view, handle_websocket, add_media_to_post_view, get_posts_view,
    get_post_img_view, get_post_view, edit_post_view, delete_post_view, delete_comment_view,
    delete_vote_view, delete_message_view, change_avatar_view, get_avatar_view,
    get_chat_view, get_users_posts_view, get_my_page_view,
    get_other_page_view, get_is_friend_view, get_friends_view, delete_friend_view,
    get_friendship_requests_view, delete_friendship_request_view,
    delete_post_image_view, complaint_post_view, complaint_comment_view, get_voted_users_view
)

from .schemas import (
    RegisterFormData, LoginFormData, CreatePostData, CreateCommentData, EditProfileFormData,
    EditPostData
)

router = APIRouter()
manager = WebSocketConnectionManager()
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db() -> Generator[AsyncSession, None, None]:
    """
    Генератор для получения сессии базы данных.

    Yields:
        AsyncSession: Асинхронная сессия базы данных.
    """
    async with SessionLocal() as db:
        yield db

SessionDep = Annotated[AsyncSession, Depends(get_db)]


@router.get('/')
async def example() -> dict:
    """
    Пример эндпоинта для проверки работы API.

    Returns:
        dict: Статус операции.
    """
    return {'status': 'ok'}


@router.post('/register')
async def submit_form(
    data: RegisterFormData, db: SessionDep
) -> dict:
    """
    Регистрирует нового пользователя.

    Args:
        data (RegisterFormData): Данные для регистрации.
        db (AsyncSession): Сессия базы данных.

    Returns:
        dict: Результат регистрации.
    """
    return await register_view(data=data, db=db)


@router.post('/login')
async def login(
    data: LoginFormData, response: Response, db: SessionDep
) -> dict:
    """
    Аутентифицирует пользователя.

    Args:
        data (LoginFormData): Данные для входа.
        response (Response): Объект ответа FastAPI.
        db (AsyncSession): Сессия базы данных.

    Returns:
        dict: Токен аутентификации.
    """
    return await login_view(data=data, response=response, db=db)


@router.get('/my_id', dependencies=[Depends(security.access_token_required)])
async def secret(user_id: str = Depends(get_current_user_id)) -> dict:
    """
    Возвращает ID текущего пользователя.

    Args:
        user_id (str): ID пользователя.

    Returns:
        dict: ID пользователя.
    """
    return {'id': int(user_id)}


@router.post('/logout')
async def logout(response: Response) -> dict:
    """
    Выход пользователя из системы.

    Args:
        response (Response): Объект ответа FastAPI.

    Returns:
        dict: Статус операции.
    """
    response.delete_cookie(config.JWT_ACCESS_COOKIE_NAME)
    return {"status": "ok"}



