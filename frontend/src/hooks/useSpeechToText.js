// hooks/useSpeechToText.js
import { useRef, useState } from 'react';

// language: 'en' | 'hi' | 'te' | 'bn' | 'mr' | 'kn'
export const useSpeechToText = (language = 'en') => {
  const [listening, setListening] = useState(false);
  const [text, setText] = useState('');
  const recognitionRef = useRef(null);

  const mapLangToLocale = (lang) => {
    switch (lang) {
      case 'hi':
        return 'hi-IN';
      case 'te':
        return 'te-IN';
      case 'bn':
        return 'bn-IN';
      case 'mr':
        return 'mr-IN';
      case 'kn':
        return 'kn-IN';
      case 'en':
      default:
        return 'en-IN';
    }
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();

    // set STT language based on app language
    recognition.lang = mapLangToLocale(language);
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setText((prev) => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return { listening, text, setText, startListening, stopListening };
};
