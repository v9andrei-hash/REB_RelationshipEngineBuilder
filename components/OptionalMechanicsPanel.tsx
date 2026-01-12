import React from 'react';
import { Toggle, Info } from 'lucide-react';

interface MechanicsPanelProps {
  genre: string;
  enabled: boolean;
  mechanics: any;
  onToggle: (enabled: boolean) => void;
}

const OptionalMechanicsPanel: React.FC<MechanicsPanelProps> = ({
  genre,
  enabled,
  mechanics,
  onToggle
}) => {
  return (
    <div className="p-4 border border-white/10 rounded-lg bg-black/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Optional {genre} Mechanics
          </h4>
          <Info size={12} className="text-gray-500" />
        </div>
        <button
          onClick={() => onToggle(!enabled)}
          className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${
            enabled
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-400'
          }`}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {enabled && mechanics && (
        <div className="space-y-2 text-[10px] text-gray-400 font-mono">
          {/* Thriller Mechanics */}
          {genre === 'Thriller' && mechanics.thriller && (
            <>
              {mechanics.thriller.intelAsymmetry && (
                <div className="flex justify-between">
                  <span>Intel:</span>
                  <span>PC={mechanics.thriller.intelAsymmetry.pc} / REB={mechanics.thriller.intelAsymmetry.reb}</span>
                </div>
              )}
              {mechanics.thriller.coverIntegrity !== undefined && (
                <div className="flex justify-between">
                  <span>Cover Integrity:</span>
                  <span>{mechanics.thriller.coverIntegrity}%</span>
                </div>
              )}
              {mechanics.thriller.dualTrust && (
                <div className="flex justify-between">
                  <span>Trust (Op/Pers):</span>
                  <span>{mechanics.thriller.dualTrust.operational}/{mechanics.thriller.dualTrust.personal}</span>
                </div>
              )}
            </>
          )}

          {/* Action Mechanics */}
          {genre === 'Action' && mechanics.action && (
            <>
              {mechanics.action.combatSync !== undefined && (
                <div className="flex justify-between">
                  <span>Combat Sync:</span>
                  <span>{mechanics.action.combatSync}%</span>
                </div>
              )}
              {mechanics.action.momentum && (
                <div className="flex justify-between">
                  <span>Momentum:</span>
                  <span className={`font-bold ${
                    mechanics.action.momentum === 'PEAK' ? 'text-red-400' :
                    mechanics.action.momentum === 'HIGH' ? 'text-orange-400' :
                    mechanics.action.momentum === 'BUILDING' ? 'text-yellow-400' :
                    'text-gray-500'
                  }`}>{mechanics.action.momentum}</span>
                </div>
              )}
              {mechanics.action.injuries && (
                <div className="flex justify-between">
                  <span>Injuries:</span>
                  <span>PC={mechanics.action.injuries.pc}% / REB={mechanics.action.injuries.reb}%</span>
                </div>
              )}
              {mechanics.action.roles && (
                <div className="flex justify-between">
                  <span>Roles:</span>
                  <span>{mechanics.action.roles.pc}/{mechanics.action.roles.reb}</span>
                </div>
              )}
            </>
          )}

          {/* Horror Mechanics */}
          {genre === 'Horror' && mechanics.horror && (
            <>
              {mechanics.horror.corruption && (
                <div className="flex justify-between">
                  <span>Corruption:</span>
                  <span className="text-red-400">
                    PC={mechanics.horror.corruption.pc}% / REB={mechanics.horror.corruption.reb}%
                  </span>
                </div>
              )}
              {mechanics.horror.sanity && (
                <div className="flex justify-between">
                  <span>Sanity:</span>
                  <span className={`${
                    Math.min(mechanics.horror.sanity.pc, mechanics.horror.sanity.reb) < 40
                      ? 'text-red-400'
                      : 'text-green-400'
                  }`}>
                    PC={mechanics.horror.sanity.pc}% / REB={mechanics.horror.sanity.reb}%
                  </span>
                </div>
              )}
              {mechanics.horror.trustVsParanoia !== undefined && (
                <div className="flex justify-between">
                  <span>Trust ← → Paranoia:</span>
                  <span className={`${
                    mechanics.horror.trustVsParanoia > 50 ? 'text-green-400' :
                    mechanics.horror.trustVsParanoia < -50 ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>{mechanics.horror.trustVsParanoia}</span>
                </div>
              )}
            </>
          )}

          {/* Sci-Fi Mechanics */}
          {genre === 'Sci-Fi' && mechanics.scifi && (
            <>
              {mechanics.scifi.timeDilation && (
                <div className="flex justify-between">
                  <span>Subjective Age:</span>
                  <span>PC={mechanics.scifi.timeDilation.pc}y / REB={mechanics.scifi.timeDilation.reb}y</span>
                </div>
              )}
              {mechanics.scifi.identityContinuity && (
                <div className="flex justify-between">
                  <span>Identity:</span>
                  <span className="text-purple-400">
                    PC={mechanics.scifi.identityContinuity.pc} / REB={mechanics.scifi.identityContinuity.reb}
                  </span>
                </div>
              )}
              {mechanics.scifi.mortalityAsymmetry && (
                <div className="flex justify-between">
                  <span>Mortality:</span>
                  <span>PC={mechanics.scifi.mortalityAsymmetry.pc} / REB={mechanics.scifi.mortalityAsymmetry.reb}</span>
                </div>
              )}
            </>
          )}

          {/* Comedy Mechanics */}
          {genre === 'Comedy' && mechanics.comedy && (
            <>
              {mechanics.comedy.awkwardnessLevel !== undefined && (
                <div className="flex justify-between">
                  <span>Awkwardness:</span>
                  <span className={`${
                    mechanics.comedy.awkwardnessLevel > 75 ? 'text-red-400' :
                    mechanics.comedy.awkwardnessLevel > 50 ? 'text-orange-400' :
                    'text-yellow-400'
                  }`}>{mechanics.comedy.awkwardnessLevel}%</span>
                </div>
              )}
              {mechanics.comedy.chemistryFlow !== undefined && (
                <div className="flex justify-between">
                  <span>Chemistry:</span>
                  <span className="text-pink-400">{mechanics.comedy.chemistryFlow}%</span>
                </div>
              )}
              {mechanics.comedy.setupCallbacks && mechanics.comedy.setupCallbacks.length > 0 && (
                <div className="flex justify-between">
                  <span>Callbacks Queued:</span>
                  <span>{mechanics.comedy.setupCallbacks.length}</span>
                </div>
              )}
            </>
          )}

          {/* Romance has 0 mechanics */}
          {genre === 'Romance' && (
            <div className="text-center text-gray-500 italic text-[9px]">
              Romance uses CORE stats only
            </div>
          )}
        </div>
      )}

      {!enabled && (
        <p className="text-[9px] text-gray-600 italic mt-2">
          LLM uses mechanics conceptually. Enable to track numerically.
        </p>
      )}
    </div>
  );
};

export default OptionalMechanicsPanel;