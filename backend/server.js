require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

/* ─────────────── إعداد CORS ─────────────── */
const allowedOrigins = [
  'https://todo-app1-snowy.vercel.app',
  'https://todo-app1-u3qb3voqs-hayels-projects-43a617c8.vercel.app'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // السماح بالطلبات من Postman وأدوات السيرفر (origin قد يكون undefined)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

app.use(express.json());

/* ─────────── الاتصال بقاعدة البيانات ─────────── */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('تم الاتصال بقاعدة البيانات بنجاح'))
  .catch((err) => console.error('فشل الاتصال:', err));

/* ─────────── نماذج البيانات ─────────── */
const User = mongoose.model(
  'User',
  new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true }
  })
);

const Task = mongoose.model(
  'Task',
  new mongoose.Schema({
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  })
);

/* ─────────── وسيط المصادقة ─────────── */
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب توكن للمصادقة' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'توكن غير صالح أو منتهي' });
    req.user = user;
    next();
  });
};

/* ─────────── مسارات المستخدم ─────────── */
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'البريد مستخدم مسبقاً' });

    const hashed = await bcrypt.hash(password, 10);
    await new User({ email, password: hashed }).save();
    res.status(201).json({ message: 'تم إنشاء الحساب بنجاح' });
  } catch {
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: 'بيانات الاعتماد غير صحيحة' });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch {
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

/* ─────────── مسارات المهام ─────────── */
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    res.json(await Task.find({ userId: req.user.userId }));
  } catch {
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const task = await new Task({ text: req.body.text, userId: req.user.userId }).save();
    res.status(201).json(task);
  } catch {
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

app.patch('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { completed: req.body.completed },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'المهمة غير موجودة' });
    res.json(task);
  } catch {
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    if (!task) return res.status(404).json({ message: 'المهمة غير موجودة' });
    res.json({ message: 'تم حذف المهمة' });
  } catch {
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

/* ─────────── مسار اختباري ─────────── */
app.get('/', (_, res) => res.send('مرحباً بكم في خادم تطبيق المهام!'));

/* ─────────── تشغيل الخادم ─────────── */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`الخادم يعمل على http://localhost:${PORT}`));
