"""
Модели (таблицы в бд)
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, LargeBinary
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.dialects.postgresql import JSONB
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(DATABASE_URL, echo=True)
Base = declarative_base()


class User(Base):
    """
    Модель юзера
    """
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)  # hash
    avatar = Column(LargeBinary)

    fields = relationship("Field", back_populates="author", cascade="all, delete-orphan")
    accesses = relationship("Access", back_populates="user", cascade="all, delete-orphan")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class Field(Base):
    """
    Модель игрового поля
    """
    __tablename__ = 'fields'
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    data = Column(JSONB)
    author_id = Column(Integer, ForeignKey('users.id'), nullable=False)

    accesses = relationship("Access", back_populates="field", cascade="all, delete-orphan")
    author = relationship("User", back_populates="fields")
    created_at = Column(DateTime, default=datetime.now)


class Access(Base):
    """
    Модель доступа игрока к канвасу
    """
    __tablename__ = 'access'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    field_id = Column(Integer, ForeignKey('fields.id'), nullable=False)

    user = relationship("User", back_populates="accesses")
    field = relationship("Field", back_populates="accesses")