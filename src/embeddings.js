import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import dotenv from "dotenv";

dotenv.config();

const {GOOGLE_GENAI_API_KEY} = process.env;

const googleGenAI = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: GOOGLE_GENAI_API_KEY,
    temperature: 0,
}); 

const response = await googleGenAI.invoke("Whats Up?");

console.log(response);



