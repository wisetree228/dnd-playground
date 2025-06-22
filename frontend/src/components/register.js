// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config'; // Убедитесь, что этот файл существует и содержит API_BASE_URL
import Footer from './footer'; // Импортируем компонент футера
import './style/register.css'; // Импортируем стили для этой страницы

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(''); // Для отображения локальных ошибок
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault(); // Предотвращаем стандартное поведение формы

    setError(''); // Сбрасываем предыдущие ошибки

    // 1. Проверка на заполненность полей
    if (!username || !password || !confirmPassword) {
      setError('Пожалуйста, заполните все поля.');
      return;
    }

    // 2. Проверка совпадения паролей
    if (password !== confirmPassword) {
      setError('Пароли не совпадают. Пожалуйста, проверьте.');
      return;
    }

    // 3. Отправка данных на сервер
    try {
      const response = await axios.post(
        `${API_BASE_URL}/register`,
        { username, password },
        { withCredentials: true } // Важно для передачи куки/сессий, если ваш бэкенд их использует
      );

      // Если регистрация успешна
      console.log('Регистрация успешна:', response.data);
      navigate('/home'); // Перенаправляем на страницу /home

    } catch (err) {
      console.error('Ошибка при регистрации:', err);
      if (err.response.data.detail) {
        // Если сервер вернул конкретное сообщение об ошибке
        alert(`Ошибка регистрации: ${err.response.data.detail}`);
      } else {
        // Общее сообщение об ошибке, если ответ сервера неожиданный
        alert('Ошибка регистрации. Пожалуйста, попробуйте еще раз.');
      }
    }
  };

  return (
    <div className="register-page">
      <header className="register-header">
        <h1 className="page-title">Создать Аккаунт</h1>
      </header>

      <main className="register-main-content">
        <form onSubmit={handleRegister} className="register-form">
          {error && <p className="error-message">{error}</p>} {/* Отображение локальных ошибок */}

          <div className="form-group">
            <label htmlFor="username">Имя пользователя:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите ваше имя пользователя"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Подтвердите пароль:</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повторите пароль"
              required
            />
          </div>

          <button type="submit" className="register-button">
            Зарегистрироваться
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default RegisterPage;
