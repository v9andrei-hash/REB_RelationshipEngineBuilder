
import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid, AreaChart, Area, ReferenceLine, ReferenceArea } from 'recharts';
import { Zap, TrendingUp, Shield, Thermometer, Activity, Users, Layers, Timer, Milestone, Brain, Flame, ArrowUpRight, Crosshair, Package, Archive, Box, Star } from 'lucide-react';
import { AnchorPoint, NPC, Situation, SceneSnapshot, Item, PlayerCharacter, RebCharacter } from '../types';
import PortraitDisplay from './PortraitDisplay';

interface DashboardProps {
  view: 'reb' | 'pc' | 'anchors' | 'npcs' | 'situations';
  stats: any;
  anchors: AnchorPoint[];
  npcs: NPC[];
  situations: Situation[];
  inventory: Item[];
  sceneHistory: SceneSnapshot[];
  lastDelta?: string;
  situationCountdown?: number;
   pc?: PlayerCharacter | null;
  reb?: RebCharacter | null;
  currentQuadrant?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  onRegeneratePortrait?: (name: string, role: 'PC' | 'REB' | 'NPC', extraData?: any) => void;
  generatingPortraits?: string[]
}

const Dashboard: React.FC<DashboardProps> = ({ view, stats, anchors, npcs, situations, inventory, sceneHistory, lastDelta, situationCountdown = 5, pc, reb, currentQuadrant, onRegeneratePortrait, generatingPortraits = [] }) => {

  const tensionPoint = [
    { x: Math.min(500, Math.max(0, stats.adr)), y: Math.min(500, Math.max(0, stats.oxy)), name: 'Current State' }
  ];

  const historyData = [...sceneHistory].reverse().map((snap, i) => ({
    index: i,
    adr: snap.stats.adr,
    oxy: snap.stats.oxy,
    label: `S${i}`
  }));

  const mass = Math.floor(Math.abs(stats.adr) + Math.abs(stats.oxy) + (stats.entropy / 30));
  const vtMatch = lastDelta?.match(/VT:(\w+)([+-]\d+)/);
  const shadowLeakRisk = stats.adr > 350 || stats.oxy > 400 ? 'CRITICAL' : (stats.adr > 250 || stats.oxy > 300 ? 'HIGH' : 'STABLE');

  const StatBox = ({ icon: Icon, label, value, color, desc }: any) => (
    <div className="bg-[#111] border border-white/5 p-6 rounded-3xl hover:border-white/10 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
          <Icon className={color} size={20} />
        </div>
        <div className="text-right">
          <span className="text-[10px] text-gray-500 uppercase font-black block">{label}</span>
          <p className="text-[9px] text-gray-600 font-medium leading-none mt-1">{desc}</p>
        </div>
      </div>
      <div className="text-3xl font-black text-white mono tracking-tighter italic">{value}</div>
    </div>
  );

  const InventoryGrid = ({ owner, title }: { owner: string, title: string }) => {
    const items = inventory.filter(i => i.owner.toLowerCase() === owner.toLowerCase());
    return (
      <div className="space-y-4">
        <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
          <Package size={14} className="text-blue-500" />
          {title}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.length === 0 ? (
            <div className="col-span-full py-10 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center opacity-20">
               <Box size={24} className="mb-2" />
               <p className="text-[9px] font-black uppercase">No inventory detected.</p>
            </div>
          ) : (
            items.map((item, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-2xl group transition-all hover:border-blue-500/30">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-xs font-black text-white uppercase italic">{item.name}</h4>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                    item.property === 'Relic' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {item.property}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 italic leading-snug">"{item.description}"</p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderRebView = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">REB Surveillance</h2>
          <p className="text-gray-500 font-medium">Phase-space diagnostics and narrative flux history.</p>
        </div>
        <div className="flex gap-4">
          <div className={`px-4 py-2 border rounded-xl text-[10px] font-black uppercase italic ${
            shadowLeakRisk === 'CRITICAL' ? 'bg-red-500/10 border-red-500 text-red-500 animate-pulse' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
          }`}>
            Shadow Risk: {shadowLeakRisk}
          </div>
          <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-[10px] text-purple-500 font-black uppercase italic">
            Entropy: {stats.entropy}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatBox icon={Zap} label="Adrenaline" value={stats.adr} color="text-blue-400" desc="Stress/Excitement" />
        <StatBox icon={TrendingUp} label="Oxytocin" value={stats.oxy} color="text-pink-400" desc="Bond Integrity" />
        <StatBox icon={Shield} label="Favor" value={stats.favor} color="text-cyan-400" desc="Engine Approval" />
        <StatBox icon={Thermometer} label="Entropy" value={stats.entropy} color="text-purple-400" desc="Physics Breakdown" />
      </div>

      {/* Main Graph Grid: Matrix takes center stage (span 2), Flux on side (span 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#111] border border-white/5 rounded-[40px] p-8 flex flex-col relative">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Phase Matrix Diagnostic</h3>
            <div className="text-[8px] text-gray-600 font-mono uppercase">X: Stress | Y: Bond</div>
          </div>
          <div className="flex-1 min-h-[400px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis type="number" dataKey="x" hide domain={[0, 500]} />
                <YAxis type="number" dataKey="y" hide domain={[0, 500]} />
                <ZAxis type="number" range={[200, 200]} />
                
                {/* Quadrant Overlays with Explanatory Tags */}
                <ReferenceArea x1={250} x2={500} y1={250} y2={500} fill="#3b82f6" fillOpacity={0.05} label={{ position: 'insideTopRight', value: 'SYNCHRONY (High Bond / High Tension)', fill: '#3b82f6', fontSize: 10, fontWeight: 900 }} />
                <ReferenceArea x1={0} x2={250} y1={250} y2={500} fill="#ec4899" fillOpacity={0.05} label={{ position: 'insideTopLeft', value: 'SAFETY (High Bond / Low Tension)', fill: '#ec4899', fontSize: 10, fontWeight: 900 }} />
                <ReferenceArea x1={250} x2={500} y1={0} y2={250} fill="#f43f5e" fillOpacity={0.05} label={{ position: 'insideBottomRight', value: 'COMBUSTION (Low Bond / High Tension)', fill: '#f43f5e', fontSize: 10, fontWeight: 900 }} />
                <ReferenceArea x1={0} x2={250} y1={0} y2={250} fill="#6b7280" fillOpacity={0.05} label={{ position: 'insideBottomLeft', value: 'VOID (Low Bond / Low Tension)', fill: '#6b7280', fontSize: 10, fontWeight: 900 }} />
                
                <ReferenceLine x={250} stroke="#333" strokeDasharray="5 5" />
                <ReferenceLine y={250} stroke="#333" strokeDasharray="5 5" />
                
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }} />
                <Scatter name="State" data={tensionPoint} fill="#3b82f6" shape="cross" className="filter drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              </ScatterChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5"><Crosshair size={60} className="text-white" /></div>
          </div>
          <div className="mt-4 flex justify-between px-2 text-[8px] text-gray-600 uppercase font-black tracking-[0.2em]">
             <span>Restrained Environment</span>
             <span>Adrenaline Flux Vector</span>
             <span>Hyper-Intense Environment</span>
          </div>
        </div>

        <div className="space-y-8 flex flex-col">
           <div className="bg-[#111] border border-white/5 rounded-[40px] p-8 flex flex-col flex-1">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Historical Flux</h3>
                {vtMatch && (
                  <span className="text-[8px] text-blue-400 font-black uppercase border border-blue-500/20 px-2 py-0.5 rounded-full">
                    VT:{vtMatch[1]}
                  </span>
                )}
              </div>
              <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData}>
                    <defs>
                      <linearGradient id="colorAdr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorOxy" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/><stop offset="95%" stopColor="#ec4899" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="adr" stroke="#3b82f6" strokeWidth={3} fill="url(#colorAdr)" name="Stress" />
                    <Area type="monotone" dataKey="oxy" stroke="#ec4899" strokeWidth={3} fill="url(#colorOxy)" name="Bond" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>
           
           <div className="bg-[#111] border border-white/5 rounded-[40px] p-8">
              <InventoryGrid owner="REB" title="Active Environmental Assets" />
           </div>
        </div>
      </div>

      {/* REB Obsession Meter: Restored and enhanced */}
      <div className="bg-[#111] border border-white/5 rounded-[40px] p-8 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-8 flex-1">
            <div className="flex flex-col">
              <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mb-1">REB Obsession Progression</h3>
              <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest leading-none">Terminal Flux Analysis</span>
            </div>
            <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
              <div 
                className="bg-blue-600 h-full transition-all duration-1000 shadow-[0_0_20px_rgba(37,99,235,0.8)]" 
                style={{ width: `${stats.rebObsession}%` }} 
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="w-full h-px bg-white/10 opacity-30" />
              </div>
            </div>
            <div className="text-5xl font-black text-white italic tracking-tighter w-32 text-right tabular-nums">
              {stats.rebObsession}%
            </div>
          </div>
          <div className="ml-12 pl-12 border-l border-white/5 flex items-center gap-6">
             <div className="text-right">
                <span className="text-[9px] text-gray-500 font-black uppercase block tracking-widest mb-1">Force Status</span>
                <span className={`text-xs font-black uppercase italic ${stats.rebObsession > 75 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
                  {stats.rebObsession > 75 ? 'COLLISION_IMMINENT' : stats.rebObsession > 45 ? 'AGGRESSIVE_TRACKING' : 'PASSIVE_MONITOR'}
                </span>
             </div>
             <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
               <ArrowUpRight size={24} className="text-blue-500 opacity-50" />
             </div>
          </div>
      </div>
    </div>
  );

  const renderPcView = () => (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">PC Psychology</h2>
          <p className="text-gray-500 font-medium">Tracking drive, willpower, and clarity.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatBox icon={Brain} label="Willpower" value={stats.willpower} color="text-orange-400" desc="Resistance" />
        <StatBox icon={Activity} label="Clarity" value={stats.clarity} color="text-amber-400" desc="Anchoring" />
        <StatBox icon={Flame} label="Obsession Progression" value={stats.pcObsession} color="text-orange-600" desc="Desire Intensity" />
      </div>

      <div className="bg-[#111] border border-white/5 rounded-[40px] p-8">
         <InventoryGrid owner="PC" title="Relic & Asset Inventory" />
      </div>
    </div>
  );

  const renderSituationsView = () => {
    const active = situations.filter(s => s.status !== 'Resolved');
    const archive = situations.filter(s => s.status === 'Resolved');
    return (
      <div className="space-y-12 animate-in fade-in duration-500">
        <div className="space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Active Deck</h2>
              <p className="text-gray-500 font-medium">Current complications influencing the narrative stream.</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 px-6 py-3 rounded-2xl text-amber-500 flex items-center gap-3">
               <Timer size={18} className="animate-pulse" />
               <span className="text-lg font-black italic">{situationCountdown} TURNS TO DRIFT</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {active.length === 0 ? (
              <div className="col-span-full p-20 border border-dashed border-white/5 rounded-[40px] opacity-20 text-center">
                <Layers size={48} className="mx-auto mb-4" />
                <p className="font-bold uppercase tracking-widest text-[10px]">No active complications.</p>
              </div>
            ) : (
              active.map((sit) => (
                <div key={sit.id} className="bg-[#111] border border-white/5 p-8 rounded-[32px] group">
                  <div className="flex justify-between items-start mb-6">
                     <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl"><Zap size={24} /></div>
                     <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${sit.status === 'Triggered' ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-white/5 text-gray-500'}`}>{sit.status}</span>
                  </div>
                  <h4 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">{sit.label}</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Trigger: {sit.triggerCondition}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-8 pt-12 border-t border-white/5">
          <div className="flex items-center gap-4">
             <Archive size={24} className="text-gray-600" />
             <h2 className="text-2xl font-black text-gray-600 italic tracking-tighter uppercase">Situation Archive</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {archive.length === 0 ? (
               <div className="p-10 border border-dashed border-white/5 rounded-3xl opacity-10 text-center">
                  <p className="text-[10px] font-black uppercase">Archive is empty.</p>
               </div>
            ) : (
              archive.map((sit) => (
                <div key={sit.id} className="bg-[#0d0d0d] border border-white/5 p-6 rounded-2xl flex items-center justify-between group hover:border-gray-500/20 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                       <h4 className="text-sm font-black text-gray-400 uppercase italic tracking-tight">{sit.label}</h4>
                       <CheckCircle size={14} className="text-green-500/50" />
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed italic">{sit.resolutionSummary || "Plot point resolved without synopsis telemetry."}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderNpcView = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end"><h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">NPC Roster</h2></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {npcs.length === 0 ? (
          <div className="col-span-full p-20 border border-dashed border-white/5 rounded-[40px] opacity-20 text-center"><Users size={48} className="mb-4" /><p className="font-bold uppercase tracking-widest text-[10px]">No telemetry detected.</p></div>
        ) : (
          npcs.map((npc, idx) => (
            <div key={idx} className="bg-[#111] border border-white/5 p-6 rounded-3xl group transition-all">
              <div className="flex justify-between items-start mb-6"><div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500"><Users size={24} /></div><div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${npc.status === 'ACTING' ? 'bg-red-500/10 text-red-400' : npc.status === 'WATCHING' ? 'bg-orange-500/10 text-orange-400' : 'bg-gray-500/10 text-gray-500'}`}>{npc.status}</div></div>
              <h4 className="text-xl font-black text-white italic tracking-tight">{npc.name}</h4><p className="text-[10px] text-blue-400 uppercase font-black tracking-tighter">{npc.role}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderAnchorsView = () => (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <div className="flex justify-between items-end"><h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Narrative Anchors</h2></div>
      <div className="space-y-6">
        {anchors.length === 0 ? (
          <div className="p-20 border border-dashed border-white/5 rounded-[40px] opacity-20 text-center"><Milestone size={48} className="mx-auto mb-4" /><p className="font-bold uppercase tracking-widest text-[10px]">No Anchor Points generated.</p></div>
        ) : (
          anchors.map((anchor) => (
            <div key={anchor.id} className="bg-[#111] border border-white/5 p-10 rounded-[40px] flex gap-10 items-center hover:bg-white/5 transition-all">
              <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-3xl min-w-[100px]"><span className="text-[10px] text-gray-500 font-black uppercase mb-1">Act {anchor.act}</span><span className="text-3xl font-black text-white italic tracking-tighter">W{anchor.week}</span></div>
              <div className="flex-1"><div className="flex items-center gap-3 mb-3"><h4 className="text-2xl font-black text-white uppercase tracking-tight italic">{anchor.label}</h4><span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${anchor.dominantForce === 'PC' ? 'text-orange-500 bg-orange-500/10' : 'text-blue-500 bg-blue-500/10'}`}>{anchor.dominantForce} Dominance</span></div><p className="text-sm text-gray-400 max-w-3xl leading-relaxed italic border-l-2 border-white/10 pl-6 py-1">"{anchor.description}"</p><div className="mt-6 flex items-center gap-4"><div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${anchor.obsessionAtTime}%` }} /></div><span className="text-[10px] font-black text-gray-600 uppercase">Obsession Flux: {anchor.obsessionAtTime}%</span></div></div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-12 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto pb-20">
        {view === 'reb' && renderRebView()}
        {view === 'pc' && renderPcView()}
        {view === 'npcs' && renderNpcView()}
        {view === 'situations' && renderSituationsView()}
        {view === 'anchors' && renderAnchorsView()}
      </div>
    </div>
  );
};

// Simple icon for resolved status
const CheckCircle = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default Dashboard;
