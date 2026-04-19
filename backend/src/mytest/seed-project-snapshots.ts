import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const snapshotSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, required: true },
  date: { type: Date, required: true },
  totalTasks: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  overdueTasks: { type: Number, default: 0 },
  inProgressTasks: { type: Number, default: 0 },
  todoTasks: { type: Number, default: 0 },
  unassignedTasks: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 },
});

const ProjectAnalyticsSnapshot = mongoose.model('ProjectAnalyticsSnapshot', snapshotSchema);

async function seedData() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/teamsync_db';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const workspaceId = new mongoose.Types.ObjectId('69b407a8b54147306942b630');
    const projectIds = [
      new mongoose.Types.ObjectId('69b63a0a5289030939bc51c7'),
      new mongoose.Types.ObjectId('69b6cc7a7a0b99cb4c555986'),
      new mongoose.Types.ObjectId('69bfda2536db32cbf6139345')
    ];

    // Clear existing snapshots for these projects to avoid duplicates
    await ProjectAnalyticsSnapshot.deleteMany({ projectId: { $in: projectIds } });

    const snapshots = [];
    const now = new Date();

    for (const projectId of projectIds) {
      for (let i = 14; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(23, 55, 0, 0);

        // Randomly generate some realistic-looking data
        const total = 10 + Math.floor(Math.random() * 20); // 10-30 tasks
        const completed = Math.floor(Math.random() * total);
        const overdue = Math.floor(Math.random() * (total - completed) * 0.3);
        const inProgress = total - completed - overdue;
        const unassigned = Math.floor(Math.random() * 5);
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        snapshots.push({
          workspaceId,
          projectId,
          date,
          totalTasks: total,
          completedTasks: completed,
          overdueTasks: overdue,
          inProgressTasks: inProgress,
          todoTasks: 0,
          unassignedTasks: unassigned,
          completionRate
        });
      }
    }

    await ProjectAnalyticsSnapshot.insertMany(snapshots);
    console.log(`Successfully seeded ${snapshots.length} project snapshots.`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
