
export interface RoutedOutput {
  simulation: string;      // Main narrative (no prefix)
  simulationOOC: string;   // [OOC] content
  systemLog: string;       // [META] content
  hidden: string[];        // <!-- --> tags for parsing
  deltaDisplay?: string;   // Formatted delta for System Log
}

export function routeOutput(rawResponse: string): RoutedOutput {
  const lines = rawResponse.split('\n');
  
  const simulation: string[] = [];
  const simulationOOC: string[] = [];
  const systemLog: string[] = [];
  const hidden: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (simulation.length > 0) simulation.push('');
      continue;
    }

    if (trimmed.match(/^<!--.*-->$/)) {
      // Hidden delta tags
      hidden.push(trimmed);
    } else if (trimmed.startsWith('[META]')) {
      // System log content
      systemLog.push(trimmed.replace('[META]', '').trim());
    } else if (trimmed.match(/\(OOC:.*\)/)) {
      // Narrative OOC - extract content
      const oocMatch = trimmed.match(/\(OOC:\s*(.*?)\)/);
      if (oocMatch) {
        simulationOOC.push(oocMatch[1]);
      }
      // Also include any non-OOC text on same line
      const remaining = trimmed.replace(/\(OOC:.*?\)/, '').trim();
      if (remaining) simulation.push(remaining);
    } else {
      // Normal narrative (dialogue + action)
      simulation.push(line);
    }
  }

  // Format delta for display
  const deltaTag = hidden.find(h => h.includes('Δ'));
  let deltaDisplay: string | undefined;
  
  if (deltaTag) {
    deltaDisplay = formatDeltaForDisplay(deltaTag);
  }
  
  return { 
    simulation: simulation.join('\n').trim(), 
    simulationOOC: simulationOOC.join('\n').trim(),
    systemLog: systemLog.join('\n').trim(),
    hidden,
    deltaDisplay
  };
}

function formatDeltaForDisplay(deltaTag: string): string {
  // Extract content from tag: <!-- Δ Ar+15 Ox-8 Fv+5 En-10 PC_AL-5 PC_AW+3 PC_OB+8 REB_AL+2 REB_AW+0 REB_OB+5 VT:TB+20 -->
  const content = deltaTag.replace('<!--', '').replace('-->', '').trim();
  const parts = content.split(/\s+/).filter(p => p && p !== 'Δ');
  
  const bondMatrix: string[] = [];
  const pcStats: string[] = [];
  const rebStats: string[] = [];
  let valueTurn = '';
  
  const formatVal = (val: string) => {
    const num = parseInt(val.match(/[+-]?\d+/)?.[0] || '0');
    return num >= 0 ? `+${num}` : `${num}`;
  };

  const getKeyVal = (part: string) => {
    const match = part.match(/([A-Z_]+):?([+-]?\d+)/i);
    if (!match) return { key: part, val: '' };
    return { key: match[1], val: formatVal(match[2]) };
  };

  for (const part of parts) {
    const { key, val } = getKeyVal(part);
    if (['Ar', 'Ox', 'Fv', 'En'].includes(key)) {
      bondMatrix.push(`${key}${val}`);
    } else if (key.startsWith('PC_')) {
      pcStats.push(`${key.replace('PC_', '')}${val}`);
    } else if (key.startsWith('REB_')) {
      rebStats.push(`${key.replace('REB_', '')}${val}`);
    } else if (key === 'VT') {
      valueTurn = part.replace('VT:', '');
    }
  }
  
  return [
    `ΔELTA UPDATE`,
    `Bond: ${bondMatrix.join(' | ')}`,
    `PC: ${pcStats.join(' | ')}`,
    `Reb: ${rebStats.join(' | ')}`,
    valueTurn ? `Value Turn: ${valueTurn}` : ''
  ].filter(Boolean).join('\n');
}
