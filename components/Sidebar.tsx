
import React, { useRef } from 'react';
import { Layout, MessageSquare, Database, BarChart3, ShieldAlert, Zap, Target, History, Radio, Cpu, Download, Upload, Trash2, Users, Layers, Terminal as TerminalIcon, Loader2, Clock } from 'lucide-react';

interface SidebarProps {
  currentView: 'chat' | 'context' | 'reb' | 'pc' | 'anchors' | 'npcs' | 'situations' | 'meta';
  setView: (view: any) => void;
  stats: any;
  anchorCount: number;
  npcCount: number;
  sitCount: number;
  isExporting?: boolean;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, stats, anchorCount, npcCount, sitCount, isExporting, onExport, onImport, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const NavItem = ({ id, icon: Icon, label, badge }: { id: any, icon: any, label: string, badge?: number }) => (
    <button
      onClick={() => setView(id)}
      className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg transition-all duration-200 ${
        currentView === id 
          ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[inset_0_0_10px_rgba(59,130,246,0.05)]' 
          : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} />
        <span className="font-medium text-xs tracking-tight">{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 rounded-full font-bold">{badge}</span>
      )}
    </button>
  );

  return (
    <aside className="w-64 bg-[#0d0d0d] border-r border-white/5 flex flex-col p-4 gap-6">
      <div className="px-2">
        <h1 className="text-xl font-black text-white flex items-center gap-2 tracking-tighter italic">
          <Radio className="text-blue-500" size={24} />
          REB ENGINE
        </h1>
        <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-[0.2em] font-black">Simulation Control v3.8</p>
      </div>

      <div className="flex flex-col gap-6 flex-1 overflow-y-auto pr-1">
        <div>
          <h3 className="text-[9px] text-gray-600 uppercase font-black tracking-widest px-4 mb-3">System</h3>
          <nav className="space-y-1">
            <NavItem id="context" icon={Database} label="Protocol Cache" />
            <NavItem id="chat" icon={MessageSquare} label="Simulation Terminal" />
            <NavItem id="meta" icon={TerminalIcon} label="Meta Terminal" />
          </nav>
        </div>

        <div>
          <h3 className="text-[9px] text-gray-600 uppercase font-black tracking-widest px-4 mb-3">Telemetry</h3>
          <nav className="space-y-1">
            <NavItem id="reb" icon={Radio} label="REB Surveillance" />
            <NavItem id="pc" icon={Target} label="PC Psychology" />
            <NavItem id="npcs" icon={Users} label="NPC Roster" badge={npcCount} />
            <NavItem id="situations" icon={Layers} label="Situation Deck" badge={sitCount} />
            <NavItem id="anchors" icon={History} label="Narrative Anchors" badge={anchorCount} />
          </nav>
        </div>

        <div>
          <h3 className="text-[9px] text-gray-600 uppercase font-black tracking-widest px-4 mb-3">Actions</h3>
          <div className="space-y-1">
            <button 
              onClick={onExport}
              disabled={isExporting}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg transition-colors ${
                isExporting ? 'text-blue-400 bg-blue-500/10 animate-pulse' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
              }`}
            >
              {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              <span className="font-medium text-xs tracking-tight">
                {isExporting ? 'Synthesizing...' : 'Export Chronicle'}
              </span>
            </button>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={onImport} 
              accept=".json" 
              className="hidden" 
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-colors"
            >
              <Upload size={18} />
              <span className="font-medium text-xs tracking-tight">Import Chronicle</span>
            </button>

            <button 
              onClick={onClear}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-red-500/60 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <Trash2 size={18} />
              <span className="font-medium text-xs tracking-tight">Wipe Session</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-4 pt-4 border-t border-white/5">
        <div className="p-4 bg-[#111] rounded-2xl border border-white/5 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Cpu size={12} className="text-gray-500" />
              <span className="text-[9px] text-gray-500 uppercase font-black">Context Load</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-white font-mono" title="Tokens consumed">
                {stats.tokens.toLocaleString()} <span className="text-gray-600">tkn</span>
              </span>
              <div className="w-px h-2 bg-white/10 mx-0.5" />
              <span className="text-[10px] text-blue-400 font-mono" title="Narrative Cycles">
                {stats.turns || 0} <span className="text-gray-600">cyc</span>
              </span>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-gray-500 uppercase font-black">Force Balance</span>
              <span className={`text-[10px] font-black uppercase ${stats.pcObsession > Math.abs(stats.entropy / 4) ? 'text-orange-500' : 'text-blue-500'}`}>
                {stats.pcObsession > Math.abs(stats.entropy / 4) ? 'PC Leading' : 'REB Restrained'}
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full flex overflow-hidden border border-white/5">
              <div className="bg-orange-600 h-full transition-all duration-500" style={{ width: `${stats.pcObsession}%` }} />
              <div className="bg-blue-600 h-full flex-1" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 px-4 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[9px] font-black uppercase tracking-tighter">
          <ShieldAlert size={12} />
          Compliance Mode: Strict
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
