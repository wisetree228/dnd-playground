// src/pages/MyFieldsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config'; // Импортируем базовый URL API
import Footer from './footer'; // Импортируем компонент футера
import './style/my-fields.css'; // Импортируем стили для этой страницы

const MyFieldsPage = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFields = async () => {
      try {
        // !!! Внимание: Убедитесь, что здесь используются обратные кавычки (`) для шаблонного литерала.
        // Пример: const response = await axios.get(`${API_BASE_URL}/my_fields`, {withCredentials: true});
        const response = await axios.get(`${API_BASE_URL}/my_fields`, {withCredentials: true}); // Исправлено для ясности
        // Убедимся, что данные приходят в ожидаемом формате
        if (response.data && Array.isArray(response.data.fields)) {
          setFields(response.data.fields);
        } else {
          // Если формат ответа неожиданный
          console.warn("Unexpected data format from /my_fields:", response.data);
          setFields([]); // Очищаем поля, чтобы избежать ошибок отображения
        }
      } catch (err) {
        console.error('Ошибка при загрузке игровых полей:', err);
        setError('Не удалось загрузить игровые поля. Пожалуйста, попробуйте еще раз.');
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, []); // Пустой массив зависимостей означает, что эффект запустится только один раз при монтировании компонента

  const goToProfile = () => {
    navigate('/profile');
  };

  // Новая функция для перехода на страницу создания поля
  const goToCreateField = () => {
    navigate('/create_field');
  };

  return (
    <div className="my-fields-page">
      <header className="my-fields-header">
        <h1 className="page-title">Мои Игровые Поля</h1>
        {/* Новая кнопка "Добавить поле" */}
        <button onClick={goToCreateField} className="add-field-button">
          <span className="button-icon">➕</span> Добавить поле
        </button>
        <button onClick={goToProfile} className="profile-button">
          <span className="button-icon">👤</span> Ваш Профиль
        </button>
      </header>

      <main className="my-fields-main-content">
        <div className="fields-list-container">
          {loading ? (
            <p className="loading-message">Загрузка полей...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : fields.length === 0 ? (
            <p className="no-fields-message">У вас пока нет игровых полей.</p>
          ) : (
            <ul className="field-list">
              {fields.map((field) => (
                <li key={field.id} className="field-item">
                  {/* !!! Внимание: Убедитесь, что здесь также используются обратные кавычки (`) для шаблонного литерала. */}
                  {/* Пример: <Link to={`/field/${field.id}`} className="field-link"> */}
                  <Link to={`/field/${field.id}`} className="field-link"> {/* Исправлено для ясности */}
                    <span className="field-name">{field.name}</span>
                    <span className="arrow-icon">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyFieldsPage;
