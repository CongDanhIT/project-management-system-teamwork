import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const taskSchema = new mongoose.Schema({
    status: String,
    completedAt: Date,
    updatedAt: Date
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

async function backfill() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/teamflow';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const result = await Task.collection.updateMany(
            { 
                status: { $in: ['DONE', 'COMPLETED'] }, 
                completedAt: null 
            },
            [
                { $set: { completedAt: "$updatedAt" } }
            ]
        );

        console.log(`Backfilled ${result.modifiedCount} tasks.`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

backfill();
