import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { AstraDBVectorStore } from "@langchain/community/vectorstores/astradb";

import dotenv from "dotenv";
dotenv.config();

const {
    GOOGLE_GENAI_API_KEY,
    ASTRA_DB_APPLICATION_TOKEN,
    GOOGLE_GENAI_EMBEDDING_MODEL,
    ASTRA_DB_ENDPOINT,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_KEYSPACE,
} = process.env;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const toEmbedFilePath = path.join(__dirname, "..", "data", "toEmbed.txt");

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
            dimension: 3072,
            metric: "dot_product",
        },
    },
};

const loadDoc = async () => {
    const txt = await fs.readFile(toEmbedFilePath, "utf8");
    return { text: txt, source: path.basename(toEmbedFilePath) };
};

const splitIntoChunks = async (docText) => {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 300,
        chunkOverlap: 80,
    });
    const docs = await splitter.splitText(docText);
    console.log(`Document split into ${docs.length} chunks.`);
    return docs;
};

const seedAstraDB = async (chunks) => {
    console.log(`Preparing to insert ${chunks.length} chunks into AstraDB...`);
    await AstraDBVectorStore.fromTexts(
        chunks,
        [],
        googleGenAIEmbeddings,
        astraConfig
    );
    console.log("All chunks sent to AstraDB.");
};

const main = async () => {
    const doc = await loadDoc();
    const chunks = await splitIntoChunks(doc.text);
    await seedAstraDB(chunks);
};


main();
