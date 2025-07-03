# Проект  | Project 
[Русская версия](#russian-version) | [English Version](#english-version)

<a id="russian-version"></a>
##  Русская версия

### Идея проекта:
Создать платформу с вирутальными игровыми полями для dungeon & dragons, на которых можно рисовать в реальном времени и давать или отнимать к свои полям доступ другим игрокам, сохранять поля в базу данных


### Сам проект на сервере - 

### Технологический стэк:
#### Backend:
- Python 3.12
- FastAPI 0.115.0
- Postgres
- Alembic 1.13.2
#### Frontend:
- ReactJS
- FabricJS
#### Паттерн проектирования на бэкенде - MVC

#### Для поднятия всего проекта используется docker compose

### Реализованный функционал:
- Создание полей
- Рисование на полях, в реальном времени для нескольких игроков
- Система регистрации и авторизации
- Редактирование профиля
- Система доступа к полям
- Сохранение рисунков в базу данных


# Инструкция по локальному запуску 

1) создать виртуальное окружение:

-для виндовс
```commandline
py -m venv venv
```

-для линукса
```commandline
python3 -m venv venv
```

2) активировать:

-для виндовс
```commandline
venv\Scripts\activate
```

-для линукса
```commandline
source venv/bin/activate
```

3) В корневой директории проекта создать файл .env и там установить настройки подключения к бд, а также секретный ключ для шифрования JWT токенов при авторизации, пример:
```
POSTGRES_USER=wisetree
POSTGRES_PASSWORD=123456789
POSTGRES_DB=mydb
SECRET_KEY=96683abd8bb109bc25fe27675433a9b6
DATABASE_URL=postgresql+asyncpg://wisetree:123456789@db:5432/mydb
```

4) В папке frontend создать ещё один файл .env и записать туда
```
ESLINT_NO_DEV_ERRORS=true
DISABLE_ESLINT_PLUGIN=true
```
(это нужно для отключения ошибок eslint)

5) Поднять докер (на виндовс просто запустите docker desktop, на линуксе выполните команду ```sudo systemctl start docker```)

6) Выполните команду ```sudo docker compose up --build```

7) Когда докер поднимется, откройте второй терминал и выполните ```sudo docker compose run --rm app alembic revision --autogenerate -m "New migration"``` а потом ```sudo docker compose run --rm app alembic upgrade head``` (создание таблиц в бд)

8) Готово! Проект доступен на локальном сервере по адресу http://localhost:3000 (пользовательский фронтенд), к API бэкенда обращаться по http://localhost:8000



## Генерация документации

1) Перейдите в папку docs (```cd docs```)
2) выполните команду ```make html``` (если не сработало, то ```.\make html```)
3) Теперь, когда документация сгенерирована, откройте в браузере файл который располагается по адресу ```docs/build/html/index.html```

<a id="english-version"></a>
## English version

### Project Idea:
Create a platform with virtual playing fields for dungeons & dragons, where you can draw in real time and give or take away access to your fields to other players, save fields to a database

### The project is hosted at - 

### Technology Stack:
#### Backend:
- Python 3.12
- FastAPI 0.115.0
- Postgres
- Alembic 1.13.2
#### Frontend:
- ReactJS
- FabricJS

#### Design Pattern on the Backend - MVC

#### The entire project is launched using Docker Compose.

### Implemented Functionality:
- Creating fields
- Drawing on fields, in real time for multiple players
- Registration and authorization system
- Profile editing
- Field access system
- Saving drawings to the database

## Local Launch Instructions

1) Create a virtual environment:

- For Windows
```py -m venv venv```

- For Linux
```python3 -m venv venv```

2) Activate:

- For Windows
```venv\Scripts\activate```

- For Linux
```source venv/bin/activate```

3) In the root directory of the project, create a .env file and set the database connection settings and the secret key for encrypting JWT tokens upon authentication. Example:
```
POSTGRES_USER=wisetree
POSTGRES_PASSWORD=123456789
POSTGRES_DB=mydb
SECRET_KEY=96683abd8bb109bc25fe27675433a9b6
DATABASE_URL=postgresql+asyncpg://wisetree:123456789@db:5432/mydb
```

4) In the frontend folder, create another .env file and write:
```
ESLINT_NO_DEV_ERRORS=true
DISABLE_ESLINT_PLUGIN=true
```

(This is necessary to disable ESLint errors.)

5) Start Docker (on Windows, just launch Docker Desktop; on Linux, execute the command ```sudo systemctl start docker```).

6) Execute the command ```sudo docker compose up --build```.

7) Once Docker is up, open a second terminal and run ```sudo docker compose run --rm app alembic revision --autogenerate -m "New migration"``` and then ```sudo docker compose run --rm app alembic upgrade head``` (this creates tables in the database).

8) Done! The project is available on the local server at http://localhost:3000 (user frontend), API backend can be accessed at http://localhost:8000.



## Documentation Generation

1) Navigate to the docs folder (```cd docs```).
2) Execute the command ```make html``` (if it doesn't work, try ```.\make html```).
3) Now that the documentation has been generated, open the file located at ```docs/build/html/index.html``` in a browser.



