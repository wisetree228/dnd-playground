import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fabric } from 'fabric';
import io from 'socket.io-client';
import axios from 'axios';
import Footer from './footer';
import './style/canvas.css';
import { API_BASE_URL } from '../config';

const CanvasPage = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const socketRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const { id } = useParams();

  // Инициализация canvas и подключение к Socket.io
  useEffect(() => {
    const canvas = new fabric.Canvas('canvas', {
      width: 800,
      height: 600,
      selection: true,
      backgroundColor: '#ffffff',
    });
    fabricCanvasRef.current = canvas;

    // Подключение к Socket.io
    const socket = io(`${API_BASE_URL}/socket/${id}`, {
      withCredentials: true,
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('connected');
      console.log('Connected to socket server');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      console.log('Disconnected from socket server');
    });

    // Загрузка начального состояния canvas
    const loadCanvas = async () => {
      try {
        const response = await axios.get('/api/canvas');
        if (response.data === null || response.data.objects === undefined) {
          // Создаем новый canvas с сеткой, если данных нет
          initializeGridCanvas(canvas);
        } else {
          // Загружаем существующий canvas
          canvas.loadFromJSON(response.data, () => {
            canvas.renderAll();
          });
        }
      } catch (error) {
        console.error('Error loading canvas:', error);
        initializeGridCanvas(canvas);
      }
    };

    loadCanvas();

    // Слушаем обновления canvas от других пользователей
    socket.on('canvas_updated', (data) => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.loadFromJSON(data, () => {
          fabricCanvasRef.current.renderAll();
        });
      }
    });

    // Отправляем изменения на сервер при любом изменении canvas
    canvas.on('object:modified', handleCanvasChange);
    canvas.on('object:added', handleCanvasChange);
    canvas.on('object:removed', handleCanvasChange);

    return () => {
      canvas.dispose();
      socket.disconnect();
    };
  }, []);

  // Инициализация canvas с сеткой
  const initializeGridCanvas = (canvas) => {
    canvas.setBackgroundColor('#1e8540', () => {
      // Создаем сетку 20x20
      const gridSize = 20;
      const width = canvas.getWidth();
      const height = canvas.getHeight();
      
      // Вертикальные линии
      for (let i = 0; i < width; i += gridSize) {
        const line = new fabric.Line([i, 0, i, height], {
          stroke: 'rgba(255, 255, 255, 0.2)',
          strokeWidth: 1,
          selectable: false,
          evented: false,
        });
        canvas.add(line);
      }
      
      // Горизонтальные линии
      for (let i = 0; i < height; i += gridSize) {
        const line = new fabric.Line([0, i, width, i], {
          stroke: 'rgba(255, 255, 255, 0.2)',
          strokeWidth: 1,
          selectable: false,
          evented: false,
        });
        canvas.add(line);
      }
      
      canvas.renderAll();
    });
  };

  // Обработчик изменений canvas
  const handleCanvasChange = () => {
    if (socketRef.current && socketRef.current.connected) {
      const jsonData = fabricCanvasRef.current.toJSON();
      socketRef.current.emit('canvas_update', jsonData);
    }
  };

  // Сохранение canvas в базу данных
  const handleSaveCanvas = async () => {
    try {
      setIsSaving(true);
      const jsonData = fabricCanvasRef.current.toJSON();
      await axios.post('/api/canvas/save', jsonData);
      console.log('Canvas saved successfully');
    } catch (error) {
      console.error('Error saving canvas:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="canvas-page">
      <header className="canvas-header">
        <button 
          className="nav-button profile-button"
          onClick={() => navigate('/profile')}
        >
          Мой профиль
        </button>
        <button 
          className="nav-button home-button"
          onClick={() => navigate('/home')}
        >
          Вернуться на главную
        </button>
      </header>

      <div className="canvas-container">
        <div className="canvas-wrapper">
          <canvas id="canvas" ref={canvasRef} />
          <div className={`connection-status ${connectionStatus}`}>
            Статус: {connectionStatus === 'connected' ? 'Подключено' : 'Нет соединения'}
          </div>
        </div>
        
        <div className="canvas-controls">
          <button 
            className="save-button"
            onClick={handleSaveCanvas}
            disabled={isSaving}
          >
            {isSaving ? 'Сохранение...' : 'Сохранить в базу данных'}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CanvasPage;