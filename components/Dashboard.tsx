import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid, AreaChart, Area, ReferenceLine, ReferenceArea } from 'recharts';
import { Zap, TrendingUp, Shield, Thermometer, Activity, Users, Layers, Timer, Milestone, Brain, Flame, ArrowUpRight, Crosshair, Package, Archive, Box, Star, Eye, Target, Link, Map, Film, ShieldAlert, Clock } from 'lucide-react';
import { NPCState, SituationState, AnchorPoint, SceneSnapshot, Item, PlayerCharacter, RebCharacter, ConfigurationType, WorldState, PressureSource } from '../types';
import PortraitDisplay from './PortraitDisplay';

interface DashboardProps {
  view: 'reb' | 'pc' | 'world' | 'anchors' | 'npcs' | 'situations';
  stats: any;
  anchors: AnchorPoint[];
  npcs: any[];
  situations: SituationState[];
  inventory: Item[];
  sceneHistory: SceneSnapshot[];
  lastDelta?: string;
  situationCountdown?: number;
  pc?: PlayerCharacter | null;
  reb?: RebCharacter | null;
  world?: WorldState;
  pressures?: PressureSource[];
  currentQuadrant?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  configuration?: ConfigurationType;
  onRegeneratePortrait?: (name: string, role: 'PC' | 'REB' | 'NPC', extraData?: any) => void;
  generatingPortraits?: string[]
}

const Dashboard: React.FC<DashboardProps> = ({ 
  view, stats, anchors, npcs, situations, inventory, sceneHistory, lastDelta, 
  situationCountdown = 5, pc, reb, world, pressures = [], currentQuadrant, configuration, onRegeneratePortrait, generatingPortraits = [] 
}) => {

  const tensionPoint = [
    { x: stats.adr, y: stats.oxy, name: 'Current State' }
  ];

  const shadowLeakRisk = Math.abs(stats.adr) > 350 || Math.abs(stats.oxy) > 400 ? 'CRITICAL' : (Math.abs(stats.adr) > 250 || Math.abs(stats.oxy) > 300 ? 'HIGH' : 'STABLE');

  const ArcTriad = ({ al, aw, ob, want, need, role, origin, wound, drive }: { al: number, aw: number, ob: number, want?: string, need?: string, role: string, origin?: string, wound?: string, drive?: string }) => {
    const getAwarenessLabel = (val: number) => {
      if (val < 20) return 'BLIND';
      if (val < 40) return 'DEFENDED';
      if (val < 60) return 'GLIMPSING';
      if (val < 80) return 'SEEING';
      return 'LUCID';
    };

    return (
      <div className="bg-[#0f0f0f] border border-white/5 rounded-[32px] p-8 space-y-8">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{role} ARCHITECTURE</span>
          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${aw > 80 ? 'bg-amber-500/10 text-amber-500 animate-pulse' : 'bg-white/5 text-gray-400'}`}>
            Status: {getAwarenessLabel(aw)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
           <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
             <span className="text-[8px] text-gray-600 font-black uppercase block mb-1">Origin</span>
             <span className="text-[10px] text-white font-bold uppercase truncate block">{origin || "???"}</span>
           </div>
           <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
             <span className="text-[8px] text-gray-600 font-black uppercase block mb-1">Core Wound</span>
             <span className="text-[10px] text-red-400 font-bold uppercase truncate block">{wound || "???"}</span>
           </div>
           <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
             <span className="text-[8px] text-gray-600 font-black uppercase block mb-1">Psych Drive</span>
             <span className="text-[10px] text-blue-400 font-bold uppercase truncate block">{drive || "???"}</span>
           </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase">
              <span className="text-blue-400">Want: {want || 'Unknown'}</span>
              <span className="text-orange-400">Need: {need || 'Unknown'}</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative border border-white/5">
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white z-10 shadow-[0_0_8px_white]" 
                style={{ left: `${((al + 100) / 200) * 100}%` }} 
              />
              <div className="h-full bg-gradient-to-r from-blue-600/30 via-transparent to-orange-600/30" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-600 font-black uppercase">Awareness</span>
                <span className="text-xs font-mono text-white">{aw}%</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${aw}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-600 font-black uppercase">Obsession</span>
                <span className="text-xs font-mono text-white">{ob}%</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-red-600" style={{ width: `${ob}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRebView = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-[#111] border border-white/5 rounded-[40px] p-8 gap-8">
        <div className="flex items-center gap-6 flex-1">
          <PortraitDisplay 
            portrait={reb?.portrait}
            name={reb?.name || "REB_ENTITY"}
            role="REB"
            size="xl"
            quadrant={currentQuadrant}
            onRegenerate={onRegeneratePortrait ? () => onRegeneratePortrait(reb?.name || "REB", "REB") : undefined}
            isGenerating={generatingPortraits.includes(reb?.name || "REB")}
          />
          <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">{reb?.name || "REB Surveillance"}</h2>
            <div className="mt-4 flex gap-3">
              <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] text-blue-400 font-black uppercase italic">
                {reb?.temperament || 'Unknown Temperament'}
              </span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-gray-400 font-black uppercase italic">
                {reb?.origin || 'Unknown Origin'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 items-end">
          {configuration && (
            <div className="px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-xl text-[10px] text-blue-400 font-black uppercase italic flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <Link size={12} />
              Engine: {configuration}
            </div>
          )}
          <div className={`px-4 py-2 border rounded-xl text-[10px] font-black uppercase italic ${
            shadowLeakRisk === 'CRITICAL' ? 'bg-red-500/10 border-red-500 text-red-500 animate-pulse' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
          }`}>
            Shadow Risk: {shadowLeakRisk}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ArcTriad role="REB" al={stats.rebAL} aw={stats.rebAW} ob={stats.rebOB} want={reb?.want} need={reb?.need} origin={reb?.origin} wound={reb?.wound} drive={reb?.drive} />
        
        <div className="bg-[#111] border border-white/5 rounded-[40px] p-8 flex flex-col relative">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Singularity Radar</h3>
            <div className="text-[8px] text-gray-600 font-mono uppercase">X: Adrenaline | Y: Oxytocin</div>
          </div>
          <div className="flex-1 min-h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis type="number" dataKey="x" hide domain={[-500, 500]} />
                <YAxis type="number" dataKey="y" hide domain={[-500, 500]} />
                
                <ReferenceArea x1={350} x2={500} y1={350} y2={500} fill="#f59e0b" fillOpacity={0.1} label={{ position: 'center', value: 'SUPERNOVA', fill: '#f59e0b', fontSize: 10, fontWeight: 900 }} />
                <ReferenceArea x1={-500} x2={-350} y1={-500} y2={-350} fill="#6366f1" fillOpacity={0.1} label={{ position: 'center', value: 'EVENT HORIZON', fill: '#6366f1', fontSize: 10, fontWeight: 900 }} />
                
                <ReferenceLine x={0} stroke="#333" strokeDasharray="5 5" />
                <ReferenceLine y={0} stroke="#333" strokeDasharray="5 5" />
                
                <Scatter name="State" data={tensionPoint} fill="#3b82f6" shape="cross" className="filter drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#111] p-6 rounded-3xl border border-white/5">
           <span className="text-[9px] text-gray-500 uppercase font-black block mb-2">Entropy Flux</span>
           <div className="text-2xl font-black text-purple-400 italic mono">{stats.entropy}</div>
        </div>
        <div className="bg-[#111] p-6 rounded-3xl border border-white/5">
           <span className="text-[9px] text-gray-500 uppercase font-black block mb-2">Engine Favor</span>
           <div className="text-2xl font-black text-cyan-400 italic mono">{stats.favor}</div>
        </div>
        <div className="bg-[#111] p-6 rounded-3xl border border-white/5">
           <span className="text-[9px] text-gray-500 uppercase font-black block mb-2">Adrenaline</span>
           <div className="text-2xl font-black text-blue-400 italic mono">{stats.adr}</div>
        </div>
        <div className="bg-[#111] p-6 rounded-3xl border border-white/5">
           <span className="text-[9px] text-gray-500 uppercase font-black block mb-2">Oxytocin</span>
           <div className="text-2xl font-black text-pink-400 italic mono">{stats.oxy}</div>
        </div>
      </div>
    </div>
  );

  const renderPcView = () => (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      <div className="flex items-center bg-[#111] border border-white/5 rounded-[40px] p-8 gap-8">
        <PortraitDisplay 
          portrait={pc?.portrait}
          name={pc?.name || "PLAYER_CHARACTER"}
          role="PC"
          size="xl"
          quadrant={currentQuadrant}
          onRegenerate={onRegeneratePortrait ? () => onRegeneratePortrait(pc?.name || "PC", "PC") : undefined}
          isGenerating={generatingPortraits.includes(pc?.name || "PC")}
        />
        <div className="flex-1">
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">{pc?.name || "PC Psychology"}</h2>
          <div className="mt-4 flex flex-wrap gap-3">
             {pc?.skills?.map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-[10px] text-orange-400 font-black uppercase italic">
                  {skill}
                </span>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ArcTriad role="PC" al={stats.pcAL} aw={stats.pcAW} ob={stats.pcOB} want={pc?.want} need={pc?.need} origin={pc?.origin} wound={pc?.wound} drive={pc?.drive} />
        
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-[#111] p-8 rounded-[40px] border border-white/5 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-500 font-black uppercase flex items-center gap-2">
                  <Flame size={14} className="text-red-500" /> Obsession Amplifier
                </span>
                <span className="text-lg font-black text-white italic mono">
                  {(1 + stats.pcOB / 100).toFixed(2)}x
                </span>
              </div>
              <p className="text-[9px] text-gray-600">
                All Alignment changes multiplied by this factor
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-500 font-black uppercase flex items-center gap-2">
                  <Target size={14} className="text-amber-400" /> CRUX Pattern
                </span>
                <span className={`text-sm font-black uppercase ${
                  stats.pcAL < -20 ? 'text-blue-400' : stats.pcAL > 20 ? 'text-orange-400' : 'text-gray-400'
                }`}>
                  {stats.pcAL < -20 ? 'WANT-PURSUIT' : stats.pcAL > 20 ? 'NEED-APPROACH' : 'LIMINAL'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWorldView = () => (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#111] border border-white/5 rounded-[40px] p-10 flex flex-col gap-8">
           <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500"><Map size={32} /></div>
              <div>
                 <h2 className="text-2xl font-black text-white italic uppercase">Stage Geometry</h2>
                 <p className="text-[10px] text-gray-500 font-black uppercase">Session Identity Matrix</p>
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                 <span className="text-[10px] text-gray-600 font-black uppercase block mb-2 flex items-center gap-2"><Clock size={12} /> Narrative Era</span>
                 <span className="text-xl font-black text-white italic uppercase tracking-tight">{world?.era || "Unset"}</span>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                 <span className="text-[10px] text-gray-600 font-black uppercase block mb-2 flex items-center gap-2"><Film size={12} /> Narrative Genre</span>
                 <span className="text-xl font-black text-white italic uppercase tracking-tight">{world?.genre || "Unset"}</span>
              </div>
           </div>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-[40px] p-10 flex flex-col gap-6 overflow-hidden">
           <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-orange-500/10 rounded-2xl text-orange-500"><Activity size={32} /></div>
              <div>
                 <h2 className="text-2xl font-black text-white italic uppercase">Active Pressures</h2>
                 <p className="text-[10px] text-gray-500 font-black uppercase">Simulation Conflict Stack</p>
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar-meta">
              {pressures.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-20 border border-dashed border-white/10 rounded-3xl">
                   <Shield size={32} className="mb-2" />
                   <p className="text-[10px] font-black uppercase">No Conflict Pressures Active</p>
                </div>
              ) : (
                pressures.map((p, i) => (
                  <div key={i} className={`p-4 rounded-2xl border flex justify-between items-center ${p.active ? 'bg-orange-500/5 border-orange-500/20' : 'bg-white/5 border-white/10 opacity-50'}`}>
                     <div className="flex items-center gap-4">
                        <span className="text-[9px] font-black uppercase bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded tracking-tighter">{p.tier}</span>
                        <span className="text-xs font-bold text-white uppercase">{p.source}</span>
                     </div>
                     {p.active && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />}
                  </div>
                ))
              )}
           </div>
        </div>
      </div>

      <div className="bg-[#111] border border-white/5 rounded-[40px] p-10">
         <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-8 flex items-center gap-2">
            <ShieldAlert size={14} className="text-blue-500" /> Compliance Audit: World Coherence
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
               <div className="flex justify-between text-[10px] font-black uppercase">
                  <span className="text-gray-500">Period Fidelity</span>
                  <span className="text-blue-400">98%</span>
               </div>
               <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: '98%' }} /></div>
            </div>
            <div className="space-y-2">
               <div className="flex justify-between text-[10px] font-black uppercase">
                  <span className="text-gray-500">Genre Compliance</span>
                  <span className="text-blue-400">92%</span>
               </div>
               <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: '92%' }} /></div>
            </div>
            <div className="space-y-2">
               <div className="flex justify-between text-[10px] font-black uppercase">
                  <span className="text-gray-500">Tone Stability</span>
                  <span className="text-blue-400">100%</span>
               </div>
               <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: '100%' }} /></div>
            </div>
         </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-12 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto pb-20">
        {view === 'reb' && renderRebView()}
        {view === 'pc' && renderPcView()}
        {view === 'world' && renderWorldView()}
        {view === 'npcs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {npcs.map((npc, idx) => (
              <div key={idx} className="bg-[#111] border border-white/5 p-8 rounded-[40px] flex items-start gap-6">
                <PortraitDisplay portrait={npc.portrait} name={npc.name} role="NPC" status={npc.status as any} size="lg" />
                <div className="pt-2">
                  <h4 className="text-xl font-black text-white italic tracking-tight">{npc.name}</h4>
                  <p className="text-[10px] text-blue-400 uppercase font-black mb-4">{npc.role}</p>
                  <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${npc.status === 'ACTING' ? 'bg-red-500/10 text-red-400' : 'bg-gray-500/10 text-gray-500'}`}>
                    {npc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        {view === 'anchors' && (
          <div className="space-y-6">
            {anchors.map((anchor) => (
              <div key={anchor.id} className="bg-[#111] border border-white/5 p-10 rounded-[40px] flex gap-10 items-center">
                <div className="p-6 bg-white/5 rounded-3xl min-w-[100px] text-center">
                  <span className="text-[10px] text-gray-500 font-black uppercase">W{anchor.week}</span>
                  <div className="text-2xl font-black text-white italic">ACT {anchor.act}</div>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-white uppercase italic mb-2">{anchor.label}</h4>
                  <p className="text-sm text-gray-400 italic">"{anchor.description}"</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {view === 'situations' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {situations.map((sit) => (
               <div key={sit.id} className="bg-[#111] border border-white/5 p-8 rounded-[40px]">
                 <div className="flex justify-between items-center mb-4">
                   <h4 className="text-lg font-black text-white italic">{sit.label}</h4>
                   <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${sit.status === 'TRIGGERED' ? 'bg-orange-500/10 text-orange-500' : sit.status === 'RESOLVED' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                     {sit.status}
                   </span>
                 </div>
                 <p className="text-xs text-gray-400 mb-4 tracking-tight uppercase font-bold tracking-widest">Trigger: {sit.triggerCondition}</p>
                 {sit.resolutionSummary && <p className="text-xs text-blue-300 italic">Result: {sit.resolutionSummary}</p>}
               </div>
             ))}
           </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;