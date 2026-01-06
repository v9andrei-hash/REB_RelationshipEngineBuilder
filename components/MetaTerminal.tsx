
import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Cpu, AlertCircle, Send, Loader2, Code2, Save, FileCode, Ghost, Sparkles, Activity, CheckCircle, Zap, ShieldAlert } from 'lucide-react';
import { Message, SimulationIntervention } from '../types';

interface MetaTerminalProps {
  messages: Message[];
  onSend: (text: string) => void;
  onUpdateKernel: (content: string) => Promise<void>;
  onAnalyzeDrift: () => Promise<void>;
  onCommitIntervention: (id: string) => void;
  interventions: SimulationIntervention[];
  systemContext: string;
  isProcessing: boolean;
  isCaching: boolean;
  isAnalyzing: boolean;
  contextLoaded: boolean;
}

const MetaTerminal: React.FC<MetaTerminalProps> = ({ 
  messages, 
  onSend, 
  onUpdateKernel, 
  onAnalyzeDrift,
  onCommitIntervention,
  interventions,
  systemContext, 
  isProcessing, 
  isCaching,
  isAnalyzing,
  contextLoaded 
}) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'log' | 'kernel' | 'artifact'>('log');
  const [kernelDraft, setKernelDraft] = useState(systemContext);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current && mode === 'log') {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, isProcessing, mode]);

  useEffect(() => {
    setKernelDraft(systemContext);
  }, [systemContext]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSend(input);
    setInput('');
  };

  const handleSaveKernel = async () => {
    await onUpdateKernel(kernelDraft);
    setMode('log');
  };

  if (!contextLoaded) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black mono">
        <TerminalIcon size={48} className="text-blue-500 mb-4 opacity-30" />
        <h2 className="text-xl font-bold text-white mb-2 tracking-tighter">REB_ADMIN_PRIVILEGE_REQUIRED</h2>
        <p className="text-gray-700 max-w-md text-[10px] font-bold uppercase tracking-widest">
          Mount protocol cache to initialize kernel access.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] mono text-green-500 p-0 overflow-hidden border-l border-white/5">
      {/* Tab Switcher */}
      <div className="flex bg-black border-b border-white/5">
        <button 
          onClick={() => setMode('log')}
          className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest border-r border-white/5 transition-colors ${
            mode === 'log' ? 'bg-[#0a0a0a] text-blue-400 border-b-2 border-blue-500' : 'text-gray-600 hover:text-gray-400'
          }`}
        >
          <TerminalIcon size={14} />
          Log @ ROOT
        </button>
        <button 
          onClick={() => setMode('kernel')}
          className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest border-r border-white/5 transition-colors ${
            mode === 'kernel' ? 'bg-[#0a0a0a] text-purple-400 border-b-2 border-purple-500' : 'text-gray-600 hover:text-gray-400'
          }`}
        >
          <Code2 size={14} />
          Kernel Editor
        </button>
        <button 
          onClick={() => setMode('artifact')}
          className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest border-r border-white/5 transition-colors ${
            mode === 'artifact' ? 'bg-[#0a0a0a] text-amber-400 border-b-2 border-amber-500' : 'text-gray-600 hover:text-gray-400'
          }`}
        >
          <Ghost size={14} />
          Overseer AI
        </button>
      </div>

      {mode === 'log' && (
        <div className="flex-1 flex flex-col h-full p-4">
          <div className="mb-4 p-3 bg-blue-900/10 border border-blue-500/20 rounded-xl flex items-center gap-3">
             <ShieldAlert size={16} className="text-blue-500" />
             <div className="text-[9px] font-black uppercase tracking-widest text-blue-400">
                Root Environment Active: Narrative Prose is suppressed in this terminal.
             </div>
          </div>

          <div 
            ref={logRef}
            className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar-meta font-medium text-[11px]"
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col gap-1 border-l-2 pl-4 py-1 ${msg.role === 'user' ? 'border-blue-900/50' : 'border-green-900/50'}`}>
                <div className="flex items-center gap-2 opacity-50">
                   <span className="text-[9px] font-black uppercase tracking-widest">
                     {msg.role === 'user' ? (msg.isMeta ? 'ADMIN@META' : 'ADMIN@SIM') : 'ARCHITECT@REB'}
                   </span>
                   <span className="text-[8px] font-mono opacity-50">[{new Date().toLocaleTimeString()}]</span>
                </div>
                <div className={`whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user' ? 'text-blue-200' : 'text-green-400 font-bold'
                }`}>
                  {msg.role === 'user' ? msg.content : (msg.hiddenStats || msg.content)}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-center gap-2 text-[10px] text-blue-500/50 italic animate-pulse">
                <Loader2 size={12} className="animate-spin" />
                Root executing diagnostic...
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 bg-black/40 -mx-4 px-4 pb-2">
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <span className="text-blue-400 font-black text-[10px] shrink-0 tracking-tighter">CMD_INPUT:></span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isProcessing}
                autoFocus
                placeholder="Declare root instruction or diagnostic query..."
                className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-[11px] text-blue-100 placeholder:text-gray-800 py-2 font-mono"
              />
            </form>
          </div>
        </div>
      )}

      {mode === 'kernel' && (
        <div className="flex-1 flex flex-col p-8 animate-in fade-in duration-300">
           <div className="flex justify-between items-start mb-6">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
                 <FileCode size={24} />
               </div>
               <div>
                 <h2 className="text-lg font-black text-white italic tracking-tighter uppercase">Protocol Kernel Editor</h2>
                 <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mt-1">Direct Cache Manipulation Layer</p>
               </div>
             </div>
             <button
               onClick={handleSaveKernel}
               disabled={isCaching}
               className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${
                 isCaching 
                   ? 'bg-purple-500/10 text-purple-400 cursor-not-allowed' 
                   : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20 active:scale-95'
               }`}
             >
               {isCaching ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
               Commit to Engine
             </button>
           </div>

           <div className="flex-1 bg-[#0a0a0a] rounded-3xl border border-white/5 p-8 relative group">
              <textarea
                value={kernelDraft}
                onChange={(e) => setKernelDraft(e.target.value)}
                spellCheck={false}
                className="w-full h-full bg-transparent border-none outline-none focus:ring-0 text-[11px] text-gray-300 font-mono leading-relaxed resize-none custom-scrollbar-meta"
              />
           </div>
        </div>
      )}

      {mode === 'artifact' && (
        <div className="flex-1 flex flex-col p-8 animate-in slide-in-from-right duration-300">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
               <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500">
                  <Ghost size={32} className={isAnalyzing ? 'animate-pulse' : ''} />
               </div>
               <div>
                  <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Overseer Artifact</h2>
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Autonomous Drift Detection & Physics Correction</p>
               </div>
            </div>
            <button
              onClick={onAnalyzeDrift}
              disabled={isAnalyzing}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-xs uppercase transition-all ${
                isAnalyzing 
                  ? 'bg-amber-500/10 text-amber-400 cursor-not-allowed' 
                  : 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)] active:scale-95'
              }`}
            >
              {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
              {isAnalyzing ? "Scanning Simulation..." : "Scan for Drift"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
             <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar-meta">
               <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                 <Zap size={14} className="text-amber-500" />
                 Active Drift Interventions
               </h3>
               
               {interventions.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-3xl opacity-20 p-12 text-center">
                    <Sparkles size={40} className="mb-4" />
                    <p className="text-xs uppercase font-black tracking-widest leading-relaxed">
                      No drift detected.<br/>Simulation within nominal tolerance.
                    </p>
                 </div>
               ) : (
                 interventions.map((inv) => (
                   <div key={inv.id} className="bg-[#111] border border-amber-500/20 rounded-[32px] p-6 hover:border-amber-500/40 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${
                          inv.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-500' :
                          inv.severity === 'High' ? 'bg-orange-500/20 text-orange-500' :
                          'bg-amber-500/20 text-amber-500'
                        }`}>
                          {inv.severity} {inv.type} Drift
                        </span>
                        <button 
                          onClick={() => onCommitIntervention(inv.id)}
                          className="text-[10px] font-black text-amber-500 hover:text-amber-400 flex items-center gap-1 uppercase tracking-tighter"
                        >
                          Enact Correction <CheckCircle size={12} />
                        </button>
                      </div>
                      <p className="text-xs text-white font-bold leading-relaxed mb-4">{inv.description}</p>
                      <div className="bg-black/50 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase font-black mb-2 tracking-widest">Proposed Fix Protocol:</p>
                        <p className="text-[11px] text-amber-200/80 font-mono italic leading-relaxed">{inv.proposedFix}</p>
                      </div>
                   </div>
                 ))
               )}
             </div>

             <div className="bg-[#0a0a0a] rounded-[40px] border border-white/5 p-8 flex flex-col gap-6">
                <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Artifact Diagnostics</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-2">Engine Memory State</p>
                    <div className="flex justify-between items-end">
                      <span className="text-xl font-black text-white italic">SYNCHRONIZED</span>
                      <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Checksum Passed</span>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-2">Narrative Entropy</p>
                    <div className="h-2 w-full bg-black rounded-full overflow-hidden mb-2">
                       <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: '45%' }} />
                    </div>
                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Tolerance: 45.2%</span>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar-meta::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar-meta::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
        }
        .custom-scrollbar-meta::-webkit-scrollbar-thumb {
          background: #111;
          border-radius: 3px;
        }
        .custom-scrollbar-meta::-webkit-scrollbar-thumb:hover {
          background: #222;
        }
      `}</style>
    </div>
  );
};

export default MetaTerminal;
