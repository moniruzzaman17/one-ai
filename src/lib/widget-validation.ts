import { z } from "zod";

export const widgetInput = z.object({
  name: z.string().min(2).max(100),
  agentId: z.uuid(),
  active: z.boolean().default(true),
  avatarUrl: z.string().max(500).nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  greeting: z.string().max(600).nullable().optional(),
  position: z.enum(["left", "right"]),
  recordingEnabled: z.boolean(),
  recordingNotice: z.string().min(5).max(500),
  origins: z.array(z.url()).min(1).max(30),
});
