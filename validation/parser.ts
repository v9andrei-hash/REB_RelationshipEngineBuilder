
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
  | { success: true; data: T } 
  | { success: false; error: ValidationError };

export function parseDelta(raw: string): ParseResult<RawDelta> {
  const deltaRegex = /<!-- Δ Ar([+-]?\d+) Ox([+-]?\d+) Fv([+-]?\d+) En([+-]?\d+) PC_AL([+-]?\d+) PC_AW([+-]?\d+) PC_OB([+-]?\d+) REB_AL([+-]?\d+) REB_AW([+-]?\d+) REB_OB([+-]?\d+) TRN:(\d+)\/(\d+) VT:([A-Z]{2})([+-]?\d+) -->/;
  
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
      vt_code: match[13],
      vt_mag: parseInt(match[14])
    }
  };
}
