import React, { useState, useCallback, useRef } from 'react';
import { gemini } from './services/geminiService';
import { Message, SystemLogEntry } from './types';
import Sidebar from './components/Sidebar';
import SimulationTerminal from './components/SimulationTerminal';
import SystemLog from './components/SystemLog';
import Dashboard from './components/Dashboard';
import SettingsPanel from './components/SettingsPanel';
import { SimulationProvider } from './context/SimulationContext';
import { useSimulation } from './hooks/useSimulation';
import { selectDashboardStats, selectCruxReadiness, selectSituationSuggestion } from './state/selectors';
import { createInitialState } from './state/initial';
import { routeOutput } from './services/outputRouter';
import { checkSemanticDrift } from './services/semanticValidator';
import { checkCoherence, formatCoherenceWarning } from './services/coherenceValidator';

const AppContent: React.FC = () => {
  const [view, setView] = useState<'chat' | 'settings' | 'reb' | 'pc' | 'world' | 'anchors' | 'npcs' | 'situations'>('settings');
  const [messages, setMessages] = useState<Message[]>([]);
  const [logEntries, setLogEntries] = useState<SystemLogEntry[]>([]);
  const [systemContext, setSystemContext] = useState<string>('');
  const [isCaching, setIsCaching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  
  // Track physics and coherence corrections for the next turn
  const pendingCorrectionsRef = useRef<string[]>([]);
  
  const { state, applyRawResponse, dispatch } = useSimulation();

  const addLog = useCallback((type: SystemLogEntry['type'], source: SystemLogEntry['source'], message: string) => {
    setLogEntries(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type,
      source,
      message
    }]);
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    
    // STEP 3: INJECT corrections into user input for the LLM
    let finalInputText = text;
    if (pendingCorrectionsRef.current.length > 0) {
      const correctionBlock = pendingCorrectionsRef.current.map(c => `[ENGINE: ${c}]`).join('\n');
      finalInputText = `${correctionBlock}\n\n${text}`;
      pendingCorrectionsRef.current = []; // Clear after injection
    }
    
    // newUserMessage uses original text for UI display
    const newUserMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, newUserMessage]);
    setIsProcessing(true);
    addLog('info', 'app', `Sending transmission: "${text.substring(0, 30)}..."`);

    try {
      let fullResponse = "";
      let usageMetadata: any = null;
      
      // STEP 4: CRITICAL - Use finalInputText, not text, when calling sendMessageStream
      const streamResponse = await gemini.sendMessageStream(finalInputText, messages);

      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      for await (const chunk of streamResponse) {
        const c = chunk as any;
        const chunkText = typeof c === 'string' ? c : (c.text || '');
        fullResponse += chunkText;
        
        if (c.usageMetadata) {
          usageMetadata = c.usageMetadata;
        }
        
        setMessages(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, content: fullResponse }];
        });
      }

      // Fix LLM delta tag formatting mistakes
      if (fullResponse.includes('<!--') && fullResponse.includes('Δ')) {
        let deltaFixed = false;
        
        // Fix Unicode arrow → to proper HTML comment closing -->
        if (fullResponse.includes('→')) {
          fullResponse = fullResponse.replace(/→/g, '-->');
          deltaFixed = true;
          addLog('warning', 'parser', '⚠️ Auto-fixed: Unicode arrow (→) replaced with (-->)');
        }
        
        // Fix malformed stat values like Fv+1- or Ar-5+
        const malformedStats = fullResponse.match(/\b(Ar|Ox|Fv|En|PC_AL|PC_AW|PC_OB|REB_AL|REB_AW|REB_OB)([+-])(\d+)([+-])/g);
        if (malformedStats) {
          malformedStats.forEach(stat => {
            const match = stat.match(/(\w+)([+-])(\d+)/);
            if (match) {
              const [_, name, sign, value] = match;
              const corrected = `${name}${sign}${value}`;
              fullResponse = fullResponse.replace(stat, corrected);
              addLog('warning', 'parser', `⚠️ Auto-fixed: ${stat} → ${corrected}`);
              deltaFixed = true;
            }
          });
        }
        
        // Correct LLM so it stops making these mistakes
        if (deltaFixed) {
          pendingCorrectionsRef.current.push(
            'FORMAT ERROR: Close delta tags with --> (two hyphens, right angle bracket), NOT → (Unicode arrow). Stat values need one sign only: Fv+15 not Fv+1-.'
          );
        }
      }

      // Suppress auto-generated CRUX
      let cruxWasStripped = false;
      if (fullResponse.includes('<!-- CRUX|') && 
          !text.toLowerCase().includes('(crux)')) {
        
        cruxWasStripped = true;
        
        fullResponse = fullResponse.replace(/<!--\s*CRUX\|[^>]*-->/gi, '');
        fullResponse = fullResponse.replace(/\*\*CRUX:[^*]+\*\*/gi, '');
        fullResponse = fullResponse.replace(/\*\*RULE VIOLATIONS:[^*]+\*\*/gi, '');
        fullResponse = fullResponse.replace(/\[Option [ABC]\]:[^\n]+/gi, '');
        fullResponse = fullResponse.replace(/\+\+[^\n]+/g, '');
        fullResponse = fullResponse.replace(/\*\s*\+\+[^\n]+/g, '');
        fullResponse = fullResponse.replace(/RULE VIOLATIONS:[\s\S]*?(?=\n\n|$)/gi, '');
        
        addLog('error', 'validator', 
          '⛔ CRUX auto-generated. Removed. User must trigger via (CRUX) command.');
        
        pendingCorrectionsRef.current.push(
          'Do not auto-generate CRUX even in high-stakes situations. Wait for (CRUX) command. Continue narrative naturally.'
        );
      }

      // Update displayed message with cleaned response
      setMessages(prev => {
        const last = prev[prev.length - 1];
        return [...prev.slice(0, -1), { 
          ...last, 
          content: fullResponse,
          // @ts-ignore
          _cleaned: cruxWasStripped 
        }];
      });

      // 1. Route the Output (Separate prose, OOC, and meta)
      const routed = routeOutput(fullResponse);
      
      // 2. Process Telemetry (Physics)
      const validation = applyRawResponse(fullResponse);
      const { errors, extractedTags, violations } = validation;

      // 3. Handle Violations (Physics Overrides)
      // Queue violations for next turn correction
      if (violations && violations.length > 0) {
        violations.forEach(v => {
          const correction = `${v.stat} was clamped to ${v.applied} due to engine constraints (you attempted ${v.requested}). ${v.message}`;
          pendingCorrectionsRef.current.push(correction);
        });
        
        // Log each violation
        violations.forEach(v => {
          addLog('warning', 'validator', 
            `Physics Override: ${v.stat} requested ${v.requested}, applied ${v.applied}. Reason: ${v.message}`
          );
        });
        
        // Update violation count for Sidebar (will be adjusted later with coherence warnings)
        setViolationCount(violations.length);
      } else {
        setViolationCount(0);
      }

      // 4. Log Delta Display
      if (routed.deltaDisplay) {
        addLog('info', 'parser', routed.deltaDisplay);
      }

      // 5. Semantic Validation (Only on prose)
      const driftWarnings = checkSemanticDrift(routed.simulation, state);

      // 6. Coherence Validation (Narrative vs Applied Delta)
      const coherenceWarnings = validation.appliedDelta 
        ? checkCoherence(routed.simulation, validation.appliedDelta)
        : [];

      // Update total violation count for sidebar display (Physics + Coherence)
      setViolationCount((violations?.length || 0) + coherenceWarnings.length);

      coherenceWarnings.forEach(w => {
        addLog(
          w.severity === 'high' ? 'error' : 'warning',
          'validator',
          formatCoherenceWarning(w)
        );
      });

      // Queue high-severity coherence corrections for next turn
      if (coherenceWarnings.length > 0) {
        coherenceWarnings
          .filter(w => w.severity === 'high')
          .forEach(w => {
            pendingCorrectionsRef.current.push(w.suggestion);
          });
      }

      // 7. Update Logs
      if (routed.systemLog) addLog('meta', 'llm', routed.systemLog);
      errors.forEach(err => addLog('error', 'validator', err));
      driftWarnings.forEach(w => addLog('warning', 'validator', `[${w.type.toUpperCase()}] ${w.message}`));
      
      if (usageMetadata) {
        dispatch({
          type: 'UPDATE_USAGE',
          inputTokens: usageMetadata.promptTokenCount || 0,
          outputTokens: usageMetadata.candidatesTokenCount || 0
        });
      }

      setMessages(prev => {
        const last = prev[prev.length - 1];
        return [...prev.slice(0, -1), { 
          ...last, 
          content: routed.simulation,
          ooc: routed.simulationOOC,
          meta: routed.systemLog,
          hiddenStats: extractedTags.join('\n'),
          compliance: { 
            isPassed: errors.length === 0 && 
                      driftWarnings.length === 0 && 
                      coherenceWarnings.length === 0,
            violations: [
              ...errors, 
              ...driftWarnings.map(w => w.message),
              ...coherenceWarnings
                .filter(w => w.severity === 'high')
                .map(formatCoherenceWarning)
            ] 
          }
        }];
      });
      
    } catch (error: any) {
      addLog('error', 'app', `Engine error: ${error.message || 'Connection severed.'}`);
      setMessages(prev => [...prev, { role: 'model', content: "Engine error: Connection severed." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTriggerCrux = () => handleSendMessage("(CRUX)");
  const handleDrawSituation = () => handleSendMessage("(SITUATION)");

  const handleClearSession = () => {
    if (window.confirm("Initiate Hard Reset? All narrative memory and engine state will be purged.")) {
      setMessages([]);
      setLogEntries([]);
      dispatch({ type: 'INITIALIZE', payload: createInitialState() });
      gemini.setSystemInstruction('');
      setSystemContext('');
      setView('settings');
      pendingCorrectionsRef.current = [];
      addLog('warning', 'app', 'System reset initiated. State purged.');
      setViolationCount(0);
    }
  };

  const dashboardStats = selectDashboardStats(state);
  const cruxReady = selectCruxReadiness(state);
  const situationAdvisory = selectSituationSuggestion(state);

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] overflow-hidden text-sm relative">
      <Sidebar 
        currentView={view === 'settings' ? 'context' : view} 
        setView={(v) => setView(v === 'context' ? 'settings' : v)} 
        stats={{ 
          ...dashboardStats,
          pcOB: state.pc.obsession,
          tokens: (dashboardStats.inputTokens || 0) + (dashboardStats.outputTokens || 0)
        }} 
        violationCount={violationCount}
        anchorCount={state.anchors?.length || 0} 
        npcCount={Object.keys(state.npcs || {}).length} 
        sitCount={state.situations?.length || 0}
        cruxReady={cruxReady}
        situationAdvisory={situationAdvisory}
        onTriggerCrux={handleTriggerCrux}
        onDrawSituation={handleDrawSituation}
        onExport={() => {}} 
        onImport={() => {}} 
        onClear={handleClearSession}
      />
      
      <main className="flex-1 flex overflow-hidden">
        {view === 'settings' && (
          <div className="flex-1 flex flex-col relative">
            <SettingsPanel 
              currentPrompt={systemContext}
              isCaching={isCaching}
              onPromptUpdate={async (c) => {
                setIsCaching(true);
                addLog('info', 'app', 'Caching new protocol set...');
                await gemini.setSystemInstruction(c);
                setSystemContext(c);
                setIsCaching(false);
                addLog('info', 'app', 'Engine ready. System context initialized.');
                setView('chat');
              }}
            />
          </div>
        )}

        {view === 'chat' && (
          <div className="flex-1 flex overflow-hidden">
            <SimulationTerminal 
              messages={messages} 
              onSend={handleSendMessage} 
              isProcessing={isProcessing} 
              contextLoaded={!!systemContext} 
            />
            <SystemLog entries={logEntries} />
          </div>
        )}

        {(view === 'reb' || view === 'pc' || view === 'world' || view === 'npcs' || view === 'situations' || view === 'anchors') && (
          <Dashboard 
            view={view} 
            stats={dashboardStats} 
            anchors={state.anchors || []} 
            npcs={Object.values(state.npcs || {})} 
            situations={state.situations || []} 
            inventory={[]} 
            sceneHistory={[]} 
            pc={state.pc} 
            reb={state.reb}
            world={state.world}
            pressures={state.pressures}
            configuration={state.configuration.type}
          />
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <SimulationProvider>
    <AppContent />
  </SimulationProvider>
);

export default App;