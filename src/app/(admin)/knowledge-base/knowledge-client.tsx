"use client";
import { FormEvent,useEffect,useState } from "react";
import { BookOpen,Eye,FileText,Globe2,RefreshCw,Trash2,Upload } from "lucide-react";
import { api,csrfToken } from "@/lib/api-client";

type Source={id:string;kind:string;title:string;originalName?:string;sourceUrl?:string;status:string;progress:number;error?:string;pageCount:number;chunkCount:number;createdAt:string;lastProcessedAt?:string};
type CrawlDetail={source:Source;pages:Array<{url:string|null;title:string;chunks:number;preview:string}>};

export default function KnowledgeClient(){
  const[items,setItems]=useState<Source[]>([]);
  const[mode,setMode]=useState<"file"|"website">("file");
  const[detail,setDetail]=useState<(CrawlDetail&{id:string})|null>(null);
  const[error,setError]=useState("");
  const[busy,setBusy]=useState(false);

  async function load(){try{const d=await api<{sources:Source[]}>('/api/knowledge');setItems(d.sources)}catch(e){setError((e as Error).message)}}
  useEffect(()=>{load();const id=setInterval(load,10000);return()=>clearInterval(id)},[]);

  async function upload(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");try{const form=new FormData(e.currentTarget);const response=await fetch("/api/knowledge",{method:"POST",headers:{"x-oneai-csrf":csrfToken()},body:form});const body=await response.json();if(!response.ok)throw new Error(body.error);e.currentTarget.reset();await load()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function website(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");const form=new FormData(e.currentTarget);try{await api("/api/knowledge",{method:"POST",body:JSON.stringify({url:form.get("url"),title:form.get("title")||undefined,depth:Number(form.get("depth"))})});e.currentTarget.reset();await load()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function mutate(id:string,action:"delete"|"reprocess"){if(action==="delete"&&!confirm("Delete this source and revoke its chunks from all agents?"))return;try{await api(`/api/knowledge/${id}${action==="reprocess"?"/reprocess":""}`,{method:action==="delete"?"DELETE":"POST",body:"{}"});if(detail?.id===id)setDetail(null);await load()}catch(e){setError((e as Error).message)}}
  async function inspect(id:string){if(detail?.id===id){setDetail(null);return}try{const data=await api<CrawlDetail>(`/api/knowledge/${id}`);setDetail({...data,id})}catch(e){setError((e as Error).message)}}

  return <div className="page-grid">
    <header><h1 className="page-title">Knowledge base</h1><p className="page-subtitle">Ground agents in documents and same-origin website content.</p></header>
    {error&&<div className="error">{error}</div>}
    <section className="glass card">
      <div className="flex gap-2 mb-5">
        <button className={`btn ${mode==="file"?"btn-primary":"btn-secondary"}`} onClick={()=>setMode("file")}><Upload size={17}/>File</button>
        <button className={`btn ${mode==="website"?"btn-primary":"btn-secondary"}`} onClick={()=>setMode("website")}><Globe2 size={17}/>Website</button>
      </div>
      {mode==="file"?<form onSubmit={upload} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <label className="field"><span>Display title (optional)</span><input className="input" name="title"/></label>
        <label className="field"><span>PDF, DOCX, XLSX, TXT or CSV · max 20 MB</span><input className="input" name="file" type="file" accept=".pdf,.docx,.xlsx,.txt,.csv" required/></label>
        <button className="btn btn-primary" disabled={busy}>{busy?"Uploading…":"Upload & process"}</button>
      </form>:<form onSubmit={website} className="grid sm:grid-cols-[1fr_1fr_110px_auto] gap-3 items-end">
        <label className="field"><span>Display title</span><input className="input" name="title"/></label>
        <label className="field"><span>Website URL</span><input className="input" name="url" type="url" placeholder="https://example.com" required/></label>
        <label className="field"><span>Depth</span><select className="input" name="depth" defaultValue="3">{[1,2,3,4,5].map(x=><option key={x}>{x}</option>)}</select></label>
        <button className="btn btn-primary" disabled={busy}>Start crawl</button>
      </form>}
    </section>
    <section className="grid md:grid-cols-2 gap-4">
      {items.map(s=><article className="glass card" key={s.id}>
        <div className="flex gap-3"><div className="brand-mark">{s.kind==="website"?<Globe2 size={19}/>:<FileText size={19}/>}</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><h2 className="font-extrabold truncate">{s.title}</h2><span className="badge">{s.status}</span></div><p className="text-xs text-slate-500 truncate mt-1">{s.sourceUrl||s.originalName}</p></div></div>
        {["queued","processing"].includes(s.status)&&<div className="mt-4 h-2 rounded-full bg-white/60 overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-600 to-teal-400" style={{width:`${Math.max(4,s.progress)}%`}}/></div>}
        <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 mt-4"><span>{s.pageCount} pages</span><span>{s.chunkCount} chunks</span><span>{s.lastProcessedAt?new Date(s.lastProcessedAt).toLocaleString():"Not processed"}</span></div>
        {s.error&&<div className="error mt-3">{s.error}</div>}
        <div className="flex justify-end gap-2 mt-4">
          <button title="Inspect crawled content" className="btn btn-secondary !px-3" onClick={()=>inspect(s.id)}><Eye size={16}/></button>
          <button title="Reprocess" className="btn btn-secondary !px-3" onClick={()=>mutate(s.id,"reprocess")}><RefreshCw size={16}/></button>
          <button title="Delete" className="btn btn-secondary !px-3 text-red-500" onClick={()=>mutate(s.id,"delete")}><Trash2 size={16}/></button>
        </div>
        {detail?.id===s.id&&<div className="mt-4 border-t border-white/50 pt-4 space-y-3">
          <div className="flex justify-between text-xs font-bold"><span>Crawl inspection</span><span>{detail.pages.length} indexed locations</span></div>
          {detail.pages.map((page,index)=><div className="rounded-xl bg-white/45 p-3 text-xs" key={`${page.url}-${index}`}><div className="font-bold truncate">{page.title}</div><div className="text-blue-600 truncate">{page.url||"Uploaded document"}</div><div className="text-slate-500 mt-1">{page.chunks} chunk{page.chunks===1?"":"s"}</div><p className="text-slate-600 mt-2 line-clamp-3">{page.preview}</p></div>)}
          {!detail.pages.length&&<p className="text-xs text-slate-500">No indexed content yet. Check the status/error above or reprocess this source.</p>}
        </div>}
      </article>)}
      {!items.length&&<div className="glass card empty md:col-span-2"><BookOpen className="mx-auto mb-3"/>No knowledge sources yet.</div>}
    </section>
  </div>
}
