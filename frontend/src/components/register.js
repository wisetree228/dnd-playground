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
  e.preventDefault();
  setError('');

  // 1. Проверка полей
  if (!username || !password || !confirmPassword) {
    setError('Пожалуйста, заполните все поля.');
    return;
  }

  if (password !== confirmPassword) {
    setError('Пароли не совпадают. Пожалуйста, проверьте.');
    return;
  }

  try {
    // 1. Пробуем зарегистрироваться
    const response = await axios.post(
      `${API_BASE_URL}/register`,
      { username, password },
      { withCredentials: true }
    );

    console.log('Регистрация успешна:', response.data);
    navigate('/home');
    } catch (err) {
    console.error('Ошибка регистрации:', err);

    // Сначала проверяем, авторизован ли пользователь
    try {
      const checkResponse = await axios.get(`${API_BASE_URL}/my_id`, {
        withCredentials: true
      });

      if (checkResponse.data?.id) {
        navigate('/home');
        return;
      }
    } catch (checkErr) {
      console.log('Пользователь не авторизован');
    }

    // Обрабатываем ошибку регистрации
    let errorMessage = 'Ошибка регистрации! Возможно, пользователь с таким именем уже существует';

    if (err.response) {
      // Сервер ответил с ошибкой (4xx, 5xx)
      errorMessage = err.response.data?.detail ||
                   err.response.data?.message ||
                   errorMessage;
    } else if (err.request) {
      // Запрос был сделан, но ответ не получен
      errorMessage = 'Не удалось подключиться к серверу';
    }

    setError(errorMessage);
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
