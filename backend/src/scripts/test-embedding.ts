import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function testEmbedding(model: string) {
    console.log(`Testing model: ${model}`);
    try {
        const response = await fetch("https://api.together.ai/v1/embeddings", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.TOGETHER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                input: "Hello world"
            })
        });
        const data = await response.json();
        if (data.error) {
            console.error(`❌ Lỗi: ${data.error.message || data.error}`);
        } else if (data.data && data.data[0] && data.data[0].embedding) {
            console.log(`✅ Thành công! Vector size: ${data.data[0].embedding.length}`);
        } else {
            console.log("Kết quả lạ:", data);
        }
    } catch (e: any) {
        console.error("Lỗi fetch:", e.message);
    }
}

async function run() {
    await testEmbedding("intfloat/multilingual-e5-large-instruct");
}

run();
