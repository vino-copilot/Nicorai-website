import os
import uvicorn
from fastapi import FastAPI, Request
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Dict, Any
import logging
from ai_module import AIUIGeneration  # This is your main class from the latest code

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="NicorAI API", description="RAG + LLM API for NicorAI", version="1.0")

# Initialize AIUIGeneration instance
ai_generator = AIUIGeneration()

# Define request body schema
class QueryRequest(BaseModel):
    query: str
    responseType: str = "text"  # "text" or "view"
    retrievalParams: Dict[str, Any] = {"maxResults": 5, "minRelevanceScore": 0.5}

@app.post("/ai-query")
async def ai_query(request: QueryRequest):
    try:
        logger.info(f"Received query: {request.query}")
        response = ai_generator.generate_response(request.dict())
        return response
    except Exception as e:
        logger.error(f"Error in ai-query endpoint: {str(e)}")
        return {
            "responseId": "",
            "responseType": "text",
            "content": {"text": "Sorry, something went wrong on the server. Please try again!"},
            "metadata": {"modelUsed": "none", "tokensUsed": 0}
        }

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
