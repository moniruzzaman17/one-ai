"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { Bot,BookOpen,Clock3,PhoneCall,Shapes,Users,Wallet,type LucideIcon } from "lucide-react";
import { api } from "@/lib/api-client";

type Data={stats:{calls:number;leads:number;duration:number;costBdt:number;agents:number;sources:number;widgets:number};recent:Array<{id:string;agent:string;startedAt:string;duration:number;category:string;status:string;cost:string}>};
export default function DashboardClient(){
  const[data,setData]=useState<Data|null>(null);const[error,setError]=useState("");
  useEffect(()=>{api<Data>("/api/dashboard").then(setData).catch(e=>setError(e.message))},[]);
  const cards:{label:string;value:string|number;icon:LucideIcon}[]=[{label:"Total calls",value:data?.stats.calls??"—",icon:PhoneCall},{label:"Leads",value:data?.stats.leads??"—",icon:Users},{label:"Talk time",value:data?`${Math.round(data.stats.duration/60)} min`:"—",icon:Clock3},{label:"Estimated cost",value:data?`৳${data.stats.costBdt.toFixed(2)}`:"—",icon:Wallet}];
  const shortcuts:{label:string;value:number|undefined;Icon:LucideIcon;href:string}[]=[{label:"Agents",value:data?.stats.agents,Icon:Bot,href:"/agents"},{label:"Knowledge sources",value:data?.stats.sources,Icon:BookOpen,href:"/knowledge-base"},{label:"Live widgets",value:data?.stats.widgets,Icon:Shapes,href:"/tools/widgets"}];
  return <div className="page-grid"><header><h1 className="page-title">Voice intelligence dashboard</h1><p className="page-subtitle">Calls, leads and knowledge performance at a glance.</p></header>{error&&<div className="error">{error}</div>}
    <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{cards.map(({label,value,icon:Icon})=><div className="glass card" key={label}><div className="flex justify-between items-start"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="heading text-3xl font-extrabold mt-3">{value}</p></div><div className="rounded-2xl bg-blue-600/10 text-blue-600 p-3"><Icon size={20}/></div></div></div>)}</section>
    <section className="grid md:grid-cols-3 gap-4">{shortcuts.map(({label,value,Icon,href})=><Link href={href} className="glass card hover:-translate-y-0.5 transition" key={label}><div className="flex items-center gap-3"><div className="brand-mark !w-11 !h-11"><Icon size={20}/></div><div><div className="font-extrabold">{label}</div><div className="text-sm text-slate-500">{value??"—"} configured</div></div></div></Link>)}</section>
    <section className="glass card"><div className="flex items-center justify-between mb-3"><div><h2 className="heading text-xl font-extrabold">Recent calls</h2><p className="text-sm text-slate-500">Latest browser conversations</p></div><Link className="btn btn-secondary" href="/calls">View all</Link></div>{!data?.recent.length?<div className="empty">No calls yet. Publish a widget to begin.</div>:<div className="table-wrap"><table className="table"><thead><tr><th>Agent</th><th>Time</th><th>Duration</th><th>Category</th><th>Cost</th></tr></thead><tbody>{data.recent.map(c=><tr key={c.id}><td className="font-bold">{c.agent}</td><td>{new Date(c.startedAt).toLocaleString()}</td><td>{Math.round(c.duration/60)} min</td><td><span className={`badge badge-${c.category.toLowerCase()}`}>{c.category}</span></td><td>৳{Number(c.cost).toFixed(2)}</td></tr>)}</tbody></table></div>}</section>
  </div>
}
