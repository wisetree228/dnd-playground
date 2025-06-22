import React from 'react';
import './style/Footer.css'; // Импортируем файл стилей для этого компонента


const Footer = ({
  projectName = 'Dnd playground',
  githubUrl = 'https://github.com/wisetree228/dnd-playground',
  githubText = 'GitHub Репозиторий с исходным кодом проекта'
}) => {

  return (
    <footer className="footer-futuristic">
      <div className="footer-content">
        <p className="project-name">{projectName}</p>
        <a
          href={githubUrl}
          target="_blank" // Открывает ссылку в новой вкладке
          rel="noopener noreferrer" // Рекомендуется для безопасности при target="_blank"
          className="github-link"
        >
          {githubText}
        </a>
      </div>
      <div className="footer-decorations">
        {/* Декоративные линии для футуристического эффекта */}
        <span className="deco-line line-left"></span>
        <span className="deco-line line-right"></span>
      </div>
    </footer>
  );
};

export default Footer;
