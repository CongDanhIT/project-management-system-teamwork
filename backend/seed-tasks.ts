import mongoose from "mongoose";
import dotenv from "dotenv";
import TaskModel from "./src/models/task.model";
import ProjectModel from "./src/models/project.model";

dotenv.config();

const seedTasks = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("Connected to MongoDB.");

        const project = await ProjectModel.findOne({ name: /THIẾT KẾ HỆ THỐNG CỘNG TÁC/i });
        if (!project) {
            console.log("Project not found.");
            process.exit(1);
        }

        console.log(`Found project: ${project.name} (${project._id})`);

        const tasks = await TaskModel.find({ projectId: project._id });
        console.log(`Found ${tasks.length} tasks.`);

        let updatedCount = 0;
        for (const task of tasks) {
            // Chỉ định thời gian cho tất cả task
            const estimatedHours = Math.floor(Math.random() * 8) + 2; // Từ 2 đến 9 giờ
            // Có khả năng log giờ bị chênh (sớm hơn hoặc trễ hơn)
            const variance = Math.floor(Math.random() * 5) - 2; // Từ -2 đến +2
            
            let loggedHours = 0;

            // Nếu task ở trạng thái DONE, loggedHours = estimated + variance, không bao giờ âm
            if (task.status === "DONE" || task.status === "COMPLETED") {
                loggedHours = Math.max(1, estimatedHours + variance);
            } 
            // Nếu IN_PROGRESS hoặc INREVIEW, có thể đã log 1 phần
            else if (task.status === "IN_PROGRESS" || task.status === "INREVIEW") {
                loggedHours = Math.max(0, Math.floor(estimatedHours / 2) + variance);
            }
            // TODO thì chưa làm
            else {
                loggedHours = 0;
            }

            task.estimatedHours = estimatedHours;
            task.loggedHours = loggedHours;

            await task.save();
            updatedCount++;
        }

        console.log(`Successfully updated ${updatedCount} tasks.`);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
};

seedTasks();
