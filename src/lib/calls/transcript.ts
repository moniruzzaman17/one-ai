export function appendTranscriptChunk(current: string, chunk: string) {
  if (!current) return chunk;
  if (!chunk) return current;
  if (/\s$/.test(current) || /^\s|^[,.;:!?।॥]/u.test(chunk)) return current + chunk;
  return `${current} ${chunk}`;
}

export function mergeTranscriptTurns<T extends { role: string; text: string }>(turns: T[]) {
  const merged: T[] = [];
  for (const turn of turns) {
    const previous = merged.at(-1);
    if (previous?.role === turn.role) {
      merged[merged.length - 1] = {
        ...previous,
        text: appendTranscriptChunk(previous.text, turn.text),
      };
    } else {
      merged.push({ ...turn });
    }
  }
  return merged;
}
