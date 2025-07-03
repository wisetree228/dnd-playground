"""
Вспомогательные функции, которые используются во view функциях
"""
from typing import Dict, List
from jose import JWTError, jwt
from passlib.context import CryptContext
import bcrypt
from fastapi import Request, HTTPException, status, WebSocket
from .config import config


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


class RoomManager:
    """
    Вспомогательный класс для обработки вебсокет-соединений
    """
    def __init__(self):
        # {room_id: List[WebSocket]}
        self.rooms: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        """
        Подключает пользователя (добавляет его соединение в список соединений для конкретной команты)
        """
        await websocket.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = []
        self.rooms[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        """
        Отключает пользователя
        """
        if room_id in self.rooms:
            self.rooms[room_id].remove(websocket)
            if not self.rooms[room_id]:
                del self.rooms[room_id]

    async def send_to_room(self, message: dict, room_id: str, exclude: WebSocket = None):
        """
        Отправляет всем в комнате какое-то сообщение
        """
        if room_id in self.rooms:
            for connection in self.rooms[room_id]:
                if connection != exclude:
                    try:
                        await connection.send_json(message)
                    except:
                        self.disconnect(connection, room_id)