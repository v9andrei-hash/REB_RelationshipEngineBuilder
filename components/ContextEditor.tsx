
import React, { useState } from 'react';
import { Save, Info, Zap, AlertTriangle } from 'lucide-react';

interface ContextEditorProps {
  onSave: (content: string) => void;
  isCaching: boolean;
  initialValue: string;
}

const ContextEditor: React.FC<ContextEditorProps> = ({ onSave, isCaching, initialValue }) => {
  const [content, setContent] = useState(initialValue);

  return (
    <div className="flex flex-col h-full p-8 gap-6 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-end border-b border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Context Caching</h2>
          <p className="text-gray-400 max-w-2xl">
            Inject the REB Simulation Engine protocols into the model's system context. 
            Gemini will cache this high-token payload to ensure near-instant responses 
            and perfect adherence to the narrative physics.
          </p>
        </div>
        <button
          onClick={() => onSave(content)}
          disabled={isCaching || !content}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            isCaching 
              ? 'bg-blue-500/20 text-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 active:scale-95'
          }`}
        >
          {isCaching ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Caching Protocols...
            </div>
          ) : (
            <>
              <Save size={18} />
              Cache to API Key
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 relative group">
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-gray-500 mono font-bold uppercase">REB_SYSTEM.TXT</span>
            <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-gray-500 mono font-bold uppercase">v3.5.1</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[600px] bg-[#111] border border-white/5 rounded-2xl p-12 pt-16 mono text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 transition-colors resize-none leading-relaxed"
            placeholder="Paste REB Simulation Engine context here..."
          />
        </div>

        <div className="space-y-6">
          <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-2xl">
            <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
              <Zap size={18} />
              Architect Note
            </h3>
            <p className="text-xs text-blue-300/80 leading-relaxed">
              Caching this context allows Gemini to maintain the state of the Bond Matrix 
              and Shadow Leak mechanics across long sessions without re-sending the entire system map 
              on every turn. 
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
            <h3 className="text-white font-bold text-sm">Deployment Checklist</h3>
            <ul className="space-y-3">
              {[
                "Verify Origin Wounds (§2)",
                "Validate Physics Values (§1)",
                "Inject Intimacy Protocols (§3)",
                "Align Jungian Stacks (§5)"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-xs text-gray-400">
                  <div className="w-1 h-1 bg-blue-500 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
            <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
              <AlertTriangle size={18} />
              Constraint Warning
            </h3>
            <p className="text-[11px] text-red-300/70">
              Never skip the initial Wizard steps. The simulation relies on the 
              8-step character calibration to define the narrative vectors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextEditor;
