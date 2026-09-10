export function buildEmbeddingContents(texts: string[]) {
  return texts.map((text) => ({ parts: [{ text }] }));
}
