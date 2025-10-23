require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/iot_iiot';

async function createTestUser() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db();
  const usersCol = db.collection('users');

  // Create test operator user
  const hashedPassword = await bcrypt.hash('operator123', 10);
  await usersCol.insertOne({
    username: 'operator',
    password: hashedPassword,
    role: 'operator',
    name: 'Test Operator',
    created: new Date()
  });

  console.log('Test operator user created: operator / operator123');
  await client.close();
}

createTestUser().catch(console.error);