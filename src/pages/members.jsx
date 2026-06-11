// MembersAdmin (v0.75) — the owner's master view: every client account, plan counts,
// Stripe income (when STRIPE_SECRET_KEY is set in Vercel), and complimentary-Premium
// grant/revoke. Server boundary: api/admin-members.js (list = admin allowlist;
// grant/revoke = any advisor). Visible in nav only for admin advisor accounts.
import { useState, useEffect } from "react";
import { Users, Sparkles, Gift, RefreshCw } from "lucide-react";
import { useTh } from "../contexts/theme";
import { mCARD, mINP, mTH, mTHR, mTD, mTDR } from "../styles/theme";
import { gaAdminMembers } from "../services/supabase";

const GA_ADMIN_EMAILS=["ap@goldenanchor.life","mauricio@goldenanchor.life","finance@goldenanchor.life","test@goldenanchor.life"];
const isGaAdmin=(email)=>GA_ADMIN_EMAILS.includes((email||"").toLowerCase());

function MembersAdminPage({t,lang}){
  const th=useTh();const es=lang==="es";
  const[state,setState]=useState({loading:true,error:"",counts:null,income:null,members:[],stripeConfigured:false});
  const[grantEmail,setGrantEmail]=useState("");const[busyRow,setBusyRow]=useState("");const[msg,setMsg]=useState("");
  const load=async()=>{
    setState(s=>({...s,loading:true,error:""}));
    const r=await gaAdminMembers({action:"list"});
    if(!r.ok){setState(s=>({...s,loading:false,error:r.error||"load failed"}));return;}
    setState({loading:false,error:"",counts:r.counts,income:r.income,members:r.members||[],stripeConfigured:!!r.stripeConfigured});
  };
  useEffect(()=>{load();},[]);
  const act=async(action,email)=>{
    setBusyRow(email);setMsg("");
    const r=await gaAdminMembers({action,email});
    setBusyRow("");
    if(!r.ok){setMsg((es?"Error: ":"Error: ")+(r.error||action));return;}
    setMsg(action==="grant"?(es?`Premium de cortesía activado para ${r.email}.`:`Complimentary Premium granted to ${r.email}.`):(es?`Plan de ${r.email} regresó a Gratis.`:`${r.email} set back to Free.`));
    load();
  };
  const Stat=({icon:Icon,label,value,color})=><div style={{...mCARD(th),padding:"15px 17px",flex:1,minWidth:150}}>
    <div style={{display:"flex",alignItems:"center",gap:8,fontSize:9.5,color:th.dim,fontWeight:500,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:8}}>{Icon&&<Icon size={13} strokeWidth={1.8}/>}{label}</div>
    <div style={{fontSize:23,fontWeight:600,color:color||th.text,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"-0.5px",fontVariantNumeric:"tabular-nums"}}>{value}</div>
  </div>;
  const planChip=(m)=><span style={{fontSize:10,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",padding:"3px 9px",borderRadius:99,background:(m.plan==="free"?th.dim:th.accent)+"1A",color:m.plan==="free"?th.muted:th.accent,border:"1px solid "+((m.plan==="free"?th.dim:th.accent)+"33")}}>{m.plan}{m.comped?" · comp":""}</span>;
  return <div className="ga-np" style={{padding:24,maxWidth:1100,margin:"0 auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:18,flexWrap:"wrap"}}>
      <div style={{fontSize:12,color:th.muted}}>{es?"Cuentas de clientes, planes e ingresos — y Premium de cortesía.":"Client accounts, plans and income — and complimentary Premium."}</div>
      <button className="ga-press" onClick={load} style={{display:"flex",alignItems:"center",gap:7,fontSize:11.5,fontWeight:600,padding:"8px 14px",borderRadius:9,background:"transparent",color:th.muted,border:"1px solid "+th.cardBorder,cursor:"pointer",fontFamily:"inherit"}}><RefreshCw size={13} strokeWidth={1.8}/>{es?"Actualizar":"Refresh"}</button>
    </div>
    {state.error&&<div style={{...mCARD(th),padding:16,marginBottom:16,color:th.neg,fontSize:12.5}}>{state.error}</div>}
    {state.loading?<div style={{color:th.dim,fontSize:13,padding:30,textAlign:"center"}}>…</div>:<>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:14}}>
        <Stat icon={Users} label={es?"Miembros":"Members"} value={state.counts?.total??0}/>
        <Stat icon={Sparkles} label="Premium+" value={state.counts?.premium??0} color={th.accent}/>
        <Stat label={es?"Gratis":"Free"} value={state.counts?.free??0}/>
        <Stat icon={Gift} label={es?"Cortesía":"Comped"} value={state.counts?.comped??0}/>
        <Stat label={es?"Ingreso mensual (MRR)":"Monthly income (MRR)"} value={state.income&&state.income.mrrUsd!=null?("$"+state.income.mrrUsd):"—"} color={th.pos}/>
      </div>
      {!state.stripeConfigured&&<div style={{fontSize:11.5,color:th.dim,fontStyle:"italic",marginBottom:16}}>{es?"El ingreso de Stripe aparece cuando STRIPE_SECRET_KEY esté en Vercel (ver REVIEW_QUEUE).":"Stripe income appears once STRIPE_SECRET_KEY is set in Vercel (see REVIEW_QUEUE)."}</div>}
      <div style={{...mCARD(th),padding:"14px 16px",marginBottom:16}}>
        <div style={{fontSize:10,fontWeight:500,color:th.dim,letterSpacing:".1em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginBottom:9}}>{es?"Premium de cortesía por correo":"Complimentary Premium by email"}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <input value={grantEmail} onChange={e=>setGrantEmail(e.target.value)} placeholder={es?"correo@cliente.com":"client@email.com"} style={{...mINP(th),flex:1,minWidth:220}}/>
          <button className="ga-press" onClick={()=>grantEmail.trim()&&act("grant",grantEmail.trim())} disabled={!grantEmail.trim()||busyRow===grantEmail.trim()} style={{fontSize:12,fontWeight:700,padding:"10px 18px",borderRadius:9,background:th.accent+"1A",color:th.accent,border:"1px solid "+th.accent+"44",cursor:"pointer",fontFamily:"inherit"}}>{es?"Regalar Premium":"Gift Premium"}</button>
        </div>
        {msg&&<div style={{fontSize:11.5,color:th.muted,marginTop:9}}>{msg}</div>}
      </div>
      <div style={{...mCARD(th),padding:0,overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{borderBottom:"1px solid "+th.cardBorder}}>
            <th style={{...mTH(th),padding:"11px 14px",textAlign:"left"}}>{es?"Correo":"Email"}</th>
            <th style={{...mTH(th),padding:"11px 8px",textAlign:"left"}}>{es?"Nombre":"Name"}</th>
            <th style={{...mTH(th),padding:"11px 8px",textAlign:"left"}}>Plan</th>
            <th style={{...mTHR(th),padding:"11px 8px"}}>{es?"Alta":"Joined"}</th>
            <th style={{...mTH(th),padding:"11px 8px",textAlign:"center"}}>{es?"Seguro":"Insurance"}</th>
            <th style={{...mTH(th),padding:"11px 14px",textAlign:"right"}}></th>
          </tr></thead>
          <tbody>
            {state.members.map(m=><tr key={m.uid} style={{borderBottom:"1px solid "+(th.glassBorder||th.cardBorder)}}>
              <td style={{...mTD(th),padding:"10px 14px"}}>{m.email}{!m.confirmed&&<span title={es?"correo sin confirmar":"email unconfirmed"} style={{marginLeft:6,fontSize:9,color:th.warn,fontFamily:"'JetBrains Mono',monospace"}}>!</span>}</td>
              <td style={{...mTD(th),padding:"10px 8px",color:th.muted}}>{m.name||"—"}</td>
              <td style={{padding:"10px 8px"}}>{planChip(m)}</td>
              <td style={{...mTDR(th),padding:"10px 8px",color:th.dim}}>{m.joined}</td>
              <td style={{padding:"10px 8px",textAlign:"center",fontSize:10.5,color:th.muted}}>{m.insurance?[m.insurance.health?(es?"salud":"health"):null,m.insurance.car?(es?"auto":"car"):null].filter(Boolean).join(" + ")||"—":"—"}</td>
              <td style={{padding:"10px 14px",textAlign:"right"}}>
                {m.plan==="free"
                  ?<button className="ga-press" onClick={()=>act("grant",m.email)} disabled={busyRow===m.email} style={{fontSize:10.5,fontWeight:700,padding:"5px 12px",borderRadius:8,background:th.accent+"14",color:th.accent,border:"1px solid "+th.accent+"33",cursor:"pointer",fontFamily:"inherit"}}>{busyRow===m.email?"…":(es?"Regalar":"Gift")}</button>
                  :<button className="ga-press" onClick={()=>act("revoke",m.email)} disabled={busyRow===m.email} style={{fontSize:10.5,fontWeight:600,padding:"5px 12px",borderRadius:8,background:"transparent",color:th.muted,border:"1px solid "+th.cardBorder,cursor:"pointer",fontFamily:"inherit"}}>{busyRow===m.email?"…":(es?"Quitar":"Revoke")}</button>}
              </td>
            </tr>)}
            {!state.members.length&&<tr><td colSpan={6} style={{padding:"22px 14px",textAlign:"center",color:th.dim,fontSize:12,fontStyle:"italic"}}>{es?"Aún no hay cuentas de clientes.":"No client accounts yet."}</td></tr>}
          </tbody>
        </table>
      </div>
    </>}
  </div>;
}

export { MembersAdminPage, isGaAdmin, GA_ADMIN_EMAILS };
