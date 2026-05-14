import { createGroq } from "@ai-sdk/groq";
import { streamText, generateText, tool } from "ai";
import { z } from "zod";
import mongoose from "mongoose";
import Groq from "groq-sdk";
import OpenAI from "openai";
import { env } from "../config/env";
import logger from "../utils/logger";

// Default Imports cho các Model
import PhaseModel from "../models/phase.model";
import TaskModel from "../models/task.model";
import ProjectModel from "../models/project.model";
import WorkspaceModel from "../models/workspace.model";
import MemberModel from "../models/member.model";

import { logActivityService } from "./activity.service";
import { ActivityActionEnum, ActivityEntityTypeEnum } from "../models/activity-log.model";
import { TaskStatusEnum, TaskPriorityEnum } from "../enums/task.enum";

// Hằng số AI Models
export const AI_MODELS = {
    GROQ_LLAMA_3_3_70B: "llama-3.3-70b-versatile",
    NVIDIA_DEEPSEEK_V4: "deepseek-ai/deepseek-v4-pro",
};

// Cấu hình Vercel AI SDK Provider cho Groq
const groqProvider = createGroq({
    apiKey: env.GROQ_API_KEY,
});

logger.info(`[AI-Init] Groq Provider initialized. Key present: ${!!env.GROQ_API_KEY}`);

// Khởi tạo Groq SDK client (cho các logic cũ dùng chat completion truyền thống)
const getGroqClient = () => {
    const apiKey = env.GROQ_API_KEY;
    if (!apiKey) {
        logger.error("[AI-Service] GROQ_API_KEY không tồn tại trong env");
        throw new Error("GROQ_API_KEY chưa được cấu hình");
    }
    logger.debug("[AI-Service] Đang khởi tạo Groq client với key", { keyPrefix: apiKey.substring(0, 7) });
    return new Groq({ apiKey });
};

// Khởi tạo NVIDIA (OpenAI compatible) client
const getNvidiaClient = () => {
    const apiKey = env.NVIDIA_API_KEY;
    if (!apiKey) {
        logger.error("[AI-Service] NVIDIA_API_KEY không tồn tại trong env");
        throw new Error("NVIDIA_API_KEY chưa được cấu hình");
    }
    logger.debug("[AI-Service] Đang khởi tạo NVIDIA client với key", { keyPrefix: apiKey.substring(0, 7) });
    return new OpenAI({
        apiKey,
        baseURL: "https://integrate.api.nvidia.com/v1",
    });
};

// Hàm factory để lấy client phù hợp
const getAIClient = (modelId: string) => {
    if (modelId === AI_MODELS.NVIDIA_DEEPSEEK_V4) {
        return { client: getNvidiaClient(), type: "openai" as const };
    }
    return { client: getGroqClient(), type: "groq" as const };
};

/**
 * [AI Feature 1] Sinh mô tả chi tiết cho một task dựa trên tiêu đề
 */
export const generateTaskDescriptionService = async (title: string): Promise<string> => {

    const prompt = `
Bạn là một Project Manager chuyên về phát triển phần mềm và quản lý tác vụ.
Nhiệm vụ của bạn là viết một mô tả công việc (Task Description) thực tế cho một công việc cụ thể, không phải mô tả tổng quát của dự án.

Tiêu đề công việc: "${title}"

Yêu cầu về nội dung:
- Tập trung vào các hành động cụ thể cần thực hiện cho riêng công việc này.
- Nêu rõ kết quả cần đạt được (Definition of Done) của task này.
- Trình bày ngắn gọn, súc tích (3-4 câu) bằng tiếng Việt chuyên nghiệp.
- Tuyệt đối KHÔNG bắt đầu bằng các câu như "Mục tiêu của dự án là..." hay "Dự án này sẽ...".
- CHỈ TRẢ VỀ NỘI DUNG MÔ TẢ, không được thêm bất kỳ lời dẫn hay ghi chú nào ("Đây là mô tả...", "Chúc bạn...").
`;

    try {
        const completion = await getGroqClient().chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: AI_MODELS.GROQ_LLAMA_3_3_70B,
            temperature: 0.7,
            max_tokens: 500,
        });

        const text = completion.choices[0]?.message?.content?.trim() || "";
        logger.info("[AI-Groq] Đã sinh mô tả task thành công", { title });
        return text;
    } catch (error: any) {
        logger.error("[AI-Groq] Lỗi khi sinh mô tả task", { error: error?.message, title });
        throw new Error("AI hiện đang bận, vui lòng thử lại sau.");
    }
};

/**
 * [AI Feature 2] Gợi ý danh sách các subtask cho một task cha
 */
export const suggestSubtasksService = async (parentTitle: string): Promise<string[]> => {

    const prompt = `
Bạn là một Technical Lead. Hãy phân rã công việc sau thành các bước thực hiện (Subtasks) cụ thể:
Tiêu đề công việc chính: "${parentTitle}"

Yêu cầu:
- Đề xuất 4-5 công việc con (subtask) thực tế, hành động cụ thể (Actionable).
- Ngắn gọn (không quá 10 từ mỗi mục).
- Dùng tiếng Việt chuyên ngành chính xác.
- Trả về kết quả CHÍNH XÁC theo định dạng sau (mỗi dòng là 1 subtask, không có ký tự đặc biệt như gạch đầu dòng, không đánh số):
Tên Subtask 1
Tên Subtask 2
Tên Subtask 3
...
`;

    try {
        const completion = await getGroqClient().chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: AI_MODELS.GROQ_LLAMA_3_3_70B,
            temperature: 0.6,
        });

        const text = completion.choices[0]?.message?.content?.trim() || "";
        const subtasks = text
            .split("\n")
            .map((line: string) => line.replace(/^[\s\d\.\-\*]+/, "").trim()) // Xóa slug, số, dấu gạch đầu dòng nếu có
            .filter((line: string) => line.length > 0)
            .slice(0, 5);
        
        logger.info("[AI-Groq] Đã gợi ý subtasks thành công", { parentTitle, count: subtasks.length });
        return subtasks;
    } catch (error: any) {
        logger.error("[AI-Groq] Lỗi khi gợi ý subtasks", { error: error?.message, parentTitle });
        throw new Error("AI hiện đang bận, vui lòng thử lại sau.");
    }
};

/**
 * [AI Feature 3] AI Chat Assistant - chat với context workspace/project
 */
export const chatWithContextService = async (
    userMessage: string,
    history: { role: "user" | "assistant" | "system"; content: string }[],
    projectContext: {
        workspaceName?: string;
        projectName?: string;
        totalTasks?: number;
        doneTasks?: number;
        inProgressTasks?: number;
        overdueTasks?: number;
        memberCount?: number;
    },
    modelId: string = AI_MODELS.GROQ_LLAMA_3_3_70B
): Promise<string> => {
    const { client, type } = getAIClient(modelId);

    // Xây dựng context dự án
    const contextLines: string[] = [];
    if (projectContext.workspaceName) contextLines.push(`- Workspace: ${projectContext.workspaceName}`);
    if (projectContext.projectName) contextLines.push(`- Dự án: ${projectContext.projectName}`);
    if (projectContext.totalTasks !== undefined) contextLines.push(`- Tổng tasks: ${projectContext.totalTasks}`);
    if (projectContext.doneTasks !== undefined) contextLines.push(`- Đã hoàn thành: ${projectContext.doneTasks}`);
    if (projectContext.inProgressTasks !== undefined) contextLines.push(`- Đang làm: ${projectContext.inProgressTasks}`);
    if (projectContext.overdueTasks !== undefined) contextLines.push(`- Quá hạn: ${projectContext.overdueTasks}`);
    if (projectContext.memberCount !== undefined) contextLines.push(`- Thành viên: ${projectContext.memberCount}`);

    const systemPrompt = `Bạn là AI Assistant của ứng dụng TeamFlow. 
Hãy trả lời ngắn gọn, thân thiện bằng tiếng Việt.
Thông tin dự án hiện tại:
${contextLines.length > 0 ? contextLines.join("\n") : "Không có context cụ thể."}
`;

    try {
        const messages: any[] = [
            { role: "system", content: systemPrompt },
            ...history.slice(-10), // Giữ 10 lượt hội thoại cuối
            { role: "user", content: userMessage }
        ];

        let responseText = "";

        if (type === "groq") {
            const completion = await (client as Groq).chat.completions.create({
                messages,
                model: modelId,
                temperature: 0.7,
                max_tokens: 1024,
            });
            responseText = completion.choices[0]?.message?.content?.trim() || "";
        } else {
            const completion = await (client as OpenAI).chat.completions.create({
                messages,
                model: modelId,
                temperature: 1, // DeepSeek thường dùng temp 1
                max_tokens: 4096, // Giới hạn thực tế cho chat thường
            });
            responseText = completion.choices[0]?.message?.content?.trim() || "";
        }

        logger.info("[AI-Service] Chat phản hồi thành công", { provider: type, model: modelId });
        return responseText;
    } catch (error: any) {
        logger.error("[AI-Service] Lỗi trong quá trình chat", { 
            errorMessage: error?.message,
            errorStack: error?.stack,
            errorDetails: error?.response?.data || error
        });
        throw new Error("AI hiện đang gặp sự cố kết nối, vui lòng thử lại sau.");
    }
};

/**
 * [AI Sprint 6] Schema định dạng cấu trúc dự án do AI tạo ra
 */
export const ProjectStructureSchema = z.object({
    phases: z.array(z.object({
        name: z.string().describe("Tên của giai đoạn, ví dụ: 'Phân tích yêu cầu'"),
        description: z.string().describe("Mô tả ngắn gọn về mục tiêu của giai đoạn"),
        color: z.string().describe("Mã màu Hex đại diện cho giai đoạn"),
        tasks: z.array(z.object({
            title: z.string().describe("Tiêu đề công việc cụ thể"),
            priority: z.enum(["LOW", "MEDIUM", "HIGH"]).describe("Mức độ ưu tiên"),
            estimatedHours: z.number().describe("Số giờ dự kiến hoàn thành"),
            description: z.string().describe("Mô tả chi tiết các bước cần thực hiện cho task này")
        }))
    }))
});

export type ProjectStructure = z.infer<typeof ProjectStructureSchema>;

/**
 * [AI Feature - Sprint 6 Part 1] Phân rã dự án thông minh
 * Sử dụng Groq Llama 3.3 70B để tạo cấu trúc Phases & Tasks
 */

export const generateProjectStructureService = async (prompt: string): Promise<ProjectStructure> => {
    try {
        logger.info("[AI-Groq] Đang phân rã dự án với prompt (Text Mode Safe Search)", { prompt });

        const { text } = await generateText({
            model: groqProvider(AI_MODELS.GROQ_LLAMA_3_3_70B),
            prompt: `
Bạn là một chuyên gia quản trị dự án (Senior Project Manager) giàu kinh nghiệm.
Nhiệm vụ của bạn là phân rã yêu cầu sau thành một cấu trúc JSON hợp lệ.

Yêu cầu: "${prompt}"

QUY TẮC TRẢ VỀ:
1. CHỈ TRẢ VỀ DUY NHẤT một khối JSON hợp lệ.
2. KHÔNG giải thích, KHÔNG chào hỏi.
3. Cấu trúc JSON phải khớp chính xác với Schema sau:
{
  "phases": [
    {
      "name": "Tên giai đoạn",
      "description": "Mô tả giai đoạn",
      "color": "#HEXCODE",
      "tasks": [
        {
          "title": "Tên task",
          "priority": "LOW" | "MEDIUM" | "HIGH",
          "estimatedHours": số,
          "description": "Mô tả task"
        }
      ]
    }
  ]
}

Ngôn ngữ: Tiếng Việt.
`,
        });

        // Trích xuất JSON từ text (đề phòng AI bọc trong ```json ... ```)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const cleanJson = jsonMatch ? jsonMatch[0] : text;
        const object = JSON.parse(cleanJson);

        // Chuẩn hóa priority sang uppercase trước khi validate (đề phòng AI quên quy tắc)
        if (object.phases && Array.isArray(object.phases)) {
            object.phases.forEach((p: any) => {
                if (p.tasks && Array.isArray(p.tasks)) {
                    p.tasks.forEach((t: any) => {
                        if (t.priority) t.priority = t.priority.toUpperCase();
                    });
                }
            });
        }

        // Validate lại bằng Zod để đảm bảo an toàn
        const validated = ProjectStructureSchema.parse(object);

        logger.info("[AI-Groq] Đã phân rã dự án thành công (Safe Mode)", { 
            phasesCount: validated.phases.length 
        });

        return validated;
    } catch (error: any) {
        logger.error("[AI-Groq] Lỗi khi phân rã dự án", { 
            message: error?.message,
            stack: error?.stack,
            rawText: error?.text // Nếu có
        });
        throw new Error("AI không thể lập kế hoạch lúc này, vui lòng thử lại sau.");
    }
};

/**
 * [AI Feature - Sprint 6 Part 1] Áp dụng kế hoạch AI vào Database
 * Thực hiện lưu hàng loạt Phase và Task trong một Transaction
 */
export const applyAIProjectPlanService = async (
    workspaceId: string,
    projectId: string,
    userId: string,
    structure: ProjectStructure
) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        logger.info("[AI-Apply] Bắt đầu lưu kế hoạch AI vào Database", { projectId, workspaceId });

        // 1. Lấy thông tin dự án để sinh taskCode
        const project = await ProjectModel.findById(projectId).session(session);
        if (!project) throw new Error("Dự án không tồn tại");

        let prefix = project.name.split(' ').filter((word: string) => word.length > 0)
            .map((word: string) => word[0].toUpperCase())
            .join('').substring(0, 3);
        if (!prefix || !/^[A-Z]+$/.test(prefix)) prefix = 'TSK';

        let topLevelCount = await TaskModel.countDocuments({ projectId, parentId: null }).session(session);

        const createdPhases = [];
        const createdTasks = [];

        // 2. Lặp qua từng Phase trong cấu trúc AI
        for (const phaseData of structure.phases) {
            const phase = new PhaseModel({
                name: phaseData.name,
                description: phaseData.description,
                workspaceId,
                projectId,
                createdBy: userId,
                // Ta có thể lưu màu vào description hoặc mở rộng schema phase sau này nếu cần
            });
            await phase.save({ session });
            createdPhases.push(phase);

            // 3. Lặp qua từng Task trong Phase đó
            for (const taskData of phaseData.tasks) {
                topLevelCount++;
                let taskCode = `${prefix}-${topLevelCount}`;

                // Tránh trùng mã
                let isExists = await TaskModel.exists({ taskCode, projectId }).session(session);
                while(isExists) {
                    topLevelCount++;
                    taskCode = `${prefix}-${topLevelCount}`;
                    isExists = await TaskModel.exists({ taskCode, projectId }).session(session);
                }

                const task = new TaskModel({
                    title: taskData.title,
                    description: taskData.description,
                    priority: taskData.priority,
                    estimatedHours: taskData.estimatedHours,
                    status: TaskStatusEnum.TODO,
                    workspaceId,
                    projectId,
                    phaseId: phase._id,
                    createdBy: userId,
                    taskCode
                });

                await task.save({ session });
                createdTasks.push(task);
            }
        }

        // 4. Ghi Activity Log tổng quát cho hành động này
        await logActivityService({
            workspaceId,
            projectId,
            userId,
            action: ActivityActionEnum.CREATE_PROJECT, // Hoặc định nghĩa thêm action AI_GENERATE_PLAN
            entityType: ActivityEntityTypeEnum.PROJECT,
            entityId: projectId,
            details: {
                summary: `đã sử dụng AI để lập kế hoạch dự án với **${createdPhases.length} giai đoạn** và **${createdTasks.length} công việc**.`
            }
        });

        await session.commitTransaction();
        logger.info("[AI-Apply] Đã áp dụng kế hoạch AI thành công", { 
            phasesCreated: createdPhases.length, 
            tasksCreated: createdTasks.length 
        });

        return {
            phasesCount: createdPhases.length,
            tasksCount: createdTasks.length
        };

    } catch (error: any) {
        await session.abortTransaction();
        logger.error("[AI-Apply] Lỗi khi áp dụng kế hoạch AI", { error: error?.message });
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * [AI V2] Service chính cho Agentic Chat Bot (TeamFlow AI Agent)
 * Hỗ trợ Streaming, Multi-steps (Tool Calling) và context-aware logic.
 */
export const streamAgentChatService = async ({
    messages,
    userId,
    workspaceId,
    projectId,
    modelId = AI_MODELS.GROQ_LLAMA_3_3_70B
}: {
    messages: any[];
    userId: string;
    workspaceId?: string;
    projectId?: string;
    modelId?: string;
}) => {
    logger.info("[AI-Agent] Khởi chạy streamAgentChatService", { userId, workspaceId, projectId, modelId });
    logger.debug("[AI-Agent] Kiểm tra messages", { count: messages?.length, lastMessage: messages?.[messages.length - 1] });

    // 1. Khởi tạo System Prompt cực kỳ chi tiết để AI hiểu vai trò và các Tool hiện có
    const systemPrompt = `BẠN LÀ MỘT AI PROJECT MANAGEMENT AGENT (HỆ THỐNG TEAMFLOW).
Nhiệm vụ: Hỗ trợ người dùng quản lý công việc, dự án, thành viên và các giai đoạn dự án.

BỐI CẢNH HIỆN TẠI:
- User ID: ${userId}
- Workspace ID: ${workspaceId || "Chưa xác định"}
- Project ID: ${projectId || "Chưa chọn dự án cụ thể"}

QUY TẮC VẬN HÀNH QUAN TRỌNG:
1. Bạn có quyền truy cập vào các công cụ (tools) để đọc và ghi dữ liệu vào database.
2. LUÔN LUÔN gọi tool "getProjectPhases" trước khi tạo task nếu người dùng nhắc đến một giai đoạn cụ thể hoặc nếu bạn muốn biết cấu trúc dự án.
3. Nếu người dùng hỏi về danh sách dự án, hãy dùng "getWorkspaceProjects".
4. Khi tạo task ("createTask"), bạn BẮT BUỘC phải cung cấp "phaseId". Nếu chưa biết "phaseId", hãy hỏi người dùng hoặc gọi "getProjectPhases" để tìm ID phù hợp.
5. Trả lời bằng tiếng Việt, văn phong chuyên nghiệp, ngắn gọn nhưng đầy đủ thông tin.
6. Nếu một hành động yêu cầu ID dự án mà hiện tại chưa có, hãy yêu cầu người dùng chọn một dự án trước.

DANH SÁCH CÔNG CỤ CỦA BẠN:
- getWorkspaceProjects: Lấy danh sách dự án trong Workspace.
- getProjectPhases: Lấy danh sách các giai đoạn (ID, tên) của dự án hiện tại.
- getWorkspaceMembers: Lấy danh sách thành viên (ID, tên, email).
- getTasksList: Lấy danh sách công việc (có thể lọc theo phase hoặc status).
- createTask: Tạo công việc mới (yêu cầu phaseId).
- updateTask: Cập nhật thông tin công việc.
`;

    // 2. Định nghĩa bộ Tool (Sử dụng raw object để tương thích tốt nhất với SDK)
    const tools: any = {
        getWorkspaceProjects: {
            description: "Lấy danh sách các dự án trong Workspace hiện tại bao gồm ID, tên và mô tả.",
            parameters: z.object({}).nullable().optional(),
            execute: async () => {
                logger.info("[AI-Tool] getWorkspaceProjects invoked", { workspaceId });
                if (!workspaceId) return { error: "Không tìm thấy Workspace ID trong bối cảnh." };
                const projects = await ProjectModel.find({ workspaceId, deletedAt: null }).select("name description _id").lean();
                logger.info("[AI-Tool] getWorkspaceProjects result", { count: projects?.length });
                return projects;
            }
        },
        getProjectPhases: {
            description: "Lấy danh sách các giai đoạn (phase) của dự án hiện tại. Bạn CẦN gọi tool này để lấy phaseId trước khi tạo task.",
            parameters: z.object({}).nullable().optional(),
            execute: async () => {
                logger.info("[AI-Tool] getProjectPhases invoked", { projectId });
                if (!projectId) return { error: "Bạn cần phải chọn một dự án cụ thể trước khi xem các giai đoạn." };
                const phases = await PhaseModel.find({ projectId, deletedAt: null }).select("name _id color").lean();
                logger.info("[AI-Tool] getProjectPhases result", { count: phases?.length, projectId });
                return phases;
            }
        },
        getWorkspaceMembers: {
            description: "Lấy danh sách thành viên trong Workspace để gán task (assignee).",
            parameters: z.object({}).nullable().optional(),
            execute: async () => {
                logger.info("[AI-Tool] getWorkspaceMembers invoked", { workspaceId });
                if (!workspaceId) return { error: "Không tìm thấy Workspace ID." };
                const members = await MemberModel.find({ workspaceId }).populate("userId", "name email").lean();
                const result = members.map((m: any) => ({ 
                    memberId: m._id, 
                    userId: m.userId?._id, 
                    name: m.userId?.name, 
                    email: m.userId?.email 
                }));
                logger.info("[AI-Tool] getWorkspaceMembers result", { count: result.length });
                return result;
            }
        },
        getTasksList: {
            description: "Lấy danh sách công việc. Hỗ trợ lọc theo phaseId hoặc status.",
            parameters: z.object({ 
                phaseId: z.string().optional().describe("ID giai đoạn để lọc."),
                status: z.string().optional().describe("Trạng thái công việc để lọc (TODO, IN_PROGRESS, DONE...).")
            }).nullable().optional(),
            execute: async ({ phaseId, status }: any) => {
                logger.info("[AI-Tool] getTasksList invoked", { projectId, phaseId, status });
                if (!projectId) return { error: "Cần có Project ID để xem danh sách task." };
                const query: any = { projectId, deletedAt: null };
                if (phaseId) query.phaseId = phaseId;
                if (status) query.status = status;
                const tasks = await TaskModel.find(query).select("title status priority dueDate taskCode").limit(30).lean();
                logger.info("[AI-Tool] getTasksList result", { count: tasks?.length });
                return tasks;
            }
        },
        createTask: {
            description: "Tạo một công việc mới. BẮT BUỘC phải có tiêu đề và phaseId.",
            parameters: z.object({
                title: z.string().describe("Tiêu đề công việc."),
                description: z.string().optional().describe("Mô tả chi tiết."),
                phaseId: z.string().describe("ID của giai đoạn (lấy từ getProjectPhases)."),
                assignedTo: z.string().optional().describe("ID của người được gán (userId)."),
                priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().default("MEDIUM"),
                dueDate: z.string().optional().describe("Hạn chót (ISO date).")
            }),
            execute: async (params: any) => {
                logger.info("[AI-Tool] createTask invoked", { projectId, title: params.title });
                if (!projectId || !workspaceId) return { error: "Thiếu bối cảnh Project/Workspace để tạo task." };
                
                const project = await ProjectModel.findById(projectId);
                if (!project) return { error: "Dự án không tồn tại." };
                
                // Logic sinh taskCode
                const prefix = project.name.split(' ').filter(w => w.length > 0).map((w: string) => w[0]?.toUpperCase()).join('').substring(0, 3) || 'TSK';
                const count = await TaskModel.countDocuments({ projectId, parentId: null });
                const task = await TaskModel.create({ 
                    ...params, 
                    taskCode: `${prefix}-${count + 1}`, 
                    projectId, 
                    workspaceId, 
                    createdBy: userId,
                    assignedTo: params.assignedTo ? [params.assignedTo] : []
                });
                
                await logActivityService({
                    userId, workspaceId, projectId,
                    action: ActivityActionEnum.CREATE_TASK,
                    entityType: ActivityEntityTypeEnum.TASK,
                    entityId: (task._id as any).toString(),
                    details: { summary: `AI Agent created task: **${task.taskCode}**` }
                });
                
                return { success: true, taskCode: task.taskCode, message: `Đã tạo task **${task.taskCode}** thành công.` };
            }
        },
        updateTask: {
            description: "Cập nhật thông tin một công việc hiện có bằng taskId hoặc taskCode.",
            parameters: z.object({
                taskId: z.string().optional().describe("ID của task."),
                taskCode: z.string().optional().describe("Mã công việc (ví dụ: PRO-1)."),
                updates: z.object({
                    title: z.string().optional(),
                    status: z.string().optional(),
                    priority: z.string().optional(),
                    assignedTo: z.string().optional(),
                    phaseId: z.string().optional(),
                    description: z.string().optional()
                })
            }),
            execute: async ({ taskId, taskCode, updates }: any) => {
                logger.info("[AI-Tool] updateTask invoked", { taskId, taskCode, updates });
                const query: any = { workspaceId, deletedAt: null };
                if (taskId) query._id = taskId;
                else if (taskCode) query.taskCode = taskCode;
                else return { error: "Cần cung cấp taskId hoặc taskCode để định danh công việc." };

                const updatePayload = { ...updates };
                if (updates.assignedTo) updatePayload.assignedTo = [updates.assignedTo];

                const task = await TaskModel.findOneAndUpdate(query, { $set: updatePayload }, { new: true });
                if (!task) return { error: "Không tìm thấy công việc để cập nhật." };

                return { success: true, message: `Đã cập nhật công việc **${task.taskCode}** thành công.` };
            }
        }
    };

    // 3. Thực thi streamText với maxSteps để tự động lặp Tool Calling
    return streamText({
        model: groqProvider(modelId || AI_MODELS.GROQ_LLAMA_3_3_70B),
        system: systemPrompt,
        messages,
        tools,
        maxSteps: 10, // Cho phép Agent suy nghĩ và gọi tool tối đa 10 bước
        onStepFinish({ text, toolCalls, toolResults }) {
            logger.info(`[AI-Agent-Step] Hoàn tất bước xử lý`, {
                hasText: !!text,
                toolCallsCount: toolCalls?.length,
                toolResultsCount: toolResults?.length
            });
        },
    });
};

/**
 * [AI Feature - Sprint 6 Part 3] Báo cáo chuyên sâu (Advanced Analytics)
 * Sử dụng Groq Llama 3 70B để phân tích log và đưa ra nhận định.
 */
export const AdvancedInsightsSchema = z.object({
    bottlenecks: z.array(z.string()).describe("Danh sách các điểm nghẽn hoặc vấn đề phát hiện được từ log"),
    velocity_analysis: z.string().describe("Nhận định chung về tốc độ làm việc của team"),
    team_performance: z.array(z.string()).describe("Phân tích chi tiết về đóng góp và hiệu suất của từng thành viên"),
    risk_forecast: z.string().describe("Dự báo các rủi ro tiềm ẩn dựa trên xu hướng hiện tại"),
    recommendations: z.array(z.string()).describe("Các đề xuất hành động cụ thể để cải thiện tình hình")
});

export type AdvancedInsights = z.infer<typeof AdvancedInsightsSchema>;

export const generateAdvancedInsightsService = async (logsData: any[]): Promise<AdvancedInsights> => {
    try {
        logger.info("[AI-Groq] Đang phân tích chuyên sâu log dự án", { logCount: logsData.length });

        if (!logsData || logsData.length === 0) {
            return {
                bottlenecks: ["Không có đủ dữ liệu log để phân tích điểm nghẽn."],
                velocity_analysis: "Dự án mới hoặc chưa có hoạt động nào được ghi nhận.",
                team_performance: ["Chưa có dữ liệu thành viên để đánh giá."],
                risk_forecast: "Dự án hiện tại ổn định do chưa có hoạt động rủi ro nào phát sinh.",
                recommendations: ["Hãy bắt đầu tạo công việc và cập nhật tiến độ để AI có thể theo dõi."]
            };
        }

        const promptStr = JSON.stringify(logsData);

        const { text } = await generateText({
            model: groqProvider(AI_MODELS.GROQ_LLAMA_3_3_70B),
            prompt: `
Bạn là một Chuyên gia Phân tích Dữ liệu Dự án Cao cấp (Senior Project Data Consultant).
Nhiệm vụ: Dựa vào lịch sử hoạt động (Activity Logs) của dự án dưới đây (dạng JSON), hãy thực hiện một cuộc kiểm toán (audit) toàn diện và đưa ra một "Báo cáo phân tích chuyên sâu" cực kỳ chi tiết.

Dữ liệu log:
${promptStr}

YÊU CẦU CHI TIẾT VỀ NỘI DUNG:
1. **Tính cụ thể & Chi tiết**: Không đưa ra những nhận xét chung chung. Mỗi ý phân tích phải là một đoạn văn từ 2-4 câu, giải thích rõ bối cảnh, bằng chứng từ log và hệ quả.
2. **Dẫn chứng**: Chỉ rõ ĐÂU là vấn đề, AI là người liên quan, hoặc MÃ CÔNG VIỆC nào đang bị đình trệ. Ví dụ: thay vì nói "Team làm chậm", hãy nói "Công việc PRO-12 đã bị đổi trạng thái 4 lần trong 2 ngày qua bởi User A, cho thấy sự lúng túng trong khâu thực thi".
3. **Phân tích hiệu suất**: Soi kỹ hoạt động của từng người. Ai đang gánh vác nhiều nhất? Ai đang ít tương tác?
4. **Dự báo rủi ro**: Dựa trên nhịp độ hiện tại, dự án có khả năng trễ hạn không? Có rủi ro về chất lượng hay sự thiếu hụt nhân sự không?

QUY TẮC TRẢ VỀ:
- CHỈ TRẢ VỀ DUY NHẤT một khối JSON hợp lệ.
- KHÔNG giải thích ngoài lề.
- Cấu trúc JSON bắt buộc:
{
  "bottlenecks": [ 
    "Đoạn văn phân tích chi tiết điểm nghẽn 1 kèm dẫn chứng và hệ quả...", 
    "Đoạn văn phân tích chi tiết điểm nghẽn 2 kèm dẫn chứng và hệ quả..." 
  ],
  "velocity_analysis": "Đoạn văn dài phân tích chi tiết về nhịp độ làm việc toàn đội, so sánh với các kỳ trước (nếu có) và xu hướng tiến độ.",
  "team_performance": [
    "Phân tích chi tiết về đóng góp của thành viên A...",
    "Phân tích chi tiết về đóng góp của thành viên B..."
  ],
  "risk_forecast": "Đoạn văn dài dự báo các rủi ro tiềm ẩn trong tương lai và cảnh báo sớm.",
  "recommendations": [ 
    "Đề xuất hành động 1 (giải thích rõ lý do tại sao cần làm vậy)", 
    "Đề xuất hành động 2 (giải thích rõ lý do tại sao cần làm vậy)" 
  ]
}

Ngôn ngữ: Tiếng Việt chuyên nghiệp, sắc bén, mang tính xây dựng cao.
`,
        });

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const cleanJson = jsonMatch ? jsonMatch[0] : text;
        const object = JSON.parse(cleanJson);

        const validated = AdvancedInsightsSchema.parse(object);

        logger.info("[AI-Groq] Đã phân tích chuyên sâu thành công");
        return validated;

    } catch (error: any) {
        logger.error("[AI-Groq] Lỗi khi phân tích chuyên sâu", { 
            message: error?.message,
            stack: error?.stack
        });
        throw new Error("AI không thể phân tích dữ liệu lúc này, vui lòng thử lại sau.");
    }
};

