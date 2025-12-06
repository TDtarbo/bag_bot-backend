import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import dotenv from "dotenv";

dotenv.config();
const { GOOGLE_GENAI_API_KEY } = process.env;

const googleGenAI = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: GOOGLE_GENAI_API_KEY,
    temperature: 0,
});

const prompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        `
      Your name is Bag, a friendly and concise e-commerce chatbot. Use the knowledge base to answer customer questions accurately and professionally:
      Rules:
      - Don't greet on every message. first one is enough. make the conversation like a human and a simple language.
      - Always answer politely with clear explanations.
      - Use previous messages (history) for context.
      - if need instruction give them clear and list form.
      - If something is unclear, ask a short follow-up question.
      - always bold the list titles and list elements.
      - if there is nothing relevant information with in the Knowledge Base, respond with "I'm sorry, I don't have that information right now." and if needed, based on the conversation try to guide the user to clear what he/she needs otherwise just sat sorry message.

      
  `,
    ],
    [
        "human",
        `
      Knowledge Base: Best selling product is Iphone 1 and 2. worst selling product is Nokia 1100.
      Previous conversation: {history}
      User question: {input}
  `,
    ],
]);

const parser = new StringOutputParser();

const chain = prompt.pipe(googleGenAI).pipe(parser);

const llmStream = async (messages) => {
    const historyMessages = messages.slice(0, -1);
    const input = messages[messages.length - 1].text;
    const history = historyMessages.map((message, index) => `${index}. ${message.role}: ${message.text}`).join("\n");

    console.log(`\n\n${history}\n\n${input}`);

    const response = await chain.stream({ input: input, history: history });
    return response;
};

export default llmStream;
