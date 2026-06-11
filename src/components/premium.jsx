// Premium gating (MD-A, v0.74) — Free vs paid plans for client-role accounts.
// PremiumCtx mirrors HideCtx (D-7 amendment noted in AGENT.md): provided once at the
// client-shell level; consumers gate their surface. Advisors are NEVER gated.
// Plan source of truth: client.accountPlan ("free"|"premium"|"lite"|"lite-plus"|"annual",
// absent → free). Activation is light-flow: pay via Stripe link (client_reference_id =
// account uid) → claim → flag set + verification email to the firm. Webhook sync = MD-H.
import { createContext, useContext, useState } from "react";
import { Sparkles, Check, Lock } from "lucide-react";
import { useTh } from "../contexts/theme";
import { PREMIUM_TIERS } from "../constants/meta";
import { gaSendSupportEmail, gaPremiumCheckout } from "../services/supabase";

/* v0.75 — TRUE choose-your-price (owner: "I want them to choose whatever they want
   starting from 3 bucks"). Amount input → server creates/reuses a recurring price +
   Checkout Session (webhook auto-activates). Falls back to the nearest fixed-tier
   payment link while STRIPE_SECRET_KEY isn't set in Vercel. */
const amountNote=(amt,es)=>{
  if(amt<5)  return es?"Nos regalas un cafecito al mes — gracias.":"You're gifting us a coffee a month — thank you.";
  if(amt<15) return es?"Nos ayudas a mantener la plataforma — eres increíble.":"You're helping us maintain the platform — you're amazing.";
  return es?"Financias herramientas gratis para las familias que más las necesitan. Enorme.":"You're funding free tools for the families who need them most. Huge.";
};
function ChooseAmount({lang,onFallbackTier}){
  const th=useTh();const es=lang==="es";
  const[amt,setAmt]=useState(10);const[busy,setBusy]=useState(false);const[err,setErr]=useState("");
  const clean=v=>{const n=Math.round(Number(v));return Number.isFinite(n)?Math.min(500,Math.max(3,n)):3;};
  const go=async()=>{
    if(busy)return;setBusy(true);setErr("");
    const a=clean(amt);
    const r=await gaPremiumCheckout(a);
    if(r.ok&&r.url){window.location.href=r.url;return;}
    if(r.code==="no-stripe-key"){ // graceful fallback: nearest fixed tier link
      const tier=PREMIUM_TIERS.reduce((b,t)=>Math.abs(t.amount-a)<Math.abs(b.amount-a)?t:b,PREMIUM_TIERS[0]);
      onFallbackTier?onFallbackTier(tier):window.open(tier.link,"_blank","noopener");
      setBusy(false);return;
    }
    setErr(r.error||"checkout failed");setBusy(false);
  };
  return <div style={{textAlign:"left"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,background:th.inp,border:"1px solid "+th.cardBorder,borderRadius:11,padding:"9px 13px"}}>
        <span style={{fontSize:16,fontWeight:700,color:th.accent,fontFamily:"'JetBrains Mono',monospace"}}>$</span>
        <input type="number" min={3} max={500} step={1} value={amt} onChange={e=>setAmt(e.target.value)} onBlur={()=>setAmt(clean(amt))}
          style={{width:64,background:"transparent",border:"none",outline:"none",color:th.text,fontSize:17,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}/>
        <span style={{fontSize:11,color:th.dim,fontFamily:"'JetBrains Mono',monospace"}}>/{es?"mes":"mo"}</span>
      </div>
      <div style={{display:"flex",gap:6}}>{[3,10,20].map(v=><button key={v} type="button" onClick={()=>setAmt(v)} style={{fontSize:11.5,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",padding:"8px 12px",borderRadius:9,cursor:"pointer",background:clean(amt)===v?th.accent+"1A":"transparent",color:clean(amt)===v?th.accent:th.muted,border:"1px solid "+(clean(amt)===v?th.accent:th.cardBorder)}}>${v}</button>)}</div>
    </div>
    <div style={{fontSize:11.5,color:th.muted,fontStyle:"italic",lineHeight:1.5,margin:"10px 2px 12px"}}>{amountNote(clean(amt),es)}</div>
    {err&&<div style={{fontSize:11,color:th.neg,marginBottom:9}}>{err}</div>}
    <button className="ga-press" onClick={go} disabled={busy} style={{width:"100%",background:"linear-gradient(180deg,#EBD089 0%,#C9A84C 52%,#B58E1C 100%)",color:"#1A1405",border:"none",fontSize:13,fontWeight:700,borderRadius:10,padding:"12px 20px",cursor:busy?"wait":"pointer",fontFamily:"inherit",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.32)"}}>{busy?"…":(es?"Continuar al pago seguro":"Continue to secure checkout")}</button>
    <div style={{fontSize:10,color:th.dim,marginTop:7,textAlign:"center"}}>{es?"Desde $3 al mes — el monto lo eliges tú, el acceso es el mismo.":"From $3 a month — you choose the amount, the access is the same."}</div>
  </div>;
}

const PLAN_IDS=["free","premium","lite","lite-plus","annual"];
const planOf=(client)=>{const p=client&&client.accountPlan;return PLAN_IDS.indexOf(p)>=0?p:"free";};
const hasPremium=(client)=>planOf(client)!=="free";
const planLabel=(plan,es)=>({free:es?"Gratis":"Free",premium:"Premium","lite":"Monthly Lite","lite-plus":"Monthly Lite+","annual":es?"Paquete Anual":"Annual Bundle"})[plan]||plan;

const PremiumCtx=createContext({gated:false});
const usePremiumGate=()=>useContext(PremiumCtx);

const FEATURE_COPY={
  reports:{en:"Full reports are a Premium feature",es:"Los reportes completos son una función Premium"},
  compare:{en:"Month-by-month comparison is a Premium feature",es:"La comparación mes a mes es una función Premium"},
  calculators:{en:"Calculators with YOUR real numbers are a Premium feature",es:"Las calculadoras con TUS números reales son una función Premium"},
  packs:{en:"Additional investment packages are a Premium feature",es:"Los paquetes de inversión adicionales son una función Premium"},
  links:{en:"The resource directory is a Premium feature",es:"El directorio de recursos es una función Premium"},
};

/* Full upsell card — choose-your-price tiers; every tier unlocks everything. */
function PremiumUpgrade({client,onUpdate,lang,feature,compact}){
  const th=useTh();const es=lang==="es";
  const[claiming,setClaiming]=useState(false);const[claimed,setClaimed]=useState(false);
  const ref=(typeof localStorage!=="undefined"&&localStorage.getItem("ga_cache_uid"))||"";
  const tierLink=(tr)=>tr.link+(ref?"?client_reference_id="+encodeURIComponent(ref):"");
  const head=(FEATURE_COPY[feature]||FEATURE_COPY.reports)[es?"es":"en"];
  const activate=async()=>{
    if(claiming||claimed)return;setClaiming(true);
    try{
      onUpdate&&onUpdate({...client,accountPlan:"premium",premiumClaimedAt:new Date().toISOString().slice(0,10)});
      setClaimed(true);
      try{await gaSendSupportEmail({subject:"Premium activation claim — verify against Stripe",message:`Account uid: ${ref||"?"}\nClient: ${((client&&client.firstName)||"")+" "+((client&&client.lastName)||"")}\nEmail: ${(client&&client.email)||"?"}\nClaimed: Premium (choose-your-price)\nCheck the Stripe dashboard for a matching subscription (client_reference_id above). Revoke if none.`});}catch(e){}
    }finally{setClaiming(false);}
  };
  return <div style={{maxWidth:640,margin:compact?"0":"24px auto",padding:compact?"18px 18px 16px":"30px 30px 24px",background:th.card,border:"1px solid "+th.cardBorder,borderRadius:16,textAlign:"center"}}>
    <div style={{width:46,height:46,borderRadius:13,margin:"0 auto 14px",background:th.accent+"14",border:"1px solid "+th.accent+"33",display:"flex",alignItems:"center",justifyContent:"center"}}><Sparkles size={21} strokeWidth={1.7} color={th.accent}/></div>
    <div style={{fontSize:17,fontWeight:700,color:th.text,letterSpacing:"-0.01em",marginBottom:7}}>{head}</div>
    <p style={{fontSize:12.5,color:th.muted,lineHeight:1.6,margin:"0 auto 18px",maxWidth:440}}>
      {es?"Premium es 'paga lo que elijas' — desde $3 al mes. Cada nivel desbloquea TODO: calculadoras con tus números, reportes completos, comparación de meses, paquetes de inversión y el directorio de recursos.":"Premium is choose-what-you-pay — from $3 a month. Every tier unlocks EVERYTHING: calculators with your numbers, full reports, month compare, investment packages, and the resource directory."}
    </p>
    <div style={{marginBottom:14}}>
      <ChooseAmount lang={lang} onFallbackTier={tr=>window.open(tierLink(tr),"_blank","noopener")}/>
    </div>
    {claimed
      ?<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:12.5,fontWeight:700,color:th.pos}}><Check size={15} strokeWidth={2.4}/>{es?"Premium activado. ¡Gracias por apoyar!":"Premium activated. Thank you for the support!"}</div>
      :<button onClick={activate} disabled={claiming} style={{background:"transparent",border:"1px solid "+th.cardBorder,color:th.muted,fontSize:11.5,fontWeight:600,borderRadius:9,padding:"9px 16px",cursor:"pointer",fontFamily:"inherit"}}>{claiming?"…":(es?"Ya me suscribí — activar mi cuenta":"I already subscribed — activate my account")}</button>}
    {!claimed&&<div style={{fontSize:9.5,color:th.dim,marginTop:8,fontStyle:"italic"}}>{es?"Las activaciones se verifican contra los recibos de Stripe.":"Activations are verified against Stripe receipts."}</div>}
  </div>;
}

/* Tiny inline lock chip for option lists (e.g. extra investment packs). */
function PremiumLockNote({lang}){
  const th=useTh();const es=lang==="es";
  return <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 13px",borderRadius:10,background:th.inp,border:"1px dashed "+th.cardBorder,fontSize:11.5,color:th.muted}}>
    <Lock size={13} strokeWidth={1.8} color={th.dim}/>{es?"Disponible con Premium — mira la pestaña Calculadoras para mejorar.":"Available with Premium — see the Calculators tab to upgrade."}
  </div>;
}

export { PremiumCtx, usePremiumGate, planOf, hasPremium, planLabel, PremiumUpgrade, PremiumLockNote, ChooseAmount };
