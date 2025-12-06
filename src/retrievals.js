import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { AstraDBVectorStore } from "@langchain/community/vectorstores/astradb";

import dotenv from "dotenv";
dotenv.config();

const {
    GOOGLE_GENAI_API_KEY,
    GOOGLE_GENAI_EMBEDDING_MODEL,
    ASTRA_DB_APPLICATION_TOKEN,
    ASTRA_DB_ENDPOINT,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_KEYSPACE,
    ASTRA_DB_VECTOR_DIMENSION,
    ASTRA_DB_VECTOR_METRIC,
} = process.env;

const googleGenAIEmbeddings = new GoogleGenerativeAIEmbeddings({
    model: GOOGLE_GENAI_EMBEDDING_MODEL,
    apiKey: GOOGLE_GENAI_API_KEY,
});

const astraConfig = {
    token: ASTRA_DB_APPLICATION_TOKEN,
    endpoint: ASTRA_DB_ENDPOINT,
    collection: ASTRA_DB_COLLECTION,
    keyspace: ASTRA_DB_KEYSPACE,
    collectionOptions: {
        vector: {
            dimension: ASTRA_DB_VECTOR_DIMENSION,
            metric: ASTRA_DB_VECTOR_METRIC,
        },
    },
};

const getKnowledgeBase = async (userPrompt) => {
    const vectorStore = await AstraDBVectorStore.fromExistingIndex(
        googleGenAIEmbeddings,
        astraConfig
    );
    console.log(userPrompt);
    const res = await vectorStore.similaritySearch(userPrompt, 3);
    return res;
};

export default getKnowledgeBase;
