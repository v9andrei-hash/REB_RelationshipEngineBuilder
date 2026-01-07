
export type AlliedWantsConfig = { type: 'ALLIED_WANTS'; description: "Aligned goals, opposed truths" };
export type AlliedNeedsConfig = { type: 'ALLIED_NEEDS'; description: "Opposed goals, aligned truths" };
export type ChiasticConfig = { type: 'CHIASTIC'; description: "Cross-mirrored pursuit" };
export type ConvergentConfig = { type: 'CONVERGENT'; description: "Harmonious but fragile" };
export type DivergentConfig = { type: 'DIVERGENT'; description: "Fundamental incompatibility" };
export type AsymmetricConfig = { 
  type: 'ASYMMETRIC'; 
  tensions: string[]; 
  description: "Nuanced partial alignments" 
};

export type RelationshipConfiguration = 
  | AlliedWantsConfig 
  | AlliedNeedsConfig 
  | ChiasticConfig 
  | ConvergentConfig 
  | DivergentConfig 
  | AsymmetricConfig;
