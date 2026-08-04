import React, { useState, useEffect } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";

/**
 * VoiceSymptomInput component integrates the browser's Web Speech API
 * configured to listen for Bengali (bn-BD) vocal speech and map it to text.
 */
export default function VoiceSymptomInput({ onTranscript }) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("আপনার ব্রাউজারে ভয়েস টাইপিং সমর্থিত নয়। অনুগ্রহ করে ক্রোম ব্যবহার করুন।");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "bn-BD"; // Configure speech recognition for Bengali (Bangladesh)

    rec.onstart = () => {
      setIsListening(true);
      setError("");
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        setError("মাইক্রোফোন ব্যবহারের অনুমতি নেই। ব্রাউজার সেটিংসে অনুমতি দিন।");
      } else {
        setError("ভয়েস সনাক্ত করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }
    };

    rec.onresult = (event) => {
      const transcriptText = event.results[0][0].transcript;
      if (transcriptText && onTranscript) {
        onTranscript(transcriptText);
      }
    };

    setRecognition(rec);
  }, [onTranscript]);

  const toggleListen = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error("Failed to start voice recognition:", err);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-2 w-full font-sans">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleListen}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition duration-300 border cursor-pointer shadow-xs ${
            isListening
              ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-600 animate-pulse"
              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4 animate-spin" /> ভয়েস বন্ধ করুন
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-emerald-600" /> বাংলায় ভয়েস ইনপুট
            </>
          )}
        </button>
        {isListening && (
          <span className="text-xs text-rose-500 font-bold animate-pulse">
            ● কথা বলুন (রেকর্ডিং হচ্ছে)...
          </span>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-semibold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 w-fit">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}
    </div>
  );
}
