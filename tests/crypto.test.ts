import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64url");
});

describe("secret encryption", () => {
  it("round-trips a provider secret without storing plaintext", async () => {
    const { decryptSecret, encryptSecret } = await import("@/lib/crypto");
    const plaintext = "provider-secret-value";
    const encrypted = encryptSecret(plaintext);

    expect(encrypted).not.toContain(plaintext);
    expect(decryptSecret(encrypted)).toBe(plaintext);
  });

  it("rejects tampered ciphertext", async () => {
    const { decryptSecret, encryptSecret } = await import("@/lib/crypto");
    const encrypted = encryptSecret("provider-secret-value");
    const tampered = `${encrypted.slice(0, -1)}${encrypted.endsWith("A") ? "B" : "A"}`;

    expect(() => decryptSecret(tampered)).toThrow();
  });
});
