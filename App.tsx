import React, { useState, useCallback } from 'react';
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

const AppContent: React.FC = () => {
  const [view, setView] = useState<'chat' | 'settings' | 'reb' | 'pc' | 'world' | 'anchors' | 'npcs' | 'situations'>('settings');
  const [messages, setMessages] = useState<Message[]>([]);
  const [logEntries, setLogEntries] = useState<SystemLogEntry[]>([]);
  const [systemContext, setSystemContext] = useState<string>('');
  const [isCaching, setIsCaching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
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
    
    const newUserMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, newUserMessage]);
    setIsProcessing(true);
    addLog('info', 'app', `Sending transmission: "${text.substring(0, 30)}..."`);

    try {
      let fullResponse = "";
      let usageMetadata: any = null;
      
      const streamResponse = await gemini.sendMessageStream(text, messages);

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

      // 1. Route the Output (Separate prose, OOC, and meta)
      const routed = routeOutput(fullResponse);
      
      // 2. Process Telemetry (Physics)
      const { errors, extractedTags } = applyRawResponse(fullResponse);

      // 3. Semantic Validation (Only on prose)
      const driftWarnings = checkSemanticDrift(routed.simulation, state);

      // 4. Update Logs
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
            isPassed: errors.length === 0 && driftWarnings.length === 0, 
            violations: [...errors, ...driftWarnings.map(w => w.message)] 
          }
        }];
      });
      
      addLog('info', 'parser', `Transmission processed. Tags found: ${extractedTags.length}`);

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
      addLog('warning', 'app', 'System reset initiated. State purged.');
    }
  };

  const dashboardStats = selectDashboardStats(state);
  const cruxReady = selectCruxReadiness(state);
  const situationAdvisory = selectSituationSuggestion(state);

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] overflow-hidden text-sm">
      <Sidebar 
        currentView={view === 'settings' ? 'context' : view} 
        setView={(v) => setView(v === 'context' ? 'settings' : v)} 
        stats={{ 
          ...dashboardStats,
          pcOB: state.pc.obsession,
          tokens: (dashboardStats.inputTokens || 0) + (dashboardStats.outputTokens || 0)
        }} 
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
        )}

        {view === 'chat' && (
          <div className="flex flex-1 overflow-hidden">
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