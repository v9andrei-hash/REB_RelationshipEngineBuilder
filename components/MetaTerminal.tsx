
import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Cpu, AlertCircle, Send, Loader2, Code2, Save, FileCode, Ghost, Sparkles, Activity, CheckCircle, Zap, ShieldAlert, RefreshCw } from 'lucide-react';
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
  onSystemCalibrate?: () => Promise<void>;
  isCalibrating?: boolean;
}

const MetaTerminal: React.FC<MetaTerminalProps> = ({ 
  messages, onSend, onUpdateKernel, onAnalyzeDrift, onCommitIntervention, interventions,
  systemContext, isProcessing, isCaching, isAnalyzing, contextLoaded, 
  onSystemCalibrate, isCalibrating
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] mono text-green-500 p-0 overflow-hidden border-l border-white/5">
      <div className="flex bg-black border-b border-white/5">
        <button onClick={() => setMode('log')} className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest border-r border-white/5 transition-colors ${mode === 'log' ? 'bg-[#0a0a0a] text-blue-400 border-b-2 border-blue-500' : 'text-gray-600 hover:text-gray-400'}`}>
          <TerminalIcon size={14} /> Log @ ROOT
        </button>
        <button onClick={() => setMode('kernel')} className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest border-r border-white/5 transition-colors ${mode === 'kernel' ? 'bg-[#0a0a0a] text-purple-400 border-b-2 border-purple-500' : 'text-gray-600 hover:text-gray-400'}`}>
          <Code2 size={14} /> Kernel Editor
        </button>
        <button onClick={() => setMode('artifact')} className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest border-r border-white/5 transition-colors ${mode === 'artifact' ? 'bg-[#0a0a0a] text-amber-400 border-b-2 border-amber-500' : 'text-gray-600 hover:text-gray-400'}`}>
          <Ghost size={14} /> Overseer AI
        </button>
      </div>

      {mode === 'log' && (
        <div className="flex-1 flex flex-col h-full p-4">
          <div className="mb-4 p-3 bg-blue-900/10 border border-blue-500/20 rounded-xl flex items-center justify-between">
             <div className="flex items-center gap-3">
                <ShieldAlert size={16} className="text-blue-500" />
                <div className="text-[9px] font-black uppercase tracking-widest text-blue-400">Root Environment Active: Prose is suppressed.</div>
             </div>
             {onSystemCalibrate && (
               <button 
                 onClick={onSystemCalibrate} 
                 disabled={isCalibrating}
                 className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1 rounded-lg text-blue-500 text-[9px] font-black uppercase border border-blue-500/30 transition-all"
               >
                 {isCalibrating ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                 Calibrate State
               </button>
             )}
          </div>
          <div ref={logRef} className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar-meta font-medium text-[11px]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col gap-1 border-l-2 pl-4 py-1 ${msg.role === 'user' ? 'border-blue-900/50' : 'border-green-900/50'}`}>
                <div className="flex items-center gap-2 opacity-50">
                   <span className="text-[9px] font-black uppercase tracking-widest">{msg.role === 'user' ? (msg.isMeta ? 'ADMIN@META' : 'ADMIN@SIM') : 'ARCHITECT@REB'}</span>
                   <span className="text-[8px] opacity-50">[{new Date().toLocaleTimeString()}]</span>
                </div>
                <div className={`whitespace-pre-wrap ${msg.role === 'user' ? 'text-blue-200' : 'text-green-400 font-bold'}`}>{msg.hiddenStats || msg.content}</div>
              </div>
            ))}
            {isProcessing && <div className="flex items-center gap-2 text-[10px] text-blue-500/50 italic animate-pulse"><Loader2 size={12} className="animate-spin" /> Root executing...</div>}
          </div>
          <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-white/5 bg-black/40 -mx-4 px-4 pb-2 flex items-center gap-3">
            <span className="text-blue-400 font-black text-[10px] shrink-0">CMD_INPUT:></span>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={isProcessing} autoFocus placeholder="Declare root instruction..." className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-[11px] text-blue-100 placeholder:text-gray-800 font-mono" />
          </form>
        </div>
      )}

      {mode === 'kernel' && (
        <div className="flex-1 flex flex-col p-8 animate-in fade-in">
           <div className="flex justify-between items-start mb-6">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400"><FileCode size={24} /></div>
               <div><h2 className="text-lg font-black text-white italic tracking-tighter uppercase">Protocol Kernel Editor</h2><p className="text-gray-600 text-[10px] font-bold uppercase mt-1">Direct Manipulation Layer</p></div>
             </div>
             <button onClick={() => onUpdateKernel(kernelDraft)} disabled={isCaching} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all">Commit to Engine</button>
           </div>
           <div className="flex-1 bg-[#0a0a0a] rounded-3xl border border-white/5 p-8"><textarea value={kernelDraft} onChange={(e) => setKernelDraft(e.target.value)} spellCheck={false} className="w-full h-full bg-transparent border-none outline-none focus:ring-0 text-[11px] text-gray-300 font-mono leading-relaxed resize-none custom-scrollbar-meta" /></div>
        </div>
      )}

      {mode === 'artifact' && (
        <div className="flex-1 flex flex-col p-8 animate-in slide-in-from-right">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
               <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500"><Ghost size={32} className={isAnalyzing ? 'animate-pulse' : ''} /></div>
               <div><h2 className="text-2xl font-black text-white italic uppercase">Overseer Artifact</h2><p className="text-gray-500 text-[10px] font-bold uppercase mt-1">Autonomous State Drift Detection</p></div>
            </div>
            <button onClick={onAnalyzeDrift} disabled={isAnalyzing} className="bg-amber-500 text-black hover:bg-amber-400 px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all active:scale-95 flex items-center gap-2">
              {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />} Scan for Drift
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
             <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar-meta">
               <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2"><Zap size={14} className="text-amber-500" /> Drift Interventions</h3>
               {interventions.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-3xl opacity-20 p-12 text-center"><Sparkles size={40} className="mb-4" /><p className="text-xs uppercase font-black tracking-widest">No drift detected.</p></div>
               ) : (
                 interventions.map((inv) => (
                   <div key={inv.id} className="bg-[#111] border border-amber-500/20 rounded-[32px] p-6 hover:border-amber-500/40 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${inv.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>{inv.severity} {inv.type}</span>
                        <button onClick={() => onCommitIntervention(inv.id)} className="text-[10px] font-black text-amber-500 hover:text-amber-400 uppercase">Enact Correction</button>
                      </div>
                      <p className="text-xs text-white font-bold leading-relaxed mb-4">{inv.description}</p>
                      <div className="bg-black/50 p-4 rounded-2xl border border-white/5"><p className="text-[11px] text-amber-200/80 font-mono italic leading-relaxed">{inv.proposedFix}</p></div>
                   </div>
                 ))
               )}
             </div>
             <div className="bg-[#0a0a0a] rounded-[40px] border border-white/5 p-8 flex flex-col gap-6">
                <h3 className="text-[10px] font-black text-gray-600 uppercase">Artifact Diagnostics</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5"><p className="text-[9px] text-gray-500 font-black uppercase mb-2">Engine Memory State</p><div className="flex justify-between items-end"><span className="text-xl font-black text-white italic">SYNCED</span><span className="text-[10px] text-blue-500 font-bold uppercase">Passed</span></div></div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5"><p className="text-[9px] text-gray-500 font-black uppercase mb-2">Narrative Stagnation Risk</p><div className="h-2 w-full bg-black rounded-full overflow-hidden mb-2"><div className="h-full bg-blue-500" style={{ width: '12%' }} /></div><span className="text-[10px] text-gray-600 font-bold uppercase">LOW</span></div>
                  <div className="mt-8 p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                    <p className="text-[10px] text-amber-500/60 font-black uppercase tracking-tighter italic">Calibration Tip:</p>
                    <p className="text-[11px] text-gray-500 mt-2 leading-snug">Use the "Calibrate State" button in the ROOT log to manually force the Engine to review character data if sync fails.</p>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}
      <style>{`.custom-scrollbar-meta::-webkit-scrollbar { width: 6px; } .custom-scrollbar-meta::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); } .custom-scrollbar-meta::-webkit-scrollbar-thumb { background: #111; border-radius: 3px; }`}</style>
    </div>
  );
};

export default MetaTerminal;
