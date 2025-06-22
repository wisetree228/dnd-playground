// src/pages/CreateFieldPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import Footer from './footer';
import './style/createField.css';

const CreateFieldPage = () => {
  const [fieldName, setFieldName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Обработчик для кнопки "Мой Профиль"
  const handleProfileClick = () => {
    navigate('/profile');
  };

  // НОВЫЙ ОБРАБОТЧИК: для кнопки "Главная Страница"
  const handleHomeClick = () => {
    navigate('/home');
  };

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    if (!fieldName.trim()) {
      setError('Пожалуйста, введите название игрового поля.');
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/fields`,
        { field_name: fieldName }, // Убедитесь, что имя поля соответствует вашему бэкенду
        { withCredentials: true }
      );

      console.log('Игровое поле успешно создано:', response.data);
      navigate('/home');

    } catch (err) {
      console.error('Ошибка при создании поля:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        alert(`Ошибка создания поля: ${err.response.data.detail}`);
      } else {
        alert('Ошибка создания игрового поля. Пожалуйста, попробуйте еще раз.');
      }
    }
  };

  return (
    <div className="create-field-page">
      <header className="create-field-header">
        <h1 className="page-title">Создать Игровое Поле</h1>
        {/* НОВЫЙ КОНТЕЙНЕР ДЛЯ КНОПОК */}
        <div className="header-buttons">
          <button className="home-button" onClick={handleHomeClick}>
            Главная Страница
          </button>
          <button className="profile-button" onClick={handleProfileClick}>
            Мой Профиль
          </button>
        </div>
      </header>

      <main className="create-field-main-content">
        <form onSubmit={handleSubmit} className="create-field-form">
          {error && <p className="error-message">{error}</p>}

          <div className="form-group">
            <label htmlFor="fieldName">Название поля:</label>
            <input
              type="text"
              id="fieldName"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="Введите название нового поля"
              required
            />
          </div>

          <button type="submit" className="create-button">
            Создать Поле
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default CreateFieldPage;
