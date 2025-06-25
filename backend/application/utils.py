"""
Вспомогательные функции, которые используются во view функциях
"""
from typing import Dict, List, Tuple
from datetime import datetime
import json
from jose import JWTError, jwt
from passlib.context import CryptContext
import bcrypt
from fastapi import Request, HTTPException, status, WebSocket
from .config import config
import uuid


# Настройка контекста для хэширования
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Хэширование пароля
def hash_password(password: str) -> str:
    """
    Хэширует пароль

    Args:
        password (str): пароль
    Returns:
        str - хэш
    """
    return pwd_context.hash(password)

def verify_password(stored_hashed_password: str, provided_password: str) -> bool:
    """
    Сверяет пароль и хэш из бд

    Args:
        stored_hashed_password (str): хэш
        provided_password (str): пароль
    Returns:
        bool - результат проверки
    """
    return bcrypt.checkpw(provided_password.encode('utf-8'), stored_hashed_password.encode('utf-8'))

async def get_current_user_id(request: Request) -> str:
    """
    Достаёт из файлов куки токен авторизации и дешифрует оттуда id пользователя

    Args:
        request (Request): http request
    Returns:
        str - id в формате строки
    """
    token = request.cookies.get(config.JWT_ACCESS_COOKIE_NAME)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Токен отсутствует",
        )
    try:
        payload = jwt.decode(
            token,
            config.JWT_SECRET_KEY,  # Ваш секретный ключ
            algorithms=[config.JWT_ALGORITHM]  # Алгоритм, используемый для подписи токена
        )
        user_id: str = payload.get("sub")
        if not user_id.isdigit():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный токен",
            )
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Не удалось декодировать токен",
        )


class ConnectionManager:
    def __init__(self):
        # Структура: {room_id: {connection_id: (user_id, websocket)}}
        self.rooms: Dict[str, Dict[str, Tuple[str, WebSocket]]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str) -> str:
        """Добавляет соединение в комнату и возвращает connection_id"""
        await websocket.accept()
        connection_id = str(uuid.uuid4())

        if room_id not in self.rooms:
            self.rooms[room_id] = {}

        self.rooms[room_id][connection_id] = (user_id, websocket)
        return connection_id

    def disconnect(self, room_id: str, connection_id: str):
        """Удаляет соединение из комнаты"""
        if room_id in self.rooms and connection_id in self.rooms[room_id]:
            del self.rooms[room_id][connection_id]

            # Если комната пустая - удаляем ее
            if not self.rooms[room_id]:
                del self.rooms[room_id]

    async def broadcast(self, message: dict, room_id: str, exclude_user_id: str = None):
        """Отправляет сообщение всем в комнате, кроме указанного пользователя"""
        if room_id not in self.rooms:
            return

        for connection_id, (user_id, websocket) in self.rooms[room_id].items():
            if user_id != exclude_user_id:
                try:
                    await websocket.send_json(message)
                except:
                    self.disconnect(room_id, connection_id)

    def get_users_in_room(self, room_id: str) -> List[str]:
        """Возвращает список user_id в указанной комнате"""
        if room_id not in self.rooms:
            return []
        return [user_id for user_id, _ in self.rooms[room_id].values()]