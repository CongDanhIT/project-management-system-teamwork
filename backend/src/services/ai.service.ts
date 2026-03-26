import Groq from "groq-sdk";
import { env } from "../config/env";
import logger from "../utils/logger";

// Khởi tạo Groq client
const getGroqClient = () => {
    const apiKey = env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("GROQ_API_KEY chưa được cấu hình trong file .env");
    }
    return new Groq({ apiKey });
};

// Sử dụng Llama 3.3 70B - Model mạnh mẽ nhất hiện có trên Groq free tier
const MODEL_NAME = "llama-3.3-70b-versatile";

/**
 * [AI Feature 1] Sinh mô tả chi tiết cho một task dựa trên tiêu đề
 */
export const generateTaskDescriptionService = async (title: string): Promise<string> => {
    const groq = getGroqClient();

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
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: MODEL_NAME,
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
    const groq = getGroqClient();

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
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: MODEL_NAME,
            temperature: 0.6,
        });

        const text = completion.choices[0]?.message?.content?.trim() || "";
        const subtasks = text
            .split("\n")
            .map((line) => line.replace(/^[\s\d\.\-\*]+/, "").trim()) // Xóa slug, số, dấu gạch đầu dòng nếu có
            .filter((line) => line.length > 0)
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
    history: { role: "user" | "assistant"; content: string }[],
    projectContext: {
        workspaceName?: string;
        projectName?: string;
        totalTasks?: number;
        doneTasks?: number;
        inProgressTasks?: number;
        overdueTasks?: number;
        memberCount?: number;
    }
): Promise<string> => {
    const groq = getGroqClient();

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

        const completion = await groq.chat.completions.create({
            messages,
            model: MODEL_NAME,
            temperature: 0.7,
            max_tokens: 1024,
        });

        const responseText = completion.choices[0]?.message?.content?.trim() || "";
        logger.info("[AI-Groq] Chat phản hồi thành công", { msg: userMessage.substring(0, 50) });
        return responseText;
    } catch (error: any) {
        logger.error("[AI-Groq] Lỗi trong quá trình chat", { error: error?.message });
        throw new Error("AI gặp sự cố kết nối, vui lòng thử lại sau.");
    }
};
