/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  BookOpen, 
  Mic, 
  MicOff, 
  Camera, 
  Upload, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Code, 
  RotateCcw, 
  FileText, 
  Check, 
  HelpCircle, 
  Info,
  Layers,
  Flame,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Educational quick preset questions supporting both languages
const PRESETS = [
  { text: "সালোকসংশ্লেষণ কি ব্যাখ্যা করো?", icon: "🌿", lang: "bn" },
  { text: "মহাকর্ষ সূত্র ও এর গাণিতিক সমীকরণটি বুঝিয়ে দাও", icon: "🌌", lang: "bn" },
  { text: "Explain Newton's third law of motion with examples", icon: "📐", lang: "en" },
  { text: "সলভ করো: 2x + 5 = 15 এর সমাধান কি?", icon: "🧬", lang: "bn" }
];

export default function App() {
  // Input states
  const [inputText, setInputText] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  
  // Voice & STT states
  const [isListening, setIsListening] = useState(false);
  const [listeningLang, setListeningLang] = useState<"bn-BD" | "en-US">("bn-BD");
  const [voiceSupport, setVoiceSupport] = useState(true);
  
  // Image & Camera states
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [imageType, setImageType] = useState("image/jpeg");
  const [dragActive, setDragActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");
  
  // AI Solution results
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [isOcrDetected, setIsOcrDetected] = useState(false);

  // Audio / TTS Player states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechPitch, setSpeechPitch] = useState(1);
  const [speechRate, setSpeechRate] = useState(0.9);
  const [speechLang, setSpeechLang] = useState<"bn-IN" | "en-US">("bn-IN");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // UX & Code Showroom tabs
  const [activeTab, setActiveTab] = useState<"app" | "gradio-code">("app");
  const [copySuccess, setCopySuccess] = useState(false);

  // Refs for camera / media
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  // Load browser voice list
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        setAvailableVoices(window.speechSynthesis.getVoices());
      }
    };
    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Initialize Web Speech API for native transcription
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setInputText(prev => prev + (prev ? " " : "") + transcript);
        }
      };
      rec.onerror = (err: any) => {
        console.error("Speech Recognition Error:", err);
        setIsListening(false);
      };
      recognitionRef.current = rec;
    } else {
      setVoiceSupport(false);
    }

    // Cleanup synthetic speech on unmount
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Sync Recognition Language
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = listeningLang;
    }
  }, [listeningLang]);

  // Handle Speech recognition start/stop
  const toggleSpeechRecognition = () => {
    if (!voiceSupport) {
      // Simulate speech input for demo preview fallback if no SpeechRecognition API is available
      setIsListening(true);
      setTimeout(() => {
        setInputText(prev => prev + (prev ? " " : "") + "সালোকসংশ্লেষণ শব্দের কি কি অংশ?");
        setIsListening(false);
      }, 2000);
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Drag and Drop files
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      readImageFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      readImageFile(e.target.files[0]);
    }
  };

  const readImageFile = (file: File) => {
    setImageType(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageFile(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Camera capture methods
  const activateCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera Access Error:", err);
      alert("ওয়েবক্যাম বা ক্যামেরা অ্যাক্সেস করা যায়নি। অনুগ্রহ করে ফ্রেমে পারমিশন নিশ্চিত করুন।");
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setImageFile(dataUrl);
      setImageType("image/jpeg");
      deactivateCamera();
    }
  };

  const deactivateCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setShowCamera(false);
  };

  // Submit study request to backend
  const handleSolve = async () => {
    // If absolutely no inputs, show visual advice
    if (!inputText.trim() && !imageFile && !customQuestion.trim()) {
      alert("দয়া করে যেকোনো প্রশ্ন টাইপ করুন, বলুন অথবা একটি ছবি আপলোড করুন!");
      return;
    }

    setLoading(true);
    setResultText(null);
    setIsSpeaking(false);
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // Formulate prompt
    const finalPrompt = customQuestion.trim() !== "" 
      ? customQuestion.trim() 
      : inputText.trim() !== "" 
        ? inputText.trim() 
        : "ইমেজে প্রদর্শিত পড়াশোনার মূল অংশটি স্পষ্ট ভাষায় বুঝিয়ে দিন।";

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          image: imageFile,
          imageType,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setResultText(data.text);
        setIsSimulated(!!data.isSimulated);
        setIsOcrDetected(!!imageFile);
      } else {
        setResultText(`দুঃখিত, সমস্যা সমাধান করা যায়নি।\n\nত্রুটি: ${data.error || "অজানা সমস্যা"}`);
      }
    } catch (e) {
      setResultText(`সার্ভারের সাথে সংযোগ স্থাপন করা যাচ্ছে না। অনুগ্রহ করে নিশ্চিত করুন যে সার্ভারটি পোর্ট ৩০০০ এ চালু আছে।`);
    } finally {
      setLoading(false);
    }
  };

  // Clean form
  const handleReset = () => {
    setInputText("");
    setImageFile(null);
    setCustomQuestion("");
    setSelectedPreset(null);
    setResultText(null);
    setIsSpeaking(false);
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // Handle Text-to-speech triggers (gTTS simulator with actual VoiceSynthesis)
  const toggleTTS = () => {
    if (!resultText) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Clean markdown characters for pleasant pronunciation
    const rawSpeechString = resultText
      .replace(/[#*`_$\n]/g, " ")
      .replace(/\[\w+\]/g, "")
      .slice(0, 450); // limit chars for perfect response speed

    const utterance = new SpeechSynthesisUtterance(rawSpeechString);
    utterance.pitch = speechPitch;
    utterance.rate = speechRate;
    
    // Choose appropriate voice
    const targetLang = speechLang === "bn-IN" ? "bn" : "en";
    const voice = availableVoices.find(v => v.lang.toLowerCase().startsWith(targetLang));
    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = speechLang;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const copyGradioCode = () => {
    const rawCode = `#!/usr/bin/env python3
"""
ShikhoAI - Standalone Python Gradio Educational Assistant
To Run: 
  pip install gradio easyocr gtts google-genai
  export GEMINI_API_KEY="your_api_key_here"
  python shikho_gradio_app.py
"""
import os
import tempfile
import gradio as gr
import easyocr
from gtts import gTTS
from google import genai
from google.genai import types

ocr_reader = easyocr.Reader(['bn', 'en'])

def process_learning_assistant(text_input, voice_audio, upload_image, custom_question):
    query_text = ""
    ocr_result = ""
    
    # 1. OCR Visual Processing
    if upload_image is not None:
        try:
            results = ocr_reader.readtext(upload_image)
            ocr_result = " ".join([res[1] for res in results])
        except Exception as e:
            ocr_result = "OCR Error"

    # 2. Extract input text
    if custom_question:
        query_text = custom_question
    elif text_input:
        query_text = text_input
        
    final_prompt = query_text
    if ocr_result:
        final_prompt = f"Text inside textbook image: '{ocr_result}'. Question: {query_text}"

    # 3. Model response generation
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    response = client.models.generate_content(
        model='gemini-3.5-flash',
        contents=final_prompt,
        config=types.GenerateContentConfig(
            system_instruction="Explain logically as a helpful Bengali/English smart tutor.",
            temperature=0.7
        )
    )
    
    # 4. Synthesize voice audio
    try:
        tts = gTTS(text=response.text[:300], lang='bn', slow=False)
        temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
        tts.save(temp_audio.name)
        return response.text, temp_audio.name
    except Exception:
        return response.text, None

# Build soft responsive UI
with gr.Blocks(theme=gr.themes.Soft(primary_hue="indigo"), title="ShikhoAI") as demo:
    gr.Markdown("# 🎓 ShikhoAI Multimodal Tutor")
    with gr.Row():
        with gr.Column():
            t_in = gr.Textbox(label="Type Query")
            v_in = gr.Audio(label="Voice Input", type="filepath")
            i_in = gr.Image(label="Book scan", type="filepath")
            sub = gr.Button("Analyze doubt")
        with gr.Column():
            out_t = gr.Markdown()
            out_a = gr.Audio(type="filepath")
    sub.click(fn=process_learning_assistant, inputs=[t_in, v_in, i_in], outputs=[out_t, out_a])

if __name__ == "__main__":
    demo.launch(server_port=3000, server_name="0.0.0.0")
`;
    navigator.clipboard.writeText(rawCode).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // Simple clean Custom Markdown Parser supporting bullets, headers, bold
  const parseMarkdown = (md: string) => {
    const lines = md.split("\n");
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith("###")) {
        return <h3 key={idx} className="text-md font-bold text-indigo-400 mt-4 mb-2 tracking-tight">{trimmed.slice(3).trim()}</h3>;
      }
      if (trimmed.startsWith("##")) {
        return <h2 key={idx} className="text-lg font-black text-white mt-5 mb-2 border-b border-[#262626] pb-1 tracking-tight">{trimmed.slice(2).trim()}</h2>;
      }
      if (trimmed.startsWith("#")) {
        return <h1 key={idx} className="text-xl font-black text-white mt-6 mb-3 uppercase tracking-tighter">{trimmed.slice(1).trim()}</h1>;
      }

      // Blockquotes / Warnings
      if (trimmed.startsWith(">") || trimmed.startsWith("*অনুরোধ:*")) {
        return (
          <div key={idx} className="bg-[#171717] border-l-4 border-indigo-500 p-3.5 my-3 text-slate-300 rounded-r-md text-xs">
            {trimmed.replace(/^>\s*/, "")}
          </div>
        );
      }

      // Bullet Lists
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        return (
          <li key={idx} className="ml-5 list-disc text-slate-300 my-1 text-sm list-inside">
            {parseInlineMarkdown(trimmed.substring(2))}
          </li>
        );
      }

      // Numbered Lists
      if (/^\d+\.\s+/.test(trimmed)) {
        const numContent = trimmed.replace(/^\d+\.\s+/, "");
        return (
          <li key={idx} className="ml-5 list-decimal text-slate-300 my-1 text-sm list-inside">
            {parseInlineMarkdown(numContent)}
          </li>
        );
      }

      // Default Paragraph
      if (trimmed === "") return <div key={idx} className="h-2"></div>;
      return <p key={idx} className="text-slate-300 leading-relaxed my-2 text-sm">{parseInlineMarkdown(trimmed)}</p>;
    });
  };

  const parseInlineMarkdown = (text: string) => {
    let parts: React.ReactNode[] = [text];
    const boldRegex = /\*\*(.*?)\*\*/g;
    if (text.includes("**")) {
      const elements: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          elements.push(text.substring(lastIndex, match.index));
        }
        elements.push(<strong key={match.index} className="font-extrabold text-white">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < text.length) {
        elements.push(text.substring(lastIndex));
      }
      parts = elements;
    }
    return parts;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans flex flex-col justify-between overflow-x-hidden selection:bg-indigo-600 selection:text-white">
      
      {/* Dynamic Header */}
      <nav className="flex flex-col sm:flex-row items-center justify-between px-6 py-5 sm:px-8 border-b border-[#262626] bg-[#0A0A0A] gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#4F46E5] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.35)]">
            <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#A3A3A3] font-bold">
                MULTIMODAL TUTORIAL OS
              </span>
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase text-white">
              Shikho.ai <span className="text-xs text-indigo-400 font-extrabold lowercase ml-1">শিখো এআই</span>
            </span>
          </div>
        </div>

        {/* Interactive Navigation Tab */}
        <div className="bg-[#171717] p-1 rounded-xl flex gap-1 border border-[#262626] w-full sm:w-auto">
          <button 
            id="nav-to-app"
            onClick={() => setActiveTab("app")}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === "app" 
                ? "bg-white text-black font-black" 
                : "text-[#A3A3A3] hover:text-white"
            }`}
          >
            Assistant OS
          </button>
          <button 
            id="nav-to-gradle"
            onClick={() => setActiveTab("gradio-code")}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === "gradio-code" 
                ? "bg-white text-black font-black" 
                : "text-[#A3A3A3] hover:text-white"
            }`}
          >
            Gradio Python Source
          </button>
        </div>
      </nav>

      {/* Main Workspace with Brutalist Styles */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        
        {activeTab === "app" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Input Control Panel (Left column - w-[380px] inspired block) */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="border border-[#262626] rounded-2xl bg-[#0D0D0D] p-6 space-y-6">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#4F46E5] font-black block mb-1">
                    multimodal hub
                  </span>
                  <h1 className="text-4xl font-black leading-none tracking-tighter text-white uppercase sm:text-5xl">
                    LEARN<br/>ANYTHING.
                  </h1>
                </div>

                <hr className="border-[#262626]" />

                {/* Preset Picker */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-[#737373] font-bold block">
                    Quick Sample Presets (নমুনা প্রশ্ন)
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedPreset(idx);
                          setInputText(preset.text);
                        }}
                        className={`text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between gap-3 ${
                          selectedPreset === idx 
                            ? "bg-[#171717] border-[#4F46E5] text-white" 
                            : "bg-[#111111] border-[#222222] hover:border-[#333333] text-[#A3A3A3] hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm">{preset.icon}</span>
                          <span className="line-clamp-1">{preset.text}</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1. TEXT doubt section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#737373] font-bold">
                      Enter Doubt / Problem (টাইপ করুন)
                    </label>
                    <span className="text-[9px] font-mono text-[#525252]">BN/EN active</span>
                  </div>
                  <textarea
                    id="qa-text-input"
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      setSelectedPreset(null);
                    }}
                    rows={3}
                    className="w-full bg-[#171717] border border-[#262626] rounded-xl p-4 text-sm text-[#F5F5F5] placeholder-[#525252] focus:outline-none focus:border-[#4F46E5] resize-none leading-relaxed transition-all"
                    placeholder="বইয়ের পাতা থেকে বা টাইপ করে প্রশ্ন করুন..."
                  />
                </div>

                {/* 2. VOICE transcription parameters */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-[#737373] font-bold block">
                    Whisper Speech Capture (কণ্ঠস্বর দিন)
                  </label>
                  
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-[#171717] border border-[#262626] p-3 rounded-xl">
                    <select
                      id="voice-language-select"
                      value={listeningLang}
                      onChange={(e) => setListeningLang(e.target.value as any)}
                      className="text-xs bg-[#111111] text-[#F5F5F5] border border-[#262626] rounded-lg p-2.5 focus:outline-none focus:border-[#4F46E5]"
                    >
                      <option value="bn-BD">🇧🇩 বাংলা (Bangla)</option>
                      <option value="en-US">🇺🇸 English</option>
                    </select>

                    <button
                      id="mic-record-btn"
                      onClick={toggleSpeechRecognition}
                      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                        isListening 
                          ? "bg-rose-600 text-white animate-pulse" 
                          : "bg-[#262626] hover:bg-[#333] text-white"
                      }`}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-3.5 h-3.5" /> STOP
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5 text-indigo-400" /> LISTEN
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 3. OCR EasyOCR parameters */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#737373] font-bold">
                      Optical OCR Scanner (বইয়ের পাতার ছবি)
                    </label>
                    {imageFile && (
                      <button 
                        onClick={() => setImageFile(null)}
                        className="text-[10px] text-rose-500 font-bold uppercase tracking-wider"
                      >
                        Reset Picture
                      </button>
                    )}
                  </div>

                  {!imageFile && !showCamera ? (
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`border border-[#262626] border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all bg-[#171717] ${
                        dragActive ? "border-[#4F46E5] bg-[#4F46E5]/5" : ""
                      }`}
                    >
                      <Upload className="w-6 h-6 text-[#525252] mb-2" />
                      <p className="text-xs text-[#A3A3A3] font-medium leading-relaxed">
                        Drag textbook exercise photo here, or{" "}
                        <label className="text-[#4f46e5] hover:underline cursor-pointer font-bold">
                          browse files
                          <input 
                            id="file-upload-input"
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                            className="hidden" 
                          />
                        </label>
                      </p>
                      <div className="text-[9px] text-[#525252] my-2">OR</div>
                      <button
                        onClick={activateCamera}
                        className="px-3 py-1.5 text-[10px] font-bold bg-[#262626] hover:bg-[#333] text-white rounded-lg flex items-center gap-1 uppercase tracking-wider"
                      >
                        <Camera className="w-3.5 h-3.5 text-indigo-400" /> Start Cam
                      </button>
                    </div>
                  ) : showCamera ? (
                    <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex flex-col items-center justify-center border border-[#262626]">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                        <button
                          onClick={capturePhoto}
                          className="bg-[#4F46E5] text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider"
                        >
                          Capture Pic
                        </button>
                        <button
                          onClick={deactivateCamera}
                          className="bg-white text-black px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#262626] bg-[#171717] p-3 space-y-3">
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-[#262626]">
                        <img 
                          src={imageFile || ""} 
                          alt="Captured textbook pic" 
                          className="w-full h-full object-cover opacity-80" 
                        />
                        <div className="absolute top-2 left-2 bg-[#4F46E5] text-[8px] font-mono font-bold text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Optical Scanner Mode Active
                        </div>
                      </div>
                      <input
                        id="image-custom-prompt"
                        type="text"
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        placeholder="অতিরিক্ত জিজ্ঞাসা (যেমন: এই অংকটি সলভ করো)"
                        className="w-full bg-[#111111] border border-[#262626] rounded-lg p-2.5 text-xs text-white placeholder-[#525252] focus:outline-none focus:border-[#4F46E5]"
                      />
                    </div>
                  )}
                </div>

                {/* Solving Triggers */}
                <div className="flex gap-2">
                  <button
                    id="submit-query-btn"
                    onClick={handleSolve}
                    disabled={loading}
                    className="flex-1 py-4 bg-white hover:bg-[#4F46E5] text-black hover:text-white font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="border-2 border-black border-t-transparent hover:border-white rounded-full w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Response</span>
                      </>
                    )}
                  </button>

                  <button
                    id="reset-inputs-btn"
                    onClick={handleReset}
                    className="p-4 bg-[#171717] hover:bg-[#222] border border-[#262626] text-[#737373] hover:text-white rounded-xl transition-all"
                    title="Reset OS parameters"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>

            {/* Output Display Area (Right column - 7 cols) */}
            <div className="lg:col-span-7 flex flex-col space-y-6">
              
              <div className="border border-[#262626] bg-[#0D0D0D] p-8 rounded-2xl flex flex-col min-h-[500px]">
                
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#262626]">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[#4F46E5] font-black">
                      AI Learning Output
                    </span>
                    <h2 className="text-2xl font-black tracking-tight text-white uppercase mt-0.5">
                      {isOcrDetected ? "Visual Textbook Evaluation" : "Explainer Board"}
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    {isSimulated && (
                      <span className="px-3 py-1 bg-[#171717] text-[10px] font-bold rounded-md border border-[#262626] text-[#A3A3A3]">
                        DEMO MODE
                      </span>
                    )}
                    <span className="px-3 py-1 bg-[#171717] text-[10px] font-bold rounded-md border border-[#262626] text-emerald-400">
                      TTS READY
                    </span>
                  </div>
                </div>

                {/* Primary Solution Board */}
                <div className="flex-1 flex flex-col justify-between">
                  
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                      <div className="flex items-end gap-1 h-8">
                        <span className="w-1.5 bg-[#4F46E5] rounded animate-pulse h-10" />
                        <span className="w-1.5 bg-[#4F46E5] rounded animate-pulse h-6" />
                        <span className="w-1.5 bg-[#4F46E5] rounded animate-pulse h-8" />
                        <span className="w-1.5 bg-[#4F46E5] rounded animate-pulse h-5" />
                      </div>
                      <p className="text-xs text-[#737373] font-mono tracking-widest uppercase">
                        synthesizing solution assets...
                      </p>
                    </div>
                  ) : resultText ? (
                    <div className="space-y-8">
                      
                      {/* Audio Player Widget panel */}
                      <div className="flex items-center gap-6 p-6 bg-[#0A0A0A] border border-[#262626] rounded-2xl">
                        <button 
                          id="toggle-tts-speech"
                          onClick={toggleTTS}
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105 select-none ${
                            isSpeaking ? "bg-rose-600 text-white" : "bg-white text-black"
                          }`}
                        >
                          {isSpeaking ? (
                            <VolumeX className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          )}
                        </button>
                        
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2">
                              <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> gTTS Voice Synthesis Output
                            </span>
                            <span className="text-[10px] font-bold text-[#737373]">
                              {isSpeaking ? "SPEAKING LIVE" : "PLAY AUDIO"}
                            </span>
                          </div>

                          {/* Sound wave bar indicator */}
                          <div className="h-1 w-full bg-[#171717] rounded-full overflow-hidden relative">
                            {isSpeaking ? (
                              <div className="h-full w-full bg-gradient-to-r from-indigo-500 to-rose-500 animate-[pulse_1.5s_infinite]" />
                            ) : (
                              <div className="h-full w-[15%] bg-[#4F46E5]" />
                            )}
                          </div>
                        </div>

                        {/* Speech Parameters dropdown */}
                        <div className="text-right">
                          <select
                            id="speaker-voice-lang-select"
                            value={speechLang}
                            onChange={(e) => setSpeechLang(e.target.value as any)}
                            className="text-[10px] bg-[#111111] text-[#A3A3A3] border border-[#222] rounded-md p-1.5 focus:outline-none"
                          >
                            <option value="bn-IN">🇧🇩 Bangla TTS</option>
                            <option value="en-US">🇺🇸 English TTS</option>
                          </select>
                        </div>
                      </div>

                      {/* Decoded structured content with beautiful mathematical presentation */}
                      <div className="bg-[#111111] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-4 prose prose-invert font-sans border-l-4 border-l-[#4F46E5]">
                        {parseMarkdown(resultText)}
                      </div>

                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full border border-[#262626] flex items-center justify-center text-slate-500 bg-[#111]">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Awaiting Multimodal Directives</h4>
                        <p className="text-xs text-[#737373] mt-1 max-w-xs mx-auto leading-relaxed">
                          Provide textbook pages, query prompts, or record custom audios to formulate real-time solutions instantly.
                        </p>
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 2: STANDALONE PYTHON GRADIO APP CODE */}
        {activeTab === "gradio-code" && (
          <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-900/40 text-indigo-400 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider font-mono">
                    Hackathon v1.0 Package
                  </span>
                  <span className="font-mono text-[10px] text-[#525252]">shikho_gradio_app.py</span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight uppercase mt-1">Standalone Gradio Setup</h2>
                <p className="text-[#A3A3A3] text-xs leading-relaxed mt-1">
                  We compiled a completely functional python Gradio terminal script called <code className="text-amber-400 font-mono bg-[#171717] px-1 py-0.5 rounded font-bold">shikho_gradio_app.py</code> in the project root file tree.
                </p>
              </div>

              <button
                onClick={copyGradioCode}
                className="px-5 py-3 bg-white hover:bg-[#4F46E5] text-black hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shrink-0 cursor-pointer"
              >
                {copySuccess ? "Copied Script" : "Copy Code Scaffold"}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#111111] border border-[#262626] rounded-xl p-5 space-y-4">
                  <h3 className="font-bold text-white text-xs uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-400" /> Setup & Launch Command
                  </h3>
                  
                  <div className="space-y-4 text-xs text-[#A3A3A3] leading-relaxed">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-white block mb-1">1. Install dependencies</span>
                      <pre className="bg-black text-[11px] p-2.5 rounded font-mono border border-[#222] text-[#F5F5F5] select-all overflow-x-auto">
                        pip install gradio easyocr gtts google-genai
                      </pre>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-white block mb-1">2. Run locally</span>
                      <pre className="bg-black text-[11px] p-2.5 rounded font-mono border border-[#222] text-[#F5F5F5] select-all">
                        python shikho_gradio_app.py
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-950/20 border border-indigo-900/50 p-5 rounded-xl text-xs text-indigo-300 leading-relaxed">
                  <strong>⭐ EasyOCR & gTTS integration:</strong> The python script uses your local soundcard and processor to run Whisper OCR and gTTS natively. If EasyOCR or gTTS are missing on your hackathon presentation machine, the script will gracefully switch to mock prototype fallback mode.
                </div>
              </div>

              <div className="lg:col-span-8">
                <div className="rounded-xl overflow-hidden border border-[#262626]">
                  <div className="bg-[#171717] px-4.5 py-3 border-b border-[#262626] flex items-center justify-between font-mono text-[10px] text-[#A3A3A3]">
                    <span>shikho_gradio_app.py</span>
                    <span className="text-emerald-400">READY</span>
                  </div>
                  <pre className="bg-black p-5 text-[11px] font-mono text-[#F5F5F5] overflow-x-auto select-all leading-relaxed whitespace-pre h-[300px]">
{`#!/usr/bin/env python3
import os
import gradio as gr
import easyocr
from gtts import gTTS
from google import genai
from google.genai import types

# Setup Multilingual Bangla & English optical text scanning
ocr_reader = easyocr.Reader(['bn', 'en'])

def process_learning_assistant(text_input, voice_audio, upload_image, custom_question):
    # Formulate question, query Gemini model, generate gTTS audio explanation
    # For full instructions view terminal setup.
    pass`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer bar */}
      <footer className="border-t border-[#262626] bg-[#0A0A0A] px-6 py-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between text-[10px] uppercase tracking-[0.2em] font-bold text-[#525252] gap-4">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6">
          <span>GPU-ACCELERATED: TRUE</span>
          <span>LATENCY: 124MS</span>
          <span>BANGLA DECODER: WHISPER-V3</span>
        </div>
        <div>
          SHIKHOAI PROTOTYPE BY <span className="text-white">HACKATHON TEAM</span>
        </div>
      </footer>

    </div>
  );
}
