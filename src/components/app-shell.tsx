"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Bot, BookOpen, ChevronRight, Headphones, LogOut, Menu, PhoneCall, Settings, Shapes, X } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api-client";

const links=[
  ["/dashboard","Dashboard",BarChart3],["/agents","Agents",Bot],["/knowledge-base","Knowledge",BookOpen],["/tools/widgets","Widgets",Shapes],["/calls","Calls & leads",PhoneCall],["/settings/gemini","Gemini settings",Settings],
] as const;

export function AppShell({children,admin}:{children:React.ReactNode;admin:{name:string;email:string;mustChangePassword:boolean}}){
  const path=usePathname(),router=useRouter(); const [open,setOpen]=useState(false);
  async function logout(){await api("/api/auth/logout",{method:"POST",body:"{}"});router.replace("/login");router.refresh()}
  const nav=<><div className="flex items-center gap-3 px-3 py-2 mb-6"><div className="brand-mark"><Headphones size={21}/></div><div><div className="heading font-extrabold text-lg">OneAI</div><div className="text-[11px] text-slate-500">Voice workspace</div></div></div><nav className="grid gap-1.5">{links.map(([href,label,Icon])=>{const active=path===href||path.startsWith(`${href}/`);return <Link key={href} onClick={()=>setOpen(false)} href={href} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition ${active?"bg-blue-600 text-white shadow-lg shadow-blue-500/20":"text-slate-600 hover:bg-white/60 hover:text-slate-950"}`}><Icon size={18}/><span>{label}</span>{active&&<ChevronRight className="ml-auto" size={15}/>}</Link>})}</nav><div className="mt-auto pt-6"><Link href="/settings/profile" onClick={()=>setOpen(false)} className="block rounded-xl px-3.5 py-3 hover:bg-white/60"><div className="font-bold text-sm truncate">{admin.name}</div><div className="text-xs text-slate-500 truncate">{admin.email}</div></Link><button onClick={logout} className="w-full mt-2 flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-500 hover:bg-red-50 hover:text-red-600"><LogOut size={17}/>Sign out</button></div></>;
  return <div className="min-h-screen"><button aria-label="Open navigation" onClick={()=>setOpen(true)} className="glass fixed top-4 left-4 z-30 lg:hidden rounded-xl p-3"><Menu size={20}/></button><aside className="glass fixed left-4 top-4 bottom-4 w-[238px] rounded-[25px] p-3 hidden lg:flex flex-col z-20">{nav}</aside>{open&&<div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close navigation overlay" className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm" onClick={()=>setOpen(false)}/><aside className="glass absolute left-3 top-3 bottom-3 w-[270px] rounded-[25px] p-3 flex flex-col"><button aria-label="Close navigation" onClick={()=>setOpen(false)} className="absolute right-3 top-3 p-2"><X size={18}/></button>{nav}</aside></div>}<main className="lg:pl-[270px] p-4 pt-20 lg:pt-7 lg:pr-7 lg:pb-7 min-h-screen"><div className="max-w-[1280px] mx-auto">{admin.mustChangePassword&&<div className="glass-strong rounded-2xl p-4 mb-5 text-sm font-bold text-amber-700">For your security, change the temporary admin password before using OneAI.</div>}{children}</div></main></div>
}
