# BagBot Backend

A Node.js backend for **Bag**, an AI-powered e-commerce chatbot powered by LangChain, vector embeddings, and large language models.

## Overview

BagBot is an intelligent customer service chatbot that uses retrieval-augmented generation (RAG) to provide contextual answers based on a knowledge base. It processes user queries through a vector database (Astra DB) and generates responses using OpenAI's GPT models (with support for Google's Generative AI).

## Features

- **AI-Powered Chat**: Streaming responses using OpenAI GPT or Google Generative AI
- **Vector Search**: Similarity search through a knowledge base using embeddings
- **RAG Pipeline**: Retrieval-Augmented Generation for context-aware responses
- **Intent Classification**: Multi-step intent classification for better query handling
- **Streaming API**: Real-time server-sent events (SSE) for streaming chat responses
- **CORS Support**: Cross-origin resource sharing enabled for frontend integration

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **LLM Framework**: LangChain
- **Vector Database**: Astra DB (DataStax)
- **Embeddings**: Google Generative AI Embeddings
- **LLM Models**: OpenAI GPT / Google Generative AI
- **Text Processing**: RecursiveCharacterTextSplitter
- **Environment**: dotenv

## Project Structure

```
backend/
├── server.js              # Express server and API endpoints
├── package.json           # Project dependencies
├── data/
│   └── toEmbed.txt       # Knowledge base data to be embedded
└── src/
    ├── llm.js            # LLM chain and response generation logic
    ├── retrievals.js     # Vector store retrieval functions
    └── seeder.js         # Database seeding script
```

## Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- API Keys:
  - OpenAI API Key (or Google Generative AI API Key)
  - Astra DB Application Token
  - Astra DB Endpoint

### Setup Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create a `.env` file** in the project root:
   ```env
   # Server
   PORT=3000

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_CHAT_MODEL=gpt-4o-mini

   # Google Generative AI Configuration (optional)
   GOOGLE_GENAI_API_KEY=your_google_api_key
   GOOGLE_GENAI_CHAT_MODEL=gemini-1.5-flash
   GOOGLE_GENAI_EMBEDDING_MODEL=text-embedding-004

   # Astra DB Configuration
   ASTRA_DB_APPLICATION_TOKEN=your_astra_token
   ASTRA_DB_ENDPOINT=https://your-astra-endpoint
   ASTRA_DB_COLLECTION=documents
   ASTRA_DB_KEYSPACE=default_keyspace
   ASTRA_DB_VECTOR_DIMENSION=3072
   ASTRA_DB_VECTOR_METRIC=dot_product
   ```

## Usage

### Development Server

Start the server in development mode with auto-reload:

```bash
npm run dev
```

The server will run on `http://localhost:3000` (or the port specified in `PORT` env variable).

### Seed the Database

Populate the Astra DB vector store with embeddings from the knowledge base:

```bash
npm run seed
```

This command:
1. Reads text from `data/toEmbed.txt`
2. Splits the text into chunks (300 characters with 80-character overlap)
3. Generates embeddings using Google Generative AI
4. Stores vectors in Astra DB for similarity search

## API Endpoints

### POST `/chat`

Stream AI-generated responses to user messages.

**Request**:
```json
{
  "messages": [
    {
      "role": "user",
      "text": "What are your store hours?"
    }
  ]
}
```

**Response**: Server-Sent Events (SSE) stream
```
data: {"token": "The"}
data: {"token": "store"}
data: {"token": "is"}
...
data: [DONE]
```

## How It Works

### Chat Pipeline

1. **User Input**: Client sends a message with conversation history
2. **Knowledge Retrieval**: `retrievals.js` performs similarity search on the vector database
3. **Intent Classification**: `llm.js` analyzes user intent (intent, entity, action)
4. **Response Generation**: LLM generates a response based on:
   - User query
   - Retrieved knowledge base context
   - Conversation history
   - System prompt guidelines
5. **Streaming Response**: Response is streamed back to the client in real-time


### Key Components

- **`server.js`**: Sets up Express server with CORS and the `/chat` endpoint
- **`retrievals.js`**: Manages vector database connections and similarity search queries
- **`llm.js`**: Implements the multi-turn conversation chain with intent classification
- **`seeder.js`**: Loads knowledge base documents, creates embeddings, and populates the database

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3000) | No |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `OPENAI_CHAT_MODEL` | OpenAI model name | Yes |
| `GOOGLE_GENAI_API_KEY` | Google API key for embeddings | Yes |
| `GOOGLE_GENAI_EMBEDDING_MODEL` | Embedding model name | Yes |
| `ASTRA_DB_APPLICATION_TOKEN` | Astra DB authentication token | Yes |
| `ASTRA_DB_ENDPOINT` | Astra DB API endpoint | Yes |
| `ASTRA_DB_COLLECTION` | Collection name in Astra DB | Yes |
| `ASTRA_DB_KEYSPACE` | Keyspace in Astra DB | Yes |
| `ASTRA_DB_VECTOR_DIMENSION` | Vector dimension (default: 3072) | No |
| `ASTRA_DB_VECTOR_METRIC` | Vector metric type (default: dot_product) | No |

## Development

### Adding New Knowledge

1. Add text content to `data/toEmbed.txt`
2. Run the seeder:
   ```bash
   npm run seed
   ```

### Modifying the Chat Logic

Edit `src/llm.js` to adjust:
- System prompt and behavior
- Intent classification logic
- Response formatting

### Changing Vector Search Parameters

Modify `src/retrievals.js` to adjust:
- Number of similar documents retrieved (currently 3)
- Embedding model
- Vector store configuration

## Error Handling

The server includes error handling for:
- Missing environment variables
- API request failures
- Vector database connection issues
- Invalid chat messages

Errors are streamed back to the client via SSE.

## Dependencies

Key npm packages:
- `express`: Web framework
- `@langchain/*`: LLM framework and utilities
- `@datastax/astra-db-ts`: Astra DB client
- `@langchain/openai`: OpenAI integration
- `@langchain/google-genai`: Google AI integration
- `dotenv`: Environment variable management
- `cors`: CORS middleware
- `nodemon`: Dev server with auto-reload

## License

This project is part of EEX6340 - Artificial Intelligence Techniques & Agent Technology coursework.

