import json
import time
from ai_module import AIUIGeneration
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_tests():
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
                "retrievalParams": {"maxResults": 5, "minRelevanceScore": 0.5},
                "responseType": "view"
            },
            {
                "query": "hi",
                "retrievalParams": {"maxResults": 5, "minRelevanceScore": 0.5},
                "responseType": "text"
            },
            {
                "query": "xyz",
                "retrievalParams": {"maxResults": 5, "minRelevanceScore": 0.5},
                "responseType": "text"
            },
            {
                "query": "How can I contact NicorAI?",
                "retrievalParams": {"maxResults": 5, "minRelevanceScore": 0.5},
                "responseType": "text"
            },
            {
                "query": "What technologies does NicorAI use?",
                "retrievalParams": {"maxResults": 5, "minRelevanceScore": 0.5},
                "responseType": "view"
            },
            {
                "query": "",
                "retrievalParams": {"maxResults": 5, "minRelevanceScore": 0.5},
                "responseType": "text"
            }
        ]

        for i, test_case in enumerate(test_cases, 1):
            print(f"\nTest Case {i}: {test_case['query'] or 'Empty Query'}")
            try:
                start_time = time.time()
                response = ai.generate_response(test_case)
                elapsed_time = time.time() - start_time
                print(json.dumps(response, indent=2))
                print(f"Response Time: {elapsed_time:.2f}s")
            except Exception as e:
                logger.error(f"Test Case {i} failed: {str(e)}")
                print(f"Error: {str(e)}")
    except Exception as e:
        logger.error(f"Failed to initialize AIUIGeneration: {str(e)}")
        print(f"Initialization Error: {str(e)}")

if __name__ == "__main__":
    run_tests()