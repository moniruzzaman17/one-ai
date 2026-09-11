import { describe,expect,it } from "vitest";
import { appendTranscriptChunk,mergeTranscriptTurns } from "@/lib/calls/transcript";

describe("streaming transcript assembly",()=>{
  it("joins Gemini chunks without splitting every word",()=>{
    expect(["দুঃখিত, আমি"," আপনাকে"," চিনতে"," পারছি"," না।"].reduce(appendTranscriptChunk,""))
      .toBe("দুঃখিত, আমি আপনাকে চিনতে পারছি না।");
  });

  it("merges only consecutive chunks from the same speaker",()=>{
    const turns=mergeTranscriptTurns([
      {role:"agent",text:"How"},{role:"agent",text:" can I help?"},
      {role:"visitor",text:"A backpack"},{role:"agent",text:"Certainly."},
    ]);
    expect(turns.map(turn=>[turn.role,turn.text])).toEqual([
      ["agent","How can I help?"],["visitor","A backpack"],["agent","Certainly."],
    ]);
  });
});
