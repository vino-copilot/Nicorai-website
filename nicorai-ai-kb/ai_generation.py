import uuid
import requests
import os
import json
import re
from dotenv import load_dotenv
from knowledge_base import retrieve_from_pinecone

# Load .env file
load_dotenv()

def generate_ai_response(request: dict) -> dict:
    """
    Generate AI response with text or view output using Pinecone and Perplexity AI.
    Input/Output per contract 4.3.3: {responseId, responseType, content, metadata}
    """
    query = request.get("query", "")
    request_id = request.get("requestId", str(uuid.uuid4()))
    response_type = request.get("responseType", "text")
    
    # Retrieve from Pinecone
    retrieval_result = retrieve_from_pinecone(query, top_k=1)
    min_relevance_score = 0.6
    context = ""
    metadata = {}
    if (retrieval_result["totalResults"] > 0 and 
        retrieval_result["results"][0]["relevanceScore"] >= min_relevance_score):
        context = retrieval_result["results"][0]["content"]
        metadata = retrieval_result["results"][0]["metadata"]
    
    # Call Perplexity AI
    response_content = {}
    model_used = "none"
    tokens_used = 0
    if context:
        try:
            headers = {"Authorization": f"Bearer {os.getenv('PERPLEXITY_API_KEY')}"}
            if response_type == "view":
                prompt = (
                    f"Context: {context}\n"
                    f"Question: {query}\n"
                    f"Return ONLY a valid JSON object with 'title' (exactly '{metadata.get('question', query)}') and 'body' (a concise, professional answer in 50 words or less, based solely on the context, no citations or external data). Do not include markdown, code fences, or any text outside the JSON object:\n"
                    f"Example: {{\"title\": \"{metadata.get('question', query)}\", \"body\": \"NicorAI specializes in custom AI agent design.\"}}"
                )
            else:
                prompt = f"Context: {context}\n\nQuestion: {query}\nAnswer concisely and professionally in 50 words or less, without citations."
            
            response = requests.post(
                "https://api.perplexity.ai/chat/completions",
                json={
                    "model": "llama-3.1-sonar-small-128k-online",
                    "messages": [
                        {"role": "system", "content": "You are a helpful assistant for NicorAI. Follow instructions exactly and return only the requested output."},
                        {"role": "user", "content": prompt}
                    ]
                },
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            llm_response = response.json()["choices"][0]["message"]["content"].strip()
            print(f"Raw LLM Response: {llm_response}")  # Debug logging
            
            if response_type == "view":
                # Clean markdown code fences and whitespace
                cleaned_response = re.sub(r'^```json\s*|\s*```$', '', llm_response, flags=re.MULTILINE)
                cleaned_response = cleaned_response.strip()
                print(f"Cleaned LLM Response: {cleaned_response}")  # Debug logging
                
                # Parse LLM response as JSON
                try:
                    view_content = json.loads(cleaned_response)
                    if "title" in view_content and "body" in view_content:
                        response_content = {"view": view_content}
                    else:
                        raise ValueError("Invalid view format: missing title or body")
                except (json.JSONDecodeError, ValueError) as e:
                    print(f"View parsing error: {e}")
                    # Fallback: Construct JSON manually
                    response_content = {
                        "view": {
                            "title": metadata.get("question", query),
                            "body": context[:100]  # Shorter for conciseness
                        }
                    }
            else:
                response_content = {"text": llm_response}
            model_used = "llama-3.1-sonar-small-128k-online"
            tokens_used = 50  # Mock value
        except (requests.RequestException, KeyError) as e:
            print(f"LLM error: {e}")
            response_content = {"text": context}  # Fallback to raw FAQ
    
    # Handle cases with no context or LLM failure
    if not response_content:
        response_content = {"text": context if context else "Sorry, I don’t have an answer for that."}
    
    # Format response
    response = {
        "responseId": f"ai-{request_id}",
        "responseType": response_type,
        "content": response_content,
        "metadata": {
            "modelUsed": model_used,
            "tokensUsed": tokens_used
        }
    }
    
    return response

# Test function
if __name__ == "__main__":
    test_request = {
        "requestId": "test-1",
        "query": "What does NicorAi do?",
        "context": [],
        "responseType": "view",
        "retrievalParams": {"maxResults": 1, "minRelevanceScore": 0.5},
        "stylePreferences": {"theme": "light", "colorScheme": "blue"}
    }
    response = generate_ai_response(test_request)
    print(response)