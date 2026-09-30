import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  X,
  Bot,
  User,
  Sparkles,
  Loader2,
  RefreshCw,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export const VoiceAssistantChatbot: React.FC = () => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize initial greeting when opened or language changes
  useEffect(() => {
    if (messages.length === 0) {
      const greeting =
        language === 'mr'
          ? 'नमस्कार! मी स्मार्टरेल्वे सहाय्यक आहे. तुम्ही मला गाड्यांच्या वेळा, सीट/बर्थ उपलब्धता, पीएनआर किंवा परताव्याबद्दल मराठी, हिंदी किंवा इंग्रजीत विचारू शकता. तुम्ही बोलून (माइक द्वारे) देखील विचारू शकता!'
          : language === 'hi'
          ? 'नमस्ते! मैं स्मार्टरेल एआई सहायक हूँ। आप मुझसे ट्रेनों के समय, सीट/बर्थ उपलब्धता, पीएनआर या रिफंड के बारे में हिंदी, मराठी या अंग्रेजी में पूछ सकते हैं। आप बोलकर (माइक से) भी सवाल पूछ सकते हैं!'
          : 'Hello! I am SmartRail AI Assistant. You can ask me about train timings, seat & sleeper berth availability, PNR status, or refund rules in any language. You can also use voice to speak!';

      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: greeting,
          timestamp: new Date(),
        },
      ]);
    }
  }, [language]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      // Select matching voice locale
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage(transcript);
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition not available:', e);
      setVoiceSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [language]);

  // Text to Speech
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window) || !isSpeakingEnabled) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#•]/g, ' ');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Failed to start speech recognition:', e);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    setInputMessage('');
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, language }),
      });

      if (!res.ok) {
        throw new Error('Failed to get answer');
      }

      const data = await res.json();
      const botMsg: Message = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Voice read aloud if enabled
      if (isSpeakingEnabled) {
        speakText(data.reply);
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text:
          language === 'mr'
            ? 'माफ करा, तांत्रिक अडचणीमुळे उत्तर देण्यात विलंब होत आहे. कृपया पुन्हा प्रयत्न करा.'
            : language === 'hi'
            ? 'क्षमा करें, तकनीकी समस्या के कारण उत्तर नहीं मिल सका। कृपया पुनः प्रयास करें।'
            : 'Sorry, there was a temporary issue getting an answer. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 left-5 z-40 font-sans">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer border border-blue-400/40"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
          </div>
          <div className="text-left">
            <span className="text-xs font-black block leading-none">{t('smartRailAi')}</span>
            <span className="text-[10px] text-blue-100 opacity-90 block">Voice & Chat</span>
          </div>
          <span className="ml-1 p-1 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
            <Mic className="w-3.5 h-3.5 text-white" />
          </span>
        </button>
      )}

      {/* Expanded Chatbot Dialog */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[550px] max-h-[85vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black flex items-center gap-1.5">
                  <span>{t('smartRailAi')}</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </h3>
                <span className="text-[10px] text-blue-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{t('aiOnline')}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Voice Mute/Unmute */}
              <button
                type="button"
                onClick={() => {
                  if (isSpeakingEnabled) window.speechSynthesis.cancel();
                  setIsSpeakingEnabled(!isSpeakingEnabled);
                }}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isSpeakingEnabled ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500/30 text-red-200'
                }`}
                title={isSpeakingEnabled ? 'Mute Voice' : 'Enable Voice'}
              >
                {isSpeakingEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  window.speechSynthesis.cancel();
                  setIsOpen(false);
                }}
                className="p-2 rounded-xl hover:bg-white/20 transition-colors text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <div className="flex items-center justify-between gap-3 mt-1.5 pt-1 text-[10px] opacity-70">
                    <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.sender === 'bot' && (
                      <button
                        type="button"
                        onClick={() => speakText(msg.text)}
                        className="hover:opacity-100 flex items-center gap-0.5 cursor-pointer"
                        title="Listen to this message"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Listen</span>
                      </button>
                    )}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-500 text-xs p-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Queries */}
          <div className="p-2 bg-white border-t border-slate-100 overflow-x-auto whitespace-nowrap flex gap-1.5 shrink-0 scrollbar-none">
            {[t('q1'), t('q2'), t('q3')].map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200 transition-colors shrink-0 cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Voice Listening Banner */}
          {isListening && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-center justify-between text-xs text-red-600 font-semibold animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <span>{t('speakNow')}</span>
              </div>
              <button
                type="button"
                onClick={toggleListening}
                className="text-[11px] underline font-bold cursor-pointer"
              >
                Stop
              </button>
            </div>
          )}

          {/* Input Box with Voice & Send */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            {/* Microphone Button */}
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  isListening
                    ? 'bg-red-600 text-white shadow-md shadow-red-500/30 scale-105'
                    : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200'
                }`}
                title={isListening ? 'Stop listening' : t('pressToSpeak')}
              >
                {isListening ? <MicOff className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={t('askAiPlaceholder')}
              className="flex-1 bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none transition-colors"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
