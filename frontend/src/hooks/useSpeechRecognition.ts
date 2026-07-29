import { useState, useRef, useCallback, useEffect } from "react";

export type SpeechLang = "km-KH" | "en-US";

const LANG_LABELS: Record<SpeechLang, string> = {
  "km-KH": "ភាសាខ្មែរ",
  "en-US": "English",
};

export function getLangLabel(lang: SpeechLang): string {
  return LANG_LABELS[lang];
}

export interface UseSpeechRecognitionOptions {
  /** Called with the final transcript when recognition completes */
  onResult?: (transcript: string) => void;
  /** Called on error */
  onError?: (error: string) => void;
}

export interface UseSpeechRecognitionReturn {
  /** Whether the browser supports SpeechRecognition */
  supported: boolean;
  /** Whether we are currently listening */
  listening: boolean;
  /** Current interim transcript (real-time) */
  interim: string;
  /** The language being recognized */
  lang: SpeechLang;
  /** Set the recognition language */
  setLang: (lang: SpeechLang) => void;
  /** Start listening */
  start: () => void;
  /** Stop listening and return the final transcript */
  stop: () => void;
  /** Toggle between Khmer and English */
  toggleLang: () => void;
}

/**
 * Hook wrapping the Web Speech API (SpeechRecognition) for Khmer & English.
 * Falls back gracefully if the API is not available.
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionReturn {
  const { onResult, onError } = options;

  const [supported] = useState(() => {
    return !!(
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  });
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [lang, setLangState] = useState<SpeechLang>("km-KH");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalRef = useRef("");
  const interimRef = useRef("");

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const initRecognition = useCallback((): SpeechRecognition | null => {
    if (!supported) return null;
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return null;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    return recognition;
  }, [supported, lang]);

  const start = useCallback(() => {
    if (!supported) {
      onError?.("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    // Clean up previous instance
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* noop */ }
      recognitionRef.current = null;
    }

    const recognition = initRecognition();
    if (!recognition) {
      onError?.("Speech recognition is not supported in this browser.");
      return;
    }

    finalRef.current = "";
    interimRef.current = "";
    setInterim("");

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalText) {
        finalRef.current += finalText;
      }
      interimRef.current = interimText;
      setInterim(interimText);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn("Speech recognition error:", event.error, event.message);
      setListening(false);
      setInterim("");

      const messages: Record<string, string> = {
        "not-allowed": "Microphone access was denied. Please allow microphone permissions and try again.",
        "no-speech": "No speech detected. Please try again.",
        "audio-capture": "No microphone found. Please connect a microphone.",
        "language-not-supported": `Language "${lang}" is not supported for speech recognition. Try English instead.`,
        "network": "Network error during speech recognition.",
        "aborted": "",
        "service-not-allowed": "Speech service is not available.",
      };
      const msg = messages[event.error] || `Speech error: ${event.error}`;
      if (msg) onError?.(msg);
    };

    recognition.onend = () => {
      setListening(false);
      // If recognition ends on its own (not via stop()), return the accumulated text
      const transcript = (finalRef.current + " " + interimRef.current).trim();
      finalRef.current = "";
      interimRef.current = "";
      setInterim("");
      if (transcript) {
        onResult?.(transcript);
      }
    };

    try {
      recognition.start();
      setListening(true);
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      onError?.("Failed to start speech recognition. Please try again.");
      setListening(false);
    }
  }, [supported, initRecognition, onError, lang, onResult]);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setListening(false);
      return;
    }

    try {
      recognition.stop();
    } catch {
      // Ignore if already stopped
    }
    recognitionRef.current = null;
    setListening(false);

    const transcript = (finalRef.current + " " + interim).trim();
    setInterim("");
    finalRef.current = "";
    interimRef.current = "";

    if (transcript) {
      onResult?.(transcript);
    }
  }, [onResult, interim]);

  const setLang = useCallback((newLang: SpeechLang) => {
    const wasListening = listening;
    if (wasListening) {
      try { recognitionRef.current?.stop(); } catch { /* noop */ }
      recognitionRef.current = null;
      setListening(false);
    }
    setLangState(newLang);
  }, [listening]);

  const toggleLang = useCallback(() => {
    setLangState(prev => prev === "km-KH" ? "en-US" : "km-KH");
  }, []);

  return {
    supported,
    listening,
    interim,
    lang,
    setLang,
    start,
    stop,
    toggleLang,
  };
}
