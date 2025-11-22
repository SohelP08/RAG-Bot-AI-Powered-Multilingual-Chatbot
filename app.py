from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer
from langchain.text_splitter import RecursiveCharacterTextSplitter
import faiss
import numpy as np
import json
import requests
from flask_cors import CORS


app = Flask(__name__)
CORS(app)  # This enables CORS for all routes and origins


# Initialize components yUmx2Nq9Yiq1gPjNaMi6aTk2jyhkhmwp, nUOeCHfrPHplHyMwYWepNiEx8nB4ngq2, OgVj1Bfhy75G4OAGOsWvcFIW92shTra3, pYRnZvldIDekejxSInK9CpKUMrkrI3p0, aK0Qo97jFJMJYCVwIiCKfFNDo0pdATsy
DEEPINFRA_API_KEY = "aK0Qo97jFJMJYCVwIiCKfFNDo0pdATsy"
embedder = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2000,
    chunk_overlap=100,
    length_function=len,
    separators=["\n\n", "\n", r"(?<=\. )", " ", ""]
)

# Load and index data
def load_and_index_data(filenames):
    all_data = []
    for filename in filenames:
        with open(filename, 'r', encoding='utf-8') as f:
            all_data.append(f.read())
    
    chunks = text_splitter.split_text("\n".join(all_data))
    chunk_embeddings = embedder.encode(chunks)
    index = faiss.IndexFlatL2(chunk_embeddings.shape[1])
    index.add(chunk_embeddings)
    return chunks, index

chunks, index = load_and_index_data(['output1.json'])

# Helper: find relevant context
def get_relevant_context(question, top_k=3):
    question_embedding = embedder.encode([question])
    distances, indices = index.search(question_embedding, top_k)
    return "\n".join([chunks[i] for i in indices[0]])[:2000]

# Helper: Ask Mistral API
def ask_mistral(question):
    context = get_relevant_context(question) or "No relevant context found"
    headers = {
        "Authorization": f"Bearer {DEEPINFRA_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "input": f"[INST] <<SYS>>Answer based on the context. Say 'I don't know' if unsure.<</SYS>>\n\nContext: {context}\n\nQuestion: {question} [/INST]",
        "parameters": {
            "max_new_tokens": 512,
            "temperature": 0.7,
            "top_p": 0.9
        }
    }
    try:
        response = requests.post(
            "https://api.deepinfra.com/v1/inference/mistralai/Mistral-7B-Instruct-v0.3",
            headers=headers,
            json=payload
        )
        result_json = response.json()
        
        # Debug: log full response if results key is missing
        if "results" not in result_json:
            return f"Error: 'results' not found in response. Full response: {result_json}"

        return result_json["results"][0]["generated_text"]
    except Exception as e:
        return f"Error: {str(e)}"


# Flask route to receive user questions
@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    question = data.get("question", "")
    if not question:
        return jsonify({"error": "No question provided"}), 400
    
    answer = ask_mistral(question)
    return jsonify({"answer": answer.split("[/INST]")[-1].strip()})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

