// UsefulLinksPage — MD-K.1 (v0.76). The master "help in every life situation"
// directory (147 vetted links, 16 categories, fully bilingual — data in
// src/constants/usefulLinks.js, researched 2026-06-11). Premium-gated per the
// owner's gate list; in-app only (not downloadable). Advisors always see it.
import { useState } from "react";
import * as Lucide from "lucide-react";
import { useTh } from "../contexts/theme";
import { mCARD } from "../styles/theme";
import { USEFUL_LINKS } from "../constants/usefulLinks";
import { usePremiumGate, PremiumUpgrade } from "../components/premium";

function UsefulLinksPage({lang,client,onUpdateClient}){
  const th=useTh();const es=lang==="es";const T=(o)=>o?(es?o.es:o.en):"";
  const{gated}=usePremiumGate();
  const[open,setOpen]=useState({});
  const[q,setQ]=useState("");
  if(gated)return<div className="ga-np" style={{padding:24}}><PremiumUpgrade client={client} onUpdate={onUpdateClient} lang={lang} feature="links"/></div>;
  const needle=q.trim().toLowerCase();
  const match=(it)=>!needle||[it.name,T(it.what),T(it.whoFor)].join(" ").toLowerCase().includes(needle);
  const cats=USEFUL_LINKS.map(c=>({...c,hits:c.items.filter(match)})).filter(c=>!needle||c.hits.length);
  const MONO="'JetBrains Mono',monospace";
  return <div className="ga-np" style={{padding:24,maxWidth:980,margin:"0 auto"}}>
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:14,flexWrap:"wrap",marginBottom:18}}>
      <div style={{maxWidth:560}}>
        <div style={{fontSize:12.5,color:th.muted,lineHeight:1.6}}>
          {es?"Ayuda confiable para cada situación de la vida — programas de gobierno, crédito justo, vivienda, impuestos y más. Solo fuentes verificadas.":"Trusted help for every life situation — government programs, fair credit, housing, taxes and more. Verified sources only."}
        </div>
        <div style={{display:"flex",gap:12,marginTop:9,fontSize:10,color:th.dim,fontFamily:MONO}}>
          <span>🇪🇸 = {es?"disponible en español":"available in Spanish"}</span>
          <span>$0 = {es?"gratis":"free"}</span>
        </div>
      </div>
      <input value={q} onChange={e=>setQ(e.target.value)} aria-label={es?"Buscar enlaces útiles":"Search useful links"} placeholder={es?"Buscar… (ej. casa, impuestos, tarjeta)":"Search… (e.g. house, taxes, card)"} style={{padding:"10px 13px",background:th.inp,border:"1px solid "+th.cardBorder,color:th.text,borderRadius:10,fontSize:13,outline:"none",width:260,fontFamily:"inherit"}}/>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {cats.map(c=>{const on=!!open[c.id]||!!needle;const Icon=Lucide[c.icon]||Lucide.Link;const items=needle?c.hits:c.items;return<div key={c.id} style={{...mCARD(th),padding:0,overflow:"hidden"}}>
        <button onClick={()=>setOpen(p=>({...p,[c.id]:!p[c.id]}))} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"14px 17px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
          <span style={{width:34,height:34,borderRadius:10,background:th.accent+"12",border:"1px solid "+th.accent+"26",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon size={16} strokeWidth={1.7} color={th.accent}/></span>
          <span style={{flex:1,minWidth:0}}>
            <span style={{display:"block",fontSize:14,fontWeight:700,color:th.text,letterSpacing:"-0.01em"}}>{T(c.title)}</span>
            <span style={{display:"block",fontSize:11.5,color:th.muted,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{T(c.blurb)}</span>
          </span>
          <span style={{fontSize:10.5,color:th.dim,fontFamily:MONO,flexShrink:0}}>{items.length}</span>
          <Lucide.ChevronDown size={15} strokeWidth={2} color={th.dim} style={{flexShrink:0,transform:on?"rotate(180deg)":"none",transition:"transform .2s cubic-bezier(.23,1,.32,1)"}}/>
        </button>
        {on&&<div style={{padding:"0 17px 15px"}}>
          {(c.tips||[]).length>0&&<div style={{background:th.inp,border:"1px dashed "+th.cardBorder,borderRadius:10,padding:"10px 13px",marginBottom:11}}>
            <div style={{fontSize:9.5,fontWeight:600,color:th.accent,fontFamily:MONO,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:6}}>{es?"Bueno saber":"Good to know"}</div>
            {(c.tips||[]).map((tp,i)=><div key={i} style={{fontSize:11.5,color:th.muted,lineHeight:1.55,marginBottom:4}}>• {T(tp)}</div>)}
          </div>}
          {items.map((it,i)=>it.placeholder
            ?<div key={i} style={{padding:"10px 2px",borderBottom:i<items.length-1?("1px solid "+(th.glassBorder||th.cardBorder)):"none",opacity:0.65}}>
              <span style={{fontSize:12.5,fontWeight:700,color:th.dim}}>{it.name}</span>
              <span style={{fontSize:10,marginLeft:8,color:th.accent,fontFamily:MONO,textTransform:"uppercase",letterSpacing:"0.08em"}}>{es?"Próximamente":"Coming soon"}</span>
            </div>
            :<a key={i} href={it.url} target="_blank" rel="noopener noreferrer" className="ga-press" style={{display:"block",padding:"10px 2px",textDecoration:"none",borderBottom:i<items.length-1?("1px solid "+(th.glassBorder||th.cardBorder)):"none"}}>
              <div style={{display:"flex",alignItems:"baseline",gap:8,flexWrap:"wrap"}}>
                <span style={{fontSize:12.5,fontWeight:700,color:th.text}}>{it.name}</span>
                <span style={{fontSize:10,color:th.dim,fontFamily:MONO}}>{it.free!==false?"$0":"💲"}{it.esSite?" · 🇪🇸":""}</span>
                <Lucide.ExternalLink size={11} strokeWidth={1.8} color={th.dim}/>
              </div>
              <div style={{fontSize:12,color:th.muted,lineHeight:1.55,marginTop:3}}>{T(it.what)}</div>
              <div style={{fontSize:11,color:th.dim,lineHeight:1.5,marginTop:2,fontStyle:"italic"}}>{es?"Para: ":"For: "}{T(it.whoFor)}</div>
            </a>)}
        </div>}
      </div>;})}
    </div>
    <div style={{fontSize:10,color:th.dim,fontStyle:"italic",lineHeight:1.6,marginTop:18,textAlign:"center"}}>
      {es?"Golden Anchor no controla los sitios externos y no recibe pago por listarlos. Verifica siempre los requisitos directamente con cada programa.":"Golden Anchor doesn't control external sites and isn't paid to list them. Always verify requirements directly with each program."}
    </div>
  </div>;
}

export { UsefulLinksPage };
