import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, generateText, tool, generateObject } from "ai";
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
import { embedTaskService } from "./embedding.service";
import { ActivityActionEnum, ActivityEntityTypeEnum } from "../models/activity-log.model";
import { TaskStatusEnum, TaskPriorityEnum } from "../enums/task.enum";

// Hằng số AI Models
export const AI_MODELS = {
    GROQ_LLAMA_3_3_70B: "llama-3.3-70b-versatile",
    GROQ_LLAMA_3_1_8B: "llama-3.1-8b-instant",
    NVIDIA_DEEPSEEK_V4: "deepseek-ai/deepseek-v4-pro",
    TOGETHER_LLAMA_3_3_70B: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    TOGETHER_GEMMA_4_31B: "google/gemma-4-31B-it",
    // OpenRouter Free Models
    OPENROUTER_GEMMA_4_31B: "google/gemma-4-31b-it:free",
    OPENROUTER_GPT_OSS_120B: "openai/gpt-oss-120b:free",
    OPENROUTER_LLAMA_3_3_70B: "meta-llama/llama-3.3-70b-instruct:free",
    OPENROUTER_QWEN3_80B: "qwen/qwen3-next-80b-a3b-instruct:free",
    OPENROUTER_LAGUNA_M1: "poolside/laguna-m.1:free",
};

// Cấu hình Vercel AI SDK Provider cho Groq
const groqProvider = createGroq({
    apiKey: env.GROQ_API_KEY,
});

// Cấu hình Vercel AI SDK Provider cho Together AI (Tương thích OpenAI API)
const togetherProvider = createOpenAI({
    apiKey: env.TOGETHER_API_KEY || "",
    baseURL: "https://api.together.ai/v1",
});

// Cấu hình Vercel AI SDK Provider cho OpenRouter (Tương thích OpenAI API)
const openRouterProvider = createOpenAI({
    apiKey: env.OPENROUTER_API_KEY || "",
    baseURL: "https://openrouter.ai/api/v1",
    headers: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "TeamFlow AI",
    }
});

// Danh sách các model thuộc OpenRouter để routing tự động
const OPENROUTER_MODEL_IDS = [
    AI_MODELS.OPENROUTER_GEMMA_4_31B,
    AI_MODELS.OPENROUTER_GPT_OSS_120B,
    AI_MODELS.OPENROUTER_LLAMA_3_3_70B,
    AI_MODELS.OPENROUTER_QWEN3_80B,
    AI_MODELS.OPENROUTER_LAGUNA_M1,
];

logger.info(`[AI-Init] Groq Provider initialized. Key present: ${!!env.GROQ_API_KEY}`);
logger.info(`[AI-Init] Together Provider initialized. Key present: ${!!env.TOGETHER_API_KEY}`);
logger.info(`[AI-Init] OpenRouter Provider initialized. Key present: ${!!env.OPENROUTER_API_KEY}`);

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

export const generateProjectStructureService = async (prompt: string, projectId?: string): Promise<ProjectStructure> => {
    try {
        logger.info("[AI-Groq] Đang phân rã dự án với prompt (Text Mode Safe Search)", { prompt, projectId });

        let contextText = "";
        if (projectId) {
            const project = await ProjectModel.findById(projectId).select("name description").lean();
            if (project) {
                const phases = await PhaseModel.find({ projectId, deletedAt: null }).select("name").lean();
                const phaseNames = phases.map((p: any) => p.name).join(", ");
                contextText = `\nBỐI CẢNH DỰ ÁN HIỆN TẠI:\n- Tên dự án: ${project.name}\n- Mô tả dự án: ${project.description || "Không có"}\n- Các giai đoạn (Phases) đã có sẵn trong dự án này: ${phaseNames || "Chưa có giai đoạn nào"}\n\nLƯU Ý QUAN TRỌNG: \nHãy đọc kỹ BỐI CẢNH DỰ ÁN HIỆN TẠI ở trên. Khi lập kế hoạch mới dựa trên Yêu cầu của người dùng, vui lòng tham khảo các giai đoạn đã có để tránh tạo trùng lặp tên giai đoạn, và ưu tiên tạo các giai đoạn nối tiếp hoặc phù hợp với hiện trạng dự án.\n`;
            }
        }

        const { text } = await generateText({
            model: groqProvider(AI_MODELS.GROQ_LLAMA_3_3_70B) as any,
            prompt: `
Bạn là một chuyên gia quản trị dự án (Senior Project Manager) giàu kinh nghiệm.
Nhiệm vụ của bạn là phân rã yêu cầu sau thành một cấu trúc JSON hợp lệ.
${contextText}
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
                while (isExists) {
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
                
                // [AI-V2-RAG] Sinh vector cho task vừa tạo bằng AI (Chạy ngầm độc lập với transaction)
                embedTaskService({ title: task.title, description: task.description, status: task.status })
                    .then(async (embedding) => {
                        await TaskModel.updateOne({ _id: task._id }, { embedding, embeddingUpdatedAt: new Date() });
                    })
                    .catch(err => console.error("[Embedding-Service] Lỗi khi nhúng Task (AI Plan):", err.message));

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
    phaseId,
    modelId = AI_MODELS.OPENROUTER_GEMMA_4_31B
}: {
    messages: any[];
    userId: string;
    workspaceId?: string;
    projectId?: string;
    phaseId?: string;
    modelId?: string;
}) => {
    logger.info("[AI-Agent] Khởi chạy streamAgentChatService", { userId, workspaceId, projectId, phaseId, modelId });
    logger.debug("[AI-Agent] Kiểm tra messages", { count: messages?.length, lastMessage: messages?.[messages.length - 1] });

    // Tạo bản sao sâu (deep copy) của messages để tránh thay đổi trực tiếp tin nhắn hiển thị ở Frontend
    let processedMessages = JSON.parse(JSON.stringify(messages));

    // Nếu sử dụng Together AI, tự động append System Context và TINH GIẢN chỉ gửi 1 tin nhắn cuối để tránh crash API do lịch sử tin nhắn
    if (modelId === AI_MODELS.TOGETHER_LLAMA_3_3_70B && processedMessages.length > 0) {
        const lastMessage = processedMessages[processedMessages.length - 1];
        if (lastMessage && lastMessage.role === "user") {
            const contextLines: string[] = [];
            if (workspaceId) contextLines.push(`Workspace ID: "${workspaceId}"`);
            if (projectId) contextLines.push(`Project ID: "${projectId}"`);
            if (phaseId) contextLines.push(`Phase ID: "${phaseId}"`);
            if (userId) contextLines.push(`User ID: "${userId}"`);

            if (contextLines.length > 0) {
                lastMessage.content = `${lastMessage.content}\n\n[Bối cảnh hệ thống - Trích xuất các ID này để làm tham số cho các tool tương ứng khi cần thiết:\n${contextLines.join("\n")}]`;
                logger.info("[AI-Agent] Đã append System Context vào user message cho Together AI");
            }
        }
        processedMessages = [lastMessage];
        logger.info("[AI-Agent] Đã cắt giảm lịch sử tin nhắn chỉ giữ lại 1 tin nhắn cuối cho Together AI");
    } else {
        // Đối với Groq và các model khác, ta vẫn append System Context để cả hai đều dùng chung bộ Tool bắt buộc tham số, nhưng vẫn giữ nguyên đầy đủ lịch sử hội thoại!
        if (processedMessages.length > 0) {
            const lastMessage = processedMessages[processedMessages.length - 1];
            if (lastMessage && lastMessage.role === "user") {
                const contextLines: string[] = [];
                if (workspaceId) contextLines.push(`Workspace ID: "${workspaceId}"`);
                if (projectId) contextLines.push(`Project ID: "${projectId}"`);
                if (phaseId) contextLines.push(`Phase ID: "${phaseId}"`);
                if (userId) contextLines.push(`User ID: "${userId}"`);

                if (contextLines.length > 0) {
                    lastMessage.content = `${lastMessage.content}\n\n[Bối cảnh hệ thống - Trích xuất các ID này để làm tham số cho các tool tương ứng khi cần thiết:\n${contextLines.join("\n")}]`;
                    logger.info("[AI-Agent] Đã append System Context vào user message cho Groq");
                }
            }
        }
    }

    // 1. Khởi tạo System Prompt cực kỳ chi tiết để AI hiểu vai trò và các Tool hiện có
    const systemPrompt = `BẠN LÀ MỘT AI PROJECT MANAGEMENT AGENT (HỆ THỐNG TEAMFLOW) PHIÊN BẢN V2.

🌟 LỜI MỞ ĐẦU (GREETING & CAPABILITIES):
Nếu đây là lần đầu người dùng trò chuyện hoặc khi được hỏi về chức năng, hãy chào họ một cách chuyên nghiệp và giới thiệu các khả năng sau:
- 📂 **Quản lý Dự án**: Liệt kê, tìm kiếm và tra cứu các dự án trong Workspace.
- 🏗️ **Cấu trúc Giai đoạn**: Xem danh sách các Phase và tìm kiếm giai đoạn theo tên.
- 👥 **Quản lý Thành viên**: Tra cứu thông tin người dùng để gán việc.
- 📋 **Quản lý Công việc**: Liệt kê, tìm kiếm công việc theo tên, tạo mới và cập nhật task trực tiếp.
- 🧠 **Hỏi đáp Tri thức (RAG)**: Tìm kiếm các task dựa trên ngữ nghĩa và mức độ liên quan bằng AI Semantic Search.
- 📈 **Báo cáo Tiến độ**: Cung cấp báo cáo tiến độ dự án chi tiết, chỉ ra các điểm nóng quá hạn và tình hình phân tải công việc của thành viên.

BỐI CẢNH HIỆN TẠI:
- User ID: ${userId}
- Workspace ID: ${workspaceId || "Chưa xác định"}
- Project ID: ${projectId || "Chưa chọn dự án cụ thể"}
- Phase ID (Giai đoạn hiện tại): ${phaseId || "Chưa chọn giai đoạn cụ thể"}

⚠️ QUY TẮC XỬ LÝ LỖI & THIẾU THÔNG TIN (ERROR HANDLING):
1. Nếu người dùng yêu cầu một chức năng mà bộ Tools hiện tại không hỗ trợ (ví dụ: xóa dự án, thay đổi mật khẩu): Hãy lịch sự thông báo rằng "Tính năng này hiện chưa được hỗ trợ thông qua AI Agent, vui lòng thực hiện trực tiếp trong phần cài đặt".
2. Nếu người dùng thiếu thông tin đầu vào bắt buộc (ví dụ: yêu cầu tạo task nhưng không nói tiêu đề): Hãy yêu cầu họ cung cấp thông tin đó một cách rõ ràng.
3. Nếu chưa có Workspace hoặc Project ID trong bối cảnh: LUÔN LUÔN nhắc người dùng "Bạn cần chọn một Dự án cụ thể trước khi thực hiện hành động này".
4. Đối với các yêu cầu cập nhật (Update) hoặc tra cứu:
   - Nếu người dùng cung cấp **MÃ công việc / mã task** trực tiếp (ví dụ: "M-14", "TSK-5", "task M-14"): Bạn **BẮT BUỘC gọi trực tiếp** tool "updateTask" (hoặc "getTasksList" để tra cứu) bằng cách truyền mã đó vào tham số "taskCode" của tool. **TUYỆT ĐỐI KHÔNG** được gọi tool tìm kiếm "searchTasksByName" trước để tránh lãng phí bước xử lý (redundant tool calls).
   - Nếu người dùng ám chỉ **các công việc vừa đề cập trong ngữ cảnh trò chuyện** (ví dụ: "những task đó", "tụi nó", "các task trên"): Bạn **BẮT BUỘC lấy lại mã công việc (taskCode)** từ lịch sử trò chuyện và gọi trực tiếp 'updateTask'. **TUYỆT ĐỐI KHÔNG** được gọi tool tìm kiếm 'searchTasksByName'.
   - Nếu người dùng chỉ cung cấp **TÊN công việc** bằng chữ (ví dụ: "cập nhật task Viết Unit Test", "tìm task Fix bug màn hình Home") mà không có mã cụ thể và không nằm trong lịch sử ngay trước đó: Lúc này mới gọi tool "searchTasksByName" để tìm kiếm lấy "taskCode" hoặc "taskId" trước, sau đó mới thực hiện cập nhật.
5. Nếu sau khi gọi các công cụ tìm kiếm mà vẫn không tìm thấy thông tin hoặc có nhiều kết quả trùng tên gây mơ hồ: Báo lại cho người dùng để yêu cầu làm rõ, tuyệt đối KHÔNG được tự ý đoán bừa ID hoặc nhập thiếu thông tin gây ra lỗi dữ liệu ma (Data integrity).

[SCOPE RESOLUTION - PHÂN GIẢI PHẠM VI TÌM KIẾM]:
Khi người dùng yêu cầu tìm kiếm, liệt kê hoặc thống kê (Task/Project), bạn PHẢI phân tích ngữ nghĩa để xác định phạm vi:
- Ngữ nghĩa "Phase này/Giai đoạn này/Hiện tại/Vị trí này": Bắt buộc truyền tham số 'targetPhaseId' bằng Phase ID từ BỐI CẢNH HIỆN TẠI.
- Ngữ nghĩa "Toàn bộ dự án/Tất cả các phase": Bắt buộc truyền tham số 'targetProjectId' bằng Project ID từ BỐI CẢNH HIỆN TẠI, và TUYỆT ĐỐI BỎ TRỐNG 'targetPhaseId'.
- Ngữ nghĩa "Toàn bộ hệ thống/Tất cả dự án/Toàn bộ workspace": BỎ TRỐNG cả 'targetProjectId' và 'targetPhaseId' để quét toàn bộ (tuy nhiên RAG Vector Search chỉ hỗ trợ quét trong 1 dự án).
- Ngữ nghĩa nhắc đến một Dự án/Phase cụ thể (VD: "Phase 1", "Dự án Thiết kế"): Gọi tool tìm kiếm tương ứng để lấy ID, sau đó truyền vào 'targetProjectId' hoặc 'targetPhaseId'.
- LƯU Ý: Việc phân giải Scope CHỈ LÀ BỔ SUNG. Các tham số BẮT BUỘC của tool (như tham số 'query' của tool searchKnowledge) VẪN PHẢI ĐƯỢC TRUYỀN đầy đủ.

QUY TẮC VẬN HÀNH:
1. LUÔN LUÔN gọi tool "getProjectPhases" hoặc "searchPhasesByName" trước khi tạo task nếu người dùng nhắc đến một giai đoạn cụ thể mà trong BỐI CẢNH HIỆN TẠI không có Phase ID chuẩn xác.
2. NẾU người dùng yêu cầu tạo công việc (task) mà không nhắc đến giai đoạn cụ thể HOẶC nói "ở phase này", "giai đoạn này": BẮT BUỘC kiểm tra thông tin "Phase ID" trong BỐI CẢNH HIỆN TẠI. Nếu đã có Phase ID, hãy SỬ DỤNG NGAY Phase ID đó để tạo công việc mà KHÔNG ĐƯỢC HỎI LẠI người dùng.
3. LUÔN LUÔN gọi tool "getWorkspaceMembers" để lấy chính xác ID của thành viên (userId) TRƯỚC KHI tạo hoặc gán công việc cho bất kỳ ai. TUYỆT ĐỐI KHÔNG dùng tên người để điền vào trường assignedTo.
4. Trả lời bằng tiếng Việt, văn phong Senior Project Manager.
5. ⚠️ QUAN TRỌNG: KHÔNG ĐƯỢC PHÉP trả về các thẻ XML như <function> hay <tool_call> trong văn bản chat. Tất cả việc gọi hàm phải sử dụng cơ chế Native JSON Tool Calling ngầm của API. Chỉ trả về kết quả bằng ngôn ngữ tự nhiên.
`;

    // 2. Định nghĩa bộ Tool (Sử dụng raw object để tương thích tốt nhất với SDK)
    const tools: any = {
        getWorkspaceProjects: {
            description: "Lấy danh sách các dự án trong Workspace hiện tại bao gồm ID, tên và mô tả.",
            // API của Together AI (Llama 3.3) yêu cầu mọi tool phải có parameters không rỗng.
            // Do đó chúng ta khai báo tham số optional để Together không crash, đồng thời bọc nullable().optional() để an toàn nếu đối số bị null/rỗng.
            parameters: z.object({
                workspaceId: z.string().optional().describe("ID của Workspace hiện tại. Lấy từ phần [Bối cảnh hệ thống] ở tin nhắn cuối cùng.")
            }).nullable().optional(),
            execute: async (args: any) => {
                try {
                    const targetWorkspaceId = args?.workspaceId || workspaceId;
                    logger.info("[AI-Tool] getWorkspaceProjects invoked", { workspaceId: targetWorkspaceId });
                    if (!targetWorkspaceId) return { error: "Không tìm thấy Workspace ID." };
                    const projects = await ProjectModel.find({ workspaceId: targetWorkspaceId, deletedAt: null }).select("name description _id").lean();
                    logger.info("[AI-Tool] getWorkspaceProjects result", { count: projects?.length });
                    return projects;
                } catch (error: any) {
                    logger.error("[AI-Tool] Lỗi trong getWorkspaceProjects", { error: error.message, stack: error.stack });
                    return { error: `Lỗi khi lấy danh sách dự án: ${error.message}` };
                }
            }
        },
        getProjectPhases: {
            description: "Lấy danh sách các giai đoạn (phase) của dự án hiện tại. Bạn CẦN gọi tool này để lấy phaseId trước khi tạo task.",
            parameters: z.object({
                projectId: z.string().optional().describe("ID của dự án hiện tại. Lấy từ phần [Bối cảnh hệ thống] ở tin nhắn cuối cùng.")
            }).nullable().optional(),
            execute: async (args: any) => {
                try {
                    const targetProjectId = args?.projectId || projectId;
                    logger.info("[AI-Tool] getProjectPhases invoked", { projectId: targetProjectId });
                    if (!targetProjectId) return { error: "Không tìm thấy Project ID." };
                    const phases = await PhaseModel.find({ projectId: targetProjectId, deletedAt: null }).select("name _id color").lean();
                    logger.info("[AI-Tool] getProjectPhases result", { count: phases?.length, projectId: targetProjectId });
                    return phases;
                } catch (error: any) {
                    logger.error("[AI-Tool] Lỗi trong getProjectPhases", { error: error.message, stack: error.stack });
                    return { error: `Lỗi khi lấy danh sách giai đoạn: ${error.message}` };
                }
            }
        },
        getWorkspaceMembers: {
            description: "Lấy danh sách thành viên trong Workspace để gán task (assignee).",
            parameters: z.object({
                workspaceId: z.string().optional().describe("ID của Workspace hiện tại. Lấy từ phần [Bối cảnh hệ thống] ở tin nhắn cuối cùng.")
            }).nullable().optional(),
            execute: async (args: any) => {
                try {
                    const targetWorkspaceId = args?.workspaceId || workspaceId;
                    logger.info("[AI-Tool] getWorkspaceMembers invoked", { workspaceId: targetWorkspaceId });
                    if (!targetWorkspaceId) return { error: "Không tìm thấy Workspace ID." };
                    const members = await MemberModel.find({ workspaceId: targetWorkspaceId, joined: { $ne: false } }).populate("userId", "name email").lean();
                    const result = members.map((m: any) => ({
                        memberId: m._id,
                        userId: m.userId?._id,
                        name: m.userId?.name,
                        email: m.userId?.email
                    }));
                    logger.info("[AI-Tool] getWorkspaceMembers result", { count: result.length });
                    return result;
                } catch (error: any) {
                    logger.error("[AI-Tool] Lỗi trong getWorkspaceMembers", { error: error.message, stack: error.stack });
                    return { error: `Lỗi khi lấy danh sách thành viên: ${error.message}` };
                }
            }
        },
        getTasksList: {
            description: "Lấy danh sách công việc. Hỗ trợ lọc linh hoạt theo phaseId, status, người được gán (assignedTo), mã công việc (taskCode), mức độ ưu tiên (priority), tìm kiếm theo tiêu đề (title), hoặc lọc theo khoảng thời gian của hạn chót và ngày tạo. Chỉ cần truyền 1 hoặc nhiều tham số bất kỳ để tìm kiếm.",
            parameters: z.object({
                targetProjectId: z.string().optional().describe("ID dự án cần tìm (nếu bỏ trống sẽ tìm trên toàn workspace)."),
                targetPhaseId: z.string().optional().describe("ID giai đoạn cần tìm (nếu bỏ trống sẽ tìm toàn bộ dự án)."),
                status: z.string().optional().describe("Trạng thái công việc để lọc (TODO, IN_PROGRESS, DONE...)."),
                assignedTo: z.string().optional().describe("ID của thành viên được gán để lọc (userId - lấy từ getWorkspaceMembers)."),
                taskCode: z.union([z.string(), z.array(z.string())]).optional().describe("Mã công việc (VD: 'PROJ-1' hoặc mảng ['PROJ-1', 'PROJ-2']). TUYỆT ĐỐI KHÔNG TRUYỀN OBJECT MongoDB (như $gte)."),
                priority: z.string().optional().describe("Mức độ ưu tiên để lọc (LOW, MEDIUM, HIGH, hoặc 'Cao', 'Thấp', 'Trung bình')."),
                title: z.string().optional().describe("Tiêu đề hoặc từ khóa trong tiêu đề công việc để tìm kiếm mờ (VD: 'API', 'UI')."),
                dueDateFrom: z.string().optional().describe("Hạn chót công việc từ ngày (định dạng YYYY-MM-DD hoặc ISO)."),
                dueDateTo: z.string().optional().describe("Hạn chót công việc đến ngày (định dạng YYYY-MM-DD hoặc ISO)."),
                createdFrom: z.string().optional().describe("Ngày tạo công việc từ ngày (định dạng YYYY-MM-DD hoặc ISO)."),
                createdTo: z.string().optional().describe("Ngày tạo công việc đến ngày (định dạng YYYY-MM-DD hoặc ISO).")
            }),
            execute: async ({
                targetProjectId,
                targetPhaseId,
                status,
                assignedTo,
                taskCode,
                priority,
                title,
                dueDateFrom,
                dueDateTo,
                createdFrom,
                createdTo
            }: any) => {
                try {
                    logger.info("[AI-Tool] getTasksList invoked", {
                        targetProjectId, targetPhaseId, status, assignedTo, taskCode, priority, title,
                        dueDateFrom, dueDateTo, createdFrom, createdTo
                    });
                    
                    const effectiveProjectId = targetProjectId || projectId;
                    const query: any = { deletedAt: null };
                    
                    if (effectiveProjectId) query.projectId = effectiveProjectId;
                    else if (workspaceId) query.workspaceId = workspaceId; // Fallback to workspace scope
                    else return { error: "⚠️ Lỗi ngữ cảnh: Không xác định được Workspace ID hay Project ID." };

                    if (targetPhaseId) query.phaseId = targetPhaseId;

                    if (status) {
                        const s = String(status).toUpperCase().trim();
                        if (["TODO", "IN_PROGRESS", "INREVIEW", "DONE", "COMPLETED"].includes(s)) {
                            query.status = s === "COMPLETED" ? "DONE" : s;
                        } else if (s.includes("ĐANG LÀM") || s.includes("DANG LAM") || s.includes("IN PROGRESS")) {
                            query.status = "IN_PROGRESS";
                        } else if (s.includes("ĐANG DUYỆT") || s.includes("DANG DUYET") || s.includes("REVIEW")) {
                            query.status = "INREVIEW";
                        } else if (s.includes("HOÀN THÀNH") || s.includes("HOAN THANH") || s.includes("XONG")) {
                            query.status = "DONE";
                        } else {
                            query.status = status;
                        }
                    }

                    if (assignedTo) {
                        if (assignedTo.length === 24) query.assignedTo = assignedTo;
                        else return { error: "assignedTo không hợp lệ. Vui lòng gọi getWorkspaceMembers để lấy ID thật." };
                    }

                    if (taskCode) {
                        if (Array.isArray(taskCode)) {
                            query.taskCode = { $in: taskCode.map((c: string) => new RegExp(c, "i")) };
                        } else if (taskCode.includes(",")) {
                            const codes = taskCode.split(",").map((c: string) => c.trim()).filter(Boolean);
                            query.taskCode = { $in: codes.map((c: string) => new RegExp(c, "i")) };
                        } else {
                            query.taskCode = { $regex: taskCode, $options: "i" };
                        }
                    }

                    if (priority) {
                        const p = String(priority).toUpperCase().trim();
                        if (["LOW", "MEDIUM", "HIGH"].includes(p)) {
                            query.priority = p;
                        } else if (p === "THẤP" || p === "THAP") {
                            query.priority = "LOW";
                        } else if (p === "CAO") {
                            query.priority = "HIGH";
                        } else if (p === "TRUNG BÌNH" || p === "TRUNG BINH") {
                            query.priority = "MEDIUM";
                        }
                    }

                    if (title) {
                        query.title = { $regex: title, $options: "i" };
                    }

                    if (dueDateFrom || dueDateTo) {
                        const dateQuery: any = {};
                        if (dueDateFrom) dateQuery.$gte = new Date(dueDateFrom);
                        if (dueDateTo) {
                            const endOfTo = new Date(dueDateTo);
                            endOfTo.setHours(23, 59, 59, 999);
                            dateQuery.$lte = endOfTo;
                        }
                        query.dueDate = dateQuery;
                    }

                    if (createdFrom || createdTo) {
                        const dateQuery: any = {};
                        if (createdFrom) dateQuery.$gte = new Date(createdFrom);
                        if (createdTo) {
                            const endOfTo = new Date(createdTo);
                            endOfTo.setHours(23, 59, 59, 999);
                            dateQuery.$lte = endOfTo;
                        }
                        query.createdAt = dateQuery;
                    }

                    const tasks = await TaskModel.find(query)
                        .select("title status priority dueDate taskCode assignedTo createdAt")
                        .populate("assignedTo", "name")
                        .limit(30)
                        .sort({ updatedAt: -1 })
                        .lean();

                    logger.info("[AI-Tool] getTasksList result", { count: tasks?.length });
                    if (tasks.length === 0) return { message: "Tôi không tìm thấy công việc nào khớp với bộ lọc của bạn." };

                    return tasks;
                } catch (error: any) {
                    logger.error("[AI-Tool] Lỗi trong getTasksList", { error: error.message, stack: error.stack });
                    return { error: `Lỗi khi lấy danh sách công việc: ${error.message}` };
                }
            }
        },
        createTask: {
            description: "Tạo một hoặc nhiều công việc mới. BẮT BUỘC phải truyền danh sách các công việc dưới dạng mảng (tasks). Bạn CÓ THỂ (và NÊN) thiết lập luôn các thuộc tính như người được gán (assignedTo), độ ưu tiên (priority), trạng thái (status), hạn chót... NGAY TRONG LÚC TẠO nếu người dùng có đề cập. KHÔNG CẦN tạo xong rồi mới gọi updateTask.",
            parameters: z.object({
                tasks: z.array(z.object({
                    title: z.string().describe("Tiêu đề công việc."),
                    description: z.string().optional().describe("Mô tả chi tiết."),
                    phaseId: z.string().describe("ID của giai đoạn (lấy từ getProjectPhases HOẶC lấy trực tiếp từ BỐI CẢNH HIỆN TẠI nếu có)."),
                    assignedTo: z.string().optional().describe("ID của người được gán (userId lấy từ getWorkspaceMembers). Tuyệt đối KHÔNG truyền tên người vào đây, BẮT BUỘC phải truyền ObjectId 24 ký tự."),
                    priority: z.string().optional().describe("Mức độ ưu tiên. BẮT BUỘC IN HOA (VD: 'LOW', 'MEDIUM', 'HIGH'). Nếu dùng tiếng Việt hãy tự dịch sang 3 từ này."),
                    status: z.string().optional().describe("Trạng thái công việc. Nhận các giá trị: TODO (Cần làm), IN_PROGRESS (Đang làm), INREVIEW (Đang duyệt), DONE (Hoàn thành)."),
                    startDate: z.string().optional().describe("Ngày bắt đầu (ISO date)."),
                    dueDate: z.string().optional().describe("Hạn chót/Ngày kết thúc (ISO date).")
                })).describe("Danh sách các công việc cần tạo. Luôn truyền dạng mảng kể cả khi chỉ tạo 1 công việc.")
            }),
            execute: async ({ tasks }: { tasks: any[] }) => {
                try {
                    logger.info("[AI-Tool] createTask (batch) invoked", { projectId, count: tasks?.length });

                    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
                        return { error: "Danh sách công việc cần tạo không hợp lệ hoặc rỗng." };
                    }
                    if (!projectId || !workspaceId) return { error: "⚠️ Lỗi ngữ cảnh: Bạn cần chọn một dự án cụ thể trước khi tạo công việc mới." };

                    const project = await ProjectModel.findById(projectId);
                    if (!project) return { error: "Dự án không tồn tại hoặc đã bị xóa." };

                    const prefix = project.name.split(' ').filter(w => w.length > 0).map((w: string) => w[0]?.toUpperCase()).join('').substring(0, 3) || 'TSK';
                    let currentCount = await TaskModel.countDocuments({ projectId, parentId: null });

                    const createdTasksInfo = [];
                    for (const taskData of tasks) {
                        if (!taskData.title) {
                            createdTasksInfo.push({ success: false, error: "Thiếu tiêu đề công việc." });
                            continue;
                        }
                        if (!taskData.phaseId) {
                            createdTasksInfo.push({ success: false, title: taskData.title, error: "Thiếu ID giai đoạn (phaseId)." });
                            continue;
                        }

                        currentCount++;
                        let taskCode = `${prefix}-${currentCount}`;
                        // Tránh trùng mã
                        let isExists = await TaskModel.exists({ taskCode, projectId });
                        while (isExists) {
                            currentCount++;
                            taskCode = `${prefix}-${currentCount}`;
                            isExists = await TaskModel.exists({ taskCode, projectId });
                        }

                        let finalPriority = "MEDIUM";
                        if (taskData.priority) {
                            const p = String(taskData.priority).toUpperCase().trim();
                            if (["LOW", "MEDIUM", "HIGH"].includes(p)) finalPriority = p;
                            else if (p === "THẤP" || p === "THAP") finalPriority = "LOW";
                            else if (p === "CAO") finalPriority = "HIGH";
                        }

                        let finalStatus = "TODO";
                        if (taskData.status) {
                            const s = String(taskData.status).toUpperCase().trim();
                            if (["TODO", "IN_PROGRESS", "INREVIEW", "DONE", "COMPLETED"].includes(s)) finalStatus = s;
                            else if (s.includes("ĐANG LÀM") || s.includes("DANG LAM") || s.includes("IN PROGRESS")) finalStatus = "IN_PROGRESS";
                            else if (s.includes("ĐANG DUYỆT") || s.includes("DANG DUYET") || s.includes("REVIEW")) finalStatus = "INREVIEW";
                            else if (s.includes("HOÀN THÀNH") || s.includes("HOAN THANH") || s.includes("XONG")) finalStatus = "DONE";
                        }

                        if (finalStatus === "COMPLETED") finalStatus = "DONE";

                        const task = await TaskModel.create({
                            title: taskData.title,
                            description: taskData.description,
                            phaseId: taskData.phaseId,
                            priority: finalPriority,
                            status: finalStatus,
                            startDate: taskData.startDate,
                            dueDate: taskData.dueDate,
                            taskCode,
                            projectId,
                            workspaceId,
                            createdBy: userId,
                            assignedTo: taskData.assignedTo ? [taskData.assignedTo] : []
                        });

                        // [AI-V2-RAG] Sinh vector cho task tạo từ Bot
                        embedTaskService({ title: task.title, description: task.description, status: task.status })
                            .then(async (embedding) => {
                                await TaskModel.updateOne({ _id: task._id }, { embedding, embeddingUpdatedAt: new Date() });
                            })
                            .catch(err => console.error("[Embedding-Service] Lỗi khi nhúng Task (AI Bot Create):", err.message));

                        await logActivityService({
                            userId, workspaceId, projectId,
                            action: ActivityActionEnum.CREATE_TASK,
                            entityType: ActivityEntityTypeEnum.TASK,
                            entityId: (task._id as any).toString(),
                            details: { summary: `AI Agent đã tạo công việc mới: **${task.taskCode}**` }
                        });

                        createdTasksInfo.push({ success: true, taskCode: task.taskCode, title: task.title });
                    }

                    const succeeded = createdTasksInfo.filter(t => t.success);
                    const failed = createdTasksInfo.filter(t => !t.success);

                    return {
                        success: true,
                        message: `✅ Đã xử lý tạo hàng loạt: Thành công ${succeeded.length}/${tasks.length} công việc.`,
                        createdTasks: succeeded,
                        errors: failed.length > 0 ? failed : undefined
                    };
                } catch (error: any) {
                    logger.error("[AI-Tool] Lỗi trong createTask (batch)", { error: error.message, stack: error.stack });
                    return { error: `Không thể tạo danh sách công việc do lỗi hệ thống: ${error.message}` };
                }
            }
        },
        updateTask: {
            description: "Cập nhật thông tin cho một hoặc nhiều công việc cùng lúc. TUYỆT ĐỐI KHÔNG GỌI TOOL NÀY NHIỀU LẦN LIÊN TIẾP. BẮT BUỘC gom TẤT CẢ các task cần cập nhật vào chung 1 mảng duy nhất và gọi tool 1 lần duy nhất.",
            parameters: z.object({
                tasks: z.array(z.object({
                    taskId: z.string().optional().describe("ID của task."),
                    taskCode: z.string().optional().describe("Mã công việc (ví dụ: PRO-1)."),
                    title: z.string().optional().describe("Tiêu đề mới."),
                    status: z.string().optional().describe("Trạng thái công việc. Nhận các giá trị: TODO (Cần làm), IN_PROGRESS (Đang làm), INREVIEW (Đang duyệt), DONE (Hoàn thành)."),
                    priority: z.string().optional().describe("Mức độ ưu tiên. BẮT BUỘC IN HOA (VD: 'LOW', 'MEDIUM', 'HIGH')."),
                    assignedTo: z.string().optional().describe("Danh sách ID người được gán (userId). BẮT BUỘC LÀ CHUỖI. Nếu gán nhiều người, hãy truyền các chuỗi ID cách nhau bằng dấu phẩy (vd: 'id1, id2'). TUYỆT ĐỐI KHÔNG DÙNG TÊN."),
                    phaseId: z.string().optional().describe("ID giai đoạn mới."),
                    description: z.string().optional().describe("Mô tả mới."),
                    startDate: z.string().optional().describe("Ngày bắt đầu (ISO date format YYYY-MM-DD)."),
                    dueDate: z.string().optional().describe("Hạn chót/Ngày kết thúc (ISO date format YYYY-MM-DD).")
                })).describe("Danh sách các công việc. GOM TOÀN BỘ TASK VÀO ĐÂY, KHÔNG ĐƯỢC TÁCH RA THÀNH NHIỀU LẦN GỌI TOOL.")
            }),
            execute: async ({ tasks }: { tasks: any[] }) => {
                try {
                    logger.info("[AI-Tool] updateTask (batch) invoked", { workspaceId, count: tasks?.length });

                    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
                        return { error: "Danh sách công việc cần cập nhật không hợp lệ hoặc rỗng." };
                    }

                    const updatedTasksInfo = [];
                    const bulkOps = [];
                    const taskIdentifiers = []; // Keep track of identifiers to fetch later

                    for (const item of tasks) {
                        const { taskId, taskCode, ...updates } = item;
                        if (!taskId && !taskCode) {
                            updatedTasksInfo.push({ success: false, error: "Thiếu thông tin định danh (taskId hoặc taskCode)." });
                            continue;
                        }

                        if (!updates || Object.keys(updates).length === 0) {
                            updatedTasksInfo.push({ success: false, taskCode: taskCode || taskId, error: "Thiếu thông tin cập nhật." });
                            continue;
                        }

                        let actualTaskId = taskId;
                        let actualTaskCode = taskCode;
                        if (actualTaskId && actualTaskId.length !== 24 && !actualTaskCode) {
                            actualTaskCode = actualTaskId;
                            actualTaskId = undefined;
                        }

                        const query: any = { workspaceId, deletedAt: null };
                        if (projectId) query.projectId = projectId;

                        if (actualTaskId && actualTaskId.length === 24) query._id = actualTaskId;
                        else if (actualTaskCode) query.taskCode = actualTaskCode;
                        else {
                            updatedTasksInfo.push({ success: false, error: "Định danh không hợp lệ." });
                            continue;
                        }

                        const updatePayload: any = { ...updates };
                        if (updates.assignedTo) {
                            if (typeof updates.assignedTo === 'string') {
                                const ids = updates.assignedTo.split(",").map((id: string) => id.trim()).filter((id: string) => id.length === 24);
                                if (ids.length > 0) {
                                    updatePayload.assignedTo = ids;
                                } else {
                                    delete updatePayload.assignedTo;
                                }
                            } else if (Array.isArray(updates.assignedTo)) {
                                updatePayload.assignedTo = updates.assignedTo.filter((id: any) => typeof id === 'string' && id.length === 24);
                            } else {
                                delete updatePayload.assignedTo;
                            }
                        }

                        if (updates.priority) {
                            const p = String(updates.priority).toUpperCase().trim();
                            if (["LOW", "MEDIUM", "HIGH"].includes(p)) updatePayload.priority = p;
                            else if (p === "THẤP" || p === "THAP") updatePayload.priority = "LOW";
                            else if (p === "CAO") updatePayload.priority = "HIGH";
                            else delete updatePayload.priority;
                        }

                        if (updates.status) {
                            const s = String(updates.status).toUpperCase().trim();
                            if (["TODO", "IN_PROGRESS", "INREVIEW", "DONE", "COMPLETED"].includes(s)) updatePayload.status = s;
                            else if (s.includes("ĐANG LÀM") || s.includes("DANG LAM") || s.includes("IN PROGRESS")) updatePayload.status = "IN_PROGRESS";
                            else if (s.includes("ĐANG DUYỆT") || s.includes("DANG DUYET") || s.includes("REVIEW")) updatePayload.status = "INREVIEW";
                            else if (s.includes("HOÀN THÀNH") || s.includes("HOAN THANH") || s.includes("XONG")) updatePayload.status = "DONE";
                            else delete updatePayload.status;

                            if (updatePayload.status === "COMPLETED") updatePayload.status = "DONE";
                        }
                        
                        if (updates.startDate) {
                            updatePayload.startDate = new Date(updates.startDate);
                        }
                        
                        if (updates.dueDate) {
                            updatePayload.dueDate = new Date(updates.dueDate);
                        }

                        bulkOps.push({
                            updateOne: {
                                filter: query,
                                update: { $set: updatePayload }
                            }
                        });
                        taskIdentifiers.push(query);
                    }

                    if (bulkOps.length > 0) {
                        const bulkResult = await TaskModel.bulkWrite(bulkOps);
                        logger.info("[AI-Tool] updateTask bulkWrite result", { matchedCount: bulkResult.matchedCount, modifiedCount: bulkResult.modifiedCount });
                        
                        // Lấy lại danh sách các task đã cập nhật để xử lý embedding và trả về kết quả
                        const updatedTasks = await TaskModel.find({ $or: taskIdentifiers }).lean();
                        
                        for (const task of updatedTasks) {
                            updatedTasksInfo.push({ success: true, taskCode: task.taskCode, title: task.title });
                            
                            // [AI-V2-RAG] Cập nhật lại vector cho task (chạy ngầm)
                            embedTaskService({ title: task.title, description: task.description, status: task.status })
                                .then(async (embedding) => {
                                    await TaskModel.updateOne({ _id: task._id }, { embedding, embeddingUpdatedAt: new Date() });
                                })
                                .catch(err => console.error("[Embedding-Service] Lỗi khi cập nhật vector Task (AI Bot Bulk Update):", err.message));
                        }
                    }

                    const succeeded = updatedTasksInfo.filter(t => t.success);
                    const failed = updatedTasksInfo.filter(t => !t.success);

                    return {
                        success: true,
                        message: `✅ Đã xử lý cập nhật hàng loạt: Thành công ${succeeded.length}/${tasks.length} công việc.`,
                        updatedTasks: succeeded,
                        errors: failed.length > 0 ? failed : undefined
                    };
                } catch (error: any) {
                    logger.error("[AI-Tool] Lỗi trong updateTask (batch)", { error: error.message, stack: error.stack });
                    return { error: `Không thể cập nhật danh sách công việc do lỗi hệ thống: ${error.message}` };
                }
            }
        },
        getProjectProgress: {
            description: "Lấy báo cáo tiến độ chi tiết của dự án hiện tại bao gồm tỷ lệ hoàn thành, thời gian còn lại, các công việc trễ hạn và khối lượng công việc của từng thành viên.",
            parameters: z.object({
                projectId: z.string().optional().describe("ID của dự án hiện tại. Lấy từ phần [Bối cảnh hệ thống] ở tin nhắn cuối cùng.")
            }).nullable().optional(),
            execute: async (args: any) => {
                try {
                    const targetProjectId = args?.projectId || projectId;
                    logger.info("[AI-Tool] getProjectProgress invoked", { projectId: targetProjectId });
                    if (!targetProjectId) return { error: "⚠️ Lỗi ngữ cảnh: Không tìm thấy Project ID." };

                    const project = await ProjectModel.findById(targetProjectId);
                    if (!project) return { error: "Dự án không tồn tại hoặc đã bị xóa." };

                    // 1. Tính toán thời gian
                    const now = new Date();
                    let daysRemaining = 0;
                    if (project.endDate) {
                        const diffTime = project.endDate.getTime() - now.getTime();
                        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    }

                    // 2. Lấy danh sách tasks của dự án (loại trừ đã xóa)
                    const tasks = await TaskModel.find({ projectId: targetProjectId, deletedAt: null }).lean();
                    const total = tasks.length;

                    if (total === 0) {
                        return {
                            projectSummary: {
                                name: project.name,
                                status: "ACTIVE",
                                daysRemaining,
                                completionRate: 0,
                                effortBurnRate: 0
                            },
                            taskStats: { total: 0, todo: 0, inProgress: 0, done: 0, overdueCount: 0 },
                            phaseProgress: [],
                            criticalIssues: { overdueTasks: [], highPriorityUnresolved: [] },
                            workloadSummary: []
                        };
                    }

                    // Phân loại task theo trạng thái
                    let todo = 0, inProgress = 0, done = 0, overdueCount = 0;
                    let totalEstimated = 0, totalLogged = 0;
                    const overdueTasks: any[] = [];
                    const highPriorityUnresolved: any[] = [];
                    const workloadMap = new Map<string, { name: string, activeTasksCount: number, overdueTasksCount: number }>();

                    // Lấy thông tin thành viên dự án để map tên
                    const members = await MemberModel.find({ workspaceId, joined: { $ne: false } }).populate("userId", "name").lean();
                    const memberIdToName = new Map<string, string>();
                    members.forEach((m: any) => {
                        if (m.userId) {
                            memberIdToName.set(m._id.toString(), m.userId.name);
                            memberIdToName.set(m.userId._id.toString(), m.userId.name);
                        }
                    });

                    for (const t of tasks) {
                        // Đếm trạng thái
                        if (t.status === TaskStatusEnum.DONE) done++;
                        else if (t.status === TaskStatusEnum.IN_PROGRESS) inProgress++;
                        else todo++;

                        // Đếm giờ
                        totalEstimated += t.estimatedHours || 0;
                        totalLogged += t.loggedHours || 0;

                        // Kiểm tra quá hạn
                        const isOverdue = t.status !== TaskStatusEnum.DONE && t.dueDate && new Date(t.dueDate) < now;
                        if (isOverdue) {
                            overdueCount++;
                            const assigneesNames = (t.assignedTo || []).map((id: any) => memberIdToName.get(id.toString()) || "Chưa gán");
                            overdueTasks.push({
                                taskCode: t.taskCode,
                                title: t.title,
                                dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : "N/A",
                                assignees: assigneesNames
                            });
                        }

                        // Task ưu tiên cao chưa hoàn thành
                        if (t.status !== TaskStatusEnum.DONE && t.priority === TaskPriorityEnum.HIGH) {
                            const assigneesNames = (t.assignedTo || []).map((id: any) => memberIdToName.get(id.toString()) || "Chưa gán");
                            highPriorityUnresolved.push({
                                taskCode: t.taskCode,
                                title: t.title,
                                status: t.status,
                                assignees: assigneesNames
                            });
                        }

                        // Phân bổ workload
                        if (t.status !== TaskStatusEnum.DONE) {
                            const assignees = t.assignedTo || [];
                            for (const assId of assignees) {
                                const assStr = assId.toString();
                                const name = memberIdToName.get(assStr) || "Thành viên ẩn";
                                const current = workloadMap.get(assStr) || { name, activeTasksCount: 0, overdueTasksCount: 0 };
                                current.activeTasksCount++;
                                if (isOverdue) current.overdueTasksCount++;
                                workloadMap.set(assStr, current);
                            }
                        }
                    }

                    // 3. Tiến độ theo Phase
                    const phases = await PhaseModel.find({ projectId, deletedAt: null }).select("name _id").lean();
                    const phaseProgress = [];
                    for (const p of phases) {
                        const phaseTasks = tasks.filter(t => t.phaseId && t.phaseId.toString() === p._id.toString());
                        const pTotal = phaseTasks.length;
                        const pDone = phaseTasks.filter(t => t.status === TaskStatusEnum.DONE).length;
                        phaseProgress.push({
                            phaseName: p.name,
                            completionRate: pTotal > 0 ? Math.round((pDone / pTotal) * 1000) / 10 : 0.0
                        });
                    }

                    const completionRate = Math.round((done / total) * 1000) / 10;
                    const effortBurnRate = totalEstimated > 0 ? Math.round((totalLogged / totalEstimated) * 1000) / 10 : 0.0;

                    return {
                        projectSummary: {
                            name: project.name,
                            status: "ACTIVE",
                            daysRemaining,
                            completionRate,
                            effortBurnRate
                        },
                        taskStats: { total, todo, inProgress, done, overdueCount },
                        phaseProgress,
                        criticalIssues: {
                            overdueTasks: overdueTasks.slice(0, 5),
                            highPriorityUnresolved: highPriorityUnresolved.slice(0, 5)
                        },
                        workloadSummary: Array.from(workloadMap.values())
                    };
                } catch (error: any) {
                    logger.error("[AI-Tool] Lỗi trong getProjectProgress", { error: error.message, stack: error.stack });
                    return { error: `Lỗi khi lấy tiến độ dự án: ${error.message}` };
                }
            }
        },
        searchProjectsByName: {
            description: "Tìm kiếm các dự án trong Workspace theo tên để lấy projectId.",
            parameters: z.object({
                name: z.string().describe("Tên hoặc một phần tên của dự án để tìm kiếm.")
            }),
            execute: async ({ name }: any) => {
                try {
                    logger.info("[AI-Tool] searchProjectsByName invoked", { workspaceId, name });
                    if (!workspaceId) return { error: "Không tìm thấy Workspace ID." };
                    const projects = await ProjectModel.find({
                        workspaceId,
                        name: { $regex: name, $options: "i" },
                        deletedAt: null
                    }).select("name description _id").limit(10).lean();
                    logger.info("[AI-Tool] searchProjectsByName result", { count: projects?.length });
                    return projects;
                } catch (error: any) {
                    logger.error("[AI-Tool] Lỗi trong searchProjectsByName", { error: error.message, stack: error.stack });
                    return { error: `Lỗi khi tìm kiếm dự án: ${error.message}` };
                }
            }
        },
        searchPhasesByName: {
            description: "Tìm kiếm các giai đoạn (phases) trong dự án hiện tại theo tên để lấy phaseId.",
            parameters: z.object({
                name: z.string().describe("Tên hoặc một phần tên của giai đoạn để tìm kiếm.")
            }),
            execute: async ({ name }: any) => {
                try {
                    logger.info("[AI-Tool] searchPhasesByName invoked", { projectId, name });
                    if (!projectId) return { error: "⚠️ Lỗi ngữ cảnh: Bạn cần chọn một dự án cụ thể trước." };
                    const phases = await PhaseModel.find({
                        projectId,
                        name: { $regex: name, $options: "i" },
                        deletedAt: null
                    }).select("name _id color").limit(10).lean();
                    logger.info("[AI-Tool] searchPhasesByName result", { count: phases?.length });
                    return phases;
                } catch (error: any) {
                    logger.error("[AI-Tool] Lỗi trong searchPhasesByName", { error: error.message, stack: error.stack });
                    return { error: `Lỗi khi tìm kiếm giai đoạn: ${error.message}` };
                }
            }
        },
        searchTasksByName: {
            description: "Tìm kiếm các công việc (tasks) theo tên để lấy taskId hoặc taskCode.",
            parameters: z.object({
                title: z.string().optional().describe("Tiêu đề hoặc một phần tiêu đề của công việc để tìm kiếm."),
                name: z.string().optional().describe("Tên công việc để tìm kiếm (tương đương với title)."),
                targetProjectId: z.string().optional().describe("ID dự án cần tìm (nếu bỏ trống sẽ tìm trên toàn workspace)."),
                targetPhaseId: z.string().optional().describe("ID giai đoạn cần tìm (nếu bỏ trống sẽ tìm toàn dự án).")
            }),
            execute: async ({ title, name, targetProjectId, targetPhaseId }: any) => {
                try {
                    const searchStr = title || name;
                    if (!searchStr) return { error: "Vui lòng cung cấp title hoặc name để tìm kiếm." };

                    logger.info("[AI-Tool] searchTasksByName invoked", { targetProjectId, targetPhaseId, searchStr });
                    const effectiveProjectId = targetProjectId || projectId;
                    const query: any = {
                        title: { $regex: searchStr, $options: "i" },
                        deletedAt: null
                    };
                    
                    if (effectiveProjectId) query.projectId = effectiveProjectId;
                    else if (workspaceId) query.workspaceId = workspaceId;
                    else return { error: "⚠️ Lỗi ngữ cảnh: Không có workspaceId hoặc projectId." };
                    
                    if (targetPhaseId) query.phaseId = targetPhaseId;

                    const tasks = await TaskModel.find(query).select("title taskCode status priority assignedTo").populate("assignedTo", "name").limit(15).lean();
                    logger.info("[AI-Tool] searchTasksByName result", { count: tasks?.length });
                    return tasks;
                } catch (error: any) {
                    logger.error("[AI-Tool] Lỗi trong searchTasksByName", { error: error.message, stack: error.stack });
                    return { error: `Lỗi khi tìm kiếm công việc: ${error.message}` };
                }
            }
        },
        searchKnowledge: {
            description: "Sử dụng công nghệ Vector Semantic Search (RAG) để tìm kiếm các công việc (tasks) có ý nghĩa và ngữ cảnh TƯƠNG ĐỒNG với câu hỏi của người dùng. Dùng khi người dùng hỏi các câu hỏi chung chung, tìm kiếm ý tưởng, tìm các vấn đề liên quan, hoặc không nhớ tên chính xác của công việc (ví dụ: 'Các task liên quan đến thiết kế UI?', 'Có task nào bị lỗi database không?'). KHÔNG dùng tool này nếu người dùng đã cho biết mã task (taskCode).",
            parameters: z.object({
                query: z.string().describe("Câu hỏi hoặc ngữ nghĩa cần tìm kiếm (VD: 'thiết kế UI', 'lỗi database')."),
                status: z.string().optional().describe("Trạng thái công việc cần lọc cứng TRƯỚC khi dò Vector (VD: 'TODO', 'DONE'). Chỉ truyền nếu người dùng chủ động nhắc đến trạng thái."),
                targetProjectId: z.string().optional().describe("ID dự án cần tìm."),
                targetPhaseId: z.string().optional().describe("ID giai đoạn cần tìm.")
            }),
            execute: async ({ query, status, targetProjectId, targetPhaseId }: any) => {
                try {
                    const effectiveProjectId = targetProjectId || projectId;
                    logger.info("[AI-Tool] searchKnowledge invoked", { effectiveProjectId, targetPhaseId, query, status });
                    if (!effectiveProjectId) return { error: "⚠️ Không tìm thấy Project ID. Vector Search hiện tại yêu cầu giới hạn trong 1 dự án cụ thể." };

                    // 1. Sinh vector cho câu hỏi (Sử dụng dynamic import tránh circular dependency nếu có)
                    const { generateEmbeddingService } = await import("./embedding.service");
                    const queryVector = await generateEmbeddingService(query);

                    // 2. Tạo filter cứng (Metadata Filtering)
                    const filter: any = { 
                        projectId: new mongoose.Types.ObjectId(effectiveProjectId), 
                        deletedAt: null 
                    };
                    
                    if (status) {
                        const s = String(status).toUpperCase().trim();
                        if (["TODO", "IN_PROGRESS", "INREVIEW", "DONE", "COMPLETED"].includes(s)) {
                            filter.status = s === "COMPLETED" ? "DONE" : s;
                        } else if (s.includes("ĐANG LÀM") || s.includes("DANG LAM") || s.includes("IN PROGRESS")) {
                            filter.status = "IN_PROGRESS";
                        } else if (s.includes("HOÀN THÀNH") || s.includes("HOAN THANH") || s.includes("XONG")) {
                            filter.status = "DONE";
                        }
                    }

                    // 3. Pipeline MongoDB Atlas Vector Search
                    const pipeline: any[] = [
                        {
                            $vectorSearch: {
                                index: "vector_index", // Tên Index phải được tạo trên giao diện MongoDB Atlas
                                path: "embedding",
                                queryVector: queryVector,
                                numCandidates: 100, // Số ứng viên tối đa duyệt qua (càng cao càng chính xác nhưng chậm)
                                limit: targetPhaseId ? 20 : 10, // Lấy nhiều hơn 1 chút nếu lát cắt sau bằng match phase
                                filter: filter
                            }
                        }
                    ];

                    if (targetPhaseId) {
                        pipeline.push({ $match: { phaseId: new mongoose.Types.ObjectId(targetPhaseId) } });
                    }

                    pipeline.push({
                        $project: {
                            title: 1,
                            taskCode: 1,
                            status: 1,
                            priority: 1,
                            description: 1,
                            score: { $meta: "vectorSearchScore" }
                        }
                    });

                    if (targetPhaseId) {
                        pipeline.push({ $limit: 10 });
                    }

                    const tasks = await TaskModel.aggregate(pipeline);

                    logger.info("[AI-Tool] searchKnowledge result", { count: tasks?.length });
                    if (tasks.length === 0) return { message: "Không tìm thấy công việc nào có ngữ nghĩa tương đồng với câu hỏi." };

                    return tasks;
                } catch (error: any) {
                    logger.error("[AI-Tool] Lỗi trong searchKnowledge", { error: error.message, stack: error.stack });
                    return { error: `Lỗi khi tìm kiếm semantic bằng Vector Search: ${error.message}. (Ghi chú cho AI: Nếu lỗi này là do MongoDB Atlas chưa được tạo Index "vector_index", hãy thông báo cho user biết rằng hệ thống Vector DB chưa sẵn sàng và yêu cầu họ tạo Index).` };
                }
            }
        }
    };

    // 3. Quyết định Provider/Model dựa trên modelId
    let modelInstance: any;
    if (modelId === AI_MODELS.TOGETHER_LLAMA_3_3_70B) {
        modelInstance = togetherProvider(modelId);
    } else if (OPENROUTER_MODEL_IDS.includes(modelId)) {
        modelInstance = openRouterProvider(modelId);
        logger.info("[AI-Agent] Sử dụng OpenRouter Provider", { modelId });
    } else {
        modelInstance = groqProvider(modelId || AI_MODELS.GROQ_LLAMA_3_3_70B);
    }

    // 4. Thực thi streamText với maxSteps để tự động lặp Tool Calling
    return streamText({
        model: modelInstance,
        system: systemPrompt,
        messages: processedMessages,
        tools,
        maxSteps: 10, // Cho phép Agent suy nghĩ và gọi tool tối đa 10 bước
        onStepFinish({ text, toolCalls, toolResults }: any) {
            logger.info(`[AI-Agent-Step] Hoàn tất bước xử lý`, {
                hasText: !!text,
                toolCallsCount: toolCalls?.length,
                toolResultsCount: toolResults?.length
            });
        },
        onError({ error }: any) {
            let errorMsg = String(error);
            try {
                if (error instanceof Error) errorMsg = error.message;
                else if (typeof error === 'object') errorMsg = JSON.stringify(error, Object.getOwnPropertyNames(error));
            } catch (e) { }

            logger.error("[AI-Agent-Stream] Lỗi phát sinh trong quá trình stream", {
                error: errorMsg,
                stack: error instanceof Error ? error.stack : undefined
            });
        }
    } as any);
};

/**
 * [AI Feature - Sprint 6 Part 3] Báo cáo chuyên sâu (Advanced Analytics)
 * Sử dụng Groq Llama 3 70B để phân tích log và đưa ra nhận định.
 */
export const AdvancedInsightsSchema = z.object({
    criticalIncidents: z.array(z.string()).describe("Danh sách các sự cố NGHIÊM TRỌNG (EXTREME_ANOMALY) từ log. Nêu rõ mức độ ảnh hưởng của siêu ngoại lệ này. Nếu không có, mảng sẽ rỗng."),
    bottlenecks: z.array(z.string()).describe("Danh sách các điểm nghẽn hoặc vấn đề phát hiện được từ log"),
    velocity_analysis: z.string().describe("Nhận định chung về tốc độ làm việc của team"),
    team_performance: z.array(z.string()).describe("Phân tích chi tiết về đóng góp và hiệu suất của từng thành viên"),
    risk_forecast: z.string().describe("Dự báo các rủi ro tiềm ẩn dựa trên xu hướng hiện tại"),
    recommendations: z.array(z.string()).describe("Các đề xuất hành động cụ thể để cải thiện tình hình"),
    deep_insights: z.string().describe("Góc nhìn chuyên sâu, tự do suy luận của AI về các vấn đề tiềm ẩn, vượt ra ngoài các chỉ số cứng nhắc (Kiến trúc Lai).")
});

export type AdvancedInsights = z.infer<typeof AdvancedInsightsSchema>;

export const generateAdvancedInsightsService = async (logsData: any[], contextData?: any, modelId: string = AI_MODELS.GROQ_LLAMA_3_3_70B): Promise<AdvancedInsights> => {
    try {
        logger.info("[AI-Groq] Đang khởi động quy trình Multi-Agent Self-Reflection cho phân tích chuyên sâu", { logCount: logsData.length, hasContext: !!contextData });

        if (!logsData || logsData.length === 0) {
            return {
                criticalIncidents: [],
                bottlenecks: ["Không có đủ dữ liệu log để phân tích điểm nghẽn."],
                velocity_analysis: "Dự án mới hoặc chưa có hoạt động nào được ghi nhận.",
                team_performance: ["Chưa có dữ liệu thành viên để đánh giá."],
                risk_forecast: "Dự án hiện tại ổn định do chưa có hoạt động rủi ro nào phát sinh.",
                recommendations: ["Hãy bắt đầu tạo công việc và cập nhật tiến độ để AI có thể theo dõi."],
                deep_insights: "Kiến trúc Lai hiện đang ở trạng thái chờ. Hãy hoạt động để AI kích hoạt khả năng suy luận chuyên sâu."
            };
        }

        const promptStr = JSON.stringify(logsData);
        const contextStr = contextData ? `\nTHÔNG TIN BỐI CẢNH DỰ ÁN (BASELINE CONTEXT):\n${JSON.stringify(contextData, null, 2)}\n` : "";

        let modelInstance: any;
        if (OPENROUTER_MODEL_IDS.includes(modelId)) {
            modelInstance = openRouterProvider(modelId);
            logger.info("[AI-Agent] Sử dụng OpenRouter Provider cho phân tích chuyên sâu", { modelId });
        } else if (modelId === AI_MODELS.TOGETHER_LLAMA_3_3_70B || modelId === AI_MODELS.NVIDIA_DEEPSEEK_V4 || modelId === AI_MODELS.TOGETHER_GEMMA_4_31B) {
            modelInstance = togetherProvider.chat(modelId);
            logger.info("[AI-Agent] Sử dụng Together AI Provider cho phân tích chuyên sâu", { modelId });
        } else {
            modelInstance = groqProvider(modelId || AI_MODELS.GROQ_LLAMA_3_3_70B);
        }

        // ==========================================
        // PHASE 1: ANALYZER AGENT (Sinh bản nháp)
        // ==========================================
        logger.info("[AI-Groq] Phase 1: Analyzer Agent đang phân tích thô...");
        const draftResult = await generateText({
            model: modelInstance as any,
            maxTokens: 1200,
            prompt: `
Bạn là một Chuyên gia Phân tích Dữ liệu Dự án Cao cấp (Senior Project Data Consultant).
Nhiệm vụ: Dựa vào thông tin bối cảnh dự án và lịch sử hoạt động (Activity Logs) dưới đây (dạng JSON), hãy thực hiện một cuộc kiểm toán (audit) toàn diện và đưa ra một "Báo cáo phân tích chuyên sâu" cực kỳ chi tiết.
${contextStr}
Dữ liệu log (Lịch sử hoạt động 30 ngày qua):
${promptStr}

YÊU CẦU CHI TIẾT VỀ NỘI DUNG:
1. **Tính cụ thể & Chi tiết**: Không đưa ra những nhận xét chung chung. Mỗi ý phân tích phải là một đoạn văn từ 2-4 câu, giải thích rõ bối cảnh, bằng chứng từ log và hệ quả.
2. **Dẫn chứng**: Chỉ rõ ĐÂU là vấn đề, AI là người liên quan, hoặc MÃ CÔNG VIỆC nào đang bị đình trệ. Ví dụ: thay vì nói "Team làm chậm", hãy nói "Công việc PRO-12 đã bị đổi trạng thái 4 lần trong 2 ngày qua bởi User A, cho thấy sự lúng túng trong khâu thực thi".
3. **Phân tích hiệu suất**: Soi kỹ hoạt động của từng người. Ai đang gánh vác nhiều nhất? Ai đang ít tương tác?
4. **Dự báo rủi ro**: Dựa trên nhịp độ hiện tại, dự án có khả năng trễ hạn không? Có rủi ro về chất lượng hay sự thiếu hụt nhân sự không?
5. **Góc nhìn Chuyên Sâu (Hybrid Architecture)**: LƯU Ý QUAN TRỌNG: Dữ liệu log trên ĐÃ ĐƯỢC LỌC qua thuật toán "Weighted Context Filtering" và "Z-Score Anomaly Detection 2 Vòng". Các log xuất hiện có nghĩa là nó đã lặp lại nhiều lần hoặc mang trọng số rủi ro cao. Đặc biệt, nếu log có \`type: "EXTREME_ANOMALY"\`, đó là một sự cố CỰC KỲ BẤT THƯỜNG (ví dụ do bị sửa/xóa liên tục bởi một nhóm nhỏ) mà thuật toán đã tách ra. BẠN PHẢI CHÚ Ý NGAY LẬP TỨC vào các EXTREME_ANOMALY này và ghi chép chúng vào trường \`criticalIncidents\` để cảnh báo người dùng. Nếu không có EXTREME_ANOMALY, hãy để mảng \`criticalIncidents\` rỗng. Hãy sử dụng không gian \`deep_insights\` để suy luận vượt ra khỏi cấu trúc thông thường, tìm ra các MỐI LIÊN HỆ NGẦM, hoặc CHUẨN ĐOÁN LÕI (Root-cause) mà dữ liệu rời rạc không thể hiện rõ.
6. **Văn phong tự nhiên & Dễ hiểu**: TUYỆT ĐỐI KHÔNG bê nguyên xi các từ khóa lập trình (như \`EXTREME_ANOMALY\`, \`UPDATE_PROJECT\`, \`CREATE_TASK\`, \`zScore\`, \`type\`) vào văn bản. Hãy dịch chúng thành ngôn ngữ quản trị dự án. Ví dụ: thay vì "Sự kiện UPDATE_PROJECT có type EXTREME_ANOMALY với zScore 5.2", hãy viết: "Hệ thống ghi nhận sự thay đổi bất thường về cấu trúc dự án ở mức độ nghiêm trọng...".
7. **Khung thời gian (Timeframe)**: Dữ liệu bạn đang phân tích CHỈ LÀ CỦA 30 NGÀY GẦN NHẤT (1 tháng). TUYỆT ĐỐI KHÔNG được tự ý viết là "trong 2 tháng qua" hay khoảng thời gian khác.

QUY TẮC TRẢ VỀ:
- CHỈ TRẢ VỀ DUY NHẤT một khối JSON hợp lệ.
- KHÔNG giải thích ngoài lề.
- Cấu trúc JSON bắt buộc:
{
  "criticalIncidents": ["..."],
  "bottlenecks": ["..."],
  "velocity_analysis": "...",
  "team_performance": ["..."],
  "risk_forecast": "...",
  "recommendations": ["..."],
  "deep_insights": "..."
}
Ngôn ngữ: Tiếng Việt chuyên nghiệp, sắc bén, mang tính xây dựng cao.
`,
        });

        const draftJsonMatch = draftResult.text.match(/\{[\s\S]*\}/);
        const draftCleanJson = draftJsonMatch ? draftJsonMatch[0] : draftResult.text;

        // ==========================================
        // PHASE 2: CRITIC AGENT (Tự phản biện & Đào sâu)
        // ==========================================
        logger.info("[AI-Groq] Phase 2: Critic Agent đang thực hiện Self-Reflection...");
        const criticPrompt = `
Bạn là một Chuyên gia Kiểm toán Dự án cực kỳ khó tính (Critic Agent) trong hệ thống Multi-Agent Reasoning.
Dưới đây là một BẢN BÁO CÁO NHÁP (Draft JSON) vừa được sinh ra bởi một trợ lý AI cấp thấp dựa trên lịch sử hoạt động của dự án. 
Nhiệm vụ của bạn là:
1. Tự phản biện (Self-Reflection): Tìm ra những nhận xét còn hời hợt, chung chung hoặc chỉ mang tính chất "đếm số liệu" trong bản nháp.
2. Đào sâu nguyên nhân gốc rễ (Root Causes): Đối chiếu bản nháp với Dữ liệu Log gốc để suy luận TẠI SAO các điểm nghẽn lại xảy ra.
3. Viết lại toàn bộ BẢN BÁO CÁO CUỐI CÙNG cho thật sự sắc sảo, uyên thâm và đẳng cấp chuyên gia.

Dữ liệu Log gốc (Đã qua bộ lọc Weighted Context Filtering):
${promptStr}

Bản Báo cáo Nháp (Cần được cải thiện):
${draftCleanJson}

YÊU CẦU ĐẦU RA:
- CHỈ TRẢ VỀ DUY NHẤT một khối JSON hợp lệ theo đúng cấu trúc cũ.
- KHÔNG thêm bất kỳ câu giải thích nào bên ngoài khối JSON.
- Nội dung bên trong JSON phải sắc bén hơn, mang tính chất chẩn đoán chuyên sâu (Diagnostic Analytics) thay vì chỉ thống kê mô tả (Descriptive Analytics). Đảm bảo mảng (array) như bottlenecks hay recommendations có thể tự do mở rộng (N phần tử).
- TUYỆT ĐỐI KHÔNG dùng từ ngữ lập trình (\`EXTREME_ANOMALY\`, \`zScore\`, \`UPDATE_PROJECT\`, v.v.). Phải dùng ngôn ngữ con người (quản trị dự án).
- LUÔN NHỚ khung thời gian phân tích là "trong 30 ngày qua" (1 tháng), tuyệt đối KHÔNG viết "2 tháng qua".

Cấu trúc JSON bắt buộc:
{
  "criticalIncidents": ["..."],
  "bottlenecks": ["..."],
  "velocity_analysis": "...",
  "team_performance": ["..."],
  "risk_forecast": "...",
  "recommendations": ["..."],
  "deep_insights": "..."
}
`;

        const finalResult = await generateText({
            model: modelInstance as any,
            prompt: criticPrompt,
            temperature: 0.7, // Tăng nhẹ để LLM sáng tạo hơn trong việc suy luận
            maxTokens: 1200,
        });

        // Xử lý chuỗi JSON an toàn, loại bỏ các ký tự Markdown (```json) thường gặp ở Deepseek
        let finalCleanJson = finalResult.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const finalJsonMatch = finalCleanJson.match(/\{[\s\S]*\}/);
        if (finalJsonMatch) {
            finalCleanJson = finalJsonMatch[0];
        }
        
        const object = JSON.parse(finalCleanJson);
        const validated = AdvancedInsightsSchema.parse(object);

        logger.info("[AI-Groq] Đã hoàn thành Multi-Agent Self-Reflection thành công");
        return validated;

    } catch (error: any) {
        logger.error("[AI-Groq] Lỗi khi phân tích chuyên sâu (Multi-Agent)", {
            message: error?.message,
            stack: error?.stack
        });
        throw new Error("AI không thể phân tích dữ liệu lúc này, vui lòng thử lại sau.");
    }
};

export const autoTagTaskService = async (taskTitle: string, taskDescription: string, availableTags: { _id: string, name: string }[]): Promise<string[]> => {
    try {
        if (!availableTags || availableTags.length === 0) return [];
        
        const tagsString = availableTags.map(t => `- ${t.name} (ID: ${t._id})`).join("\n");
        const prompt = `Bạn là một chuyên gia phân loại công việc. Nhiệm vụ của bạn là đọc Tiêu đề và Mô tả công việc, sau đó chọn ra các nhãn phù hợp nhất từ danh sách cho sẵn.

Tiêu đề: "${taskTitle}"
Mô tả: "${taskDescription || 'Không có'}"

Danh sách các nhãn hiện có:
${tagsString}

YÊU CẦU BẮT BUỘC:
- Chỉ chọn TỐI ĐA 3 nhãn.
- CHỈ trả về duy nhất một chuỗi JSON hợp lệ, KHÔNG chứa markdown code block, KHÔNG chứa câu chào.
- Định dạng JSON phải chính xác như sau:
{
  "selectedTagIds": ["id1", "id2"]
}
Nếu không có nhãn nào phù hợp, trả về:
{
  "selectedTagIds": []
}`;

        const result = await generateText({
            model: groqProvider(AI_MODELS.GROQ_LLAMA_3_3_70B),
            prompt,
            temperature: 0.1,
        });

        let parsedObject: { selectedTagIds: string[] } = { selectedTagIds: [] };
        try {
            // Cố gắng parse JSON, loại bỏ markdown block nếu có
            const jsonString = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
            parsedObject = JSON.parse(jsonString);
        } catch (parseError) {
            logger.warn(`[AI-AutoTag] Không thể parse JSON từ AI. Raw text: ${result.text}`);
        }

        const selectedTagIds = Array.isArray(parsedObject?.selectedTagIds) ? parsedObject.selectedTagIds : [];

        logger.info(`[AI-AutoTag] Đã chọn tags: ${JSON.stringify(selectedTagIds)}`);
        return selectedTagIds;
    } catch (error: any) {
        logger.error("[AI-Groq] Lỗi khi auto tag", { 
            error: error?.message || "Lỗi không xác định", 
            taskTitle, 
            stack: error?.stack 
        });
        return []; // Fail-safe
    }
};
