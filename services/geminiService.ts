
import { GoogleGenAI, GenerateContentResponse, Chat, Modality, Type } from "@google/genai";
import { Message, SimulationIntervention, Chronicle } from "../types";
import { MODEL_NAME, ARTIFACT_OVERSEER_INSTRUCTION, CHRONICLE_SYNTHESIS_INSTRUCTION, META_ARCHITECT_INSTRUCTION } from "../constants";

export class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;
  private systemInstruction: string = '';
  private audioContext: AudioContext | null = null;

  private illegalTerms = [
    "Favor +", "Adrenaline +", "Oxytocin +", "Bond Matrix", 
    "Tier 1", "Tier 2", "Tier 3", "System prompt", "Wizard step"
  ];

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  setSystemInstruction(instruction: string) {
    this.systemInstruction = instruction;
    this.chat = null; 
  }

  private initChat() {
    if (!this.chat) {
      this.chat = this.ai.chats.create({
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

  async summarizeHistory(messages: Message[]): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const prompt = `
      Perform §5 Context Management. Summarize the following 15 turns into a single 'Narrative Prime' block 
      that preserves Act, Week, current Bond Matrix positions, and critical character shifts.
      
      HISTORY:
      ${messages.map(m => `[${m.role.toUpperCase()}] ${m.content}`).join('\n')}
    `;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are the REB CONTEXT COMPRESSOR. Output a concise <!-- SUMMARY ... --> block only.",
        },
      });
      return response.text || "";
    } catch (e) {
      return "Summary failed.";
    }
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

  async synthesizeChronicle(messages: Message[], stats: any, anchors: any[], npcs: any[]): Promise<any> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const prompt = `
      CURRENT TELEMETRY:
      Stats: ${JSON.stringify(stats)}
      Anchors: ${JSON.stringify(anchors)}
      Current NPCs: ${JSON.stringify(npcs)}
      
      NARRATIVE HISTORY:
      ${messages.slice(-30).map(m => `[${m.role.toUpperCase()}] ${m.content}`).join('\n')}
    `;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          systemInstruction: CHRONICLE_SYNTHESIS_INSTRUCTION,
          responseMimeType: "application/json",
        },
      });

      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.error("Synthesis Error:", e);
      return null;
    }
  }

  async analyzeSimulation(history: Message[], stats: any, situations: any[]): Promise<SimulationIntervention[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const prompt = `
      CURRENT STATS: ${JSON.stringify(stats)}
      SITUATION DECK: ${JSON.stringify(situations)}
      RECENT HISTORY:
      ${history.slice(-10).map(m => `[${m.role.toUpperCase()}] ${m.content}`).join('\n')}
    `;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          systemInstruction: ARTIFACT_OVERSEER_INSTRUCTION,
          responseMimeType: "application/json",
        },
      });

      const data = JSON.parse(response.text || '{"interventions": []}');
      return data.interventions.map((inv: any) => ({
        ...inv,
        id: Math.random().toString(36).substr(2, 9)
      }));
    } catch (e) {
      console.error("Analysis Error:", e);
      return [];
    }
  }

  async *sendMetaMessageStream(message: string, history: Message[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    // Filter history for recent context without overwhelming the Architect
    const historyRef = history.slice(-10).map(m => `[${m.role === 'user' ? 'ADMIN' : 'ENGINE'}] ${m.content}`).join('\n');
    
    const prompt = `
      SIMULATION LOG HISTORY:
      ${historyRef}
      
      ADMIN COMMAND:
      ${message}
    `;

    try {
      const result = await ai.models.generateContentStream({
        model: MODEL_NAME,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          systemInstruction: META_ARCHITECT_INSTRUCTION,
          temperature: 0.2, // Low temperature for technical precision
        },
      });
      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        yield c.text || "";
      }
    } catch (error) {
      console.error("Architect Stream Error:", error);
      throw error;
    }
  }

  async sendMessage(message: string): Promise<string> {
    const chat = this.initChat();
    try {
      const result = await chat.sendMessage({ message });
      return result.text || "No response generated.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  async *sendMessageStream(message: string) {
    const chat = this.initChat();
    try {
      const result = await chat.sendMessageStream({ message });
      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        yield c.text || "";
      }
    } catch (error) {
      console.error("Gemini Streaming Error:", error);
      throw error;
    }
  }

  async generateSpeech(text: string, voice: string = 'Zephyr') {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Read this in a calm, slightly synthetic, authoritative engine voice: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) return;

      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const audioBuffer = await this.decodeAudioData(
        this.decodeBase64(base64Audio),
        this.audioContext,
        24000,
        1
      );

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();
    } catch (error) {
      console.error("TTS Generation Error:", error);
    }
  }

  private decodeBase64(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
}

export const gemini = new GeminiService();
