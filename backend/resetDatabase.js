require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/iot_iiot';

async function resetDatabase() {
  const client = new MongoClient(MONGO_URL);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('Resetting database...');
    
    // Clear all collections
    await db.collection('machines').deleteMany({});
    await db.collection('telemetry').deleteMany({});
    await db.collection('alerts').deleteMany({});
    await db.collection('machine_conditions').deleteMany({});
    await db.collection('commands').deleteMany({});
    await db.collection('manual_commands').deleteMany({});
    await db.collection('auto_actions').deleteMany({});
    await db.collection('maintenance_tickets').deleteMany({});
    
    console.log('Database reset complete!');
    
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

resetDatabase();