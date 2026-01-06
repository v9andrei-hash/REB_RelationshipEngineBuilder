
import React, { useState, useEffect, useRef } from 'react';
import { gemini } from './services/geminiService';
import { Message, AnchorPoint, NPC, Situation, SceneSnapshot, SimulationIntervention, Chronicle, Item, Portrait, PlayerCharacter, RebCharacter } from './types';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import MetaTerminal from './components/MetaTerminal';
import ContextEditor from './components/ContextEditor';
import Dashboard from './components/Dashboard';
import { portraitService } from './services/imageService';

const STORAGE_KEY = 'reb_simulation_state';

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
  const [stats, setStats] = useState({
    adr: 0,
    oxy: 0,
    favor: 0,
    entropy: -50,
    willpower: 100,
    clarity: 100,
    pcObsession: 10,
    rebObsession: 10,
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
    // Robust name selection
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
    const stateToSave = { messages, systemContext, anchors, npcs, situations, inventory, sceneHistory, stats, situationCountdown, pc, reb };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [messages, systemContext, anchors, npcs, situations, inventory, sceneHistory, stats, situationCountdown, pc, reb]);

  const handleSystemCalibrate = async () => {
    if (isCalibrating || messages.length === 0) return;
    setIsCalibrating(true);
    try {
      const calibrationTags = await gemini.calibrateSimulation(messages);
      if (calibrationTags) {
        processResponseTelemetry(calibrationTags);
        const msg: Message = { role: 'model', content: `[SYSTEM_CALIBRATION_COMPLETE]: Reconstructed profiles and telemetry from historical analysis.`, isMeta: true };
        setMessages(prev => [...prev, msg]);
      }
    } finally {
      setIsCalibrating(false);
    }
  };

  const processResponseTelemetry = (fullResponse: string) => {
    const deltaMatch = fullResponse.match(/<!-- Δ (.*?) -->/);
    const npcMatches = Array.from(fullResponse.matchAll(/<!-- NPC\|(.*?) -->/g));
    const sitMatches = Array.from(fullResponse.matchAll(/<!-- SITUATION\|(.*?)\|(.*?)\|(.*?) -->/g));
    const invMatches = Array.from(fullResponse.matchAll(/<!-- INV\|(.*?)\|(.*?)\|(.*?)\|(.*?) -->/g));
    
    // Updated regex to capture 3 distinct parts for anchors as per instruction
    const anchorMatches = Array.from(fullResponse.matchAll(/<!-- ANCHOR\|(.*?)\|(.*?)\|(.*?) -->/g));
    
    // Updated regex to capture content after pipe for manual splitting
    const profileMatches = Array.from(fullResponse.matchAll(/<!-- PROFILE\|(.*?) -->/g));

    if (deltaMatch) {
      const deltaStr = deltaMatch[1];
      // More resilient stat parsing (allows : and spaces, e.g. "Ar: +10" or "Ar +10")
      const parseStat = (key: string) => {
        const m = deltaStr.match(new RegExp(`${key}[:\\s]*([+-]?\\d+)`));
        return m ? parseInt(m[1]) : 0;
      };
      setStats(prev => ({
        ...prev,
        adr: prev.adr + parseStat('Ar'),
        oxy: prev.oxy + parseStat('Ox'),
        favor: prev.favor + parseStat('Fv'),
        clarity: prev.clarity + parseStat('PCC'),
        willpower: prev.willpower + parseStat('PCW'),
        entropy: prev.entropy + parseStat('En'),
        pcObsession: Math.min(100, Math.max(0, prev.pcObsession + parseStat('PCO'))),
        rebObsession: Math.min(100, Math.max(0, prev.rebObsession + parseStat('RO')))
      }));
      
      const trnMatch = deltaStr.match(/TRN[:\s]*(\d+)\/(\d+)/);
      if (trnMatch) setSituationCountdown(Math.max(0, 5 - parseInt(trnMatch[1])));
    }

    if (profileMatches.length > 0) {
      profileMatches.forEach(m => {
        const content = m[1];
        // Split by first colon to separate ROLE from JSON data
        const sepIdx = content.indexOf(':');
        if (sepIdx === -1) return;
        
        const role = content.substring(0, sepIdx).trim();
        const dataStr = content.substring(sepIdx + 1).trim();
        
        try {
          const parsed = JSON.parse(dataStr);
          if (role === 'PC') setPc(prev => ({ ...prev, ...parsed, portrait: prev?.portrait }));
          if (role === 'REB') setReb(prev => ({ ...prev, ...parsed, portrait: prev?.portrait }));
        } catch (e) { console.error("Profile parse fail", e); }
      });
    }

    if (anchorMatches.length > 0) {
      const newAnchors: AnchorPoint[] = anchorMatches.map(m => {
        const value = parseInt(m[3] || '0');
        return {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          act: stats.act,
          week: stats.week,
          label: m[1] || 'Unknown Point',
          description: m[2] || 'No description.',
          obsessionAtTime: value,
          dominantForce: value > 50 ? 'PC' : 'REB'
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
        const map = new Map(prev.map(n => [n.name, n]));
        newNpcsRaw.forEach(n => {
          const existing = map.get(n.name);
          map.set(n.name, { ...n, portrait: existing?.portrait });
        });
        return Array.from(map.values());
      });
    }

    if (sitMatches.length > 0) {
      const newSituations: Situation[] = sitMatches.map(m => ({
        id: Math.random().toString(36).substr(2, 5),
        label: m[1],
        status: (m[2] as any) || 'In Deck',
        triggerCondition: m[3]
      }));
      setSituations(prev => {
        const map = new Map(prev.map(s => [s.label, s]));
        newSituations.forEach(s => map.set(s.label, s));
        return Array.from(map.values());
      });
    }

    if (invMatches.length > 0) {
      const newItems: Item[] = invMatches.map(m => ({
        id: Math.random().toString(36).substr(2, 5),
        owner: m[1],
        name: m[2],
        description: m[3],
        property: (m[4] as any) || 'Static'
      }));
      setInventory(prev => {
        const map = new Map(prev.map(i => [i.name, i]));
        newItems.forEach(i => map.set(i.name, i));
        return Array.from(map.values());
      });
    }
  };

  const handleSendMessage = async (text: string, isMeta: boolean = false) => {
    if (!text.trim() || isProcessing) return;
    const newUserMessage: Message = { role: 'user', content: text, isMeta };
    setMessages(prev => [...prev, newUserMessage]);
    setIsProcessing(true);

    try {
      let fullResponse = "";
      
      // Pass the filtered history (removing meta-logs) to the service
      // This ensures the narrative engine sees the full context even if the component reloaded
      const stream = isMeta 
        ? gemini.sendMetaMessageStream(text, messages)
        : await gemini.sendMessageStream(
            pendingQueue ? `[SYSTEM_QUEUE: ${pendingQueue}]\n${text}` : text,
            messages.filter(m => !m.isMeta)
          );

      if (!isMeta) setPendingQueue(null);

      setMessages(prev => [...prev, { role: 'model', content: '', hiddenStats: '', isMeta }]);

      for await (const chunk of stream) {
        fullResponse += (typeof chunk === 'string' ? chunk : chunk.text || '');
        setMessages(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, content: fullResponse }];
        });
      }

      // Restore turn and token counting
      const turnTokens = Math.floor((text.length + fullResponse.length) / 4);
      setStats(prev => ({ 
        ...prev, 
        tokens: prev.tokens + turnTokens, 
        turns: isMeta ? prev.turns : prev.turns + 1 
      }));

      if (!isMeta) processResponseTelemetry(fullResponse);

      setMessages(prev => {
        const last = prev[prev.length - 1];
        const cleanContent = fullResponse.replace(/<!--[\s\S]*?-->/g, '').trim();
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
    const chronicle: Chronicle = {
      version: "3.5.1",
      timestamp: new Date().toISOString(),
      summary: { actTitle: `Act ${stats.act}`, narrativeArc: "User Session", themes: [] },
      characters: { 
        pc: { name: pc?.name || "Unknown", initialState: "", currentState: "", progressionNote: "", momentum: "Stagnant" },
        reb: { name: reb?.name || "Unknown", initialState: "", currentState: "", progressionNote: "", momentum: "Stagnant" },
        npcs: []
      },
      telemetry: {
        finalStats: stats,
        history: sceneHistory,
        anchors,
        npcs,
        situations,
        inventory,
        pc,
        reb,
        systemContext
      },
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
          if (t.situations) setSituations(t.situations);
          if (t.inventory) setInventory(t.inventory);
          if (t.pc) setPc(t.pc);
          if (t.reb) setReb(t.reb);
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
        {view === 'meta' && <MetaTerminal messages={messages} onSend={(txt) => handleSendMessage(txt, true)} onUpdateKernel={async (c) => { gemini.setSystemInstruction(c); setSystemContext(c); }} onAnalyzeDrift={async () => { setIsAnalyzing(true); const res = await gemini.analyzeSimulation(messages, stats, situations, npcs); setInterventions(res); setIsAnalyzing(false); }} onCommitIntervention={(id) => { const inv = interventions.find(i => i.id === id); if (inv) handleSendMessage(`Enacting: ${inv.description}`, true); }} interventions={interventions} systemContext={systemContext} isProcessing={isProcessing} isCaching={isCaching} isAnalyzing={isAnalyzing} contextLoaded={!!systemContext} onSystemCalibrate={handleSystemCalibrate} isCalibrating={isCalibrating} />}
        {(view === 'reb' || view === 'pc' || view === 'anchors' || view === 'npcs' || view === 'situations') && (
          <Dashboard view={view} stats={stats} anchors={anchors} npcs={npcs} situations={situations} inventory={inventory} sceneHistory={sceneHistory} lastDelta={messages[messages.length-1]?.hiddenStats || ""} situationCountdown={situationCountdown} pc={pc} reb={reb} currentQuadrant={getCurrentQuadrant()} onRegeneratePortrait={handleGeneratePortrait} generatingPortraits={generatingPortraits} />
        )}
      </main>
    </div>
  );
};

export default App;
