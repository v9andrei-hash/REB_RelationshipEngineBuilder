
import React, { useEffect, useRef } from 'react';
import { Terminal, AlertCircle, AlertTriangle, Info, Cpu } from 'lucide-react';
import { SystemLogEntry } from '../types';

interface SystemLogProps {
  entries: SystemLogEntry[];
  maxEntries?: number;
}

const SystemLog: React.FC<SystemLogProps> = ({ entries, maxEntries = 100 }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayEntries = entries.slice(-maxEntries);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const getEntryIcon = (type: SystemLogEntry['type']) => {
    switch (type) {
      case 'error': return <AlertCircle size={14} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={14} className="text-amber-500" />;
      case 'meta': return <Cpu size={14} className="text-purple-400" />;
      case 'info': return <Info size={14} className="text-blue-400" />;
    }
  };

  const getEntryStyle = (type: SystemLogEntry['type']) => {
    switch (type) {
      case 'error': return 'border-red-500/20 bg-red-500/5 text-red-200';
      case 'warning': return 'border-amber-500/20 bg-amber-500/5 text-amber-200';
      case 'meta': return 'border-purple-500/20 bg-purple-500/5 text-purple-200';
      case 'info': return 'border-blue-500/20 bg-blue-500/5 text-blue-200';
    }
  };

  return (
    <div className="w-80 border-l border-white/5 bg-[#050505] flex flex-col overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
          <Terminal size={14} /> System Log
        </h3>
        <span className="text-[8px] text-gray-700 font-mono">v1.5_STRICT</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[10px] leading-relaxed">
        {displayEntries.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-gray-500 italic">
            Waiting for system events...
          </div>
        )}
        {displayEntries.map((entry) => (
          <div key={entry.id} className={`p-2 border rounded-lg transition-all ${getEntryStyle(entry.type)}`}>
            <div className="flex items-center justify-between mb-1 opacity-60">
              <div className="flex items-center gap-1.5 uppercase font-black tracking-tighter">
                {getEntryIcon(entry.type)}
                {entry.source}
              </div>
              <span>{entry.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
            <div className="break-words">{entry.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemLog;
