import api from "./api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ProjectAiContext {
  workspaceName?: string;
  projectName?: string;
  totalTasks?: number;
  doneTasks?: number;
  inProgressTasks?: number;
  overdueTasks?: number;
  memberCount?: number;
}

/**
 * [AI Feature 1] Gợi ý mô tả task từ tiêu đề
 */
export const suggestTaskDescription = async (title: string): Promise<string> => {
  const response = await api.post("/ai/suggest-description", { title });
  return response.data.description as string;
};

/**
 * [AI Feature 2] Gợi ý danh sách subtask từ tiêu đề task cha
 */
export const suggestSubtasks = async (parentTitle: string): Promise<string[]> => {
  const response = await api.post("/ai/suggest-subtasks", { parentTitle });
  return response.data.subtasks as string[];
};

/**
 * [AI Feature 3] Gửi tin nhắn đến AI Chat với context project
 */
export const sendAiChatMessage = async (
  message: string,
  history: ChatMessage[],
  context: ProjectAiContext = {}
): Promise<string> => {
  const response = await api.post("/ai/chat", { message, history, context });
  return response.data.reply as string;
};
