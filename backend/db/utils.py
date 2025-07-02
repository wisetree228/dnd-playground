"""
Вспомогательные функции для обращения к бд
"""
from typing import Type, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from sqlalchemy import or_, and_, func
from .models import *


async def add_and_refresh_object(
        object: Base,
        db: AsyncSession
) -> None:
    """
    Добавляет обьект в бд и перезагружает его (получает автоматически созданные
    параметры обьекта, такие как id и created_at)

    Args:
        object (Base): обьект
        db (AsyncSession): Сессия базы данных.
    Returns:
        None
    """
    db.add(object)
    await db.commit()
    await db.refresh(object)


async def get_user_by_username(username: str, db: AsyncSession):
    res = await db.execute(select(User).where(User.username == username))
    user = res.scalars().first()
    return user


async def get_user_fields(user_id: int, db: AsyncSession):
    res = await db.execute(select(Field).where(Field.author_id == user_id))
    return res.scalars().all()


async def get_object_by_id(
        object_type: Type[Base],
        id: int, db: AsyncSession
):
    """
    Получает обьект из бд по id

    Args:
        object_type: модель обьекта
        id (int): id обьекта
        db (AsyncSession): сессия бд
    Returns:
        обьект
    """
    result = await db.execute(select(object_type).filter(object_type.id==id))
    return result.scalars().first()


async def delete_object(
    object: Base,
    db: AsyncSession
) -> None:
    """
    Удаляет обьект из бд

    Args:
        object (Base): обьект
        db (AsyncSession): Сессия базы данных.
    Returns:
        None
    """
    await db.delete(object)
    await db.commit()


async def get_access_with_username(username: str, field_id: int, db: AsyncSession):
    user = await get_user_by_username(username=username, db=db)
    if user is None:
        return None
    res = await db.execute(select(Access).where(and_(
        Access.user_id==user.id,
        Access.field_id==field_id
    )))
    return res.scalars().first()


async def get_access_with_id(user_id: int, field_id: int, db: AsyncSession):
    res = await db.execute(select(Access).where(and_(
        Access.user_id==user_id,
        Access.field_id==field_id
    )))
    return res.scalars().first()


async def get_all_accesses_to_field(field_id: int, db: AsyncSession):
    res = await db.execute(select(Access).where(Access.field_id==field_id).options(
        joinedload(Access.user)
    ))
    return res.scalars().all()

