"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Headphones, LockKeyhole, Mail, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch("/api/auth/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email, password }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to sign in");
      router.replace(body.mustChangePassword ? "/settings/profile" : "/dashboard"); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to sign in"); }
    finally { setLoading(false); }
  }
  return <main className="min-h-screen grid place-items-center p-5 relative overflow-hidden">
    <div className="absolute w-80 h-80 rounded-full bg-blue-400/20 blur-3xl -top-24 -left-20"/><div className="absolute w-96 h-96 rounded-full bg-teal-300/20 blur-3xl -bottom-40 -right-24"/>
    <section className="glass w-full max-w-[440px] rounded-[30px] p-7 sm:p-9 relative">
      <div className="flex items-center gap-3 mb-8"><div className="brand-mark"><Headphones size={22}/></div><div><div className="heading font-extrabold text-xl">OneAI</div><div className="text-xs text-slate-500">Browser voice intelligence</div></div></div>
      <div className="mb-7"><div className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/10 text-blue-700 text-xs font-bold px-3 py-1.5 mb-4"><Sparkles size={13}/> Private admin workspace</div><h1 className="heading text-3xl font-extrabold">Welcome back</h1><p className="text-sm text-slate-500 mt-2">Sign in to manage agents, knowledge and calls.</p></div>
      <form onSubmit={submit} className="grid gap-4">
        <label className="field"><span>Email</span><div className="relative"><Mail size={17} className="absolute left-3.5 top-3.5 text-slate-400"/><input className="input pl-10" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="username" required/></div></label>
        <label className="field"><span>Password</span><div className="relative"><LockKeyhole size={17} className="absolute left-3.5 top-3.5 text-slate-400"/><input className="input pl-10" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="current-password" required/></div></label>
        {error&&<div className="error" role="alert">{error}</div>}<button className="btn btn-primary mt-2" disabled={loading}>{loading?"Signing in…":"Sign in"}</button>
      </form><p className="text-center text-xs text-slate-400 mt-7">Single-admin access · v0.1.0</p>
    </section>
  </main>;
}
