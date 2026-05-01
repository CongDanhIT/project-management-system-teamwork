import mongoose from "mongoose";
import dotenv from "dotenv";
import ProjectModel from "../models/project.model";
import PhaseModel from "../models/phase.model";
import TaskModel from "../models/task.model";
import UserModel from "../models/user.model";

dotenv.config();

const migrate = async () => {
    try {
        console.log("Starting migration: Tasks to Phase 1...");
        
        await mongoose.connect(process.env.MONGO_URI!);
        console.log("Connected to MongoDB");

        // 1. Get all projects
        const projects = await ProjectModel.find({ deletedAt: null });
        console.log(`Found ${projects.length} projects to process.`);

        // Find an admin user to be the creator of "Phase 1" if needed
        const adminUser = await UserModel.findOne().sort({ createdAt: 1 });
        if (!adminUser) {
            throw new Error("No user found in database to assign as phase creator");
        }

        for (const project of projects) {
            const projectId = project._id;
            const workspaceId = project.workspaceId;

            // 2. Check if "Phase 1" exists for this project
            let phase1 = await PhaseModel.findOne({ 
                projectId, 
                name: "Phase 1", 
                deletedAt: null 
            });

            if (!phase1) {
                console.log(`Creating 'Phase 1' for project: ${project.name}`);
                phase1 = new PhaseModel({
                    workspaceId,
                    projectId,
                    name: "Phase 1",
                    description: "Giai đoạn khởi tạo mặc định cho các công việc hiện tại",
                    status: "ACTIVE",
                    createdBy: adminUser._id,
                    startDate: project.startDate || new Date()
                });
                await phase1.save();
            }

            // 3. Update ALL tasks of this project to "Phase 1"
            const result = await TaskModel.updateMany(
                { 
                    projectId
                },
                { 
                    $set: { phaseId: phase1._id } 
                }
            );

            console.log(`Project '${project.name}': Updated ${result.modifiedCount} tasks to Phase 1 (${phase1._id}).`);
        }

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrate();
