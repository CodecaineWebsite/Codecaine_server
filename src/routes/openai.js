import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/debug", async (req, res) => {
  const { code, question } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "你是個專業的程式除錯助手。" },
        {
          role: "user",
          content: `以下是我寫的程式碼：\n\n${code}\n\n問題是：${question}`,
        },
      ],
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI 回應失敗" });
  }
});

export default router;
