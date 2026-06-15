require("dotenv").config({ path: "d:/project workspace/my-team-flow-project/backend/.env" });

async function test() {
    console.log("Testing: poolside/laguna-m.1:free");
    try {
        const startTime = Date.now();
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "poolside/laguna-m.1:free",
                messages: [{ role: "user", content: "hi" }]
            }),
            signal: AbortSignal.timeout(15000) // 15s timeout
        });
        const data = await res.text();
        console.log("Status:", res.status);
        console.log("Body:", data.substring(0, 500));
        console.log("Time taken:", Date.now() - startTime, "ms");
    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();
