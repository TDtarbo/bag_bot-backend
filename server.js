import cors from "cors";
import express from "express";

const app = express();

app.use(cors());
app.use(express.json());

const { PORT } = process.env;

import dotenv from "dotenv";
dotenv.config();

import llmStream from "./src/iim.js";

app.post("/chat", async (req, res) => {
    const { messages } = req.body;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
        const stream = await llmStream(messages);

        for await (const chunk of stream) {
            console.log(chunk);
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }

        res.write("data: [DONE]\n\n");
        res.end();
    } catch (err) {
        res.write(`data: ${JSON.stringify(err.message)}\n\n`);
        res.end();
        console.log(err);
    }
});

app.listen(PORT || 3000, () => {
    console.log(`Server is running on port ${PORT || 3000}`);
});
