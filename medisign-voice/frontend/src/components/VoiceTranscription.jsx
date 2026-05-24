import { useEffect, useRef, useState } from 'react';

const SPEECH_LANGUAGES = {
  en: 'en-US',
  ta: 'ta-IN',
  si: 'si-LK',
};

export default function VoiceTranscription({
  onTranscript,
  language = 'en',
  disabled = false,
  showToast,
}) {
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState('');

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast?.('Voice transcription is not supported in this browser. Try Chrome or Edge.', 'error');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = SPEECH_LANGUAGES[language] || SPEECH_LANGUAGES.en;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setListening(true);
      setInterimText('');
    };
    recognition.onresult = (event) => {
      let finalText = '';
      let interim = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript.trim();
        if (event.results[index].isFinal) finalText += `${transcript} `;
        else interim += `${transcript} `;
      }
      if (finalText.trim()) onTranscript(finalText.trim());
      setInterimText(interim.trim());
    };
    recognition.onerror = (event) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        showToast?.(`Microphone transcription failed: ${event.error}`, 'error');
      }
    };
    recognition.onend = () => {
      setListening(false);
      setInterimText('');
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch {
      showToast?.('Unable to start microphone transcription.', 'error');
    }
  };

  return (
    <div className="transcription-controls">
      <button
        type="button"
        className={`btn btn-transcribe ${listening ? 'listening' : ''}`}
        onClick={toggleListening}
        disabled={disabled}
      >
        {listening ? 'Stop Listening' : 'Voice to Text'}
      </button>
      {listening && (
        <span className="transcription-status">
          Listening{interimText ? `: ${interimText}` : '...'}
        </span>
      )}
    </div>
  );
}
