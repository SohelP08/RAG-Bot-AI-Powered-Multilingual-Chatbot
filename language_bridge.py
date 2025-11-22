from flask import Flask, request, jsonify, send_file
from flask_cors import CORS  # ✅ Import this
from gtts import gTTS
from deep_translator import GoogleTranslator
import requests
import tempfile
import os
import traceback
import random
import json

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


accept_language = "en-US,en;q=0.9"
lang = accept_language.split(',')[0].split('-')[0]
print(lang)  # Output: 'en'


# Replace with your actual backend
BACKEND_URL = "http://localhost:5000/chat"

@app.route('/multilang-chat', methods=['POST'])
def multilang_chat():
    data = request.json
    user_text = data.get("question", "")
    lang = data.get("lang", "en")

    # ✅ Normalize language code like 'hi-IN' → 'hi'
    lang = lang.split('-')[0]

    if not user_text:
        return jsonify({"error": "No input text provided"}), 400

    try:
        translated_question = GoogleTranslator(source=lang, target='en').translate(user_text)
        hardcoded = match_hardcoded_answer(translated_question)
        if hardcoded:
            backend_answer = hardcoded
        else:
    # 2. Send to backend
            res = requests.post(BACKEND_URL, json={"question": translated_question})
            backend_answer = res.json().get("answer", "Sorry, I couldn't get a response.")

        
        translated_answer = GoogleTranslator(source='en', target=lang).translate(backend_answer)

        tts = gTTS(text=translated_answer, lang=lang)
        from uuid import uuid4
        filename = f"{uuid4().hex}.mp3"
        audio_path = os.path.join("static/audio", filename)
        tts.save(audio_path)


        return jsonify({
            "text": translated_answer,
            "audio_url": f"/static/audio/{filename}"
        })

    except Exception as e:
        import traceback
        print("🔥 SERVER ERROR:", traceback.format_exc())
        return jsonify({"error": str(e)}), 500


# Load hardcoded Q&A
with open("about.json", "r", encoding="utf-8") as f:
    HARDCODED_QA = json.load(f)

# Match function
def match_hardcoded_answer(question):
    question = question.strip().lower()
    for qa in HARDCODED_QA:
        if qa["question"].strip().lower() == question:
            return random.choice(qa["answers"])
    return None

@app.route('/get-audio')
def get_audio():
    path = request.args.get("path")
    if path and os.path.exists(path):
        return send_file(path, mimetype="audio/mpeg")
    return "Audio file not found", 404



if __name__ == '__main__':
    app.run(port=5100, debug=True, use_reloader=False)
