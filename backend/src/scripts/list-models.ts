import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function run() {
    try {
        const response = await fetch("https://api.together.ai/v1/models", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${process.env.TOGETHER_API_KEY}`
            }
        });
        const models = await response.json();
        const embeddingModels = models.filter((m: any) => m.type === "embedding");
        console.log("Serverless embedding models:");
        console.log(embeddingModels.map((m: any) => m.id).join("\n"));
    } catch (e: any) {
        console.error("Lỗi fetch:", e.message);
    }
}

run();
