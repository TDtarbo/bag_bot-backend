import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { DataAPIClient } from "@datastax/astra-db-ts";
import { GoogleGenAI } from "@google/genai";

import "dotenv/config";

const {
  GOOGLE_API_KEY,
  ASTRA_API_KEY,
  ASTRA_URL,
  ASTRA_COLLECTION,
  ASTRA_KEYSPACE,
} = process.env;

const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

const client = new DataAPIClient(ASTRA_API_KEY);
const db = client.db(ASTRA_URL, { keyspace: ASTRA_KEYSPACE });

const main = async () => {
  try {
    await createCollection();
    const collection = await getCollection();
    const policies = loadPolicies();
    const embeddedPolicies = await getEmbeddings(policies);
    await insertData(collection, embeddedPolicies);
  } catch (error) {
    console.error("Error:", error);
  }
};

const insertData = async (collection, data) => {
  console.log(`\nInserting Data into Collection: ${collection.name}...\n`);

  for await (const item of data) {
    const res = await collection.insertOne({
      title: item.title,
      text: item.text,
      category: item.category,
      type: item.type,
      $vector: item.embedding,
    });

    console.log(`Inserted: ${item.title}`, item.embedding);
  }

  console.log(`\nData Insertion Complete.\n`);
};

const getEmbeddings = async (contents) => {
  console.log(`\nGenerating Embeddings...\n`);

  const embeddedContents = await Promise.all(
    contents.map(async (content) => {
      const embed = await getEmbeddingVector(content);
      
      return { ...content, embedding: embed };
    })
  );

  return embeddedContents;
};

const getEmbeddingVector = async (content) => {
  console.log(`Embedding: ${content.title}`);
  let modifiedContent = content;

  switch (content.type) {
    case "policy":
      modifiedContent = `${content.title}\n${content.text}`;
      break;
    case "faq":
      modifiedContent = "FAQ Document: " + content;
      break;
    default:
      modifiedContent = content;
  }

  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: modifiedContent,
  });

  const embeddingVector = response.embeddings[0].values;
  console.log(response.embeddings[0].values.length);
  return embeddingVector;
};

const getCollection = async () => {
  console.log(`\nGetting Collection: ${ASTRA_COLLECTION}...`);
  const collection = await db.collection(ASTRA_COLLECTION);
  console.log(`Collection ready: ${collection.name}`);

  return collection;
};

const createCollection = async () => {
  console.log(`\nLooking For Collection: ${ASTRA_COLLECTION}...`);

  const listCollections = await db.listCollections();
  const collectionExists = listCollections.some(
    (col) => col.name === ASTRA_COLLECTION
  );

  if (collectionExists) {
    console.log("Collection Exists");
    return;
  }

  console.log(`Creating Collection: ${ASTRA_COLLECTION}...`);

  const collection = await db.createCollection(ASTRA_COLLECTION, {
    vector: {
      dimension: 3072,
      metric: "dot_product",
    },
  });

  console.log(`Collection created: ${collection.name}`);
};

const loadPolicies = () => {
  console.log(`\nLoading Policies...\n`);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const raw = fs.readFileSync(path.join(__dirname, "policies.json"), "utf8");
  const policies = JSON.parse(raw);

  for (const policy of policies) {
    console.log(policy.id, policy.title);
  }

  return policies;
};

main();
