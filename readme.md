# Real-Time Sign Language Translator (RTSL)

> **Major Project - 8th Semester B.Tech (Artificial Intelligence & Data Science)**  
> Guru Gobind Singh Indraprastha University (East Delhi Campus)  
> **Team Members**: Shivan Anand, Anirudh Shukla, Hardik Singh

---

## 🌐 Overview

Real-Time Sign Language Translator (RTSL) is an AI-powered desktop application that enables real-time interpretation of sign language into readable and spoken text. The system leverages Python for hand landmark detection and classification, paired with an intuitive Electron.js frontend for a seamless user experience. It can refine, translate, and even vocalize recognized sign language, making it an inclusive and impactful communication tool.

---

## 📏 Key Features

- ✌️ **Sign Language Detection**: Real-time hand tracking and gesture classification using MediaPipe and Random Forest classifier.
- ⌨️ **Text Refinement**: Spelling and grammar correction using TextBlob.
- 🌐 **Language Translation**: Translate to Hindi, Japanese, or Korean using Google Translate API.
- 🎤 **Text-to-Speech**: Converts text to speech using gTTS.
- ✨ **Modern UI**: Clean, responsive interface built with HTML, CSS, and JavaScript powered by Electron.js.

---

## 📁 Project Structure

```
RTSL-translation-Python-Electron
├── main/                     # Python backend
│   ├── inference.py          # Flask server for processing and predictions
│   └── model.p               # Trained Random Forest model
│
├── electron/                # Electron frontend
│   ├── src/
│   │   ├── index.html        # UI layout
│   │   ├── renderer.js       # Frontend logic (camera, prediction, API calls)
│   │   └── style.css         # UI styles
│   ├── main.js               # Electron main process
│   ├── preload.js            # (empty)
│   ├── python-server.js      # Alternative python server control
│   └── package.json          # Electron app configuration
│
├── create_dataset.py        # Dataset generation script (initial project)
├── train_classifier.py      # Model training script
├── data/                    # Contains folders 0 to 27 with hand sign images
└── README.md                # You are here!
```

---

## 🎓 Dataset & Labels

- **Dataset Path**: `data/`
- **Structure**: 28 folders (`0` to `27`) each containing 100 images of specific sign letters.
- **Label Mapping**:

```python
labels_dict = {
    0: 'A', 1: 'B', ..., 25: 'Z', 26: 'del', 27: 'space'
}
```

---

## ⚖️ Model Training

The `train_classifier.py` uses `RandomForestClassifier` from `scikit-learn` to train on 42-dimensional hand landmark vectors extracted from images via MediaPipe:

```bash
python create_dataset.py
python train_classifier.py
```
- Output: `model.p` (pickle file storing trained model)

---

## 🚀 Getting Started

### ✅ Prerequisites

- Python 3.8+
- Node.js + npm
- pip packages:
  - `opencv-python`
  - `mediapipe`
  - `flask`
  - `googletrans==4.0.0-rc1`
  - `textblob`
  - `gTTS`
  - `scikit-learn`
  - `numpy`

### 🚪 Backend Setup

```bash
cd main
python inference.py
```

### 🌐 Frontend Setup

```bash
cd electron
npm install
npm start
```

> The frontend will automatically communicate with the Flask backend at `localhost:5000`.

---

## 📅 Features in Action

- **Live Video Feed**: Detects and predicts sign gestures.
- **Text Assembly**: Buffers predictions and forms sentences.
- **Text Refinement**: Improves sentence structure with AI-based correction.
- **Multilingual Translation**: Translates to Hindi, Japanese, Korean.
- **Text-to-Speech**: Listen to both original and translated outputs.

---

## 🔧 Packaging for Deployment

To package as a desktop app:

```bash
npm run make
```
- Generates a Windows installer using `electron-forge`
- `packagerConfig` ensures model and Python scripts are bundled correctly

---

## 🚀 Future Enhancements

- Expand gesture vocabulary (add more classes)
- Support dynamic gestures using LSTM/CNN-RNN
- Add support for more translation languages
- Offline speech synthesis
- Mobile version (React Native / Flutter)

---

## 📄 License

This project is licensed under the MIT License.

---

## 📗 Acknowledgments

- [MediaPipe by Google](https://mediapipe.dev/)
- [Google Translate API](https://pypi.org/project/googletrans/)
- [gTTS (Google Text-to-Speech)](https://pypi.org/project/gTTS/)
- [TextBlob](https://textblob.readthedocs.io/en/dev/)
- [Electron.js](https://www.electronjs.org/)

---

Built with ❤️ by **Shivan Anand**, **Anirudh Shukla**, and **Hardik Singh**