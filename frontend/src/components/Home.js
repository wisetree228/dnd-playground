import React from 'react';
import { useNavigate } from 'react-router-dom'; // Импортируем useNavigate
import './style/home.css'; // Стили для этой страницы
import Footer from './footer'; // Предполагаемый путь к компоненту Footer

/**
 * Компонент страницы приветствия с футуристичным и минималистичным дизайном.
 * Использует useNavigate для навигации по клику на кнопки.
 */
const LandingPage = () => {
  const navigate = useNavigate(); // Инициализация хука для навигации

  const handleRegisterClick = () => {
    navigate('/register'); // Переход на страницу регистрации
  };

  const handleLoginClick = () => {
    navigate('/login'); // Переход на страницу входа
  };

  return (
    <div className="landing-page-container">
      <main className="landing-main-content">
        <h1 className="landing-title">Добро пожаловать в Проект DND Playground</h1>
        <p className="landing-subtitle">Ваша игра начинается здесь</p>
        <div className="button-group">
          <button className="action-button register-button" onClick={handleRegisterClick}>
            Регистрация
          </button>
          <button className="action-button login-button" onClick={handleLoginClick}>
            Войти
          </button>
        </div>
      </main>

      {/* Футуристичный подвал. Пропсы можно настроить под свои нужды. */}
      <Footer  />
    </div>
  );
};

export default LandingPage;
