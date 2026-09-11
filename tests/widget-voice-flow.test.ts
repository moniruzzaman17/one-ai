import { readFileSync } from "node:fs";
import vm from "node:vm";
import { afterEach,describe,expect,it,vi } from "vitest";

class ClassList {
  add() {}
  remove() {}
  toggle() {}
}

class ElementStub {
  checked = true;
  classList = new ClassList();
  disabled = false;
  innerHTML = "";
  onclick: (() => unknown) | null = null;
  scrollHeight = 0;
  scrollTop = 0;
  style = { setProperty() {} };
  textContent = "";
  appendChild() {}
  insertBefore() {}
}

describe("public widget Gemini Live flow", () => {
  afterEach(() => vi.useRealTimers());

  it("waits for setup and the agent greeting before streaming microphone audio", async () => {
    vi.useFakeTimers();
    const elements = new Map<string, ElementStub>();
    for (const selector of [".wrap",".panel",".launch",".body",".status",".call",".mute",".end",".consent-box",".close",".name",".greet",".record-note",".consent",".avatar"]) {
      elements.set(selector,new ElementStub());
    }
    const root = new ElementStub() as ElementStub & {querySelector:(selector:string)=>ElementStub};
    root.querySelector = (selector) => elements.get(selector) ?? new ElementStub();
    const processors: Array<{onaudioprocess:((event:unknown)=>void)|null}> = [];
    const recorders: Array<{state:string;start:ReturnType<typeof vi.fn>;stop:ReturnType<typeof vi.fn>}> = [];
    const sockets: FakeSocket[] = [];

    class FakeSocket {
      readyState = 0;
      sent: string[] = [];
      onopen: (()=>void) | null = null;
      onmessage: ((event:{data:string})=>void) | null = null;
      onerror: (()=>void) | null = null;
      onclose: ((event:{code:number;reason:string})=>void) | null = null;
      constructor(public url:string) { sockets.push(this); }
      send(value:string) { this.sent.push(value); }
      close() { this.readyState = 3; }
    }

    class FakeRecorder {
      static isTypeSupported() { return true; }
      state = "inactive";
      start = vi.fn(() => { this.state = "recording"; });
      stop = vi.fn(() => { this.state = "inactive"; });
      ondataavailable: ((event:{data:{size:number}})=>void) | null = null;
      onstop: (()=>void) | null = null;
      constructor() { recorders.push(this); }
    }

    class FakeAudioContext {
      currentTime = 0;
      destination = {};
      sampleRate = 48_000;
      state = "running";
      async resume() {}
      async close() { this.state = "closed"; }
      createMediaStreamSource() { return {connect() {}}; }
      createScriptProcessor() {
        const processor = {connect() {},disconnect() {},onaudioprocess:null as ((event:unknown)=>void)|null};
        processors.push(processor);
        return processor;
      }
      createGain() { return {gain:{value:1},connect() {}}; }
      createMediaStreamDestination() { return {stream:{}}; }
    }

    const fetchMock = vi.fn(async (url:string) => ({
      ok: true,
      json: async () => url.includes("/config") ? {widget:{agentName:"Test",greeting:"Hello",recordingNotice:"Recorded",position:"right",primaryColor:"#3858F0",accentColor:"#16D9C4",avatarUrl:"",recordingEnabled:true}} : url.includes("/session") ? {sessionToken:"signed",callId:"call",websocketUrl:"wss://example.test/live",setup:{model:"models/test"},maxCallSeconds:1800,idleSeconds:180} : {ok:true},
    }));
    const script = {src:"https://one.example/widget/embed.js",getAttribute:()=>"wgt_test"};
    const documentStub = {
      currentScript: script,
      body: {appendChild() {}},
      createElement: (name:string) => name === "div" ? {id:"",attachShadow:()=>root} : new ElementStub(),
    };
    const mediaStream = {getTracks:()=>[{stop() {}}]};
    const context = {
      AudioContext: FakeAudioContext,
      Blob,
      Buffer,
      MediaRecorder: FakeRecorder,
      Promise,
      Uint8Array,
      Float32Array,
      Int16Array,
      URL,
      WebSocket: FakeSocket,
      atob: (value:string)=>Buffer.from(value,"base64").toString("binary"),
      btoa: (value:string)=>Buffer.from(value,"binary").toString("base64"),
      clearInterval,
      clearTimeout,
      document: documentStub,
      fetch: fetchMock,
      navigator: {mediaDevices:{getUserMedia:async()=>mediaStream}},
      setInterval,
      setTimeout,
    };
    Object.assign(context,{window:context});
    vm.runInNewContext(readFileSync("public/widget/embed.js","utf8"),context);
    for (let index=0;index<5;index++) await Promise.resolve();

    await elements.get(".call")!.onclick!();
    expect(sockets).toHaveLength(1);
    const socket = sockets[0];
    socket.readyState = 1;
    socket.onopen!();
    expect(JSON.parse(socket.sent[0])).toHaveProperty("setup");

    const audioEvent = {inputBuffer:{getChannelData:()=>new Float32Array(4096)}};
    processors[0].onaudioprocess!(audioEvent);
    expect(socket.sent).toHaveLength(1);
    expect(recorders[0].start).not.toHaveBeenCalled();

    socket.onmessage!({data:JSON.stringify({setupComplete:{}})});
    expect(recorders[0].start).toHaveBeenCalledWith(4000);
    expect(JSON.parse(socket.sent[1])).toEqual({realtimeInput:{text:"Begin the call now with the exact configured greeting, speaking aloud."}});
    processors[0].onaudioprocess!(audioEvent);
    expect(socket.sent).toHaveLength(2);

    socket.onmessage!({data:JSON.stringify({serverContent:{turnComplete:true}})});
    processors[0].onaudioprocess!(audioEvent);
    expect(JSON.parse(socket.sent[2])).toHaveProperty("realtimeInput.audio.mimeType","audio/pcm;rate=16000");
  });
});
