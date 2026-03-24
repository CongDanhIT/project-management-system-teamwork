import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI not found in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Successfully connected to MongoDB');
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    await db.collection('tasks').dropIndex('taskCode_1');
    console.log('✅ Index "taskCode_1" (global) has been dropped.');
    
  } catch (err: any) {
    if (err.codeName === 'IndexNotFound') {
      console.log('ℹ️ Index "taskCode_1" already dropped or not found.');
    } else {
      console.error('❌ Error dropping index:', err.message);
    }
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
