import os
import pickle
import cv2
import mediapipe as mp
import numpy as np
import base64
import json
import re
from gtts import gTTS
from io import BytesIO
from googletrans import Translator
from textblob import TextBlob
from flask import Flask, Response, jsonify, request

app = Flask(__name__)

# Initialize MediaPipe
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False, max_num_hands=1,
                      min_detection_confidence=0.5, min_tracking_confidence=0.5)

# Load model
with open('model.p', 'rb') as f:
    model = pickle.load(f)['model']

labels_dict = {
    0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F', 6: 'G', 7: 'H', 8: 'I', 9: 'J',
    10: 'K', 11: 'L', 12: 'M', 13: 'N', 14: 'O', 15: 'P', 16: 'Q', 17: 'R', 18: 'S', 19: 'T',
    20: 'U', 21: 'V', 22: 'W', 23: 'X', 24: 'Y', 25: 'Z', 26: 'del', 27: 'space'
}

camera_active = False
cap = None

def generate_frames():
    global cap
    cap = cv2.VideoCapture(0)
    while camera_active:
        success, frame = cap.read()
        if not success:
            break

        # Process frame
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(frame_rgb)
        
        prediction = None
        if results.multi_hand_landmarks:
            hand_landmarks = results.multi_hand_landmarks[0]
            
            # Get coordinates
            x_coords = [lm.x for lm in hand_landmarks.landmark]
            y_coords = [lm.y for lm in hand_landmarks.landmark]
            
            # Normalize
            data_aux = []
            min_x, min_y = min(x_coords), min(y_coords)
            for lm in hand_landmarks.landmark:
                data_aux.extend([lm.x - min_x, lm.y - min_y])
            
            # Predict if valid
            if len(data_aux) == 42:
                prediction = model.predict([np.asarray(data_aux, dtype=np.float32)])[0]
                prediction = labels_dict[int(prediction)]
                
                # Draw rectangle and label
                h, w, _ = frame.shape
                x1, y1 = int(min(x_coords) * w), int(min(y_coords) * h)
                x2, y2 = int(max(x_coords) * w), int(max(y_coords) * h)
                
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, prediction, (x1, y1-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        # Encode frame
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        
        # Create data payload
        data = {
            "frame": base64.b64encode(frame).decode('utf-8'),
            "prediction": prediction if prediction else ""
        }
        
        yield f"data: {json.dumps(data)}\n\n"

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='text/event-stream')

@app.route('/start_camera', methods=['POST'])
def start_camera():
    global camera_active
    camera_active = True
    return jsonify({"status": "camera started"})

@app.route('/stop_camera', methods=['POST'])
def stop_camera():
    global camera_active, cap
    camera_active = False
    if cap:
        cap.release()
    return jsonify({"status": "camera stopped"})

@app.route('/refine_text', methods=['POST'])
def refine_text():
    data = request.get_json()
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    try:
        # Advanced spelling and grammar correction
        blob = TextBlob(text)
        corrected = str(blob.correct())
        
        # Basic capitalization rules
        corrected = corrected.capitalize()
        corrected = re.sub(r"([.!?])\s*(\w)", lambda m: f"{m.group(1)} {m.group(2).upper()}", corrected)
        
        return jsonify({
            'original': text,
            'refined': corrected,
            'success': True
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500
    
@app.errorhandler(500)
def handle_server_error(e):
    return jsonify({
        'error': 'Internal server error',
        'details': str(e)
    }), 500

translator = Translator()

@app.route('/translate', methods=['POST'])
def translate_text():
    data = request.get_json()
    text = data.get('text', '')
    target_lang = data.get('target_lang', 'hi')  # Default to Hindi
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    try:
        translation = translator.translate(text, dest=target_lang)
        return jsonify({
            'original': text,
            'translated': translation.text,
            'source_lang': translation.src,
            'target_lang': translation.dest,
            'success': True
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

# Add language code mapping
@app.route('/get_languages', methods=['GET'])
def get_languages():
    return jsonify({
        'languages': {
            'Hindi': 'hi',
            'Japanese': 'ja',
            'Korean': 'ko'
        }
    })

@app.route('/speak_text', methods=['POST'])
def speak_text():
    data = request.get_json()
    text = data.get('text', '')
    lang = data.get('lang', 'en')  # Default to English
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    try:
        # Create speech in memory
        tts = gTTS(text=text, lang=lang, slow=False)
        mp3_fp = BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        
        # Return base64 encoded audio
        return Response(
            mp3_fp.getvalue(),
            mimetype='audio/mpeg',
            headers={
                'Content-Disposition': 'attachment; filename=speech.mp3'
            }
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)