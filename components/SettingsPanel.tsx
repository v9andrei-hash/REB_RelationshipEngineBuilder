
import React, { useState } from 'react';
import { Save, RefreshCw, Download, Upload, AlertTriangle, Zap, Settings as SettingsIcon } from 'lucide-react';
import { DEFAULT_REB_CONTEXT } from '../constants';

interface SettingsPanelProps {
  currentPrompt: string;
  onPromptUpdate: (newPrompt: string) => Promise<void>;
  isCaching: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ currentPrompt, onPromptUpdate, isCaching }) => {
  const [draft, setDraft] = useState(currentPrompt);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleExport = () => {
    const blob = new Blob([draft], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reb-system-prompt.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setDraft(ev.target.result);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full p-8 gap-8 max-w-5xl mx-auto w-full overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-end border-b border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-black text-white mb-2 italic tracking-tighter flex items-center gap-3 uppercase">
            <SettingsIcon size={28} className="text-blue-500" /> System Configuration
          </h2>
          <p className="text-gray-400 max-w-2xl text-xs uppercase tracking-widest font-bold">
            Fine-tune the Engine's narrative kernel and system protocols.
          </p>
        </div>
        <button
          onClick={() => onPromptUpdate(draft)}
          disabled={isCaching || !draft}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all uppercase text-[10px] tracking-widest ${
            isCaching 
              ? 'bg-blue-500/20 text-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 active:scale-95'
          }`}
        >
          {isCaching ? 'Caching...' : 'Apply Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full px-6 py-4 flex justify-between items-center hover:bg-white/5 transition-colors border-b border-white/5"
            >
              <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">System Prompt Configuration</span>
              <span className="text-[10px] text-blue-500 font-bold uppercase">{isCollapsed ? 'Expand' : 'Collapse'}</span>
            </button>
            
            {!isCollapsed && (
              <div className="p-6">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-full h-96 bg-black/50 border border-white/5 rounded-xl p-6 mono text-xs text-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors resize-none leading-relaxed"
                  placeholder="Paste REB system prompt..."
                />
                <div className="flex gap-4 mt-4">
                  <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold uppercase text-gray-400">
                    <Download size={14} /> Export .txt
                  </button>
                  <label className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold uppercase text-gray-400 cursor-pointer text-center">
                    <Upload size={14} /> Import .txt
                    <input type="file" onChange={handleImport} className="hidden" accept=".txt" />
                  </label>
                  <button onClick={() => setDraft(DEFAULT_REB_CONTEXT)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-[10px] font-bold uppercase text-red-400">
                    <RefreshCw size={14} /> Reset Default
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-2xl flex gap-4">
            <AlertTriangle className="text-amber-500 shrink-0" size={24} />
            <div>
              <h4 className="text-amber-500 font-black text-[10px] uppercase tracking-widest mb-1">Impact Warning</h4>
              <p className="text-[11px] text-gray-400 leading-relaxed italic">Changes to the system prompt take effect immediately on the next user transmission. Modifying the narrative physics (Section 4) during an active session may cause instability.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-2xl">
            <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2 uppercase text-xs tracking-widest">
              <Zap size={18} /> Engine Calibration
            </h3>
            <p className="text-[11px] text-blue-300/80 leading-relaxed italic">
              Initialization caches the protocol payload to your API key. This reduces latency and ensures consistent adherence to the REB narrative architecture.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-4">Session Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-gray-500 uppercase">Context Latency</span>
                <span className="text-white mono">~0.4s</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-gray-500 uppercase">Physics Sync</span>
                <span className="text-green-500 uppercase">Active</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-gray-500 uppercase">Memory Retention</span>
                <span className="text-white mono">High</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
