import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import getKnowledgeBase from "./retrievals.js";
import dotenv from "dotenv";

dotenv.config();

const { GOOGLE_GENAI_API_KEY, GOOGLE_GENAI_CHAT_MODEL } = process.env;

const googleGenAI = new ChatGoogleGenerativeAI({
    model: GOOGLE_GENAI_CHAT_MODEL,
    apiKey: GOOGLE_GENAI_API_KEY,
    temperature: 0,
});

const prompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        `
        You are **Bag**, a friendly and concise e-commerce chatbot. You always answer based on the available Knowledge Base.

        ### Rules:
            - Greet **only once** at the beginning. After that, continue the conversation naturally.
            - Use simple and polite human-like language.
            - Use previous conversation context when needed.
            - If you provide steps/instructions, use a **clear, numbered list**.
            - Always **bold titles** and **list items**.
            - If something is unclear, ask **one short follow-up question**.
            - If the user asks something unrelated to e-commerce, politely refuse to answer mentioning that its available in the context of "Bag online marketplace" with bold text.
            - If the Knowledge Base does not contain relevant information, reply:
            **"I'm sorry, I don't have that information right now."**
            You may ask a short clarifying question **only if useful**.

        Only respond with the final answer. Do not mention the rules or the Knowledge Base explicitly.
  `,
    ],
    [
        "human",
        `
        **Knowledge Base:** {knowledgeBase}

        **Previous Messages:** {history}

        **User Question:** {input}
  `,
    ],
]);

const parser = new StringOutputParser();

const chain = prompt.pipe(googleGenAI).pipe(parser);

const llmStream = async (messages) => {
    const historyMessages = messages.slice(0, -1);
    const input = messages[messages.length - 1].text;
    const history = historyMessages
        .map((message, index) => `${index}. ${message.role}: ${message.text}`)
        .join("\n");

    const knowledgeBase = await getKnowledgeBase(input);
    const parsedKnowledgeBase = await Promise.all(
        knowledgeBase.map(async (chunk) => {
            return await parser.p(chunk.pageContent);
        })
    );

    console.log(parsedKnowledgeBase);

    /*     const response = await chain.stream({
        input: input,
        history: history,
        knowledgeBase: knowledgeBase,
    });

    console.log(response);

    return response; */
};

export default llmStream;
