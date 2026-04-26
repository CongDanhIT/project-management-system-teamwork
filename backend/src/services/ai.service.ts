import Groq from "groq-sdk";
import OpenAI from "openai";
import { env } from "../config/env";
import logger from "../utils/logger";

// Các Model IDs định nghĩa sẵn
export const AI_MODELS = {
    GROQ_LLAMA_3_3_70B: "llama-3.3-70b-versatile",
    NVIDIA_DEEPSEEK_V4: "deepseek-ai/deepseek-v4-pro",
};

// Khởi tạo Groq client
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
