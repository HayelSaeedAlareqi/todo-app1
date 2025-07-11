const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');

describe('Tasks API', () => {
  let token;
  let userId;

  beforeAll(async () => {
    await mongoose.connect(global.__MONGO_URI__, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // إنشاء مستخدم اختباري
    const user = new User({
      email: 'test@tasks.com',
      password: 'hashed_password' // في الواقع يجب تشفيره
    });
    await user.save();
    
    userId = user._id;
    token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  test('POST /api/tasks - should create a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'مهمة اختبارية' });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('text', 'مهمة اختبارية');
  });

  test('GET /api/tasks - should get user tasks', async () => {
    // إضافة مهمة أولاً
    await Task.create({
      text: 'مهمة 1',
      userId
    });

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('PATCH /api/tasks/:id - should update task status', async () => {
    const task = await Task.create({
      text: 'مهمة للتحديث',
      userId,
      completed: false
    });

    const res = await request(app)
      .patch(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ completed: true });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.completed).toBe(true);
  });

  test('DELETE /api/tasks/:id - should delete a task', async () => {
    const task = await Task.create({
      text: 'مهمة للحذف',
      userId
    });

    const res = await request(app)
      .delete(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    
    // التحقق من حذف المهمة
    const deletedTask = await Task.findById(task._id);
    expect(deletedTask).toBeNull();
  });
});