import os
import requests
import re
import uuid
import json
from dotenv import load_dotenv
import logging
from typing import Dict, Any
from knowledge_base import KnowledgeBase

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"

if not PERPLEXITY_API_KEY:
    logger.error("PERPLEXITY_API_KEY is not set in .env file")
    raise ValueError("Missing PERPLEXITY_API_KEY")

# Simple in-memory cache
response_cache = {}

class AIUIGeneration:
    def __init__(self):
        try:
            self.kb = KnowledgeBase()
            logger.info("AIUIGeneration initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize KnowledgeBase: {str(e)}")
            raise

    def truncate_text(self, text: str, max_length: int = 1000) -> str:
        """Truncate text to max_length, preserving whole words."""
        if len(text) <= max_length:
            return text
        return text[:max_length].rsplit(' ', 1)[0] + '...'

    def call_perplexity_llm(self, query: str, context: str, mode: str = "text") -> Dict[str, Any]:
        """Call Perplexity API to generate text, viewSpec, or decide response type."""
        headers = {
            "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
            "Content-Type": "application/json"
        }

        if mode == "decide_response_type":
            prompt = f"""You are NicorAI, an innovative AI assistant. For the query '{query}' and the following context, determine the best response type: "text" or "view". Return ONLY a JSON object with a single key "responseType", with no additional text, explanations, or code fences.

            Context:
            {context}

            Instructions:
            - Choose "view" if the query asks for a list, table, or structured data (e.g., contains "services", "technologies", "list", "table", "card") or if structured JSON (e.g., [{{"name": "...", "description": "..."}}]) is available in the context.
            - Choose "text" for informational, conversational, or vague queries (e.g., "what does NicorAI do?", "hi").
            - Example: {{"responseType": "view"}}
            """
        elif mode == "view":
            prompt = f"""You are NicorAI, an innovative AI assistant. For the query '{query}' and the following context, select the best view type (table, card, chart, or custom) and generate a JSON viewSpec. Return ONLY a JSON object with viewType and data, with no additional text, explanations, or code fences.

            Context:
            {context}

            Instructions:
            - If the context contains structured JSON (e.g., list of services), use it to populate the viewSpec.
            - For table: {{"viewType": "table", "data": {{"columns": ["Name", "Description"], "rows": [[...]]}}}}
            - For card: {{"viewType": "card", "data": {{"cards": [{{"title": "...", "content": "..."}}]}}}}
            - Include only relevant items matching the query.
            - Example: {{"viewType": "table", "data": {{"columns": ["Name", "Description"], "rows": [["AI Agents", "Automate tasks"]]}}}}
            """
        else:  # text
            prompt = f"""You are NicorAI, an innovative AI assistant for NicorAI, a company specializing in custom AI agents, AR/VR solutions, and rapid MVP development. Using the provided context, answer the query '{query}' concisely, accurately, and in a professional yet approachable tone. Reflect NicorAI’s client-centric and cutting-edge values. Return only the text response.

            Context:
            {context}
            """

        payload = {
            "model": "llama-3.1-sonar-small-128k-online",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 500,
            "temperature": 0.7
        }

        # Check cache
        cache_key = f"{query}:{mode}"
        if cache_key in response_cache:
            logger.info(f"Cache hit for query: {query}, mode: {mode}")
            return response_cache[cache_key]

        try:
            logger.debug(f"Sending payload to Perplexity: {json.dumps(payload, indent=2)}")
            response = requests.post(PERPLEXITY_API_URL, headers=headers, json=payload, timeout=10)
            response.raise_for_status()
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            # Try to parse as JSON for decide_response_type and view modes
            try:
                parsed = json.loads(content)
                response_cache[cache_key] = parsed
                return parsed
            except json.JSONDecodeError:
                logger.warning(f"LLM output is not JSON: {content}")
                response_cache[cache_key] = {"text": content}
                return {"text": content}
        except requests.exceptions.RequestException as e:
            logger.error(f"Perplexity API error: {response.status_code} {response.text}")
            return {"text": "Sorry, something went wrong. Please try again!"}
        except Exception as e:
            logger.error(f"Error processing LLM response: {str(e)}")
            return {"text": "Sorry, something went wrong. Please try again!"}

    def generate_response(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Generate text or view response based on the request."""
        query = request["query"].strip().lower()
        retrieval_params = request.get("retrievalParams", {"maxResults": 5, "minRelevanceScore": 0.5})
        requested_response_type = request.get("responseType")  # Allow None
        response_id = str(uuid.uuid4())

        # Handle casual queries
        casual_queries = ["hi", "hello", "hey", "wish"]
        if query in casual_queries or re.match(r"^(hi|hello|hey|wish)\W*$", query):
            return {
                "responseId": response_id,
                "responseType": "text",
                "content": {
                    "text": "Hey, I'm NicorAI! Ask me anything about our AI solutions, AR/VR experiences, or rapid MVP development."
                },
                "metadata": {"modelUsed": "none", "tokensUsed": 0}
            }

        # Handle empty query
        if not query:
            return {
                "responseId": response_id,
                "responseType": "text",
                "content": {
                    "text": "I couldn't find relevant information. Try asking about NicorAI’s services, technologies, or how to contact us!"
                },
                "metadata": {"modelUsed": "none", "tokensUsed": 0}
            }

        # Retrieve relevant items from Pinecone
        try:
            retrieved_items = self.kb.retrieve_from_pinecone(
                query,
                top_k=retrieval_params["maxResults"],
                min_relevance_score=retrieval_params["minRelevanceScore"]
            )
            logger.debug(f"Retrieved items: {len(retrieved_items)} for query: {query}")
        except Exception as e:
            logger.error(f"Error retrieving from Pinecone: {str(e)}")
            return {
                "responseId": response_id,
                "responseType": "text",
                "content": {"text": "Sorry, I couldn’t connect to the Knowledge Base. Please try again!"},
                "metadata": {"modelUsed": "none", "tokensUsed": 0}
            }

        if not retrieved_items:
            logger.info(f"No relevant items found for query: {query}")
            return {
                "responseId": response_id,
                "responseType": "text",
                "content": {
                    "text": "I couldn't find relevant information. Try asking about NicorAI’s services, technologies, or how to contact us!"
                },
                "metadata": {"modelUsed": "none", "tokensUsed": 0}
            }

        # Filter and prioritize structured JSON items
        context = ""
        structured_items = []
        for item in retrieved_items:
            answer = item["metadata"].get("answer", item["metadata"].get("text", ""))
            question = item["metadata"].get("question", "")
            if answer.startswith('['):
                try:
                    json_data = json.loads(answer)
                    if isinstance(json_data, list):
                        structured_items.append((question, json_data))
                        context += f"Question: {question}\nAnswer: {json.dumps(json_data)}\n\n"
                        continue
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON in answer: {answer}")
            context += f"Question: {question}\nAnswer: {answer}\n\n"
        context = self.truncate_text(context)
        logger.debug(f"Structured items found: {len(structured_items)}")
        logger.debug(f"Structured items: {structured_items}")

        # Decide response type if not specified
        if requested_response_type is None:
            llm_decision = self.call_perplexity_llm(query, context, mode="decide_response_type")
            requested_response_type = llm_decision.get("responseType", "text") if isinstance(llm_decision, dict) else "text"
            logger.debug(f"LLM decided responseType: {requested_response_type}")
        elif requested_response_type not in ["text", "view"]:
            logger.warning(f"Invalid responseType '{requested_response_type}', defaulting to text")
            requested_response_type = "text"

        # Generate view response
        view_keywords = ["show table", "list", "display chart", "show card", "services", "technologies"]
        if requested_response_type == "view" or any(keyword in query for keyword in view_keywords):
            llm_output = self.call_perplexity_llm(query, context, mode="view")
            logger.debug(f"LLM output for view: {llm_output}")

            # Determine viewType
            view_type = "table" if any(k in query for k in ["table", "services", "technologies"]) else "card"
            if isinstance(llm_output, dict) and "viewType" in llm_output:
                view_type = llm_output.get("viewType", view_type)
                logger.debug(f"LLM selected viewType: {view_type}")

            # Construct view_spec
            if structured_items:
                if view_type == "table":
                    view_spec = {
                        "viewType": "table",
                        "data": {
                            "columns": ["Name", "Description"],
                            "rows": [
                                [entry["name"], entry["description"]]
                                for item in structured_items[:1]
                                for entry in item[1]
                            ]
                        }
                    }
                else:  # card
                    view_spec = {
                        "viewType": "card",
                        "data": {
                            "cards": [
                                {
                                    "title": item[0],
                                    "content": "\n".join([f"{entry['name']}: {entry['description']}" for entry in item[1]])
                                }
                                for item in structured_items[:1]
                            ]
                        }
                    }
            else:
                # Fallback structured response for services
                if "services" in query:
                    view_spec = {
                        "viewType": "table",
                        "data": {
                            "columns": ["Name", "Description"],
                            "rows": [
                                ["Custom AI Agents", "Automate tasks and analyze data with tailored AI solutions."],
                                ["AR/VR Experiences", "Create immersive simulations for training or entertainment."],
                                ["Rapid MVP Development", "Build functional apps in 4–12 weeks."]
                            ]
                        }
                    }
                else:
                    # Fallback to unstructured data
                    if view_type == "table":
                        view_spec = {
                            "viewType": "table",
                            "data": {
                                "columns": ["Name", "Description"],
                                "rows": [
                                    [item["metadata"].get("question", "Info"), self.truncate_text(item["metadata"].get("answer", item["metadata"].get("text", "")), 200)]
                                    for item in retrieved_items[:3]
                                ]
                            }
                        }
                    else:  # card
                        view_spec = {
                            "viewType": "card",
                            "data": {
                                "cards": [
                                    {
                                        "title": item["metadata"].get("question", "Info"),
                                        "content": self.truncate_text(item["metadata"].get("answer", item["metadata"].get("text", "")), 200)
                                    }
                                    for item in retrieved_items[:3]
                                ]
                            }
                        }

            logger.debug(f"Generated viewSpec: {json.dumps(view_spec, indent=2)}")
            return {
                "responseId": response_id,
                "responseType": "view",
                "content": {
                    "viewType": view_spec["viewType"],
                    "viewSpec": view_spec
                },
                "metadata": {
                    "modelUsed": "llama-3.1-sonar-small-128k-online",
                    "tokensUsed": 100  # Placeholder
                }
            }

        # Generate text response
        llm_output = self.call_perplexity_llm(query, context, mode="text")
        text_response = llm_output.get("text", "Sorry, something went wrong. Please try again!") if isinstance(llm_output, dict) else llm_output

        return {
            "responseId": response_id,
            "responseType": "text",
            "content": {"text": text_response},
            "metadata": {
                "modelUsed": "llama-3.1-sonar-small-128k-online",
                "tokensUsed": 100  # Placeholder
            }
        }

if __name__ == "__main__":
    try:
        ai = AIUIGeneration()
        test_cases = [
            {
                "query": "What does NicorAI do?",
                "retrievalParams": {"maxResults": 5, "minRelevanceScore": 0.5},
                "responseType": "text"
            },
            {
                "query": "What are NicorAI’s services?",
                "retrievalParams": {"maxResults": 5, "minRelevanceScore": 0.5}
            },
            {
                "query": "hi",
                "retrievalParams": {"maxResults": 5, "minRelevanceScore": 0.5},
                "responseType": "text"
            }
        ]

        for i, test_case in enumerate(test_cases, 1):
            logger.info(f"Running Test Case {i}: {test_case['query']}")
            response = ai.generate_response(test_case)
            print(json.dumps(response, indent=2))
    except Exception as e:
        logger.error(f"Test failed: {str(e)}")