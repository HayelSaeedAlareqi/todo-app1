const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const connectDB = require('../db');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectDB(uri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('Auth API', () => {
  const email = `user${Date.now()}@mail.com`;

  it('should register a new user', async () => {
    const res = await request(app).post('/api/register').send({
      email,
      password: '123456'
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('تم إنشاء الحساب بنجاح');
  });
});