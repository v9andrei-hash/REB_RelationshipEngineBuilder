
export type Act1 = {
  actNumber: 1;
  favorCap: 15;
  cruxAllowed: false;
  minIntimacyForGate: 2;
  entropyDecay: -50;
};

export type Act2 = {
  actNumber: 2;
  favorCap: 25;
  cruxAllowed: true;
  minIntimacyForGate: 4;
  entropyDecay: -60;
};

export type Act3 = {
  actNumber: 3;
  favorCap: 40;
  cruxAllowed: true;
  noGate: true;
  entropyDecay: -75;
};

export type Act = Act1 | Act2 | Act3;
