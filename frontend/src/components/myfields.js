import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import Footer from './footer';
import './style/my-fields.css';

const MyFieldsPage = () => {
  const [fields, setFields] = useState([]);
  const [accessedFields, setAccessedFields] = useState([]);
  const [loading, setLoading] = useState({
    myFields: true,
    accessedFields: true
  });
  const [error, setError] = useState({
    myFields: null,
    accessedFields: null
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загрузка своих полей
        const fieldsResponse = await axios.get(`${API_BASE_URL}/my_fields`, { withCredentials: true });
        if (fieldsResponse.data && Array.isArray(fieldsResponse.data.fields)) {
          setFields(fieldsResponse.data.fields);
        } else {
          console.warn("Unexpected data format from /my_fields:", fieldsResponse.data);
          setFields([]);
        }
      } catch (err) {
        console.error('Ошибка при загрузке игровых полей:', err);
        setError(prev => ({...prev, myFields: 'Не удалось загрузить ваши игровые поля.'}));
      } finally {
        setLoading(prev => ({...prev, myFields: false}));
      }

      try {
        // Загрузка доступных полей
        const accessedResponse = await axios.get(`${API_BASE_URL}/fields_accessed`, { withCredentials: true });
        if (accessedResponse.data && Array.isArray(accessedResponse.data.accessed_fields)) {
          setAccessedFields(accessedResponse.data.accessed_fields);
        } else {
          console.warn("Unexpected data format from /fields_accessed:", accessedResponse.data);
          setAccessedFields([]);
        }
      } catch (err) {
        console.error('Ошибка при загрузке доступных полей:', err);
        setError(prev => ({...prev, accessedFields: 'Не удалось загрузить доступные поля.'}));
      } finally {
        setLoading(prev => ({...prev, accessedFields: false}));
      }
    };

    fetchData();
  }, []);

  const goToProfile = () => {
    navigate('/profile');
  };

  const goToCreateField = () => {
    navigate('/create_field');
  };

  const renderFieldsList = (fields, isLoading, errorMsg, emptyMsg) => {
    if (isLoading) {
      return <p className="loading-message">Загрузка...</p>;
    }
    if (errorMsg) {
      return <p className="error-message">{errorMsg}</p>;
    }
    if (fields.length === 0) {
      return <p className="no-fields-message">{emptyMsg}</p>;
    }
    return (
      <ul className="field-list">
        {fields.map((field) => (
          <li key={field.field_id || field.id} className="field-item">
            <Link to={`/field/${field.field_id || field.id}`} className="field-link">
              <span className="field-name">{field.field_name || field.name}</span>
              <span className="arrow-icon">→</span>
            </Link>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="my-fields-page">
      <header className="my-fields-header">
        <h1 className="page-title">Мои Игровые Поля</h1>
        <button onClick={goToCreateField} className="add-field-button">
          <span className="button-icon">➕</span> Добавить поле
        </button>
        <button onClick={goToProfile} className="profile-button">
          <span className="button-icon">👤</span> Ваш Профиль
        </button>
      </header>

      <main className="my-fields-main-content">
        <div className="fields-section">
          <h2>Мои поля</h2>
          <div className="fields-list-container">
            {renderFieldsList(
              fields, 
              loading.myFields, 
              error.myFields, 
              'У вас пока нет игровых полей.'
            )}
          </div>
        </div>

        <div className="fields-section">
          <h2>Доступные мне поля</h2>
          <div className="fields-list-container">
            {renderFieldsList(
              accessedFields, 
              loading.accessedFields, 
              error.accessedFields, 
              'У вас нет доступа к чужим полям.'
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyFieldsPage;