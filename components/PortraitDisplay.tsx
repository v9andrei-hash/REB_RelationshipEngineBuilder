import React, { useState } from 'react';
import { User, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { Portrait } from '../types';

interface PortraitDisplayProps {
  portrait?: Portrait | null;
  name: string;
  role: 'PC' | 'REB' | 'NPC';
  status?: 'ACTING' | 'WATCHING' | 'DORMANT';
  quadrant?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onRegenerate?: () => void;
  isGenerating?: boolean;
}

const PortraitDisplay: React.FC<PortraitDisplayProps> = ({
  portrait,
  name,
  role,
  status,
  quadrant,
  size = 'md',
  onRegenerate,
  isGenerating = false
}) => {
  const [imageError, setImageError] = useState(false);

  // Size mappings
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  };

  // Quadrant-based border/glow effects
  const quadrantStyles = {
    Q1: 'ring-2 ring-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]', // Symbiote - warm
    Q2: 'ring-2 ring-blue-400/50 shadow-[0_0_20px_rgba(96,165,250,0.3)]', // Domestic - cool
    Q3: 'ring-2 ring-gray-500/50 shadow-[0_0_20px_rgba(107,114,128,0.2)]', // Void - muted
    Q4: 'ring-2 ring-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.4)]' // Combustion - intense
  };

  // Status indicator overlay
  const statusOverlay = {
    ACTING: 'after:absolute after:inset-0 after:bg-red-500/10 after:animate-pulse',
    WATCHING: 'after:absolute after:inset-0 after:bg-amber-500/5',
    DORMANT: 'after:absolute after:inset-0 after:bg-black/30 after:backdrop-blur-[1px]'
  };

  // Role-based accent
  const roleAccent = {
    PC: 'border-orange-500/30',
    REB: 'border-blue-500/30',
    NPC: 'border-white/10'
  };

  const hasPortrait = portrait?.base64Data && !imageError;

  return (
    <div className="relative group">
      {/* Main portrait container */}
      <div 
        className={`
          ${sizeClasses[size]} 
          rounded-2xl overflow-hidden 
          ${hasPortrait ? '' : 'bg-white/5'} 
          ${quadrant ? quadrantStyles[quadrant] : 'ring-1 ring-white/10'}
          ${roleAccent[role]}
          ${status && hasPortrait ? statusOverlay[status] : ''}
          relative transition-all duration-500
        `}
      >
        {hasPortrait ? (
          <img
            src={`data:image/png;base64,${portrait.base64Data}`}
            alt={`Portrait of ${name}`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isGenerating ? (
              <Loader2 className="w-1/3 h-1/3 text-blue-500 animate-spin" />
            ) : (
              <User className="w-1/2 h-1/2 text-gray-600" />
            )}
          </div>
        )}

        {/* Quadrant indicator badge */}
        {quadrant && (
          <div className={`
            absolute bottom-1 right-1 
            px-1.5 py-0.5 rounded text-[8px] font-black
            ${quadrant === 'Q1' ? 'bg-pink-500/80 text-white' : ''}
            ${quadrant === 'Q2' ? 'bg-blue-400/80 text-white' : ''}
            ${quadrant === 'Q3' ? 'bg-gray-500/80 text-white' : ''}
            ${quadrant === 'Q4' ? 'bg-red-500/80 text-white' : ''}
          `}>
            {quadrant}
          </div>
        )}

        {/* Status indicator */}
        {status && (
          <div className={`
            absolute top-1 left-1 w-2 h-2 rounded-full
            ${status === 'ACTING' ? 'bg-red-500 animate-pulse' : ''}
            ${status === 'WATCHING' ? 'bg-amber-500' : ''}
            ${status === 'DORMANT' ? 'bg-gray-600' : ''}
          `} />
        )}
      </div>

      {/* Regenerate button (appears on hover) */}
      {onRegenerate && !isGenerating && (
        <button
          onClick={onRegenerate}
          className="
            absolute -bottom-2 -right-2 
            w-6 h-6 rounded-full 
            bg-blue-600 hover:bg-blue-500
            flex items-center justify-center
            opacity-0 group-hover:opacity-100
            transition-all duration-200
            shadow-lg shadow-blue-600/30
          "
          title="Regenerate portrait"
        >
          <RefreshCw size={12} className="text-white" />
        </button>
      )}

      {/* Name label */}
      {size !== 'sm' && (
        <div className="mt-2 text-center">
          <p className={`
            font-bold text-white truncate
            ${size === 'xl' ? 'text-sm' : 'text-xs'}
          `}>
            {name}
          </p>
          {role !== 'NPC' && (
            <p className={`
              text-[9px] uppercase tracking-widest font-black
              ${role === 'PC' ? 'text-orange-500' : 'text-blue-500'}
            `}>
              {role}
            </p>
          )}
        </div>
      )}

      {/* Generation indicator */}
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
          <div className="flex flex-col items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
            <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">
              Generating...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortraitDisplay;


// ============================================
// PORTRAIT GALLERY COMPONENT (for NPC Roster)
// ============================================

interface PortraitGalleryProps {
  characters: Array<{
    name: string;
    role: 'PC' | 'REB' | 'NPC';
    status?: string;
    portrait?: Portrait | null;
  }>;
  quadrant?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  onRegeneratePortrait?: (name: string) => void;
  generatingNames?: string[];
}

export const PortraitGallery: React.FC<PortraitGalleryProps> = ({
  characters,
  quadrant,
  onRegeneratePortrait,
  generatingNames = []
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
      {characters.map((char) => (
        <PortraitDisplay
          key={char.name}
          portrait={char.portrait}
          name={char.name}
          role={char.role}
          status={char.status as any}
          quadrant={char.role !== 'NPC' ? quadrant : undefined}
          size="lg"
          onRegenerate={onRegeneratePortrait ? () => onRegeneratePortrait(char.name) : undefined}
          isGenerating={generatingNames.includes(char.name)}
        />
      ))}
    </div>
  );
};


// ============================================
// COMPACT PORTRAIT (for Sidebar/Headers)
// ============================================

interface CompactPortraitRowProps {
  pc?: { name: string; portrait?: Portrait | null };
  reb?: { name: string; portrait?: Portrait | null };
  quadrant?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
}

export const CompactPortraitRow: React.FC<CompactPortraitRowProps> = ({
  pc,
  reb,
  quadrant
}) => {
  if (!pc && !reb) return null;

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      {pc && (
        <PortraitDisplay
          portrait={pc.portrait}
          name={pc.name}
          role="PC"
          quadrant={quadrant}
          size="sm"
        />
      )}
      
      {pc && reb && (
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-px bg-gradient-to-r from-orange-500 via-white/20 to-blue-500" />
          <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">
            {quadrant || '—'}
          </span>
        </div>
      )}
      
      {reb && (
        <PortraitDisplay
          portrait={reb.portrait}
          name={reb.name}
          role="REB"
          quadrant={quadrant}
          size="sm"
        />
      )}
    </div>
  );
};
