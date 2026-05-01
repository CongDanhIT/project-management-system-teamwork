
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamsync_db';

async function fixTask() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const taskId = '69f4a445f7a85f1fd3b33cf0';
        const phaseId = '69f4a5e8d59e92dee2c7c736';

        const result = await mongoose.connection.collection('tasks').updateOne(
            { _id: new mongoose.Types.ObjectId(taskId) },
            { $set: { phaseId: new mongoose.Types.ObjectId(phaseId) } }
        );

        console.log('Update result:', result);
        process.exit(0);
    } catch (error) {
        console.error('Error fixing task:', error);
        process.exit(1);
    }
}

fixTask();
