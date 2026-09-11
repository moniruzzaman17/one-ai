import { Modality, Type, type LiveConnectConfig } from "@google/genai";
import type { agentLeadFields, agents } from "@/db/schema";

type Agent = typeof agents.$inferSelect;
type Field = typeof agentLeadFields.$inferSelect;

export function buildLiveConfig(agent: Agent, fields: Field[]): LiveConnectConfig {
  const language = agent.language === "bangla"
    ? "Speak naturally in Bangla."
    : agent.language === "english"
      ? "Speak in English."
      : "Speak in Bangla or English, matching the visitor's language.";
  const leadList = fields
    .map((field) => `${field.fieldKey}: ${field.label}${field.required ? " (required)" : ""}`)
    .join(", ");
  const prompt = `You are ${agent.name}, a browser voice assistant. ${language} Tone: ${agent.tone}. ${agent.systemPrompt}
Begin the conversation with this exact greeting: ${agent.greeting}
For every question about products, catalog, price, stock, specifications, company information or policies, you MUST call search_knowledge_base before answering. Base the answer on its answerContext and never invent facts when retrieval has no answer. Collect these lead fields conversationally when appropriate: ${leadList}. Save each value with save_lead_information.`;

  return {
    responseModalities: [Modality.AUDIO],
    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: agent.voiceName } } },
    systemInstruction: { parts: [{ text: prompt }] },
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    sessionResumption: {},
    realtimeInputConfig: {
      automaticActivityDetection: {
        disabled: false,
        prefixPaddingMs: 200,
        silenceDurationMs: 700,
      },
    },
    tools: [{
      functionDeclarations: [{
        name: "search_knowledge_base",
        description: "Mandatory lookup for products, prices, stock, specifications, company details and policies. Searches only knowledge assigned to this agent.",
        parameters: {
          type: Type.OBJECT,
          properties: { query: { type: Type.STRING } },
          required: ["query"],
        },
      }, {
        name: "save_lead_information",
        description: "Save a visitor detail after the visitor provides it.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            fieldKey: { type: Type.STRING },
            value: { type: Type.STRING },
          },
          required: ["fieldKey", "value"],
        },
      }],
    }],
  };
}

export function buildRawLiveSetup(model: string, config: LiveConnectConfig) {
  return {
    model: `models/${model}`,
    generationConfig: {
      responseModalities: config.responseModalities,
      speechConfig: config.speechConfig,
    },
    systemInstruction: config.systemInstruction,
    tools: config.tools,
    sessionResumption: config.sessionResumption,
    inputAudioTranscription: config.inputAudioTranscription,
    outputAudioTranscription: config.outputAudioTranscription,
    realtimeInputConfig: config.realtimeInputConfig,
  };
}
