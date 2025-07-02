"""
Модуль routes.py содержит маршруты FastAPI для обработки HTTP-запросов и WebSocket-соединений.
"""
from typing import Generator, Annotated
from fastapi import Response, APIRouter, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from backend.db.models import engine
from .utils import *
from .config import security, config
from .views import *
from .schemas import *

router = APIRouter()
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
manager = RoomManager()

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
    data: RegisterFormData, db: SessionDep, response: Response
) -> dict:
    """
    Регистрирует нового пользователя.

    Args:
        data (RegisterFormData): Данные для регистрации.
        db (AsyncSession): Сессия базы данных.

    Returns:
        dict: Результат регистрации.
    """
    return await register_view(data=data, db=db, response=response)


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


@router.get('/my_fields', dependencies=[Depends(security.access_token_required)])
async def get_my_fields(db: SessionDep, user_id: str = Depends(get_current_user_id)):
    return await get_my_fields_view(db=db, user_id=int(user_id))


@router.post('/fields', dependencies=[Depends(security.access_token_required)])
async def create_field(data: CreateFieldFormData, db: SessionDep, user_id: str = Depends(get_current_user_id)):
    return await create_field_view(data=data, db=db, user_id=int(user_id))


@router.put('/profile', dependencies=[Depends(security.access_token_required)])
async def edit_profile(data: EditProfileFormData, db: SessionDep, user_id: str = Depends(get_current_user_id)):
    return await edit_profile_view(data=data, db=db, user_id=int(user_id))


@router.get('/my_avatar', dependencies=[Depends(security.access_token_required)])
async def get_avatar(db: SessionDep, user_id: str = Depends(get_current_user_id)):
    return await get_avatar_view(db=db, user_id=int(user_id))


@router.get('/avatar/{other_user_id}', dependencies=[Depends(security.access_token_required)])
async def get_avatar(db: SessionDep, other_user_id: int, user_id: str = Depends(get_current_user_id)):
    return await get_avatar_view(db=db, user_id=other_user_id)


@router.get('/profile', dependencies=[Depends(security.access_token_required)])
async def get_profile(db: SessionDep, user_id: str = Depends(get_current_user_id)):
    return await get_profile_view(db=db, user_id=int(user_id))


@router.post('/avatar', dependencies=[Depends(security.access_token_required)])
async def change_avatar(db: SessionDep, uploaded_file: UploadFile, user_id: str = Depends(get_current_user_id)):
    return await change_avatar_view(db=db, uploaded_file=uploaded_file, user_id=int(user_id))


@router.get('/field/{field_id}', dependencies=[Depends(security.access_token_required)])
async def get_field(db: SessionDep, field_id: int, user_id: str = Depends(get_current_user_id)):
    return await get_field_view(db=db, field_id=field_id, user_id=int(user_id))


@router.post('/field/{field_id}', dependencies=[Depends(security.access_token_required)])
async def update_field(db: SessionDep, field_id: int, data: AnyJsonResponse, user_id: str = Depends(get_current_user_id)):
    return await update_field_view(db=db, field_id=field_id, data=data, user_id=int(user_id))


@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await handle_websocket(websocket=websocket, room_id=room_id, manager=manager)


@router.post('/access/{field_id}', dependencies=[Depends(security.access_token_required)])
async def create_access(data: AccessData, db: SessionDep, field_id: int, user_id: str = Depends(get_current_user_id)):
    return await create_access_view(data=data, db=db, user_id=int(user_id), field_id=field_id)


@router.get('/access/{field_id}', dependencies=[Depends(security.access_token_required)])
async def get_access(db: SessionDep, field_id: int, user_id: str = Depends(get_current_user_id)):
    return await get_access_view(db=db, user_id=int(user_id), field_id=field_id)


@router.delete('/access/{other_user_id}/{field_id}', dependencies=[Depends(security.access_token_required)])
async def delete_access(db: SessionDep, field_id: int, other_user_id: int, user_id: str = Depends(get_current_user_id)):
    return await delete_access_view(db=db, field_id=field_id, other_user_id=other_user_id, user_id=int(user_id))


@router.get('/accesses/{field_id}', dependencies=[Depends(security.access_token_required)])
async def get_accesses_for_field(field_id: int, db: SessionDep, user_id: str = Depends(get_current_user_id)):
    return await get_accesses_for_field_view(field_id=field_id, db=db, user_id=int(user_id))

