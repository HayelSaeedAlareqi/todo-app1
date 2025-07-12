import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// رابط الـ backend
const API_BASE = 'https://todo-app1-production.up.railway.app';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // إعداد Axios لإرفاق التوكن مع كل طلب
  axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // تسجيل الدخول
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post(`${API_BASE}/api/login`, {
        email,
        password
      });

      localStorage.setItem('token', response.data.token);
      setIsLoggedIn(true);
      fetchTasks();
    } catch (error) {
      setError('فشل تسجيل الدخول: تأكد من صحة البيانات');
    }
  };

  const toggleTaskCompletion = async (taskId, completed) => {
    try {
      await axios.patch(`${API_BASE}/api/tasks/${taskId}`, { completed });
      setTasks(tasks.map(task => 
        task._id === taskId ? { ...task, completed } : task
      ));
    } catch (error) {
      console.error('فشل تحديث المهمة:', error);
    }
  };

  // تسجيل مستخدم جديد
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post(`${API_BASE}/api/register`, {
        email,
        password
      });

      setError('تم إنشاء الحساب بنجاح. يمكنك تسجيل الدخول الآن.');
      setIsRegistering(false);
    } catch (error) {
      setError('فشل التسجيل: قد يكون البريد مستخدم مسبقاً');
    }
  };

  // جلب المهام
  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error('فشل جلب المهام:', error);
    }
  };

  // إضافة مهمة
  const addTask = async () => {
    if (!newTask.trim()) return;

    try {
      const response = await axios.post(`${API_BASE}/api/tasks`, {
        text: newTask
      });

      setTasks([...tasks, response.data]);
      setNewTask('');
    } catch (error) {
      console.error('فشل إضافة المهمة:', error);
    }
  };

  // حذف مهمة
  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${API_BASE}/api/tasks/${taskId}`);
      setTasks(tasks.filter(task => task._id !== taskId));
    } catch (error) {
      console.error('فشل حذف المهمة:', error);
    }
  };

  // تسجيل الخروج
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setTasks([]);
    setEmail('');
    setPassword('');
    setError('');
  };

  // التحقق من حالة تسجيل الدخول عند التحميل
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      fetchTasks();
    }
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="auth-container">
        <h2>{isRegistering ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</h2>
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="buttons">
            <button type="submit">{isRegistering ? 'إنشاء حساب' : 'تسجيل الدخول'}</button>
            <button 
              type="button" 
              className="toggle-btn"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? 'لديك حساب؟ سجل الدخول' : 'لا تملك حساب؟ سجل الآن'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header>
        <h1>قائمة المهام</h1>
        <div className="user-info">
          <span>مرحباً، {email}</span>
          <button onClick={handleLogout} className="logout-btn">تسجيل الخروج</button>
        </div>
      </header>

      <div className="task-form">
        <input
          type="text"
          placeholder="أضف مهمة جديدة..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
        />
        <button onClick={addTask} className="add-btn">إضافة</button>
      </div>

      {tasks.length === 0 ? (
        <div className="no-tasks">لا توجد مهام حالياً</div>
      ) : (
        <ul className="task-list">
          {tasks.map(task => (
            <li key={task._id} className={task.completed ? 'completed' : ''}>
              <span>{task.text}</span>
              <div>
                <button 
                  className="complete-btn"
                  onClick={() => toggleTaskCompletion(task._id, !task.completed)}
                >
                  {task.completed ? 'إلغاء' : 'إكمال'}
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => deleteTask(task._id)}
                >
                  حذف
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
