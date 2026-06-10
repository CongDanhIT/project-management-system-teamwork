import mongoose from "mongoose";
import TaskModel from "../models/task.model";
import MemberModel from "../models/member.model";
import { TaskStatusEnum } from "../enums/task.enum";

export const smartAllocationService = {
    async evaluateMembersForTask(workspaceId: string, projectId: string, taskId: string) {
        // 1. Lấy thông tin Task và các Tags (Kỹ năng yêu cầu)
        const task = await TaskModel.findOne({ _id: taskId, workspaceId, projectId, deletedAt: null }).populate("tags");
        if (!task) {
            throw new Error("Không tìm thấy công việc");
        }

        const requiredTagIds = task.tags.map((t: any) => t._id.toString());
        
        // 2. Lấy toàn bộ Member trong Workspace (kèm skillTags và userId)
        // Lọc những member đang active (joined: true)
        const members = await MemberModel.find({ workspaceId, joined: true })
            .populate("userId", "name email profilePicture")
            .populate("skillTags");

        // 3. Tính Workload hiện tại của từng người bằng Aggregation
        const workloads = await TaskModel.aggregate([
            {
                $match: {
                    workspaceId: new mongoose.Types.ObjectId(workspaceId),
                    status: { $in: [TaskStatusEnum.TODO, TaskStatusEnum.IN_PROGRESS] },
                    assignedTo: { $exists: true, $not: {$size: 0} },
                    deletedAt: null
                }
            },
            { $unwind: "$assignedTo" },
            {
                $group: {
                    _id: "$assignedTo",
                    activeTasksCount: { $sum: 1 },
                    totalEstimatedHours: { $sum: { $ifNull: ["$estimatedHours", 2] } } // Mặc định 2h nếu ko có estimated
                }
            }
        ]);

        const workloadMap = new Map();
        workloads.forEach(w => {
            workloadMap.set(w._id.toString(), {
                count: w.activeTasksCount,
                hours: w.totalEstimatedHours
            });
        });

        // 4. Chấm điểm (Scoring)
        const results = members.map(member => {
            let score = 0;
            const matchReasons: string[] = [];
            
            // Xử lý type an toàn do TypeScript có thể phàn nàn về userId chưa populate
            const userObj = member.userId as any;
            const memberUserId = userObj._id ? userObj._id.toString() : userObj.toString();

            // Lọc Role: Nếu hệ thống có Viewer/Guest, ta có thể bổ sung check role tại đây.
            // Tạm thời ta chấm điểm hết.

            // 4.1 Tính điểm Kỹ năng (Skill Match)
            let matchedTagsCount = 0;
            if (member.skillTags && member.skillTags.length > 0) {
                member.skillTags.forEach((skillTag: any) => {
                    // Kiểm tra xem các taskTags bên trong skillTag có chứa tag yêu cầu không
                    if (skillTag.taskTags && skillTag.taskTags.length > 0) {
                        const hasMatch = skillTag.taskTags.some((tId: any) => requiredTagIds.includes(tId.toString()));
                        if (hasMatch) {
                            score += 10;
                            matchedTagsCount++;
                        }
                    } else if (requiredTagIds.includes(skillTag._id.toString())) {
                        // Fallback: Nếu skillTag được gán trực tiếp là 1 TASK tag
                        score += 10;
                        matchedTagsCount++;
                    }
                });
            }

            if (matchedTagsCount > 0) {
                matchReasons.push(`Khớp ${matchedTagsCount} kỹ năng yêu cầu (+${matchedTagsCount * 10}đ)`);
            } else if (requiredTagIds.length > 0) {
                matchReasons.push(`Chưa có kỹ năng phù hợp (0đ)`);
            } else {
                matchReasons.push(`Công việc không yêu cầu kỹ năng cụ thể`);
            }

            // 4.2 Tính điểm Workload (Khối lượng công việc)
            const workload = workloadMap.get(memberUserId) || { count: 0, hours: 0 };
            
            if (workload.hours > 0) {
                const penalty = workload.hours * 1; // -1 điểm cho mỗi giờ
                score -= penalty;
                matchReasons.push(`Đang gánh ${workload.count} công việc (${workload.hours} giờ) (-${penalty}đ)`);
            } else {
                matchReasons.push(`Đang hoàn toàn rảnh rỗi`);
            }

            return {
                memberId: member._id,
                userId: memberUserId,
                name: userObj.name,
                email: userObj.email,
                profilePicture: userObj.profilePicture,
                score,
                matchReasons,
                workload
            };
        });

        // Sắp xếp giảm dần theo điểm
        results.sort((a, b) => b.score - a.score);

        return results.slice(0, 5); // Trả về Top 5
    }
}
