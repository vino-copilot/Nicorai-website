import os
import logging
from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# Configure logging for minimal output
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class KnowledgeBase:
    def __init__(self):
        # Load environment variables
        load_dotenv()
        PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
        if not PINECONE_API_KEY:
            logger.error("PINECONE_API_KEY is not set in .env file")
            raise ValueError("Missing PINECONE_API_KEY")

        # Initialize Pinecone
        try:
            self.pc = Pinecone(api_key=PINECONE_API_KEY)
            logger.info("Connected to Pinecone")
        except Exception as e:
            logger.error(f"Failed to initialize Pinecone: {str(e)}")
            raise

        # Check or create index
        index_name = "nicorai-faq"
        try:
            if index_name not in [idx["name"] for idx in self.pc.list_indexes()]:
                logger.info(f"Creating index {index_name}")
                self.pc.create_index(
                    name=index_name,
                    dimension=768,
                    metric="cosine",
                    spec=ServerlessSpec(cloud="aws", region="us-east-1")
                )
            self.index = self.pc.Index(index_name)
            logger.info(f"Connected to Pinecone index: {index_name}")
        except Exception as e:
            logger.error(f"Failed to create or access index {index_name}: {str(e)}")
            raise

        # Initialize sentence transformer
        try:
            self.model = SentenceTransformer("paraphrase-mpnet-base-v2")
            logger.info("Loaded sentence transformer model")
        except Exception as e:
            logger.error(f"Failed to load sentence transformer: {str(e)}")
            raise

    def upsert_to_pinecone(self, vectors):
        """Upsert vectors to Pinecone."""
        try:
            if vectors:
                self.index.upsert(vectors=vectors)
                logger.info(f"Upserted {len(vectors)} items to Pinecone")
            else:
                logger.warning("No items to upsert")
        except Exception as e:
            logger.error(f"Failed to upsert to Pinecone: {str(e)}")
            raise

    def retrieve_from_pinecone(self, query, top_k=5, min_relevance_score=0.5):
        """Retrieve relevant items from Pinecone."""
        try:
            query_vector = self.model.encode(query).tolist()
            results = self.index.query(
                vector=query_vector,
                top_k=top_k,
                include_metadata=True
            )
            relevant_results = [
                {
                    "id": match["id"],
                    "content": match["metadata"].get("answer", match["metadata"].get("text", "")),
                    "metadata": match["metadata"],
                    "relevanceScore": match["score"]
                }
                for match in results["matches"]
                if match["score"] >= min_relevance_score
            ]
            logger.info(f"Retrieved {len(relevant_results)} relevant items for query")
            return relevant_results
        except Exception as e:
            logger.error(f"Failed to retrieve from Pinecone: {str(e)}")
            return []

if __name__ == "__main__":
    try:
        kb = KnowledgeBase()
        # Test index connectivity
        stats = kb.index.describe_index_stats()
        logger.info(f"Knowledge Base is running successfully. Index stats: {stats}")
    except Exception as e:
        logger.error(f"Failed to initialize Knowledge Base: {str(e)}")