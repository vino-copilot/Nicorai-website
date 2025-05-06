from pinecone import Pinecone, ServerlessSpec
import requests
from sentence_transformers import SentenceTransformer
import numpy as np

# Your Pinecone and Strapi details
PINECONE_API_KEY = "pcsk_5mHAPq_7p3j66o1objVUHaLeam7u2uDN6c926WXBMfYronL9Y6d3AvNB6Jn4tKpWDsBEGq"  # Paste your key from pinecone-key.txt
PINECONE_INDEX_NAME = "nicorai-faq"
STRAPI_URL = "http://localhost:1337/api/faqs"

# Set up Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)

# Check if index exists; skip creation if it does
index_exists = any(index["name"] == PINECONE_INDEX_NAME for index in pc.list_indexes())
if not index_exists:
    pc.create_index(
        name=PINECONE_INDEX_NAME,
        dimension=768,  # Matches paraphrase-mpnet-base-v2
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1")
    )

# Connect to the index
index = pc.Index(PINECONE_INDEX_NAME)

# Set up the model to create vectors
model = SentenceTransformer('paraphrase-mpnet-base-v2')

# Function to normalize vector
def normalize_vector(vector):
    norm = np.linalg.norm(vector)
    if norm == 0:
        return vector
    return vector / norm

# Get FAQs from Strapi
try:
    response = requests.get(STRAPI_URL)
    response.raise_for_status()
    faqs = response.json()['data']
except requests.RequestException as e:
    print(f"Error fetching FAQs from Strapi: {e}")
    exit(1)

# Prepare FAQs for Pinecone
vectors = []
for faq in faqs:
    question = faq['question']
    answer = faq['answer']
    text = f"{question} {answer}"
    vector = model.encode(text)
    vector = normalize_vector(vector).tolist()  # Normalize the vector
    vectors.append({
        "id": f"faq-{faq['id']}",
        "values": vector,
        "metadata": {"question": question, "answer": answer}
    })

# Send vectors to Pinecone
index.upsert(vectors=vectors)
print("FAQs synced to Pinecone!")