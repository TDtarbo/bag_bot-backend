import express from "express";
import cors from "cors";
import "dotenv/config";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";

const app = express();
const { PORT, GOOGLE_API_KEY } = process.env;

app.use(cors());
app.use(express.json());

const google = createGoogleGenerativeAI({
  apiKey: GOOGLE_API_KEY,
});

app.post("/", async (req, res) => {
  const { messages } = req.body;

  if (!messages) return res.status(400).send("Missing messages");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");

  const modelMessages = messages.map((msg) => ({
    role: msg.role,
    content: [{ type: "text", text: msg.text }],
  }));

  console.log(JSON.stringify(modelMessages, null, 2));

  const result = streamText({
    model: google("gemini-2.5-flash"),
    messages: modelMessages,
    system: "You are a e-commerce assistant you name is Bag.",
  });

  for await (const text of result.textStream) {
    res.write(text);
  }

  res.end();
});

app.post("/api/data", (req, res) => {
  const { name, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ error: "Missing name or message" });
  }
  res.status(201).json({ success: true, received: { name, message } });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
