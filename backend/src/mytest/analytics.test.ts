import mongoose from "mongoose";
import TaskModel from "../../models/task.model";
import "dotenv/config";
import { connectDatabase } from "../../config/database.config";

async function run() {
    await connectDatabase();
    
    const sampleTask = await TaskModel.findOne();
    if (!sampleTask) {
        console.log("Không có task nào trong DB.");
        process.exit(0);
    }
    const projectId = sampleTask.projectId.toString();
    console.log(Testing with projectId: );
    
    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setDate(fromDate.getDate() - 30);
    const toDate = now;
    
    const activeFilter: any = {
        projectId,
        deletedAt: null,
        createdAt: { $lte: toDate },
        $or: [
            { status: { $ne: "DONE" } }, 
            { completedAt: { $gte: fromDate } }, 
            { status: "DONE", completedAt: null, updatedAt: { $gte: fromDate } } 
        ]
    };

    console.log("activeFilter", JSON.stringify(activeFilter, null, 2));

    const count = await TaskModel.countDocuments(activeFilter);
    console.log("countDocuments:", count);

    const aggregateActiveFilter = { ...activeFilter, projectId: new mongoose.Types.ObjectId(projectId) };
    
    const filteredPriorityStatsRaw = await TaskModel.aggregate([
        { $match: aggregateActiveFilter },
        { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);
    console.log("filteredPriorityStatsRaw:", filteredPriorityStatsRaw);

    const filteredHoursRaw = await TaskModel.aggregate([
        { $match: aggregateActiveFilter },
        { $group: { _id: null, estimated: { $sum: "$estimatedHours" }, logged: { $sum: "$loggedHours" } } }
    ]);
    console.log("filteredHoursRaw:", filteredHoursRaw);
    
    process.exit(0);
}

run();
