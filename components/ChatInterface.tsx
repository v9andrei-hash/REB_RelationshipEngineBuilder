
import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Loader2, Sparkles, AlertCircle, ShieldCheck, ShieldAlert, Volume2 } from 'lucide-react';
import { Message } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSend: (text: string) => void;
  isProcessing: boolean;
  contextLoaded: boolean;
  onPlayTTS?: (text: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSend, isProcessing, contextLoaded, onPlayTTS }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Simulation terminal only cares about non-meta messages
  const narrativeMessages = messages.filter(m => !m.isMeta);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [narrativeMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSend(input);
    setInput('');
  };

  if (!contextLoaded) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0a0a0a]">
        <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mb-6">
          <Terminal size={40} className="text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Engine Offline</h2>
        <p className="text-gray-500 max-w-md text-sm">
          The REB Simulation Engine requires a system context before initialization. 
          Head over to the <span className="text-blue-400 font-bold">Protocol Cache</span> tab to inject the protocols.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0a]">
      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-8 max-w-4xl mx-auto w-full pt-12"
      >
        {narrativeMessages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-40">
            <Sparkles size={48} className="text-blue-500 mb-2" />
            <p className="text-white font-medium">Simulation initialized. Waiting for prompt.</p>
            <p className="text-xs text-gray-500">Type "Begin" to trigger initial narrative calibration.</p>
          </div>
        )}

        {narrativeMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-6 py-4 rounded-2xl transition-all relative group ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-[#1a1a1a] text-gray-200 border border-white/5 shadow-2xl shadow-black/50'
            }`}>
              {msg.role === 'model' && (
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-400 opacity-70">
                    <Terminal size={12} />
                    Transmission Received
                  </div>
                  <div className="flex items-center gap-2">
                    {onPlayTTS && (
                      <button 
                        onClick={() => onPlayTTS(msg.content)}
                        className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-blue-400 transition-colors"
                        title="Vocalize Transmission"
                      >
                        <Volume2 size={12} />
                      </button>
                    )}
                    {msg.compliance && (
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                        msg.compliance.isPassed 
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                          : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        {msg.compliance.isPassed ? (
                          <ShieldCheck size={10} />
                        ) : (
                          <ShieldAlert size={10} />
                        )}
                        <span className="hidden sm:inline">{msg.compliance.isPassed ? 'Physics Compliant' : 'Meta-Leak Detected'}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="whitespace-pre-wrap leading-relaxed text-sm antialiased">{msg.content}</div>
              
              {!msg.compliance?.isPassed && msg.compliance?.violations && msg.compliance.violations.length > 0 && (
                <div className="mt-4 p-3 bg-red-500/5 rounded-lg border border-red-500/10 animate-pulse">
                  <p className="text-[10px] text-red-400 font-bold uppercase mb-1 flex items-center gap-2">
                    <AlertCircle size={10}/> Illegal Term Incursion:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {msg.compliance.violations.map((v, j) => (
                      <span key={j} className="text-[9px] bg-red-500/10 text-red-300 px-1.5 py-0.5 rounded mono uppercase border border-red-500/20">{v}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isProcessing && messages[messages.length - 1]?.role === 'user' && !messages[messages.length - 1].isMeta && (
          <div className="flex justify-start">
            <div className="bg-[#1a1a1a] px-6 py-4 rounded-2xl flex items-center gap-3 text-gray-400 border border-white/5">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-xs font-medium uppercase tracking-widest italic">Computing narrative vectors...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 border-t border-white/5 bg-[#0a0a0a]">
        <form 
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto flex gap-4 bg-[#111] p-2 pr-4 rounded-2xl border border-white/5 focus-within:border-blue-500/50 transition-all shadow-2xl"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            placeholder={isProcessing ? "Simulation active..." : "Declare narrative action..."}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-200 px-4 py-3"
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
              input.trim() && !isProcessing 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95' 
                : 'bg-white/5 text-gray-600'
            }`}
          >
            <Send size={18} />
          </button>
        </form>
        <div className="max-w-4xl mx-auto flex justify-between mt-3 px-2">
          <div className="flex gap-4">
            <span className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">(IMMERSION_ACTIVE)</span>
          </div>
          <span className="text-[9px] text-gray-700 font-mono">GEMINI_KERNEL_CONNECTED</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
