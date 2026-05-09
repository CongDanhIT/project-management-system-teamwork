/**
 * @file workspace.service.test.ts
 * @description Test thủ công cho workspace.service
 * Chạy: npx ts-node src/mytest/services/workspace.service.test.ts
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { deleteWorkspaceByIdService } from "../../services/workspace.service";
import WorkspaceModel from "../../models/workspace.model";
import UserModel from "../../models/user.model";
import ProjectModel from "../../models/project.model";
import TaskModel from "../../models/task.model";
import MemberModel from "../../models/member.model";
import PhaseModel from "../../models/phase.model";
import TaskCommentModel from "../../models/task-comment.model";
import ActivityLogModel from "../../models/activity-log.model";
import ProjectAssetModel from "../../models/project-asset.model";
import AssetFolderModel from "../../models/asset-folder.model";
import WorkspaceAnalyticsSnapshotModel from "../../models/workspace-analytics-snapshot.model";
import RoleModel from "../../models/role-permission.model";
import { RoleEnum } from "../../enums/role.enum";

// ============================================================
// Tiện ích test đơn giản (không cần framework)
// ============================================================
let passed = 0;
let failed = 0;

function expect(testName: string, condition: boolean): void {
    if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${testName}`);
        failed++;
    }
}

function describe(suiteName: string, fn: () => Promise<void>): void {
    console.log(`\n📦 ${suiteName}`);
    console.log("─".repeat(50));
    fn().then(() => printSummary()).catch(err => {
        console.error("Lỗi:", err);
        failed++;
        printSummary();
    });
}

function printSummary(): void {
    console.log("\n" + "═".repeat(50));
    console.log(`📊 KẾT QUẢ: ${passed} passed | ${failed} failed`);
    console.log("═".repeat(50));
    if (failed > 0) process.exit(1);
    process.exit(0);
}

// ============================================================
// TEST SUITE 1: Test Xóa Workspace (Cascading Delete)
// ============================================================
describe("Cascading Delete Workspace", async () => {
    // Kết nối DB
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("Đã kết nối DB:", process.env.MONGO_URI);

    // 1. Setup dữ liệu
    const owner = new UserModel({ name: "Test Owner", email: `owner-${Date.now()}@test.com`, password: "password" });
    await owner.save();

    const ownerRole = await RoleModel.findOne({ name: RoleEnum.OWNER });

    const workspace = new WorkspaceModel({ name: "Test Workspace", owner: owner._id });
    await workspace.save();

    owner.currentWorkspace = workspace._id as any;
    await owner.save();

    const workspaceId = workspace._id.toString();

    // Member
    const member = new MemberModel({ workspaceId, userId: owner._id, role: ownerRole?._id });
    await member.save();

    // Project
    const project = new ProjectModel({ workspaceId, name: "Test Project", owner: owner._id, createdBy: owner._id });
    await project.save();

    // Phase
    const phase = new PhaseModel({ workspaceId, projectId: project._id, name: "Test Phase", createdBy: owner._id });
    await phase.save();

    // Task
    const task = new TaskModel({ workspaceId, projectId: project._id, title: "Test Task", createdBy: owner._id, taskCode: "TASK-1" });
    await task.save();

    // Comment
    const comment = new TaskCommentModel({ workspaceId, taskId: task._id, userId: owner._id, content: "Test Comment" });
    await comment.save();

    // Activity Log
    const activity = new ActivityLogModel({ workspaceId, userId: owner._id, action: "CREATE_TASK", entityType: "TASK", entityId: task._id, details: { summary: "test" } });
    await activity.save();

    // Asset Folder
    const folder = new AssetFolderModel({ workspaceId, projectId: project._id, name: "Test Folder", createdBy: owner._id });
    await folder.save();

    // Asset
    const asset = new ProjectAssetModel({ workspaceId, projectId: project._id, name: "Test Asset", createdBy: owner._id, fileSize: 100, fileType: "test", fileUrl: "http://test.com", storageKey: "test-key" });
    await asset.save();

    // Snapshot
    const snapshot = new WorkspaceAnalyticsSnapshotModel({ workspaceId, date: new Date(), totalTasks: 1, completedTasks: 0, inProgressTasks: 0, overdueTasks: 0, totalProjects: 1 });
    await snapshot.save();

    console.log("Đã tạo dữ liệu test cho workspace:", workspaceId);

    // 2. Thực hiện xóa Workspace
    await deleteWorkspaceByIdService(workspaceId, owner._id.toString());
    console.log("Đã chạy deleteWorkspaceByIdService");

    // 3. Kiểm tra DB
    const wCount = await WorkspaceModel.countDocuments({ _id: workspace._id });
    expect("Workspace đã bị xóa", wCount === 0);

    const mCount = await MemberModel.countDocuments({ workspaceId });
    expect("Member đã bị xóa", mCount === 0);

    const pCount = await ProjectModel.countDocuments({ workspaceId });
    expect("Project đã bị xóa", pCount === 0);

    const phCount = await PhaseModel.countDocuments({ workspaceId });
    expect("Phase đã bị xóa", phCount === 0);

    const tCount = await TaskModel.countDocuments({ workspaceId });
    expect("Task đã bị xóa", tCount === 0);

    const cCount = await TaskCommentModel.countDocuments({ workspaceId });
    expect("TaskComment đã bị xóa", cCount === 0);

    const aCount = await ActivityLogModel.countDocuments({ workspaceId });
    expect("ActivityLog đã bị xóa", aCount === 0);

    const fCount = await AssetFolderModel.countDocuments({ workspaceId });
    expect("AssetFolder đã bị xóa", fCount === 0);

    const asCount = await ProjectAssetModel.countDocuments({ workspaceId });
    expect("ProjectAsset đã bị xóa", asCount === 0);

    const sCount = await WorkspaceAnalyticsSnapshotModel.countDocuments({ workspaceId });
    expect("WorkspaceAnalyticsSnapshot đã bị xóa", sCount === 0);

    // Cleanup User
    await UserModel.deleteOne({ _id: owner._id });
});
