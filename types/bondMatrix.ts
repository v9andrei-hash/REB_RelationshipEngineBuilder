
/**
 * Branded types to prevent accidental mixing of different simulation metrics
 */
export type Adrenaline = number & { readonly __brand: unique symbol };
export type Oxytocin = number & { readonly __brand: unique symbol };
export type Favor = number & { readonly __brand: unique symbol };
export type Entropy = number & { readonly __brand: unique symbol };

export interface BondMatrix {
  adrenaline: Adrenaline; // -500 to +500
  oxytocin: Oxytocin;     // -500 to +500
  favor: Favor;           // -100 to +100
  entropy: Entropy;       // Always negative
}

export const createAdrenaline = (n: number) => n as Adrenaline;
export const createOxytocin = (n: number) => n as Oxytocin;
export const createFavor = (n: number) => n as Favor;
export const createEntropy = (n: number) => n as Entropy;
