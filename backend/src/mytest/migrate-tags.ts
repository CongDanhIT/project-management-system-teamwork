import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TagModel from '../models/tag.model';

dotenv.config({ path: '../../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/my-team-flow';

const migrateTags = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Cập nhật tất cả các tag chưa có type thành TASK
    const result = await TagModel.updateMany(
      { type: { $exists: false } },
      { $set: { type: 'TASK' } }
    );

    console.log(`Updated ${result.modifiedCount} tags.`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateTags();
