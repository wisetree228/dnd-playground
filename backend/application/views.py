"""
View-функции для обработки всех запросов
"""
import json
from io import BytesIO
from fastapi import HTTPException, Response, UploadFile
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.websockets import WebSocketDisconnect
from backend.db.models import *
from backend.db.utils import *
from backend.application.utils import *
from .schemas import LoginFormData, RegisterFormData, CreateFieldFormData, EditProfileFormData, AnyJsonResponse, AccessData
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
    """
    Возвращает пользователю его поля
    """
    fields = await get_user_fields(user_id, db)
    return {'fields':[
        {'id':field.id, 'name':field.name} for field in fields
    ]}


async def get_accessed_fields_view(db: AsyncSession, user_id: int):
    """
    Возвращает пользователю поля к которым он имеет доступ
    """
    accesses = await get_user_accesses(user_id=user_id, db=db)
    return {
        'accessed_fields':[{'field_id':ac.field_id, 'field_name':ac.field.name} for ac in accesses]
    }


async def create_field_view(data: CreateFieldFormData, db: AsyncSession, user_id: int):
    """
    регистрирует новое поле
    """
    new_field = Field(
        name=data.field_name,
        author_id=user_id
    )
    await add_and_refresh_object(new_field, db)
    return {'status':'ok'}


async def edit_profile_view(data: EditProfileFormData, db: AsyncSession, user_id: int):
    """
    редактирует профиль
    """
    user = await get_object_by_id(object_type=User, id=user_id, db=db)
    if data.username:
        user.username = data.username
    if data.password:
        user.password = hash_password(data.password)
    await db.commit()
    await db.refresh(user)
    return {'status':'ok'}


async def get_avatar_view(db: AsyncSession, user_id: int):
    """
    возвращает пользователю его аватар
    """
    user = await get_object_by_id(object_type=User, id=user_id, db=db)
    if not user:
        raise HTTPException(status_code=400, detail="Такого юзера не существует")
    if not user.avatar:
        return FileResponse('backend/static/avatar.png')
    return StreamingResponse(BytesIO(user.avatar), media_type='image/png')


async def get_profile_view(db: AsyncSession, user_id: int):
    """
    возвращает пользователю данные о его профиле
    """
    user = await get_object_by_id(object_type=User, id=user_id, db=db)
    return {'username':user.username}


async def change_avatar_view(uploaded_file: UploadFile, user_id: int, db: AsyncSession):
    """
    меняет аватар
    """
    user = await get_object_by_id(object_type=User, id=user_id, db=db)
    file_bytes = await uploaded_file.read()
    user.avatar = file_bytes
    await db.commit()
    return {'status': 'ok'}


async def get_field_view(db: AsyncSession, user_id: int, field_id: int):
    """
    возвращает данные поля (что там нарисовано)
    """
    access = await get_access_with_id(user_id=user_id, field_id=field_id, db=db)
    field = await get_object_by_id(object_type=Field, id=field_id, db=db)
    if field is None:
        raise HTTPException(status_code=400, detail="Нет такого поля!")
    if access is None and field.author_id!=user_id:
        raise HTTPException(status_code=400, detail='Отказано в доступе!')

    return field.data


async def update_field_view(db: AsyncSession, user_id: int, field_id: int, data: AnyJsonResponse):
    """
    редактриует поле, сохраняет изменение рисунка в базу данных
    """
    field = await get_object_by_id(object_type=Field, id=field_id, db=db)
    if field.author_id != user_id:
        raise HTTPException(status_code=400, detail='Отказано в доступе!')
    field.data = data.data
    await db.commit()
    await db.refresh(field)
    return {'status':'ok'}


async def handle_websocket(websocket: WebSocket, room_id: str, manager: RoomManager):
    """
    обрабатывает вебсокет-соединение когда несколько игроков рисуют на одном поле
    """
    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_json()

            if data["type"] == "canvas_object":
                # Рассылаем только новый объект
                await manager.send_to_room({
                    "type": "canvas_object",
                    "object": data["object"],
                    "userId": data.get("userId")
                }, room_id, exclude=websocket)

            elif data["type"] == "canvas_clear":
                # Рассылаем команду очистки
                await manager.send_to_room({
                    "type": "canvas_clear",
                    "userId": data.get("userId")
                }, room_id, exclude=websocket)

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
    except Exception as e:
        print(f"Error: {e}")
        manager.disconnect(websocket, room_id)


async def create_access_view(data: AccessData, db: AsyncSession, user_id: int, field_id: int):
    """
    регистрирует доступ пользователя к полю
    """
    access = await get_access_with_username(username=data.username, field_id=field_id, db=db)
    if access:
        return {'status':'ok'}
    field = await get_object_by_id(object_type=Field, db=db, id=field_id)
    if field is None:
        raise HTTPException(status_code=400, detail='Такого поля не существует!')
    if field.author_id!=user_id:
        raise HTTPException(status_code=400, detail='Вы не владелец поля!')

    user = await get_user_by_username(username=data.username, db=db)
    if user.id == field.author_id:
        return {'status':'ok'}
    if user is None:
        raise HTTPException(status_code=400, detail='Такого юзера не существует!')
    new_access = Access(
        user_id=user.id,
        field_id=field_id
    )
    await add_and_refresh_object(object=new_access, db=db)
    return {'status':'ok'}


async def get_access_view(user_id: int, db: AsyncSession, field_id: int):
    """
    проверяет, имеет ли пользователь доступ к полю
    """
    access = await get_access_with_id(user_id=user_id, field_id=field_id, db=db)
    if access is not None:
        return {'status':'ok'}
    raise HTTPException(status_code=400, detail='Отказано в доступе!')


async def delete_access_view(db: AsyncSession, user_id: int, field_id: int, other_user_id: int):
    """
    удаляет доступ пользователя к полю
    """
    field = await get_object_by_id(object_type=Field, id=field_id, db=db)
    if field.author_id != user_id:
        raise HTTPException(status_code=400, detail='Вы не владелец поля!')
    access = await get_access_with_id(user_id=other_user_id, field_id=field_id, db=db)
    if access:
        await delete_object(object=access, db=db)
    return {'status':'ok'}


async def get_accesses_for_field_view(db: AsyncSession, user_id: int, field_id: int):
    """
    возвращает список пользователей которые имеют доступ к полю
    """
    field = await get_object_by_id(object_type=Field, id=field_id, db=db)
    if field.author_id != user_id:
        raise HTTPException(status_code=400, detail='Отказано в доступе!')
    accesses = await get_all_accesses_to_field(field_id=field_id, db=db)
    response = {
        'accessed_users':[{'user_id':ac.user_id, 'username':ac.user.username} for ac in accesses]
    }
    return response


