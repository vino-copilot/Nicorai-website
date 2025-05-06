from flask import Flask, request, jsonify
import os
import uuid
from dotenv import load_dotenv
try:
    from ai_generation import generate_ai_response
    from knowledge_base import retrieve_from_pinecone
except ImportError as e:
    print(f"Error: Failed to import modules: {e}")
    exit(1)

# Load environment variables
load_dotenv()

app = Flask(__name__)

@app.route('/')
def home():
    """
    Root route to avoid 404 errors and explain the API.
    """
    return jsonify({
        "message": "Welcome to the NicorAi AI API. Use POST /api/ai with JSON payload {'query': 'your question', 'responseType': 'text' or 'view'}."
    }), 200

@app.route('/api/ai', methods=['GET', 'POST'])
def ai_endpoint():
    """
    API endpoint to process AI queries and return responses.
    GET: Returns instructions.
    POST: Expects JSON: {"query": "What does NicorAi do?", "responseType": "text"}
    """
    if request.method == 'GET':
        return jsonify({
            "message": "This endpoint requires a POST request with JSON payload {'query': 'your question', 'responseType': 'text' or 'view'}. Example: curl -X POST http://127.0.0.1:5000/api/ai -H 'Content-Type: application/json' -d '{\"query\": \"What does NicorAi do?\", \"responseType\": \"text\"}'"
        }), 200

    try:
        data = request.get_json()
        query = data.get("query")
        response_type = data.get("responseType", "text")

        if not query:
            return jsonify({"error": "Query is required"}), 400

        # Create request for ai_generation
        request_data = {
            "requestId": str(uuid.uuid4()),
            "query": query,
            "context": [],
            "responseType": response_type,
            "retrievalParams": {"maxResults": 1, "minRelevanceScore": 0.5},
            "stylePreferences": {"theme": "light", "colorScheme": "blue"}
        }

        # Call AI module
        retrieval = retrieve_from_pinecone(query, top_k=5)
        response = generate_ai_response(request_data)

        return jsonify({
            "query": query,
            "retrieval": retrieval,
            "response": response
        }), 200

    except ValueError as e:
        return jsonify({"error": f"Invalid JSON: {str(e)}"}), 400
    except ImportError as e:
        return jsonify({"error": f"Module import failed: {str(e)}. Check knowledge_base.py and ai_generation.py."}), 500
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == "__main__":
    # Verify environment variables
    if not os.getenv("PINECONE_API_KEY") or not os.getenv("PERPLEXITY_API_KEY"):
        print("Error: PINECONE_API_KEY or PERPLEXITY_API_KEY missing in .env file.")
        exit(1)
    app.run(host="0.0.0.0", port=5000, debug=True)