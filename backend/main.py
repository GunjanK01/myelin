from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel  #A Pydantic tool used to create strict rules for incoming data.
import httpx

from pdf_engine import process_and_store_pdf, get_pdf_context

app = FastAPI()

# Add CORS middleware to allow requests from the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://localhost:11434/api/generate"

# Best Practice: Define a Pydantic model for your request payload
class ChatRequest(BaseModel):
    message: str
    #Defines a strict schema. Any request hitting the chat endpoint must be a JSON object containing a message key with a string value.

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """Handles PDF uploads and passes them to the engine for processing."""
    return await process_and_store_pdf(file)    #pdf_engine.py has this function

async def stream_ollama(prompt: str, context: str):
    """Constructs the RAG prompt and streams the response from local Ollama."""
    
    # Cleaned up f-string formatting
    rag_prompt = f"""Use the following context to answer the user's question. If the answer is not in the context, say you don't know based on the document.
    
Context:
{context}

Question: {prompt}
Answer:"""

    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream("POST", OLLAMA_URL, json={
            "model": "gemma4:e4b",  # Ensure this exactly matches your local model name
            "prompt": rag_prompt,
            "stream": True
        }) as response:
            async for chunk in response.aiter_lines():
                if chunk:
                    yield chunk + "\n"

@app.post("/chat")
async def chat(payload: ChatRequest):
    """Handles incoming chat messages, fetches context, and returns a stream."""
    user_message = payload.message
    
    # Fetch relevant text from the vector database
    context = get_pdf_context(user_message)
    
    return StreamingResponse(
        stream_ollama(user_message, context), 
        media_type="text/plain"
    )