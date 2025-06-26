import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { fabric } from 'fabric';
import io from 'socket.io-client';
import Footer from './footer';
import './style/canvas.css';
import { API_BASE_URL } from '../config';

const CanvasPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const fabricCanvas = useRef(null);
    const socketRef = useRef(null);
    const [brushColor, setBrushColor] = useState('black');
    const [brushSize, setBrushSize] = useState(5);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPointer, setLastPointer] = useState({ x: 0, y: 0 });
    const [userId, setUserId] = useState(null);

    // Получаем ID пользователя
    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/my_id`, {
                    withCredentials: true
                });
                setUserId(response.data.id);
            } catch (error) {
                navigate('/');
            }
        };
        fetchUserId();
    }, [navigate]);

    // Функция для отправки обновлений canvas
    const sendCanvasUpdate = useCallback(() => {
        if (socketRef.current?.connected && fabricCanvas.current) {
            const jsonData = fabricCanvas.current.toJSON();
            socketRef.current.emit('canvas_update', {
                canvas: jsonData,
                userId
            });
        }
    }, [userId]);

    // Инициализация canvas и WebSocket
    useEffect(() => {
        if (!userId) return;

        // Инициализация canvas
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 800,
            height: 600,
            backgroundColor: 'lightgreen',
            selection: false,
            defaultCursor: 'crosshair'
        });
        fabricCanvas.current = canvas;

        // Подключение к WebSocket
        const socket = io(API_BASE_URL, {
            path: '/ws/socket.io',
            transports: ['websocket'],
            query: { room_id: id, user_id: userId }
        });
        socketRef.current = socket;

        // Обработчик входящих обновлений
        socket.on('canvas_update', (data) => {
            if (data.userId === userId || !fabricCanvas.current) return;

            fabricCanvas.current.loadFromJSON(data.canvas, () => {
                fabricCanvas.current.renderAll();
            });
        });

        // Рисуем сетку
        drawGrid(canvas);

        // Загружаем сохраненные данные
        loadCanvasData(canvas);

        // Настройка обработчиков событий canvas
        const events = ['object:modified', 'object:added', 'object:removed'];
        events.forEach(event => {
            canvas.on(event, sendCanvasUpdate);
        });

        // Очистка
        return () => {
            events.forEach(event => {
                canvas.off(event, sendCanvasUpdate);
            });
            canvas.dispose();
            socket.disconnect();
        };
    }, [id, userId, sendCanvasUpdate]);

    const drawGrid = (canvas) => {
        if (!canvas) return;

        canvas.clear();
        const background = new fabric.Rect({
            left: 0,
            top: 0,
            fill: 'lightgreen',
            width: canvas.width,
            height: canvas.height,
            selectable: false,
            evented: false
        });
        canvas.add(background);

        // Вертикальные линии
        for (let i = 0; i < canvas.width; i += 20) {
            canvas.add(new fabric.Line([i, 0, i, canvas.height], {
                stroke: 'rgba(0,0,0,0.1)',
                selectable: false,
                evented: false
            }));
        }

        // Горизонтальные линии
        for (let j = 0; j < canvas.height; j += 20) {
            canvas.add(new fabric.Line([0, j, canvas.width, j], {
                stroke: 'rgba(0,0,0,0.1)',
                selectable: false,
                evented: false
            }));
        }
    };

    const loadCanvasData = async () => {
        if (!fabricCanvas.current) return;

        try {
            const response = await axios.get(`${API_BASE_URL}/field/${id}`, { withCredentials: true });
            if (response.data === null) {
                drawGrid(fabricCanvas.current);
            } else {
                fabricCanvas.current.loadFromJSON(response.data, () => {
                    fabricCanvas.current.setBackgroundColor('lightgreen', () => {
                        fabricCanvas.current.renderAll();
                    });
                });
            }
        } catch (error) {
            console.error("Ошибка загрузки данных:", error);
            drawGrid(fabricCanvas.current);
        }
    };

    const saveCanvasData = async () => {
        if (!fabricCanvas.current) return;

        try {
            const jsonData = fabricCanvas.current.toJSON();
            await axios.post(`${API_BASE_URL}/field/${id}`, { data: jsonData }, { withCredentials: true });
            alert('Данные успешно сохранены!');
        } catch (error) {
            console.error("Ошибка сохранения данных:", error);
            alert('Ошибка при сохранении данных!');
        }
    };

    const handleBrushColor = (color) => {
        setBrushColor(color);
    };

    return (
        <div className="canvas-page">
            <div className="navbar">
                <button onClick={() => navigate('/profile')}>Мой профиль</button>
                <button onClick={() => navigate('/home')}>На главную</button>
                <button onClick={saveCanvasData}>Сохранить в базу данных</button>
                <div className="color-selection">
                    <button style={{ backgroundColor: 'red' }} onClick={() => handleBrushColor('red')}></button>
                    <button style={{ backgroundColor: 'blue' }} onClick={() => handleBrushColor('blue')}></button>
                    <button style={{ backgroundColor: 'green' }} onClick={() => handleBrushColor('green')}></button>
                    <button style={{ backgroundColor: 'black' }} onClick={() => handleBrushColor('black')}></button>
                </div>
                <div>
                    <label>Размер кисти: </label>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    />
                    {brushSize}
                </div>
            </div>
            <canvas
                ref={canvasRef}
                id="canvas"
                width={800}
                height={600}
                style={{ border: '1px solid #000', margin: '20px' }}
            />
            <Footer />
        </div>
    );
};

export default CanvasPage;