import { Modality, type LiveConnectConfig } from "@google/genai";
import { describe, expect, it } from "vitest";
import { buildRawLiveSetup } from "@/lib/live-config";

describe("Gemini Live WebSocket setup", () => {
  it("places audio generation fields under generationConfig", () => {
    const config: LiveConnectConfig = {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
      sessionResumption: {},
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    };

    const setup = buildRawLiveSetup("gemini-3.1-flash-live-preview", config);

    expect(setup.model).toBe("models/gemini-3.1-flash-live-preview");
    expect(setup.generationConfig.responseModalities).toEqual([Modality.AUDIO]);
    expect(setup).not.toHaveProperty("responseModalities");
    expect(setup.sessionResumption).toEqual({});
  });
});
