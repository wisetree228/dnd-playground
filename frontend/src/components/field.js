import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { fabric } from 'fabric';
import Footer from './footer';
import './style/canvas.css';
import { API_BASE_URL } from '../config';

const CanvasPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const fabricCanvas = useRef(null);
    const [brushColor, setBrushColor] = useState('black');
    const [brushSize, setBrushSize] = useState(5);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPointer, setLastPointer] = useState({ x: 0, y: 0 });
    const [userId, setUserId] = useState(null);
    const websocketRef = useRef(null);
    const [accessedUsers, setAccessedUsers] = useState([]);
    const [newUsername, setNewUsername] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchId = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/my_id`, { withCredentials: true });
                setUserId(response.data.id);
                // После получения ID загружаем список пользователей
                fetchAccessedUsers(response.data.id);
            } catch {
                navigate('/');
            }
        };

        fetchId();
    }, []);

    const fetchAccessedUsers = async (currentUserId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/accesses/${id}`, {
                withCredentials: true
            });
            setAccessedUsers(response.data.accessed_users);
            setError(null);
        } catch (err) {
            setError('Не удалось загрузить список пользователей. Возможно, у вас нет прав.');
            console.error("Ошибка загрузки списка пользователей:", err);
        }
    };

    const handleAddAccess = async () => {
        if (!newUsername.trim()) return;

        try {
            await axios.post(
                `${API_BASE_URL}/access/${id}`,
                { username: newUsername },
                { withCredentials: true }
            );
            setNewUsername('');
            fetchAccessedUsers(userId);
        } catch (err) {
            console.error("Ошибка добавления пользователя:", err);
            alert('Ошибка! Возможные причины: некорректный юзернейм или вы не имеете права на администрирование этого поля');
        }
    };

    const handleRemoveAccess = async (userToRemoveId) => {
        try {
            await axios.delete(
                `${API_BASE_URL}/access/${userToRemoveId}/${id}`,
                { withCredentials: true }
            );
            fetchAccessedUsers(userId);
        } catch (err) {
            console.error("Ошибка удаления пользователя:", err);
            alert('Не удалось удалить пользователя.');
        }
    };

    // Инициализация WebSocket соединения
    useEffect(() => {
        const protocol = 'ws:';
        const host = API_BASE_URL.replace('http://', '');
        const wsUrl = `${protocol}//${host}/ws/${id}`;

        websocketRef.current = new WebSocket(wsUrl);

        websocketRef.current.onopen = () => {
            console.log('WebSocket connected');
        };

        websocketRef.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
        };

        websocketRef.current.onclose = () => {
            console.log('WebSocket disconnected');
        };

        websocketRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            if (websocketRef.current) {
                websocketRef.current.close();
            }
        };
    }, [id]);

    const handleWebSocketMessage = (message) => {
        if (!fabricCanvas.current) return;

        switch (message.type) {
            case 'canvas_object':
                // Игнорируем свои же сообщения (они уже отрисованы)
                if (message.userId === userId) return;

                fabric.util.enlivenObjects([message.object], (objects) => {
                    objects.forEach(obj => {
                        fabricCanvas.current.add(obj);
                    });
                    fabricCanvas.current.renderAll();
                });
                break;

            case 'canvas_clear':
                // Игнорируем свои же сообщения
                if (message.userId === userId) return;

                drawGrid(fabricCanvas.current);
                break;

            default:
                console.warn('Unknown message type:', message.type);
        }
    };

    const sendWebSocketMessage = (message) => {
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            websocketRef.current.send(JSON.stringify({
                ...message,
                userId: userId
            }));
        }
    };

    // Инициализация canvas и загрузка данных
    useEffect(() => {
        fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
            width: 800,
            height: 600,
            backgroundColor: 'lightgreen',
            isDrawingMode: false,
            selection: false,
            defaultCursor: 'crosshair',
            skipTargetFind: true
        });

        drawGrid(fabricCanvas.current);
        loadCanvasData(fabricCanvas.current);

        const setupEventListeners = () => {
            fabricCanvas.current.on('mouse:down', (options) => {
                if (options.target) return;
                setIsDrawing(true);
                setLastPointer(options.absolutePointer);
            });

            fabricCanvas.current.on('mouse:move', (options) => {
                if (!isDrawing) return;
                const pointer = options.absolutePointer;

                const line = new fabric.Line(
                    [lastPointer.x, lastPointer.y, pointer.x, pointer.y],
                    {
                        strokeWidth: brushSize,
                        stroke: brushColor,
                        selectable: false,
                        evented: false
                    }
                );
                fabricCanvas.current.add(line);

                // Отправляем новый объект через WebSocket
                sendWebSocketMessage({
                    type: 'canvas_object',
                    object: line.toObject()
                });

                setLastPointer(pointer);
            });

            fabricCanvas.current.on('mouse:up', () => {
                setIsDrawing(false);
            });
        };

        setupEventListeners();

        return () => {
            if (fabricCanvas.current) {
                fabricCanvas.current.off('mouse:down');
                fabricCanvas.current.off('mouse:move');
                fabricCanvas.current.off('mouse:up');

                if (fabricCanvas.current.wrapperEl && fabricCanvas.current.wrapperEl.parentNode) {
                    fabricCanvas.current.dispose();
                }
                fabricCanvas.current = null;
            }
        };
    }, [id]);

    // Обновление обработчиков событий при изменении параметров кисти
    useEffect(() => {
        if (!fabricCanvas.current) return;

        fabricCanvas.current.off('mouse:down');
        fabricCanvas.current.off('mouse:move');
        fabricCanvas.current.off('mouse:up');

        fabricCanvas.current.on('mouse:down', (options) => {
            if (options.target) return;
            setIsDrawing(true);
            setLastPointer(options.absolutePointer);
        });

        fabricCanvas.current.on('mouse:move', (options) => {
            if (!isDrawing) return;
            const pointer = options.absolutePointer;

            const line = new fabric.Line(
                [lastPointer.x, lastPointer.y, pointer.x, pointer.y],
                {
                    strokeWidth: brushSize,
                    stroke: brushColor,
                    selectable: false,
                    evented: false
                }
            );
            fabricCanvas.current.add(line);

            // Отправляем новый объект через WebSocket
            sendWebSocketMessage({
                type: 'canvas_object',
                object: line.toObject()
            });

            setLastPointer(pointer);
        });

        fabricCanvas.current.on('mouse:up', () => {
            setIsDrawing(false);
        });
    }, [brushColor, brushSize, isDrawing, lastPointer]);

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
            alert('вы не имеете доступа к этому полю либо на стороне сервера произошла ошибка!')
            navigate('/home')
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
            alert('Вы не имеете права на администрирование этого поля или на стороне сервера произошла ошибка');
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

            <div className="canvas-container">
                <canvas
                    ref={canvasRef}
                    id="canvas"
                    width={800}
                    height={600}
                    style={{ border: '1px solid #000', margin: '20px' }}
                />

                {!error && (
                    <div className="access-panel">
                        <h3>Доступ к полю</h3>
                        
                        <div className="add-user-form">
                            <input
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                placeholder="Введите username"
                            />
                            <button onClick={handleAddAccess}>Добавить</button>
                        </div>
                        
                        <div className="users-list">
                            {accessedUsers.map(user => (
                                <div key={user.user_id} className="user-item">
                                    <img 
                                        src={`${API_BASE_URL}/avatar/${user.user_id}`} 
                                        alt={user.username} 
                                        className="user-avatar"
                                    />
                                    <span className="username">{user.username}</span>
                                    <button 
                                        onClick={() => handleRemoveAccess(user.user_id)}
                                        className="remove-btn"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* {error && <div className="access-error">{error}</div>} */}
            </div>

            <Footer />
        </div>
    );
};

export default CanvasPage;