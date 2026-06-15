const { createOpenAI } = require("@ai-sdk/openai");
const { generateText } = require("ai");
require("dotenv").config({ path: "d:/project workspace/my-team-flow-project/backend/.env" });

async function test() {
    try {
        const openRouterProvider = createOpenAI({
            apiKey: process.env.OPENROUTER_API_KEY || "",
            baseURL: "https://openrouter.ai/api/v1",
            headers: {
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "TeamFlow AI",
            }
        });

        console.log("Key length:", process.env.OPENROUTER_API_KEY?.length);

        const result = await generateText({
            model: openRouterProvider("meta-llama/llama-3.3-70b-instruct:free"),
            prompt: "Say hello",
            maxTokens: 2048,
        });

        console.log("Success:", result.text);
    } catch (e) {
        console.error("Error details:", JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
    }
}

test();
