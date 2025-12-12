import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import getKnowledgeBase from "./retrievals.js";
import dotenv from "dotenv";
dotenv.config();

const { OPENAI_API_KEY, OPENAI_CHAT_MODEL } = process.env;

const googleGenAI = new ChatOpenAI({
    model: OPENAI_CHAT_MODEL,
    openAIApiKey: OPENAI_API_KEY,
    temperature: 0,
});

const parser = new StringOutputParser();

const classifyIntentPrompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        `You are a classifier. Classify the user query into ONLY ONE of the below:
    - "POLICY" → general info (returns, warranty, shipping, store hours)
    - "ORDER" → tracking or checking a specific order status
    - "RECOMMENDATION" → find or suggest products based on requirements
    - "NOT_RELEVANT" → If unrelated to e-commerce, or not sure about what is it about
    Respond with just one word: POLICY, ORDER, or RECOMMENDATION.`,
    ],
    [
        "human",
        `
    User Question: {input}
    Previous Conversations: {history}`,
    ],
]);

const extractFiltersPrompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        `
    Extract product filtering parameters from the query. 
    Return RAW JSON ONLY with keys:


    "category": "string | null",
    "brand": "string | null",
    "price_max": number | null,
    "price_min": number | null,
    "keywords": [string]


    Always return valid JSON. No explanations.`,
    ],
    ["human", `{input}`],
]);

const responsePrompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        `
        You are **Bag**, a friendly and concise e-commerce chatbot. You always answer based on the available Knowledge Base and Previous Messages.

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

        Only respond with the final answer. Do not mention the rules or the Knowledge Base explicitly and if you feels like you cant handle the request with the given data say i cant answer it and say you can get customer care from with bolded **support@bag.com**.
  `,
    ],
    [
        "human",
        `
        **Knowledge Base:** {data}

        **Previous Messages:** {history}

        **User Question:** {input}
  `,
    ],
]);

const classifyIntentChain = classifyIntentPrompt.pipe(googleGenAI).pipe(parser);
const extractFiltersChain = extractFiltersPrompt.pipe(googleGenAI).pipe(parser);
const responseChain = responsePrompt.pipe(googleGenAI).pipe(parser);

const ORDER_DATABASE = {
    5501: { status: "Shipped", expected: "3-5 days", items: ["Phone Case"] },
    5502: { status: "Processing", expected: "2 days", items: ["Laptop"] },
    5503: { status: "Delivered", expected: "N/A", items: ["Smartwatch"] },
};

const extractOrderId = (text) => {
    const match = text.match(/#?(\d{4,10})/);
    return match ? match[1] : null;
};

const fetchProducts = async (filters) => {
    console.log("Mock product search:", filters);
    return [
        { name: "ASUS Gaming Laptop", price: 1150 },
        { name: "ASUS TUF Book", price: 980 },
    ];
};

const llmStream = async (messages) => {
    const historyMessages = messages.slice(0, -1);
    const input = messages[messages.length - 1].text;

    const history = historyMessages
        .map((m, i) => `${i}. ${m.role}: ${m.text}`)
        .join("\n");

    const intent = ( await classifyIntentChain.invoke({ input, history }) ).trim();
    console.log("Intent:", intent);

    let data = null;

    //* Classifications
    if (intent === "POLICY") {
        const kb = await getKnowledgeBase(input);
        data = kb.length
            ? kb.map((x) => x.pageContent)
            : "Knowledge base is empty";
    }

    else if (intent === "ORDER") {
        const orderId = extractOrderId(input);
        if (!orderId) {
            console.log("No order id");
            data = `Missing Order ID. Please provide your order number like "#5501".`;
        } else {
            console.log(parseInt(orderId));
            data =
                ORDER_DATABASE[parseInt(orderId)] ||
                `No order found for ID #${orderId}`;
        }
    }

    else if (intent === "RECOMMENDATION") {
        const filtersRaw = await extractFiltersChain.invoke({ input });
        let filters = {};
        try {
            filters = JSON.parse(filtersRaw);
        } catch {
            filters = {
                category: null,
                brand: null,
                price_max: null,
                keywords: [],
            };
        }
        data = await fetchProducts(filters);
    }


    console.log(`${input}\n${history}\n${JSON.stringify(data)}\n`);

    const response = await responseChain.stream({
        input,
        history,
        data: JSON.stringify(data),
    });

    return response;
};

export default llmStream;
