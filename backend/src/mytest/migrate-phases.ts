import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

import ProjectModel from '../models/project.model';
import PhaseModel from '../models/phase.model';
import TaskModel from '../models/task.model';

async function migrateTasksToDefaultPhase() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamflow';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const projects = await ProjectModel.find({ isDeleted: false });
        console.log(`Found ${projects.length} projects to migrate.`);

        for (const project of projects) {
            console.log(`Migrating project: ${project.name} (${project._id})`);

            // 1. Check if "Phase 1" exists for this project
            let phase1 = await PhaseModel.findOne({ 
                projectId: project._id, 
                name: 'Phase 1',
                deletedAt: null 
            });

            if (!phase1) {
                console.log(`  Creating "Phase 1" for project ${project.name}`);
                phase1 = new PhaseModel({
                    workspaceId: project.workspaceId,
                    projectId: project._id,
                    name: 'Phase 1',
                    description: 'Giai đoạn khởi tạo mặc định',
                    startDate: project.createdAt,
                    status: 'ACTIVE',
                    createdBy: project.createdBy
                });
                await phase1.save();
            }

            // 2. Update all tasks that don't have a phaseId
            const result = await TaskModel.updateMany(
                { 
                    projectId: project._id, 
                    phaseId: { $exists: false } 
                },
                { 
                    $set: { phaseId: phase1._id } 
                }
            );

            // Also update tasks where phaseId is null explicitly
            const result2 = await TaskModel.updateMany(
                { 
                    projectId: project._id, 
                    phaseId: null 
                },
                { 
                    $set: { phaseId: phase1._id } 
                }
            );

            console.log(`  Updated ${result.modifiedCount + result2.modifiedCount} tasks to "Phase 1"`);
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateTasksToDefaultPhase();
