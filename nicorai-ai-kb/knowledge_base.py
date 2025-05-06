import os
from dotenv import load_dotenv
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

# Load environment variables from .env file
load_dotenv()

# Initialize Pinecone
api_key = os.getenv("PINECONE_API_KEY")
if not api_key:
    raise ValueError("PINECONE_API_KEY not found in environment variables")
pc = Pinecone(api_key=api_key)
index = pc.Index("nicorai-faq")

# Initialize embedding model
embedder = SentenceTransformer("paraphrase-mpnet-base-v2")

def retrieve_from_pinecone(query: str, top_k: int = 3) -> dict:
    """
    Retrieve top-k relevant FAQs from Pinecone.
    Returns format per contract 4.3.4: {results: [{id, content, metadata, relevanceScore}], totalResults}
    """
    try:
        # Generate query embedding
        query_embedding = embedder.encode(query).tolist()

        # Query Pinecone
        result = index.query(vector=query_embedding, top_k=top_k, include_metadata=True)
        matches = result.get("matches", [])

        # Format results
        formatted_results = [
            {
                "id": match["id"],
                "content": match["metadata"]["answer"],
                "metadata": {
                    "question": match["metadata"]["question"],
                    "answer": match["metadata"]["answer"]
                },
                "relevanceScore": match["score"]
            }
            for match in matches
        ]

        return {
            "results": formatted_results,
            "totalResults": len(formatted_results)
        }
    except Exception as e:
        print(f"Error querying Pinecone: {e}")
        return {"results": [], "totalResults": 0}

# Test function
if __name__ == "__main__":
    test_query = "What does NicorAi do?"
    result = retrieve_from_pinecone(test_query)
    print(result)