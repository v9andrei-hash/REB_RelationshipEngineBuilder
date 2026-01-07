
import React, { useState, useEffect, useRef } from 'react';
import { gemini } from './services/geminiService';
import { Message, AnchorPoint, NPC, Situation, SceneSnapshot, SimulationIntervention, Chronicle, Item, Portrait, PlayerCharacter, RebCharacter, CharacterArc, ConfigurationType } from './types';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import MetaTerminal from './components/MetaTerminal';
import ContextEditor from './components/ContextEditor';
import Dashboard from './components/Dashboard';
import { portraitService } from './services/imageService';

const STORAGE_KEY = 'reb_simulation_state_v3.5';

const App: React.FC = () => {
  const [view, setView] = useState<'chat' | 'context' | 'reb' | 'pc' | 'anchors' | 'npcs' | 'situations' | 'meta'>('context');
  const [messages, setMessages] = useState<Message[]>([]);
  const [systemContext, setSystemContext] = useState<string>('');
  const [isCaching, setIsCaching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pendingQueue, setPendingQueue] = useState<string | null>(null);
  const [interventions, setInterventions] = useState<SimulationIntervention[]>([]);
  const [anchors, setAnchors] = useState<AnchorPoint[]>([]);
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [situations, setSituations] = useState<Situation[]>([]);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [sceneHistory, setSceneHistory] = useState<SceneSnapshot[]>([]);
  const [configuration, setConfiguration] = useState<ConfigurationType | undefined>();
  const [stats, setStats] = useState({
    adr: 0,
    oxy: 0,
    favor: 0,
    entropy: -50,
    willpower: 5, // v3.5 default
    clarity: 100, // v3.5 default
    pcAL: 0,
    pcAW: 15,
    pcOB: 30,
    rebAL: 0,
    rebAW: 20,
    rebOB: 35,
    week: 1,
    act: 1,
    tokens: 0,
    turns: 0
  });
  const [pc, setPc] = useState<PlayerCharacter | null>(null);
  const [reb, setReb] = useState<RebCharacter | null>(null);
  const [generatingPortraits, setGeneratingPortraits] = useState<string[]>([]);
  const [situationCountdown, setSituationCountdown] = useState(5);
  
  const getCurrentQuadrant = (): 'Q1' | 'Q2' | 'Q3' | 'Q4' => {
    const { adr, oxy } = stats;
    if (adr >= 0 && oxy >= 0) return 'Q1';
    if (adr < 0 && oxy >= 0) return 'Q2';
    if (adr < 0 && oxy < 0) return 'Q3';
    return 'Q4';
  };

  const handleGeneratePortrait = async (
    name: string, 
    role: 'PC' | 'REB' | 'NPC',
    extraData?: { temperament?: string; origin?: string; wound?: string }
  ) => {
    let targetName = name;
    if (!targetName) {
      if (role === 'REB') targetName = reb?.name || "REB";
      else if (role === 'PC') targetName = pc?.name || "PC";
      else targetName = "Unknown Entity";
    }
    
    setGeneratingPortraits(prev => [...prev, targetName]);
    
    try {
      const portrait = await portraitService.generatePortrait({
        name: targetName,
        role,
        currentQuadrant: getCurrentQuadrant(),
        temperament: extraData?.temperament || (role === 'REB' ? reb?.temperament : undefined),
        wound: extraData?.wound || (role === 'PC' ? pc?.wound : role === 'REB' ? reb?.wound : undefined),
        ...extraData
      });
      
      if (!portrait) return;
      
      if (role === 'PC') {
        setPc(prev => prev ? { ...prev, portrait } : { name: targetName, origin: '', wound: '', drive: '', skills: [], portrait });
      } else if (role === 'REB') {
        setReb(prev => prev ? { ...prev, portrait } : { name: targetName, origin: '', temperament: '', wound: '', drive: '', portrait });
      } else {
        setNpcs(prev => prev.map(npc => 
          npc.name === targetName ? { ...npc, portrait } : npc
        ));
      }
    } finally {
      setGeneratingPortraits(prev => prev.filter(n => n !== targetName));
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.messages || []);
        setSystemContext(parsed.systemContext || '');
        setAnchors(parsed.anchors || []);
        setNpcs(parsed.npcs || []);
        setPc(parsed.pc || null);
        setReb(parsed.reb || null);
        setConfiguration(parsed.configuration);
        setSituations(parsed.situations || []);
        setInventory(parsed.inventory || []);
        setSceneHistory(parsed.sceneHistory || []);
        setStats(parsed.stats || { ...stats, turns: 0 });
        setSituationCountdown(parsed.situationCountdown || 5);
        if (parsed.systemContext) {
          gemini.setSystemInstruction(parsed.systemContext);
          setView('chat');
        }
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    const stateToSave = { messages, systemContext, anchors, npcs, situations, inventory, sceneHistory, stats, situationCountdown, pc, reb, configuration };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [messages, systemContext, anchors, npcs, situations, inventory, sceneHistory, stats, situationCountdown, pc, reb, configuration]);

  const processResponseTelemetry = (fullResponse: string) => {
    const deltaMatch = fullResponse.match(/<!-- Δ (.*?) -->/);
    const configMatch = fullResponse.match(/<!-- CONFIG\|(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?) -->/);
    const npcMatches = Array.from(fullResponse.matchAll(/<!-- NPC\|(.*?) -->/g));
    const sitMatches = Array.from(fullResponse.matchAll(/<!-- SITUATION\|(.*?)\|(.*?)\|(.*?) -->/g));
    const invMatches = Array.from(fullResponse.matchAll(/<!-- INV\|(.*?)\|(.*?)\|(.*?)\|(.*?) -->/g));
    const anchorMatches = Array.from(fullResponse.matchAll(/<!-- ANCHOR\|(.*?)\|(.*?)\|(.*?) -->/g));
    const charMatches = Array.from(fullResponse.matchAll(/<!-- CHAR\|(PC|REB)\|N:([^|]+)\|O:([^|]+)\|W:([^|]+)\|(?:T:([^|]+)\|)?D:([^|]+)(?:\|WANT:([^|]+))?(?:\|NEED:([^|]+))?(?:\|S:([^> ]+))?\s*-->/g));

    if (configMatch) {
      setConfiguration(configMatch[1] as ConfigurationType);
    }

    if (deltaMatch) {
      const deltaStr = deltaMatch[1];
      const parseStat = (key: string) => {
        const m = deltaStr.match(new RegExp(`${key}[:\\s]*([+-]?\\d+)`));
        return m ? parseInt(m[1]) : 0;
      };
      setStats(prev => ({
        ...prev,
        adr: prev.adr + parseStat('Ar'),
        oxy: prev.oxy + parseStat('Ox'),
        favor: prev.favor + parseStat('Fv'),
        entropy: prev.entropy + parseStat('En'),
        pcAL: Math.min(100, Math.max(-100, prev.pcAL + parseStat('PC_AL'))),
        pcAW: Math.min(100, Math.max(0, prev.pcAW + parseStat('PC_AW'))),
        pcOB: Math.min(100, Math.max(0, prev.pcOB + parseStat('PC_OB'))),
        rebAL: Math.min(100, Math.max(-100, prev.rebAL + parseStat('REB_AL'))),
        rebAW: Math.min(100, Math.max(0, prev.rebAW + parseStat('REB_AW'))),
        rebOB: Math.min(100, Math.max(0, prev.rebOB + parseStat('REB_OB'))),
      }));
      
      const trnMatch = deltaStr.match(/TRN[:\s]*(\d+)\/(\d+)/);
      if (trnMatch) setSituationCountdown(Math.max(0, 5 - parseInt(trnMatch[1])));
    }

    if (charMatches.length > 0) {
      charMatches.forEach(m => {
        const [_, role, name, origin, wound, temperament, drive, want, need, skills] = m;
        const parsedSkills = skills ? skills.split(',').map(s => s.trim()) : [];
        if (role === 'PC') {
          setPc(prev => ({
            ...prev,
            name, origin, wound, drive, want, need,
            skills: parsedSkills.length > 0 ? parsedSkills : (prev?.skills || []),
            portrait: prev?.portrait
          }));
        } else if (role === 'REB') {
          setReb(prev => ({
            ...prev,
            name, origin, temperament, wound, drive, want, need,
            portrait: prev?.portrait
          }));
        }
      });
    }

    if (anchorMatches.length > 0) {
      const newAnchors: AnchorPoint[] = anchorMatches.map(m => {
        const parts = m[1].split('|');
        const value = parseInt(parts[2] || '0');
        return {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          act: stats.act,
          week: stats.week,
          label: parts[0] || 'Unknown Point',
          description: parts[1] || 'No description.',
          obsessionAtTime: value,
          dominantForce: value > 0 ? 'PC' : 'REB'
        };
      });
      setAnchors(prev => [...prev, ...newAnchors]);
    }

    if (npcMatches.length > 0) {
      const newNpcsRaw: NPC[] = npcMatches.map(m => {
        const parts = m[1].split('|');
        const [roleName, status] = parts;
        const [role, name] = roleName.includes(':') ? roleName.split(':') : [roleName, ''];
        return { name: name || role, role: role || 'Unknown', status: status || 'DORMANT', proximity: 'Medium' };
      });
      setNpcs(prev => {
        const map = new Map<string, NPC>(prev.map(n => [n.name, n] as [string, NPC]));
        newNpcsRaw.forEach(n => {
          const existing = map.get(n.name);
          map.set(n.name, { ...n, portrait: existing?.portrait });
        });
        return Array.from(map.values());
      });
    }
    
    // Auto-capture history snapshot after telemetry processing
    setSceneHistory(prev => [...prev.slice(-19), { 
      id: Math.random().toString(36).substr(2, 9), 
      timestamp: Date.now(), 
      act: stats.act, 
      week: stats.week, 
      stats: { ...stats } 
    }]);
  };

  const handleSendMessage = async (text: string, isMeta: boolean = false) => {
    if (!text.trim() || isProcessing) return;
    const newUserMessage: Message = { role: 'user', content: text, isMeta };
    setMessages(prev => [...prev, newUserMessage]);
    setIsProcessing(true);

    try {
      let fullResponse = "";
      const stream = isMeta 
        ? gemini.sendMetaMessageStream(text, messages)
        : await gemini.sendMessageStream(text, messages.filter(m => !m.isMeta));

      setMessages(prev => [...prev, { role: 'model', content: '', hiddenStats: '', isMeta }]);

      for await (const chunk of stream) {
        fullResponse += (typeof chunk === 'string' ? chunk : chunk.text || '');
        setMessages(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, content: fullResponse }];
        });
      }

      const turnTokens = Math.floor((text.length + fullResponse.length) / 4);
      setStats(prev => ({ 
        ...prev, 
        tokens: prev.tokens + turnTokens, 
        turns: isMeta ? prev.turns : prev.turns + 1 
      }));

      if (!isMeta) processResponseTelemetry(fullResponse);

      setMessages(prev => {
        const last = prev[prev.length - 1];
        const cleanContent = fullResponse.replace(/<!--[\s\S]*?-->/g, '').replace(/\[AWAITING INPUT\]/g, '').trim();
        return [...prev.slice(0, -1), { 
          ...last, 
          content: cleanContent, 
          hiddenStats: isMeta ? '' : fullResponse, 
          compliance: isMeta ? { isPassed: true, violations: [] } : gemini.validateResponse(fullResponse)
        }];
      });
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "Engine error: Connection severed." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    const pcArc: CharacterArc = {
      name: pc?.name || "Unknown",
      want: pc?.want,
      need: pc?.need,
      initialState: pc?.origin || "Unknown Origin",
      currentState: pc?.drive || "Unknown Drive",
      progressionNote: "Active session progress",
      momentum: "Stagnant"
    };

    const rebArc: CharacterArc = {
      name: reb?.name || "Unknown",
      want: reb?.want,
      need: reb?.need,
      initialState: reb?.origin || "Unknown Origin",
      currentState: reb?.drive || "Unknown Drive",
      progressionNote: "Active surveillance",
      momentum: "Stagnant"
    };

    const chronicle: Chronicle = {
      version: "3.5.1",
      timestamp: new Date().toISOString(),
      summary: { actTitle: `Act ${stats.act}`, narrativeArc: "User Session", themes: [] },
      characters: { pc: pcArc, reb: rebArc, npcs: [] },
      telemetry: { finalStats: stats, history: sceneHistory, anchors, npcs, situations, inventory, pc, reb, systemContext, configuration },
      log: messages,
      resumptionPayload: ""
    };
    
    const blob = new Blob([JSON.stringify(chronicle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `REB_CHRONICLE_${Date.now()}.json`;
    a.click();
    setIsExporting(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.log) setMessages(data.log);
        if (data.telemetry) {
          const t = data.telemetry;
          if (t.finalStats) setStats(t.finalStats);
          if (t.anchors) setAnchors(t.anchors);
          if (t.npcs) setNpcs(t.npcs);
          if (t.pc) setPc(t.pc);
          if (t.reb) setReb(t.reb);
          if (t.configuration) setConfiguration(t.configuration);
          if (t.systemContext) {
            setSystemContext(t.systemContext);
            gemini.setSystemInstruction(t.systemContext);
          }
        }
        alert("Chronicle synthesized successfully.");
      } catch (err) {
        alert("Corrupted chronicle data.");
      }
    };
    reader.readAsText(file);
  };

  const handleClearSession = () => { if (confirm("Initialize system wipe?")) { localStorage.removeItem(STORAGE_KEY); window.location.reload(); } };

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] overflow-hidden text-sm">
      <Sidebar 
        currentView={view} setView={setView} stats={stats} 
        anchorCount={anchors.length} npcCount={npcs.length} sitCount={situations.length}
        onExport={handleExport} onImport={handleImport} onClear={handleClearSession}
        isExporting={isExporting}
      />
      <main className="flex-1 flex flex-col relative">
        {view === 'context' && <ContextEditor onSave={async (c) => { setIsCaching(true); await gemini.setSystemInstruction(c); setSystemContext(c); setIsCaching(false); setView('chat'); }} isCaching={isCaching} initialValue={systemContext} />}
        {view === 'chat' && <ChatInterface messages={messages} onSend={(txt) => handleSendMessage(txt, false)} isProcessing={isProcessing} contextLoaded={!!systemContext} onPlayTTS={(text) => gemini.generateSpeech(text)} />}
        {view === 'meta' && <MetaTerminal messages={messages} onSend={(txt) => handleSendMessage(txt, true)} onUpdateKernel={async (c) => { gemini.setSystemInstruction(c); setSystemContext(c); }} onAnalyzeDrift={async () => { setIsAnalyzing(true); const res = await gemini.analyzeSimulation(messages, stats, situations, npcs); setInterventions(res); setIsAnalyzing(false); }} onCommitIntervention={(id) => { const inv = interventions.find(i => i.id === id); if (inv) handleSendMessage(`Enacting: ${inv.description}`, true); }} interventions={interventions} systemContext={systemContext} isProcessing={isProcessing} isCaching={isCaching} isAnalyzing={isAnalyzing} contextLoaded={!!systemContext} onSystemCalibrate={() => gemini.calibrateSimulation(messages).then(processResponseTelemetry)} isCalibrating={isCalibrating} />}
        {(view === 'reb' || view === 'pc' || view === 'anchors' || view === 'npcs' || view === 'situations') && (
          <Dashboard view={view} stats={stats} anchors={anchors} npcs={npcs} situations={situations} inventory={inventory} sceneHistory={sceneHistory} lastDelta={messages[messages.length-1]?.hiddenStats || ""} situationCountdown={situationCountdown} pc={pc} reb={reb} currentQuadrant={getCurrentQuadrant()} onRegeneratePortrait={handleGeneratePortrait} generatingPortraits={generatingPortraits} configuration={configuration} />
        )}
      </main>
    </div>
  );
};

export default App;
