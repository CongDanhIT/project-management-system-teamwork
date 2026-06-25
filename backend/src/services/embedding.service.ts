import { embed, embedMany } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { env } from '../config/env';
import logger from '../utils/logger';

// Cấu hình Together AI client thông qua OpenAI SDK provider
const togetherProvider = createOpenAI({
    apiKey: env.TOGETHER_API_KEY || '',
    baseURL: 'https://api.together.ai/v1',
});

// Sử dụng mô hình intfloat/multilingual-e5-large-instruct (1024 dimensions, hỗ trợ đa ngôn ngữ)
const EMBEDDING_MODEL = 'intfloat/multilingual-e5-large-instruct';

/**
 * Sinh vector cho một đoạn text
 */
export const generateEmbeddingService = async (text: string): Promise<number[]> => {
    try {
        const { embedding } = await embed({
            model: togetherProvider.embedding(EMBEDDING_MODEL),
            value: text,
        });
        return embedding;
    } catch (error: any) {
        logger.error("[Embedding-Service] Lỗi khi sinh vector cho text", { error: error.message });
        throw new Error("Không thể sinh vector cho đoạn text.");
    }
};

/**
 * Sinh vector cho mảng nhiều đoạn text (Batching)
 */
export const generateManyEmbeddingsService = async (texts: string[]): Promise<number[][]> => {
    if (!texts || texts.length === 0) return [];
    try {
        const { embeddings } = await embedMany({
            model: togetherProvider.embedding(EMBEDDING_MODEL),
            values: texts,
        });
        return embeddings;
    } catch (error: any) {
        logger.error("[Embedding-Service] Lỗi khi sinh vector hàng loạt", { error: error.message });
        throw new Error("Không thể sinh vector hàng loạt.");
    }
};

/**
 * Tạo vector cho Task bằng cách nối chuỗi các thông tin quan trọng
 */
export const embedTaskService = async (task: { title: string; description?: string | null; status: string }): Promise<number[]> => {
    const textToEmbed = `Tiêu đề: ${task.title}\nTrạng thái: ${task.status}\nMô tả: ${task.description || "Không có"}`.trim();
    return await generateEmbeddingService(textToEmbed);
};

/**
 * Tạo vector cho Project bằng cách nối chuỗi các thông tin quan trọng
 */
export const embedProjectService = async (project: { name: string; description?: string | null; status: string }): Promise<number[]> => {
    const textToEmbed = `Dự án: ${project.name}\nTrạng thái: ${project.status}\nMô tả: ${project.description || "Không có"}`.trim();
    return await generateEmbeddingService(textToEmbed);
};
