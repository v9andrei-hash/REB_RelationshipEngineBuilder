
export interface RoutedOutput {
  simulation: string;      // Main narrative (no prefix)
  simulationOOC: string;   // [OOC] content
  systemLog: string;       // [META] content
  hidden: string[];        // <!-- --> tags for parsing
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
  
  return { 
    simulation: simulation.join('\n').trim(), 
    simulationOOC: simulationOOC.join('\n').trim(),
    systemLog: systemLog.join('\n').trim(),
    hidden 
  };
}
