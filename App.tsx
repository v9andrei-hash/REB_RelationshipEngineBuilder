import React, { useState, useEffect } from 'react';
import { gemini } from './services/geminiService';
import { Message, SimulationIntervention, Chronicle, NPC, Situation, SceneSnapshot, Item, Portrait, PlayerCharacter, RebCharacter, CharacterArc, ConfigurationType } from './types';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import MetaTerminal from './components/MetaTerminal';
import Dashboard from './components/Dashboard';
import ContextEditor from './components/ContextEditor';
import { portraitService } from './services/imageService';
import { SimulationProvider } from './context/SimulationContext';
import { useSimulation } from './hooks/useSimulation';
import { selectDashboardStats } from './state/selectors';
import { createInitialState } from './state/initial';

const AppContent: React.FC = () => {
  const [view, setView] = useState<'chat' | 'context' | 'reb' | 'pc' | 'world' | 'anchors' | 'npcs' | 'situations' | 'meta'>('context');
  const [messages, setMessages] = useState<Message[]>([]);
  const [systemContext, setSystemContext] = useState<string>('');
  const [isCaching, setIsCaching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interventions, setInterventions] = useState<SimulationIntervention[]>([]);
  
  const { state, applyRawResponse, dispatch } = useSimulation();

  const handleSendMessage = async (text: string, isMeta: boolean = false) => {
    if (!text.trim() || isProcessing) return;
    const newUserMessage: Message = { role: 'user', content: text, isMeta };
    setMessages(prev => [...prev, newUserMessage]);
    setIsProcessing(true);

    try {
      let fullResponse = "";
      let usageMetadata: any = null;
      
      const streamResponse = isMeta 
        ? gemini.sendMetaMessageStream(text, messages)
        : await gemini.sendMessageStream(text, messages.filter(m => !m.isMeta));

      setMessages(prev => [...prev, { role: 'model', content: '', isMeta }]);

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

      const { cleanText, errors, extractedTags } = applyRawResponse(fullResponse);
      
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
          content: cleanText,
          hiddenStats: extractedTags.join('\n'),
          compliance: { isPassed: errors.length === 0, violations: errors }
        }];
      });
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "Engine error: Connection severed." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearSession = () => {
    if (window.confirm("Initiate Hard Reset? All narrative memory and engine state will be purged.")) {
      setMessages([]);
      dispatch({ type: 'INITIALIZE', payload: createInitialState() });
      gemini.setSystemInstruction('');
      setSystemContext('');
      setView('context');
    }
  };

  const dashboardStats = selectDashboardStats(state);

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] overflow-hidden text-sm">
      <Sidebar 
        currentView={view} 
        setView={setView} 
        stats={{ 
          ...dashboardStats,
          pcOB: state.pc.obsession,
          tokens: (dashboardStats.inputTokens || 0) + (dashboardStats.outputTokens || 0)
        }} 
        anchorCount={state.anchors?.length || 0} 
        npcCount={Object.keys(state.npcs || {}).length} 
        sitCount={state.situations?.length || 0}
        onExport={() => {}} 
        onImport={() => {}} 
        onClear={handleClearSession}
      />
      <main className="flex-1 flex flex-col relative">
        {view === 'context' && (
          <ContextEditor 
            onSave={async (c) => { 
              setIsCaching(true); 
              await gemini.setSystemInstruction(c); 
              setSystemContext(c); 
              setIsCaching(false); 
              setView('chat'); 
            }} 
            isCaching={isCaching} 
            initialValue={systemContext} 
          />
        )}
        {view === 'chat' && (
          <ChatInterface 
            messages={messages} 
            onSend={(txt) => handleSendMessage(txt, false)} 
            isProcessing={isProcessing} 
            contextLoaded={!!systemContext} 
          />
        )}
        {view === 'meta' && (
          <MetaTerminal 
            messages={messages} 
            onSend={(txt) => handleSendMessage(txt, true)} 
            onUpdateKernel={async (c) => { 
              gemini.setSystemInstruction(c); 
              setSystemContext(c); 
            }} 
            onAnalyzeDrift={async () => {}} 
            onCommitIntervention={() => {}} 
            interventions={interventions} 
            systemContext={systemContext} 
            isProcessing={isProcessing} 
            isCaching={isCaching} 
            isAnalyzing={isAnalyzing} 
            contextLoaded={!!systemContext} 
          />
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
