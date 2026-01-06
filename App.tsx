
import React, { useState, useEffect, useRef } from 'react';
import { gemini } from './services/geminiService';
import { Message, AnchorPoint, NPC, Situation, SceneSnapshot, SimulationIntervention, Chronicle, Item } from './types';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import MetaTerminal from './components/MetaTerminal';
import ContextEditor from './components/ContextEditor';
import Dashboard from './components/Dashboard';
import { portraitService } from './services/imageService';
import { Portrait, PlayerCharacter, RebCharacter } from './types';

const STORAGE_KEY = 'reb_simulation_state';

const App: React.FC = () => {
  const [view, setView] = useState<'chat' | 'context' | 'reb' | 'pc' | 'anchors' | 'npcs' | 'situations' | 'meta'>('context');
  const [messages, setMessages] = useState<Message[]>([]);
  const [systemContext, setSystemContext] = useState<string>('');
  const [isCaching, setIsCaching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
  const getCurrentQuadrant = (): 'Q1' | 'Q2' | 'Q3' | 'Q4' => {
  const { adr, oxy } = stats;  // Extract adr and oxy from stats object
  
  // Check which quadrant based on positive/negative values
  if (adr >= 0 && oxy >= 0) return 'Q1';  // Both positive = Symbiote
  if (adr < 0 && oxy >= 0) return 'Q2';   // Low adr, high oxy = Domestic
  if (adr < 0 && oxy < 0) return 'Q3';    // Both negative = Void
  return 'Q4';                             // High adr, low oxy = Combustion
};
const handleGeneratePortrait = async (
  name: string, 
  role: 'PC' | 'REB' | 'NPC',
  extraData?: { temperament?: string; origin?: string; wound?: string }
) => {
  // Step 1: Mark this character as "generating"
  setGeneratingPortraits(prev => [...prev, name]);
  
  try {
    // Step 2: Call the portrait service
    const portrait = await portraitService.generatePortrait({
      name,
      role,
      currentQuadrant: getCurrentQuadrant(),
      ...extraData  // Spread operator: includes all properties from extraData
    });
    
    if (!portrait) return;  // If generation failed, stop here
    
    // Step 3: Save the portrait to the right character
    if (role === 'PC') {
      setPc(prev => prev ? { ...prev, portrait } : null);
    } else if (role === 'REB') {
      setReb(prev => prev ? { ...prev, portrait } : null);
    } else {
      // For NPCs, find the matching one and update it
      setNpcs(prev => prev.map(npc => 
        npc.name === name ? { ...npc, portrait } : npc
      ));
    }
  } finally {
    // Step 4: Remove from "generating" list (runs even if error occurred)
    setGeneratingPortraits(prev => prev.filter(n => n !== name));
  }
};

  const [situationCountdown, setSituationCountdown] = useState(5);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.messages || []);
        setSystemContext(parsed.systemContext || '');
        setAnchors(parsed.anchors || []);
        setNpcs(parsed.npcs || []);
        setSituations(parsed.situations || []);
        setInventory(parsed.inventory || []);
        setSceneHistory(parsed.sceneHistory || []);
        setStats(parsed.stats || { ...stats, turns: 0 });
        setSituationCountdown(parsed.situationCountdown || 5);
        if (parsed.systemContext) {
          gemini.setSystemInstruction(parsed.systemContext);
          setView('chat');
        }
      } catch (e) {
        console.error("Failed to load saved state", e);
      }
    }
  }, []);

  useEffect(() => {
    const stateToSave = {
      messages,
      systemContext,
      anchors,
      npcs,
      situations,
      inventory,
      sceneHistory,
      stats,
      situationCountdown
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [messages, systemContext, anchors, npcs, situations, inventory, sceneHistory, stats, situationCountdown]);

  const handleCacheContext = async (context: string) => {
    setIsCaching(true);
    await new Promise(r => setTimeout(r, 1500));
    gemini.setSystemInstruction(context);
    setSystemContext(context);
    setStats(prev => ({ ...prev, tokens: Math.floor(context.length / 4) }));
    setIsCaching(false);
    if (view === 'context') setView('chat');
  };

  const handleAnalyzeDrift = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const results = await gemini.analyzeSimulation(messages, stats, situations);
      setInterventions(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCommitIntervention = (id: string) => {
    const inv = interventions.find(i => i.id === id);
    if (!inv) return;
    if (inv.targetStats) {
      setStats(prev => ({ ...prev, ...inv.targetStats }));
    }
    setPendingQueue(inv.proposedFix);
    setInterventions(prev => prev.filter(i => i.id !== id));
    const msg: Message = { role: 'user', content: `[COMMIT_INTERVENTION: ${inv.type}]`, isMeta: true };
    setMessages(prev => [...prev, msg]);
    setView('meta');
    handleSendMessage(`Executing targeted correction: ${inv.description}`, true);
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
        : gemini.sendMessageStream(pendingQueue ? `[SYSTEM_QUEUE: ${pendingQueue}]\n${text}` : text);

      if (!isMeta) setPendingQueue(null);

      setMessages(prev => [...prev, { 
        role: 'model', 
        content: '', 
        hiddenStats: '', 
        isMeta,
        compliance: { isPassed: true, violations: [] } 
      }]);

      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, content: fullResponse }];
        });
      }

      if (!isMeta) {
        const deltaMatch = fullResponse.match(/<!-- Δ (.*?) -->/);
        const npcMatches = Array.from(fullResponse.matchAll(/<!-- NPC\|(.*?) -->/g));
        const sitMatches = Array.from(fullResponse.matchAll(/<!-- SITUATION\|(.*?)\|(.*?)\|(.*?) -->/g));
        const resMatches = Array.from(fullResponse.matchAll(/<!-- RESOLUTION\|(.*?)\|(.*?) -->/g));
        const invMatches = Array.from(fullResponse.matchAll(/<!-- INV\|(.*?)\|(.*?)\|(.*?)\|(.*?) -->/g));
        const anchorMatches = Array.from(fullResponse.matchAll(/<!-- ANCHOR\|(.*?)\|(.*?)\|(.*?) -->/g));
        const sceneEnd = fullResponse.includes('<!-- SCENE_END -->');
        
        const turnTokens = Math.floor((text.length + fullResponse.length) / 4);
        let updatedStats = { ...stats, tokens: stats.tokens + turnTokens, turns: stats.turns + 1 };

        if (deltaMatch) {
          const deltaStr = deltaMatch[1];
          const parseStat = (key: string) => {
            const m = deltaStr.match(new RegExp(`${key}([+-]?\\d+)`));
            return m ? parseInt(m[1]) : 0;
          };
          
          updatedStats.adr += parseStat('Ar');
          updatedStats.oxy += parseStat('Ox');
          updatedStats.favor += parseStat('Fv');
          updatedStats.clarity += parseStat('PCC');
          updatedStats.willpower += parseStat('PCW');
          
          // Narrative physics updates (En, PCO, RO)
          updatedStats.entropy += parseStat('En');
          updatedStats.pcObsession = Math.min(100, Math.max(0, updatedStats.pcObsession + parseStat('PCO')));
          updatedStats.rebObsession = Math.min(100, Math.max(0, updatedStats.rebObsession + parseStat('RO')));

          const trnMatch = deltaStr.match(/TRN:(\d+)\/(\d+)/);
          if (trnMatch) setSituationCountdown(Math.max(0, 5 - parseInt(trnMatch[1])));
        }

        if (npcMatches.length > 0) {
          const newNpcs: NPC[] = npcMatches.map(m => {
            const parts = m[1].split('|');
            const [roleName, status] = parts;
            const [role, name] = roleName.includes(':') ? roleName.split(':') : [roleName, ''];
            return { name: name || role, role: role || 'Unknown', status: status || 'DORMANT', proximity: 'Medium' };
          });
          setNpcs(prev => {
            const map = new Map(prev.map(n => [n.name, n]));
            newNpcs.forEach(n => map.set(n.name, n));
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

        if (resMatches.length > 0) {
          setSituations(prev => prev.map(sit => {
            const match = resMatches.find(m => m[1] === sit.label);
            if (match) {
              return { ...sit, status: 'Resolved', resolutionSummary: match[2] };
            }
            return sit;
          }));
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

        if (anchorMatches.length > 0) {
           const newAnchors: AnchorPoint[] = anchorMatches.map(m => ({
             id: Math.random().toString(36).substr(2, 5),
             timestamp: Date.now(),
             act: updatedStats.act,
             week: updatedStats.week,
             label: m[1],
             description: m[2],
             obsessionAtTime: parseInt(m[3]) || 0,
             dominantForce: parseInt(m[3]) > 50 ? 'PC' : 'REB'
           }));
           setAnchors(prev => {
             const map = new Map(prev.map(a => [a.label, a]));
             newAnchors.forEach(a => map.set(a.label, a));
             return Array.from(map.values());
           });
        }

        if (sceneEnd) {
          const snapshot: SceneSnapshot = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            act: updatedStats.act,
            week: updatedStats.week,
            stats: { ...updatedStats }
          };
          setSceneHistory(prev => [snapshot, ...prev].slice(0, 10));
        }
        setStats(updatedStats);
      }

      setMessages(prev => {
        const last = prev[prev.length - 1];
        const cleanContent = fullResponse.replace(/<!--[\s\S]*?-->/g, '').trim();
        if (isMeta && (text.toLowerCase().includes('fix') || text.toLowerCase().includes('crux'))) {
           setPendingQueue(`[ARCHITECT_NOTE]: Administrative adjustment applied. Strategy: ${cleanContent.slice(0, 150)}...`);
        }
        return [...prev.slice(0, -1), { 
          ...last, 
          content: cleanContent, 
          hiddenStats: isMeta ? '' : fullResponse, 
          isMeta,
          compliance: isMeta ? { isPassed: true, violations: [] } : gemini.validateResponse(fullResponse)
        }];
      });
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "Engine error: Connection severed." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportChronicle = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const narrativeHistory = messages.filter(m => !m.isMeta);
      const synthesis = await gemini.synthesizeChronicle(narrativeHistory, stats, anchors, npcs);
      const chronicle: Chronicle = {
        version: "3.5.1",
        timestamp: new Date().toISOString(),
        summary: synthesis?.summary || { actTitle: "Untitled", narrativeArc: "N/A", themes: [] },
        characters: synthesis?.characters || { pc: {} as any, reb: {} as any, npcs: [] },
        telemetry: { 
          finalStats: stats, 
          history: sceneHistory, 
          anchors: anchors,
          npcs: npcs,
          situations: situations,
          inventory: inventory,
          systemContext: systemContext
        },
        log: narrativeHistory,
        resumptionPayload: synthesis?.resumptionPayload || ""
      };
      const blob = new Blob([JSON.stringify(chronicle, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `REB_Chronicle_v3.5.1_${new Date().getTime()}.json`;
      a.click();
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportChronicle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const chronicle: Chronicle = JSON.parse(e.target?.result as string);
        if (!chronicle.telemetry || !chronicle.log) throw new Error("Invalid format");
        setMessages(chronicle.log);
        setStats(chronicle.telemetry.finalStats);
        setAnchors(chronicle.telemetry.anchors || []);
        setNpcs(chronicle.telemetry.npcs || []);
        setSituations(chronicle.telemetry.situations || []);
        setInventory(chronicle.telemetry.inventory || []);
        setSceneHistory(chronicle.telemetry.history || []);
        if (chronicle.telemetry.systemContext) {
          setSystemContext(chronicle.telemetry.systemContext);
          gemini.setSystemInstruction(chronicle.telemetry.systemContext);
        }
        setView('chat');
        setInterventions([]); 
      } catch (err) {
        alert("Sync failed: Data corruption or invalid format.");
      }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };

  const handleClearSession = () => {
    if (confirm("Initialize system wipe?")) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] overflow-hidden text-sm">
      <Sidebar 
        currentView={view} 
        setView={setView} 
        stats={stats} 
        anchorCount={anchors.length}
        npcCount={npcs.length}
        sitCount={situations.length}
        isExporting={isExporting}
        onExport={handleExportChronicle}
        onImport={handleImportChronicle}
        onClear={handleClearSession}
      />
      <main className="flex-1 flex flex-col relative">
        {view === 'context' && (
          <ContextEditor onSave={handleCacheContext} isCaching={isCaching} initialValue={systemContext} />
        )}
        {view === 'chat' && (
          <ChatInterface messages={messages} onSend={(txt) => handleSendMessage(txt, false)} isProcessing={isProcessing} contextLoaded={!!systemContext} onPlayTTS={(text) => gemini.generateSpeech(text)} />
        )}
        {view === 'meta' && (
          <MetaTerminal messages={messages} onSend={(txt) => handleSendMessage(txt, true)} onUpdateKernel={handleCacheContext} onAnalyzeDrift={handleAnalyzeDrift} onCommitIntervention={handleCommitIntervention} interventions={interventions} systemContext={systemContext} isProcessing={isProcessing} isCaching={isCaching} isAnalyzing={isAnalyzing} contextLoaded={!!systemContext} />
        )}
        {(view === 'reb' || view === 'pc' || view === 'anchors' || view === 'npcs' || view === 'situations') && (
          <Dashboard view={view} stats={stats} anchors={anchors} npcs={npcs} situations={situations} inventory={inventory} sceneHistory={sceneHistory} lastDelta={messages[messages.length-1]?.hiddenStats || ""} situationCountdown={situationCountdown} pc={pc} reb={reb} currentQuadrant={getCurrentQuadrant()} onRegeneratePortrait={handleGeneratePortrait} generatingPortraits={generatingPortraits} />
        )}
      </main>
    </div>
  );
};

export default App;
