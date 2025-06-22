// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config'; // Импортируем базовый URL API
import Footer from './footer'; // Импортируем компонент футера
import './style/login.css'; // Импортируем стили для страницы логина

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); // Предотвращаем стандартное поведение отправки формы

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        username,
        password,
      }, {withCredentials: true});

      // Логируем ответ для отладки
      console.log('Успешный вход:', response.data);

      // Если запрос успешен, перенаправляем на страницу /home
      navigate('/home');

    } catch (error) {
      // Обработка ошибок
      console.error('Ошибка входа:', error);

      let errorMessage = 'Произошла ошибка при входе. Пожалуйста, попробуйте еще раз.';
      if (error.response) {
        // Сервер ответил с ошибкой (например, 400, 401, 500)
        errorMessage = error.response.data.detail;
      } else if (error.request) {
        // Запрос был сделан, но ответа не получено (например, нет соединения)
        errorMessage = 'Нет ответа от сервера. Проверьте ваше интернет-соединение.';
      } else {
        // Что-то пошло не так при настройке запроса
        errorMessage = 'Ошибка запроса: ' + error.message;
      }

      alert(errorMessage); // Выводим сообщение об ошибке
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <h1>Добро пожаловать!</h1>
      </header>

      <main className="login-main-content">
        <div className="login-form-container">
          <h2>Вход в систему</h2>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Имя пользователя:</label>
              <input
                type="text"
                id="username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Пароль:</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="login-button">Войти</button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;
