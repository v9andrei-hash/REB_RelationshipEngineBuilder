
import { ValidationError } from './errors';

export interface RawDelta {
  ar: number;
  ox: number;
  fv: number;
  en: number;
  pc_al: number;
  pc_aw: number;
  pc_ob: number;
  reb_al: number;
  reb_aw: number;
  reb_ob: number;
  trn_current: number;
  trn_max: number;
  vt_code: string;
  vt_mag: number;
}

export type ParseResult<T> = 
  | { success: true; data: T | null } 
  | { success: false; error: ValidationError };

export function parseDelta(raw: string): ParseResult<RawDelta> {
  // First, check if a Delta tag is even attempted (looking for the Δ symbol)
  if (!raw.includes('Δ')) {
    return { success: true, data: null };
  }

  /**
   * Robust regex allowing for:
   * - Optional colons after labels (Ar: vs Ar)
   * - Varying whitespace between labels and values
   * - Case insensitivity
   * - Flexible TRN and VT formatting (handles VT:None or VT:LH+5)
   */
  const deltaRegex = /<!--\s*Δ\s*Ar:?\s*([+-]?\d+)\s*Ox:?\s*([+-]?\d+)\s*Fv:?\s*([+-]?\d+)\s*En:?\s*([+-]?\d+)\s*PC_AL:?\s*([+-]?\d+)\s*PC_AW:?\s*([+-]?\d+)\s*PC_OB:?\s*([+-]?\d+)\s*REB_AL:?\s*([+-]?\d+)\s*REB_AW:?\s*([+-]?\d+)\s*REB_OB:?\s*([+-]?\d+)\s*TRN:?\s*(\d+)\s*\/\s*(\d+)\s*VT:?\s*([A-Z]+|None)\s*([+-]?\d+)?\s*-->/i;
  
  const match = raw.match(deltaRegex);
  
  if (!match) {
    return {
      success: false,
      error: { type: 'PARSE_FAILURE', message: 'Malformed Delta tag. Telemetry sync failed.' }
    };
  }

  return {
    success: true,
    data: {
      ar: parseInt(match[1]),
      ox: parseInt(match[2]),
      fv: parseInt(match[3]),
      en: parseInt(match[4]),
      pc_al: parseInt(match[5]),
      pc_aw: parseInt(match[6]),
      pc_ob: parseInt(match[7]),
      reb_al: parseInt(match[8]),
      reb_aw: parseInt(match[9]),
      reb_ob: parseInt(match[10]),
      trn_current: parseInt(match[11]),
      trn_max: parseInt(match[12]),
      vt_code: match[13].toUpperCase(),
      vt_mag: match[14] ? parseInt(match[14]) : 0 // Default to 0 if magnitude is missing
    }
  };
}
