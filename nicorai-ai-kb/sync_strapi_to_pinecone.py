import os
import logging
import requests
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from knowledge_base import KnowledgeBase

# Configure logging for minimal output
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class StrapiSync:
    def __init__(self):
        # Load environment variables
        load_dotenv()
        self.STRAPI_API_TOKEN = os.getenv("STRAPI_API_TOKEN")
        self.STRAPI_FAQ_URL = "http://localhost:1337/api/faqs"
        self.STRAPI_INFO_URL = "http://localhost:1337/api/company-informations"
        
        if not self.STRAPI_API_TOKEN:
            logger.error("STRAPI_API_TOKEN is not set in .env file")
            raise ValueError("Missing STRAPI_API_TOKEN")

        # Initialize sentence transformer
        try:
            self.model = SentenceTransformer("paraphrase-mpnet-base-v2")
            logger.info("Loaded sentence transformer model for Strapi sync")
        except Exception as e:
            logger.error(f"Failed to load sentence transformer: {str(e)}")
            raise

    def fetch_from_strapi(self):
        """Fetch FAQs and company info from Strapi and prepare vectors."""
        try:
            headers = {"Authorization": f"Bearer {self.STRAPI_API_TOKEN}"}
            vectors = []

            # Fetch FAQs
            logger.info("Fetching FAQs from Strapi")
            response = requests.get(self.STRAPI_FAQ_URL, headers=headers, timeout=10)
            response.raise_for_status()
            faqs = response.json().get("data", [])
            logger.info(f"Fetched {len(faqs)} FAQs")

            for faq in faqs:
                question = faq.get("questions", "")
                answer = faq.get("answer", "")
                faq_id = str(faq.get("id", ""))
                if not (question and answer and faq_id):
                    logger.warning(f"Skipping invalid FAQ: ID={faq_id}")
                    continue

                text = f"{question} {answer}"
                try:
                    vector = self.model.encode(text).tolist()
                    vectors.append((
                        f"faq-{faq_id}",
                        vector,
                        {"type": "faq", "question": question, "answer": answer}
                    ))
                except Exception as e:
                    logger.error(f"Failed to encode FAQ ID={faq_id}: {str(e)}")
                    continue

            # Fetch company info
            logger.info("Fetching company info from Strapi")
            response = requests.get(self.STRAPI_INFO_URL, headers=headers, timeout=10)
            response.raise_for_status()
            infos = response.json().get("data", [])
            logger.info(f"Fetched {len(infos)} company info entries")

            for info in infos:
                company_info = info.get("company_info", [])
                info_id = str(info.get("id", ""))
                text_parts = []
                for paragraph in company_info:
                    for child in paragraph.get("children", []):
                        text = child.get("text", "")
                        if text.strip():
                            text_parts.append(text)
                combined_text = " ".join(text_parts)
                if not (combined_text and info_id):
                    logger.warning(f"Skipping invalid company info: ID={info_id}")
                    continue

                try:
                    vector = self.model.encode(combined_text).tolist()
                    vectors.append((
                        f"info-{info_id}",
                        vector,
                        {"type": "company_info", "text": combined_text}
                    ))
                except Exception as e:
                    logger.error(f"Failed to encode company info ID={info_id}: {str(e)}")
                    continue

            # Add additional FAQ
            additional_faq = {
                "id": "custom-1",
                "question": "What technologies does NicorAI use?",
                "answer": "NicorAI uses Python, TensorFlow, PyTorch, JavaScript, React, Node.js, and cloud platforms like AWS and Azure for AI and web development."
            }
            text = f"{additional_faq['question']} {additional_faq['answer']}"
            try:
                vector = self.model.encode(text).tolist()
                vectors.append((
                    f"faq-{additional_faq['id']}",
                    vector,
                    {
                        "type": "faq",
                        "question": additional_faq["question"],
                        "answer": additional_faq["answer"]
                    }
                ))
                logger.info("Added additional FAQ: What technologies does NicorAI use?")
            except Exception as e:
                logger.error(f"Failed to encode additional FAQ: {str(e)}")

            return vectors

        except requests.exceptions.HTTPError as e:
            logger.error(f"Failed to fetch data from Strapi: {str(e)}")
            if response.status_code == 401:
                logger.error("401 Unauthorized: Check STRAPI_API_TOKEN")
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to connect to Strapi: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Failed to process Strapi data: {str(e)}")
            raise

if __name__ == "__main__":
    try:
        strapi = StrapiSync()
        kb = KnowledgeBase()
        vectors = strapi.fetch_from_strapi()
        kb.upsert_to_pinecone(vectors)
        logger.info("Pinecone sync completed")
    except Exception as e:
        logger.error(f"Sync failed: {str(e)}")