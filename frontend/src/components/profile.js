import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from './footer';
import styles from './style/profile.css';
import { API_BASE_URL } from '../config';


function ProfilePage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
  const [profileUpdateError, setProfileUpdateError] = useState(null);

  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [avatarUploadLoading, setAvatarUploadLoading] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState(null);

  // --- Загрузка данных профиля и аватарки при монтировании ---
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [profileRes, avatarRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/profile`, {withCredentials: true}),
          axios.get(`${API_BASE_URL}/my_avatar`, { responseType: 'blob', withCredentials: true }) // Получаем аватар как Blob
        ]);

        setUsername(profileRes.data.username);
        setNewUsername(profileRes.data.username); // Инициализируем поле редактирования текущим именем

        // Создаем URL для Blob-объекта
        const avatarBlobUrl = URL.createObjectURL(avatarRes.data);
        setAvatarUrl(avatarBlobUrl);

      } catch (err) {
        console.error("Ошибка при загрузке профиля:", err);
        setError("Не удалось загрузить данные профиля.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();

    // Очистка URL Blob при размонтировании компонента
    return () => {
      if (avatarUrl) {
        URL.revokeObjectURL(avatarUrl);
      }
    };
  }, []);

  // --- Обработчики изменения аватара ---
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setAvatarUploadError('Выбранный файл не является изображением.');
        setSelectedAvatarFile(null);
        return;
      }
      setSelectedAvatarFile(file);
      setAvatarUploadError(null);
    }
  };

  const handleUploadAvatar = async () => {
    if (!selectedAvatarFile) {
      setAvatarUploadError('Пожалуйста, выберите файл.');
      return;
    }

    setAvatarUploadLoading(true);
    setAvatarUploadError(null);

    const formData = new FormData();
    formData.append('uploaded_file', selectedAvatarFile);

    try {
      await axios.post(`${API_BASE_URL}/avatar`, formData, { withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      
      alert('Аватарка успешно обновлена!');
    } catch (err) {
      console.error("Ошибка при загрузке аватарки:", err);
      setAvatarUploadError("Не удалось загрузить аватарку. Попробуйте еще раз.");
    } finally {
      setAvatarUploadLoading(false);
    }
  };

  // --- Обработчики редактирования профиля ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileUpdateLoading(true);
    setProfileUpdateError(null);

    const payload = {};

    // Добавляем username, только если он изменился и не пустой
    if (newUsername.trim() !== '' && newUsername !== username) {
      payload.username = newUsername.trim();
    }

    // Добавляем пароль, только если он введен и подтвержден
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setProfileUpdateError('Пароли не совпадают.');
        setProfileUpdateLoading(false);
        return;
      }
      payload.password = newPassword;
    }

    // Если ничего не изменилось, не отправляем запрос
    if (Object.keys(payload).length === 0) {
      setProfileUpdateError('Никаких изменений для сохранения.');
      setProfileUpdateLoading(false);
      setIsEditing(false); // Выходим из режима редактирования
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/profile`, payload, {
    withCredentials: true
  });
      if (payload.username) {
        setUsername(payload.username); // Обновляем отображаемое имя
      }
      setNewPassword('');
      setConfirmPassword('');
      setIsEditing(false); // Выходим из режима редактирования
      alert('Профиль успешно обновлен!');
    } catch (err) {
      console.error("Ошибка при обновлении профиля:", err);
      setProfileUpdateError("Не удалось обновить профиль. Попробуйте еще раз.");
    } finally {
      setProfileUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.loadingMessage}>Загрузка профиля...</div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.errorMessage}>{error}</div>
        <button onClick={() => navigate('/home')} className={styles.goHomeButton}>
          Вернуться на главную
        </button>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.profilePage}>
      <header className={styles.header}>
        <button onClick={() => navigate('/home')} className={styles.goHomeButton}>
          ← Вернуться на главную
        </button>
      </header>

      <div className={styles.profileContainer}>
        <h1 className={styles.title}>Мой Профиль</h1>

        {/* Секция Аватарки */}
        <div className={styles.avatarSection}>
          <img
            src={`${API_BASE_URL}/my_avatar`} 
            alt="Аватар пользователя"
            style={{ width: '150px', height: '150px', objectFit: 'cover' }}
          />
          <div className={styles.avatarUpload}>
            <label htmlFor="avatar-upload" className={styles.fileInputLabel}>
              {selectedAvatarFile ? selectedAvatarFile.name : 'Выбрать файл'}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={styles.fileInput}
            />
            <button
              onClick={handleUploadAvatar}
              className={styles.uploadButton}
              disabled={!selectedAvatarFile || avatarUploadLoading}
            >
              {avatarUploadLoading ? 'Загрузка...' : 'Сменить аватар'}
            </button>
          </div>
          {avatarUploadError && <p className={styles.errorMessage}>{avatarUploadError}</p>}
        </div>

        {/* Информация о пользователе */}
        <div className={styles.userInfo}>
          <p className={styles.usernameDisplay}>
            Имя пользователя: <span>{username}</span>
          </p>
        </div>

        {/* Кнопка редактирования / Форма редактирования */}
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className={styles.editButton}>
            Редактировать профиль
          </button>
        ) : (
          <form onSubmit={handleUpdateProfile} className={styles.editForm}>
            <h2>Редактирование профиля</h2>
            <div className={styles.formGroup}>
              <label htmlFor="newUsername">Новое имя пользователя:</label>
              <input
                type="text"
                id="newUsername"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Оставьте пустым, чтобы не менять"
                className={styles.inputField}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="newPassword">Новый пароль:</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Оставьте пустым, чтобы не менять"
                className={styles.inputField}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Подтвердите пароль:</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите новый пароль"
                className={styles.inputField}
              />
            </div>
            {profileUpdateError && <p className={styles.errorMessage}>{profileUpdateError}</p>}
            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setNewUsername(username); // Сбрасываем к текущему имени
                  setNewPassword('');
                  setConfirmPassword('');
                  setProfileUpdateError(null); // Очищаем ошибки
                }}
                className={styles.cancelButton}
              >
                Отмена
              </button>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={profileUpdateLoading}
              >
                {profileUpdateLoading ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </form>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default ProfilePage;
