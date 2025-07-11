require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('تم الاتصال بقاعدة البيانات بنجاح'))
.catch(err => console.error('فشل الاتصال:', err));

// نموذج المستخدم
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// نموذج المهمة
const TaskSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});
const Task = mongoose.model('Task', TaskSchema);

// وسيط المصادقة
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'مطلوب توكن للمصادقة' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'توكن غير صالح أو منتهي الصلاحية' });
    req.user = user;
    next();
  });
};

// مسارات المستخدمين
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // التحقق من وجود المستخدم
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'البريد الإلكتروني مستخدم مسبقاً' });
    }
    
    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    
    res.status(201).json({ message: 'تم إنشاء الحساب بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'بيانات الاعتماد غير صحيحة' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'بيانات الاعتماد غير صحيحة' });
    }
    
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// مسارات المهام (محمية بالمصادقة)
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    const task = new Task({
      text,
      userId: req.user.userId
    });
    
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!task) {
      return res.status(404).json({ message: 'المهمة غير موجودة' });
    }
    
    res.json({ message: 'تم حذف المهمة' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});
app.patch('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { completed } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { completed },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'المهمة غير موجودة' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// مسار الصفحة الرئيسية للاختبار
app.get('/', (req, res) => {
  res.send('مرحباً بكم في خادم تطبيق المهام!');
});

// تشغيل الخادم
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`الخادم يعمل على http://localhost:${PORT}`);
});







// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const connectDB = require('./db');
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');


// const app = express();
// app.use(cors());
// app.use(express.json());

// // الاتصال بقاعدة البيانات (فقط إذا كان التطبيق يعمل مباشرة)
// if (require.main === module) {
//   connectDB(process.env.MONGODB_URI);
// }

// // نموذج المستخدم
// const UserSchema = new mongoose.Schema({
//   email: { type: String, unique: true, required: true },
//   password: { type: String, required: true }
// });
// const User = mongoose.model('User', UserSchema);

// // نموذج المهمة
// const TaskSchema = new mongoose.Schema({
//   text: { type: String, required: true },
//   completed: { type: Boolean, default: false },
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
// });
// const Task = mongoose.model('Task', TaskSchema);

// // وسيط المصادقة
// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];
  
//   if (!token) return res.status(401).json({ message: 'مطلوب توكن للمصادقة' });
  
//   jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//     if (err) return res.status(403).json({ message: 'توكن غير صالح أو منتهي الصلاحية' });
//     req.user = user;
//     next();
//   });
// };

// // مسارات المستخدمين
// app.post('/api/register', async (req, res) => {
//   try {
//     const { email, password } = req.body;
    
//     // التحقق من وجود المستخدم
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'البريد الإلكتروني مستخدم مسبقاً' });
//     }
    
//     // تشفير كلمة المرور
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new User({ email, password: hashedPassword });
//     await user.save();
    
//     res.status(201).json({ message: 'تم إنشاء الحساب بنجاح' });
//   } catch (error) {
//     res.status(500).json({ message: 'خطأ في الخادم' });
//   }
// });

// app.post('/api/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
    
//     if (!user) {
//       return res.status(400).json({ message: 'بيانات الاعتماد غير صحيحة' });
//     }
    
//     const validPassword = await bcrypt.compare(password, user.password);
//     if (!validPassword) {
//       return res.status(400).json({ message: 'بيانات الاعتماد غير صحيحة' });
//     }
    
//     const token = jwt.sign(
//       { userId: user._id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: '1h' }
//     );
    
//     res.json({ token });
//   } catch (error) {
//     res.status(500).json({ message: 'خطأ في الخادم' });
//   }
// });

// // مسارات المهام (محمية بالمصادقة)
// app.get('/api/tasks', authenticateToken, async (req, res) => {
//   try {
//     const tasks = await Task.find({ userId: req.user.userId });
//     res.json(tasks);
//   } catch (error) {
//     res.status(500).json({ message: 'خطأ في الخادم' });
//   }
// });

// app.post('/api/tasks', authenticateToken, async (req, res) => {
//   try {
//     const { text } = req.body;
//     const task = new Task({
//       text,
//       userId: req.user.userId
//     });
    
//     await task.save();
//     res.status(201).json(task);
//   } catch (error) {
//     res.status(500).json({ message: 'خطأ في الخادم' });
//   }
// });

// app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
//   try {
//     const task = await Task.findOneAndDelete({
//       _id: req.params.id,
//       userId: req.user.userId
//     });
    
//     if (!task) {
//       return res.status(404).json({ message: 'المهمة غير موجودة' });
//     }
    
//     res.json({ message: 'تم حذف المهمة' });
//   } catch (error) {
//     res.status(500).json({ message: 'خطأ في الخادم' });
//   }
// });
// app.patch('/api/tasks/:id', authenticateToken, async (req, res) => {
//   try {
//     const { completed } = req.body;
//     const task = await Task.findOneAndUpdate(
//       { _id: req.params.id, userId: req.user.userId },
//       { completed },
//       { new: true }
//     );

//     if (!task) {
//       return res.status(404).json({ message: 'المهمة غير موجودة' });
//     }

//     res.json(task);
//   } catch (error) {
//     res.status(500).json({ message: 'خطأ في الخادم' });
//   }
// });

// // مسار الصفحة الرئيسية للاختبار
// app.get('/', (req, res) => {
//   res.send('مرحباً بكم في خادم تطبيق المهام!');
// });


// module.exports = app;
