
import { GoogleGenAI, GenerateContentResponse, Chat, Modality, Type } from "@google/genai";
import { Message, SimulationIntervention, Chronicle, NPC, PlayerCharacter, RebCharacter } from "../types";
import { MODEL_NAME, ARTIFACT_OVERSEER_INSTRUCTION, CHRONICLE_SYNTHESIS_INSTRUCTION, META_ARCHITECT_INSTRUCTION } from "../constants";

export class GeminiService {
  private chat: Chat | null = null;
  private systemInstruction: string = '';
  private audioContext: AudioContext | null = null;

  private illegalTerms = [
    "Favor +", "Adrenaline +", "Oxytocin +", "Bond Matrix", 
    "Tier 1", "Tier 2", "Tier 3", "System prompt", "Wizard step"
  ];

  constructor() {}

  setSystemInstruction(instruction: string) {
    this.systemInstruction = instruction;
    this.chat = null; 
  }

  private initChat() {
    if (!this.chat) {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      this.chat = ai.chats.create({
        model: MODEL_NAME,
        config: {
          systemInstruction: this.systemInstruction,
          temperature: 0.9,
          topP: 0.95,
        },
      });
    }
    return this.chat;
  }

  validateResponse(text: string) {
    const violations = this.illegalTerms.filter(term => 
      text.toLowerCase().includes(term.toLowerCase())
    );
    return {
      isPassed: violations.length === 0,
      violations
    };
  }

  async analyzeSimulation(history: Message[], stats: any, situations: any[], npcs: NPC[]): Promise<SimulationIntervention[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      CURRENT STATS: ${JSON.stringify(stats)}
      ACTIVE NPCs: ${JSON.stringify(npcs.map(n => ({ name: n.name, role: n.role, status: n.status })))}
      RECENT HISTORY:
      ${history.slice(-15).map(m => `[${m.role.toUpperCase()}] ${m.content}`).join('\n')}
    `;
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{ parts: [{ text: prompt }] }],
        config: { systemInstruction: ARTIFACT_OVERSEER_INSTRUCTION, responseMimeType: "application/json" },
      });
      const data = JSON.parse(response.text || '{"interventions": []}');
      return data.interventions.map((inv: any) => ({ ...inv, id: Math.random().toString(36).substr(2, 9) }));
    } catch (e) { return []; }
  }

  async calibrateSimulation(history: Message[]): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      AUDIT LOG (FULL HISTORY):
      ${history.map(m => `[${m.role.toUpperCase()}] ${m.content}`).join('\n')}
      
      TASK: Reconstruct the current simulation state via telemetry tags.
      IMPORTANT: If profile data (PC or REB name, wound, temperament) is not explicitly tagged in the history, INFER the most likely values based on behavior. 
      REB usually has a name like "Reb", "The Engine", or a literary preset.
      
      OUTPUT FORMAT: 
      1. One <!-- PROFILE|PC:{...} --> tag.
      2. One <!-- PROFILE|REB:{...} --> tag.
      3. One <!-- Δ ... --> tag for current stats.
      4. One tag for each NPC or INV found.
      ONLY the raw HTML comment tags. No other text.
    `;
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{ parts: [{ text: prompt }] }],
        config: { systemInstruction: "You are the REB STATE RECONSTRUCTOR. Infer missing profile data where necessary. Output raw telemetry tags only." },
      });
      return response.text || "";
    } catch (e) { return ""; }
  }

  async *sendMetaMessageStream(message: string, history: Message[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `HISTORY:\n${history.slice(-10).map(m => `[${m.role}] ${m.content}`).join('\n')}\n\nCOMMAND: ${message}`;
    try {
      const result = await ai.models.generateContentStream({
        model: MODEL_NAME,
        contents: [{ parts: [{ text: prompt }] }],
        config: { systemInstruction: META_ARCHITECT_INSTRUCTION, temperature: 0.2 },
      });
      for await (const chunk of result) { yield (chunk as GenerateContentResponse).text || ""; }
    } catch (error) { throw error; }
  }

  async sendMessageStream(message: string) {
    const chat = this.initChat();
    return await chat.sendMessageStream({ message });
  }

  async generateSpeech(text: string, voice: string = 'Zephyr') {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) return;
      if (!this.audioContext) this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await this.decodeAudioData(this.decodeBase64(base64Audio), this.audioContext, 24000, 1);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer; source.connect(this.audioContext.destination); source.start();
    } catch (e) {}
  }

  private decodeBase64(base64: string) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  }
}
export const gemini = new GeminiService();
