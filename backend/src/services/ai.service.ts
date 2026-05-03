import { createGroq } from "@ai-sdk/groq";
import { generateObject, streamObject, generateText } from "ai";
import { z } from "zod";
import Groq from "groq-sdk";
import OpenAI from "openai";
import { env } from "../config/env";
import logger from "../utils/logger";
import mongoose from "mongoose";
import PhaseModel from "../models/phase.model";
import TaskModel from "../models/task.model";
import ProjectModel from "../models/project.model";
import { ActivityActionEnum, ActivityEntityTypeEnum } from "../models/activity-log.model";
import { logActivityService } from "./activity.service";
import { TaskPriorityEnum, TaskStatusEnum } from "../enums/task.enum";

// Các Model IDs định nghĩa sẵn
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

        let prefix = project.name.split(' ').filter(word => word.length > 0)
            .map(word => word[0].toUpperCase())
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
