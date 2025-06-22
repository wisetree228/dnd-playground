"""
Основной файл с приложением
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.application.routes import router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
