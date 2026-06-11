// Public (pre-auth) pages — MD-E part 3, v0.75.1. Owner: "we need more websites like
// other professional pages have: about us, contact us and Q&A". One shared shell
// (header nav + footer) wraps About (reusing the in-app AboutPage), Contact, and FAQ.
// Routes: /about-us, /contact, /faq — wired in App's preAuth router.
import { useState } from "react";
import { Mail, Phone, AtSign, Globe, ChevronDown } from "lucide-react";
import { useTh } from "../contexts/theme";
import { GOLD, mCARD } from "../styles/theme";
import { AboutPage } from "./marketing";

function PublicShell({lang,isDark,onToggle,onLangToggle,onNav,onSignIn,active,children}){
  const th=useTh();const es=lang==="es";
  const glow=isDark?"rgba(203,168,90,0.12)":"rgba(184,144,30,0.08)";
  const pill=(on)=>({fontSize:12,fontWeight:on?700:600,padding:"9px 14px",minHeight:40,borderRadius:99,border:"1px solid "+(on?th.accent+"66":th.cardBorder),background:on?th.accent+"14":"transparent",color:on?th.accent:th.muted,cursor:"pointer",fontFamily:"inherit"});
  const links=[["about",es?"Nosotros":"About"],["pricing",es?"Precios":"Pricing"],["faq",es?"Preguntas":"Q&A"],["contact",es?"Contacto":"Contact"]];
  return <div style={{minHeight:"100vh",background:th.bg,color:th.text,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",position:"relative",overflowX:"hidden"}}>
    <div aria-hidden style={{position:"fixed",top:-200,right:60,width:620,height:620,borderRadius:"50%",background:`radial-gradient(circle,${glow},transparent 70%)`,filter:"blur(50px)",pointerEvents:"none",zIndex:0}}/>
    <div style={{position:"relative",zIndex:1}}>
      <header style={{maxWidth:1240,margin:"0 auto",padding:"20px 26px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
        <button onClick={()=>onNav("landing")} style={{display:"flex",alignItems:"center",gap:11,background:"transparent",border:"none",cursor:"pointer",padding:0,textAlign:"left",fontFamily:"inherit"}}>
          <div style={{width:34,height:34,borderRadius:10,background:th.glassBg||th.card,border:"1px solid "+th.cardBorder,display:"flex",alignItems:"center",justifyContent:"center"}}><img src="/anchor-monogram.svg" alt="" style={{width:20,height:20}}/></div>
          <div>
            <div style={{fontWeight:700,fontSize:15,letterSpacing:"-0.01em",color:th.text,lineHeight:1}}>Golden Anchor</div>
            <div style={{fontSize:8,color:th.dim,marginTop:3,fontWeight:500,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:"0.14em"}}>{es?"Asesoría Financiera":"Financial Advisory"}</div>
          </div>
        </button>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          {links.map(([id,l])=><button key={id} onClick={()=>onNav(id)} style={pill(active===id)}>{l}</button>)}
          <button onClick={onLangToggle} style={pill(false)}>{es?"EN":"ES"}</button>
          <button onClick={onToggle} style={pill(false)}>{isDark?(es?"Claro":"Light"):(es?"Oscuro":"Dark")}</button>
          <button className="ga-press" onClick={onSignIn} style={{fontSize:12.5,fontWeight:700,padding:"10px 18px",borderRadius:99,background:"linear-gradient(180deg,#EBD089 0%,#C9A84C 52%,#B58E1C 100%)",color:"#16120A",border:"none",cursor:"pointer",fontFamily:"inherit",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.32)"}}>{es?"Iniciar sesión":"Sign in"}</button>
        </div>
      </header>
      <div style={{paddingBottom:40}}>{children}</div>
      <footer style={{maxWidth:1240,margin:"0 auto",padding:"18px 26px 32px",borderTop:"1px solid "+th.cardBorder,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:14}}>
        <div style={{fontSize:11,color:th.dim,lineHeight:1.6,maxWidth:620}}>© Golden Anchor · {es?"Asesoría financiera educativa — no constituye asesoría de inversión, fiscal o legal.":"Educational financial coaching — not investment, tax, or legal advice."}</div>
        <div style={{display:"flex",gap:14,fontSize:9.5,fontWeight:500,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:"0.13em"}}>
          {links.map(([id,l])=><button key={id} onClick={()=>onNav(id)} style={{background:"none",border:"none",cursor:"pointer",color:th.muted,fontFamily:"inherit",fontSize:"inherit",letterSpacing:"inherit",textTransform:"inherit",padding:0}}>{l}</button>)}
        </div>
      </footer>
    </div>
  </div>;
}

const PUB_FAQ=[
  {q:{en:"What is Golden Anchor?",es:"¿Qué es Golden Anchor?"},a:{en:"A bilingual financial-coaching platform. You get one dashboard for your income, bills, debt, and savings — plus optional human advisors who explain your numbers and help you build a plan. We teach and coach; we never manage your money or sell investments.",es:"Una plataforma bilingüe de coaching financiero. Tienes un tablero para tus ingresos, gastos, deudas y ahorros — más asesores humanos opcionales que explican tus números y te ayudan a armar un plan. Enseñamos y acompañamos; nunca manejamos tu dinero ni vendemos inversiones."}},
  {q:{en:"Is it really free?",es:"¿De verdad es gratis?"},a:{en:"Yes. A free account includes your financial profile, the public calculators, and our resources. Premium (you choose what you pay, from $3/month) unlocks calculators with your real numbers, full reports, month-over-month comparison, and more.",es:"Sí. La cuenta gratis incluye tu perfil financiero, las calculadoras públicas y nuestros recursos. Premium (pagas lo que elijas, desde $3 al mes) desbloquea calculadoras con tus números reales, reportes completos, comparación mes a mes, y más."}},
  {q:{en:"Do I need an advisor to use the app?",es:"¿Necesito un asesor para usar la app?"},a:{en:"No — the app works fully on its own. Advisors are there when you want one: a free insurance consult, a one-time checkup, or ongoing monthly coaching. Best of both worlds.",es:"No — la app funciona completa por sí sola. Los asesores están cuando los quieras: una consulta de seguros gratis, un chequeo único, o acompañamiento mensual. Lo mejor de ambos mundos."}},
  {q:{en:"Is everything available in Spanish?",es:"¿Todo está disponible en español?"},a:{en:"Yes — the app, the reports, and the advisors. Toggle EN/ES anytime, top right.",es:"Sí — la app, los reportes y los asesores. Cambia EN/ES cuando quieras, arriba a la derecha."}},
  {q:{en:"Is my information safe?",es:"¿Mi información está segura?"},a:{en:"Your data is encrypted, stored per-account with strict access rules, and never sold. Sensitive fields are stripped from anything you share. You can export or delete your data anytime.",es:"Tus datos van cifrados, se guardan por cuenta con reglas estrictas de acceso y nunca se venden. Los campos sensibles se eliminan de todo lo que compartes. Puedes exportar o borrar tus datos cuando quieras."}},
  {q:{en:"How does the free insurance consultation work?",es:"¿Cómo funciona la consulta de seguros gratis?"},a:{en:"A licensed advisor (FL Life & Health) reviews your health, life, and supplemental insurance options. The first consult is free — if you choose a policy, the insurance carrier pays the commission, not you.",es:"Un asesor con licencia (Vida y Salud de FL) revisa tus opciones de seguro de salud, vida y suplementario. La primera consulta es gratis — si eliges una póliza, la comisión la paga la aseguradora, no tú."}},
  {q:{en:"Can I cancel anytime?",es:"¿Puedo cancelar cuando quiera?"},a:{en:"Yes. Memberships are month to month with no contracts. Cancel and you keep your free account and all your data.",es:"Sí. Las membresías son mes a mes, sin contratos. Si cancelas, conservas tu cuenta gratis y todos tus datos."}},
  {q:{en:"Is this investment advice?",es:"¿Esto es asesoría de inversiones?"},a:{en:"No. Golden Anchor provides financial education and coaching only — we don't recommend securities, manage assets, or act as a fiduciary. For investment, tax, or legal decisions, consult the corresponding licensed professional.",es:"No. Golden Anchor ofrece solo educación y coaching financiero — no recomendamos valores, no administramos activos, ni actuamos como fiduciarios. Para decisiones de inversión, impuestos o legales, consulta al profesional licenciado correspondiente."}},
];

function PublicFaqPage({lang}){
  const th=useTh();const es=lang==="es";
  const[open,setOpen]=useState(0);
  return <div style={{maxWidth:760,margin:"0 auto",padding:"28px 24px 10px"}}>
    <div style={{textAlign:"center",marginBottom:28}}>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,letterSpacing:"0.18em",textTransform:"uppercase",color:th.dim,marginBottom:10}}>Q&A</div>
      <h1 style={{fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",fontWeight:500,fontSize:32,color:th.text,margin:0,lineHeight:1.1}}>{es?"Preguntas frecuentes":"Common questions"}</h1>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {PUB_FAQ.map((f,i)=>{const on=open===i;return<div key={i} className={on?undefined:"ga-lift"} style={{...mCARD(th),padding:0,overflow:"hidden"}}>
        <button onClick={()=>setOpen(on?-1:i)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"15px 18px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
          <span style={{fontSize:14,fontWeight:700,color:th.text,letterSpacing:"-0.01em"}}>{es?f.q.es:f.q.en}</span>
          <ChevronDown size={16} strokeWidth={2} color={th.dim} style={{flexShrink:0,transform:on?"rotate(180deg)":"none",transition:"transform .2s cubic-bezier(.23,1,.32,1)"}}/>
        </button>
        {on&&<div style={{padding:"0 18px 16px",fontSize:13,color:th.muted,lineHeight:1.7}}>{es?f.a.es:f.a.en}</div>}
      </div>;})}
    </div>
  </div>;
}

function PublicContactPage({lang,settings}){
  const th=useTh();const es=lang==="es";
  const email=(settings&&settings.advisorEmail)||"mauricio@goldenanchor.life";
  const phone=(settings&&settings.advisorPhone)||"";
  const ig=(settings&&settings.ig)||"golden_anchor_inc";
  const site=((settings&&settings.websiteUrl)||"https://goldenanchor.life").trim();
  const rows=[
    {Icon:Mail,label:es?"Correo":"Email",val:email,href:"mailto:"+email},
    {Icon:AtSign,label:"Instagram",val:"@"+ig,href:"https://instagram.com/"+ig},
    {Icon:Globe,label:es?"Sitio":"Website",val:site.replace(/^https?:\/\//,""),href:site.startsWith("http")?site:"https://"+site},
    ...(phone?[{Icon:Phone,label:es?"Teléfono":"Phone",val:phone,href:"tel:"+phone.replace(/[^0-9+]/g,"")}]:[]),
  ];
  return <div style={{maxWidth:560,margin:"0 auto",padding:"28px 24px 10px"}}>
    <div style={{textAlign:"center",marginBottom:26}}>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,letterSpacing:"0.18em",textTransform:"uppercase",color:th.dim,marginBottom:10}}>{es?"Contacto":"Contact"}</div>
      <h1 style={{fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",fontWeight:500,fontSize:32,color:th.text,margin:"0 0 10px",lineHeight:1.1}}>{es?"Hablemos.":"Let's talk."}</h1>
      <p style={{fontSize:13.5,color:th.muted,lineHeight:1.65,margin:"0 auto",maxWidth:420}}>{es?"¿Preguntas, o listo para empezar? Escríbenos — respondemos en uno o dos días hábiles, en inglés o español.":"Questions, or ready to start? Reach out — we reply within a business day or two, in English or Spanish."}</p>
    </div>
    <div style={{...mCARD(th),padding:"6px 18px"}}>
      {rows.map((r,i)=><a key={i} href={r.href} target={r.href.startsWith("http")?"_blank":"_self"} rel="noreferrer" className="ga-press" style={{display:"flex",alignItems:"center",gap:13,padding:"14px 2px",textDecoration:"none",borderBottom:i<rows.length-1?("1px solid "+(th.glassBorder||th.cardBorder)):"none"}}>
        <span style={{width:34,height:34,borderRadius:10,background:th.accent+"12",border:"1px solid "+th.accent+"26",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><r.Icon size={15} strokeWidth={1.7} color={th.accent}/></span>
        <span style={{fontSize:10,color:th.dim,fontWeight:500,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:"0.1em",width:84,flexShrink:0}}>{r.label}</span>
        <span style={{fontSize:13.5,color:th.text,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.val}</span>
      </a>)}
    </div>
    <div style={{fontSize:11.5,color:th.dim,textAlign:"center",marginTop:16,lineHeight:1.6}}>{es?"La primera consulta de seguros siempre es gratis.":"The first insurance consult is always free."}</div>
  </div>;
}

function PublicAboutPage({t,lang,settings,isDark}){
  return <AboutPage t={t} lang={lang} settings={settings} isDark={isDark}/>;
}

export { PublicShell, PublicFaqPage, PublicContactPage, PublicAboutPage, PUB_FAQ };
