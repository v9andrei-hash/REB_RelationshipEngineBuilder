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
  vt_code: string;
  vt_mag: number;
}

export type ParseResult<T> = 
  | { success: true; data: T | null } 
  | { success: false; error: ValidationError };

/**
 * Flexible helper to extract a numeric stat from a tag string
 */
function extractStat(tag: string, key: string, defaultValue: number = 0): number {
  const regex = new RegExp(`${key}:?\\s*([+-]?\\d+)`, 'i');
  const match = tag.match(regex);
  return match ? parseInt(match[1]) : defaultValue;
}

/**
 * Extracts the VT code and magnitude
 */
function extractVT(tag: string): { vt_code: string; vt_mag: number } {
  const vtRegex = /VT:?\s*([A-Z]+|None)\s*([+-]?\d+)?/i;
  const match = tag.match(vtRegex);
  if (!match) return { vt_code: 'NONE', vt_mag: 0 };
  
  return {
    vt_code: match[1].toUpperCase(),
    vt_mag: match[2] ? parseInt(match[2]) : 0
  };
}

export function parseDelta(raw: string): ParseResult<RawDelta> {
  const deltaTagMatch = raw.match(/<!--\s*Δ[\s\S]*?-->/i);
  
  if (!deltaTagMatch) {
    return { success: true, data: null };
  }

  const tag = deltaTagMatch[0];

  try {
    const data: RawDelta = {
      ar: extractStat(tag, 'Ar'),
      ox: extractStat(tag, 'Ox'),
      fv: extractStat(tag, 'Fv'),
      en: extractStat(tag, 'En'),
      pc_al: extractStat(tag, 'PC_AL'),
      pc_aw: extractStat(tag, 'PC_AW'),
      pc_ob: extractStat(tag, 'PC_OB'),
      reb_al: extractStat(tag, 'REB_AL'),
      reb_aw: extractStat(tag, 'REB_AW'),
      reb_ob: extractStat(tag, 'REB_OB'),
      ...extractVT(tag)
    };

    return {
      success: true,
      data
    };
  } catch (err) {
    return {
      success: false,
      error: { type: 'PARSE_FAILURE', message: 'Failed to process Delta telemetry.' }
    };
  }
}