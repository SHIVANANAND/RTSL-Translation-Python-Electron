const videoFeed = document.getElementById('videoFeed');
const toggleCameraBtn = document.getElementById('toggleCamera');
const translationBox = document.getElementById('translationBox');
const refineBtn = document.getElementById('refineBtn');
const languageSelect = document.getElementById('languageTranslation');
const specificLanguageBox = document.getElementById('specificLanguageTranslationBox');

let eventSource = null;
let cameraOn = false;
let predictionBuffer = [];
let lastAppendTime = 0;
let currentText = '';

// Toggle camera
toggleCameraBtn.addEventListener('click', async () => {
    if (!cameraOn) {
        try {
            const response = await fetch('http://localhost:5000/start_camera', {
                method: 'POST'
            });
            
            if (response.ok) {
                cameraOn = true;
                toggleCameraBtn.textContent = 'Turn off Camera';
                videoFeed.classList.add('active');
                
                // Start receiving video stream
                eventSource = new EventSource('http://localhost:5000/video_feed');
                
                eventSource.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    videoFeed.src = `data:image/jpeg;base64,${data.frame}`;
                    
                    if (data.prediction) {
                        processPrediction(data.prediction);
                    }
                };
            }
        } catch (err) {
            console.error("Error starting camera:", err);
            videoFeed.classList.remove('active');
        }
    } else {
        try {
            await fetch('http://localhost:5000/stop_camera', {
                method: 'POST'
            });
            
            if (eventSource) {
                eventSource.close();
            }
            
            cameraOn = false;
            toggleCameraBtn.textContent = 'Turn on Camera';
            videoFeed.classList.remove('active');
            videoFeed.src = '';
            clearPredictionBuffer();
        } catch (err) {
            console.error("Error stopping camera:", err);
        }
    }
});

function processPrediction(prediction) {
    const now = Date.now();
    
    // Handle special cases
    if (prediction === 'space') {
        prediction = ' ';
    } else if (prediction === 'del') {
        if (currentText.length > 0) {
            currentText = currentText.slice(0, -1);
            translationBox.textContent = currentText;
        }
        clearPredictionBuffer();
        return;
    }
    
    // Add to buffer
    if (!predictionBuffer.includes(prediction)) {
        predictionBuffer.push(prediction);
    }
    
    // Append to text every 5 seconds
    if (now - lastAppendTime >= 5000 && predictionBuffer.length > 0) {
        const mostFrequentPrediction = getMostFrequentPrediction();
        currentText += mostFrequentPrediction;
        translationBox.textContent = currentText;
        lastAppendTime = now;
        clearPredictionBuffer();
    }
}

function getMostFrequentPrediction() {
    const frequency = {};
    predictionBuffer.forEach(p => {
        frequency[p] = (frequency[p] || 0) + 1;
    });
    return Object.keys(frequency).reduce((a, b) => 
        frequency[a] > frequency[b] ? a : b
    );
}

function clearPredictionBuffer() {
    predictionBuffer = [];
}

refineBtn.addEventListener('click', async () => {
    if (!currentText || currentText.trim().length === 0) {
        console.log("No text to refine");
        return;
    }

    // Show loading state
    refineBtn.disabled = true;
    refineBtn.textContent = "Refining...";

    try {
        const response = await fetch('http://localhost:5000/refine_text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: currentText })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            translationBox.textContent = result.refined;
            currentText = result.refined;
            console.log("Refined text:", result.refined);
        } else {
            console.error("Refinement failed:", result.error);
            // Fallback to client-side correction
            const fallbackCorrected = currentText
                .replace(/\blov\b/g, 'love')
                .replace(/\bhelo\b/g, 'hello')
                .replace(/\bi\b/g, 'I');
            translationBox.textContent = fallbackCorrected;
            currentText = fallbackCorrected;
        }
    } catch (error) {
        console.error("Refinement error:", error);
        // Basic fallback
        translationBox.textContent = currentText
            .replace(/\bi\b/g, 'I')
            .replace(/([.!?])\s*(\w)/g, (_, p1, p2) => `${p1} ${p2.toUpperCase()}`);
    } finally {
        // Reset button state
        refineBtn.disabled = false;
        refineBtn.textContent = "Refine";
    }
});


let availableLanguages = {};

// Fetch available languages on startup
async function loadLanguages() {
    try {
        const response = await fetch('http://localhost:5000/get_languages');
        const data = await response.json();
        availableLanguages = data.languages;
        console.log("Loaded languages:", availableLanguages);
    } catch (error) {
        console.error("Couldn't load languages:", error);
        // Fallback to default languages
        availableLanguages = {
            'Hindi': 'hi',
            'Japanese': 'ja',
            'Korean': 'ko'
        };
    }
}

// Call this when your app starts
loadLanguages();

// Translation handler
languageSelect.addEventListener('change', async (e) => {
    if (!currentText || currentText.trim().length === 0) {
        console.log("No text to translate");
        return;
    }

    const languageName = e.target.value;
    const languageCode = availableLanguages[languageName];
    
    if (!languageCode) {
        console.error("No language code found for:", languageName);
        return;
    }

    specificLanguageBox.textContent = "Translating...";

    try {
        const response = await fetch('http://localhost:5000/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: currentText,
                target_lang: languageCode
            })
        });

        const result = await response.json();

        if (result.success) {
            specificLanguageBox.textContent = `${result.translated}`;
        } else {
            specificLanguageBox.textContent = `Translation failed: ${result.error || 'Unknown error'}`;
        }
    } catch (error) {
        console.error("Translation error:", error);
        specificLanguageBox.textContent = "Translation service unavailable";
    }
});

const speakOriginalBtn = document.getElementById('speakOriginalBtn');
const speakTranslatedBtn = document.getElementById('speakTranslatedBtn');
let audioElement = new Audio();

// Speak original text
speakOriginalBtn.addEventListener('click', async () => {
    if (!currentText) return;
    
    try {
        speakOriginalBtn.disabled = true;
        const response = await fetch('http://localhost:5000/speak_text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: currentText, lang: 'en' })
        });
        
        if (response.ok) {
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            audioElement.src = audioUrl;
            audioElement.play();
        }
    } catch (error) {
        console.error("Speech error:", error);
    } finally {
        speakOriginalBtn.disabled = false;
    }
});

// Speak translated text
speakTranslatedBtn.addEventListener('click', async () => {
    const translatedText = specificLanguageBox.textContent;
    if (!translatedText || translatedText.includes("Translating") || translatedText.includes("failed")) return;
    
    try {
        speakTranslatedBtn.disabled = true;
        const languageCode = availableLanguages[languageSelect.value];
        const response = await fetch('http://localhost:5000/speak_text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: translatedText, 
                lang: languageCode 
            })
        });
        
        if (response.ok) {
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            audioElement.src = audioUrl;
            audioElement.play();
        }
    } catch (error) {
        console.error("Translation speech error:", error);
    } finally {
        speakTranslatedBtn.disabled = false;
    }
});

// Clean up audio on page exit
window.addEventListener('beforeunload', () => {
    if (audioElement) {
        audioElement.pause();
        URL.revokeObjectURL(audioElement.src);
    }
});