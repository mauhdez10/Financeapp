import { useState, useEffect, useCallback, useRef, useMemo, createContext, useContext, Fragment } from "react";
import { Bar, XAxis, YAxis, Tooltip as ReTip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, LabelList, AreaChart, Area, CartesianGrid, ComposedChart, Line, Legend } from "recharts";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import { T } from "./translations";
import { ENGAGEMENT_LETTER, ELT_DEFAULTS, fillTokens } from "./engagementLetterTemplate";

/* ── SUPABASE CLIENT ─────────────────────────────────────────────────────── */
const SUPABASE_URL=(typeof import.meta!=="undefined"&&import.meta.env?import.meta.env.VITE_SUPABASE_URL:"")||"";
const SUPABASE_ANON_KEY=(typeof import.meta!=="undefined"&&import.meta.env?import.meta.env.VITE_SUPABASE_ANON_KEY:"")||"";
const supabase=(SUPABASE_URL&&SUPABASE_ANON_KEY)?createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}}):null;
async function gaLoadClients(userId){if(!supabase||!userId)return null;const{data,error}=await supabase.from("clients").select("data").eq("user_id",userId).is("deleted_at",null);if(error){console.error("[GA] load clients error",error);return null;}const _rows=(data||[]).map(r=>r.data);const _seen=new Set();const _out=[];for(const _c of _rows){const _k=_c&&_c.id;if(_k==null){_out.push(_c);continue;}if(_seen.has(_k))continue;_seen.add(_k);_out.push(_c);}return _out;}
async function gaSaveClient(userId,clientObj){if(!supabase||!userId||!clientObj?.id)return false;const localId=String(clientObj.id);const _fail=()=>{if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("ga-save-failed",{detail:{which:"client"}}));return false;};try{let existingId=null;const{data:byLocal,error:e1}=await supabase.from("clients").select("id").eq("user_id",userId).eq("local_id",localId).is("deleted_at",null).limit(1);if(e1){console.error("[GA] find client error (local_id)",e1);return _fail();}if(byLocal&&byLocal[0])existingId=byLocal[0].id;else{const{data:byBlob,error:e2}=await supabase.from("clients").select("id").eq("user_id",userId).eq("data->>id",localId).is("deleted_at",null).limit(1);if(e2){console.error("[GA] find client error (blob id)",e2);return _fail();}if(byBlob&&byBlob[0])existingId=byBlob[0].id;}const payload={user_id:userId,local_id:localId,data:clientObj};const{error}=existingId?await supabase.from("clients").update(payload).eq("id",existingId).eq("user_id",userId):await supabase.from("clients").insert(payload);if(error){console.error("[GA] save client error",error);return _fail();}return true;}catch(e){console.error("[GA] save client exception",e);return _fail();}}
async function gaDeleteClient(userId,clientId){if(!supabase||!userId||!clientId)return;const cid=String(clientId);const stamp={deleted_at:new Date().toISOString()};const r1=await supabase.from("clients").update(stamp).eq("user_id",userId).is("deleted_at",null).eq("local_id",cid);if(r1.error)console.error("[GA] delete client error (local_id)",r1.error);const r2=await supabase.from("clients").update(stamp).eq("user_id",userId).is("deleted_at",null).eq("data->>id",cid);if(r2.error)console.error("[GA] delete client error (blob id)",r2.error);}
async function gaLoadSettings(userId){if(!supabase||!userId)return null;const{data,error}=await supabase.from("settings").select("data").eq("user_id",userId).maybeSingle();if(error){console.error("[GA] load settings error",error);return null;}return data?.data||null;}
async function gaSaveSettings(userId,settingsObj){if(!supabase||!userId)return;const{error}=await supabase.from("settings").upsert({user_id:userId,data:settingsObj},{onConflict:"user_id"});if(error){console.error("[GA] save settings error",error);if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("ga-save-failed",{detail:{which:"settings"}}));}}
async function gaLoadIntakeSubmissions(advisorId){if(!supabase||!advisorId)return[];try{const{data,error}=await supabase.from("intake_submissions").select("*").eq("advisor_id",advisorId).order("created_at",{ascending:false}).limit(200);if(error){console.error("[GA] load intake subs error",error);return[];}return data||[];}catch(e){console.error("[GA] load intake subs exception",e);return[];}}
async function gaSubmitIntake(advisorId,lang,formData){if(!supabase||!advisorId)return{ok:false,error:"no-supabase"};try{const token="tok_"+Math.random().toString(36).slice(2,14)+Date.now().toString(36);const payload={advisor_id:advisorId,submission_token:token,lang:lang||"en",status:"pending",data:formData,user_agent:typeof navigator!=="undefined"?String(navigator.userAgent||"").slice(0,200):""};const{data,error}=await supabase.from("intake_submissions").insert(payload).select("id").single();if(error){console.error("[GA] intake submit error",error);return{ok:false,error:error.message};}return{ok:true,token,submissionId:data&&data.id};}catch(e){console.error("[GA] intake submit exception",e);return{ok:false,error:String(e&&e.message||e)};}}
async function gaUpdateIntakeStatus(id,patch){if(!supabase||!id)return false;try{const{error}=await supabase.from("intake_submissions").update(patch).eq("id",id);if(error){console.error("[GA] intake update error",error);return false;}return true;}catch(e){console.error("[GA] intake update exception",e);return false;}}
async function gaUpdateIntakeData(id,data){if(!supabase||!id)return false;try{const{error}=await supabase.from("intake_submissions").update({data}).eq("id",id);if(error){console.error("[GA] intake data update error",error);return false;}return true;}catch(e){console.error("[GA] intake data update exception",e);return false;}}
async function gaDeleteIntakeSubmission(id){if(!supabase||!id)return false;try{const{error}=await supabase.from("intake_submissions").delete().eq("id",id);if(error){console.error("[GA] intake delete error",error);return false;}return true;}catch(e){console.error("[GA] intake delete exception",e);return false;}}
async function gaDeleteIntakeSubmissionsByStatus(advisorId,status){if(!supabase||!advisorId||!status)return 0;try{const{data,error}=await supabase.from("intake_submissions").delete().eq("advisor_id",advisorId).eq("status",status).select("id");if(error){console.error("[GA] intake bulk delete error",error);return 0;}return (data||[]).length;}catch(e){console.error("[GA] intake bulk delete exception",e);return 0;}}
async function gaLoadIntakeInvites(userId){if(!supabase||!userId)return[];try{const{data,error}=await supabase.from("intake_invites").select("*").eq("user_id",userId).order("created_at",{ascending:false}).limit(200);if(error){console.error("[GA] load invites error",error);return[];}return data||[];}catch(e){console.error("[GA] load invites exception",e);return[];}}
async function gaDeleteIntakeInvite(id){if(!supabase||!id)return false;try{const{error}=await supabase.from("intake_invites").delete().eq("id",id);if(error){console.error("[GA] delete invite error",error);return false;}return true;}catch(e){console.error("[GA] delete invite exception",e);return false;}}
async function gaDeleteAllIntakeInvites(userId){if(!supabase||!userId)return false;try{const{error}=await supabase.from("intake_invites").delete().eq("user_id",userId);if(error){console.error("[GA] clear invites error",error);return false;}return true;}catch(e){console.error("[GA] clear invites exception",e);return false;}}
async function gaSendIntakeInvite(payload){if(!supabase)return{ok:false,error:"no-supabase"};try{const{data:sess}=await supabase.auth.getSession();const jwt=sess?.session?.access_token;if(!jwt)return{ok:false,error:"Not signed in. Please log out and back in."};const r=await fetch("/api/send-intake-invite",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+jwt},body:JSON.stringify(payload)});const j=await r.json().catch(()=>({}));if(!r.ok||j.ok===false)return{ok:false,error:j.error||("HTTP "+r.status),detail:j};return{ok:true,...j};}catch(e){console.error("[GA] send invite exception",e);return{ok:false,error:String(e&&e.message||e)};}}
async function gaSendSupportEmail(payload){if(!supabase)return{ok:false,error:"no-supabase"};try{const{data:sess}=await supabase.auth.getSession();const jwt=sess?.session?.access_token;if(!jwt)return{ok:false,error:"Not signed in. Please log out and back in."};const r=await fetch("/api/send-support-email",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+jwt},body:JSON.stringify(payload)});const j=await r.json().catch(()=>({}));if(!r.ok||j.ok===false)return{ok:false,error:j.error||("HTTP "+r.status),detail:j};return{ok:true,...j};}catch(e){console.error("[GA] send support exception",e);return{ok:false,error:String(e&&e.message||e)};}}
async function gaResolveIntakeInvite(token){try{const r=await fetch("/api/resolve-intake-invite",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})});const j=await r.json().catch(()=>({}));if(!r.ok||j.ok===false)return{ok:false,error:j.error||("HTTP "+r.status)};return{ok:true,...j};}catch(e){console.error("[GA] resolve invite exception",e);return{ok:false,error:String(e&&e.message||e)};}}
async function gaMarkIntakeInviteSubmitted(token,submissionId){try{await fetch("/api/mark-intake-invite-submitted",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,submissionId})});}catch(e){console.error("[GA] mark invite submitted exception",e);}}
async function gaEmailCompleteReport(payload){if(!supabase)return{ok:false,error:"no-supabase"};try{const{data:sess}=await supabase.auth.getSession();const jwt=sess?.session?.access_token;if(!jwt)return{ok:false,error:"Not signed in. Please log out and back in."};const r=await fetch("/api/render-report-pdf",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+jwt},body:JSON.stringify(payload)});const j=await r.json().catch(()=>({}));if(!r.ok||j.ok===false)return{ok:false,error:j.error||("HTTP "+r.status),detail:j};return{ok:true,...j};}catch(e){console.error("[GA] email report exception",e);return{ok:false,error:String(e&&e.message||e)};}}
async function gaMigrateLocalStorage(userId){if(!supabase||!userId)return false;if(localStorage.getItem("ga_migrated_to_supabase")==="1")return false;try{const lsClients=localStorage.getItem("ga_v3");const lsSettings=localStorage.getItem("ga_settings");const existing=await gaLoadClients(userId);if((existing||[]).length>0){localStorage.setItem("ga_migrated_to_supabase","1");return false;}let allOk=true;let savedCount=0;let totalCount=0;if(lsClients){const arr=JSON.parse(lsClients);if(Array.isArray(arr)&&arr.length>0){totalCount=arr.length;for(const c of arr){const ok=await gaSaveClient(userId,c);if(ok)savedCount++;else allOk=false;}}}if(lsSettings){try{const s=JSON.parse(lsSettings);await gaSaveSettings(userId,s);}catch(se){console.error("[GA] settings migrate error",se);}}if(allOk&&totalCount===savedCount){localStorage.setItem("ga_migrated_to_supabase","1");console.log(`[GA] migration complete: ${savedCount}/${totalCount} clients migrated`);return true;}else{console.error(`[GA] migration incomplete: ${savedCount}/${totalCount} clients saved — flag NOT set, will retry next login`);return false;}}catch(e){console.error("[GA] migration error",e);return false;}}


/* ── THEMES ─────────────────────────────────────────────────────────────── */
const GOLD="#C9A84C";
// v0.26.0 — bumped muted/dim/sideMuted on dark mode to pass WCAG AA contrast (4.5:1+ on dark navy bg). Was #9CA3AF/#6B7280.
const makeDark=(a=GOLD)=>({bg:"#111827",nav:"#1F2937",navBorder:"#374151",card:"#1F2937",cardBorder:"#374151",modal:"#1E293B",inp:"#111827",inpBorder:"#4B5563",text:"#F1F5F9",muted:"#B3C0D1",dim:"#94A3B8",sideText:"#F1F5F9",sideMuted:"#B3C0D1",accent:a,pos:"#10B981",neg:"#EF4444",warn:"#F59E0B",blue:"#3B82F6"});
const makeLight=(a="#2563EB")=>({bg:"#F1F5F9",nav:"#1C3557",navBorder:"#2A4A73",card:"#FFFFFF",cardBorder:"#E2E8F0",modal:"#FFFFFF",inp:"#FFFFFF",inpBorder:"#CBD5E1",text:"#0F172A",muted:"#475569",dim:"#94A3B8",sideText:"#E2E8F0",sideMuted:"#94A3B8",accent:a,pos:"#059669",neg:"#DC2626",warn:"#D97706",blue:"#2563EB"});
const DARK_ACCENTS=[{l:"Gold",v:"#C9A84C"},{l:"Blue",v:"#3B82F6"},{l:"Emerald",v:"#10B981"},{l:"Purple",v:"#8B5CF6"}];
const LIGHT_ACCENTS=[{l:"Blue",v:"#2563EB"},{l:"Teal",v:"#0D9488"},{l:"Emerald",v:"#059669"},{l:"Purple",v:"#7C3AED"}];
// v0.8.1 — background/card shade presets for the Appearance settings
const LIGHT_BG_PRESETS=["#FFFFFF","#F1F5F9","#ECEFF3","#E6EBF0","#EDEAE3"];const LIGHT_CARD_PRESETS=["#FFFFFF","#FBFCFD","#F6F8FA"];const DARK_BG_PRESETS=["#0B0F17","#111827","#0D1117","#161B22","#15171C"];const DARK_CARD_PRESETS=["#1F2937","#1E293B","#252B36","#21262D"];
const ThemeCtx=createContext(makeDark());
const useTh=()=>useContext(ThemeCtx);
const HideCtx=createContext({hide:false});
const useHN=()=>useContext(HideCtx);
const FH=({v,c:client,forcePts})=>{const{hide}=useHN();return hide||(client?.hideNumbers)?<span style={{letterSpacing:"0.1em",color:"inherit",filter:"blur(4px)",userSelect:"none"}}>{"●●●●"}</span>:<>{v}</>;};
/* helper: wrap fmt with hide */
const DEF_SETTINGS={baseFontSize:14,appZoom:1,ig:"golden_anchor_inc",advisorName:"Mauricio Hernandez",advisorEmail:"mauricio@goldenanchor.life",noContactDays:30,darkAccent:GOLD,lightAccent:"#2563EB",darkBg:"#111827",darkCard:"#1F2937",lightBg:"#F1F5F9",lightCard:"#FFFFFF",hideNumbers:false,lang:"en",isDark:true,reminderAdvisor:{noContact:true,highDebt:true,promoExpiring:true,debtIncreasing:false},stripeLinks:{"initial-checkup":"https://buy.stripe.com/fZu3cw5NUaLF9ZW81NfrW04","client-checkup":"https://buy.stripe.com/fZu4gAfou4nh1tq6XJfrW03","quarterly-review":"https://buy.stripe.com/cNieVe6RY7ztdc86XJfrW05","strategy-session":"https://buy.stripe.com/14A9AU1xE2f98VSgyjfrW02","monthly-lite":"https://buy.stripe.com/9B68wQ9062f91tq95RfrW00","monthly-lite-plus":"https://buy.stripe.com/eVq3cw1xEg5Z8VS3LxfrW07","annual-bundle":"https://buy.stripe.com/aFa00kekqg5Z7ROa9VfrW01","insurance-consult":"","donation":"https://buy.stripe.com/14A7sMgsyg5ZgokeqbfrW06"},lastBackupVerified:null};

/* ── STYLES ─────────────────────────────────────────────────────────────── */
const mINP=th=>({background:th.inp,border:`1px solid ${th.inpBorder}`,color:th.text,borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",width:"100%",boxSizing:"border-box"});
const mCARD=th=>({background:th.card,border:`1px solid ${th.cardBorder}`,borderRadius:12,breakInside:"avoid",pageBreakInside:"avoid",WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"});
const mTH=th=>({fontSize:11,fontWeight:700,color:th.muted,padding:"0 6px 8px 0",textAlign:"left",whiteSpace:"nowrap",userSelect:"none",cursor:"pointer"});
const mTHR=th=>({...mTH(th),textAlign:"right",padding:"0 0 8px 6px"});
const mTD=th=>({fontSize:12,padding:"7px 6px 7px 0",borderTop:`1px solid ${th.cardBorder}`,color:th.text,verticalAlign:"middle"});
const mTDR=th=>({...mTD(th),textAlign:"right",padding:"7px 0 7px 6px"});
const mIIN=th=>({background:th.bg,border:`1px solid ${th.inpBorder}44`,color:th.text,borderRadius:6,padding:"4px 7px",fontSize:12,outline:"none",width:"100%"});

/* ── META ─────────────────────────────────────────────────────────────────── */
const ACCT_META={checking:{l:"Checking",icon:"🏦",c:"#3B82F6",liquid:true},savings:{l:"Savings",icon:"💵",c:"#06B6D4",liquid:true},money_market:{l:"Money Market",icon:"💰",c:"#14B8A6",liquid:true},retirement:{l:"Retirement / 401k",icon:"🎯",c:"#8B5CF6",invest:true},ira:{l:"IRA",icon:"📊",c:"#7C3AED",invest:true},brokerage:{l:"Brokerage / Investment",icon:"📈",c:"#10B981",invest:true},other:{l:"Other",icon:"💼",c:"#94A3B8"}};
const LOAN_META={vehicle:{l:"Vehicle Loan",icon:"🚗",c:"#F97316"},student:{l:"Student Loan",icon:"🎓",c:"#3B82F6"},personal:{l:"Personal Loan",icon:"💼",c:"#8B5CF6"},mortgage:{l:"Mortgage",icon:"🏠",c:"#059669"},business:{l:"Business Loan",icon:"🏢",c:"#06B6D4"},other:{l:"Other Loan",icon:"💰",c:"#94A3B8"}};
const ACCA=Object.keys(ACCT_META);
const LOKA=Object.keys(LOAN_META);
const CP=["#4472C4","#ED7D31","#FFC000","#70AD47","#FF0000","#5B9BD5","#C00000","#9DC3E6","#F4B942","#A9D18E","#8E44AD","#2ECC71","#E74C3C","#3498DB","#1ABC9C","#E91E63","#00BCD4","#FF5722","#C9A84C","#607D8B"];
const PC=["#3B82F6","#10B981","#F59E0B","#8B5CF6","#06B6D4","#F97316","#84CC16","#E11D48"];
// v0.29.0 — `payUrl` is the new canonical field for service checkout links.
// Defaults are empty per service; advisor configures via Settings → Services & Stripe Links.
// Existing data: settings.stripeLinks[id] still works via the svcPayUrl() helper.
// Free services (insurance-consult) keep payUrl empty by design — "Pay now" disables.
const SVCS=[{id:"initial-checkup",icon:"🩺",en:"Initial Financial Checkup",es:"Chequeo Financiero Inicial",price:"$149",payUrl:"",desc:"Full snapshot review of your income, debts, savings, and financial goals.",descEs:"Revisión completa de ingresos, deudas, ahorros y metas financieras."},{id:"client-checkup",icon:"🔁",en:"Financial Checkup — Golden Anchor Client",es:"Chequeo Financiero — Cliente Golden Anchor",price:"$99",payUrl:"",desc:"Returning-client snapshot review. Tracks progress against previous plan.",descEs:"Revisión para clientes existentes. Compara contra el plan anterior."},{id:"quarterly-review",icon:"📊",en:"Quarterly Financial Review",es:"Revisión Financiera Trimestral",price:"$199",payUrl:"",desc:"Deeper quarterly review of cash flow, debt strategy, and goal progress.",descEs:"Revisión trimestral de flujo de caja, deudas y progreso de metas."},{id:"strategy-session",icon:"🎯",en:"Strategy Session: Home / Job / Budget",es:"Sesión Estratégica: Hogar / Trabajo / Presupuesto",price:"$129",payUrl:"",desc:"Targeted session for one major decision: a home purchase, a job change, or a budget reset.",descEs:"Sesión enfocada en una decisión clave: compra de casa, cambio de trabajo, o reinicio de presupuesto."},{id:"monthly-lite",icon:"💎",en:"Monthly Lite Financial Support",es:"Soporte Financiero Mensual Lite",price:"$49/mo",payUrl:"",desc:"Ongoing monthly support: brief check-ins, message-based Q&A, and accountability.",descEs:"Soporte mensual continuo: chequeos breves, preguntas por mensaje, y acompañamiento."},{id:"monthly-lite-plus",icon:"💎",en:"Monthly Lite Financial Support and 1 more",es:"Soporte Financiero Mensual Lite y 1 más",price:"$79/mo",payUrl:"",desc:"Lite support plus one Strategy Session add-on per month.",descEs:"Soporte Lite más una Sesión Estratégica adicional al mes."},{id:"annual-bundle",icon:"🏆",en:"Annual Financial Bundle",es:"Paquete Financiero Anual",price:"$499/yr",payUrl:"",desc:"Annual package: 4 quarterly reviews plus priority strategy sessions and a year-end report.",descEs:"Paquete anual: 4 revisiones trimestrales, sesiones estratégicas prioritarias, e informe de fin de año."},{id:"insurance-consult",icon:"🛡️",en:"Insurance Advisory (Free Consult)",es:"Asesoría de Seguros (Consulta Gratis)",price:"Free",payUrl:"",desc:"Life, health, and supplemental insurance review. Free first consult — commission-paid by carrier if you bind.",descEs:"Revisión de seguros de vida, salud, y suplementarios. Primera consulta gratis — comisión pagada por la aseguradora si contrata."},{id:"donation",icon:"💚",en:"Donation",es:"Donación",price:"Any amount",payUrl:"",desc:"Support Golden Anchor — donations are not financial services and do not establish an advisory relationship.",descEs:"Apoya Golden Anchor — las donaciones no son servicios financieros y no establecen una relación de asesoría."}];
// v0.29.0 — Read payUrl with fallback chain. Stored-in-settings (stripeLinks[id])
// wins over catalog defaults so the advisor can configure links without code changes.
// Free services (price === "Free") never return a payUrl — "Pay now" should disable.
const svcPayUrl=(svc,settings)=>{if(!svc||svc.price==="Free")return "";return settings?.stripeLinks?.[svc.id]||svc.payUrl||svc.stripeUrl||"";};
const RATIOS_META={currentRatio:{en:"Liquid Assets ÷ Current Liabilities. Target > 1.0x",es:"Activos Líquidos ÷ Pasivos. Meta > 1.0x",threshold:1.0,better:"higher",fmt:v=>ratFmt("currentRatio",v),key:"currentRatio"},dta:{en:"Total Liabilities ÷ Total Assets. Below 40%.",es:"Pasivos ÷ Activos. Menos del 40%.",threshold:0.40,better:"lower",fmt:v=>ratFmt("dta",v),key:"dta"},dsr:{en:"Debt Payments ÷ Net Income. Below 36%.",es:"Pagos Deuda ÷ Ingreso. Menos del 36%.",threshold:0.36,better:"lower",fmt:v=>ratFmt("dsr",v),key:"dsr"},rsr:{en:"Retirement Contributions ÷ Gross Income. Target 12-15%.",es:"Contribuciones Retiro ÷ Ingreso. Meta 12-15%.",threshold:0.12,better:"higher",fmt:v=>ratFmt("rsr",v),key:"rsr"},efr:{en:"Liquid Assets ÷ Monthly Bills. Target 3-6 months.",es:"Activos Líquidos ÷ Gastos. Meta 3-6 meses.",threshold:3,better:"higher",fmt:v=>ratFmt("efr",v),key:"efr"}};
const DEF_PORT_RATES={conservative:5.5,growth:8.5,aggressive:11.0};
const TICKER_META={
  FXAIX:{name:"Fidelity 500 Index",desc:"Tracks S&P 500 — broad U.S. large-cap core holding.",cat:"US Large Cap"},
  VOO:{name:"Vanguard S&P 500 ETF",desc:"Tracks S&P 500 — broad U.S. large-cap core holding.",cat:"US Large Cap"},
  FXNAX:{name:"Fidelity US Bond Index",desc:"Total U.S. investment-grade bond market — stability & income.",cat:"Bonds"},
  VBTLX:{name:"Vanguard Total Bond",desc:"Total U.S. investment-grade bond market — stability & income.",cat:"Bonds"},
  FSPSX:{name:"Fidelity International Index",desc:"Developed-market ex-US equities — global diversification.",cat:"International"},
  VEA:{name:"Vanguard FTSE Developed Markets",desc:"Developed-market ex-US equities — global diversification.",cat:"International"},
  FSMAX:{name:"Fidelity Extended Market",desc:"U.S. mid- and small-cap equities — higher growth potential.",cat:"US Mid/Small Cap"},
  VXF:{name:"Vanguard Extended Market ETF",desc:"U.S. mid- and small-cap equities — higher growth potential.",cat:"US Mid/Small Cap"},
  VGT:{name:"Vanguard Information Tech ETF",desc:"Concentrated U.S. technology sector exposure — higher volatility.",cat:"Sector"},
  FTEC:{name:"Fidelity MSCI Tech Index",desc:"Concentrated U.S. technology sector exposure — higher volatility.",cat:"Sector"},
  SPAXX:{name:"Fidelity Government MMF",desc:"Money market fund — liquid cash position for stability.",cat:"Cash"},
  VMFXX:{name:"Vanguard Federal Money Market",desc:"Money market fund — liquid cash position for stability.",cat:"Cash"}
};
const PORTFOLIOS={conservative:{nameKey:"conservative",risk:"Low",color:"#10B981",holdings:[{ticker:"FXAIX",alt:"VOO",pct:30},{ticker:"FXNAX",alt:"VBTLX",pct:40},{ticker:"FSPSX",alt:"VEA",pct:15},{ticker:"SPAXX",alt:"VMFXX",pct:15}]},growth:{nameKey:"growth",risk:"Medium",color:"#3B82F6",holdings:[{ticker:"FXAIX",alt:"VOO",pct:50},{ticker:"FSMAX",alt:"VXF",pct:15},{ticker:"FSPSX",alt:"VEA",pct:15},{ticker:"FXNAX",alt:"VBTLX",pct:20}]},aggressive:{nameKey:"aggressive",risk:"High",color:"#F59E0B",holdings:[{ticker:"FXAIX",alt:"VOO",pct:40},{ticker:"FSMAX",alt:"VXF",pct:20},{ticker:"VGT",alt:"FTEC",pct:25},{ticker:"FSPSX",alt:"VEA",pct:15}]}};
const ALT_PACKS=[{id:"tech",label:"📱 Tech",stocks:[{ticker:"NVDA",alt:"SMH",name:"NVIDIA",pct:10,desc:"AI/GPU leader."},{ticker:"AAPL",alt:"QQQ",name:"Apple",pct:10,desc:"Mega-cap tech."},{ticker:"MSFT",alt:"IGV",name:"Microsoft",pct:10,desc:"Cloud + AI."}]},{id:"bonds",label:"🏦 Bonds",stocks:[{ticker:"BND",alt:"AGG",name:"Total Bond Market",pct:10,desc:"Investment grade."},{ticker:"TLT",alt:"EDV",name:"Long-Term Treasury",pct:10,desc:"20+ yr."},{ticker:"VCSH",alt:"IGSB",name:"Short-Term Corp",pct:10,desc:"Short duration."}]},{id:"gold",label:"🥇 Gold",stocks:[{ticker:"GLD",alt:"IAU",name:"Gold ETF",pct:10,desc:"Physical gold."},{ticker:"PHYS",alt:"SGOL",name:"Physical Gold Trust",pct:10,desc:"Inflation hedge."},{ticker:"NEM",alt:"WPM",name:"Newmont Mining",pct:10,desc:"Gold mining."}]}];
// Main Packages view: the three standard portfolios, reusable + editable per-client
const MAIN_PACKS=[{id:"conservative",label:"🛡️ Conservative Package",portKey:"conservative"},{id:"growth",label:"📈 Growth Package",portKey:"growth"},{id:"aggressive",label:"🚀 Aggressive Package",portKey:"aggressive"}];
const MS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MS_ES=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const ML_ES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const mLabel=(label,lang)=>{if(!label||lang!=="es")return label;const parts=String(label).split(" ");if(parts.length<2)return label;const i=MS.indexOf(parts[0]);if(i<0)return label;return MS_ES[i]+" "+parts.slice(1).join(" ");};
const fmtDate=(d,lang)=>{try{const date=d instanceof Date?d:new Date(d);if(isNaN(date))return "";if(lang==="es"){return `${date.getDate()} de ${ML_ES[date.getMonth()].toLowerCase()} de ${date.getFullYear()}`;}return date.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});}catch(e){return "";}};

const ML=["January","February","March","April","May","June","July","August","September","October","November","December"];
const CERTS=["Master of Business Administration (MBA)","Bachelor of Business Administration (BBA)","FMVA — Financial Modeling & Valuation Analyst","FPWMP — Financial Planning & Wealth Management Professional","FL0215 — Florida Life & Health Insurance License"];
const PHYS_CATS=[{v:"Real Estate",icon:"🏠"},{v:"Vehicle",icon:"🚗"},{v:"Precious Metals",icon:"🥇"},{v:"Business",icon:"🏢"},{v:"Collectible",icon:"🎨"},{v:"Other",icon:"💼"}];
const ACCT_L_ES={checking:"Cuenta Corriente",savings:"Ahorros",money_market:"Mercado Monetario",retirement:"Retiro / 401k",ira:"IRA",brokerage:"Corretaje / Inversión",other:"Otro"};
const LOAN_L_ES={vehicle:"Préstamo de Vehículo",student:"Préstamo Estudiantil",personal:"Préstamo Personal",mortgage:"Hipoteca",business:"Préstamo Comercial",other:"Otro Préstamo"};
const PHYS_L_ES={"Real Estate":"Bienes Raíces","Vehicle":"Vehículo","Precious Metals":"Metales Preciosos","Business":"Negocio","Collectible":"Coleccionable","Other":"Otro"};
const _gaLang=()=>(typeof window!=="undefined"&&window.__GA_LANG)||"en";
const acctL=k=>(_gaLang()==="es"&&ACCT_L_ES[k])||(ACCT_META[k]&&ACCT_META[k].l)||k;
const loanL=k=>(_gaLang()==="es"&&LOAN_L_ES[k])||(LOAN_META[k]&&LOAN_META[k].l)||k;
const physL=v=>(_gaLang()==="es"&&PHYS_L_ES[v])||v;


/* ── TRANSLATIONS ── moved to src/translations.js per D-29 (v0.6.2) ──────── */

/* ── DATA MODEL ──────────────────────────────────────────────────────────── */
const gid=()=>Date.now()+Math.floor(Math.random()*99999);
const mkAcct=(p={})=>({id:gid(),name:"",type:"checking",value:0,owner:"joint",...p});
const mkLoan=(p={})=>({id:gid(),name:"",type:"personal",balance:0,owner:"joint",apr:0,...p});
const mk=(p={})=>({id:Date.now()+Math.random(),firstName:"",lastName:"",partnerFirst:null,partnerLast:null,email:"",phone:"",address:"",dob:"",social:"",clientType:"financeOnly",recommendedBy:"",p1Phone:"",p2Phone:"",p1Email:"",p2Email:"",p1Dob:"",p2Dob:"",p1Social:"",p2Social:"",color1:"#4472C4",color2:"#ED7D31",efMonths:3,currentMonthLabel:"May 2026",incomeStreams:[],bills:[],cards:[],accounts:[],loans:[],customAssets:[],properties:[],marketInvestments:[],alloc:{stocks:25,retirement:15,realEstate:15,savings:15,vacation:5,other:5,debtRepayment:20},committed:{stocks:false,retirement:false,realEstate:false,savings:false,vacation:false,other:false,debtRepayment:false},savedPortfolio:null,savedCalcs:[],savedCompare:null,portfolioCustom:{holdings:[],overrides:{},rates:{}},notes:{shortTerm:"",midTerm:"",longTerm:"",setbacks:"",goals:"",general:""},monthSnapshots:[],archived:false,hideNumbers:false,...p});

const migrateCard=c=>{if(Array.isArray(c.promos))return c;const promos=c.promo&&(+c.promoBalance||0)>0?[{id:gid(),label:"Promo",balance:+c.promoBalance||0,rate:+c.promoRate||0,end:c.promoEnd||""}]:[];return{...c,promos,promo:undefined,promoBalance:undefined,promoRate:undefined,promoEnd:undefined};};
const migrateAccounts=c=>{if(Array.isArray(c.accounts)&&c.accounts.length>0)return c.accounts.filter(a=>a.type!=="vehicle"&&a.type!=="realEstate");const a=c.assets||{};const r=[];if(a.checking>0)r.push(mkAcct({name:"Checking",type:"checking",value:a.checking,owner:"joint"}));if(a.savings>0)r.push(mkAcct({name:"Savings",type:"savings",value:a.savings,owner:"joint"}));if(a.retirement>0)r.push(mkAcct({name:"Retirement",type:"retirement",value:a.retirement,owner:"p1"}));return r;};
const migrateLoans=c=>{if(Array.isArray(c.loans)&&c.loans.length>0)return c.loans;const l=c.liabilities||{};const r=[];if(l.vehicle>0)r.push(mkLoan({name:"Vehicle Loan",type:"vehicle",balance:l.vehicle,owner:"p1",apr:0}));if(l.student>0)r.push(mkLoan({name:"Student Loan",type:"student",balance:l.student,owner:"p1",apr:0}));if(l.personal>0)r.push(mkLoan({name:"Personal Loan",type:"personal",balance:l.personal,owner:"joint",apr:0}));return r;};
const migrateAcctTypes=acc=>{const map={investment:"brokerage"};return(acc||[]).map(a=>({...a,type:map[a.type]||a.type}));};
const extractAcctsToProps=(accts,props)=>{const movable=(accts||[]).filter(a=>a.type==="vehicle"||a.type==="realEstate");const keep=(accts||[]).filter(a=>a.type!=="vehicle"&&a.type!=="realEstate");const newProps=[...(props||[]),...movable.map(a=>({id:gid(),name:a.name,value:+a.value||0,cat:a.type==="vehicle"?"Vehicle":"Real Estate",desc:""}))];return{accounts:keep,customAssets:newProps};};
const mig=c=>{const migA=migrateAcctTypes(migrateAccounts(c));const{accounts:cleanAcc,customAssets:cleanProps}=extractAcctsToProps(migA,Array.isArray(c.customAssets)?c.customAssets:[]);return{...mk(),...c,accounts:cleanAcc,loans:migrateLoans(c),cards:(c.cards||[]).map(cc=>({owedBy:"joint",dueDay:null,...migrateCard(cc)})),customAssets:cleanProps,properties:Array.isArray(c.properties)?c.properties:cleanProps,marketInvestments:Array.isArray(c.marketInvestments)?c.marketInvestments:[],alloc:{stocks:25,retirement:15,realEstate:15,savings:15,vacation:5,other:5,debtRepayment:20,...(c.alloc||{})},committed:{stocks:false,retirement:false,realEstate:false,savings:false,vacation:false,other:false,debtRepayment:false,...(c.committed||{})},savedPortfolio:c.savedPortfolio||null,savedCalcs:Array.isArray(c.savedCalcs)?c.savedCalcs:[],savedCompare:c.savedCompare||null,notes:{shortTerm:"",midTerm:"",longTerm:"",setbacks:"",goals:"",general:"",...(c.notes||{})},portfolioCustom:{holdings:[],overrides:{},rates:{},...(c.portfolioCustom||{})},address:c.address||"",dob:c.dob||"",social:c.social||"",clientType:c.clientType||"financeOnly",recommendedBy:c.recommendedBy||"",monthSnapshots:(c.monthSnapshots||[]).map(s=>({...s,data:s.data??null,previousVersions:s.previousVersions||[],savedAt:s.savedAt||""})),bills:(c.bills||[]).map(b=>({split:{p1:50,p2:50},...b}))};};

const SEED=[mk({id:1,firstName:"Miguel",lastName:"Torres",partnerFirst:"Sofia",partnerLast:"Torres",email:"miguel.torres@email.com",phone:"(305) 555-0101",address:"1234 Coral Way, Miami FL",dob:"1989-03-14",social:"123-45-6789",clientType:"financeAndHealth",recommendedBy:"Ana Rodriguez",color1:"#4472C4",color2:"#ED7D31",incomeStreams:[{id:1,person:"p1",label:"Main Job",gross:5200,net:3900,freq:"biweekly"},{id:2,person:"p2",label:"Main Job",gross:3800,net:2800,freq:"semimonthly"},{id:3,person:"p1",label:"Side Business",gross:800,net:700,freq:"monthly2"}],bills:[{id:1,name:"Rent",assignedTo:"joint",dueDay:1,cost:1830,type:"regular",freq:"monthly2",split:{p1:50,p2:50}},{id:2,name:"Internet",assignedTo:"joint",dueDay:5,cost:80,type:"regular",freq:"monthly2",split:{p1:50,p2:50}},{id:3,name:"Car Insurance",assignedTo:"p1",dueDay:12,cost:245,type:"regular",freq:"monthly2",split:{p1:100,p2:0}},{id:4,name:"Electric",assignedTo:"joint",dueDay:20,cost:130,type:"regular",freq:"monthly2",split:{p1:50,p2:50}},{id:5,name:"Phone",assignedTo:"joint",dueDay:22,cost:140,type:"regular",freq:"monthly2",split:{p1:50,p2:50}}],cards:[{id:1,name:"Blue Business Cash",balance:2007,apr:30,min:70.25,limit:5000,promos:[],owedBy:"p1",dueDay:15},{id:2,name:"Chase Sapphire",balance:4961,apr:28.3,min:116.99,limit:8000,promos:[{id:901,label:"Promo Purchase",balance:1200,rate:0,end:"2026-06-01"},{id:902,label:"Balance Transfer",balance:500,rate:3.99,end:"2026-09-01"}],owedBy:"joint",dueDay:10},{id:3,name:"Best Buy",balance:850,apr:26.8,min:25,limit:2000,promos:[{id:903,label:"12mo No Interest",balance:850,rate:0,end:"2027-01-01"}],owedBy:"p2",dueDay:25},{id:4,name:"Citi AAdvantage",balance:1303,apr:29,min:31.49,limit:3500,promos:[],owedBy:"p1",dueDay:18}],accounts:[{id:101,name:"Joint Checking",type:"checking",value:2500,owner:"joint"},{id:102,name:"Joint Savings",type:"savings",value:5000,owner:"joint"},{id:103,name:"Miguel 401k",type:"retirement",value:8000,owner:"p1"}],loans:[{id:201,name:"Honda Accord",type:"vehicle",balance:15929,owner:"p1",apr:6.9},{id:202,name:"Personal Loan",type:"personal",balance:4800,owner:"joint",apr:15.0}],customAssets:[{id:1,name:"Primary Residence",value:480000,desc:"3/2 Coral Gables",cat:"Real Estate"},{id:2,name:"Gold Coins",value:5200,desc:"2 oz American Eagles",cat:"Precious Metals"}],notes:{shortTerm:"Pay off Best Buy promo before Jan 2027.",midTerm:"Pay off all credit cards by 2027.",longTerm:"Purchase investment property.",setbacks:"High rent.",goals:"Debt freedom and buy a duplex.",general:"Very motivated."},monthSnapshots:[{label:"Jan 2026",year:2026,month:1,income:8000,bills:6015,debt:11200,savings:4200,cashFlow:1985,savedAt:"2026-01-31T00:00:00Z",previousVersions:[],data:null},{label:"Feb 2026",year:2026,month:2,income:8000,bills:6015,debt:10800,savings:4800,cashFlow:1985,savedAt:"2026-02-28T00:00:00Z",previousVersions:[],data:null},{label:"Mar 2026",year:2026,month:3,income:8500,bills:6015,debt:10400,savings:5200,cashFlow:2485,savedAt:"2026-03-31T00:00:00Z",previousVersions:[],data:null},{label:"Apr 2026",year:2026,month:4,income:8000,bills:6015,debt:9700,savings:5800,cashFlow:1985,savedAt:"2026-04-30T00:00:00Z",previousVersions:[],data:null}]}),mk({id:2,firstName:"Amanda",lastName:"Chen",email:"amanda.chen@email.com",phone:"(786) 555-0202",clientType:"financeOnly",color1:"#70AD47",efMonths:6,incomeStreams:[{id:1,person:"p1",label:"Salary",gross:6500,net:4800,freq:"semimonthly"}],bills:[{id:1,name:"Rent",assignedTo:"p1",dueDay:1,cost:1500,type:"regular",freq:"monthly2",split:{p1:100,p2:0}},{id:2,name:"Car Payment",assignedTo:"p1",dueDay:10,cost:485,type:"regular",freq:"monthly2",split:{p1:100,p2:0}}],cards:[{id:1,name:"Capital One",balance:1200,apr:27.4,min:35,limit:3000,promos:[],owedBy:"p1",dueDay:22}],accounts:[{id:301,name:"Chase Checking",type:"checking",value:3800,owner:"p1"},{id:302,name:"High-Yield Savings",type:"savings",value:12000,owner:"p1"},{id:303,name:"Fidelity 401k",type:"retirement",value:22000,owner:"p1"}],loans:[{id:401,name:"Vehicle Loan",type:"vehicle",balance:12500,owner:"p1",apr:5.9},{id:402,name:"Student Loan",type:"student",balance:18000,owner:"p1",apr:4.5}],customAssets:[],notes:{goals:"Financial independence by 45.",general:"Detail-oriented."},monthSnapshots:[{label:"Jan 2026",year:2026,month:1,income:4800,bills:2110,debt:33000,savings:10200,cashFlow:2690,savedAt:"2026-01-31T00:00:00Z",previousVersions:[],data:null},{label:"Apr 2026",year:2026,month:4,income:4800,bills:2110,debt:31700,savings:12000,cashFlow:2690,savedAt:"2026-04-30T00:00:00Z",previousVersions:[],data:null}]})];

/* ── HELPERS ─────────────────────────────────────────────────────────────── */
const FREQ={weekly:52/12,biweekly:26/12,semimonthly:2,monthly2:1,annual:1/12};
const toM=(a,f)=>a*(FREQ[f]??1);
const fmt=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n||0);
const fmtD=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2}).format(n||0);
const fmtS=n=>{if(n>=1000000)return"$"+(n/1000000).toFixed(1)+"M";if(n>=1000)return"$"+(n/1000).toFixed(0)+"K";return fmt(n);};
const bE=e=>['e','E','+','-'].includes(e.key)&&e.preventDefault();
const vEmail=e=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const fmtPh=r=>{const d=r.replace(/\D/g,"").slice(0,10);if(d.length<=3)return d;if(d.length<=6)return`(${d.slice(0,3)}) ${d.slice(3)}`;return`(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;};
const actB=bills=>{const t=new Date();return(bills||[]).filter(b=>{if(b.type==="temporary")return!b.maturity||new Date(b.maturity)>t;if(b.type==="annual")return b.dueMonth===t.getMonth()+1;return true;});};
const sumB=bills=>actB(bills).reduce((s,b)=>s+toM(b.cost,b.freq),0);
const sumN=s=>(s||[]).reduce((a,i)=>a+toM(i.net,i.freq),0);
const sumG=s=>(s||[]).reduce((a,i)=>a+toM(i.gross,i.freq),0);
const effectiveMin=c=>+c.balance>0?Math.min(+c.balance,Math.max(25,+c.min||Math.round(+c.balance*0.01+cardMoInt(c)))):0;
const sumMin=c=>(c||[]).reduce((a,x)=>a+effectiveMin(x),0);
// Card interest helpers (handles multiple promos)
const cardMoInt=c=>{const ps=c.promos||[];const pb=ps.reduce((s,p)=>s+(+p.balance||0),0);const rb=Math.max(0,(+c.balance||0)-pb);return rb*(+c.apr||0)/100/12+ps.reduce((s,p)=>s+(+p.balance||0)*(+p.rate||0)/100/12,0);};
const totalMoInt=cards=>(cards||[]).reduce((s,c)=>s+cardMoInt(c),0);
const payM=(bal,apr,pay)=>{if(!bal||!pay)return null;const r=apr/100/12;if(r===0)return Math.ceil(bal/pay);const n=Math.log(pay/(pay-r*bal))/Math.log(1+r);return isFinite(n)&&n>0?Math.ceil(n):null;};
const payL=m=>{if(!m)return"—";const y=Math.floor(m/12),mo=m%12;return y>0?`${y}y ${mo}m`:`${mo}m`;};
const mthPmt=(P,r,n)=>{if(!r)return P/n;const mr=r/12;return P*mr*Math.pow(1+mr,n)/(Math.pow(1+mr,n)-1);};
const availCredit=card=>Math.max(0,(+card.limit||0)-(+card.balance||0));
// Sync asset debt with linked loan
const syncAssetLoans=client=>{const assets=client.customAssets||[];const existingLoans=client.loans||[];const assetIds=new Set(assets.filter(a=>+a.currentDebt>0).map(a=>a.id));let loans=existingLoans.filter(l=>!l.linkedAssetId||assetIds.has(l.linkedAssetId));assets.forEach(a=>{if(+a.currentDebt>0){const ex=loans.find(l=>l.linkedAssetId===a.id);const loanData={id:ex?.id||gid(),name:`${a.name} (Asset Debt)`,balance:+a.currentDebt||0,apr:+a.debtApr||0,term:ex?.term||30,type:a.cat==="Real Estate"?"mortgage":a.cat==="Vehicle"?"vehicle":"other",linkedAssetId:a.id};loans=ex?loans.map(l=>l.id===ex.id?loanData:l):[...loans,loanData];}});return{...client,loans};};
const getProperties=c=>c.properties?.length?c.properties:(c.customAssets||[]);const totalA=c=>((c.accounts||[]).reduce((s,a)=>s+(+a.value||0),0))+(getProperties(c).reduce((s,a)=>s+(+a.value||0),0))+((c.marketInvestments||[]).reduce((s,a)=>s+(+a.value||0),0));
const totalL=c=>((c.loans||[]).reduce((s,l)=>s+(+l.balance||0),0))+((c.cards||[]).reduce((s,cc)=>s+(+cc.balance||0),0));
const liquidA=c=>(c.accounts||[]).filter(a=>ACCT_META[a.type]?.liquid).reduce((s,a)=>s+(+a.value||0),0);
const useSrt=(items,dk,dd="asc")=>{const[sk,setSK]=useState(dk);const[sd,setSD]=useState(dd);const tgl=k=>{if(k===sk)setSD(d=>d==="asc"?"desc":"asc");else{setSK(k);setSD("asc");}};const srt=[...items].sort((a,b)=>{const av=a[sk],bv=b[sk];const r=typeof av==="string"?(av||"").localeCompare(bv||""):(+av||0)-(+bv||0);return sd==="asc"?r:-r;});return{sorted:srt,sortK:sk,sortD:sd,toggle:tgl};};
const SA=({col,sortK,sortD})=><span style={{fontSize:9,opacity:0.5,marginLeft:6}}>{sortK===col?(sortD==="asc"?"↑":"↓"):"↕"}</span>;

/* ── CSV ─────────────────────────────────────────────────────────────────── */
const esc=v=>{const s=String(v??'');return s.includes(',')||s.includes('"')?`"${s.replace(/"/g,'""')}"`:s;};
const pLine=line=>{const r=[];let cur='',inQ=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(inQ&&line[i+1]==='"'){cur+='"';i++;}else inQ=!inQ;}else if(c===','&&!inQ){r.push(cur);cur='';}else cur+=c;}r.push(cur);return r;};
const genCSV=c=>{let csv=`PROFILE\nfirstName,lastName,email,phone,address,dob,social,clientType,recommendedBy,partnerFirst,partnerLast\n${[c.firstName,c.lastName,c.email,c.phone||'',c.address||'',c.dob||'',c.social||'',c.clientType||'',c.recommendedBy||'',c.partnerFirst||'',c.partnerLast||''].map(esc).join(',')}\n\nINCOME\nperson,label,gross,net,frequency\n`;(c.incomeStreams||[]).forEach(s=>{csv+=`${[s.person,s.label,s.gross,s.net,s.freq].map(esc).join(',')}\n`;});csv+=`\nBILLS\nname,assignedTo,cost,type,frequency,dueDay,splitP1,splitP2\n`;(c.bills||[]).forEach(b=>{csv+=`${[b.name,b.assignedTo,b.cost,b.type,b.freq,b.dueDay||'',b.split?.p1??50,b.split?.p2??50].map(esc).join(',')}\n`;});csv+=`\nDEBT\nname,balance,apr,minPayment,limit,owedBy,dueDay,promos\n`;(c.cards||[]).forEach(cc=>{csv+=`${[cc.name,cc.balance,cc.apr,cc.min,cc.limit||0,cc.owedBy||'joint',cc.dueDay||'',JSON.stringify(cc.promos||[])].map(esc).join(',')}\n`;});csv+=`\nACCOUNTS\nname,type,value,owner\n`;(c.accounts||[]).forEach(a=>{csv+=`${[a.name,a.type,a.value,a.owner].map(esc).join(',')}\n`;});csv+=`\nLOANS\nname,type,balance,owner,apr\n`;(c.loans||[]).forEach(l=>{csv+=`${[l.name,l.type,l.balance,l.owner,l.apr||0].map(esc).join(',')}\n`;});return csv;};
const dlCSV=(csv,name)=>{const blob=new Blob([csv],{type:"text/csv"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);};
const expCSV=c=>dlCSV(genCSV(c),`${c.firstName}_${c.lastName}_GA.csv`);
const expAllCSV=clients=>dlCSV(clients.map(c=>`===== ${c.firstName} ${c.lastName} =====\n${genCSV(c)}`).join('\n\n'),'Golden_Anchor_All_Clients.csv');
const parseCSV=(text,existing=null)=>{const lines=text.split('\n').map(l=>l.trim());let sec=null,hdr=null;const d={profile:null,income:[],bills:[],debt:[],accounts:[],loans:[]};for(const line of lines){if(!line)continue;const up=line.toUpperCase();if(['PROFILE','INCOME','BILLS','DEBT','ACCOUNTS','LOANS'].includes(up)){sec=up;hdr=null;continue;}if(!sec||line.startsWith('====='))continue;const vals=pLine(line);if(!hdr){hdr=vals;continue;}const obj={};hdr.forEach((h,i)=>obj[h.trim()]=(vals[i]||'').trim());if(sec==='PROFILE')d.profile=obj;else if(sec==='INCOME'&&obj.label)d.income.push(obj);else if(sec==='BILLS'&&obj.name)d.bills.push(obj);else if(sec==='DEBT'&&obj.name)d.debt.push(obj);else if(sec==='ACCOUNTS'&&obj.name)d.accounts.push(obj);else if(sec==='LOANS'&&obj.name)d.loans.push(obj);}
const p=d.profile||{};return mig({...(existing||{}),firstName:p.firstName||'',lastName:p.lastName||'',email:p.email||'',phone:p.phone||'',address:p.address||'',dob:p.dob||'',social:p.social||'',clientType:p.clientType||'financeOnly',recommendedBy:p.recommendedBy||'',partnerFirst:p.partnerFirst||null,partnerLast:p.partnerLast||null,id:existing?.id||gid(),incomeStreams:d.income.map((s,i)=>({id:gid()+i,person:s.person||'p1',label:s.label,gross:+s.gross||0,net:+s.net||0,freq:s.frequency||s.freq||'monthly2'})),bills:d.bills.map((b,i)=>({id:gid()+i,name:b.name,assignedTo:b.assignedTo||'joint',cost:+b.cost||0,type:b.type||'regular',freq:b.frequency||b.freq||'monthly2',dueDay:+b.dueDay||1,split:{p1:+(b.splitP1??50),p2:+(b.splitP2??50)}})),cards:d.debt.map((c,i)=>{let promos=[];try{promos=JSON.parse(c.promos||'[]');}catch{}return{id:gid()+i,name:c.name,balance:+c.balance||0,apr:+c.apr||0,min:+(c.minPayment||c.min)||0,limit:+c.limit||0,owedBy:c.owedBy||'joint',dueDay:+c.dueDay||null,promos};}),accounts:d.accounts.map((a,i)=>({id:gid()+i,name:a.name,type:a.type||'checking',value:+a.value||0,owner:a.owner||'joint'})),loans:d.loans.map((l,i)=>({id:gid()+i,name:l.name,type:l.type||'personal',balance:+l.balance||0,owner:l.owner||'joint',apr:+l.apr||0}))});};

/* ── REMINDERS ───────────────────────────────────────────────────────────── */
// v0.28.0 — alerts now carry a stable `key` so they can be dismissed/muted via
// settings.alertDismissals. Bills/cards key embeds YYYY-MM so the next billing
// cycle naturally produces a new key (auto-re-emerges). Advisor alerts key by
// clientId+type (sometimes +cardId+promoId) — these snooze for a duration.
const _ymKey=(d=new Date())=>d.getFullYear()+"-"+(d.getMonth()+1).toString().padStart(2,"0");
function isAlertDismissed(key,dismissals,nowMs=Date.now()){if(!key||!Array.isArray(dismissals))return false;const d=dismissals.find(x=>x&&x.key===key);if(!d)return false;if(!d.until)return true;/* forever */ return new Date(d.until).getTime()>nowMs;}
function getClientRem(clients){const today=new Date();const day=today.getDate();const ym=_ymKey(today);const out=[];clients.forEach(c=>{(c.bills||[]).forEach(b=>{if(b.type!=="annual"&&b.dueDay){const diff=b.dueDay>=day?b.dueDay-day:b.dueDay+(31-day);if(diff<=7)out.push({clientId:c.id,refId:b.id,key:`billDue:${c.id}:${b.id}:${ym}`,clientName:`${c.firstName} ${c.lastName}`,name:b.name,dueDay:b.dueDay,amount:toM(b.cost,b.freq||"monthly2"),type:"bill",task:"Bill Due",daysUntil:diff});}});(c.cards||[]).forEach(cc=>{if(cc.min>0)out.push({clientId:c.id,refId:cc.id,key:`cardDue:${c.id}:${cc.id}:${ym}`,clientName:`${c.firstName} ${c.lastName}`,name:cc.name,dueDay:cc.dueDay||null,amount:cc.min,type:"card",task:"Card Min",daysUntil:cc.dueDay?Math.max(0,cc.dueDay-day):null});});});return out;}
function getAdvRem(clients,settings){const today=new Date();const out=[];clients.forEach(c=>{const snaps=c.monthSnapshots||[];if(settings.reminderAdvisor?.noContact){const last=snaps[snaps.length-1];const days=last?.savedAt?Math.floor((today-new Date(last.savedAt))/86400000):(snaps.length===0?999:0);if(days>=(settings.noContactDays||30))out.push({type:"noContact",clientId:c.id,key:`noContact:${c.id}`,priority:days>60?"high":"med",clientName:`${c.firstName} ${c.lastName}`,detail:`Last review ${days===999?"never":`${days}d ago`}`,task:"📞 No Contact"});}if(settings.reminderAdvisor?.highDebt){const net=sumN(c.incomeStreams);const dsr=net>0?sumMin(c.cards)/net:0;if(dsr>0.36)out.push({type:"highDebt",clientId:c.id,key:`highDSR:${c.id}`,priority:dsr>0.5?"high":"med",clientName:`${c.firstName} ${c.lastName}`,detail:`DSR ${(dsr*100).toFixed(0)}%`,task:"⚠️ High DSR"});}if(settings.reminderAdvisor?.promoExpiring){(c.cards||[]).forEach(cc=>{(cc.promos||[]).forEach(p=>{if(p.end){const dLeft=Math.floor((new Date(p.end)-today)/86400000);if(dLeft>=0&&dLeft<=60)out.push({type:"promo",clientId:c.id,cardId:cc.id,promoId:p.id,key:`promo:${c.id}:${cc.id}:${p.id||p.label||"_"}`,priority:dLeft<=14?"high":"med",clientName:`${c.firstName} ${c.lastName}`,detail:`${cc.name} "${p.label||"Promo"}" — ${dLeft}d`,task:"⏰ Promo Expiring"});}});});}if(settings.reminderAdvisor?.debtIncreasing){if(snaps.length>=2&&snaps[snaps.length-1].debt>snaps[0].debt)out.push({type:"debtRising",clientId:c.id,key:`debtRising:${c.id}`,priority:"med",clientName:`${c.firstName} ${c.lastName}`,detail:`+${fmt(snaps[snaps.length-1].debt-snaps[0].debt)}`,task:"📈 Debt Rising"});}});return out;}

/* ── PRIMITIVES ──────────────────────────────────────────────────────────── */
function Pill({children,color="#94A3B8",pulse=false}){return<span className={pulse?"ga-pill-pulse":undefined} style={{background:color+"22",color,border:`1px solid ${color}44`,borderRadius:99,padding:"1px 8px",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{children}</span>;}
function InfoTip({text}){const[v,setV]=useState(false);const th=useTh();const c=th.accent;return<span style={{position:"relative",display:"inline-block",marginLeft:4}}><span onMouseEnter={()=>setV(true)} onMouseLeave={()=>setV(false)} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:16,height:16,borderRadius:99,fontSize:9,cursor:"help",background:c+"22",color:c,border:`1px solid ${c}44`,fontWeight:700}}>?</span>{v&&<span style={{position:"absolute",bottom:22,left:"50%",transform:"translateX(-50%)",width:240,padding:"10px 12px",borderRadius:10,fontSize:11,lineHeight:1.6,zIndex:999,background:th.modal,border:`1px solid ${th.cardBorder}`,color:th.muted,boxShadow:"0 12px 40px #000a"}}>{text}</span>}</span>;}
// v0.27.0 — tweens the digit portion of a KPI value (string like "$12,345" or a plain number) toward
// the new target over ~600ms ease-out. Skips animation under prefers-reduced-motion, on non-numeric
// values (e.g. "●●●" hide-numbers placeholder), and on first render.
function useAnimatedDisplay(value){
  const[display,setDisplay]=useState(value);
  const prevRef=useRef(null);
  useEffect(()=>{
    const reduce=typeof window!=="undefined"&&window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCurrency=typeof value==="string"&&/^\$/.test(value);
    const numeric=typeof value==="number"?value:(typeof value==="string"?parseFloat(value.replace(/[^0-9.-]/g,"")):NaN);
    const prev=prevRef.current;
    prevRef.current=numeric;
    if(reduce||prev==null||!isFinite(numeric)||!isFinite(prev)||numeric===prev){setDisplay(value);return;}
    const fmtCur=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0});
    const fmtPlain=new Intl.NumberFormat("en-US",{maximumFractionDigits:0});
    const dur=600;
    const start=performance.now();
    let raf;
    const tick=now=>{
      const k=Math.min(1,(now-start)/dur);
      const e=1-Math.pow(1-k,3);
      const n=prev+(numeric-prev)*e;
      setDisplay(isCurrency?fmtCur.format(n):fmtPlain.format(n));
      if(k<1)raf=requestAnimationFrame(tick);else setDisplay(value);
    };
    raf=requestAnimationFrame(tick);
    return()=>{if(raf)cancelAnimationFrame(raf);};
  },[value]);
  return display;
}
function SC({label,value,color,sub}){const th=useTh();const disp=useAnimatedDisplay(value);return<div className="ga-sc" style={{...mCARD(th),padding:14,flex:1,minWidth:0,overflow:"hidden"}}><div style={{fontSize:11,color:th.muted,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</div><div style={{fontSize:18,fontWeight:800,color:color||th.accent,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{disp}</div>{sub&&<div style={{fontSize:10,color:th.dim,marginTop:2}}>{sub}</div>}</div>;}
// v0.27.0 — Skeleton primitive: matte shimmer block. width/height accept any CSS length.
function Skel({w="100%",h=12,style}){return<div className="ga-skel" style={{width:w,height:h,...style}}/>;}
// v0.27.0 — Bootstrap skeleton: matches the live dashboard's silhouette (sidebar/topbar + 4 KPIs +
// chart + client row strip) so the live UI fades in rather than popping. Pure presentational —
// no state, no effects, top-level (per pitfall #17). Spinner-fallback text remains in screen-reader
// only span so a11y tools still announce "Loading…".
function BootstrapSkeleton({theme,t,isMobile}){
  const bg=theme.bg,card=theme.card||theme.modal||"#FFF",border=theme.cardBorder||"#94A3B833",muted=theme.muted;
  const baseRow={background:card,border:`1px solid ${border}`,borderRadius:12};
  return<div role="status" aria-live="polite" style={{minHeight:"100vh",background:bg,padding:isMobile?14:24,display:"flex",flexDirection:"column",gap:14}}>
    <span style={{position:"absolute",left:-9999,width:1,height:1,overflow:"hidden"}}>{t.loadingClients||"Loading clients…"}</span>
    {/* fake topbar */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <Skel w={28} h={28} style={{borderRadius:99}}/>
        <Skel w={140} h={14}/>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <Skel w={26} h={26} style={{borderRadius:7}}/>
        <Skel w={26} h={26} style={{borderRadius:7}}/>
        <Skel w={32} h={32} style={{borderRadius:99}}/>
      </div>
    </div>
    {/* 4 KPI tiles */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:12}}>
      {[0,1,2,3].map(i=><div key={i} style={{...baseRow,padding:14}}>
        <Skel w={"55%"} h={10} style={{marginBottom:10}}/>
        <Skel w={"80%"} h={20}/>
      </div>)}
    </div>
    {/* two-col chart row */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"3fr 2fr",gap:12}}>
      <div style={{...baseRow,padding:16}}>
        <Skel w={"40%"} h={10} style={{marginBottom:14}}/>
        <Skel w={"100%"} h={isMobile?160:200}/>
      </div>
      <div style={{...baseRow,padding:16}}>
        <Skel w={"40%"} h={10} style={{marginBottom:14}}/>
        <Skel w={"100%"} h={isMobile?160:200}/>
      </div>
    </div>
    {/* alerts row */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
      {[0,1].map(i=><div key={i} style={{...baseRow,padding:14,display:"flex",flexDirection:"column",gap:8}}>
        <Skel w={"38%"} h={10} style={{marginBottom:6}}/>
        {[0,1,2].map(j=><div key={j} style={{display:"flex",alignItems:"center",gap:10}}>
          <Skel w={"60%"} h={11}/>
          <Skel w={70} h={18} style={{borderRadius:99,marginLeft:"auto"}}/>
        </div>)}
      </div>)}
    </div>
    {/* clients list strip */}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {[0,1,2,3].map(i=><div key={i} style={{...baseRow,padding:isMobile?"12px 14px":"14px 18px",display:"flex",alignItems:"center",gap:14}}>
        <Skel w={isMobile?38:44} h={isMobile?38:44} style={{borderRadius:99}}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
          <Skel w={"45%"} h={12}/>
          <Skel w={"30%"} h={10}/>
        </div>
        {!isMobile&&<div style={{display:"flex",gap:18}}>
          <Skel w={70} h={14}/>
          <Skel w={70} h={14}/>
          <Skel w={70} h={14}/>
        </div>}
      </div>)}
    </div>
    {/* anchor mark — subtle, bottom-right */}
    <div style={{textAlign:"center",color:muted,fontSize:11,letterSpacing:".18em",marginTop:4,opacity:0.6}}>⚓ {(t.loadingClients||"Loading clients…").toUpperCase()}</div>
  </div>;
}
function Field({label,children}){const th=useTh();return<div data-cf={typeof label==="string"?label:""} style={{marginBottom:14}}><label style={{fontSize:11,color:th.muted,display:"block",marginBottom:5}}>{label}</label>{children}</div>;}
function useViewport(){const[v,setV]=useState(()=>typeof window!=="undefined"?{w:window.innerWidth,h:window.innerHeight}:{w:1280,h:800});useEffect(()=>{if(typeof window==="undefined")return;let raf=null;const onR=()=>{if(raf)cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>setV({w:window.innerWidth,h:window.innerHeight}));};window.addEventListener("resize",onR);window.addEventListener("orientationchange",onR);return()=>{window.removeEventListener("resize",onR);window.removeEventListener("orientationchange",onR);if(raf)cancelAnimationFrame(raf);};},[]);return{w:v.w,h:v.h,isMobile:v.w<720,isTablet:v.w>=720&&v.w<1024,isDesktop:v.w>=1024};}
function Row2({children,forceMobileStack=true}){const{isMobile}=useViewport();const count=Array.isArray(children)?children.filter(Boolean).length:1;const cols=(isMobile&&forceMobileStack)?"1fr":`repeat(${count},1fr)`;return<div style={{display:"grid",gridTemplateColumns:cols,gap:12}}>{children}</div>;}
function SHdr({label,right}){const th=useTh();return<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><span style={{fontSize:12,fontWeight:700,color:th.accent,letterSpacing:"0.08em",textTransform:"uppercase"}}>{label}</span>{right}</div>;}
function PTag({who,client,t}){const color=who==="p1"?client.color1:who==="p2"?(client.color2||"#94A3B8"):"#94A3B8";const name=who==="p1"?client.firstName:who==="p2"?(client.partnerFirst||"P2"):"Joint";return<Pill color={color}>{name}</Pill>;}
function SBadge({value,meta,t,ratioKey}){if(value===null||value===undefined||isNaN(value))return<Pill color="#94A3B8">N/A</Pill>;const g=meta.better==="higher"?value>=meta.threshold:value<=meta.threshold;const w=meta.better==="higher"?value>=meta.threshold*0.5:value<=meta.threshold*1.4;const c=g?"#10B981":w?"#F59E0B":"#EF4444";return<Pill color={c}>{g?t.good:w?t.warning:t.critical}</Pill>;}
function Btn({children,onClick,color,small,style={}}){const th=useTh();const c=color||th.accent;return<button onClick={onClick} style={{fontSize:small?11:12,padding:small?"3px 10px":"7px 16px",borderRadius:8,background:c+"22",color:c,border:`1px solid ${c}44`,cursor:"pointer",fontWeight:600,...style}}>{children}</button>;}
function BSolid({children,onClick,style={},color}){const th=useTh();const c=color||th.accent;return<button onClick={onClick} style={{fontSize:12,padding:"7px 20px",borderRadius:8,background:c,color:"#fff",fontWeight:700,border:"none",cursor:"pointer",...style}}>{children}</button>;}
function Tog({label,checked,onChange}){const th=useTh();return<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:12,color:th.muted}}>{label}</span><div onClick={()=>onChange(!checked)} style={{width:36,height:20,borderRadius:99,background:checked?th.accent:th.cardBorder,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}><div style={{position:"absolute",top:2,left:checked?18:2,width:16,height:16,borderRadius:99,background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px #0004"}}/></div></div>;}
function MaskedNumInp({value,onChange,style={},min=0,max,step,prefix,...rest}){
  const fmtMask=v=>{if(v===""||v===null||v===undefined)return"";const s=String(v);const[int,dec]=s.split(".");const withCommas=int.replace(/\B(?=(\d{3})+(?!\d))/g,",");return dec!==undefined?withCommas+"."+dec:withCommas;};
  const[disp,setDisp]=useState(fmtMask(value));
  useEffect(()=>{setDisp(fmtMask(value));},[value]);
  const handle=e=>{const raw=e.target.value.replace(/,/g,"");if(raw===""){setDisp("");onChange({target:{value:""}});return;}if(!/^-?\d*\.?\d*$/.test(raw))return;setDisp(fmtMask(raw));const n=parseFloat(raw);if(!isNaN(n)){if(max!==undefined&&n>max)return;if(min!==undefined&&n<min&&raw!=="-")return;}onChange({target:{value:raw}});};
  return<input type="text" inputMode="decimal" value={disp} onChange={handle} onFocus={e=>e.target.select()} onKeyDown={bE} style={{...style,MozAppearance:"textfield",appearance:"textfield"}} {...rest}/>;
}

function Kebab({items,label="☰",t}){const th=useTh();const[open,setOpen]=useState(false);const[side,setSide]=useState("right");const ref=useRef();useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);// v0.9.2 — when menu opens, decide whether to anchor right:0 or left:0 based on the button's position in the viewport. Avoids clipping on mobile when the Kebab is in the left half of a row (e.g. ClientList action ☰ at left edge after v0.8.0).
const toggle=()=>{if(!open&&ref.current){const r=ref.current.getBoundingClientRect();const vw=window.innerWidth||document.documentElement.clientWidth;setSide(r.left<vw/2?"left":"right");}setOpen(o=>!o);};return<div ref={ref} style={{position:"relative",display:"inline-block"}}><button onClick={toggle} title={t?.kebabActions||"Actions"} style={{fontSize:16,padding:"5px 12px",borderRadius:8,cursor:"pointer",background:open?th.accent+"22":th.inp,color:open?th.accent:th.muted,border:`1px solid ${open?th.accent:th.cardBorder}`,fontWeight:800,lineHeight:1}}>{label}</button>{open&&<div style={{position:"absolute",top:"calc(100% + 4px)",[side]:0,background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,0.25)",minWidth:200,zIndex:100,padding:4}}>{items.filter(Boolean).map((it,i)=>it.divider?<div key={i} style={{height:1,background:th.cardBorder,margin:"4px 0"}}/>:<button key={i} onClick={()=>{setOpen(false);it.onClick();}} style={{display:"block",width:"100%",textAlign:"left",padding:"8px 12px",background:"transparent",border:"none",color:it.color||th.text,fontSize:12,cursor:"pointer",borderRadius:6,fontWeight:it.bold?700:500}} onMouseEnter={e=>e.currentTarget.style.background=th.inp} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{it.label}</button>)}</div>}</div>;}

function Paginator({total,page,setPage,perPage=10}){const th=useTh();const pages=Math.max(1,Math.ceil(total/perPage));if(pages<=1)return null;const go=p=>setPage(Math.max(1,Math.min(pages,p)));return<div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:4,marginTop:10,fontSize:11}}><button onClick={()=>go(page-1)} disabled={page<=1} style={{padding:"4px 10px",borderRadius:6,background:"transparent",border:`1px solid ${th.cardBorder}`,color:page<=1?th.dim:th.muted,cursor:page<=1?"default":"pointer"}}>‹</button>{Array.from({length:Math.min(pages,7)}).map((_,i)=>{let p;if(pages<=7)p=i+1;else if(page<=4)p=i+1;else if(page>=pages-3)p=pages-6+i;else p=page-3+i;return<button key={p} onClick={()=>go(p)} style={{padding:"4px 9px",borderRadius:6,background:page===p?th.accent:"transparent",color:page===p?"#fff":th.muted,border:`1px solid ${page===p?th.accent:th.cardBorder}`,cursor:"pointer",fontWeight:page===p?700:400,minWidth:24}}>{p}</button>;})}<button onClick={()=>go(page+1)} disabled={page>=pages} style={{padding:"4px 10px",borderRadius:6,background:"transparent",border:`1px solid ${th.cardBorder}`,color:page>=pages?th.dim:th.muted,cursor:page>=pages?"default":"pointer"}}>›</button><span style={{color:th.dim,marginLeft:10}}>{total} items</span></div>;}

function YearInp({value,onChange,min=1900,max=2100,style={},...rest}){
  const handle=e=>{const raw=e.target.value.replace(/[^\d]/g,"");if(raw===""){onChange({target:{value:""}});return;}if(raw.length<=4)onChange({target:{value:raw}});};
  return<input type="text" inputMode="numeric" value={value||""} onChange={handle} onFocus={e=>e.target.select()} onKeyDown={bE} maxLength={4} style={style} {...rest}/>;
}

// Ratio formatting helpers — rounding per spec
const ratFmt=(key,v)=>{if(v===null||v===undefined||isNaN(v))return"N/A";if(key==="currentRatio"||key==="dsr"){const abs=Math.abs(v);return v>=100?"99+":`${v.toFixed(2)}x`;}if(key==="dta"){if(v>=1)return "100%";return `${(v*100).toFixed(0)}%`;}if(key==="rsr")return `${(v*100).toFixed(1)}%`;if(key==="efr")return `${v.toFixed(1)} mo`;return v.toFixed(2);};
// Ratio color by state — N/A always grey, critical always red
const ratColor=(key,v,th)=>{if(v===null||v===undefined||isNaN(v))return th.dim;const thresholds={currentRatio:[1.0,2.0],dta:[0.4,0.2],dsr:[0.36,0.28],rsr:[0.1,0.15],efr:[3,6]};const t=thresholds[key];if(!t)return th.muted;if(key==="dta"||key==="dsr"){if(v>=t[0])return th.neg;if(v>=t[1])return th.warn;return th.pos;}else{if(v<=t[0])return th.neg;if(v<=t[1])return th.warn;return th.pos;}};
// Ratio status label
const ratStatus=(key,v,t)=>{if(v===null||v===undefined||isNaN(v))return"N/A";const thresholds={currentRatio:[1.0,2.0],dta:[0.4,0.2],dsr:[0.36,0.28],rsr:[0.1,0.15],efr:[3,6]};const th=thresholds[key];if(!th)return t.good;if(key==="dta"||key==="dsr"){if(v>=th[0])return t.critical;if(v>=th[1])return t.warning;return t.good;}if(v<=th[0])return t.critical;if(v<=th[1])return t.warning;return t.good;};

function NumInp({value,onChange,style={},min=0,...rest}){return<input type="number" value={value} onChange={onChange} onFocus={e=>e.target.select()} min={min} style={{...style,MozAppearance:"textfield",appearance:"textfield"}} {...rest}/>;}
function CalcRow({label,value,color,big}){const th=useTh();return<div data-cr-label={typeof label==="string"?label:""} data-cr-value={typeof value==="string"?value:""} data-cr-big={big?"1":""} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${th.cardBorder}`}}><span style={{fontSize:big?14:12,color:th.muted}}>{label}</span><span style={{fontSize:big?16:13,fontWeight:big?800:600,color:color||th.accent}}>{value}</span></div>;}
function CCircle({value,onChange}){const[open,setOpen]=useState(false);const th=useTh();return<div style={{position:"relative"}}><div onClick={()=>setOpen(o=>!o)} style={{width:34,height:34,borderRadius:"50%",background:value,border:"3px solid white",boxShadow:"0 0 0 1px #0004",cursor:"pointer",flexShrink:0}}/>{open&&<><div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:299}}/><div style={{position:"absolute",top:40,left:0,background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:12,padding:10,zIndex:300,boxShadow:"0 16px 40px #000a",width:194}}><div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5,marginBottom:10}}>{CP.map(c=><div key={c} onClick={()=>{onChange({target:{value:c}});setOpen(false);}} style={{width:28,height:28,borderRadius:"50%",background:c,border:value===c?"3px solid white":"2px solid transparent",cursor:"pointer",boxShadow:"0 0 0 1px #0003"}}/>)}</div><input type="color" value={value} onChange={onChange} style={{width:"100%",height:26,cursor:"pointer",borderRadius:6,border:"none"}}/></div></> }</div>;}
function SSNInput({value,onChange,t}){const[show,setShow]=useState(false);const th=useTh();const fmtSSN=v=>{const d=v.replace(/\D/g,"").slice(0,9);if(d.length<=3)return d;if(d.length<=5)return`${d.slice(0,3)}-${d.slice(3)}`;return`${d.slice(0,3)}-${d.slice(3,5)}-${d.slice(5)}`;};return<div style={{display:"flex",gap:8,alignItems:"center"}}><input type={show?"text":"password"} value={value} onChange={e=>onChange({target:{value:fmtSSN(e.target.value)}})} style={{...mINP(th),flex:1}} placeholder="###-##-####" maxLength={11}/><button onClick={()=>setShow(s=>!s)} style={{fontSize:11,padding:"6px 10px",borderRadius:7,background:th.inp,color:th.muted,border:`1px solid ${th.inpBorder}`,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{show?t.hideSSN:t.showSSN}</button></div>;}

/* ── MODAL / SAVEBAR / IADD ──────────────────────────────────────────────── */
function Modal({title,onClose,children,width=480,disableBackdropClose=false}){const th=useTh();const{isMobile}=useViewport();
  // v0.13.2 — amend D-27 bottom-sheet to centered modals on mobile per Mauricio's request.
  // Keep mobile-friendly properties: edge padding, smaller max-height for browser chrome,
  // rounded corners all around, downward-pointing shadow.
  return<div onClick={e=>{if(disableBackdropClose)return;if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"#000b",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:isMobile?12:20}}><div style={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:16,padding:isMobile?"18px 16px":24,width:"100%",maxWidth:isMobile?"100%":width,maxHeight:isMobile?"85dvh":"90vh",overflowY:"auto",boxShadow:"0 24px 60px #000d"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:isMobile?14:20}}><span style={{fontSize:14,fontWeight:700,color:th.text}}>{title}</span><button onClick={onClose} style={{background:"none",border:"none",color:th.muted,cursor:"pointer",fontSize:24,lineHeight:1,minWidth:36,minHeight:36,touchAction:"manipulation"}}>×</button></div>{children}</div></div>;}
function SaveBar({onSave,onCancel,onDelete,t,saveLabel}){const[conf,setConf]=useState(false);const th=useTh();return<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:20,paddingTop:16,borderTop:`1px solid ${th.cardBorder}`}}><div>{onDelete&&!conf&&<button onClick={()=>setConf(true)} style={{fontSize:12,padding:"6px 14px",borderRadius:8,background:"#EF444422",color:"#EF4444",border:"1px solid #EF444444",cursor:"pointer"}}>{t.deleteLabel}</button>}{onDelete&&conf&&<div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:11,color:"#EF4444"}}>{t.confirmDelete}</span><button onClick={onDelete} style={{fontSize:12,padding:"5px 12px",borderRadius:8,background:"#EF4444",color:"#fff",border:"none",cursor:"pointer"}}>Yes</button><button onClick={()=>setConf(false)} style={{fontSize:12,padding:"5px 12px",borderRadius:8,background:th.cardBorder,color:th.muted,border:"none",cursor:"pointer"}}>No</button></div>}</div><div style={{display:"flex",gap:8}}><button onClick={onCancel} style={{fontSize:12,padding:"7px 16px",borderRadius:8,background:th.inp,color:th.muted,border:`1px solid ${th.cardBorder}`,cursor:"pointer"}}>{t.cancel}</button><BSolid onClick={onSave}>{saveLabel||t.save}</BSolid></div></div>;}
function IAdd({cols,onSave,label="＋ Add row…"}){const th=useTh();const[open,setOpen]=useState(false);const[vals,setVals]=useState({});const u=k=>e=>setVals(p=>({...p,[k]:e.target.value}));const save=()=>{if(onSave(vals)){setVals({});setOpen(false);}};if(!open)return<tr onClick={()=>setOpen(true)} style={{cursor:"pointer"}}><td colSpan={cols.length+1} style={{...mTD(th),color:th.dim,fontStyle:"italic",padding:"8px 0"}}>{label}</td></tr>;return<tr style={{background:th.bg+"88"}}>{cols.map(c=><td key={c.key} style={{...mTD(th),paddingRight:6}}>{c.type==="select"?<select value={vals[c.key]||c.default||""} onChange={u(c.key)} style={{...mIIN(th),padding:"3px 6px"}}>{c.options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>:<input type={c.type||"text"} placeholder={c.placeholder||""} value={vals[c.key]||""} onChange={u(c.key)} onKeyDown={c.numeric?bE:undefined} style={mIIN(th)} onKeyUp={e=>e.key==="Enter"&&save()}/>}</td>)}<td style={{...mTDR(th),whiteSpace:"nowrap"}}><button onClick={save} style={{fontSize:12,padding:"3px 10px",borderRadius:6,background:GOLD,color:"#0D1B2A",border:"none",cursor:"pointer",fontWeight:700,marginRight:4}}>✓</button><button onClick={()=>setOpen(false)} style={{fontSize:12,padding:"3px 8px",borderRadius:6,background:th.inp,color:th.muted,border:"none",cursor:"pointer"}}>×</button></td></tr>;}

/* ── PROFILE MODAL ───────────────────────────────────────────────────────── */
/* ── ProfileToggleField — extracted to a stable top-level component so the
   input inside doesn't unmount on every ProfileModal re-render. The previous
   in-body definition caused a one-character-at-a-time typing bug on every
   ToggleField input (company phone, business address, etc.). */
function ProfileToggleField({k,label,s,setS,th,INP}){
  const hasIt=!!s["has_"+k];
  return <div style={{marginBottom:10}}>
    <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginBottom:hasIt?6:0}}>
      <input type="checkbox" checked={hasIt} onChange={e=>setS(p=>({...p,["has_"+k]:e.target.checked,...(e.target.checked?{}:{[k]:""})}))} style={{cursor:"pointer"}}/>
      <span style={{fontSize:11,color:th.muted,fontWeight:600}}>{label}</span>
    </label>
    {hasIt && <input style={INP} value={s[k]||""} onChange={e=>setS(p=>({...p,[k]:e.target.value}))} placeholder={label}/>}
  </div>;
}

function ProfileModal({settings,onSave,onClose,t}){const th=useTh();const[s,setS]=useState({...settings});const[themeOpen,setThemeOpen]=useState(false);const[bgOpen,setBgOpen]=useState(false);const[brandingOpen,setBrandingOpen]=useState(false);const[optionalOpen,setOptionalOpen]=useState(false);const[servicesOpen,setServicesOpen]=useState(false);const[backupOpen,setBackupOpen]=useState(false);const u=k=>e=>setS(p=>({...p,[k]:e.target.value}));const INP=mINP(th);
const services = s.services && s.services.length ? s.services : SVCS.map(v=>({id:v.id,icon:v.icon,name:(v.en||""),price:(v.price||""),stripeUrl:(s.stripeLinks||{})[v.id]||""}));
const updateService=(idx,field,val)=>{const next=services.map((sv,i)=>i===idx?{...sv,[field]:val}:sv);setS(p=>({...p,services:next}));};
const addService=()=>{const next=[...services,{id:"svc-"+Date.now(),icon:"💼",name:"",price:"",stripeUrl:""}];setS(p=>({...p,services:next}));};
const removeService=(idx)=>{if(!confirm(t.confirmRemoveSvc||"Remove this service?"))return;const next=services.filter((_,i)=>i!==idx);setS(p=>({...p,services:next}));};
const uploadLogo=(mode)=>(e)=>{const f=e.target.files&&e.target.files[0];if(!f)return;if(f.size>500*1024){alert((t.logoTooLarge||"Logo image is too large (max 500KB).")+" "+(f.size/1024).toFixed(0)+"KB");return;}const r=new FileReader();r.onload=ev=>{const key=mode==="light"?"logoLight":"logoDark";setS(p=>({...p,[key]:ev.target.result}));};r.readAsDataURL(f);};
const clearLogo=(mode)=>{const key=mode==="light"?"logoLight":"logoDark";setS(p=>({...p,[key]:""}));};
const AccRow=({label,k,presets})=><div style={{marginBottom:14}}><div style={{fontSize:11,color:th.muted,marginBottom:6}}>{label}</div><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>{presets.map(p=><div key={p.v} onClick={()=>setS(prev=>({...prev,[k]:p.v}))} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer"}}><div style={{width:26,height:26,borderRadius:"50%",background:p.v,border:s[k]===p.v?"3px solid white":"2px solid transparent",boxShadow:s[k]===p.v?`0 0 0 2px ${p.v}`:"0 0 0 1px #0002"}}/><span style={{fontSize:9,color:th.dim}}>{t["color"+p.l]||p.l}</span></div>)}<input type="color" value={s[k]||presets[0].v} onChange={e=>setS(p=>({...p,[k]:e.target.value}))} style={{width:26,height:26,cursor:"pointer",border:"none",borderRadius:4}}/><input value={s[k]||''} onChange={e=>setS(p=>({...p,[k]:e.target.value}))} style={{...mIIN(th),width:80,fontFamily:"monospace",fontSize:11}} placeholder="#000000"/></div></div>;
const BgPicker=({label,k,presets,def})=>{const v=s[k]||def;return<div style={{marginBottom:9}}><div style={{fontSize:10,color:th.muted,marginBottom:5}}>{label}</div><div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>{presets.map(c=><div key={c} onClick={()=>setS(p=>({...p,[k]:c}))} title={c} style={{width:24,height:24,borderRadius:6,background:c,cursor:"pointer",border:(v||"").toLowerCase()===c.toLowerCase()?`2px solid ${th.accent}`:`1px solid ${th.cardBorder}`,boxShadow:(v||"").toLowerCase()===c.toLowerCase()?`0 0 0 2px ${th.accent}44`:"none"}}/>)}<input type="color" value={/^#[0-9a-fA-F]{6}$/.test(v||"")?v:def} onChange={e=>setS(p=>({...p,[k]:e.target.value}))} style={{width:24,height:24,cursor:"pointer",border:"none",borderRadius:4,padding:0}}/><input value={v||""} onChange={e=>setS(p=>({...p,[k]:e.target.value}))} style={{...mIIN(th),width:78,fontFamily:"monospace",fontSize:10}} placeholder="#000000"/></div></div>;};
// ToggleField extracted to top-level ProfileToggleField — see comment above ProfileModal.
// Call sites pass {k,label,s,setS,th,INP} directly so the component type stays stable.
return<Modal title={t.profileSettings} onClose={onClose} width={520} disableBackdropClose={true}>

<div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8,letterSpacing:"0.07em"}}>{t.appZoom||"APP ZOOM"}</div>
<div style={{marginBottom:18}}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}><input type="range" min={50} max={200} step={10} value={Math.round((s.appZoom||1)*100)} onChange={e=>setS(p=>({...p,appZoom:(+e.target.value||100)/100}))} style={{flex:1,accentColor:th.accent,cursor:"pointer"}}/><span style={{fontSize:13,fontWeight:700,color:th.accent,minWidth:52}}>{Math.round((s.appZoom||1)*100)}%</span></div></div>

<div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8,letterSpacing:"0.07em"}}>{t.advisorInfoHdr||"ADVISOR INFORMATION"}</div>
<Row2><Field label={t.settingsAdvisorName||"Advisor Name"}><input style={INP} value={s.advisorName||""} onChange={u("advisorName")}/></Field><Field label={t.settingsEmail||"Email"}><input style={INP} value={s.advisorEmail||""} onChange={u("advisorEmail")}/></Field></Row2>
<Row2><Field label={t.advisorPhone||"Personal Phone"}><input style={INP} value={s.advisorPhone||""} onChange={u("advisorPhone")} placeholder="(305) 555-1234"/></Field><Field label={t.settingsInstagram||"Instagram"}><div style={{position:"relative"}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:th.dim,fontSize:12}}>@</span><input style={{...INP,paddingLeft:28}} value={s.ig||""} onChange={u("ig")}/></div></Field></Row2>
<Field label={t.companyName||"Company Name"}><input style={INP} value={s.companyName||""} onChange={u("companyName")} placeholder="Golden Anchor Financial Planning & Wealth Management"/></Field>

{/* OPTIONAL — collapsible */}
<div style={{...mCARD(th),padding:"10px 14px",marginTop:14,marginBottom:14,background:th.accent+"08",border:`1px solid ${th.accent}33`}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setOptionalOpen(o=>!o)}><span style={{fontSize:12,fontWeight:700,color:th.accent}}>➕ {t.optionalFieldsHdr||"Optional fields"} {optionalOpen?"▲":"▼"}</span></div>
  {optionalOpen && <div style={{marginTop:10}}>
    <ProfileToggleField k="companyPhone" label={t.companyPhone||"Company Phone"} s={s} setS={setS} th={th} INP={INP}/>
    <ProfileToggleField k="businessAddress" label={t.businessAddress||"Business Address"} s={s} setS={setS} th={th} INP={INP}/>
    <ProfileToggleField k="googleMapsUrl" label={t.googleMapsUrl||"Google Maps URL"} s={s} setS={setS} th={th} INP={INP}/>
    <ProfileToggleField k="website" label={t.website||"Website"} s={s} setS={setS} th={th} INP={INP}/>
  </div>}
</div>

{/* BRANDING — collapsible (Logos + Signature inside) */}
<div style={{...mCARD(th),padding:"10px 14px",marginBottom:14,background:th.accent+"08",border:`1px solid ${th.accent}33`}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setBrandingOpen(o=>!o)}><span style={{fontSize:12,fontWeight:700,color:th.accent}}>🎨 {t.brandingHdr||"Branding"} {brandingOpen?"▲":"▼"}</span></div>
  {brandingOpen && <div style={{marginTop:10}}>
    <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8,letterSpacing:"0.07em"}}>{t.logoHdr||"LOGOS (LIGHT & DARK)"}</div>
    <div style={{fontSize:10,color:th.dim,marginBottom:10,fontStyle:"italic",lineHeight:1.5}}>{t.logoHelp||"Upload a logo for each theme. Used in app header and engagement letter. Max 500KB per image."}</div>
    <Row2>
      <div>
        <div style={{fontSize:10,color:th.muted,marginBottom:4,fontWeight:600}}>☀️ {t.lightModeLogo||"Light mode logo"}</div>
        <div style={{...mCARD(th),padding:10,background:"#FFFFFF",border:`1px dashed ${th.cardBorder}`,minHeight:80,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:6}}>{s.logoLight?<img src={s.logoLight} alt="light" style={{maxHeight:70,maxWidth:"100%",objectFit:"contain"}}/>:<span style={{fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.logoNone||"No logo set"}</span>}</div>
        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={uploadLogo("light")} style={{fontSize:11,width:"100%"}}/>
        {s.logoLight && <button type="button" onClick={()=>clearLogo("light")} style={{fontSize:10,marginTop:4,padding:"3px 8px",borderRadius:5,background:"transparent",color:th.muted,border:`1px solid ${th.cardBorder}`,cursor:"pointer"}}>↺ {t.clearLogo||"Clear"}</button>}
      </div>
      <div>
        <div style={{fontSize:10,color:th.muted,marginBottom:4,fontWeight:600}}>🌙 {t.darkModeLogo||"Dark mode logo"}</div>
        <div style={{...mCARD(th),padding:10,background:"#0D1B2A",border:`1px dashed ${th.cardBorder}`,minHeight:80,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:6}}>{s.logoDark?<img src={s.logoDark} alt="dark" style={{maxHeight:70,maxWidth:"100%",objectFit:"contain"}}/>:<span style={{fontSize:11,color:"#94A3B8",fontStyle:"italic"}}>{t.logoNone||"No logo set"}</span>}</div>
        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={uploadLogo("dark")} style={{fontSize:11,width:"100%"}}/>
        {s.logoDark && <button type="button" onClick={()=>clearLogo("dark")} style={{fontSize:10,marginTop:4,padding:"3px 8px",borderRadius:5,background:"transparent",color:th.muted,border:`1px solid ${th.cardBorder}`,cursor:"pointer"}}>↺ {t.clearLogo||"Clear"}</button>}
      </div>
    </Row2>
    <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8,marginTop:14,letterSpacing:"0.07em"}}>{t.advisorSigHdr||"YOUR SIGNATURE (FOR ENGAGEMENT LETTERS)"}</div>
    {/* v0.31.0 — Force typed-only on the advisor signature too, AND robustly coerce legacy formats.
       Legacy string values were being mistaken for image dataUrls. Now: if string is a dataUrl
       (starts with "data:"), treat as drawn; if string contains text, treat as typed; if null/empty,
       fall back to auto-commit from defaultName. The typed text gets auto-committed on mount so the
       advisor's signature reliably persists. */}
    <SignaturePad
      value={(()=>{
        const v=s.advisorSignature;
        if(!v)return null;
        if(typeof v==="string"){
          if(v.startsWith("data:")||v.startsWith("http"))return{kind:"drawn",dataUrl:v};
          return{kind:"typed",text:v,signedAt:null};
        }
        return v;
      })()}
      onChange={v=>setS(p=>({...p,advisorSignature:v||""}))}
      t={t}
      theme={th}
      defaultName={s.advisorName}
      typedOnly={true}
    />
  </div>}
</div>

<div style={{...mCARD(th),padding:"10px 14px",marginTop:18,marginBottom:14,background:th.accent+"08",border:`1px solid ${th.accent}33`}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setThemeOpen(o=>!o)}><span style={{fontSize:12,fontWeight:700,color:th.accent}}>🎨 {t.themeColors||"Theme Colors"} {themeOpen?"▲":"▼"}</span></div>
  {themeOpen && <div style={{marginTop:10}}>
    <AccRow label={t.darkMode+" "+(t.settingsAccentSuffix||"Accent")} k="darkAccent" presets={DARK_ACCENTS}/>
    <AccRow label={t.lightMode+" "+(t.settingsAccentSuffix||"Accent")} k="lightAccent" presets={LIGHT_ACCENTS}/>
  </div>}
</div>

<div style={{...mCARD(th),padding:"10px 14px",marginBottom:14,background:th.accent+"08",border:`1px solid ${th.accent}33`}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setBgOpen(o=>!o)}><span style={{fontSize:12,fontWeight:700,color:th.accent}}>🖼️ {t.appearanceHdr||"Background Colors"} {bgOpen?"▲":"▼"}</span></div>
  {bgOpen && <div style={{marginTop:10}}>
    {[{m:"light",lbl:t.lightMode,emoji:"☀️",bgK:"lightBg",cardK:"lightCard",bgDef:"#F1F5F9",cardDef:"#FFFFFF",bgP:LIGHT_BG_PRESETS,cardP:LIGHT_CARD_PRESETS,txt:"#0F172A",bd:"#E2E8F0"},{m:"dark",lbl:t.darkMode,emoji:"🌙",bgK:"darkBg",cardK:"darkCard",bgDef:"#111827",cardDef:"#1F2937",bgP:DARK_BG_PRESETS,cardP:DARK_CARD_PRESETS,txt:"#F1F5F9",bd:"#374151"}].map(M=>{const bgV=s[M.bgK]||M.bgDef,cardV=s[M.cardK]||M.cardDef;return<div key={M.m} style={{...mCARD(th),padding:"12px 14px",marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontSize:12,fontWeight:700,color:th.text}}>{M.emoji} {M.lbl}</span><button onClick={()=>setS(p=>({...p,[M.bgK]:M.bgDef,[M.cardK]:M.cardDef}))} style={{fontSize:10,padding:"3px 9px",borderRadius:6,background:"transparent",color:th.muted,border:`1px solid ${th.cardBorder}`,cursor:"pointer"}}>↺ {t.resetToDefault||"Reset"}</button></div><BgPicker label={t.pageBackgroundLbl||"Page background"} k={M.bgK} presets={M.bgP} def={M.bgDef}/><BgPicker label={t.cardBackgroundLbl||"Card background"} k={M.cardK} presets={M.cardP} def={M.cardDef}/></div>;})}
  </div>}
</div>

<div style={{...mCARD(th),padding:"10px 14px",marginBottom:14,background:GOLD+"08",border:`1px solid ${GOLD}33`}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setServicesOpen(o=>!o)}><span style={{fontSize:12,fontWeight:700,color:GOLD}}>💼 {t.ourServices||"Our Services"} {servicesOpen?"▲":"▼"}</span><span style={{fontSize:10,color:th.dim}}>{services.length}</span></div>
  {servicesOpen && <div style={{marginTop:10}}>
    <div style={{fontSize:10,color:th.dim,marginBottom:10,lineHeight:1.5,fontStyle:"italic"}}>{t.ourServicesHelp||"Edit the name, price, and Stripe Payment Link for each service. These appear on the public intake form for clients to choose from."}</div>
    {services.map((svc,idx)=><div key={svc.id||idx} style={{padding:"10px 12px",background:th.bg,borderRadius:8,marginBottom:8,border:`1px solid ${th.cardBorder}`}}>
      <Row2>
        <Field label={t.svcIcon||"Icon"}><input style={INP} value={svc.icon||""} onChange={e=>updateService(idx,"icon",e.target.value)} maxLength={3}/></Field>
        <Field label={t.svcPrice||"Price"}><input style={INP} value={svc.price||""} onChange={e=>updateService(idx,"price",e.target.value)} placeholder="$149"/></Field>
      </Row2>
      <Field label={t.svcName||"Service name"}><input style={INP} value={svc.name||""} onChange={e=>updateService(idx,"name",e.target.value)}/></Field>
      <Field label={t.svcStripeUrl||"Stripe Payment Link"}><input style={{...INP,fontFamily:"monospace",fontSize:11}} placeholder="https://buy.stripe.com/..." value={svc.stripeUrl||""} onChange={e=>updateService(idx,"stripeUrl",e.target.value)}/></Field>
      <button type="button" onClick={()=>removeService(idx)} style={{fontSize:10,padding:"3px 8px",borderRadius:5,background:"transparent",color:th.neg,border:`1px solid ${th.neg}44`,cursor:"pointer"}}>🗑 {t.removeSvc||"Remove"}</button>
    </div>)}
    <button type="button" onClick={addService} style={{fontSize:11,padding:"6px 12px",borderRadius:8,background:GOLD+"22",color:GOLD,border:`1px solid ${GOLD}55`,cursor:"pointer",fontWeight:600}}>+ {t.addService||"Add service"}</button>
  </div>}
</div>

<div style={{...mCARD(th),padding:"10px 14px",marginBottom:14,background:th.accent+"08",border:`1px solid ${th.accent}33`}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setBackupOpen(o=>!o)}><span style={{fontSize:12,fontWeight:700,color:th.accent}}>💾 {t.settingsBackup||"Backup Verification"} {backupOpen?"▲":"▼"}</span><span style={{fontSize:10,color:th.dim}}>{s.lastBackupVerified?fmtDate(s.lastBackupVerified):(t.settingsBackupNever||"never")}</span></div>
  {backupOpen && <div style={{marginTop:10}}>
    <div style={{fontSize:10,color:th.dim,marginBottom:8,lineHeight:1.6,fontStyle:"italic"}}>{t.settingsBackupHelp||"Export a full backup monthly via Dashboard → ⋯ → Backup All (JSON). Save the file to your password-manager vault or encrypted drive."}</div>
    <button onClick={()=>setS(p=>({...p,lastBackupVerified:new Date().toISOString().slice(0,10)}))} style={{fontSize:11,padding:"5px 12px",borderRadius:8,background:th.accent+"22",color:th.accent,border:`1px solid ${th.accent}44`,cursor:"pointer",fontWeight:600}}>✓ {t.settingsBackupMarkVerified||"Mark Verified Today"}</button>
  </div>}
</div>

<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><span style={{fontSize:11,color:th.muted}}>{t.settingsNoContact||"No-contact threshold:"}</span><input type="number" min={7} max={180} value={s.noContactDays||30} onChange={e=>setS(p=>({...p,noContactDays:+e.target.value||30}))} style={{...mIIN(th),width:60,textAlign:"center"}}/><span style={{fontSize:11,color:th.dim}}>{t.settingsDays||"days"}</span></div>

<SaveBar onSave={()=>onSave(s)} onCancel={onClose} t={t}/>
</Modal>;}

/* ── NEW CLIENT MODAL (with optional partner) ────────────────────────────── */
function NewClientModal({onSave,onClose,t}){const th=useTh();const[f,setF]=useState({firstName:"",lastName:"",email:"",color1:"#4472C4",hasPartner:false,partnerFirst:"",partnerLast:"",color2:"#ED7D31"});const[err,setErr]=useState("");const u=k=>e=>setF(p=>({...p,[k]:e.target.value}));const save=()=>{if(!f.firstName||!f.lastName){setErr("First and last name required.");return;}if(!f.email||!vEmail(f.email)){setErr("Valid email required.");return;}if(f.hasPartner&&!f.partnerFirst){setErr("Partner first name required.");return;}onSave(mig({...f,id:gid(),partnerFirst:f.hasPartner?f.partnerFirst:null,partnerLast:f.hasPartner?f.partnerLast:null,color2:f.hasPartner?f.color2:null}));};const INP=mINP(th);return<Modal title={t.addClient} onClose={onClose} width={500}><Row2><Field label={`${t.firstName} *`}><input style={INP} value={f.firstName} onChange={u("firstName")}/></Field><Field label={`${t.lastName} *`}><input style={INP} value={f.lastName} onChange={u("lastName")}/></Field></Row2><Field label={`${t.email} *`}><input style={INP} value={f.email} onChange={u("email")}/></Field><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,padding:"10px 12px",background:th.bg,borderRadius:8}}><CCircle value={f.color1} onChange={u("color1")}/><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:th.text}}>{f.firstName||t.p1} color</div></div></div><div style={{borderTop:`1px solid ${th.cardBorder}`,paddingTop:14,marginBottom:14}}><button onClick={()=>setF(p=>({...p,hasPartner:!p.hasPartner}))} style={{fontSize:12,padding:"6px 14px",borderRadius:8,cursor:"pointer",background:f.hasPartner?th.accent+"22":"transparent",color:f.hasPartner?th.accent:th.muted,border:`1px solid ${f.hasPartner?th.accent:th.cardBorder}`,fontWeight:600}}>{f.hasPartner?"✓ "+t.removePartner:"＋ "+t.addPartner}</button></div>{f.hasPartner&&<><Row2><Field label={`${t.partnerFirst} *`}><input style={INP} value={f.partnerFirst} onChange={u("partnerFirst")}/></Field><Field label={t.partnerLast}><input style={INP} value={f.partnerLast} onChange={u("partnerLast")}/></Field></Row2><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,padding:"10px 12px",background:th.bg,borderRadius:8}}><CCircle value={f.color2} onChange={u("color2")}/><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:th.text}}>{f.partnerFirst||t.p2} color</div></div></div></>}{err&&<div style={{fontSize:11,color:"#EF4444",background:"#EF444411",borderRadius:8,padding:"7px 10px",marginBottom:8}}>{err}</div>}<SaveBar onSave={save} onCancel={onClose} t={t}/></Modal>;}

/* ── EDIT CLIENT MODAL ───────────────────────────────────────────────────── */
function ClientForm({client,onSave,onDelete,onClose,t}){const th=useTh();const[f,setF]=useState({firstName:"",lastName:"",partnerFirst:"",partnerLast:"",email:"",phone:"",address:"",dob:"",social:"",clientType:"financeOnly",recommendedBy:"",p1Phone:"",p2Phone:"",p1Email:"",p2Email:"",p1Dob:"",p2Dob:"",p1Social:"",p2Social:"",color1:"#4472C4",color2:"#ED7D31",...(client||{})});
  // Mirror legacy top-level phone/email/dob/social to p1Phone etc on initial load for existing clients
  useEffect(()=>{setF(p=>({...p,p1Phone:p.p1Phone||p.phone||"",p1Email:p.p1Email||p.email||"",p1Dob:p.p1Dob||p.dob||"",p1Social:p.p1Social||p.social||""}));},[]);
  const[errs,setErrs]=useState({});
  const u=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const save=()=>{const e={};if(!f.firstName)e.firstName="Required";if(!f.lastName)e.lastName="Required";if(!f.p1Email&&!f.email)e.p1Email="Required";else if((f.p1Email||f.email)&&!vEmail(f.p1Email||f.email))e.p1Email="Invalid";if(Object.keys(e).length){setErrs(e);return;}
    // Keep legacy top-level fields in sync with p1 for backward compat
    const merged={...client,...f,id:client?.id||gid(),partnerFirst:f.partnerFirst||null,partnerLast:f.partnerLast||null,color2:f.partnerFirst?f.color2:null,email:f.p1Email||f.email,phone:f.p1Phone||f.phone,dob:f.p1Dob||f.dob,social:f.p1Social||f.social};
    onSave(mig(merged));};
  const INP=mINP(th);
  const hasP2=!!f.partnerFirst;
  return<Modal title={t.editClient} onClose={onClose} width={580}>
    <Row2>
      <div><label style={{fontSize:11,color:th.muted,display:"block",marginBottom:5}}>{t.firstName} *</label><input style={INP} value={f.firstName} onChange={u("firstName")}/>{errs.firstName&&<div style={{fontSize:10,color:"#EF4444",marginTop:2}}>{errs.firstName}</div>}</div>
      <div><label style={{fontSize:11,color:th.muted,display:"block",marginBottom:5}}>{t.lastName} *</label><input style={INP} value={f.lastName} onChange={u("lastName")}/>{errs.lastName&&<div style={{fontSize:10,color:"#EF4444",marginTop:2}}>{errs.lastName}</div>}</div>
    </Row2>
    <Row2>
      <Field label={t.partnerFirst}><input style={INP} value={f.partnerFirst||""} onChange={u("partnerFirst")} placeholder={t?.blankIfSingle||"Blank if single"}/></Field>
      <Field label={t.partnerLast}><input style={INP} value={f.partnerLast||""} onChange={u("partnerLast")}/></Field>
    </Row2>
    <Field label={t.address}><input style={INP} value={f.address||""} onChange={u("address")}/></Field>
    <Row2>
      <Field label={t.clientType}><select style={INP} value={f.clientType||"financeOnly"} onChange={u("clientType")}><option value="financeOnly">{t.financeOnly}</option><option value="financeAndHealth">{t.financeAndHealth}</option></select></Field>
      <Field label={t.recommendedBy}><input style={INP} value={f.recommendedBy||""} onChange={u("recommendedBy")}/></Field>
    </Row2>
    <div style={{height:1,background:th.cardBorder,margin:"16px 0"}}/>
    <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:10}}>👤 {f.firstName||"Person 1"} — Personal Info</div>
    <Row2>
      <div><label style={{fontSize:11,color:th.muted,display:"block",marginBottom:5}}>{t?.email||"Email"} *</label><input style={INP} value={f.p1Email} onChange={u("p1Email")} placeholder="person1@email.com"/>{errs.p1Email&&<div style={{fontSize:10,color:"#EF4444",marginTop:2}}>{errs.p1Email}</div>}</div>
      <Field label={t?.phone||"Phone"}><input style={INP} value={f.p1Phone||""} onChange={e=>setF(p=>({...p,p1Phone:fmtPh(e.target.value)}))} placeholder="(305) 555-0000"/></Field>
    </Row2>
    <Row2>
      <Field label={t?.dob||"Date of Birth"}><input type="date" style={INP} value={f.p1Dob||""} onChange={u("p1Dob")}/></Field>
      <Field label={t?.social||"SSN"}><SSNInput value={f.p1Social||""} onChange={u("p1Social")} t={t}/></Field>
    </Row2>
    {hasP2&&<><div style={{height:1,background:th.cardBorder,margin:"16px 0"}}/>
    <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:10}}>👤 {f.partnerFirst} — Personal Info</div>
    <Row2>
      <Field label={t?.email||"Email"}><input style={INP} value={f.p2Email||""} onChange={u("p2Email")} placeholder="person2@email.com"/></Field>
      <Field label={t?.phone||"Phone"}><input style={INP} value={f.p2Phone||""} onChange={e=>setF(p=>({...p,p2Phone:fmtPh(e.target.value)}))} placeholder="(305) 555-0000"/></Field>
    </Row2>
    <Row2>
      <Field label={t?.dob||"Date of Birth"}><input type="date" style={INP} value={f.p2Dob||""} onChange={u("p2Dob")}/></Field>
      <Field label={t?.social||"SSN"}><SSNInput value={f.p2Social||""} onChange={u("p2Social")} t={t}/></Field>
    </Row2></>}
    <div style={{height:1,background:th.cardBorder,margin:"16px 0"}}/>
    <div style={{display:"flex",gap:24,alignItems:"center",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}><CCircle value={f.color1||"#4472C4"} onChange={u("color1")}/><span style={{fontSize:12,color:th.muted}}>{f.firstName||t.p1}</span></div>
      {hasP2&&<div style={{display:"flex",alignItems:"center",gap:8}}><CCircle value={f.color2||"#ED7D31"} onChange={u("color2")}/><span style={{fontSize:12,color:th.muted}}>{f.partnerFirst}</span></div>}
    </div>
    <SaveBar onSave={save} onCancel={onClose} onDelete={onDelete} t={t}/>
  </Modal>;}

/* ── INCOME MODAL ────────────────────────────────────────────────────────── */
function IncomeModal({income,client,onSave,onDelete,onClose,t}){const th=useTh();const[f,setF]=useState({person:"p1",label:"",gross:0,net:0,freq:"biweekly",...(income||{})});const u=k=>e=>setF(p=>({...p,[k]:e.target.value}));const persons=[["p1",client.firstName||t.p1],["p2",client.partnerFirst||t.p2],["joint",t.joint]].filter(([k])=>k!=="p2"||client.partnerFirst);const INP=mINP(th);return<Modal title={income?`${t.editLabel} ${t.income}`:t.addIncome} onClose={onClose}><Row2><Field label={t.person}><select style={INP} value={f.person} onChange={u("person")}>{persons.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field><Field label={t?.genLabel||"Label"}><input style={INP} value={f.label} onChange={u("label")} placeholder={t?.incomeSrcPh||"Job, Business, Rental…"}/></Field></Row2><Field label={t.frequency}><select style={INP} value={f.freq} onChange={u("freq")}>{["weekly","biweekly","semimonthly","monthly2","annual"].map(k=><option key={k} value={k}>{t[k]}</option>)}</select></Field><Row2><Field label={`${t.gross} / period ($)`}><MaskedNumInp style={INP} value={f.gross} onChange={u("gross")} onKeyDown={bE}/></Field><Field label={`${t.net} / period ($)`}><MaskedNumInp style={INP} value={f.net} onChange={u("net")} onKeyDown={bE}/></Field></Row2><div style={{...mCARD(th),padding:12,fontSize:12,display:"flex",gap:24,marginBottom:4}}><span style={{color:th.muted}}>{t.netMoColon||"Net/mo:"} <span style={{color:th.pos,fontWeight:700}}>{fmt(toM(+f.net,f.freq))}</span></span><span style={{color:th.muted}}>Annual: <span style={{fontWeight:600}}>{fmt(toM(+f.net,f.freq)*12)}</span></span></div><SaveBar onSave={()=>{if(!f.label){alert(t.labelReqErr||"Label required.");return;}onSave({...f,id:income?.id||gid(),gross:+f.gross,net:+f.net});}} onCancel={onClose} onDelete={income?onDelete:null} t={t}/></Modal>;}

/* ── CARD MODAL (multiple promos) ────────────────────────────────────────── */
function CardModal({card,client,onSave,onDelete,onClose,t}){const th=useTh();const[f,setF]=useState({name:"",balance:0,apr:0,min:0,limit:0,owedBy:"joint",dueDay:"",promos:[],...(card||{})});const[np,setNp]=useState({label:"",balance:0,rate:0,end:""});const[addingP,setAddingP]=useState(false);const[err,setErr]=useState("");const u=k=>e=>setF(p=>({...p,[k]:e.target.type==="checkbox"?e.target.checked:e.target.value}));const promoBal=(f.promos||[]).reduce((s,p)=>s+(+p.balance||0),0);const regularBal=Math.max(0,(+f.balance||0)-promoBal);const moInt=cardMoInt(f);const INP=mINP(th);const persons=[["joint","Joint"],[`p1`,client?.firstName||"Person 1"],[`p2`,client?.partnerFirst||"Person 2"]].filter(([k])=>k!=="p2"||client?.partnerFirst);const addPromo=()=>{if(!(+np.balance>0)){setErr("Promo balance required.");return;}if(+np.balance>+f.balance){setErr("Promo balance > total balance.");return;}if(promoBal+(+np.balance)>+f.balance){setErr("Total promo balances exceed card balance.");return;}setF(p=>({...p,promos:[...(p.promos||[]),{id:gid(),label:np.label||"Promo",balance:+np.balance,rate:+np.rate||0,end:np.end||""}]}));setNp({label:"",balance:0,rate:0,end:""});setAddingP(false);setErr("");};const delPromo=id=>setF(p=>({...p,promos:p.promos.filter(x=>x.id!==id)}));const save=()=>{if(!f.name){setErr("Name required.");return;}const pb=(f.promos||[]).reduce((s,p)=>s+(+p.balance||0),0);if(pb>+f.balance){setErr("Promo balances exceed total balance.");return;}const finalMin=+f.min>0?+f.min:effectiveMin({...f,balance:+f.balance,apr:+f.apr});onSave({...f,id:card?.id||gid(),balance:+f.balance,apr:+f.apr,min:finalMin,limit:+f.limit||0,dueDay:f.dueDay?+f.dueDay:null,promos:f.promos||[]});};return<Modal title={card?`${t.editLabel} Card`:t.addCard} onClose={onClose} width={520}><Field label={t.cardName}><input style={INP} value={f.name} onChange={u("name")}/></Field>{client?.partnerFirst&&<Field label={t.owedByLbl}><select style={INP} value={f.owedBy||"joint"} onChange={u("owedBy")}>{persons.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field>}<Row2><Field label={t?.totalBalanceField||"Total Balance ($)"}><MaskedNumInp style={INP} value={f.balance} onChange={u("balance")} onKeyDown={bE}/></Field><Field label={t?.loanApr||"APR (%)"}><MaskedNumInp style={INP} value={f.apr} onChange={u("apr")} onKeyDown={bE} step="0.1"/></Field></Row2><Row2><Field label={t?.minPayShort||"Min Pay ($)"}><div style={{position:"relative"}}><MaskedNumInp style={INP} value={f.min} onChange={u("min")} onKeyDown={bE} placeholder={String(Math.round(effectiveMin(f)))}/><span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:10,color:th.dim,pointerEvents:"none"}}>Suggested: {fmtD(effectiveMin(f))}</span></div></Field><Field label={<span>Limit ($)<InfoTip text={t.limitInfo}/></span>}><MaskedNumInp style={INP} value={f.limit} onChange={u("limit")} onKeyDown={bE}/></Field></Row2><Field label={`${t.dueDay} (1-31, optional)`}><MaskedNumInp style={INP} value={f.dueDay||""} onChange={e=>setF(p=>({...p,dueDay:e.target.value?Math.min(31,Math.max(1,+e.target.value)):""}))} placeholder="e.g. 15" min={1} max={31} onKeyDown={bE}/></Field><div style={{...mCARD(th),padding:14,marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontSize:12,fontWeight:700,color:th.accent}}>🏷 {t.promoRatesHdr||"Promotional Rates"}</span><Btn small onClick={()=>setAddingP(a=>!a)}>＋ {t.addPromo}</Btn></div>{(f.promos||[]).length===0&&!addingP&&<div style={{fontSize:11,color:th.dim,fontStyle:"italic",marginBottom:8}}>No promotional rates. All balance at {f.apr||0}% APR.</div>}{(f.promos||[]).map((p,i)=><div key={p.id} style={{...mCARD(th),padding:"8px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:8,background:th.bg}}><div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:th.text}}>{p.label||"Promo"}</div><div style={{fontSize:11,color:th.muted}}>{fmt(p.balance)} at {p.rate}% APR{p.end?` · ends ${new Date(p.end).toLocaleDateString("en-US",{month:"short",year:"numeric"})}`:""}</div></div><button onClick={()=>delPromo(p.id)} style={{fontSize:11,padding:"2px 8px",borderRadius:6,background:"#EF444422",color:"#EF4444",border:"none",cursor:"pointer"}}>×</button></div>)}{addingP&&<div style={{border:`1px solid ${th.cardBorder}`,borderRadius:10,padding:12,marginTop:8,background:th.bg}}><Row2><Field label={`${t.promoLabel}`}><input style={INP} value={np.label} onChange={e=>setNp(p=>({...p,label:e.target.value}))} placeholder="e.g. Balance Transfer"/></Field><Field label={t.promoBalance}><MaskedNumInp style={INP} value={np.balance} onChange={e=>setNp(p=>({...p,balance:+e.target.value||0}))} onKeyDown={bE}/></Field></Row2><Row2><Field label={t.promoRate}><MaskedNumInp style={INP} value={np.rate} onChange={e=>setNp(p=>({...p,rate:+e.target.value||0}))} step="0.1" onKeyDown={bE}/></Field><Field label={t.promoEnd2}><input type="date" style={INP} value={np.end} onChange={e=>setNp(p=>({...p,end:e.target.value}))}/></Field></Row2><div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn onClick={()=>setAddingP(false)} small>{t.cancel}</Btn><BSolid onClick={addPromo} style={{fontSize:11,padding:"4px 14px"}}>Add</BSolid></div></div>}</div><div style={{...mCARD(th),padding:12,fontSize:12,display:"flex",gap:16,marginBottom:4,flexWrap:"wrap"}}><span style={{color:th.muted}}>{t.regularBalance}: <span style={{color:th.muted,fontWeight:600}}>{fmt(regularBal)} @ {f.apr||0}%</span></span><span style={{color:th.muted}}>{t.moInterestColon||"Mo. Interest:"} <span style={{color:"#EF4444",fontWeight:700}}>{fmtD(moInt)}</span></span><span style={{color:th.muted}}>{t.payoffColon||"Payoff:"} <span style={{color:GOLD,fontWeight:700}}>{payL(payM(+f.balance,+f.apr,+f.min))}</span></span></div>{err&&<div style={{fontSize:11,color:"#EF4444",background:"#EF444411",borderRadius:8,padding:"7px 10px",marginBottom:8}}>{err}</div>}<SaveBar onSave={save} onCancel={onClose} onDelete={card?onDelete:null} t={t}/></Modal>;}

/* ── BILL MODAL ──────────────────────────────────────────────────────────── */
function BillModal({bill,client,onSave,onDelete,onClose,t}){const th=useTh();const[f,setF]=useState({name:"",assignedTo:"joint",cost:0,type:"regular",freq:"monthly2",dueDay:1,dueMonth:1,maturity:"",split:{p1:50,p2:50},...(bill||{})});const u=k=>e=>setF(p=>({...p,[k]:e.target.value}));const persons=[["p1",client.firstName||t.p1],["p2",client.partnerFirst||t.p2],["joint",t.joint]].filter(([k])=>k!=="p2"||client.partnerFirst);const save=()=>{if(!f.name){alert(t.nameReqErr||"Name required.");return;}const day=Math.min(31,Math.max(1,+f.dueDay||1));onSave({...f,id:bill?.id||gid(),cost:+f.cost,dueDay:f.type==="annual"?null:day,dueMonth:f.type==="annual"?+f.dueMonth:null,freq:f.type==="annual"?"annual":f.freq});};const INP=mINP(th);const moCost=toM(+f.cost,f.freq);return<Modal title={bill?`${t.editLabel} Bill`:t.addBill} onClose={onClose}><Row2><Field label={t.billName}><input style={INP} value={f.name} onChange={u("name")}/></Field><Field label={t.person}><select style={INP} value={f.assignedTo} onChange={u("assignedTo")}>{persons.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field></Row2><Row2><Field label={t.billType}><select style={INP} value={f.type} onChange={u("type")}>{["regular","annual","temporary"].map(k=><option key={k} value={k}>{t[k]||k}</option>)}</select></Field>{f.type!=="annual"&&<Field label={t.frequency}><select style={INP} value={f.freq} onChange={u("freq")}>{["weekly","biweekly","semimonthly","monthly2"].map(k=><option key={k} value={k}>{t[k]}</option>)}</select></Field>}</Row2><Row2><Field label={t.cost}><MaskedNumInp style={INP} value={f.cost} onChange={u("cost")} onKeyDown={bE}/></Field>{f.type!=="annual"?<Field label={t.dueDay}><MaskedNumInp style={INP} value={f.dueDay} onChange={e=>setF(p=>({...p,dueDay:Math.min(31,Math.max(1,+e.target.value||1))}))} min={1} max={31} onKeyDown={bE}/></Field>:<Field label={t?.dueMonthLbl||"Due Month"}><MaskedNumInp style={INP} value={f.dueMonth} onChange={u("dueMonth")} min={1} max={12} onKeyDown={bE}/></Field>}</Row2>{f.type==="temporary"&&<Field label={t?.maturityDateLbl||"Maturity Date"}><input type="date" style={INP} value={f.maturity} onChange={u("maturity")}/></Field>}{f.assignedTo==="joint"&&client.partnerFirst&&<div style={{...mCARD(th),padding:12,marginTop:4,marginBottom:14}}><div style={{fontSize:11,color:th.dim,marginBottom:8}}>⚖️ {t.responsibilitySplit}</div><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:12,color:th.text,minWidth:110}}>{client.firstName}: <b>{f.split?.p1??50}%</b> = {fmt(moCost*(f.split?.p1??50)/100)}</span><input type="range" min={0} max={100} value={f.split?.p1??50} onChange={e=>{const v=+e.target.value;setF(p=>({...p,split:{p1:v,p2:100-v}}));}} style={{flex:1,accentColor:th.accent}}/><span style={{fontSize:12,color:th.text,minWidth:110,textAlign:"right"}}>{client.partnerFirst}: <b>{f.split?.p2??50}%</b> = {fmt(moCost*(f.split?.p2??50)/100)}</span></div></div>}<SaveBar onSave={save} onCancel={onClose} onDelete={bill?onDelete:null} t={t}/></Modal>;}

/* ── ACCOUNT MODAL ───────────────────────────────────────────────────────── */
function AccountModal({acct,client,onSave,onDelete,onClose,t}){const th=useTh();const[f,setF]=useState({name:"",type:"checking",value:0,owner:"joint",...(acct||{})});const u=k=>e=>setF(p=>({...p,[k]:e.target.value}));const persons=[["joint","Joint"],[`p1`,client?.firstName||"Person 1"],[`p2`,client?.partnerFirst||"Person 2"]].filter(([k])=>k!=="p2"||client?.partnerFirst);const INP=mINP(th);const meta=ACCT_META[f.type]||ACCT_META.other;return<Modal title={acct?`${t.editLabel} Account`:t.addAccount} onClose={onClose}><Row2><Field label={t.acctName}><input style={INP} value={f.name} onChange={u("name")} placeholder="e.g. Chase Checking"/></Field><Field label={t.acctType}><select style={INP} value={f.type} onChange={u("type")}>{ACCA.map(k=><option key={k} value={k}>{ACCT_META[k].icon} {acctL(k)}</option>)}</select></Field></Row2><Row2><Field label={t.acctValue}><MaskedNumInp style={INP} value={f.value} onChange={u("value")} onKeyDown={bE}/></Field><Field label={t.ownerLbl}><select style={INP} value={f.owner} onChange={u("owner")}>{persons.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field></Row2><div style={{...mCARD(th),padding:10,fontSize:12,display:"flex",gap:10,alignItems:"center",marginBottom:4}}><span style={{fontSize:18}}>{meta.icon}</span><div><div style={{fontWeight:700,color:meta.c}}>{meta.l}</div><div style={{fontSize:11,color:th.dim}}>{meta.liquid?"Liquid — counts toward Emergency Fund":meta.invest?"Investment asset":"Household asset"}</div></div><div style={{marginLeft:"auto",fontSize:15,fontWeight:800,color:th.pos}}>{fmt(+f.value||0)}</div></div><SaveBar onSave={()=>{if(!f.name){alert(t.nameReqErr||"Name required.");return;}onSave({...f,id:acct?.id||gid(),value:+f.value});}} onCancel={onClose} onDelete={acct?onDelete:null} t={t}/></Modal>;}

/* ── LOAN MODAL ──────────────────────────────────────────────────────────── */
function LoanModal({loan,client,onSave,onDelete,onClose,t}){const th=useTh();const[f,setF]=useState({name:"",type:"personal",balance:0,owner:"joint",apr:0,...(loan||{})});const u=k=>e=>setF(p=>({...p,[k]:e.target.value}));const persons=[["joint","Joint"],[`p1`,client?.firstName||"Person 1"],[`p2`,client?.partnerFirst||"Person 2"]].filter(([k])=>k!=="p2"||client?.partnerFirst);const INP=mINP(th);const meta=LOAN_META[f.type]||LOAN_META.other;return<Modal title={loan?`${t.editLabel} Loan`:t.addLoan} onClose={onClose}><Row2><Field label={t.loanName}><input style={INP} value={f.name} onChange={u("name")} placeholder="e.g. Honda Accord"/></Field><Field label={t.loanType}><select style={INP} value={f.type} onChange={u("type")}>{LOKA.map(k=><option key={k} value={k}>{LOAN_META[k].icon} {loanL(k)}</option>)}</select></Field></Row2><Row2><Field label={t.loanBalance}><MaskedNumInp style={INP} value={f.balance} onChange={u("balance")} onKeyDown={bE}/></Field><Field label={t.ownerLbl}><select style={INP} value={f.owner} onChange={u("owner")}>{persons.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field></Row2><Field label={t.loanApr}><MaskedNumInp style={INP} value={f.apr} onChange={u("apr")} onKeyDown={bE} step="0.1"/></Field><SaveBar onSave={()=>{if(!f.name){alert(t.nameReqErr||"Name required.");return;}onSave({...f,id:loan?.id||gid(),balance:+f.balance,apr:+f.apr});}} onCancel={onClose} onDelete={loan?onDelete:null} t={t}/></Modal>;}

/* ── ASSET MODAL ─────────────────────────────────────────────────────────── */
function AssetModal({asset,onSave,onDelete,onClose,t}){const th=useTh();const[f,setF]=useState({name:"",value:0,desc:"",cat:"Real Estate",purchaseCost:0,currentDebt:0,debtApr:0,...(asset||{})});const u=k=>e=>setF(p=>({...p,[k]:e.target.value}));const equity=(+f.value||0)-(+f.currentDebt||0);const INP=mINP(th);return<Modal title={asset?`${t.editLabel} Asset`:t.addAsset} onClose={onClose} width={480}><Row2><Field label={t.assetName}><input style={INP} value={f.name} onChange={u("name")}/></Field><Field label={t.assetCat}><select style={INP} value={f.cat} onChange={u("cat")}>{PHYS_CATS.map(pc=><option key={pc.v} value={pc.v}>{pc.icon} {physL(pc.v)}</option>)}</select></Field></Row2><Row2><Field label={t?.currentValueField||"Current Value ($)"}><MaskedNumInp style={INP} value={f.value} onChange={u("value")} onKeyDown={bE}/></Field><Field label={t?.purchaseCostOpt||"Purchase Cost ($) optional"}><MaskedNumInp style={INP} value={f.purchaseCost} onChange={u("purchaseCost")} onKeyDown={bE}/></Field></Row2><Row2><Field label={t?.currentDebtField||"Current Debt ($)"}><MaskedNumInp style={INP} value={f.currentDebt} onChange={u("currentDebt")} onKeyDown={bE}/></Field><Field label={t?.debtAprField||"Debt APR (%)"}><MaskedNumInp style={INP} value={f.debtApr} onChange={u("debtApr")} onKeyDown={bE} step="0.1"/></Field></Row2>{+f.currentDebt>0&&<div style={{...mINP(th),marginBottom:14,padding:"8px 12px",fontSize:12,borderRadius:8}}><span style={{color:useTh().dim}}>Equity: </span><span style={{fontWeight:700,color:+f.value>+f.currentDebt?useTh().pos:useTh().neg}}>{fmt(equity)}</span>{+f.purchaseCost>0&&<><span style={{color:useTh().dim}}> · Gain: </span><span style={{fontWeight:700,color:(+f.value-+f.purchaseCost)>=0?useTh().pos:useTh().neg}}>{fmt(+f.value-+f.purchaseCost)}</span></>}</div>}<Field label={t.assetDesc}><textarea style={{...INP,height:60,resize:"vertical"}} value={f.desc} onChange={u("desc")} placeholder={t?.optionalPh||"Optional…"}/></Field><SaveBar onSave={()=>{if(!f.name){alert(t.nameReqErr||"Name required.");return;}onSave({...f,id:asset?.id||gid(),value:+f.value,purchaseCost:+f.purchaseCost||0,currentDebt:+f.currentDebt||0,debtApr:+f.debtApr||0});}} onCancel={onClose} onDelete={asset?onDelete:null} t={t}/></Modal>;}

/* ── SPLIT ASSIGN MODAL ──────────────────────────────────────────────────── */
function SplitAssignModal({client,onConfirm,onClose,t}){const th=useTh();
const jI=client.incomeStreams.filter(s=>s.person==="joint");
const jB=client.bills.filter(b=>b.assignedTo==="joint");
const jC=client.cards.filter(c=>c.owedBy==="joint");
const jA=(client.accounts||[]).filter(a=>a.owner==="joint");
const jL=(client.loans||[]).filter(l=>l.owner==="joint");
const allJoint=[...jI,...jB,...jC,...jA,...jL];
const[asgn,setAsgn]=useState(()=>{const a={};allJoint.forEach(x=>a[x.id]="p1");return a;});
const tog=id=>setAsgn(p=>({...p,[id]:p[id]==="p1"?"p2":"p1"}));
const c1=client.color1,n1=client.firstName,c2=client.color2||"#ED7D31",n2=client.partnerFirst;
const Btn2=({id})=><div style={{display:"flex",gap:4}}>{[[n1,c1,"p1"],[n2,c2,"p2"]].map(([n,c,v])=><button key={v} onClick={()=>setAsgn(p=>({...p,[id]:v}))} style={{fontSize:11,padding:"2px 10px",borderRadius:6,cursor:"pointer",background:asgn[id]===v?c+"33":"transparent",color:asgn[id]===v?c:th.dim,border:`1px solid ${asgn[id]===v?c:th.cardBorder}`,fontWeight:asgn[id]===v?700:400}}>{n}</button>)}</div>;
const Section=({title,items,getLabel,getValue})=>items.length>0?<div style={{marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:6,textTransform:"uppercase"}}>{title}</div>{items.map(item=><div key={item.id} style={{...mCARD(th),padding:"8px 12px",marginBottom:4,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}><div><div style={{fontSize:12,fontWeight:600,color:th.text}}>{getLabel(item)}</div><div style={{fontSize:11,color:th.muted}}>{getValue(item)}</div></div><Btn2 id={item.id}/></div>)}</div>:null;
const confirm=()=>{const p1=mig({...client,id:gid(),partnerFirst:null,partnerLast:null,color2:null,incomeStreams:[...client.incomeStreams.filter(s=>s.person==="p1"),...jI.filter(s=>asgn[s.id]==="p1").map(s=>({...s,person:"p1"}))],bills:[...client.bills.filter(b=>b.assignedTo==="p1"),...jB.filter(b=>asgn[b.id]==="p1").map(b=>({...b,assignedTo:"p1",split:{p1:100,p2:0}}))],cards:[...client.cards.filter(c=>c.owedBy==="p1"),...jC.filter(c=>asgn[c.id]==="p1").map(c=>({...c,owedBy:"p1"}))],accounts:[...(client.accounts||[]).filter(a=>a.owner==="p1"),...jA.filter(a=>asgn[a.id]==="p1").map(a=>({...a,owner:"p1"}))],loans:[...(client.loans||[]).filter(l=>l.owner==="p1"),...jL.filter(l=>asgn[l.id]==="p1").map(l=>({...l,owner:"p1"}))],monthSnapshots:[]});const p2=mig({...client,id:gid(),firstName:n2,lastName:client.partnerLast||client.lastName,partnerFirst:null,partnerLast:null,color1:c2,color2:null,incomeStreams:[...client.incomeStreams.filter(s=>s.person==="p2").map(s=>({...s,person:"p1"})),...jI.filter(s=>asgn[s.id]==="p2").map(s=>({...s,person:"p1"}))],bills:[...client.bills.filter(b=>b.assignedTo==="p2").map(b=>({...b,assignedTo:"p1"})),...jB.filter(b=>asgn[b.id]==="p2").map(b=>({...b,assignedTo:"p1",split:{p1:100,p2:0}}))],cards:[...client.cards.filter(c=>c.owedBy==="p2").map(c=>({...c,owedBy:"p1"})),...jC.filter(c=>asgn[c.id]==="p2").map(c=>({...c,owedBy:"p1"}))],accounts:[...(client.accounts||[]).filter(a=>a.owner==="p2").map(a=>({...a,owner:"p1"})),...jA.filter(a=>asgn[a.id]==="p2").map(a=>({...a,owner:"p1"}))],loans:[...(client.loans||[]).filter(l=>l.owner==="p2").map(l=>({...l,owner:"p1"})),...jL.filter(l=>asgn[l.id]==="p2").map(l=>({...l,owner:"p1"}))],monthSnapshots:[]});onConfirm(p1,p2);};
return<Modal title={"✂️ "+t.splitTitle} onClose={onClose} width={560}><div style={{background:th.accent+"11",border:`1px solid ${th.accent}33`,borderRadius:8,padding:"8px 12px",fontSize:11,color:th.muted,marginBottom:16}}>ℹ️ {t.splitDesc}<br/>Personal items automatically go to their owner — only joint items appear below.</div>{allJoint.length===0&&<div style={{textAlign:"center",padding:20,color:th.dim,fontSize:12}}>{t.noJointItems||"No joint items found. All items are already assigned to individual owners."}</div>}<Section title={`💼 ${t.income}`} items={jI} getLabel={s=>s.label} getValue={s=>`${fmt(toM(s.net,s.freq))}/mo · ${t[s.freq]}`}/><Section title={`💳 ${t.bills}`} items={jB} getLabel={b=>b.name} getValue={b=>`${fmt(toM(b.cost,b.freq))}/mo · Day ${b.dueDay||"—"}`}/><Section title={`💳 ${t.debt}`} items={jC} getLabel={c=>c.name} getValue={c=>`${fmt(c.balance)} · ${c.apr}% APR`}/><Section title={`🏦 ${t.accounts}`} items={jA} getLabel={a=>a.name} getValue={a=>`${fmt(a.value)} · ${acctL(a.type)}`}/><Section title={`📋 ${t.loans}`} items={jL} getLabel={l=>l.name} getValue={l=>`${fmt(l.balance)} · ${l.apr||0}% APR`}/>{allJoint.length>0&&<div style={{...mCARD(th),padding:10,marginBottom:4,display:"flex",gap:12,justifyContent:"center"}}><div style={{display:"flex",alignItems:"center",gap:6,fontSize:11}}><div style={{width:10,height:10,borderRadius:99,background:c1}}/><span style={{color:th.text}}>{n1}: <b>{Object.values(asgn).filter(v=>v==="p1").length} items</b></span></div><div style={{display:"flex",alignItems:"center",gap:6,fontSize:11}}><div style={{width:10,height:10,borderRadius:99,background:c2}}/><span style={{color:th.text}}>{n2}: <b>{Object.values(asgn).filter(v=>v==="p2").length} items</b></span></div></div>}<SaveBar onSave={confirm} onCancel={onClose} t={{...t,save:t.confirmSplit}}/></Modal>;}

/* ── JOIN MODAL ──────────────────────────────────────────────────────────── */
function JoinModal({client,allClients,onConfirm,onClose,t}){const th=useTh();const[sel,setSel]=useState(null);const others=allClients.filter(c=>c.id!==client.id&&!c.partnerFirst);return<Modal title={"🔗 "+t.joinTitle} onClose={onClose} width={520}><div style={{fontSize:12,color:th.muted,marginBottom:12}}><b>{client.firstName} {client.lastName}</b> becomes Person 1. Select Person 2:</div><div style={{maxHeight:240,overflowY:"auto",marginBottom:16}}>{others.map(c=><div key={c.id} onClick={()=>setSel(c)} style={{...mCARD(th),padding:"10px 14px",cursor:"pointer",marginBottom:6,border:`1px solid ${sel?.id===c.id?th.accent:th.cardBorder}`,background:sel?.id===c.id?th.accent+"11":th.card,display:"flex",alignItems:"center",gap:10}}><div style={{width:32,height:32,borderRadius:99,background:c.color1+"22",color:c.color1,border:`2px solid ${c.color1}44`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,flexShrink:0}}>{c.firstName[0]}{c.lastName[0]}</div><div><div style={{fontWeight:600,color:th.text}}>{c.firstName} {c.lastName}</div><div style={{fontSize:11,color:th.dim}}>{c.email}</div></div></div>)}{others.length===0&&<div style={{textAlign:"center",padding:20,color:th.dim,fontSize:12}}>{t.noOtherSingle||"No other single clients available."}</div>}</div><SaveBar onSave={()=>{if(!sel){alert("Select a client first.");return;}onConfirm(sel);}} onCancel={onClose} t={{...t,save:t.confirmJoin}}/></Modal>;}
/* ── INCOME SECTION ──────────────────────────────────────────────────────── */
function IncomeSection({client,onUpdate,t}){const th=useTh();const[modal,setModal]=useState(null);const{sorted,sortK,sortD,toggle}=useSrt(client.incomeStreams,"person","asc");const save=s=>{const ex=client.incomeStreams.find(x=>x.id===s.id);onUpdate({...client,incomeStreams:ex?client.incomeStreams.map(x=>x.id===s.id?s:x):[...client.incomeStreams,s]});setModal(null);};const del=id=>{onUpdate({...client,incomeStreams:client.incomeStreams.filter(x=>x.id!==id)});setModal(null);};const persons=[["p1",client.firstName||t.p1],["p2",client.partnerFirst||t.p2],["joint",t.joint]].filter(([k])=>k!=="p2"||client.partnerFirst);const STH=({k,ch,right})=><th onClick={()=>toggle(k)} style={right?mTHR(th):mTH(th)}>{ch}<SA col={k} sortK={sortK} sortD={sortD}/></th>;return<div>{modal&&<IncomeModal income={modal==="new"?null:modal} client={client} onSave={save} onDelete={modal!=="new"?()=>del(modal.id):null} onClose={()=>setModal(null)} t={t}/>}<SHdr label={"💼 "+t.income} right={<Btn small onClick={()=>setModal("new")}>＋ {t.addIncome}</Btn>}/><div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:600}}><thead><tr><STH k="label" ch={t.sourceLbl||"Source"}/><STH k="person" ch={t.person}/><STH k="freq" ch={t.frequency}/><STH k="net" ch={t.netPerPeriod||"Net / Period"} right/><STH k="gross" ch={t.grossMonthlyCol||"Gross Monthly"} right/><th style={mTHR(th)}>{t.netMonthlyCol||"Net Monthly"}</th><th/></tr></thead><tbody>{sorted.map(s=><tr key={s.id}><td style={{...mTD(th),fontWeight:600}}>{s.label}</td><td style={mTD(th)}><PTag who={s.person} client={client} t={t}/></td><td style={{...mTD(th),fontSize:11,color:th.dim}}>{t[s.freq]||s.freq}</td><td style={{...mTDR(th),fontSize:11,color:th.muted}}>{fmt(s.net)}</td><td style={{...mTDR(th),fontSize:12,color:th.muted}}>{fmt(toM(s.gross,s.freq))}</td><td style={{...mTDR(th),fontWeight:700,color:th.pos}}>{fmt(toM(s.net,s.freq))}</td><td style={mTDR(th)}><Btn small onClick={()=>setModal(s)}>{t.editLabel}</Btn></td></tr>)}<IAdd cols={[{key:"label",placeholder:t.sourceName||"Source name"},{key:"person",type:"select",options:persons.map(([v,l])=>({v,l})),default:"p1"},{key:"freq",type:"select",options:["biweekly","semimonthly","monthly2","weekly"].map(k=>({v:k,l:t[k]})),default:"biweekly"},{key:"gross",placeholder:t.grossPlaceholder||"Gross",numeric:true},{key:"net",placeholder:t.netPlaceholder||"Net",numeric:true}]} onSave={vals=>{if(!vals.label||!vals.net)return false;save({id:gid(),person:vals.person||"p1",label:vals.label,gross:+vals.gross||0,net:+vals.net,freq:vals.freq||"biweekly"});return true;}} label={"＋ "+t.addRow+"…"}/></tbody><tfoot><tr style={{borderTop:`2px solid ${GOLD}44`}}><td colSpan={3} style={{paddingTop:10,fontSize:11,color:th.dim}}>{t.totalLbl||"Total"}</td><td style={{...mTDR(th),paddingTop:10,fontSize:11,color:th.muted,fontWeight:700}}>{fmt((client.incomeStreams||[]).reduce((s,x)=>s+(+x.net||0),0))}</td><td style={{...mTDR(th),paddingTop:10,fontSize:11,color:th.muted}}>{fmt(sumG(client.incomeStreams))}</td><td style={{paddingTop:10,textAlign:"right",fontWeight:800,color:GOLD,fontSize:15}}>{fmt(sumN(client.incomeStreams))}</td><td/></tr></tfoot></table></div></div>;}

/* ── BILLS SECTION ───────────────────────────────────────────────────────── */
function BillsSection({client,onUpdate,t}){const th=useTh();const[modal,setModal]=useState(null);const{sorted,sortK,sortD,toggle}=useSrt(actB(client.bills),"dueDay","asc");const persons=[["p1",client.firstName||t.p1],["p2",client.partnerFirst||t.p2],["joint",t.joint]].filter(([k])=>k!=="p2"||client.partnerFirst);const save=b=>{const ex=client.bills.find(x=>x.id===b.id);onUpdate({...client,bills:ex?client.bills.map(x=>x.id===b.id?b:x):[...client.bills,b]});setModal(null);};const del=id=>{onUpdate({...client,bills:client.bills.filter(x=>x.id!==id)});setModal(null);};const h1=sorted.filter(b=>(b.dueDay||1)<=15),h2=sorted.filter(b=>(b.dueDay||1)>15);const STH=({k,ch,right})=><th onClick={()=>toggle(k)} style={right?mTHR(th):mTH(th)}>{ch}<SA col={k} sortK={sortK} sortD={sortD}/></th>;const BT=({title,rows})=><div style={{marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:6}}>{title}</div><div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}><table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed",minWidth:560}}><colgroup><col style={{width:"26%"}}/><col style={{width:"14%"}}/><col style={{width:"10%"}}/><col style={{width:"12%"}}/><col style={{width:"14%"}}/><col style={{width:"18%"}}/><col style={{width:"6%"}}/></colgroup><thead><tr><STH k="name" ch={t.billName}/><STH k="assignedTo" ch={t.person}/><STH k="dueDay" ch={t.dueDay}/><STH k="type" ch={t.billType}/><STH k="cost" ch={t.monthlyCol} right/><th style={mTH(th)}>{t.responsibilitySplit}</th><th/></tr></thead><tbody>{rows.map(b=>{const mc=toM(b.cost,b.freq);const sp=b.split||{p1:50,p2:50};return<tr key={b.id}><td style={{...mTD(th),fontWeight:600}}>{b.name}{b.type==="temporary"&&<span style={{marginLeft:5}}><Pill color="#F59E0B">TEMP</Pill></span>}</td><td style={mTD(th)}><PTag who={b.assignedTo} client={client} t={t}/></td><td style={{...mTD(th),textAlign:"center",color:th.dim}}>{b.dueDay||"—"}</td><td style={{...mTD(th),fontSize:11,color:th.dim}}>{t[b.type]||b.type}</td><td style={{...mTDR(th),fontWeight:700}}>{fmt(mc)}</td><td style={{...mTD(th),fontSize:10,color:th.dim}}>{b.assignedTo==="joint"&&client.partnerFirst?`${client.firstName}: ${fmt(mc*sp.p1/100)} / ${client.partnerFirst}: ${fmt(mc*sp.p2/100)}`:"—"}</td><td style={mTDR(th)}><Btn small onClick={()=>setModal(b)}>{t.editLabel}</Btn></td></tr>;})}<IAdd cols={[{key:"name",placeholder:t.billNamePh||"Bill name"},{key:"assignedTo",type:"select",options:persons.map(([v,l])=>({v,l})),default:"joint"},{key:"dueDay",placeholder:t.dayPh||"Day",numeric:true},{key:"type",type:"select",options:[{v:"regular",l:t.regular},{v:"temporary",l:t.temporary},{v:"annual",l:t.annual}],default:"regular"},{key:"cost",placeholder:t.amountPh||"Amount",numeric:true}]} onSave={vals=>{if(!vals.name||!vals.cost)return false;save({id:gid(),name:vals.name,assignedTo:vals.assignedTo||"joint",cost:+vals.cost,type:vals.type||"regular",freq:"monthly2",dueDay:Math.min(31,Math.max(1,+vals.dueDay||1)),split:{p1:50,p2:50}});return true;}} label={"＋ "+t.addRow+"…"}/></tbody></table></div></div>;return<div>{modal&&<BillModal bill={modal==="new"?null:modal} client={client} onSave={save} onDelete={modal!=="new"?()=>del(modal.id):null} onClose={()=>setModal(null)} t={t}/>}<SHdr label={"💳 "+t.bills} right={<Btn small onClick={()=>setModal("new")}>＋ {t.addBill}</Btn>}/><BT title={"📅 "+t.period1} rows={h1}/><BT title={"📅 "+t.period2} rows={h2}/><div style={{display:"flex",justifyContent:"flex-end",gap:12,paddingTop:8,borderTop:`1px solid ${GOLD}44`}}><span style={{fontSize:11,color:th.muted}}>{t.totalBills}</span><span style={{fontWeight:800,fontSize:15,color:GOLD}}>{fmt(sumB(client.bills))}</span></div></div>;}

/* ── DEBT SECTION ────────────────────────────────────────────────────────── */
function DebtSection({client,onUpdate,t}){const th=useTh();const[strat,setStrat]=useState("avalanche");const[sortK,setSortK]=useState("apr");const[sortD,setSortD]=useState("desc");const[modal,setModal]=useState(null);const[expP,setExpP]=useState(null);const changeStrat=s=>{setStrat(s);setSortK(s==="avalanche"?"apr":"balance");setSortD("desc");};const tgl=k=>{if(k===sortK)setSortD(d=>d==="asc"?"desc":"asc");else{setSortK(k);setSortD("asc");}};const sorted=[...client.cards].sort((a,b)=>{const av=a[sortK],bv=b[sortK];const r=typeof av==="string"?(av||"").localeCompare(bv||""):(+av||0)-(+bv||0);return sortD==="asc"?r:-r;});const STH=({k,ch,right})=><th onClick={()=>tgl(k)} style={right?mTHR(th):mTH(th)}>{ch}<SA col={k} sortK={sortK} sortD={sortD}/></th>;const save=c=>{const ex=client.cards.find(x=>x.id===c.id);onUpdate({...client,cards:ex?client.cards.map(x=>x.id===c.id?c:x):[...client.cards,c]});setModal(null);};const del=id=>{onUpdate({...client,cards:client.cards.filter(x=>x.id!==id)});setModal(null);};const moInt=totalMoInt(client.cards);return<div>{modal&&<CardModal card={modal==="new"?null:modal} client={client} onSave={save} onDelete={modal!=="new"?()=>del(modal.id):null} onClose={()=>setModal(null)} t={t}/>}<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}><span style={{fontSize:12,fontWeight:700,color:th.accent,letterSpacing:"0.08em",textTransform:"uppercase"}}>💳 {t.debt}</span><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Btn small onClick={()=>setModal("new")}>＋ {t.addCard}</Btn>{[["avalanche","🎯 "+t.avalanche],["snowball","❄️ "+t.snowball]].map(([k,l])=><button key={k} onClick={()=>changeStrat(k)} style={{fontSize:11,padding:"5px 14px",borderRadius:7,cursor:"pointer",background:strat===k?th.accent:th.inp,color:strat===k?"#fff":th.muted,fontWeight:strat===k?800:400,border:`2px solid ${strat===k?th.accent:th.cardBorder}`,transition:"all 0.15s"}}>{l}</button>)}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}><SC label={"💰 "+(t.interestDebtLbl||"Interest Debt")} value={fmt(client.cards.filter(c=>c.apr>0).reduce((s,c)=>s+c.balance,0))} color={th.neg}/><SC label={"✅ "+(t.zeroBalanceLbl||"0% Balance")} value={fmt(client.cards.filter(c=>c.apr===0).reduce((s,c)=>s+c.balance,0))} color={th.pos}/><SC label={"📅 "+(t.monthlyInterestLbl||"Monthly Interest")} value={fmtD(moInt)} color={th.warn}/></div><div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:720}}><thead><tr><STH k="name" ch={t.cardCol||"Card"}/><STH k="owedBy" ch={t.owedByLbl}/><STH k="apr" ch={t.apr||"APR"} right/><STH k="balance" ch={t.balanceCol||"Balance"} right/><STH k="limit" ch={t.availCredit||"Avail Credit"} right/><th style={mTHR(th)}>{t.minPay}</th><STH k="dueDay" ch={t.dueDay} right/><th style={mTHR(th)}>{t.payoffCol||"Payoff"}</th><th/></tr></thead><tbody>{sorted.map((c,idx)=>{const promos=c.promos||[];const op=expP===c.id;const pm=payM(c.balance,c.apr,c.min);return[<tr key={c.id}><td style={{...mTD(th),fontWeight:600}}><div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>{idx===0&&c.apr>0&&<Pill color={th.neg}>🎯 TARGET</Pill>}<span>{c.name}</span>{promos.length>0&&<button onClick={()=>setExpP(op?null:c.id)} style={{fontSize:9,padding:"1px 6px",borderRadius:4,background:"#8B5CF622",color:"#8B5CF6",border:"1px solid #8B5CF633",cursor:"pointer"}}>{promos.length} PROMO ▾</button>}{c.apr===0&&promos.length===0&&<Pill color={th.pos}>0%</Pill>}</div></td><td style={mTD(th)}>{c.owedBy&&c.owedBy!=="joint"?<PTag who={c.owedBy} client={client} t={t}/>:<Pill color="#94A3B8">{t.jointLbl||"Joint"}</Pill>}</td><td style={{...mTDR(th),color:c.apr>0?th.warn:th.pos,fontSize:12}}>{c.apr>0?c.apr+"%":"—"}</td><td style={{...mTDR(th),fontWeight:700,color:c.apr>0?th.neg:th.pos}}>{fmt(c.balance)}</td><td style={{...mTDR(th),fontSize:11,color:c.limit>0?th.pos:th.dim}}>{c.limit>0?fmt(availCredit(c)):"—"}</td><td style={{...mTDR(th),fontWeight:700,color:GOLD}}>{fmtD(c.min)}</td><td style={{...mTDR(th),fontSize:11,color:th.dim}}>{c.dueDay?(t.dayLbl||"Day")+" "+c.dueDay:"—"}</td><td style={{...mTDR(th),color:th.dim,fontSize:11}}>{payL(pm)}</td><td style={mTDR(th)}><Btn small onClick={()=>setModal(c)}>{t.editLabel}</Btn></td></tr>,op&&promos.length>0?<tr key={c.id+"p"}><td colSpan={9} style={{...mTD(th),background:"#8B5CF611",borderTop:"none",paddingLeft:20,paddingBottom:10}}>{promos.map(p=><div key={p.id} style={{fontSize:11,color:"#8B5CF6",marginTop:4}}>🏷 <b>{p.label}</b>: {fmt(p.balance)} @ {p.rate}%{p.end?` · ends ${new Date(p.end).toLocaleDateString("en-US",{month:"short",year:"numeric"})}`:""} · Int: {fmtD(p.balance*(p.rate/100)/12)}/mo</div>)}</td></tr>:null];})}<IAdd cols={[{key:"name",placeholder:t.cardLoanPh||"Card / Loan"},{key:"apr",placeholder:t.aprPh||"APR %",numeric:true},{key:"balance",placeholder:t.balancePh||"Balance",numeric:true},{key:"min",placeholder:t.minPayPh||"Min pay",numeric:true}]} onSave={vals=>{if(!vals.name||!vals.balance)return false;save({id:gid(),name:vals.name,balance:+vals.balance,apr:+vals.apr||0,min:+vals.min||0,limit:0,promos:[],owedBy:"joint",dueDay:null});return true;}} label={"＋ "+t.addRow+"…"}/></tbody><tfoot><tr style={{borderTop:`2px solid ${GOLD}44`}}><td colSpan={3} style={{paddingTop:10,fontSize:11,color:th.dim}}>{t.totalLbl||"Total"}</td><td style={{...mTDR(th),paddingTop:10,fontWeight:800,color:th.neg,fontSize:14}}>{fmt(client.cards.reduce((s,c)=>s+c.balance,0))}</td><td style={{...mTDR(th),paddingTop:10,fontWeight:800,color:th.pos,fontSize:12}}>{fmt(client.cards.reduce((s,c)=>s+availCredit(c),0))}</td><td style={{...mTDR(th),paddingTop:10,fontWeight:800,color:GOLD}}>{fmtD(sumMin(client.cards))}</td><td/><td/><td/></tr></tfoot></table></div></div>;}

/* ── ACCOUNTS & LOANS SECTIONS ───────────────────────────────────────────── */
function AccountsSection({client,onUpdate,t}){const th=useTh();const[modal,setModal]=useState(null);const[view,setView]=useState("all");const hasP2=!!client.partnerFirst;const accounts=client.accounts||[];const filtered=view==="all"?accounts:accounts.filter(a=>a.owner===view||a.owner==="joint");const save=a=>{const ex=accounts.find(x=>x.id===a.id);onUpdate({...client,accounts:ex?accounts.map(x=>x.id===a.id?a:x):[...accounts,a]});setModal(null);};const del=id=>{onUpdate({...client,accounts:accounts.filter(x=>x.id!==id)});setModal(null);};const totLiquid=accounts.filter(a=>ACCT_META[a.type]?.liquid).reduce((s,a)=>s+(+a.value||0),0);const totAll=accounts.reduce((s,a)=>s+(+a.value||0),0);return<div>{modal&&<AccountModal acct={modal==="new"?null:modal} client={client} onSave={save} onDelete={modal!=="new"?()=>del(modal.id):null} onClose={()=>setModal(null)} t={t}/>}<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><span style={{fontSize:12,fontWeight:700,color:th.accent,letterSpacing:"0.08em",textTransform:"uppercase"}}>🏦 {t.accounts}</span><div style={{display:"flex",gap:6}}>{hasP2&&[["all",(t.filterAll||"All")],["p1",client.firstName],["p2",client.partnerFirst]].map(([v,l])=><button key={v} onClick={()=>setView(v)} style={{fontSize:11,padding:"3px 10px",borderRadius:7,cursor:"pointer",background:view===v?th.accent+"22":"transparent",color:view===v?th.accent:th.muted,border:`1px solid ${view===v?th.accent:th.cardBorder}`}}>{l}</button>)}<Btn small onClick={()=>setModal("new")}>＋ {t.addAccount}</Btn></div></div><div style={{display:"flex",flexDirection:"column",gap:6}}>{filtered.map(a=>{const meta=ACCT_META[a.type]||ACCT_META.other;return<div key={a.id} style={{...mCARD(th),padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}><div style={{width:36,height:36,borderRadius:10,background:meta.c+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{meta.icon}</div><div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:th.text}}>{a.name}</div><div style={{display:"flex",gap:6,marginTop:3,flexWrap:"wrap"}}><Pill color={meta.c}>{acctL(a.type)}</Pill><PTag who={a.owner} client={client} t={t}/>{meta.liquid&&<Pill color={th.pos}>💧</Pill>}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:16,fontWeight:800,color:th.pos}}>{fmt(+a.value||0)}</div><Btn small onClick={()=>setModal(a)} style={{marginTop:4}}>{t.editLabel}</Btn></div></div>;})} {!filtered.length&&<div style={{fontSize:12,color:th.dim,fontStyle:"italic"}}>{t.noAccountsMsg||"No accounts."}</div>}</div><div style={{borderTop:`1px solid ${GOLD}44`,paddingTop:8,marginTop:8,display:"flex",gap:20,justifyContent:"flex-end"}}><span style={{fontSize:11,color:th.muted}}>💧 {fmt(totLiquid)}</span><span style={{fontSize:11,color:th.muted,fontWeight:700,color:GOLD}}>{fmt(totAll)} total</span></div></div>;}
function LoansSection({client,onUpdate,t}){const th=useTh();const[modal,setModal]=useState(null);const[view,setView]=useState("all");const hasP2=!!client.partnerFirst;const loans=client.loans||[];const filtered=view==="all"?loans:loans.filter(l=>l.owner===view||l.owner==="joint");const save=l=>{const ex=loans.find(x=>x.id===l.id);onUpdate({...client,loans:ex?loans.map(x=>x.id===l.id?l:x):[...loans,l]});setModal(null);};const del=id=>{onUpdate({...client,loans:loans.filter(x=>x.id!==id)});setModal(null);};const tot=loans.reduce((s,l)=>s+(+l.balance||0),0);return<div>{modal&&<LoanModal loan={modal==="new"?null:modal} client={client} onSave={save} onDelete={modal!=="new"?()=>del(modal.id):null} onClose={()=>setModal(null)} t={t}/>}<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><span style={{fontSize:12,fontWeight:700,color:th.accent,letterSpacing:"0.08em",textTransform:"uppercase"}}>📋 {t.loans}</span><div style={{display:"flex",gap:6}}>{hasP2&&[["all",(t.filterAll||"All")],["p1",client.firstName],["p2",client.partnerFirst]].map(([v,l])=><button key={v} onClick={()=>setView(v)} style={{fontSize:11,padding:"3px 10px",borderRadius:7,cursor:"pointer",background:view===v?th.accent+"22":"transparent",color:view===v?th.accent:th.muted,border:`1px solid ${view===v?th.accent:th.cardBorder}`}}>{l}</button>)}<Btn small onClick={()=>setModal("new")}>＋ {t.addLoan}</Btn></div></div><div style={{display:"flex",flexDirection:"column",gap:6}}>{filtered.map(l=>{const meta=LOAN_META[l.type]||LOAN_META.other;return<div key={l.id} style={{...mCARD(th),padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}><div style={{width:36,height:36,borderRadius:10,background:meta.c+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{meta.icon}</div><div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:th.text}}>{l.name}</div><div style={{display:"flex",gap:6,marginTop:3}}><Pill color={meta.c}>{meta.l}</Pill><PTag who={l.owner} client={client} t={t}/>{l.apr>0&&<Pill color={th.warn}>{l.apr}%</Pill>}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:16,fontWeight:800,color:th.neg}}>{fmt(+l.balance||0)}</div><Btn small onClick={()=>setModal(l)} style={{marginTop:4}}>{t.editLabel}</Btn></div></div>;})} {!filtered.length&&<div style={{fontSize:12,color:th.dim,fontStyle:"italic"}}>{t.noLoansMsg||"No loans."}</div>}</div>{tot>0&&<div style={{borderTop:`1px solid ${th.neg}44`,paddingTop:8,marginTop:8,display:"flex",justifyContent:"flex-end"}}><span style={{fontSize:11,color:th.neg,fontWeight:700}}>{fmt(tot)} total</span></div>}</div>;}

/* ── CUSTOM ASSETS ───────────────────────────────────────────────────────── */
function BulkSnapModal({client,onConfirm,onClose,label,t}){const th=useTh();const snaps=client.monthSnapshots||[];const[sel,setSel]=useState(new Set(snaps.map(s=>s.label)));const toggle=l=>setSel(p=>{const ns=new Set(p);ns.has(l)?ns.delete(l):ns.add(l);return ns;});return<Modal title={"📅 "+(t?.updateHistMonths||"Update Historical Months")} onClose={onClose}><div style={{fontSize:12,color:useTh().muted,marginBottom:12}}>{label}. Only snapshots with full data (●) can be updated.</div><div style={{display:"flex",gap:8,marginBottom:10}}><Btn small onClick={()=>setSel(new Set(snaps.map(s=>s.label)))}>All</Btn><Btn small onClick={()=>setSel(new Set())}>None</Btn></div><div style={{maxHeight:260,overflowY:"auto",display:"flex",flexDirection:"column",gap:4,marginBottom:16}}>{snaps.slice().reverse().map(s=>{const hasDt=!!s.data;const sel2=sel.has(s.label);return<div key={s.label} onClick={()=>hasDt&&toggle(s.label)} style={{...mCARD(th),padding:"8px 12px",display:"flex",alignItems:"center",gap:10,border:`1px solid ${sel2?th.accent:th.cardBorder}`,opacity:hasDt?1:0.4,cursor:hasDt?"pointer":"not-allowed"}}><div style={{width:16,height:16,borderRadius:3,background:sel2?th.accent:th.cardBorder,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff"}}>{sel2&&"✓"}</div><span style={{fontSize:12,color:th.text}}>{s.label}</span>{hasDt&&<span style={{fontSize:9,color:th.pos,marginLeft:4}}>●</span>}{!hasDt&&<span style={{fontSize:10,color:th.dim,marginLeft:"auto"}}>summary only</span>}</div>;})} {!snaps.length&&<div style={{fontSize:12,color:th.dim,textAlign:"center",padding:16}}>No historical snapshots yet.</div>}</div><div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn onClick={onClose}>Cancel</Btn><BSolid onClick={()=>onConfirm(sel)}>Update {sel.size} Month{sel.size!==1?"s":""}</BSolid></div></Modal>;}
function CustomAssetsSection({client,onUpdate,t}){const th=useTh();const[modal,setModal]=useState(null);const[bulkOpen,setBulkOpen]=useState(false);const assets=Array.isArray(client.customAssets)?client.customAssets:[];const total=assets.reduce((s,a)=>s+(+a.value||0),0);const totalDebt=assets.reduce((s,a)=>s+(+a.currentDebt||0),0);const save=a=>{const ex=assets.find(x=>x.id===a.id);const newAssets=ex?assets.map(x=>x.id===a.id?a:x):[...assets,a];onUpdate(syncAssetLoans({...client,customAssets:newAssets}));setModal(null);};const del=id=>{onUpdate(syncAssetLoans({...client,customAssets:assets.filter(x=>x.id!==id),loans:(client.loans||[]).filter(l=>l.linkedAssetId!==id)}));setModal(null);};const cC={"Real Estate":th.pos,"Vehicle":th.blue,"Precious Metals":GOLD,"Business":"#8B5CF6","Collectible":"#06B6D4","Other":th.muted};const cI={"Real Estate":"🏠","Vehicle":"🚗","Precious Metals":"🥇","Business":"🏢","Collectible":"🎨","Other":"💼"};const doBulk=selSnaps=>{const snaps=client.monthSnapshots.map(s=>{if(!selSnaps.has(s.label)||!s.data)return s;return{...s,data:{...s.data,customAssets:[...assets]}};});onUpdate({...client,monthSnapshots:snaps});setBulkOpen(false);};return<div>{modal&&<AssetModal asset={modal==="new"?null:modal} onSave={save} onDelete={modal!=="new"?()=>del(modal.id):null} onClose={()=>setModal(null)} t={t}/>}{bulkOpen&&<BulkSnapModal client={client} onConfirm={doBulk} onClose={()=>setBulkOpen(false)} label={t.saveAssetsToMonths||"Save current assets to selected months"} t={t}/>}<SHdr label={"🏛️ "+t.customAssets} right={<div style={{display:"flex",gap:6}}><Btn small onClick={()=>setModal("new")}>＋ {t.addAsset}</Btn></div>}/>{!assets.length&&<div style={{fontSize:12,color:th.dim,fontStyle:"italic",marginBottom:8}}>{t.noPhysAssets||"No physical assets."}</div>}<div style={{display:"flex",flexDirection:"column",gap:8}}>{assets.map(a=><div key={a.id} style={{...mCARD(th),padding:"10px 14px",display:"flex",alignItems:"center",gap:12}}><div style={{width:36,height:36,borderRadius:10,background:(cC[a.cat]||th.muted)+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{cI[a.cat]||"💼"}</div><div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:th.text}}>{a.name}</div>{a.desc&&<div style={{fontSize:11,color:th.muted}}>{a.desc}</div>}<div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:3}}><Pill color={cC[a.cat]||th.muted}>{physL(a.cat)}</Pill>{+a.currentDebt>0&&<Pill color={th.neg}>{t.debtLbl||"Debt"}: {fmt(a.currentDebt)}</Pill>}{+a.purchaseCost>0&&<Pill color={th.dim}>{t.costLbl||"Cost"}: {fmt(a.purchaseCost)}</Pill>}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:15,fontWeight:800,color:th.pos}}>{fmt(+a.value||0)}</div>{+a.currentDebt>0&&<div style={{fontSize:11,color:th.neg}}>{t.equityLbl||"Equity"}: {fmt((+a.value||0)-(+a.currentDebt||0))}</div>}<Btn small onClick={()=>setModal(a)} style={{marginTop:4}}>{t.editLabel}</Btn></div></div>)}</div>{total>0&&<div style={{display:"flex",justifyContent:"space-between",gap:12,paddingTop:10,marginTop:6,borderTop:`1px solid ${GOLD}44`,flexWrap:"wrap"}}><span style={{fontSize:11,color:th.muted}}>{t.totalValueLbl||"Total Value"}: <b style={{color:th.pos}}>{fmt(total)}</b>{totalDebt>0&&<> · {t.debtLbl||"Debt"}: <b style={{color:th.neg}}>{fmt(totalDebt)}</b> · {t.equityLbl||"Equity"}: <b style={{color:GOLD}}>{fmt(total-totalDebt)}</b></>}</span></div>}</div>;}

/* ── SAVINGS (EF + allocation) ───────────────────────────────────────────── */
function SavingsSection({client,onUpdate,t,reportMode}){const th=useTh();const[alloc,setAl]=useState({stocks:25,retirement:15,realEstate:15,savings:15,vacation:5,other:5,debtRepayment:20,...client.alloc});const[committed,setCommitted]=useState({stocks:false,retirement:false,realEstate:false,savings:false,vacation:false,other:false,debtRepayment:false,...(client.committed||{})});const[efM,setEfM]=useState(client.efMonths||3);const[dirty,setDirty]=useState(false);useEffect(()=>{setAl({stocks:25,retirement:15,realEstate:15,savings:15,vacation:5,other:5,debtRepayment:20,...client.alloc});setCommitted({stocks:false,retirement:false,realEstate:false,savings:false,vacation:false,other:false,debtRepayment:false,...(client.committed||{})});setEfM(client.efMonths||3);setDirty(false);},[client.id]);// eslint-disable-line
const ual=k=>e=>{setAl(p=>({...p,[k]:Math.min(100,Math.max(0,+e.target.value||0))}));setDirty(true);};const liq=liquidA(client);const efTgt=sumB(client.bills)*(efM||3);const efPct=Math.min(100,efTgt>0?liq/efTgt*100:0);const avail=sumN(client.incomeStreams)-sumB(client.bills)-sumMin(client.cards);const ai=[{k:"stocks",l:t.allocStocks||"📈 Stocks",c:th.blue},{k:"retirement",l:t.allocRetirement||"🎯 Retirement",c:"#8B5CF6"},{k:"realEstate",l:t.allocRealEstate||"🏠 Real Estate",c:th.pos},{k:"savings",l:t.allocSavings||"🏦 Savings",c:"#06B6D4"},{k:"vacation",l:t.allocVacation||"✈️ Vacation",c:th.warn},{k:"other",l:t.allocOther||"💡 Other",c:th.muted},{k:"debtRepayment",l:t.allocDebtRepayment||"💳 Debt Repayment",c:th.neg}];const tPct=Object.values(alloc).reduce((s,v)=>s+v,0);const PL=({cx,cy,midAngle,innerRadius,outerRadius,percent})=>{if(percent<0.05)return null;const R=Math.PI/180;const rad=innerRadius+(outerRadius-innerRadius)*0.5;const x=cx+rad*Math.cos(-midAngle*R);const y=cy+rad*Math.sin(-midAngle*R);return<text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700}>{(percent*100).toFixed(0)}%</text>;};const tA=totalA(client),tL=totalL(client);return<div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}><span style={{fontSize:12,fontWeight:700,color:th.accent,letterSpacing:"0.08em",textTransform:"uppercase"}}>💰 {t.savings}</span><div data-ga-grid="kpi-3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,flex:"1 1 320px",minWidth:0}}><SC label={t.lblAssets||"Assets"} value={fmt(tA)} color={th.pos}/><SC label={t.lblLiabilities||"Liabilities"} value={fmt(tL)} color={th.neg}/><SC label={t.netWorth} value={fmt(tA-tL)} color={tA-tL>=0?th.pos:th.neg}/></div></div><AccountsSection client={client} onUpdate={onUpdate} t={t}/><div style={{height:14}}/><LoansSection client={client} onUpdate={onUpdate} t={t}/><div style={{height:14}}/><CustomAssetsSection client={client} onUpdate={onUpdate} t={t}/><div style={{height:14}}/><MarketInvestmentsSection client={client} onUpdate={onUpdate} t={t}/><div style={{height:14}}/><div style={{...mCARD(th),padding:14,marginBottom:14}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:11,fontWeight:700,color:th.dim}}>🛡️ {t.emergencyFundHdr||"EMERGENCY FUND"}</span><select value={efM} onChange={e=>{setEfM(+e.target.value);setDirty(true);}} style={{...mIIN(th),width:96}}>{[1,3,6].map(n=><option key={n} value={n}>{n} {t.months||"months"}</option>)}</select></div><div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:8}}><span style={{color:th.muted}}>{t.liquidColon||"Liquid:"} {fmt(liq)}</span><span style={{color:th.muted}}>{t.targetColon||"Target:"} {fmt(efTgt)}</span><span style={{color:th.muted}}>{t.gapColon||"Gap:"} {fmt(Math.max(0,efTgt-liq))}</span></div><div style={{background:th.cardBorder,borderRadius:99,height:8,overflow:"hidden"}}><div style={{height:"100%",borderRadius:99,width:`${efPct}%`,background:efPct>=100?th.pos:th.warn,transition:"width 0.4s"}}/></div><div style={{fontSize:11,marginTop:4,color:efPct>=100?th.pos:th.warn}}>{efPct.toFixed(0)}% {t.funded||"funded"} {efPct>=100?"✓":""}</div></div><div style={{...mCARD(th),padding:14}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:12,display:"flex",justifyContent:"space-between"}}><span>📊 {t.investAllocHdr||"INVESTMENT ALLOCATION"} <span style={{fontSize:9,color:th.dim,fontWeight:400}}>· {t.checkCommitted||"Check = committed"}</span>{avail<0&&<span style={{marginLeft:8,fontSize:10,background:th.neg+"22",color:th.neg,padding:"2px 8px",borderRadius:4,fontWeight:700}}>⚠️ {t.negativeCashFlow||"NEGATIVE CASH FLOW"}</span>}{!reportMode&&<span style={{marginLeft:10,display:"inline-flex",gap:4}}><button onClick={()=>{setCommitted(Object.fromEntries(ai.map(a=>[a.k,true])));setDirty(true);}} style={{fontSize:9,padding:"2px 7px",borderRadius:5,background:"transparent",color:th.pos,border:`1px solid ${th.pos}55`,cursor:"pointer",fontWeight:600}}>✓ {t.markAll||"Mark all"}</button><button onClick={()=>{setCommitted(Object.fromEntries(ai.map(a=>[a.k,false])));setDirty(true);}} style={{fontSize:9,padding:"2px 7px",borderRadius:5,background:"transparent",color:th.dim,border:`1px solid ${th.cardBorder}`,cursor:"pointer",fontWeight:600}}>✗ {t.clearAll||"Clear all"}</button></span>}</span><div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{color:Math.abs(tPct-100)<1?th.pos:th.warn}}>{tPct}%{Math.abs(tPct-100)<1?" ✓":" ≠ 100%"}</span>{dirty&&<BSolid onClick={()=>{onUpdate({...client,alloc,committed,efMonths:efM});setDirty(false);}} style={{padding:"3px 10px",fontSize:11}}>Save ✓</BSolid>}</div></div><div data-ga-grid="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}><div><div style={{fontSize:11,color:th.dim,marginBottom:8}}>{t.availableColon||"Available:"} <span style={{color:avail>=0?th.pos:th.neg,fontWeight:700}}>{fmt(avail)}/mo</span></div>{(reportMode?ai.filter(a=>(alloc[a.k]||0)>0):ai).map(a=><div key={a.k} style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>{!reportMode&&<input type="checkbox" checked={committed[a.k]||false} onChange={e=>{setCommitted(p=>({...p,[a.k]:e.target.checked}));setDirty(true);}} title={t?.contribCheckHint||"Check = client is actively contributing this amount"} style={{cursor:"pointer",accentColor:a.c,flexShrink:0}}/>}<div style={{width:8,height:8,borderRadius:99,background:a.c,flexShrink:0}}/><span style={{flex:1,fontSize:12,color:committed[a.k]?th.text:th.muted,fontWeight:committed[a.k]?600:400}}>{a.l}</span>{reportMode?<span style={{fontSize:12,color:th.dim,width:44,textAlign:"right"}}>{alloc[a.k]||0}</span>:<MaskedNumInp value={alloc[a.k]||0} onChange={ual(a.k)} onKeyDown={bE} min={0} max={100} style={{...mIIN(th),width:44,textAlign:"right"}}/>}<span style={{fontSize:11,color:th.dim}}>%</span><span style={{fontSize:12,fontWeight:700,color:committed[a.k]?a.c:th.dim,width:56,textAlign:"right"}}>{fmt(Math.max(0,avail)*((alloc[a.k]||0)/100))}</span></div>)}</div><ResponsiveContainer width="100%" height={180} style={{outline:"none"}}><PieChart><Pie data={(reportMode?ai.filter(a=>(alloc[a.k]||0)>0):ai).map(a=>({name:a.l,value:alloc[a.k]||0,color:a.c}))} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value" labelLine={false} label={PL}>{(reportMode?ai.filter(a=>(alloc[a.k]||0)>0):ai).map((a,i)=><Cell key={i} fill={a.c} stroke="none"/>)}<ReTip contentStyle={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:8,fontSize:11}} formatter={(v,n)=>[v+"%",n]}/></Pie></PieChart></ResponsiveContainer></div></div></div>;}

/* ── NOTES ───────────────────────────────────────────────────────────────── */
function NotesSection({client,onUpdate,t,reportMode,settings}){
  const th=useTh();
  const[f,setF]=useState({...client.notes||{}});
  const[sp,setSp]=useState({...(client.servicePlan||{})});
  const[saved,setSaved]=useState(false);
  const[spSaved,setSpSaved]=useState(false);
  const notes=client.notes||{};
  const servicePlan=client.servicePlan||{};
  const hasAny=!!(notes.goals||notes.shortTerm||notes.midTerm||notes.longTerm||notes.setbacks||notes.general);
  const hasPlan=!!(servicePlan.plan||servicePlan.startDate);
  if(reportMode){
    if(!hasAny&&!hasPlan)return null;
    const planSvc=SVCS.find(x=>x.id===servicePlan.plan);
    const planRows=hasPlan?[
      [(t.servicePlanLbl||"Service Plan"),planSvc?(planSvc.icon+" "+planSvc.en):servicePlan.plan],
      [(t.serviceStartLbl||"Started"),servicePlan.startDate],
      [(t.paymentMethodLbl||"Payment method"),servicePlan.paymentMethod]
    ].filter(([,v])=>v):[];
    const rows=[["🎯 "+t.clientGoals,notes.goals],["📅 "+t.shortTerm,notes.shortTerm],["📆 "+t.midTerm,notes.midTerm],["🔭 "+t.longTerm,notes.longTerm],["⚠️ "+t.setbacks,notes.setbacks],["📋 "+t.generalNotes,notes.general]].filter(([,v])=>v);
    return<div style={{...mCARD(th),padding:16,marginBottom:14}}><div style={{fontSize:13,fontWeight:800,color:th.text,marginBottom:14,paddingBottom:8,borderBottom:`2px solid ${th.accent}`}}>📝 {t.notes}</div>{planRows.length>0&&<div style={{marginBottom:14,paddingBottom:10,borderBottom:`1px dashed ${th.cardBorder}`}}><div style={{fontSize:11,fontWeight:700,color:GOLD,marginBottom:6}}>💼 {t.servicePlanSectionHdr||"SERVICE PLAN"}</div>{planRows.map(([l,v])=><div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{color:th.dim}}>{l}</span><span style={{color:th.text,fontWeight:600}}>{v}</span></div>)}</div>}{rows.map(([l,v])=><div key={l} style={{marginBottom:12}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:4}}>{l}</div><div style={{fontSize:12,color:th.muted,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{v}</div></div>)}</div>;
  }
  const onCh=k=>e=>{const v=e.target.value;setF(p=>({...p,[k]:v}));};
  const onSpCh=k=>e=>{const v=e.target.value;setSp(p=>({...p,[k]:v}));};
  const save=()=>{onUpdate({...client,notes:f});setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const saveSp=()=>{onUpdate({...client,servicePlan:sp});setSpSaved(true);setTimeout(()=>setSpSaved(false),2000);};
  const fields=[["🎯 "+t.clientGoals,"goals"],["📅 "+t.shortTerm,"shortTerm"],["📆 "+t.midTerm,"midTerm"],["🔭 "+t.longTerm,"longTerm"],["⚠️ "+t.setbacks,"setbacks"],["📋 "+t.generalNotes,"general"]];
  const INP=mINP(th);
  const stripeUrl=(settings?.stripeLinks||{})[sp.plan]||"";
  const showPay=sp.paymentMethod==="stripe"&&!!stripeUrl;
  const payLater=()=>{const today=new Date().toISOString().slice(0,10);const tag=`[${t.payLater||"Pay Later"} — ${today}]`;const cur=f.general||"";const nf={...f,general:cur?cur+"\n"+tag:tag};setF(nf);onUpdate({...client,notes:nf,servicePlan:sp});setSpSaved(true);setTimeout(()=>setSpSaved(false),2000);};
  const METHOD_OPTS=[["","—"],["stripe",(t.payMethodStripe||"Stripe link")],["cash",(t.payMethodCash||"Cash")],["zelle",(t.payMethodZelle||"Zelle")],["check",(t.payMethodCheck||"Check")],["other",(t.payMethodOther||"Other")]];
  return<div>
  <SHdr label={"💼 "+(t.servicePlanSectionHdr||"Service Plan")} right={<div style={{display:"flex",gap:8,alignItems:"center"}}>{spSaved&&<span style={{fontSize:11,color:th.pos}}>✓ Saved</span>}<BSolid onClick={saveSp}>{t.save}</BSolid></div>}/>
  <Row2>
    <Field label={t.servicePlanLbl||"Service Plan"}><select value={sp.plan||""} onChange={onSpCh("plan")} style={INP}><option value="">—</option>{SVCS.map(svc=><option key={svc.id} value={svc.id}>{svc.icon} {svc.en} ({svc.price})</option>)}</select></Field>
    <Field label={t.serviceStartLbl||"Start Date"}><input type="date" value={sp.startDate||""} onChange={onSpCh("startDate")} style={INP}/></Field>
  </Row2>
  <Row2>
    <Field label={t.paymentMethodLbl||"Payment Method"}><select value={sp.paymentMethod||""} onChange={onSpCh("paymentMethod")} style={INP}>{METHOD_OPTS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field>
    <Field label={t.paymentLinkUrlLbl||"Payment Link URL"}><input value={sp.paymentLinkUrl||""} onChange={onSpCh("paymentLinkUrl")} style={INP} placeholder="https://buy.stripe.com/..."/></Field>
  </Row2>
  {showPay&&<div style={{display:"flex",gap:8,marginTop:2,marginBottom:4}}><button onClick={()=>window.open(stripeUrl,"_blank","noopener")} style={{flex:1,fontSize:12,padding:"7px 12px",borderRadius:8,background:GOLD+"22",color:GOLD,border:`1px solid ${GOLD}66`,cursor:"pointer",fontWeight:700}}>💳 {t.payNow||"Pay Now"}</button><button onClick={payLater} style={{flex:1,fontSize:12,padding:"7px 12px",borderRadius:8,background:th.inp,color:th.muted,border:`1px solid ${th.cardBorder}`,cursor:"pointer",fontWeight:700}}>🕓 {t.payLater||"Pay Later"}</button></div>}
  <div style={{height:1,background:th.cardBorder,margin:"16px 0"}}/>
  <SHdr label={"📝 "+t.notes} right={<div style={{display:"flex",gap:8,alignItems:"center"}}>{saved&&<span style={{fontSize:11,color:th.pos}}>✓ Saved</span>}<BSolid onClick={save}>{t.save}</BSolid></div>}/>
  {fields.map(([label,k])=><Field key={k} label={label}><textarea value={f[k]||""} onChange={onCh(k)} style={{...mINP(th),height:80,resize:"vertical",lineHeight:1.6}} placeholder={t?.notesPh||"Notes…"}/></Field>)}
  </div>;
}

/* ── INTAKE ──────────────────────────────────────────────────────────────── */

const INTAKE_TXT={
  en:{title:"Client Intake Form",subtitle:"Golden Anchor Financial Advisory",helper:"Please fill out this form with your current financial information. Leave blank any rows that don't apply. Your advisor will enter this data into the system.",sectionPersonal:"Personal Information",sectionPartner:"Partner/Spouse Information (if applicable)",sectionIncome:"Income Sources",incomeNote:"List every source of income (jobs, side gigs, rental, investment income). Use gross (before taxes) and net (after taxes).",fieldPerson:"Person (P1/P2/Joint)",fieldLabel:"Source/Job",fieldGross:"Gross Amount",fieldNet:"Net Amount",fieldFreq:"Frequency (weekly/bi-weekly/semi-monthly/monthly/annual)",sectionBills:"Monthly Bills & Expenses",billsNote:"List all regular bills. Assign to P1, P2, or Joint. Include due day (1-31) and type (regular/temporary).",fieldBillName:"Bill Name",fieldCost:"Amount",fieldBillFreq:"Frequency",fieldDue:"Due Day",fieldSplit:"Split % (P1/P2)",fieldType:"Type",sectionCards:"Credit Cards & Debt",cardsNote:"Include ALL credit cards and loans, even ones with $0 balance. List APR (interest rate) as %. If promotional rate applies, note it separately.",fieldCardName:"Card/Loan Name",fieldBalance:"Balance",fieldAPR:"APR (%)",fieldMinPay:"Min Payment",fieldLimit:"Credit Limit",fieldOwner:"Owner (P1/P2/Joint)",sectionAccounts:"Bank & Investment Accounts",accountsNote:"Liquid accounts (checking, savings, money market), investment accounts (brokerage, IRA, 401k).",fieldAcctName:"Account Name",fieldType:"Type (checking/savings/retirement/IRA/brokerage)",fieldValue:"Current Balance",sectionProperties:"Physical Properties",propertiesNote:"Real estate, vehicles, precious metals, collectibles, business ownership.",fieldPropName:"Name",fieldCat:"Category",fieldCurrentValue:"Current Value",fieldPurchase:"Purchase Cost",fieldDebtOwed:"Current Debt",fieldDesc:"Description",sectionGoals:"Financial Goals",shortTermLbl:"Short-Term Goals (0-1 yr)",midTermLbl:"Mid-Term Goals (1-5 yr)",longTermLbl:"Long-Term Goals (5+ yr)",mainGoalsLbl:"Main Goals (what you want to achieve)",generalNotesLbl:"Other Notes",signature:"Client Signature",date:"Date"},
  es:{title:"Formulario de Información del Cliente",subtitle:"Asesoría Financiera Golden Anchor",helper:"Por favor complete este formulario con su información financiera actual. Deje en blanco las filas que no apliquen. Su asesor ingresará esta información al sistema.",sectionPersonal:"Información Personal",sectionPartner:"Información de Pareja/Cónyuge (si aplica)",sectionIncome:"Fuentes de Ingreso",incomeNote:"Liste toda fuente de ingreso (trabajos, ingresos adicionales, alquileres, inversiones). Use bruto (antes de impuestos) y neto (después de impuestos).",fieldPerson:"Persona (P1/P2/Conjunto)",fieldLabel:"Fuente/Trabajo",fieldGross:"Monto Bruto",fieldNet:"Monto Neto",fieldFreq:"Frecuencia (semanal/quincenal/bisemanal/mensual/anual)",sectionBills:"Gastos Mensuales",billsNote:"Liste todos los gastos regulares. Asigne a P1, P2, o Conjunto. Incluya día de pago (1-31) y tipo (regular/temporal).",fieldBillName:"Nombre del Gasto",fieldCost:"Monto",fieldBillFreq:"Frecuencia",fieldDue:"Día de Pago",fieldSplit:"División % (P1/P2)",fieldType:"Tipo",sectionCards:"Tarjetas de Crédito y Deudas",cardsNote:"Incluya TODAS las tarjetas y préstamos, aún los de saldo $0. Liste la tasa (APR) en %. Si aplica tasa promocional, anótela por separado.",fieldCardName:"Nombre Tarjeta/Préstamo",fieldBalance:"Saldo",fieldAPR:"Tasa (%)",fieldMinPay:"Pago Mínimo",fieldLimit:"Límite de Crédito",fieldOwner:"Dueño (P1/P2/Conjunto)",sectionAccounts:"Cuentas Bancarias e Inversiones",accountsNote:"Cuentas líquidas (cheques, ahorros, mercado monetario), cuentas de inversión (corretaje, IRA, 401k).",fieldAcctName:"Nombre de Cuenta",fieldType:"Tipo (cheques/ahorros/retiro/IRA/corretaje)",fieldValue:"Saldo Actual",sectionProperties:"Propiedades Físicas",propertiesNote:"Bienes raíces, vehículos, metales preciosos, coleccionables, negocio.",fieldPropName:"Nombre",fieldCat:"Categoría",fieldCurrentValue:"Valor Actual",fieldPurchase:"Costo de Compra",fieldDebtOwed:"Deuda Actual",fieldDesc:"Descripción",sectionGoals:"Metas Financieras",shortTermLbl:"Metas Corto Plazo (0-1 año)",midTermLbl:"Metas Mediano Plazo (1-5 años)",longTermLbl:"Metas Largo Plazo (5+ años)",mainGoalsLbl:"Metas Principales (qué desea lograr)",generalNotesLbl:"Otras Notas",signature:"Firma del Cliente",date:"Fecha"}
};

const exportIntakePDF=(lang="en",clientName="")=>{
  const L=INTAKE_TXT[lang]||INTAKE_TXT.en;
  const blankRows=(cols,count)=>{let html='';for(let i=0;i<count;i++){html+='<tr>';cols.forEach(()=>{html+='<td>&nbsp;</td>';});html+='</tr>';}return html;};
  const textArea=(rows=3)=>'<div class="textbox" style="min-height:'+(rows*18)+'px"></div>';
  const today=new Date().toLocaleDateString(lang==='es'?'es-US':'en-US',{year:'numeric',month:'long',day:'numeric'});
  const html=`<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"/><title>${L.title} — ${clientName||"Golden Anchor"}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,500;1,6..72,500&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600&family=Plus+Jakarta+Sans:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap">
  <style>
  /* v0.21.0 — Claude Design PDF spec (Prompt 10). Source Serif body, Newsreader italic title,
     Plus Jakarta Sans section headers w/ gold hairline, JetBrains Mono for tables, branded
     header + footer on every page. No emoji. */
  *{box-sizing:border-box}
  body{font-family:'Source Serif 4',Georgia,'Times New Roman',serif;color:#0F172A;max-width:820px;margin:0 auto;padding:18px 32px 28px;font-size:10.5pt;line-height:1.55;background:#FFFFFF;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  /* Branded header — printed at the top of every page-block */
  header.ga-hdr{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:10px;margin-bottom:16px;border-bottom:1px solid #C9A84C;font-family:'Plus Jakarta Sans',system-ui,sans-serif}
  header.ga-hdr .brand{display:flex;align-items:center;gap:10px}
  header.ga-hdr img.mark{width:30px;height:30px;display:block}
  header.ga-hdr .wm{font-family:'Newsreader',Georgia,serif;font-weight:500;letter-spacing:0.14em;font-size:10pt;color:#C9A84C;text-transform:uppercase;line-height:1}
  header.ga-hdr .wm-sub{font-family:'Source Serif 4',serif;font-style:italic;font-size:7.5pt;color:#475569;margin-top:2px}
  header.ga-hdr .meta{text-align:right;font-size:7.5pt;color:#475569;line-height:1.5}
  header.ga-hdr .meta .client{font-weight:600;font-size:9.5pt;color:#0F172A;display:block;margin-bottom:1px}
  /* Report title */
  h1{font-family:'Newsreader',Georgia,serif;font-style:italic;font-weight:500;font-size:22pt;color:#0D1B2A;text-align:center;line-height:1.1;margin:6px 0 4px;letter-spacing:-0.005em}
  .sub{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:8.5pt;color:#475569;text-align:center;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;margin-bottom:14px}
  .helper{background:#FBF5DC;border-left:2px solid #C9A84C;padding:8px 12px;font-size:9.5pt;margin:14px 0;border-radius:3px;color:#475569;line-height:1.6;font-style:italic}
  /* Section headers — Plus Jakarta Sans, gold hairline beneath */
  h2{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:9.5pt;color:#B8901E;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;margin:14px 0 6px;border-bottom:1px solid #C9A84C;padding-bottom:3px;display:flex;align-items:center;gap:6px}
  h2 .rule{flex:1;height:1px;background:transparent}
  .note{font-family:'Source Serif 4',serif;font-size:9pt;color:#475569;font-style:italic;margin-bottom:8px}
  /* Tables — dashed row borders, JetBrains Mono for numeric cells */
  table{width:100%;border-collapse:collapse;margin-bottom:10px}
  thead th{background:transparent;color:#475569;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:8.5pt;font-weight:700;letter-spacing:0.04em;padding:6px 8px;border-bottom:1px solid #C9A84C;text-align:left;text-transform:uppercase}
  thead th[align="right"]{text-align:right}
  tbody td{border-bottom:1px dashed #E2E8F0;padding:6px 8px;height:20px;font-size:9.5pt;color:#0F172A}
  tbody td.num,tbody td[align="right"]{text-align:right;font-family:'JetBrains Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1}
  /* Inline grid for personal-info fields */
  .row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px}
  .field{display:flex;flex-direction:column;gap:3px}
  .field label{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:8.5pt;color:#64748B;font-weight:600;letter-spacing:0.02em}
  .field .box{border:none;border-bottom:1px solid #94A3B8;height:22px;border-radius:0}
  .textbox{border:1px solid #E2E8F0;margin-bottom:8px;border-radius:3px;background:#FAFAFA}
  /* Signature block */
  .sig{margin-top:24px;display:grid;grid-template-columns:2fr 1fr;gap:18px;page-break-inside:avoid}
  .sig .box{border:none;border-bottom:1px solid #0F172A;height:30px;margin-top:20px}
  .sig label{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:8.5pt;color:#475569;font-weight:600;letter-spacing:0.02em}
  /* Footer — disclaimer + page number on every page */
  footer.ga-foot{margin-top:28px;padding-top:10px;border-top:1px solid #C9A84C;display:flex;justify-content:space-between;align-items:flex-start;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:7.5pt;color:#6B7280;letter-spacing:0.02em;gap:14px}
  footer.ga-foot .disclaimer{font-style:italic;max-width:480px;line-height:1.5}
  footer.ga-foot .page{flex-shrink:0;text-align:right}
  /* Print rules */
  @page{margin:18mm 14mm}
  @media print{
    body{padding:0;max-width:none}
    button{display:none!important}
    h1,h2,h3{page-break-after:avoid}
    table,tr{page-break-inside:avoid}
    .sig{page-break-inside:avoid}
  }
  button.print{position:fixed;top:16px;right:16px;padding:10px 20px;background:#C9A84C;color:#0D1B2A;font-weight:800;border:none;border-radius:8px;cursor:pointer;font-size:12px;box-shadow:0 6px 20px rgba(0,0,0,0.18);font-family:'Plus Jakarta Sans',system-ui,sans-serif}
  </style></head><body>
  <button class="print" onclick="window.print()">Print / Save PDF</button>
  <header class="ga-hdr">
    <div class="brand">
      <img class="mark" src="https://finance.goldenanchor.life/anchor-monogram.svg" alt=""/>
      <div>
        <div class="wm">Golden Anchor</div>
        <div class="wm-sub">${lang==='es'?'Coaching Financiero':'Financial Coaching'}</div>
      </div>
    </div>
    <div class="meta">
      <span class="client">${clientName||(lang==='es'?'Nuevo Cliente':'New Client')}</span>
      ${lang==='es'?'Emitido':'Issued'} ${today}
    </div>
  </header>
  <h1>${L.title}</h1>
  <div class="sub">${L.subtitle}</div>
  <div class="helper">${L.helper}</div>

  <h2>${L.sectionPersonal}</h2>
  <div class="row"><div class="field"><label>${lang==='es'?'Nombre':'First Name'}</label><div class="box"></div></div><div class="field"><label>${lang==='es'?'Apellido':'Last Name'}</label><div class="box"></div></div></div>
  <div class="row"><div class="field"><label>${lang==='es'?'Correo':'Email'}</label><div class="box"></div></div><div class="field"><label>${lang==='es'?'Teléfono':'Phone'}</label><div class="box"></div></div></div>
  <div class="row"><div class="field"><label>${lang==='es'?'Dirección':'Address'}</label><div class="box"></div></div><div class="field"><label>${lang==='es'?'Fecha de Nacimiento':'Date of Birth'}</label><div class="box"></div></div></div>
  <div class="row"><div class="field"><label>{t?.social||"SSN"}</label><div class="box"></div></div><div class="field"><label>${lang==='es'?'Referido Por':'Recommended By'}</label><div class="box"></div></div></div>

  <h2>${L.sectionPartner}</h2>
  <div class="row"><div class="field"><label>${lang==='es'?'Nombre':'First Name'}</label><div class="box"></div></div><div class="field"><label>${lang==='es'?'Apellido':'Last Name'}</label><div class="box"></div></div></div>
  <div class="row"><div class="field"><label>${lang==='es'?'Correo':'Email'}</label><div class="box"></div></div><div class="field"><label>${lang==='es'?'Teléfono':'Phone'}</label><div class="box"></div></div></div>
  <div class="row"><div class="field"><label>${lang==='es'?'Fecha de Nacimiento':'Date of Birth'}</label><div class="box"></div></div><div class="field"><label>{t?.social||"SSN"}</label><div class="box"></div></div></div>

  <h2>${L.sectionIncome}</h2>
  <div class="note">${L.incomeNote}</div>
  <table><thead><tr><th style="width:15%">${L.fieldPerson}</th><th style="width:25%">${L.fieldLabel}</th><th style="width:15%">${L.fieldGross}</th><th style="width:15%">${L.fieldNet}</th><th style="width:30%">${L.fieldFreq}</th></tr></thead><tbody>${blankRows([0,0,0,0,0],8)}</tbody></table>

  <h2>${L.sectionBills}</h2>
  <div class="note">${L.billsNote}</div>
  <table><thead><tr><th>${L.fieldBillName}</th><th style="width:10%">${L.fieldCost}</th><th style="width:12%">${L.fieldBillFreq}</th><th style="width:8%">${L.fieldDue}</th><th style="width:12%">${L.fieldSplit}</th><th style="width:10%">${L.fieldType}</th></tr></thead><tbody>${blankRows([0,0,0,0,0,0],15)}</tbody></table>

  <h2>${L.sectionCards}</h2>
  <div class="note">${L.cardsNote}</div>
  <table><thead><tr><th>${L.fieldCardName}</th><th style="width:12%">${L.fieldBalance}</th><th style="width:10%">${L.fieldAPR}</th><th style="width:12%">${L.fieldMinPay}</th><th style="width:12%">${L.fieldLimit}</th><th style="width:14%">${L.fieldOwner}</th></tr></thead><tbody>${blankRows([0,0,0,0,0,0],12)}</tbody></table>

  <h2>${L.sectionAccounts}</h2>
  <div class="note">${L.accountsNote}</div>
  <table><thead><tr><th style="width:30%">${L.fieldAcctName}</th><th style="width:30%">${L.fieldType}</th><th style="width:20%">${L.fieldValue}</th><th style="width:20%">${L.fieldOwner}</th></tr></thead><tbody>${blankRows([0,0,0,0],8)}</tbody></table>

  <h2>${L.sectionProperties}</h2>
  <div class="note">${L.propertiesNote}</div>
  <table><thead><tr><th style="width:22%">${L.fieldPropName}</th><th style="width:15%">${L.fieldCat}</th><th style="width:14%">${L.fieldCurrentValue}</th><th style="width:13%">${L.fieldPurchase}</th><th style="width:13%">${L.fieldDebtOwed}</th><th>${L.fieldDesc}</th></tr></thead><tbody>${blankRows([0,0,0,0,0,0],6)}</tbody></table>

  <h2>${L.sectionGoals}</h2>
  <div class="field"><label>${L.shortTermLbl}</label>${textArea(2)}</div>
  <div class="field"><label>${L.midTermLbl}</label>${textArea(2)}</div>
  <div class="field"><label>${L.longTermLbl}</label>${textArea(2)}</div>
  <div class="field"><label>${L.mainGoalsLbl}</label>${textArea(3)}</div>
  <div class="field"><label>${L.generalNotesLbl}</label>${textArea(2)}</div>

  <div class="sig"><div><label>${L.signature}</label><div class="box"></div></div><div><label>${L.date}</label><div class="box"></div></div></div>
  <footer class="ga-foot">
    <span class="disclaimer">${lang==='es'?'Coaching financiero educativo — no es asesoría de inversión, fiscal ni legal. Golden Anchor · goldenanchor.life':'Educational financial coaching — not investment, tax, or legal advice. Golden Anchor · goldenanchor.life'}</span>
    <span class="page">${today}</span>
  </footer>
  </body></html>`;
  const w=window.open("","_blank","width=900,height=1000");
  if(!w){alert(lang==='es'?"Habilite ventanas emergentes para exportar el PDF":"Please enable pop-ups to export the PDF");return;}
  w.document.open();w.document.write(html);w.document.close();
};

function IntakeSection({client,onUpdate,t,settings}){const th=useTh();const[saved,setSaved]=useState(false);const hasP2=!!client.partnerFirst;const[pf,setPf]=useState({firstName:client.firstName||"",lastName:client.lastName||"",partnerFirst:client.partnerFirst||"",partnerLast:client.partnerLast||"",email:client.email||"",phone:client.phone||"",address:client.address||"",dob:client.dob||"",social:client.social||"",clientType:client.clientType||"financeOnly",recommendedBy:client.recommendedBy||"",p1Phone:client.p1Phone||client.phone||"",p2Phone:client.p2Phone||"",p1Email:client.p1Email||client.email||"",p2Email:client.p2Email||"",p1Dob:client.p1Dob||client.dob||"",p2Dob:client.p2Dob||"",p1Social:client.p1Social||client.social||"",p2Social:client.p2Social||""});const up=k=>e=>setPf(p=>({...p,[k]:e.target.value}));const saveAll=()=>{const now=new Date();const mo=now.getMonth();const yr=now.getFullYear();const label=`${MS[mo]} ${yr}`;const net=sumN(client.incomeStreams),bills=sumB(client.bills),minD=sumMin(client.cards),debt=client.cards.reduce((s,c)=>s+c.balance,0),liq=liquidA(client);const snap={label,year:yr,month:mo+1,income:Math.round(net),bills:Math.round(bills),debt:Math.round(debt),savings:Math.round(liq),cashFlow:Math.round(net-bills-minD),savedAt:new Date().toISOString(),data:{incomeStreams:[...client.incomeStreams],bills:[...client.bills],cards:[...client.cards],accounts:[...(client.accounts||[])],loans:[...(client.loans||[])],customAssets:[...(client.customAssets||[])]}};const existing=client.monthSnapshots.find(s=>s.label===label);const pv=existing?(existing.previousVersions||[]).concat([{savedAt:existing.savedAt||"",income:existing.income,bills:existing.bills,debt:existing.debt,savings:existing.savings,cashFlow:existing.cashFlow,data:existing.data}]):[];const newSnap={...snap,previousVersions:pv};const snaps=existing?client.monthSnapshots.map(s=>s.label===label?newSnap:s):[...client.monthSnapshots,newSnap];onUpdate({...client,...pf,partnerFirst:pf.partnerFirst||null,partnerLast:pf.partnerLast||null,p1Phone:pf.p1Phone,p2Phone:pf.p2Phone,p1Email:pf.p1Email,p2Email:pf.p2Email,p1Dob:pf.p1Dob,p2Dob:pf.p2Dob,p1Social:pf.p1Social,p2Social:pf.p2Social,monthSnapshots:snaps});setSaved(true);setTimeout(()=>setSaved(false),2000);};const INP=mINP(th);const Div=()=><div style={{height:1,background:th.cardBorder,margin:"22px 0"}}/>;return<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><span style={{fontSize:12,fontWeight:700,color:th.accent,letterSpacing:"0.08em",textTransform:"uppercase"}}>📋 {t.intake}</span><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{saved&&<span style={{fontSize:11,color:th.pos,alignSelf:"center"}}>✓ Saved</span>}<Btn small onClick={()=>exportIntakePDF("en",client.firstName+" "+client.lastName)} color={th.blue}>📄 PDF (EN)</Btn><Btn small onClick={()=>exportIntakePDF("es",client.firstName+" "+client.lastName)} color={th.blue}>📄 PDF (ES)</Btn><BSolid onClick={saveAll}>{t.saveAll||"Save All"}</BSolid></div></div><div style={{background:th.accent+"11",border:`1px solid ${th.accent}33`,borderRadius:8,padding:"8px 12px",fontSize:11,color:th.muted,marginBottom:16}}>ℹ️ {t.intakeNote}</div><Row2><Field label={t.firstName}><input style={INP} value={pf.firstName} onChange={up("firstName")}/></Field><Field label={t.lastName}><input style={INP} value={pf.lastName} onChange={up("lastName")}/></Field></Row2><Row2><Field label={t.partnerFirst}><input style={INP} value={pf.partnerFirst} onChange={up("partnerFirst")} placeholder={t?.blankIfSingle||"Blank if single"}/></Field><Field label={t.partnerLast}><input style={INP} value={pf.partnerLast} onChange={up("partnerLast")}/></Field></Row2><Row2><Field label={t.email}><input style={INP} value={pf.email} onChange={up("email")}/></Field><Field label={t.phone}><input style={INP} value={pf.phone} placeholder="(305) 555-0000" onChange={e=>setPf(p=>({...p,phone:fmtPh(e.target.value)}))}/></Field></Row2><Field label={t.address}><input style={INP} value={pf.address} onChange={up("address")}/></Field><Row2><Field label={t.dob}><input type="date" style={INP} value={pf.dob} onChange={up("dob")}/></Field><Field label={t.social}><SSNInput value={pf.social} onChange={up("social")} t={t}/></Field></Row2><Row2><Field label={t.clientType}><select style={INP} value={pf.clientType} onChange={up("clientType")}><option value="financeOnly">{t.financeOnly}</option><option value="financeAndHealth">{t.financeAndHealth}</option></select></Field><Field label={t.recommendedBy}><input style={INP} value={pf.recommendedBy} onChange={up("recommendedBy")}/></Field></Row2>{hasP2&&<><div style={{height:1,background:useTh().cardBorder,margin:"16px 0"}}/><div style={{fontSize:11,fontWeight:700,color:useTh().dim,marginBottom:10}}>👤 {pf.firstName||"Person 1"} — Personal Info</div><Row2><Field label={t?.phone||"Phone"}><input style={INP} value={pf.p1Phone} onChange={e=>setPf(p=>({...p,p1Phone:fmtPh(e.target.value)}))}/></Field><Field label={t?.email||"Email"}><input style={INP} value={pf.p1Email} onChange={up("p1Email")}/></Field></Row2><Row2><Field label={t?.dob||"Date of Birth"}><input type="date" style={INP} value={pf.p1Dob} onChange={up("p1Dob")}/></Field><Field label={t?.social||"SSN"}><SSNInput value={pf.p1Social} onChange={up("p1Social")} t={t}/></Field></Row2><div style={{fontSize:11,fontWeight:700,color:useTh().dim,marginBottom:10,marginTop:12}}>👤 {pf.partnerFirst||"Person 2"} — Personal Info</div><Row2><Field label={t?.phone||"Phone"}><input style={INP} value={pf.p2Phone} onChange={e=>setPf(p=>({...p,p2Phone:fmtPh(e.target.value)}))}/></Field><Field label={t?.email||"Email"}><input style={INP} value={pf.p2Email} onChange={up("p2Email")}/></Field></Row2><Row2><Field label={t?.dob||"Date of Birth"}><input type="date" style={INP} value={pf.p2Dob} onChange={up("p2Dob")}/></Field><Field label={t?.social||"SSN"}><SSNInput value={pf.p2Social} onChange={up("p2Social")} t={t}/></Field></Row2></>}<Div/><IncomeSection client={client} onUpdate={onUpdate} t={t}/><Div/><BillsSection client={client} onUpdate={onUpdate} t={t}/><Div/><DebtSection client={client} onUpdate={onUpdate} t={t}/><Div/><CustomAssetsSection client={client} onUpdate={onUpdate} t={t}/><Div/><NotesSection client={client} onUpdate={onUpdate} t={t} settings={settings}/><div style={{position:"sticky",bottom:0,background:th.card,borderTop:`1px solid ${th.cardBorder}`,padding:"12px 0",display:"flex",justifyContent:"flex-end",gap:8,marginTop:24}}>{saved&&<span style={{fontSize:11,color:th.pos,alignSelf:"center"}}>✓ Saved</span>}<BSolid onClick={saveAll}>{t.saveAllChanges||"Save All Changes"}</BSolid></div></div>;}

/* ── SUMMARY (P1/P2/Both with scaled charts) ─────────────────────────────── */
/* ── SHARED UTILITIES ─────────────────────────────────────────────────────── */
function getClientForMonth(client,selectedMonth){if(!selectedMonth||selectedMonth==="current")return{hClient:client,snap:null,hasData:true,isCur:true};const snap=(client.monthSnapshots||[]).find(s=>s.label===selectedMonth);if(!snap)return{hClient:client,snap:null,hasData:true,isCur:false};if(!snap.data)return{hClient:null,snap,hasData:false,isCur:false};const hClient={...client,incomeStreams:snap.data.incomeStreams||[],bills:snap.data.bills||[],cards:snap.data.cards||[],accounts:snap.data.accounts||[],loans:snap.data.loans||[],customAssets:snap.data.customAssets||[]};return{hClient,snap,hasData:true,isCur:false};}
function saveHistoricalUpdate(client,selMonth,onUpdate,updatedHClient){const snaps=client.monthSnapshots||[];const d={incomeStreams:updatedHClient.incomeStreams,bills:updatedHClient.bills,cards:updatedHClient.cards,accounts:updatedHClient.accounts||[],loans:updatedHClient.loans||[],customAssets:updatedHClient.customAssets||[]};const recalc={income:Math.round(sumN(d.incomeStreams)),bills:Math.round(sumB(d.bills)),debt:Math.round((d.cards||[]).reduce((s,c)=>s+(+c.balance||0),0)+(d.loans||[]).reduce((s,l)=>s+(+l.balance||0),0)),savings:Math.round((d.accounts||[]).filter(a=>ACCT_META[a.type]?.liquid).reduce((s,a)=>s+(+a.value||0),0)),cashFlow:Math.round(sumN(d.incomeStreams)-sumB(d.bills)-(d.cards||[]).reduce((s,c)=>s+(+c.min||0),0))};onUpdate({...client,monthSnapshots:snaps.map(s=>s.label===selMonth?{...s,...recalc,data:d,savedAt:s.savedAt}:s)});}
function MonthSelector({client,value,onChange,t}){const th=useTh();const snaps=client.monthSnapshots||[];const byY={};snaps.forEach(s=>{if(!byY[s.year])byY[s.year]=[];byY[s.year].push(s);});const INP=mINP(th);return<select value={value} onChange={e=>onChange(e.target.value)} style={{...INP,width:"auto",padding:"5px 12px",fontWeight:700}}><option value="current">{"▶ "+(t?.snapCurrentLive||"Current (Live)")}</option>{Object.entries(byY).sort(([a],[b])=>+b-+a).map(([yr,sn])=><optgroup key={yr} label={yr}>{sn.slice().reverse().map(s=><option key={s.label} value={s.label}>{s.label}{s.data?" ●":""}</option>)}</optgroup>)}</select>;}
function PrintBtn({label="🖨️ Print / Save PDF",style={}}){const th=useTh();return<button className="ga-np" onClick={()=>window.print()} style={{fontSize:12,padding:"7px 16px",borderRadius:8,background:GOLD,color:"#0D1B2A",fontWeight:700,border:"none",cursor:"pointer",...style}}>{label}</button>;}
function NoDataMsg({snap}){const th=useTh();return<div style={{...mCARD(th),padding:24,textAlign:"center"}}><div style={{fontSize:18,marginBottom:8}}>📊</div><div style={{fontSize:14,fontWeight:700,color:th.text,marginBottom:12}}>{snap?.label}</div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16,maxWidth:400,margin:"0 auto 16px"}}>{[["Income",snap?.income,th.pos],["Bills",snap?.bills,th.neg],["Debt",snap?.debt,th.warn],["Savings",snap?.savings,th.blue]].map(([l,v,c])=><div key={l}><div style={{fontSize:10,color:th.dim,marginBottom:3}}>{l}</div><div style={{fontSize:15,fontWeight:800,color:c}}>{fmt(v||0)}</div></div>)}</div><div style={{fontSize:11,color:th.dim}}>Full detail data was not saved for this snapshot.<br/>Only summary totals are available.</div></div>;}
function ReportHdr({client,selMonth,isCur,t}){const th=useTh();const now=new Date();const curLabel=`${MS[now.getMonth()]} ${now.getFullYear()}`;const displayMonth=isCur?curLabel:selMonth;return<div style={{...mCARD(th),padding:20,marginBottom:20,background:`linear-gradient(135deg,${th.nav},#1F2937)`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontSize:22,fontWeight:800,color:"#FFFFFF"}}>{client.firstName} {client.lastName}{client.partnerFirst&&<span style={{color:"rgba(255,255,255,0.7)",fontWeight:400}}> & {client.partnerFirst}</span>}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.65)",marginTop:4}}>{client.email}{client.phone?` · ${client.phone}`:""}{client.address?` · ${client.address}`:""}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:22,fontWeight:800,color:GOLD,fontFamily:"Georgia,serif"}}>⚓ Golden Anchor</div><div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginTop:2}}>{mLabel(displayMonth,_gaLang())}{isCur&&<span style={{opacity:0.7}}> · {t.liveSuffix||"Live"}</span>} · {fmtDate(new Date(),_gaLang())}</div></div></div></div>;}
/* ── v0.34.0 — Phase 5 Charts: SmoothAreaLine ──────────────────────────────
   Pure-SVG two-curve area chart. Replaces the Recharts AreaChart in
   SummarySection's debt/savings trend per the Claude Design spec:
     • Smooth curves (Catmull-Rom → cubic Bezier conversion)
     • Gold (#C9A84C) for savings, orange (#ED7D31) for debt
     • Soft vertical gold gradient under the savings curve only
     • 4 horizontal gridlines + JetBrains Mono Y-axis ticks (left)
     • Month abbreviations on the X-axis (no year prefix)
     • Crossover dot marker in gold (first place curves cross)
   No tooltips/labels on data points — totals are shown in the summary
   pills above the chart per Phase 5 rule. */
function SmoothAreaLine({data,height=170,debtColor="#ED7D31",savingsColor=GOLD,bg,muted,dim,labelKey="label",debtKey="debt",savingsKey="savings"}){
  const th=useTh();
  bg=bg||th.card||"transparent";
  muted=muted||th.muted||"#475569";
  dim=dim||th.dim||"#94A3B8";
  const W=600,H=height,padL=46,padR=14,padT=12,padB=28;
  const pts=Array.isArray(data)?data.filter(d=>d):[];
  if(pts.length<2)return<div style={{padding:14,fontSize:11,color:dim,fontStyle:"italic",textAlign:"center"}}>{(pts.length===0?"No data yet":"Need at least 2 months of data")}</div>;
  // Y-range: 0 to nice-rounded max of debt/savings across all points.
  const rawMax=Math.max(0,...pts.map(p=>Math.max(+p[debtKey]||0,+p[savingsKey]||0)));
  const niceMax=(v=>{if(!v)return 1000;const e=Math.pow(10,Math.floor(Math.log10(v)));const n=v/e;const m=n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10;return m*e;})(rawMax);
  const innerW=W-padL-padR,innerH=H-padT-padB;
  const xAt=i=>padL+(pts.length===1?innerW/2:innerW*i/(pts.length-1));
  const yAt=v=>padT+innerH*(1-(v/niceMax));
  // Catmull-Rom → cubic Bezier path for smoother curves than monotone lines.
  const path=(coords,close)=>{
    if(coords.length===0)return"";
    let d="M"+coords[0].x+" "+coords[0].y;
    for(let i=0;i<coords.length-1;i++){
      const p0=coords[i-1]||coords[i],p1=coords[i],p2=coords[i+1],p3=coords[i+2]||coords[i+1];
      const c1x=p1.x+(p2.x-p0.x)/6,c1y=p1.y+(p2.y-p0.y)/6;
      const c2x=p2.x-(p3.x-p1.x)/6,c2y=p2.y-(p3.y-p1.y)/6;
      d+=" C"+c1x+" "+c1y+" "+c2x+" "+c2y+" "+p2.x+" "+p2.y;
    }
    if(close){
      const last=coords[coords.length-1],first=coords[0];
      d+=" L"+last.x+" "+(padT+innerH)+" L"+first.x+" "+(padT+innerH)+" Z";
    }
    return d;
  };
  const savCoords=pts.map((p,i)=>({x:xAt(i),y:yAt(+p[savingsKey]||0)}));
  const debtCoords=pts.map((p,i)=>({x:xAt(i),y:yAt(+p[debtKey]||0)}));
  // 4 Y-tick values: 0, max/3, 2max/3, max (or simpler quartiles)
  const ticks=[0,niceMax/3,niceMax*2/3,niceMax];
  const fmtTick=v=>{if(v>=1e6)return(v/1e6).toFixed(1).replace(/\.0$/,"")+"M";if(v>=1000)return Math.round(v/1000)+"K";return Math.round(v).toString();};
  // Crossover detection between consecutive samples — linear interp for fractional x.
  const crossovers=[];
  for(let i=0;i<pts.length-1;i++){
    const dA=(+pts[i][savingsKey]||0)-(+pts[i][debtKey]||0),dB=(+pts[i+1][savingsKey]||0)-(+pts[i+1][debtKey]||0);
    if(dA===0&&dB===0)continue;
    if((dA<=0&&dB>=0)||(dA>=0&&dB<=0)){
      const t=Math.abs(dA)/(Math.abs(dA)+Math.abs(dB)||1);
      const x=xAt(i)+(xAt(i+1)-xAt(i))*t;
      const yv=(+pts[i][savingsKey]||0)+((+pts[i+1][savingsKey]||0)-(+pts[i+1][savingsKey]||0))*t;
      // recompute the y on the savings curve at the crossover (debt=savings here so either works)
      const yMix=(+pts[i][savingsKey]||0)*(1-t)+(+pts[i+1][savingsKey]||0)*t;
      crossovers.push({x,y:yAt(yMix)});
    }
  }
  // Strip year prefix from labels: "Mar 2026" → "Mar", "Mar '26" → "Mar"
  const xLabel=l=>String(l||"").split(/\s|'/)[0].slice(0,3);
  const gradId=useMemo(()=>"ga-sal-grad-"+Math.random().toString(36).slice(2,8),[]);
  return<div style={{width:"100%",overflow:"hidden"}}>
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{width:"100%",height:"auto",display:"block",fontFamily:"'JetBrains Mono',ui-monospace,Menlo,monospace"}}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={savingsColor} stopOpacity="0.32"/>
          <stop offset="100%" stopColor={savingsColor} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      {/* Gridlines + Y-axis tick labels */}
      {ticks.map((v,i)=>{const y=yAt(v);return<g key={i}>
        <line x1={padL} y1={y} x2={W-padR} y2={y} stroke={dim} strokeOpacity="0.22" strokeDasharray="2 4"/>
        <text x={padL-6} y={y+3} textAnchor="end" fontSize="9" fill={dim}>{fmtTick(v)}</text>
      </g>;})}
      {/* Savings area fill (gold gradient) */}
      <path d={path(savCoords,true)} fill={`url(#${gradId})`} stroke="none"/>
      {/* Debt curve (orange, no fill) */}
      <path d={path(debtCoords,false)} fill="none" stroke={debtColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Savings curve (gold, on top of fill) */}
      <path d={path(savCoords,false)} fill="none" stroke={savingsColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Crossover marker — gold dot with thin navy stroke */}
      {crossovers.map((c,i)=><circle key={i} cx={c.x} cy={c.y} r="4.5" fill={savingsColor} stroke="#0D1B2A" strokeWidth="1.5"/>)}
      {/* X-axis labels */}
      {pts.map((p,i)=><text key={i} x={xAt(i)} y={H-8} textAnchor="middle" fontSize="9" fill={muted}>{xLabel(p[labelKey])}</text>)}
    </svg>
  </div>;
}

function SummarySection({client,lang,t}){const th=useTh();const[view,setView]=useState("both");const hasP2=!!client.partnerFirst;
const scales=useMemo(()=>{if(!hasP2||view==="both")return{debt:1,savings:1};const td=client.cards.reduce((s,c)=>s+(+c.balance||0),0);const ts=liquidA(client);const p1d=client.cards.filter(c=>c.owedBy==="p1"||c.owedBy==="joint").reduce((s,c)=>s+(+c.balance||0)*(c.owedBy==="joint"?0.5:1),0);const p1s=(client.accounts||[]).filter(a=>(a.owner==="p1"||a.owner==="joint")&&ACCT_META[a.type]?.liquid).reduce((s,a)=>s+(+a.value||0)*(a.owner==="joint"?0.5:1),0);if(view==="p1")return{debt:td>0?p1d/td:0.5,savings:ts>0?p1s/ts:0.5};return{debt:td>0?(td-p1d)/td:0.5,savings:ts>0?(ts-p1s)/ts:0.5};},[client,view,hasP2]);
const fI=s=>view==="both"?s:view==="p1"?s.filter(i=>i.person==="p1"||i.person==="joint"):s.filter(i=>i.person==="p2"||i.person==="joint");
const fB=b=>view==="both"?b:b.filter(x=>x.assignedTo===view||x.assignedTo==="joint");
const fC=c=>view==="both"?c:c.filter(x=>x.owedBy==="joint"||x.owedBy===view);
const sB=b=>{if(!hasP2||view==="both")return toM(b.cost,b.freq);const sp=b.split||{p1:50,p2:50};return toM(b.cost,b.freq)*(sp[view]||50)/100;};
const inc=fI(client.incomeStreams).reduce((s,i)=>s+toM(i.net,i.freq),0);
const bls=fB(actB(client.bills)).reduce((s,b)=>s+sB(b),0);
const mnd=fC(client.cards).reduce((s,c)=>s+c.min,0);
const cash=inc-bls-mnd;const dsr=inc>0?mnd/inc:0;
const liveSnap={label:"▶ Now",debt:Math.round(client.cards.reduce((s,c)=>s+(+c.balance||0),0)*scales.debt),savings:Math.round(liquidA(client)*scales.savings)};
const trend=[...(client.monthSnapshots||[]).slice(-4).map(s=>({...s,debt:Math.round((s.debt||0)*scales.debt),savings:Math.round((s.savings||0)*scales.savings)})),liveSnap];
const pie=[{name:"Bills",value:Math.round(bls),color:th.neg},{name:"Min Debt",value:Math.round(mnd),color:th.warn},{name:t.cashFlow,value:Math.round(Math.max(0,cash)),color:th.pos}];
const recs=[];if(dsr>0.5)recs.push({type:"critical",en:`⚠️ Debt ${(dsr*100).toFixed(0)}% of income.`,es:`⚠️ Deuda ${(dsr*100).toFixed(0)}%.`});else if(dsr>0.36)recs.push({type:"warning",en:`DSR ${(dsr*100).toFixed(0)}% exceeds 36%.`,es:`DSR supera 36%.`});if(cash<300)recs.push({type:"warning",en:`Cash flow ${fmt(cash)}/mo tight.`,es:`Flujo ajustado.`});else recs.push({type:"good",en:`✅ Cash flow ${fmt(cash)}/mo healthy.`,es:`✅ Flujo saludable.`});
return<div>{hasP2&&<div style={{display:"flex",gap:6,marginBottom:14}}>{[["both","👥 "+t.viewBoth],["p1","👤 "+client.firstName],["p2","👤 "+client.partnerFirst]].map(([v,l])=><button key={v} onClick={()=>setView(v)} style={{fontSize:11,padding:"5px 12px",borderRadius:8,cursor:"pointer",background:view===v?th.accent+"22":"transparent",color:view===v?th.accent:th.muted,border:`1px solid ${view===v?th.accent:th.cardBorder}`,fontWeight:view===v?700:400}}>{l}</button>)}</div>}<div data-ga-grid="kpi-4" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:16}}><SC label={"💼 "+t.totalIncome} value={fmt(inc)} color={th.pos}/><SC label={"💳 "+t.totalBills} value={fmt(bls)} color={th.neg}/><SC label={"🏦 "+t.minPay} value={fmt(mnd)} color={th.warn}/><SC label={"💰 "+t.cashFlow} value={fmt(cash)} color={cash>=0?th.pos:th.neg}/></div><div data-ga-grid="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}><div style={{...mCARD(th),padding:12}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>📊 WHERE INCOME GOES</div><ResponsiveContainer width="100%" height={130} style={{outline:"none"}}><PieChart><Pie data={pie} cx="50%" cy="50%" innerRadius={36} outerRadius={58} paddingAngle={2} dataKey="value">{pie.map((e,i)=><Cell key={i} fill={e.color} stroke="none"/>)}<ReTip contentStyle={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:8,fontSize:11}} formatter={v=>fmt(v)}/></Pie></PieChart></ResponsiveContainer><div style={{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap"}}>{pie.map(d=><div key={d.name} style={{display:"flex",alignItems:"center",gap:4,fontSize:11}}><div style={{width:8,height:8,borderRadius:99,background:d.color}}/><span style={{color:th.muted}}>{d.name}: <span style={{color:d.color,fontWeight:700}}>{fmt(d.value)}</span></span></div>)}</div></div><div style={{...mCARD(th),padding:12}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,gap:8,flexWrap:"wrap"}}>
    <div style={{fontSize:11,fontWeight:700,color:th.dim}}>📈 {t.debtTrend}{hasP2&&view!=="both"&&<span style={{fontSize:10,color:th.muted}}> (est.)</span>}</div>
    {/* v0.34.0 — totals moved to a small legend pair next to the title (Phase 5 rule:
       no value labels on the chart itself, totals live in the legend / summary). */}
    <div style={{display:"flex",gap:10,fontSize:10,color:th.muted,fontFamily:"'JetBrains Mono',monospace"}}>
      <span style={{display:"inline-flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:99,background:"#ED7D31"}}/>{fmt(trend[trend.length-1]?.debt||0)}</span>
      <span style={{display:"inline-flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:99,background:GOLD}}/>{fmt(trend[trend.length-1]?.savings||0)}</span>
    </div>
  </div>
  <SmoothAreaLine data={trend} height={150}/>
</div></div>{recs.map((r,i)=>{const c=r.type==="critical"?th.neg:r.type==="warning"?th.warn:th.pos;return<div key={i} style={{background:c+"11",border:`1px solid ${c}33`,borderRadius:8,padding:"10px 12px",fontSize:12,color:c,lineHeight:1.6,marginBottom:8}}>{r[lang]||r.en}</div>;})}</div>;}

/* ── MONTHLY TAB ─────────────────────────────────────────────────────────── */
function NMModal({client,onSave,onClose,t}){const th=useTh();const now=new Date();const[yr,setYr]=useState(now.getFullYear());const[mo,setMo]=useState(now.getMonth());const snaps=client.monthSnapshots||[];const net=sumN(client.incomeStreams),bills=sumB(client.bills),minD=sumMin(client.cards),debt=client.cards.reduce((s,c)=>s+c.balance,0),liq=liquidA(client);const snap={label:`${MS[mo]} ${yr}`,year:yr,month:mo+1,income:Math.round(net),bills:Math.round(bills),debt:Math.round(debt),savings:Math.round(liq),cashFlow:Math.round(net-bills-minD),data:{incomeStreams:[...client.incomeStreams],bills:[...client.bills],cards:[...client.cards],accounts:[...(client.accounts||[])],loans:[...(client.loans||[])],customAssets:[...(client.customAssets||[])]}};const existing=snaps.find(s=>s.label===snap.label);const doSave=()=>{const pv=existing?(existing.previousVersions||[]).concat([{savedAt:existing.savedAt||"",income:existing.income,bills:existing.bills,debt:existing.debt,savings:existing.savings,cashFlow:existing.cashFlow,data:existing.data}]):[];onSave({...snap,savedAt:new Date().toISOString(),previousVersions:pv});};const INP=mINP(th);return<Modal title={"📅 "+t.newMonthTitle} onClose={onClose}><div style={{display:"flex",gap:8,marginBottom:14}}><select style={{...INP,flex:1}} value={mo} onChange={e=>setMo(+e.target.value)}>{ML.map((m,i)=><option key={i} value={i}>{m}</option>)}</select><YearInp style={{...INP,width:88}} value={yr} onChange={e=>setYr(+e.target.value||2026)} min={2020} max={2040}/></div>{existing&&<div style={{fontSize:11,color:th.warn,background:th.warn+"11",border:`1px solid ${th.warn}33`,borderRadius:8,padding:"8px 10px",marginBottom:12}}>⚠️ {t.overwriteWarning}</div>}<div style={{...mCARD(th),padding:14,marginBottom:16}}>{[[(t.income||"Income"),fmt(snap.income),th.pos],[(t.bills||"Bills"),fmt(snap.bills),th.neg],[(t.debt||"Debt"),fmt(snap.debt),th.warn],[(t.liquidColon||"Liquid:").replace(":",""),fmt(snap.savings),th.blue],[(t.cashFlow||"Cash Flow"),fmt(snap.cashFlow),snap.cashFlow>=0?th.pos:th.neg]].map(([l,v,c])=><div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:12}}><span style={{color:th.muted}}>{l}</span><span style={{color:c,fontWeight:700}}>{v}</span></div>)}</div><SaveBar onSave={doSave} onCancel={onClose} t={t}/></Modal>;}
function CmpModal({snapshots,onClose,t}){const th=useTh();const n=snapshots.length;const[sel,setSel]=useState(n>=2?[snapshots[n-2].label,snapshots[n-1].label]:[]);const toggle=l=>setSel(p=>p.includes(l)?p.filter(x=>x!==l):[...p,l]);const rows=snapshots.filter(s=>sel.includes(s.label));const fields=[{k:"income",l:"💼 "+(t.income||"Income"),c:th.pos},{k:"bills",l:"💳 "+(t.bills||"Bills"),c:th.neg},{k:"debt",l:"🏦 "+(t.debt||"Debt"),c:th.warn},{k:"savings",l:"💧 "+(t.savings||"Savings"),c:th.blue},{k:"cashFlow",l:"💰 "+(t.cashFlow||"Flow"),c:GOLD}];return<Modal title={"📊 "+t.compareTitle} onClose={onClose} width={640}><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>{snapshots.map(s=><button key={s.label} onClick={()=>toggle(s.label)} style={{fontSize:11,padding:"4px 12px",borderRadius:8,cursor:"pointer",background:sel.includes(s.label)?th.accent+"22":"transparent",color:sel.includes(s.label)?th.accent:th.muted,border:`1px solid ${sel.includes(s.label)?th.accent:th.cardBorder}`}}>{s.label}</button>)}</div>{rows.length>=2?<table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr><th style={mTH(th)}>{t.colMetric||"Metric"}</th>{rows.map(r=><th key={r.label} style={mTHR(th)}>{r.label}</th>)}<th style={mTHR(th)}>Δ</th></tr></thead><tbody>{fields.map(f=>{const vals=rows.map(r=>r[f.k]||0);const ch=vals[vals.length-1]-vals[0];const pct=vals[0]?((ch/vals[0])*100).toFixed(1):0;return<tr key={f.k}><td style={{...mTD(th),color:f.c,fontWeight:600}}>{f.l}</td>{vals.map((v,i)=><td key={i} style={{...mTDR(th),color:f.c}}>{fmt(v)}</td>)}<td style={{...mTDR(th),color:ch>=0?th.pos:th.neg,fontWeight:700}}>{ch>=0?"+":""}{fmt(ch)} ({pct}%)</td></tr>;})}</tbody></table>:<div style={{textAlign:"center",padding:20,color:th.dim}}>Select 2 months.</div>}<div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}><Btn onClick={onClose}>{t.cancel}</Btn></div></Modal>;}
function VHModal({snap,onRestore,onClose,t}){const th=useTh();const versions=snap.previousVersions||[];return<Modal title={`🕒 ${t.versionHistory} — ${snap.label}`} onClose={onClose} width={540}>{!versions.length?<div style={{textAlign:"center",padding:20,color:th.dim}}>{t.noPrevVer||"No previous versions saved."}</div>:versions.slice().reverse().map((v,i)=><div key={i} style={{...mCARD(th),padding:14,marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:12,color:th.muted}}>{t.savedAt}: {v.savedAt?new Date(v.savedAt).toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"}):"Unknown"}</span><Btn small onClick={()=>{onRestore(v);onClose();}} color={th.pos}>{t.restoreVersion}</Btn></div><div style={{display:"flex",gap:16,fontSize:11,flexWrap:"wrap"}}>{[["Income",v.income,th.pos],["Bills",v.bills,th.neg],["Debt",v.debt,th.warn],["Savings",v.savings,th.blue]].map(([l,val,c])=><div key={l}><span style={{color:th.dim}}>{l}: </span><span style={{color:c,fontWeight:700}}>{fmt(val)}</span></div>)}</div></div>)}<div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}><Btn onClick={onClose}>{t.cancel}</Btn></div></Modal>;}
function MDrop({client,selected,onSelect,t}){const th=useTh();const[open,setOpen]=useState(false);const snaps=client.monthSnapshots||[];const byY={};snaps.forEach(s=>{if(!byY[s.year])byY[s.year]=[];byY[s.year].push(s);});return<div style={{position:"relative"}}><button onClick={()=>setOpen(o=>!o)} style={{fontSize:13,fontWeight:700,color:th.text,background:th.inp,border:`1px solid ${th.inpBorder}`,borderRadius:8,padding:"6px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>{selected==="current"?"▶ Current (Live)":selected} <span style={{color:th.dim,fontSize:10}}>▾</span></button>{open&&<div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:99}}/>}{open&&<div style={{position:"absolute",top:"calc(100% + 4px)",left:0,background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:10,padding:6,zIndex:100,minWidth:220,maxHeight:320,overflowY:"auto",boxShadow:"0 12px 40px #000a"}}><button onClick={()=>{onSelect("current");setOpen(false);}} style={{display:"block",width:"100%",textAlign:"left",padding:"7px 12px",fontSize:12,borderRadius:8,cursor:"pointer",background:selected==="current"?th.accent+"22":"transparent",color:selected==="current"?th.accent:th.text,border:"none",fontWeight:700}}>▶ Current (Live) <span style={{fontSize:10,color:th.pos}}>●</span></button>{Object.entries(byY).sort(([a],[b])=>+b-+a).map(([yr,sn])=><div key={yr}><div style={{fontSize:10,fontWeight:700,color:th.dim,padding:"6px 12px 2px"}}>{yr}</div>{sn.slice().reverse().map(s=><button key={s.label} onClick={()=>{onSelect(s.label);setOpen(false);}} style={{display:"block",width:"100%",textAlign:"left",padding:"5px 12px 5px 20px",fontSize:12,borderRadius:8,cursor:"pointer",background:selected===s.label?th.accent+"22":"transparent",color:selected===s.label?th.accent:th.muted,border:"none",fontWeight:selected===s.label?700:400}}>{s.label}{s.data&&<span style={{fontSize:9,marginLeft:4,color:th.pos}}>●</span>}</button>)}</div>)}{!snaps.length&&<div style={{fontSize:11,color:th.dim,padding:"8px 12px",fontStyle:"italic"}}>{t.noData}</div>}</div>}</div>;}
function HistView({snap,client,onUpdate,t,settings}){const th=useTh();const[vm,setVm]=useState(false);const snaps=client.monthSnapshots||[];const doR=v=>{onUpdate({...client,monthSnapshots:snaps.map(s=>s.label===snap.label?{...snap,...v,savedAt:v.savedAt}:s)});};return<div>{vm&&<VHModal snap={snap} onRestore={doR} onClose={()=>setVm(false)} t={t}/>}<div style={{...mCARD(th),padding:10,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",gap:16,fontSize:11}}>{[["Inc",snap.income,th.pos],["Bills",snap.bills,th.neg],["Debt",snap.debt,th.warn],["Sav",snap.savings,th.blue]].map(([l,v,c])=><span key={l} style={{color:th.dim}}>{l}: <b style={{color:c}}>{fmtS(v||0)}</b></span>)}</div>{(snap.previousVersions||[]).length>0&&<Btn small onClick={()=>setVm(true)} color={th.warn}>🕒</Btn>}</div>{snap.data?<FullMonthView hClient={getClientForMonth(client,snap.label).hClient||client} onHUpdate={updated=>saveHistoricalUpdate(client,snap.label,onUpdate,updated)} selMonth={snap.label} snap={snap} isCur={false} t={t} fullPage={true} settings={settings}/>:<NoDataMsg snap={snap}/>}</div>;}
function FullMonthView({hClient,onHUpdate,selMonth,snap,isCur,t,fullPage,lang,reportMode,settings}){const th=useTh();const[sec,setSec]=useState("summary");const secs=[{id:"summary",l:"📊 "+t.summary},{id:"income",l:"💼 "+t.income},{id:"bills",l:"💳 "+t.bills},{id:"debt",l:"🏦 "+t.debt},{id:"savings",l:"💰 "+t.savings},{id:"notes",l:"📝 "+t.notes}];const EditBanner=()=>!isCur?<div style={{background:th.warn+"11",border:`1px solid ${th.warn}33`,borderRadius:8,padding:"8px 12px",fontSize:11,color:th.warn,marginBottom:12}}>✏️ Editing <b>{selMonth}</b> — changes update this month's snapshot.</div>:null;const SD=()=><div style={{height:1,background:th.cardBorder,margin:"24px 0"}}/>;if(fullPage){return<div><EditBanner/><IncomeSection client={hClient} onUpdate={onHUpdate} t={t}/><SD/><BillsSection client={hClient} onUpdate={onHUpdate} t={t}/><SD/><DebtSection client={hClient} onUpdate={onHUpdate} t={t}/><SD/><SavingsSection key={hClient.id+(selMonth||"cur")+"-sv-fp"} client={hClient} onUpdate={onHUpdate} t={t} reportMode={true}/><SD/><CustomAssetsSection client={hClient} onUpdate={onHUpdate} t={t}/>{(hClient.notes?.goals||hClient.notes?.shortTerm||hClient.notes?.midTerm||hClient.notes?.longTerm||hClient.notes?.setbacks||hClient.notes?.general)&&<><SD/><NotesSection client={hClient} onUpdate={onHUpdate} t={t} reportMode={reportMode||false} settings={settings}/></>}</div>;}return<div><EditBanner/>{/* v0.25.0 — sub-tab row wraps to a second line instead of truncating */}<div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",paddingBottom:4}}>{secs.map(s=><button key={s.id} onClick={()=>setSec(s.id)} style={{fontSize:11,padding:"5px 12px",borderRadius:8,whiteSpace:"nowrap",cursor:"pointer",background:sec===s.id?th.accent:"transparent",color:sec===s.id?"#fff":th.muted,fontWeight:sec===s.id?700:400,border:`1px solid ${sec===s.id?th.accent:th.cardBorder}`,flexShrink:0}}>{s.l}</button>)}</div><div style={{background:th.bg+"99",border:`1px solid ${th.cardBorder}`,borderRadius:12,padding:18}}>{sec==="summary"&&<SummarySection client={hClient} lang={lang} t={t}/>}{sec==="income"&&<IncomeSection client={hClient} onUpdate={onHUpdate} t={t}/>}{sec==="bills"&&<BillsSection client={hClient} onUpdate={onHUpdate} t={t}/>}{sec==="debt"&&<DebtSection client={hClient} onUpdate={onHUpdate} t={t}/>}{sec==="savings"&&<SavingsSection key={hClient.id+(selMonth||"cur")+"-sv"} client={hClient} onUpdate={onHUpdate} t={t} reportMode={false}/>}{sec==="customAssets"&&<CustomAssetsSection client={hClient} onUpdate={onHUpdate} t={t}/>}{sec==="notes"&&<NotesSection client={hClient} onUpdate={onHUpdate} t={t} settings={settings}/>}</div></div>;}
function MonthlyTab({client,onUpdate,lang,t,settings}){const th=useTh();const[nmO,setNmO]=useState(false);const[cmpO,setCmpO]=useState(false);const[vmO,setVmO]=useState(null);const[view,setView]=useState("current");const snaps=client.monthSnapshots||[];const isCur=view==="current";const snap=!isCur?snaps.find(s=>s.label===view):null;const saveSnap=snap=>{const i=snaps.findIndex(s=>s.label===snap.label);const upd=i>=0?snaps.map((s,idx)=>idx===i?snap:s):[...snaps,snap];onUpdate({...client,monthSnapshots:upd});setNmO(false);};const now=new Date();const curLabel=`${MS[now.getMonth()]} ${now.getFullYear()}`;const curSnap=snaps.find(s=>s.label===curLabel);return<div>{nmO&&<NMModal client={client} onSave={saveSnap} onClose={()=>setNmO(false)} t={t}/>}{cmpO&&snaps.length>=2&&<CmpModal snapshots={snaps} onClose={()=>setCmpO(false)} t={t}/>}{vmO&&<VHModal snap={vmO} onRestore={v=>{const i=snaps.findIndex(s=>s.label===vmO.label);if(i>=0)onUpdate({...client,monthSnapshots:snaps.map((s,idx)=>idx===i?{...s,...v,savedAt:v.savedAt}:s)});setVmO(null);}} onClose={()=>setVmO(null)} t={t}/>}<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><MDrop client={client} selected={view} onSelect={setView} t={t}/><div style={{display:"flex",gap:8}}>{curSnap&&(curSnap.previousVersions||[]).length>0&&<Btn small onClick={()=>setVmO(curSnap)} color={th.warn}>🕒 {t.recoverMonth}</Btn>}{snaps.length>=2&&<Btn small onClick={()=>setCmpO(true)}>{t.compareMonths}</Btn>}<Btn small onClick={()=>setNmO(true)} color={th.pos}>＋ {t.newMonth}</Btn></div></div>{!isCur&&snap?<><div style={{...mCARD(th),padding:10,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontWeight:700,color:th.muted}}>📅 {snap.label}</span><button onClick={()=>setView("current")} style={{fontSize:11,padding:"3px 10px",borderRadius:8,background:"none",color:th.accent,border:`1px solid ${th.accent}`,cursor:"pointer"}}>{t.back}</button></div><HistView snap={snap} client={client} onUpdate={onUpdate} t={t} settings={settings}/></>:<><FullMonthView hClient={client} onHUpdate={onUpdate} selMonth="current" snap={null} isCur={true} t={t} lang={lang} settings={settings}/></>}</div>;}
/* ── CASH FLOW STATEMENT ─────────────────────────────────────────────────── */
function CashFlowStatement({client,t}){const th=useTh();const net=sumN(client.incomeStreams);const bills=sumB(client.bills);const minD=sumMin(client.cards);const operCF=net-bills-minD;const alloc=client.alloc||{};const committed=client.committed||{};const avail=Math.max(0,operCF);
  // Only committed allocations count as actual contributions
  const sav={retirement:committed.retirement?avail*(alloc.retirement||0)/100:0,stocks:committed.stocks?avail*(alloc.stocks||0)/100:0,vacation:committed.vacation?avail*(alloc.vacation||0)/100:0,savings:committed.savings?avail*(alloc.savings||0)/100:0,other:committed.other?avail*(alloc.other||0)/100:0,realEstate:committed.realEstate?avail*(alloc.realEstate||0)/100:0,debtRepayment:committed.debtRepayment?avail*(alloc.debtRepayment||0)/100:0};
  const totalSav=Object.values(sav).reduce((a,b)=>a+b,0);
  // Actual liquid savings
  const actualLiq=(client.accounts||[]).filter(a=>ACCT_META[a.type]?.liquid).reduce((s,a)=>s+(+a.value||0),0);
  const netCF=operCF-totalSav;const dsr=net>0?minD/net:0;const savRate=net>0?totalSav/net:0;
  const SRow=({label,value,color,bold,indent,line})=><div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderTop:line?`2px solid ${GOLD}44`:`1px solid ${th.cardBorder}22`,paddingLeft:indent?12:0}}><span style={{fontSize:bold?13:12,color:bold?th.text:th.muted,fontWeight:bold?700:400}}>{label}</span><span style={{fontSize:bold?14:12,fontWeight:bold?800:600,color:color||th.muted}}>{fmt(value)}/mo</span></div>;
  return<div style={{...mCARD(th),padding:16}}><div style={{fontSize:12,fontWeight:800,color:th.text,marginBottom:12,borderBottom:`2px solid ${th.accent}`,paddingBottom:6}}>💰 {t.cashFlowStmtHdr||"CASH FLOW STATEMENT"}</div><div data-ga-grid="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}><div><div style={{fontSize:11,fontWeight:700,color:th.pos,marginBottom:6}}>📥 {t.inflowsHdr||"INFLOWS"}</div>{client.incomeStreams.map(s=><SRow key={s.id} label={"  "+s.label} value={toM(s.net,s.freq)} indent/>)}<SRow label={t.totalInflowsRow||"Total Inflows"} value={net} color={th.pos} bold/><div style={{fontSize:11,fontWeight:700,color:th.neg,marginBottom:6,marginTop:12}}>📤 {t.outflowsHdr||"OUTFLOWS"}</div>{actB(client.bills).slice(0,5).map(b=><SRow key={b.id} label={"  "+b.name} value={toM(b.cost,b.freq)} indent/>)}{actB(client.bills).length>5&&<div style={{fontSize:10,color:th.dim,paddingLeft:12}}>+{actB(client.bills).length-5} more…</div>}<SRow label={t.totalOutflowsRow||"Total Outflows"} value={bills} color={th.neg} bold/><div style={{fontSize:11,fontWeight:700,color:th.warn,marginBottom:6,marginTop:12}}>💳 {t.debtServiceHdr||"DEBT SERVICE"}</div>{client.cards.filter(c=>c.min>0).map(c=><SRow key={c.id} label={"  "+c.name} value={c.min} indent/>)}<SRow label={t.totalDebtServiceRow||"Total Debt Service"} value={minD} color={th.warn} bold/><SRow label={"⚡ "+(t.operatingCashFlow||"OPERATING CASH FLOW")} value={operCF} color={operCF>=0?th.pos:th.neg} bold line/></div><div><div style={{fontSize:11,fontWeight:700,color:"#8B5CF6",marginBottom:6}}>💹 {t.committedContribHdr||"COMMITTED CONTRIBUTIONS"}</div>{totalSav===0?<div style={{fontSize:11,color:th.dim,fontStyle:"italic",padding:"4px 0"}}>{t.noCommittedAlloc||"No committed allocations. Check boxes in Investment Allocation to activate."}</div>:[["  "+(t.allocRetirement||"🎯 Retirement").replace(/^[^\s]+\s/,""),sav.retirement],["  "+(t.allocStocks||"📈 Stocks").replace(/^[^\s]+\s/,""),sav.stocks],["  "+(t.allocSavings||"🏦 Savings").replace(/^[^\s]+\s/,""),sav.savings],["  "+(t.allocVacation||"✈️ Vacation").replace(/^[^\s]+\s/,""),sav.vacation],["  "+(t.allocRealEstate||"🏠 Real Estate").replace(/^[^\s]+\s/,""),sav.realEstate],["  "+(t.allocOther||"💡 Other").replace(/^[^\s]+\s/,""),sav.other],["  "+(t.allocDebtRepayment||"💳 Debt Repayment").replace(/^[^\s]+\s/,""),sav.debtRepayment]].filter(([,v])=>v>0).map(([l,v])=><SRow key={l} label={l} value={v} indent/>)}<SRow label={t.totalCommittedRow||"Total Committed"} value={totalSav} color="#8B5CF6" bold/><div style={{fontSize:11,fontWeight:700,color:th.blue,marginTop:12,marginBottom:6}}>💰 {t.actualLiquidSavings||"ACTUAL LIQUID SAVINGS"}</div><SRow label={t.checkingPlusSavings||"Checking + Savings"} value={actualLiq} color={th.blue} bold/><SRow label={"💎 "+(t.netCashFlowAfterAlloc||"NET CASH FLOW (after allocations)")} value={netCF} color={netCF>=0?th.pos:th.neg} bold line/><div style={{marginTop:16,display:"flex",flexDirection:"column",gap:8}}>{[{l:t.debtServiceRatio||"Debt Service Ratio",v:(dsr*100).toFixed(1)+"%",c:dsr>0.36?th.neg:dsr>0.2?th.warn:th.pos,bm:"< 36%"},{l:t.savingsRate||"Savings Rate",v:(savRate*100).toFixed(1)+"%",c:savRate>=0.2?th.pos:savRate>=0.1?th.warn:th.neg,bm:"> 20%"},{l:t.annualOperatingCashFlow||"Annual Operating Cash Flow",v:fmt(netCF*12),c:netCF>=0?GOLD:th.neg,bm:""}].map(r=><div key={r.l} style={{...mCARD(th),padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:11,color:th.muted}}>{r.l}</div>{r.bm&&<div style={{fontSize:10,color:th.muted,fontWeight:600}}>{t.target||"Target"}: {r.bm}</div>}</div><span style={{fontSize:14,fontWeight:800,color:r.c}}>{r.v}</span></div>)}</div></div></div></div>;}


/* ── FINANCIAL STATEMENTS (P1/P2 filtering fixed) ────────────────────────── */
function RatioContent({client,lang,t,filterView}){const th=useTh();const view=filterView||"both";const hasP2=!!client.partnerFirst;const fA=arr=>view==="both"||!hasP2?arr:(arr||[]).filter(a=>(a.owner||"joint")===view||(a.owner||"joint")==="joint");const fC=arr=>view==="both"||!hasP2?arr:(arr||[]).filter(c=>(c.owedBy||"joint")===view||(c.owedBy||"joint")==="joint");const fI=arr=>view==="both"||!hasP2?arr:(arr||[]).filter(s=>s.person===view||s.person==="joint");const accounts=fA(client.accounts||[]);const cards=fC(client.cards||[]);const loans=fA(client.loans||[]);const income=fI(client.incomeStreams||[]);const tA=(accounts.reduce((s,a)=>s+(+a.value||0),0))+((client.customAssets||[]).reduce((s,a)=>s+(view==="both"||!hasP2?1:0.5)*(+a.value||0),0));const tL=cards.reduce((s,c)=>s+(+c.balance||0),0)+loans.reduce((s,l)=>s+(+l.balance||0),0);const net=income.reduce((s,i)=>s+toM(i.net,i.freq),0);const gross=income.reduce((s,i)=>s+toM(i.gross,i.freq),0);const bills=sumB(client.bills);const minD=cards.reduce((s,c)=>s+(+c.min||0),0);const liq=accounts.filter(a=>ACCT_META[a.type]?.liquid).reduce((s,a)=>s+(+a.value||0),0);const retire=accounts.filter(a=>ACCT_META[a.type]?.invest).reduce((s,a)=>s+(+a.value||0),0);const ccBal=cards.reduce((s,c)=>s+(+c.balance||0),0);const _avail447=Math.max(0,net-bills-minD);const _retContrib447=(client.alloc?.retirement||0)/100*_avail447;const ratios=[{k:"currentRatio",v:ccBal>0?liq/ccBal:999},{k:"dta",v:tA>0?tL/tA:(tL>0?99:0)},{k:"dsr",v:net>0?minD/net:(minD>0?99:0)},{k:"rsr",v:gross>0?_retContrib447/gross:0},{k:"efr",v:bills>0?liq/bills:0}];const bm={currentRatio:"> 1.0x",dta:"< 40%",dsr:"< 36%",rsr:"> 12%",efr:`> ${client.efMonths} mo`};return<div><div data-ga-grid="kpi-3" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}><SC label={"📊 "+t.totalAssets} value={fmt(tA)} color={th.pos}/><SC label={"📋 "+t.totalLiabilities} value={fmt(tL)} color={th.neg}/><SC label={"💎 "+t.netWorth} value={fmt(tA-tL)} color={tA-tL>=0?th.pos:th.neg}/></div><div style={{display:"flex",flexDirection:"column",gap:10}}>{ratios.map(r=>{const meta=RATIOS_META[r.k];return<div key={r.k} style={{...mCARD(th),padding:"14px 16px"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}><div style={{display:"flex",alignItems:"center"}}><span style={{fontSize:13,fontWeight:700,color:th.text}}>{r.k==="currentRatio"?(t.liquidityRatio||"Liquidity Ratio"):t[r.k]}</span><InfoTip text={meta[lang]||meta.en}/></div><div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:11,color:th.muted,fontWeight:600}}>{t.benchmark}: {bm[r.k]}</span><span style={{fontSize:16,fontWeight:800,color:ratColor(r.k,r.v,th)}}>{meta.fmt(r.v)}</span><SBadge value={r.v} meta={meta} t={t} ratioKey={r.k}/></div></div></div>;})} </div></div>;}
function FinancialStatementsTab({client,lang,t,fullPage,skipRatios}){const th=useTh();const[sec,setSec]=useState("balance");const[view,setView]=useState("both");const hasP2=!!client.partnerFirst;const vF=arr=>view==="both"||!hasP2?arr:(arr||[]).filter(a=>(a.owner||"joint")===view||(a.owner||"joint")==="joint");const vFC=arr=>view==="both"||!hasP2?arr:(arr||[]).filter(c=>(c.owedBy||"joint")===view||(c.owedBy||"joint")==="joint");const vFI=arr=>view==="both"||!hasP2?arr:(arr||[]).filter(s=>s.person===view||s.person==="joint");const accounts=vF(client.accounts||[]);const loans=vF(client.loans||[]);const cards=vFC(client.cards||[]);const incStreams=vFI(client.incomeStreams||[]);const curA=accounts.filter(a=>ACCT_META[a.type]?.liquid).reduce((s,a)=>s+(+a.value||0),0);const invA=accounts.filter(a=>ACCT_META[a.type]?.invest).reduce((s,a)=>s+(+a.value||0),0);const hhA=accounts.filter(a=>!ACCT_META[a.type]?.liquid&&!ACCT_META[a.type]?.invest).reduce((s,a)=>s+(+a.value||0),0)+(view==="both"||!hasP2?(client.customAssets||[]).reduce((s,a)=>s+(+a.value||0),0):0);const tA=curA+invA+hhA;const curL=cards.reduce((s,c)=>s+(+c.balance||0),0);const ltL=loans.reduce((s,l)=>s+(+l.balance||0),0);const tL=curL+ltL;const net=incStreams.reduce((s,i)=>s+toM(i.net,i.freq),0);const bills=view==="both"||!hasP2?sumB(client.bills):actB(client.bills).filter(b=>b.assignedTo===view||b.assignedTo==="joint").reduce((s,b)=>{const sp=b.split||{p1:50,p2:50};return s+toM(b.cost,b.freq)*(sp[view]||50)/100;},0);const vare=(client.alloc?.retirement||0)/100;const varo=(client.alloc?.other||0)/100;const ytdMo=new Date().getMonth()+1;const BRow=({label,value,bold,indent,color})=><tr><td style={{...mTD(th),paddingLeft:indent?20:0,fontWeight:bold?700:400,color:bold?th.text:th.muted,fontSize:12}}>{label}</td><td style={{...mTDR(th),fontWeight:bold?700:400,color:color||(bold?th.accent:th.muted),fontSize:bold?14:12}}>{fmt(+value||0)}</td></tr>;const IRow=({label,monthly,annual,bold,color})=><tr><td style={{...mTD(th),fontWeight:bold?700:400,color:bold?th.text:th.muted,fontSize:12}}>{label}</td><td style={{...mTDR(th),fontWeight:bold?700:400,color:color||th.muted,fontSize:12}}>{fmt(monthly)}</td><td style={{...mTDR(th),fontWeight:bold?700:400,color:color||th.muted,fontSize:11,opacity:0.8}}>{fmt(monthly*ytdMo)}</td><td style={{...mTDR(th),fontWeight:bold?700:400,color:color||th.muted,fontSize:12}}>{fmt(annual)}</td></tr>;const secs=[{id:"balance",l:"📊 "+t.balanceSheet},{id:"al",l:t.assetsLiabSec||"⚖️ Assets & Liabilities"},{id:"income",l:"📋 "+t.incomeStatement},{id:"cashflow",l:t.cashFlowSec||"💰 Cash Flow"},{id:"ratios",l:"📐 "+t.ratios}];const SD=()=><div style={{height:1,background:th.cardBorder,margin:"28px 0"}}/>;const SH=({label})=><div style={{fontSize:13,fontWeight:800,color:th.text,marginBottom:14,paddingBottom:8,borderBottom:`2px solid ${th.accent}`}}>{label}</div>;return<div>{!fullPage&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{secs.map(s=><button key={s.id} onClick={()=>setSec(s.id)} style={{fontSize:11,padding:"5px 12px",borderRadius:8,cursor:"pointer",background:sec===s.id?th.accent:"transparent",color:sec===s.id?"#fff":th.muted,fontWeight:sec===s.id?700:400,border:`1px solid ${sec===s.id?th.accent:th.cardBorder}`}}>{s.l}</button>)}</div>{hasP2&&<div style={{display:"flex",gap:6}}>{[["both","Both"],["p1",client.firstName],["p2",client.partnerFirst]].map(([v,l])=><button key={v} onClick={()=>setView(v)} style={{fontSize:11,padding:"3px 10px",borderRadius:7,cursor:"pointer",background:view===v?th.accent+"22":"transparent",color:view===v?th.accent:th.muted,border:`1px solid ${view===v?th.accent:th.cardBorder}`}}>{l}</button>)}</div>}</div>}
{(sec==="balance"||fullPage)&&<div>{fullPage&&<SH label={"📊 "+(t?.balanceSheet||"Balance Sheet")}/>}<div data-ga-grid="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}><div style={{...mCARD(th),padding:16}}><div style={{fontSize:12,fontWeight:800,color:th.text,marginBottom:10,borderBottom:`2px solid ${th.pos}`,paddingBottom:6}}>📊 {t.assetsHdr||"ASSETS"}</div><table style={{width:"100%",borderCollapse:"collapse"}}><tbody><tr><td colSpan={2} style={{...mTD(th),fontSize:11,fontWeight:700,color:th.pos,paddingTop:8}}>🏦 {t.currentAssets}</td></tr>{accounts.filter(a=>ACCT_META[a.type]?.liquid).map(a=><BRow key={a.id} label={"  "+a.name} value={a.value} indent/>)}<BRow label={"  Total Current"} value={curA} bold color={th.blue}/><tr><td colSpan={2} style={{...mTD(th),fontSize:11,fontWeight:700,color:th.pos,paddingTop:8}}>📈 {t.investmentAssets}</td></tr>{accounts.filter(a=>ACCT_META[a.type]?.invest).map(a=><BRow key={a.id} label={"  "+a.name} value={a.value} indent/>)}<BRow label={"  Total Investment"} value={invA} bold color={th.blue}/><tr><td colSpan={2} style={{...mTD(th),fontSize:11,fontWeight:700,color:th.pos,paddingTop:8}}>🏠 {t.householdAssets}</td></tr>{accounts.filter(a=>!ACCT_META[a.type]?.liquid&&!ACCT_META[a.type]?.invest).map(a=><BRow key={a.id} label={"  "+a.name} value={a.value} indent/>)}<BRow label={"  Total Household"} value={hhA} bold color={th.blue}/></tbody></table><div style={{borderTop:`2px solid ${GOLD}`,paddingTop:10,marginTop:6,display:"flex",justifyContent:"space-between"}}><span style={{fontSize:14,fontWeight:800}}>{t.totalAssetsUpper||"TOTAL ASSETS"}</span><span style={{fontSize:16,fontWeight:800,color:th.pos}}>{fmt(tA)}</span></div></div><div style={{...mCARD(th),padding:16}}><div style={{fontSize:12,fontWeight:800,color:th.text,marginBottom:10,borderBottom:`2px solid ${th.neg}`,paddingBottom:6}}>📋 {t.liabNetWorthHdr||"LIABILITIES & NET WORTH"}</div><table style={{width:"100%",borderCollapse:"collapse"}}><tbody><tr><td colSpan={2} style={{...mTD(th),fontSize:11,fontWeight:700,color:th.neg,paddingTop:8}}>💳 Current Liabilities</td></tr>{cards.map(c=><BRow key={c.id} label={"  "+c.name} value={c.balance} indent/>)}<BRow label={"  Total Current"} value={curL} bold color={th.neg}/><tr><td colSpan={2} style={{...mTD(th),fontSize:11,fontWeight:700,color:th.neg,paddingTop:8}}>🏦 {t.longTermLiabilities}</td></tr>{loans.map(l=><BRow key={l.id} label={"  "+l.name} value={l.balance} indent/>)}<BRow label={"  Total Long-Term"} value={ltL} bold color={th.neg}/></tbody></table><div style={{borderTop:`2px solid ${th.neg}`,paddingTop:10,marginTop:6,display:"flex",justifyContent:"space-between"}}><span style={{fontSize:14,fontWeight:800}}>{t.totalLiabUpper||"TOTAL LIABILITIES"}</span><span style={{fontSize:16,fontWeight:800,color:th.neg}}>{fmt(tL)}</span></div><div style={{borderTop:`3px double ${GOLD}`,paddingTop:12,marginTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:15,fontWeight:800,color:GOLD}}>💎 NET WORTH</span><span style={{fontSize:20,fontWeight:800,color:tA-tL>=0?th.pos:th.neg}}>{fmt(tA-tL)}</span></div></div></div></div>}
{fullPage&&<SD/>}
{(sec==="al"||fullPage)&&<div style={{marginTop:fullPage?28:0}}>{fullPage&&<SH label={"⚖️ "+(t?.assetsLiabTitle||"Assets & Liabilities (Current / Non-Current)")}/>}<AssetsLiabilitiesTab client={client} lang={lang} t={t}/></div>}{(sec==="income"||fullPage)&&(()=>{const regBills=actB(client.bills).filter(b=>b.type!=="temporary").filter(b=>view==="both"||!hasP2||b.assignedTo===view||b.assignedTo==="joint");const tempBills=actB(client.bills).filter(b=>b.type==="temporary").filter(b=>view==="both"||!hasP2||b.assignedTo===view||b.assignedTo==="joint");const regBillsMo=view==="both"||!hasP2?regBills.reduce((s,b)=>s+toM(b.cost,b.freq),0):regBills.reduce((s,b)=>{const sp=b.split||{p1:50,p2:50};return s+toM(b.cost,b.freq)*(sp[view]||50)/100;},0);const tempBillsMo=view==="both"||!hasP2?tempBills.reduce((s,b)=>s+toM(b.cost,b.freq),0):tempBills.reduce((s,b)=>{const sp=b.split||{p1:50,p2:50};return s+toM(b.cost,b.freq)*(sp[view]||50)/100;},0);
  // Variable = temp bills + committed "other" + committed "debtRepayment" allocations
  const alloc=client.alloc||{};const committed=client.committed||{};const extraForAlloc=Math.max(0,net-regBillsMo-tempBillsMo);const otherAlloc=committed.other?extraForAlloc*((alloc.other||0)/100):0;const debtAlloc=committed.debtRepayment?extraForAlloc*((alloc.debtRepayment||0)/100):0;
  const totalVariable=tempBillsMo+otherAlloc+debtAlloc;const totalExpenses=regBillsMo+totalVariable;const netCF=net-totalExpenses;
  return<div>{fullPage&&<SH label={"📋 "+(t.incomeStatement||"Income Statement")}/>}<div style={{...mCARD(th),padding:16}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={{...mTH(th),fontSize:13,paddingBottom:10}}>{t.colLineItem||"Line Item"}</th><th style={{...mTHR(th),fontSize:12}}>{t.monthlyCol}</th><th style={{...mTHR(th),fontSize:11,color:th.warn}}>{t.colYtdMay||"YTD"} ({mLabel(MS[new Date().getMonth()]+" 0",_gaLang()).split(" ")[0]})</th><th style={{...mTHR(th),fontSize:12}}>{t.annualCol}</th></tr></thead><tbody><tr><td colSpan={4} style={{...mTD(th),fontSize:11,fontWeight:700,color:th.pos,paddingTop:10}}>💼 {t.incomeHdr||"INCOME"}</td></tr>{incStreams.map(s=><IRow key={s.id} label={"  "+s.label} monthly={toM(s.net,s.freq)} annual={toM(s.net,s.freq)*12}/>)}<IRow label={t.totalIncomeRow||"TOTAL INCOME"} monthly={net} annual={net*12} bold color={th.pos}/><tr><td colSpan={4} style={{...mTD(th),fontSize:11,fontWeight:700,color:th.neg,paddingTop:12}}>💳 {t.fixedExpensesRow||"FIXED EXPENSES"}</td></tr>{regBills.map(b=>{const mc=view==="both"||!hasP2?toM(b.cost,b.freq):toM(b.cost,b.freq)*((b.split||{p1:50,p2:50})[view]||50)/100;return<IRow key={b.id} label={"  "+b.name} monthly={mc} annual={mc*12}/>;})}<IRow label={t.totalFixedExpensesRow||"TOTAL FIXED EXPENSES"} monthly={regBillsMo} annual={regBillsMo*12} bold color={th.neg}/>{totalVariable>0&&<><tr><td colSpan={4} style={{...mTD(th),fontSize:11,fontWeight:700,color:th.warn,paddingTop:12}}>📊 {t.variableExpensesRow||"VARIABLE EXPENSES"}</td></tr>{tempBills.map(b=>{const mc=view==="both"||!hasP2?toM(b.cost,b.freq):toM(b.cost,b.freq)*((b.split||{p1:50,p2:50})[view]||50)/100;return<IRow key={b.id} label={"  "+b.name+" "+(t.tempSuffix||"(temp)")} monthly={mc} annual={mc*12}/>;})}{otherAlloc>0&&<IRow label={"  "+(t.allocOther||"💡 Other").replace(/^[^\s]+\s/,"")+" ("+((t.committedContribHdr||"COMMITTED").toLowerCase().split(" ")[0])+")"} monthly={otherAlloc} annual={otherAlloc*12}/>}{debtAlloc>0&&<IRow label={"  "+(t.allocDebtRepayment||"💳 Debt Repayment").replace(/^[^\s]+\s/,"")+" ("+((t.committedContribHdr||"COMMITTED").toLowerCase().split(" ")[0])+")"} monthly={debtAlloc} annual={debtAlloc*12}/>}<IRow label={t.totalVariableRow||"TOTAL VARIABLE"} monthly={totalVariable} annual={totalVariable*12} bold color={th.warn}/></>}<IRow label={t.totalExpensesRow||"TOTAL EXPENSES"} monthly={totalExpenses} annual={totalExpenses*12} bold color={th.neg}/></tbody><tfoot><tr style={{borderTop:`2px solid ${GOLD}`}}><td style={{...mTD(th),fontSize:14,fontWeight:800,paddingTop:12,color:th.text}}>💰 {t.netIncomeAfterExpenses||"NET INCOME (after expenses)"}</td><td style={{...mTDR(th),fontSize:14,fontWeight:800,paddingTop:12,color:netCF>=0?th.pos:th.neg}}>{fmt(netCF)}</td><td style={{...mTDR(th),fontSize:12,fontWeight:700,paddingTop:12,color:th.warn}}>{fmt(netCF*ytdMo)}</td><td style={{...mTDR(th),fontSize:14,fontWeight:800,paddingTop:12,color:netCF>=0?th.pos:th.neg}}>{fmt(netCF*12)}</td></tr></tfoot></table></div></div>;})()}
{fullPage&&<SD/>}
{(sec==="cashflow"||fullPage)&&<div>{fullPage&&<SH label={"💰 "+(t.cashFlowStmt||"Cash Flow Statement")}/>}<CashFlowStatement client={client} t={t}/></div>}
{fullPage&&<SD/>}
{(sec==="ratios"||fullPage)&&!skipRatios&&<div>{fullPage&&<SH label={"📐 "+(t?.ratioAnalysisLbl||"Ratio Analysis")}/>}<RatioContent client={client} lang={lang} t={t} filterView={view}/></div>}
</div>;}

/* ── INVESTMENTS TAB ─────────────────────────────────────────────────────── */

function ExportHoldingsModal({client,holdings,totalValue,onSave,onClose,t}){const th=useTh();const INP=mINP(th);const nameOf=h=>h.name||TICKER_META[h.ticker]?.name||h.ticker;const keyOf=h=>h.id||h.ticker;const[sel,setSel]=useState(new Set(holdings.map(keyOf)));const[amounts,setAmounts]=useState(()=>Object.fromEntries(holdings.map(h=>[keyOf(h),Math.round((totalValue||0)*((h.pct||0)/100))])));const snaps=(client.monthSnapshots||[]).slice().reverse();const[targetMonth,setTargetMonth]=useState("current");const toggle=k=>setSel(p=>{const n=new Set(p);n.has(k)?n.delete(k):n.add(k);return n;});const totalAmt=Object.entries(amounts).filter(([k])=>sel.has(k)).reduce((s,[,v])=>s+(+v||0),0);const apply=()=>{const selected=holdings.filter(h=>sel.has(keyOf(h))).map(h=>({id:gid(),ticker:h.ticker,name:nameOf(h),value:+amounts[keyOf(h)]||0,cat:TICKER_META[h.ticker]?.cat||h.cat||"Investment"}));if(selected.length===0){alert("Select at least one holding.");return;}onSave(selected,targetMonth);onClose();};return<Modal title={"📥 "+(t?.exportHoldingsTitle||"Export Holdings to Market Investments")} onClose={onClose} width={560}><div style={{fontSize:12,color:th.muted,marginBottom:14,lineHeight:1.6}}>Select holdings and enter their current dollar amounts. Each selected holding will be added as a <b>Market Investment</b> on the chosen month&#39;s snapshot.</div><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>TARGET MONTH</div><select value={targetMonth} onChange={e=>setTargetMonth(e.target.value)} style={{...INP,marginBottom:14}}><option value="current">{t?.snapCurrentProfile||"Current (profile)"}</option>{snaps.filter(s=>s.data).map(s=><option key={s.label} value={s.label}>{s.label}</option>)}</select><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{fontSize:11,fontWeight:700,color:th.dim}}>HOLDINGS</div><div style={{display:"flex",gap:6}}><Btn small onClick={()=>setSel(new Set(holdings.map(keyOf)))}>Select All</Btn><Btn small onClick={()=>setSel(new Set())}>Clear All</Btn></div></div><div style={{maxHeight:280,overflowY:"auto",display:"flex",flexDirection:"column",gap:5,marginBottom:12}}>{holdings.map(h=>{const k=keyOf(h);const s=sel.has(k);return<div key={k} style={{...mCARD(th),padding:"8px 12px",display:"flex",alignItems:"center",gap:10,border:`1px solid ${s?th.accent:th.cardBorder}`}}><div onClick={()=>toggle(k)} style={{width:16,height:16,borderRadius:3,background:s?th.accent:th.cardBorder,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",cursor:"pointer",flexShrink:0}}>{s&&"✓"}</div><div style={{flex:1}}><span style={{fontSize:12,fontWeight:700,color:th.text}}>{h.ticker}</span><span style={{fontSize:11,color:th.muted,marginLeft:6}}>{nameOf(h)}</span></div><MaskedNumInp value={amounts[k]||0} onChange={e=>setAmounts(p=>({...p,[k]:+e.target.value||0}))} style={{...INP,width:110}} placeholder="$"/></div>;})}</div><div style={{fontSize:12,color:th.muted,marginBottom:14}}>{t.totalValueColon||"Total value:"} <b style={{color:th.pos}}>{fmt(totalAmt)}</b> across {sel.size} holding{sel.size!==1?"s":""}</div><div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn onClick={onClose}>{t.cancel}</Btn><BSolid onClick={apply}>Add to {targetMonth==="current"?"Profile":targetMonth}</BSolid></div></Modal>;}

function InvestmentsTab({client,onUpdate,t}){
  const th=useTh();
  const[view,setView]=useState("portfolio");
  const[sel,setSel]=useState("growth");
  const[rates,setRates]=useState({conservative:5.5,growth:8.5,aggressive:11.0,...(client.portfolioCustom?.rates||{})});
  const[monthly,setMonthly]=useState(()=>Math.max(0,Math.round((sumN(client.incomeStreams)-sumB(client.bills)-sumMin(client.cards))*(client.alloc?.stocks||0)/100)));
  const[years,setYears]=useState(10);
  const[showAdd,setShowAdd]=useState(false);
  const[modMode,setModMode]=useState(false);
  const[showAlt,setShowAlt]=useState(false);
  const[nh,setNh]=useState({ticker:"",alt:"",pct:"0"});
  const[addToPack,setAddToPack]=useState(null); // {packId, type: 'main'|'alt'}
  const[packNh,setPackNh]=useState({ticker:"",alt:"",pct:"0"});
  const custom=client.portfolioCustom||{holdings:[],overrides:{},rates:{},mainPackHoldings:{},altPackHoldings:{}};
  const overrides=custom.overrides?.[sel]||{};
  const p=PORTFOLIOS[sel];
  const ret=rates[sel]||8.5;
  const[exportOpen,setExportOpen]=useState(false);
  const r=ret/100/12;
  const nY=years*12;
  const fv=monthly>0?(monthly*((Math.pow(1+r,nY)-1)/r)):0;
  const contrib=monthly*nY;
  // Resolve names/descs from TICKER_META globally so the same ticker shows identical text across portfolios
  const nameOf=h=>TICKER_META[h.ticker]?.name||h.name||h.ticker;
  const descOf=h=>TICKER_META[h.ticker]?.desc||h.desc||"";
  const baseH=p.holdings.map(h=>({...h,pct:overrides[h.ticker]??h.pct}));
  const allH=[...baseH,...(custom.holdings||[])];
  const totalPct=allH.reduce((s,h)=>s+h.pct,0);
  const over=totalPct>100;
  const avail=Math.max(0,sumN(client.incomeStreams)-sumB(client.bills)-sumMin(client.cards));
  const recAmt=Math.round(avail*(client.alloc?.stocks||0)/100);
  const optAmt=Math.round(avail*(client.alloc?.other||0)/100);
  const updBase=(ticker,pct)=>onUpdate({...client,portfolioCustom:{...custom,overrides:{...custom.overrides,[sel]:{...overrides,[ticker]:Math.max(0,pct)}}}});
  const addH=()=>{if(!nh.ticker.trim()){alert(t.tickerReqErr||"Ticker required.");return;}onUpdate({...client,portfolioCustom:{...custom,holdings:[...(custom.holdings||[]),{id:gid(),ticker:nh.ticker.trim().toUpperCase(),alt:nh.alt.trim().toUpperCase(),pct:parseFloat(nh.pct)||0}]}});setNh({ticker:"",alt:"",pct:"0"});setShowAdd(false);};
  const delH=id=>onUpdate({...client,portfolioCustom:{...custom,holdings:(custom.holdings||[]).filter(h=>h.id!==id)}});
  const updH=(id,pct)=>onUpdate({...client,portfolioCustom:{...custom,holdings:(custom.holdings||[]).map(h=>h.id===id?{...h,pct:Math.max(0,pct)}:h)}});
  const addAlt=s=>onUpdate({...client,portfolioCustom:{...custom,holdings:[...(custom.holdings||[]),{id:gid(),ticker:s.ticker,alt:s.alt,pct:s.pct||0}]}});
  const useP=pack=>onUpdate({...client,portfolioCustom:{...custom,holdings:pack.stocks.map(s=>({id:gid(),ticker:s.ticker,alt:s.alt,pct:s.pct||0}))}});
  const useMain=packKey=>{const port=PORTFOLIOS[packKey];if(!port)return;const extras=custom.mainPackHoldings?.[packKey]||[];onUpdate({...client,portfolioCustom:{...custom,holdings:[...port.holdings.map(h=>({id:gid(),ticker:h.ticker,alt:h.alt,pct:h.pct})),...extras.map(h=>({id:gid(),ticker:h.ticker,alt:h.alt,pct:h.pct||0}))]}});};
  const addToMainPack=(packKey,holding)=>{const mph={...(custom.mainPackHoldings||{})};mph[packKey]=[...(mph[packKey]||[]),{id:gid(),ticker:holding.ticker.trim().toUpperCase(),alt:(holding.alt||"").trim().toUpperCase(),pct:parseFloat(holding.pct)||0}];onUpdate({...client,portfolioCustom:{...custom,mainPackHoldings:mph}});};
  const removeFromMainPack=(packKey,holdingId)=>{const mph={...(custom.mainPackHoldings||{})};mph[packKey]=(mph[packKey]||[]).filter(h=>h.id!==holdingId);onUpdate({...client,portfolioCustom:{...custom,mainPackHoldings:mph}});};
  const addToAltPack=(packId,holding)=>{const aph={...(custom.altPackHoldings||{})};aph[packId]=[...(aph[packId]||[]),{id:gid(),ticker:holding.ticker.trim().toUpperCase(),alt:(holding.alt||"").trim().toUpperCase(),pct:parseFloat(holding.pct)||0}];onUpdate({...client,portfolioCustom:{...custom,altPackHoldings:aph}});};
  const removeFromAltPack=(packId,holdingId)=>{const aph={...(custom.altPackHoldings||{})};aph[packId]=(aph[packId]||[]).filter(h=>h.id!==holdingId);onUpdate({...client,portfolioCustom:{...custom,altPackHoldings:aph}});};
  const tOf=h=>showAlt&&h.alt?h.alt:h.ticker;
  const saveRates=()=>onUpdate({...client,portfolioCustom:{...custom,rates:{...custom.rates,...rates}}});
  const INP=mINP(th);
  const chartData=[];for(let y=1;y<=years;y++){const n2=y*12;const v=monthly>0?(monthly*((Math.pow(1+r,n2)-1)/r)):0;chartData.push({year:"Yr "+y,value:Math.round(v),contrib:Math.round(monthly*n2)});}
  const exportHoldings=(selected,targetMonth)=>{if(targetMonth==="current"){const newMI=[...(client.marketInvestments||[]),...selected];onUpdate({...client,marketInvestments:newMI});alert(`Added ${selected.length} holdings to profile.`);}else{const snaps=(client.monthSnapshots||[]).map(s=>{if(s.label!==targetMonth||!s.data)return s;const existing=s.data.marketInvestments||s.data.customAssets||[];return{...s,data:{...s.data,marketInvestments:[...existing,...selected]}};});onUpdate({...client,monthSnapshots:snaps});alert(`Added ${selected.length} holdings to ${targetMonth}.`);}};
  // Report-include logic: save the currently-displayed portfolio as a snapshot so it appears on reports, or clear it
  const isInReport=!!client.savedPortfolio;
  const savePortfolioReport=()=>{const snap={nameKey:p.nameKey,risk:p.risk,rate:ret,monthly,years,holdings:allH.filter(h=>h.pct>0).map(h=>({id:h.id||gid(),ticker:h.ticker,alt:h.alt,pct:h.pct})),savedAt:new Date().toISOString()};onUpdate({...client,savedPortfolio:snap});alert("✓ Portfolio included in report.");};
  const clearPortfolioReport=()=>{if(!confirm("Remove the portfolio from the Complete Report?"))return;onUpdate({...client,savedPortfolio:null});};
    return<div>{exportOpen&&<ExportHoldingsModal client={client} holdings={allH} totalValue={Math.max(0,monthly)} onSave={exportHoldings} onClose={()=>setExportOpen(false)} t={t}/>}
  {/* Sub-navigation */}
  <div style={{display:"flex",gap:6,marginBottom:14,borderBottom:`1px solid ${th.cardBorder}`}}>{[["portfolio","💹 "+(t.portfolio||"Portfolio")],["main","🗂 "+(t.mainPackages||"Main Packages")],["alt","🎒 "+(t.alternativePackagesLbl||"Alternative Packages")]].map(([v,l])=><button key={v} onClick={()=>setView(v)} style={{fontSize:12,padding:"7px 14px",background:"transparent",border:"none",cursor:"pointer",color:view===v?th.accent:th.muted,fontWeight:view===v?700:500,borderBottom:view===v?`2px solid ${th.accent}`:"2px solid transparent",marginBottom:-1}}>{l}</button>)}</div>
  {view==="portfolio"&&<>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,gap:8,flexWrap:"wrap"}}><div style={{fontSize:12,fontWeight:700,color:th.dim}}>💹 Portfolio</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{isInReport?<Btn small onClick={clearPortfolioReport} color={th.neg}>🗑 Remove from Report</Btn>:<Btn small onClick={savePortfolioReport} color={th.blue}>📌 Include in Report</Btn>}<Btn small onClick={()=>setExportOpen(true)} color={th.pos}>📥 Export Holdings → Market Investments</Btn></div></div>
  <div data-ga-grid="portfolios" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>{Object.entries(PORTFOLIOS).map(([k,port])=>{const rVal=rates[k]||8.5;return<div key={k} style={{...mCARD(th),padding:14,cursor:"pointer",background:sel===k?port.color+"22":th.card,border:`1px solid ${sel===k?port.color:th.cardBorder}`,minWidth:0,overflow:"hidden"}} onClick={()=>setSel(k)}><div style={{fontSize:11,fontWeight:700,color:sel===k?port.color:th.muted,marginBottom:4}}>{t[port.nameKey]||port.nameKey}</div><div style={{display:"flex",alignItems:"center",gap:4}}><MaskedNumInp value={rVal} min={0} max={30} step="0.5" onChange={e=>{e.stopPropagation();setRates(prev=>({...prev,[k]:+e.target.value||0}));}} onClick={e=>e.stopPropagation()} style={{...mIIN(th),width:50,textAlign:"center",fontWeight:800,fontSize:18,color:sel===k?port.color:th.dim}}/><span style={{fontSize:14,color:sel===k?port.color:th.dim}}>%</span><button onClick={e=>{e.stopPropagation();saveRates();}} style={{fontSize:10,padding:"2px 7px",borderRadius:6,background:GOLD+"22",color:GOLD,border:"none",cursor:"pointer",marginLeft:4}}>Save</button></div><div style={{fontSize:10,color:th.dim,marginTop:2}}>Expected annual return</div><Pill color={port.color}>{port.risk} Risk</Pill></div>;})}</div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:11,fontWeight:700,color:over?th.warn:totalPct===100?th.pos:th.dim}}>{over?`⚠️ Over 100% (${totalPct}%)`:(`Holdings ${totalPct}%${totalPct===100?" ✓":""}`)}</span><div style={{display:"flex",gap:6}}><button onClick={()=>setShowAlt(s=>!s)} style={{fontSize:11,padding:"3px 10px",borderRadius:7,cursor:"pointer",background:showAlt?th.accent+"22":"transparent",color:showAlt?th.accent:th.muted,border:`1px solid ${showAlt?th.accent:th.cardBorder}`}}>{showAlt?"Show Main":"Show Alt"}</button><button onClick={()=>setModMode(m=>!m)} style={{fontSize:11,padding:"3px 10px",borderRadius:7,cursor:"pointer",background:modMode?th.warn+"22":"transparent",color:modMode?th.warn:th.muted,border:`1px solid ${modMode?th.warn:th.cardBorder}`}}>✏️ {t.modifyPct}</button><Btn small onClick={()=>setShowAdd(s=>!s)}>＋ {t.addStock}</Btn></div></div>
      {allH.map((h,i)=>{const isBase=!h.id;const dollarAmt=Math.max(0,monthly)*(h.pct/100);return<div key={(h.id||h.ticker)+i} style={{...mCARD(th),padding:"8px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:8}}><div style={{width:10,height:10,borderRadius:99,background:PC[i%PC.length],flexShrink:0}}/><div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:th.text}}><span style={{color:PC[i%PC.length]}}>{tOf(h)}</span>{h.alt&&<span style={{fontSize:10,color:th.dim,marginLeft:4}}>({showAlt?h.ticker:h.alt})</span>} — {nameOf(h)}</div>{descOf(h)&&<div style={{fontSize:10,color:th.muted}}>{descOf(h)}</div>}</div>{modMode?<MaskedNumInp value={h.pct} min={0} max={100} onChange={e=>{if(isBase)updBase(h.ticker,+e.target.value);else updH(h.id,+e.target.value);}} style={{...mIIN(th),width:50,textAlign:"center"}} onKeyDown={bE}/>:<div style={{textAlign:"right",minWidth:80}}><div style={{fontSize:12,fontWeight:700,color:PC[i%PC.length]}}>{h.pct}%</div>{dollarAmt>0&&<div style={{fontSize:10,color:th.dim,fontWeight:600}}>{fmtD(dollarAmt)}/mo</div>}</div>}{!isBase&&<button onClick={()=>delH(h.id)} style={{fontSize:10,padding:"1px 6px",borderRadius:4,background:"#EF444422",color:"#EF4444",border:"none",cursor:"pointer"}}>×</button>}</div>;})}
      {showAdd&&<div style={{...mCARD(th),padding:14,marginTop:6}}><Row2><Field label={t?.tickerField||"Ticker *"}><input style={INP} value={nh.ticker} onChange={e=>setNh(p=>({...p,ticker:e.target.value}))}/></Field><Field label={t?.altTicker||"Alt Ticker"}><input style={INP} value={nh.alt} onChange={e=>setNh(p=>({...p,alt:e.target.value}))}/></Field></Row2><Field label={t?.allocPct||"% Allocation"}><MaskedNumInp style={INP} value={nh.pct} onChange={e=>setNh(p=>({...p,pct:e.target.value}))} min={0} max={100} onKeyDown={bE}/></Field><div style={{fontSize:10,color:th.dim,marginBottom:8,fontStyle:"italic"}}>Name and description are pulled automatically from the ticker if known.</div><div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}><Btn onClick={()=>setShowAdd(false)}>{t.cancel}</Btn><BSolid onClick={addH}>{t.addStock}</BSolid></div></div>}
      <div style={{fontSize:11,fontWeight:700,color:th.dim,marginTop:16,marginBottom:8}}>Alternative Packages</div>
      {ALT_PACKS.map(pk=>{const extras=custom.altPackHoldings?.[pk.id]||[];const allPackH=[...pk.stocks,...extras];const packWithExtras={...pk,stocks:allPackH};return<details key={pk.id} style={{...mCARD(th),padding:"8px 12px",marginBottom:6}}><summary style={{fontSize:12,fontWeight:700,color:th.muted,cursor:"pointer",listStyle:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span>{pk.label}</span><Btn small onClick={e=>{e.preventDefault();useP(packWithExtras);}} color={th.warn}>Use Package</Btn></summary><div style={{marginTop:10}}>{allPackH.map((s,i)=><div key={(s.id||s.ticker)+i} style={{fontSize:11,marginBottom:8,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center"}}><div style={{flex:1}}><b>{tOf(s)}</b> {s.name||TICKER_META[s.ticker]?.name||""}{s.desc?` — ${s.desc}`:(TICKER_META[s.ticker]?.desc?` — ${TICKER_META[s.ticker].desc}`:"")}</div><Btn small onClick={()=>addAlt(s)}>Add</Btn></div>)}</div></details>;})}
    </div>
    <div>
      <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:6}}>💡 PROJECTION</div>
      <div style={{...mCARD(th),padding:12,marginBottom:10,fontSize:11,color:th.muted}}><div style={{marginBottom:4}}>From savings allocation:</div><div style={{display:"flex",gap:16,flexWrap:"wrap"}}><span>📈 Stocks: <span style={{color:th.pos,fontWeight:700}}>{fmt(recAmt)}/mo</span></span>{optAmt>0&&<span>💡 Other: <span style={{color:th.warn,fontWeight:700}}>{fmt(optAmt)}/mo</span></span>}</div></div>
      <Field label={t.monthlyInvest+" ($)"}><MaskedNumInp style={INP} value={monthly} onChange={e=>setMonthly(Math.max(0,+e.target.value||0))} onKeyDown={bE}/></Field>
      <div style={{marginBottom:14}}><label style={{fontSize:11,color:th.muted,display:"block",marginBottom:5}}>{t.years}: <b>{years}</b></label><input type="range" min={1} max={30} step={1} value={years} onChange={e=>setYears(parseInt(e.target.value,10)||1)} style={{width:"100%",accentColor:th.accent,cursor:"pointer"}}/><div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:th.dim,marginTop:2}}><span>1</span><span>30</span></div></div>
      <div style={{...mCARD(th),padding:14,marginBottom:12}}>{[{l:"Contributed",v:fmt(contrib),c:th.muted},{l:"Growth",v:"+"+fmt(fv-contrib),c:th.pos},{l:`Future Value (${years}yr @ ${ret}%)`,v:fmt(fv),c:th.accent,big:true}].map(row=><div key={row.l} style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:row.big?14:12}}><span style={{color:th.muted}}>{row.l}</span><span style={{color:row.c,fontWeight:row.big?800:600}}>{row.v}</span></div>)}</div>
      <ResponsiveContainer width="100%" height={180} style={{outline:"none"}}><AreaChart data={chartData} margin={{top:10,right:4,left:4,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke={th.cardBorder}/><XAxis dataKey="year" tick={{fontSize:9,fill:th.dim}} axisLine={false} tickLine={false}/><YAxis hide/><ReTip contentStyle={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:8,fontSize:11}} formatter={v=>fmt(v)}/><Area type="monotone" dataKey="value" name="Value" stroke={th.accent} fill={th.accent+"33"} strokeWidth={2}/><Area type="monotone" dataKey="contrib" name="Contributed" stroke={th.muted} fill={th.muted+"22"} strokeWidth={1}/></AreaChart></ResponsiveContainer>
    </div>
  </div>
  </>}
  {view==="main"&&<>
  <div style={{fontSize:11,color:th.muted,marginBottom:12,padding:"8px 12px",background:th.accent+"08",borderRadius:8}}>💡 Main Packages are the three standard portfolio models. You can add custom holdings to each one, then click "Use Package" to load it into the client's Portfolio (above).</div>
  {MAIN_PACKS.map(mp=>{const port=PORTFOLIOS[mp.portKey];const extras=custom.mainPackHoldings?.[mp.portKey]||[];const isAdding=addToPack&&addToPack.packId===mp.portKey&&addToPack.type==="main";const allPackH=[...port.holdings,...extras];return<div key={mp.id} style={{...mCARD(th),padding:14,marginBottom:10,borderLeft:`4px solid ${port.color}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}><div><span style={{fontSize:13,fontWeight:800,color:port.color}}>{mp.label}</span><Pill color={port.color}>{port.risk} Risk</Pill></div><div style={{display:"flex",gap:6}}><Btn small onClick={()=>setAddToPack(isAdding?null:{packId:mp.portKey,type:"main"})}>{isAdding?"Cancel":"＋ Add Holding"}</Btn><Btn small onClick={()=>useMain(mp.portKey)} color={th.warn}>Use Package</Btn></div></div>{allPackH.map((h,i)=><div key={(h.id||h.ticker)+i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:th.bg,borderRadius:6,marginBottom:4}}><div style={{width:8,height:8,borderRadius:99,background:PC[i%PC.length],flexShrink:0}}/><div style={{flex:1,fontSize:11}}><b>{h.ticker}</b>{h.alt&&<span style={{color:th.dim,marginLeft:4}}>({h.alt})</span>} — {nameOf(h)}{descOf(h)&&<div style={{color:th.dim,fontSize:10,marginTop:2}}>{descOf(h)}</div>}</div><span style={{fontSize:11,fontWeight:700,color:PC[i%PC.length]}}>{h.pct}%</span>{h.id&&<button onClick={()=>removeFromMainPack(mp.portKey,h.id)} style={{fontSize:10,padding:"1px 6px",borderRadius:4,background:"#EF444422",color:"#EF4444",border:"none",cursor:"pointer"}}>×</button>}</div>)}{isAdding&&<div style={{...mCARD(th),padding:12,marginTop:8}}><Row2><Field label={t?.tickerField||"Ticker *"}><input style={INP} value={packNh.ticker} onChange={e=>setPackNh(p=>({...p,ticker:e.target.value}))}/></Field><Field label={t?.altShort||"Alt"}><input style={INP} value={packNh.alt} onChange={e=>setPackNh(p=>({...p,alt:e.target.value}))}/></Field></Row2><Field label={t?.allocPct||"% Allocation"}><MaskedNumInp style={INP} value={packNh.pct} onChange={e=>setPackNh(p=>({...p,pct:e.target.value}))} min={0} max={100} onKeyDown={bE}/></Field><div style={{display:"flex",gap:6,justifyContent:"flex-end",marginTop:6}}><Btn small onClick={()=>{setAddToPack(null);setPackNh({ticker:"",alt:"",pct:"0"});}}>Cancel</Btn><BSolid onClick={()=>{if(!packNh.ticker.trim()){alert(t.tickerReqErr||"Ticker required.");return;}addToMainPack(mp.portKey,packNh);setPackNh({ticker:"",alt:"",pct:"0"});setAddToPack(null);}} style={{fontSize:11,padding:"4px 12px"}}>Add to Package</BSolid></div></div>}</div>;})}
  </>}
  {view==="alt"&&<>
  <div style={{fontSize:11,color:th.muted,marginBottom:12,padding:"8px 12px",background:th.accent+"08",borderRadius:8}}>💡 Alternative Packages are sector-specific themes (Tech, Bonds, Gold, etc.). You can add custom holdings to each, then click "Use Package" to replace the client's current portfolio.</div>
  {ALT_PACKS.map(pk=>{const extras=custom.altPackHoldings?.[pk.id]||[];const isAdding=addToPack&&addToPack.packId===pk.id&&addToPack.type==="alt";const allPackH=[...pk.stocks,...extras];const packWithExtras={...pk,stocks:allPackH};return<div key={pk.id} style={{...mCARD(th),padding:14,marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}><span style={{fontSize:13,fontWeight:800,color:th.text}}>{pk.label}</span><div style={{display:"flex",gap:6}}><Btn small onClick={()=>setAddToPack(isAdding?null:{packId:pk.id,type:"alt"})}>{isAdding?"Cancel":"＋ Add Holding"}</Btn><Btn small onClick={()=>useP(packWithExtras)} color={th.warn}>Use Package</Btn></div></div>{allPackH.map((s,i)=><div key={(s.id||s.ticker)+i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:th.bg,borderRadius:6,marginBottom:4}}><div style={{flex:1,fontSize:11}}><b>{s.ticker}</b>{s.alt&&<span style={{color:th.dim,marginLeft:4}}>({s.alt})</span>}{s.name?` — ${s.name}`:""}{s.desc&&<div style={{color:th.dim,fontSize:10,marginTop:2}}>{s.desc}</div>}</div><span style={{fontSize:11,fontWeight:700,color:th.accent}}>{s.pct||0}%</span><Btn small onClick={()=>addAlt(s)}>Add to Client</Btn>{s.id&&<button onClick={()=>removeFromAltPack(pk.id,s.id)} style={{fontSize:10,padding:"1px 6px",borderRadius:4,background:"#EF444422",color:"#EF4444",border:"none",cursor:"pointer"}}>×</button>}</div>)}{isAdding&&<div style={{...mCARD(th),padding:12,marginTop:8}}><Row2><Field label={t?.tickerField||"Ticker *"}><input style={INP} value={packNh.ticker} onChange={e=>setPackNh(p=>({...p,ticker:e.target.value}))}/></Field><Field label={t?.altShort||"Alt"}><input style={INP} value={packNh.alt} onChange={e=>setPackNh(p=>({...p,alt:e.target.value}))}/></Field></Row2><Field label={t?.allocPct||"% Allocation"}><MaskedNumInp style={INP} value={packNh.pct} onChange={e=>setPackNh(p=>({...p,pct:e.target.value}))} min={0} max={100} onKeyDown={bE}/></Field><div style={{display:"flex",gap:6,justifyContent:"flex-end",marginTop:6}}><Btn small onClick={()=>{setAddToPack(null);setPackNh({ticker:"",alt:"",pct:"0"});}}>Cancel</Btn><BSolid onClick={()=>{if(!packNh.ticker.trim()){alert(t.tickerReqErr||"Ticker required.");return;}addToAltPack(pk.id,packNh);setPackNh({ticker:"",alt:"",pct:"0"});setAddToPack(null);}} style={{fontSize:11,padding:"4px 12px"}}>Add to Package</BSolid></div></div>}</div>;})}
  </>}
  </div>;}

/* ── FULL DETAILED REPORT ────────────────────────────────────────────────── */
function FullReport({client,lang,t,hClient:propHClient}){const th=useTh();const hc=propHClient||client;const tA=totalA(hc),tL=totalL(hc);const net=sumN(hc.incomeStreams),bills=sumB(hc.bills),minD=sumMin(hc.cards);const liq=liquidA(hc);const efTgt=sumB(hc.bills)*(client.efMonths||3);const efPct=Math.min(100,efTgt>0?liq/efTgt*100:0);const avail=net-bills-minD;const snaps=client.monthSnapshots||[];const hasSnaps=snaps.length>0;
const liveSnap={label:"▶ Now",debt:Math.round(totalL(client)),savings:Math.round(liq),cashFlow:Math.round(avail),income:Math.round(net)};
const trendData=[...snaps.slice(-5),liveSnap];
const ai=[{k:"stocks",l:"Stocks",c:th.blue},{k:"retirement",l:"Retirement",c:"#8B5CF6"},{k:"realEstate",l:"Real Estate",c:th.pos},{k:"savings",l:"Savings",c:"#06B6D4"},{k:"vacation",l:"Vacation",c:th.warn},{k:"other",l:"Other",c:th.muted},{k:"debtRepayment",l:"Debt Repayment",c:th.neg}];
const portfolioSel="growth";const portRates={conservative:5.5,growth:8.5,aggressive:11.0,...(client.portfolioCustom?.rates||{})};const ret=portRates[portfolioSel];const r=ret/100/12;const monthly=Math.round(avail*(client.alloc?.stocks||0)/100);const fv10=monthly>0?(monthly*((Math.pow(1+r,120)-1)/r)):0;
const RS=({icon,title,children})=><div className="ga-section" style={{marginBottom:24,pageBreakInside:"avoid"}}><div style={{borderBottom:`2px solid ${th.accent}`,paddingBottom:6,marginBottom:14,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>{icon}</span><span style={{fontSize:12,fontWeight:800,color:th.text,textTransform:"uppercase",letterSpacing:"0.07em"}}>{title}</span></div>{children}</div>;
const TR=({label,value,color,bold})=><div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${th.cardBorder}44`}}><span style={{fontSize:12,color:th.muted}}>{label}</span><span style={{fontSize:12,fontWeight:bold?700:600,color:color||th.muted}}>{value}</span></div>;
const h1=actB(client.bills).filter(b=>(b.dueDay||1)<=15),h2=actB(client.bills).filter(b=>(b.dueDay||1)>15);
return<div style={{paddingBottom:40}}>
<div data-ga-grid="kpi-4" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:24}}><SC label={"💼 "+(t.netIncomeMo||"Net Income/mo")} value={fmt(net)} color={th.pos}/><SC label={"💳 "+(t.monthlyBillsKpi||"Monthly Bills")} value={fmt(bills)} color={th.neg}/><SC label={"🏦 "+(t.totalDebtKpi||"Total Debt")} value={fmt(client.cards.reduce((s,c)=>s+(+c.balance||0),0)+(client.loans||[]).reduce((s,l)=>s+(+l.balance||0),0))} color={th.warn}/><SC label={"💎 "+(t.netWorthKpi||"Net Worth")} value={fmt(tA-tL)} color={tA-tL>=0?th.pos:th.neg}/></div>
<RS icon="💼" title={t.income||"Income"}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={mTH(th)}>Source</th><th style={mTH(th)}>Person</th><th style={mTH(th)}>Frequency</th><th style={mTHR(th)}>Gross/mo</th><th style={mTHR(th)}>Net/mo</th><th style={mTHR(th)}>Annual</th></tr></thead><tbody>{hc.incomeStreams.map(s=><tr key={s.id}><td style={{...mTD(th),fontWeight:600}}>{s.label}</td><td style={mTD(th)}><PTag who={s.person} client={client} t={t}/></td><td style={{...mTD(th),color:th.dim,fontSize:11}}>{t[s.freq]}</td><td style={{...mTDR(th),color:th.muted}}>{fmt(toM(s.gross,s.freq))}</td><td style={{...mTDR(th),color:th.pos,fontWeight:700}}>{fmt(toM(s.net,s.freq))}</td><td style={{...mTDR(th),color:th.dim,fontSize:11}}>{fmt(toM(s.net,s.freq)*12)}</td></tr>)}</tbody><tfoot><tr><td colSpan={4} style={{paddingTop:10,fontWeight:700}}>TOTAL</td><td style={{...mTDR(th),paddingTop:10,fontWeight:800,color:GOLD,fontSize:15}}>{fmt(net)}</td><td style={{...mTDR(th),paddingTop:10,color:th.dim,fontSize:12}}>{fmt(net*12)}</td></tr></tfoot></table></RS>
<RS icon="💳" title={t.billsExpensesHdr||"Bills & Expenses"}><div data-ga-grid="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}><div><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>📅 {t.days1to15||"Days 1-15"}</div><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={mTH(th)}>Name</th><th style={mTH(th)}>Due</th><th style={mTHR(th)}>Monthly</th></tr></thead><tbody>{h1.map(b=><tr key={b.id}><td style={mTD(th)}>{b.name}</td><td style={{...mTD(th),color:th.dim,fontSize:11}}>Day {b.dueDay||"—"}</td><td style={{...mTDR(th),fontWeight:600}}>{fmt(toM(b.cost,b.freq))}</td></tr>)}{!h1.length&&<tr><td colSpan={3} style={{...mTD(th),color:th.dim,fontStyle:"italic"}}>{t.noneLbl||"None"}</td></tr>}</tbody></table></div><div><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>📅 {t.days16to31||"Days 16-31"}</div><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={mTH(th)}>Name</th><th style={mTH(th)}>Due</th><th style={mTHR(th)}>Monthly</th></tr></thead><tbody>{h2.map(b=><tr key={b.id}><td style={mTD(th)}>{b.name}</td><td style={{...mTD(th),color:th.dim,fontSize:11}}>Day {b.dueDay||"—"}</td><td style={{...mTDR(th),fontWeight:600}}>{fmt(toM(b.cost,b.freq))}</td></tr>)}{!h2.length&&<tr><td colSpan={3} style={{...mTD(th),color:th.dim,fontStyle:"italic"}}>{t.noneLbl||"None"}</td></tr>}</tbody></table></div></div><div style={{paddingTop:10,display:"flex",justifyContent:"flex-end",borderTop:`1px solid ${GOLD}44`}}><span style={{fontWeight:800,color:GOLD,fontSize:14}}>{t.totalBillsLine||"Total Bills:"} {fmt(bills)}/mo</span></div></RS>
<RS icon="🏦" title={t.debtCcHdr||"Debt & Credit Cards"}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={mTH(th)}>Card/Loan</th><th style={mTH(th)}>Owner</th><th style={mTHR(th)}>Balance</th><th style={mTHR(th)}>APR</th><th style={mTHR(th)}>Min Pay</th><th style={mTHR(th)}>Int/mo</th><th style={mTHR(th)}>Due</th></tr></thead><tbody>{client.cards.map(c=><tr key={c.id}><td style={{...mTD(th),fontWeight:600}}>{c.name}{(c.promos||[]).length>0&&<Pill color="#8B5CF6" style={{marginLeft:4}}>{c.promos.length}P</Pill>}</td><td style={mTD(th)}><PTag who={c.owedBy||"joint"} client={client} t={t}/></td><td style={{...mTDR(th),color:th.neg,fontWeight:700}}>{fmt(c.balance)}</td><td style={{...mTDR(th),color:th.warn}}>{c.apr}%</td><td style={{...mTDR(th),color:GOLD}}>{fmtD(c.min)}</td><td style={{...mTDR(th),color:th.neg,fontSize:11}}>{fmtD(cardMoInt(c))}</td><td style={{...mTDR(th),color:th.dim,fontSize:11}}>{c.dueDay?"D"+c.dueDay:"—"}</td></tr>)}{(hc.loans||[]).map(l=><tr key={l.id}><td style={{...mTD(th),fontWeight:600,color:th.muted}}>{l.name}</td><td style={mTD(th)}><PTag who={l.owner||"joint"} client={client} t={t}/></td><td style={{...mTDR(th),color:th.neg}}>{fmt(l.balance)}</td><td style={{...mTDR(th),color:th.warn}}>{l.apr||0}%</td><td style={{...mTDR(th),color:th.dim}}>—</td><td style={{...mTDR(th),color:th.dim}}>—</td><td style={{...mTDR(th),color:th.dim}}>—</td></tr>)}</tbody><tfoot><tr><td colSpan={2} style={{paddingTop:10,fontWeight:700}}>TOTAL</td><td style={{...mTDR(th),paddingTop:10,fontWeight:800,color:th.neg,fontSize:15}}>{fmt(tL)}</td><td/><td style={{...mTDR(th),paddingTop:10,color:GOLD,fontWeight:700}}>{fmtD(minD)}/mo</td><td style={{...mTDR(th),paddingTop:10,color:th.neg,fontSize:11}}>{fmtD(totalMoInt(client.cards))}/mo</td><td/></tr></tfoot></table>{(client.cards||[]).some(c=>(c.promos||[]).length>0)&&<div style={{marginTop:10}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:6}}>🏷 {t.promoRatesHdr||"Promotional Rates"}</div>{client.cards.filter(c=>(c.promos||[]).length>0).map(c=><div key={c.id} style={{fontSize:11,marginBottom:4,color:"#8B5CF6"}}><b>{c.name}</b>: {(c.promos||[]).map(p=>`${p.label} ${fmt(p.balance)} @ ${p.rate}%${p.end?` ends ${new Date(p.end).toLocaleDateString("en-US",{month:"short",year:"numeric"})}`:""}`)  .join(" | ")}</div>)}</div>}</RS>
<RS icon="🏦" title={t.accountsAssetsHdr||"Accounts & Assets"}><table style={{width:"100%",borderCollapse:"collapse",marginBottom:12}}><thead><tr><th style={mTH(th)}>Account</th><th style={mTH(th)}>Type</th><th style={mTH(th)}>Owner</th><th style={mTHR(th)}>Value</th></tr></thead><tbody>{(hc.accounts||[]).map(a=><tr key={a.id}><td style={{...mTD(th),fontWeight:600}}>{ACCT_META[a.type]?.icon} {a.name}</td><td style={{...mTD(th),color:th.muted,fontSize:11}}>{ACCT_META[a.type]?.l}</td><td style={mTD(th)}><PTag who={a.owner} client={client} t={t}/></td><td style={{...mTDR(th),color:th.pos,fontWeight:700}}>{fmt(+a.value||0)}</td></tr>)}</tbody></table>{(client.customAssets||[]).length>0&&<><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:6}}>{t.physicalAssetsHdr||"Physical Assets"}</div><table style={{width:"100%",borderCollapse:"collapse"}}><tbody>{(client.customAssets||[]).map(a=><tr key={a.id}><td style={{...mTD(th),fontWeight:600}}>🏛️ {a.name}</td><td style={{...mTD(th),color:th.muted,fontSize:11}}>{a.cat}</td><td style={mTDR(th)}></td><td style={{...mTDR(th),color:th.pos,fontWeight:700}}>{fmt(+a.value||0)}</td></tr>)}</tbody></table></>}<div style={{paddingTop:10,borderTop:`1px solid ${GOLD}44`,display:"flex",gap:24,justifyContent:"flex-end"}}><span style={{fontSize:12,color:th.muted}}>Total Assets: <b style={{color:th.pos}}>{fmt(tA)}</b></span><span style={{fontSize:12,color:th.muted}}>Total Liabilities: <b style={{color:th.neg}}>{fmt(tL)}</b></span><span style={{fontSize:14,fontWeight:800,color:tA-tL>=0?GOLD:th.neg}}>Net Worth: {fmt(tA-tL)}</span></div></RS>
<RS icon="🛡️" title={t.efTarget||"Emergency Fund"}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:8}}><span style={{color:th.muted}}>{(t.liquidColon||"Liquid:")} <b style={{color:th.pos}}>{fmt(liq)}</b></span><span style={{color:th.muted}}>{(t.target||"Target")} ({client.efMonths||3} {(t.monthsAbbr2||"mo")}): <b>{fmt(efTgt)}</b></span><span style={{color:efPct>=100?th.pos:th.warn,fontWeight:700}}>{efPct.toFixed(0)}% {t.funded||"funded"} {efPct>=100?"✓":"— "+(t.gapColon||"Gap:")+" "+fmt(efTgt-liq)}</span></div><div style={{background:th.cardBorder,borderRadius:99,height:12,overflow:"hidden"}}><div style={{height:"100%",borderRadius:99,width:`${efPct}%`,background:efPct>=100?th.pos:efPct>=50?th.warn:th.neg,transition:"width 0.4s"}}/></div></RS>
{(()=>{const _sum=Object.values(client.alloc||{}).reduce((a,b)=>a+(+b||0),0);if(_sum===0||_sum===100)return null;return <div style={{padding:"10px 14px",marginBottom:12,background:"#FBBF2422",border:"1px solid #FBBF24",borderRadius:8,fontSize:11,color:"#92400E",fontWeight:600}}>⚠️ {t.allocSumWarn||"Investment allocation totals"} <b>{_sum}%</b> {t.allocSumWarn2||"(should be 100%). Adjust in the Investments section."}</div>;})()}<RS icon="📊" title={t.investAllocReportHdr||"Investment Allocation"}><div data-ga-grid="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}><div>{ai.filter(a=>(client.alloc?.[a.k]||0)>0).map(a=><TR key={a.k} label={a.l} value={`${client.alloc?.[a.k]||0}% = ${fmt(avail*(client.alloc?.[a.k]||0)/100)}/mo`} color={a.c}/>)}<TR label={t.availableColon||"Available:"} value={fmt(avail)+"/mo"} color={avail>=0?th.pos:th.neg} bold/></div><ResponsiveContainer width="100%" height={180} style={{outline:"none"}}><PieChart><Pie data={ai.filter(a=>(client.alloc?.[a.k]||0)>0).map(a=>({name:a.l,value:client.alloc?.[a.k]||0,color:a.c}))} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">{ai.filter(a=>(client.alloc?.[a.k]||0)>0).map((a,i)=><Cell key={i} fill={a.c} stroke="none"/>)}<ReTip contentStyle={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:8,fontSize:11}} formatter={(v,n)=>[v+"%",n]}/></Pie></PieChart></ResponsiveContainer></div></RS>
<RS icon="📐" title={t.financialRatiosHdr||"Financial Ratios"}><RatioContent client={client} lang={lang} t={t} filterView="both"/></RS>
{hasSnaps&&<RS icon="📈" title={t.trendsHdr||"Trends"}><div data-ga-grid="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}><div><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>Debt vs Savings</div><ResponsiveContainer width="100%" height={150} style={{outline:"none"}}><AreaChart data={trendData} margin={{top:18,right:8,left:0,bottom:0}}><XAxis dataKey="label" tick={{fontSize:8,fill:th.dim}} axisLine={false} tickLine={false}/><YAxis hide/><ReTip contentStyle={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:8,fontSize:11}} formatter={v=>fmt(v)}/><Area type="monotone" dataKey="debt" name="Debt" stroke={th.neg} strokeWidth={2} fill={th.neg+"33"} dot={false} activeDot={{r:3,strokeWidth:0,fill:th.neg}}/><Area type="monotone" dataKey="savings" name="Savings" stroke={th.pos} strokeWidth={2} fill={th.pos+"33"} dot={false} activeDot={{r:3,strokeWidth:0,fill:th.pos}}/></AreaChart></ResponsiveContainer></div><div><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>Cash Flow</div><ResponsiveContainer width="100%" height={150} style={{outline:"none"}}><AreaChart data={trendData} margin={{top:18,right:8,left:0,bottom:0}}><XAxis dataKey="label" tick={{fontSize:8,fill:th.dim}} axisLine={false} tickLine={false}/><YAxis hide/><ReTip contentStyle={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:8,fontSize:11}} formatter={v=>fmt(v)}/><Area type="monotone" dataKey="cashFlow" name="Cash Flow" stroke={GOLD} strokeWidth={2} fill={GOLD+"33"} dot={false} activeDot={{r:3,strokeWidth:0,fill:GOLD}}/></AreaChart></ResponsiveContainer></div></div></RS>}
{monthly>0&&<RS icon="💹" title={t.portfolioProjHdr||"Portfolio Projection (Growth — 10yr)"}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}><TR label={t?.monthlyInvest||"Monthly Investment"} value={fmt(monthly)+"/mo"} color={th.blue}/><TR label={`Future Value @ ${ret}%`} value={fmt(fv10)} color={GOLD} bold/><TR label={t?.growth||"Growth"} value={"+"+fmt(fv10-monthly*120)} color={th.pos}/></div><ResponsiveContainer width="100%" height={120} style={{outline:"none"}}><AreaChart data={[1,2,3,4,5,6,7,8,9,10].map(y=>{const n2=y*12;const v=monthly*(( Math.pow(1+r,n2)-1)/r);return{year:"Yr "+y,value:Math.round(v),contrib:monthly*n2};})}>  <XAxis dataKey="year" tick={{fontSize:9,fill:th.dim}} axisLine={false} tickLine={false}/><YAxis hide/><ReTip contentStyle={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:8,fontSize:11}} formatter={v=>fmt(v)}/><Area type="monotone" dataKey="value" name="Value" stroke={th.accent} fill={th.accent+"33"} strokeWidth={2}/><Area type="monotone" dataKey="contrib" name="Contributed" stroke={th.muted} fill={th.muted+"22"} strokeWidth={1}/></AreaChart></ResponsiveContainer></RS>}<PortfolioReportBlock client={client} t={t}/>

<div style={{textAlign:"center",fontSize:11,color:th.dim,paddingTop:16,borderTop:`1px solid ${th.cardBorder}`}}><a href="https://goldenanchor.life" target="_blank" rel="noreferrer" style={{color:GOLD,textDecoration:"none",fontWeight:700}}>⚓ Golden Anchor</a> · <a href="mailto:mauricio@goldenanchor.life" style={{color:th.muted,textDecoration:"none"}}>mauricio@goldenanchor.life</a> · Confidential Financial Report</div>
</div>;}

/* ── CLIENT REPORT (Summary tab + Full Report tab) ───────────────────────── */
function SummaryReport({client,lang,t}){const th=useTh();const net=sumN(client.incomeStreams),bills=sumB(client.bills),minD=sumMin(client.cards);const tA=totalA(client),tL=totalL(client);const h1=actB(client.bills).filter(b=>(b.dueDay||1)<=15),h2=actB(client.bills).filter(b=>(b.dueDay||1)>15);const RS=({label,items,fixed})=><div style={{...mCARD(th),padding:14,marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:10}}>{label}</div><table style={{width:"100%",borderCollapse:"collapse",fontSize:11,...(fixed?{tableLayout:"fixed"}:{})}}>{items}</table></div>;return<div><div style={{...mCARD(th),padding:18,marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:16}}><div><div style={{fontSize:20,fontWeight:800,color:th.text}}>{client.firstName} {client.lastName}{client.partnerFirst&&<span style={{color:th.muted,fontWeight:400}}> & {client.partnerFirst}</span>}</div><div style={{fontSize:11,color:th.muted,marginTop:4}}>{client.email}{client.phone?` · ${client.phone}`:""}</div></div><div style={{textAlign:"right",fontSize:11,color:th.dim}}>{t.generatedLbl||"Generated"} {fmtDate(new Date(),_gaLang())}</div></div><div data-ga-grid="kpi-4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}><SC label={"💼 "+(t.netIncome||"Net Income")} value={fmt(net)} color={th.pos}/><SC label={"💳 "+(t.totalBills||"Bills")} value={fmt(bills)} color={th.neg}/><SC label={"🏦 "+(t.totalDebt||"Total Debt")} value={fmt(client.cards.reduce((s,c)=>s+c.balance,0)+(client.loans||[]).reduce((s,l)=>s+l.balance,0))} color={th.warn}/><SC label={"💎 "+(t.netWorth||"Net Worth")} value={fmt(tA-tL)} color={tA-tL>=0?th.pos:th.neg}/></div></div><div data-ga-grid="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><div><RS label={"💼 "+(t.incomeHdr||"INCOME")} items={<><thead><tr><th style={mTH(th)}>{t.colSource||"Source"}</th><th style={mTHR(th)}>{t.colNetMo||"Net/mo"}</th></tr></thead><tbody>{client.incomeStreams.map(s=><tr key={s.id}><td style={mTD(th)}>{s.label}</td><td style={{...mTDR(th),color:th.pos,fontWeight:700}}>{fmt(toM(s.net,s.freq))}</td></tr>)}<tr><td style={{...mTD(th),fontWeight:700}}>{t.totalRowUpper||"TOTAL"}</td><td style={{...mTDR(th),fontWeight:800,color:th.pos}}>{fmt(net)}</td></tr></tbody></>}/><RS label={"📅 "+(t.bills||"Bills")+" 1-15"} fixed items={<><colgroup><col style={{width:"70%"}}/><col style={{width:"30%"}}/></colgroup><thead><tr><th style={mTH(th)}>{t.colName||"Name"}</th><th style={mTHR(th)}>{t.colMonthly||"Monthly"}</th></tr></thead><tbody>{h1.map(b=><tr key={b.id}><td style={mTD(th)}>{b.name}</td><td style={{...mTDR(th)}}>{fmt(toM(b.cost,b.freq))}</td></tr>)}{!h1.length&&<tr><td colSpan={2} style={{...mTD(th),color:th.dim,fontStyle:"italic"}}>{t.noneLbl||"None"}</td></tr>}</tbody></>}/><RS label={"📅 "+(t.bills||"Bills")+" 16-31"} fixed items={<><colgroup><col style={{width:"70%"}}/><col style={{width:"30%"}}/></colgroup><thead><tr><th style={mTH(th)}>{t.colName||"Name"}</th><th style={mTHR(th)}>{t.colMonthly||"Monthly"}</th></tr></thead><tbody>{h2.map(b=><tr key={b.id}><td style={mTD(th)}>{b.name}</td><td style={{...mTDR(th)}}>{fmt(toM(b.cost,b.freq))}</td></tr>)}<tr><td style={{...mTD(th),fontWeight:700}}>{t.totalRowUpper||"TOTAL"}</td><td style={{...mTDR(th),fontWeight:800,color:th.neg}}>{fmt(bills)}</td></tr></tbody></>}/></div><div><RS label={"💳 "+(t.debt||"Debt")} items={<><thead><tr><th style={mTH(th)}>{t.cardCol||"Card"}</th><th style={mTHR(th)}>{t.colBalance||"Balance"}</th><th style={mTHR(th)}>{t.colIntMo||"Int/mo"}</th><th style={mTHR(th)}>{t.colDue||"Due"}</th></tr></thead><tbody>{client.cards.map(c=><tr key={c.id}><td style={mTD(th)}>{c.name}{(c.promos||[]).length>0&&<Pill color="#8B5CF6">P</Pill>}</td><td style={{...mTDR(th),color:th.neg,fontWeight:700}}>{fmt(c.balance)}</td><td style={{...mTDR(th),color:th.warn,fontSize:11}}>{fmtD(cardMoInt(c))}</td><td style={{...mTDR(th),color:th.dim,fontSize:11}}>{c.dueDay?"D"+c.dueDay:"—"}</td></tr>)}{(client.loans||[]).length>0&&(client.loans||[]).map(l=><tr key={l.id}><td style={{...mTD(th),color:th.muted}}>{l.name}</td><td style={{...mTDR(th),color:th.neg}}>{fmt(l.balance)}</td><td colSpan={2} style={{...mTDR(th),color:th.dim,fontSize:11}}>{l.type}</td></tr>)}<tr><td style={{...mTD(th),fontWeight:700}}>{t.totalRowUpper||"TOTAL"}</td><td style={{...mTDR(th),fontWeight:800,color:th.neg}}>{fmt(client.cards.reduce((s,c)=>s+c.balance,0)+(client.loans||[]).reduce((s,l)=>s+l.balance,0))}</td><td colSpan={2}/></tr></tbody></>}/><RS label={"🏦 "+(t.accounts||"Accounts")} items={<><tbody>{(client.accounts||[]).map(a=><tr key={a.id}><td style={mTD(th)}>{ACCT_META[a.type]?.icon} {a.name}</td><td style={{...mTDR(th),color:th.pos}}>{fmt(+a.value)}</td></tr>)}{(client.customAssets||[]).map(a=><tr key={a.id}><td style={mTD(th)}>🏛️ {a.name}</td><td style={{...mTDR(th),color:th.pos}}>{fmt(+a.value)}</td></tr>)}<tr><td style={{...mTD(th),fontWeight:700}}>{t.netWorthHdrUpper||"NET WORTH"}</td><td style={{...mTDR(th),fontWeight:800,fontSize:15,color:tA-tL>=0?th.pos:th.neg}}>{fmt(tA-tL)}</td></tr></tbody></>}/>{client.notes?.goals&&<div style={{...mCARD(th),padding:14}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>🎯 {(t.clientGoals||"Goals").toUpperCase()}</div><div style={{fontSize:12,color:th.muted,lineHeight:1.7}}>{client.notes.goals}</div></div>}</div></div><div style={{fontSize:11,color:th.dim,textAlign:"center",padding:"10px 0",borderTop:`1px solid ${th.cardBorder}`,marginTop:8}}><a href="https://goldenanchor.life" target="_blank" rel="noreferrer" style={{color:GOLD,textDecoration:"none",fontWeight:600}}>⚓ Golden Anchor</a> · <a href="mailto:mauricio@goldenanchor.life" style={{color:th.muted,textDecoration:"none"}}>mauricio@goldenanchor.life</a></div></div>;}
/* ── NEW REPORT TAB COMPONENTS ───────────────────────────────────────────── */
function MonthlyReportTab({client,onUpdate,lang,t,settings}){const th=useTh();const[selMonth,setSelMonth]=useState("current");const[emailOpen,setEmailOpen]=useState(false);const{hClient,snap,hasData,isCur}=getClientForMonth(client,selMonth);const handleUpdate=updated=>{if(isCur)onUpdate(updated);else saveHistoricalUpdate(client,selMonth,onUpdate,updated);};return<div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}><div style={{display:"flex",alignItems:"center",gap:10}}><MonthSelector client={client} value={selMonth} onChange={setSelMonth} t={t}/>{!isCur&&snap&&<div style={{fontSize:11,color:th.dim}}>{t.savedOn||"Saved"} {snap.savedAt?fmtDate(new Date(snap.savedAt),_gaLang()):"—"}{snap.data&&<span style={{marginLeft:6}}><Pill color={th.pos}>● full data</Pill></span>}</div>}</div><div className="ga-np" style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><Btn small onClick={()=>setEmailOpen(true)} disabled={!hasData}>📧 {t?.emailReportBtn||"Email"}</Btn><PrintBtn label={"🖨️ "+(t?.printSavePdf||"Print / Save PDF")}/></div></div>{emailOpen&&<EmailReportModal client={client} lang={lang} t={t} settings={settings} reportType="monthly" onClose={()=>setEmailOpen(false)}/>}{!hasData?<NoDataMsg snap={snap}/>:<><ReportHdr client={client} selMonth={selMonth} isCur={isCur} t={t}/><div style={{marginBottom:20}}><SummarySection client={hClient} lang={lang} t={t}/></div><FullMonthView hClient={hClient} onHUpdate={handleUpdate} selMonth={selMonth} snap={snap} isCur={isCur} t={t} fullPage={true} reportMode={true}/><PlanReportBlock client={client} lang={lang} t={t}/></>}</div>;}
function FinancialStatementReportTab({client,lang,t,settings}){const th=useTh();const[selMonth,setSelMonth]=useState("current");const[emailOpen,setEmailOpen]=useState(false);const{hClient,snap,hasData,isCur}=getClientForMonth(client,selMonth);return<div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}><div style={{display:"flex",alignItems:"center",gap:10}}><MonthSelector client={client} value={selMonth} onChange={setSelMonth} t={t}/>{!isCur&&snap&&<span style={{fontSize:11,color:th.muted}}>{snap.label}</span>}</div><div className="ga-np" style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><Btn small onClick={()=>setEmailOpen(true)} disabled={!hasData}>📧 {t?.emailReportBtn||"Email"}</Btn><PrintBtn label={"🖨️ "+(t?.printSavePdf||"Print / Save PDF")}/></div></div>{emailOpen&&<EmailReportModal client={client} lang={lang} t={t} settings={settings} reportType="financial" onClose={()=>setEmailOpen(false)}/>}{!hasData?<NoDataMsg snap={snap}/>:<><ReportHdr client={client} selMonth={selMonth} isCur={isCur} t={t}/><FinancialStatementsTab client={hClient} lang={lang} t={t} fullPage={true}/><NotesSection client={client} onUpdate={()=>{}} t={t} reportMode={true}/><div style={{marginTop:20}}><PlanReportBlock client={client} lang={lang} t={t}/></div></>}</div>;}
function EmailReportModal({client,lang,t,settings,onClose,reportType="complete"}){
  const th=useTh();
  const initialTo=String(client?.email||"").trim();
  const[to,setTo]=useState(initialTo);
  const RPT_LABEL={monthly:lang==="es"?"Reporte Mensual":"Monthly Report",financial:lang==="es"?"Estados Financieros":"Financial Statements",complete:lang==="es"?"Reporte Financiero Completo":"Complete Financial Report"};const rptLabel=RPT_LABEL[reportType]||RPT_LABEL.complete;const[subj,setSubj]=useState((lang==="es"?`Tu ${rptLabel.toLowerCase()} — Golden Anchor`:`Your ${rptLabel} — Golden Anchor`));
  const defMsgEN="Attached is your financial report from your most recent session. Please review it at your convenience — reply to this email with any questions.";
  const defMsgES="Adjunto encontrarás tu reporte financiero de nuestra sesión más reciente. Revísalo cuando puedas — responde a este correo si tienes preguntas.";
  const[msg,setMsg]=useState(lang==="es"?defMsgES:defMsgEN);
  const[busy,setBusy]=useState(false);
  const[status,setStatus]=useState(null);
  const INP=mINP(th);
  const validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim());
  const send=async()=>{
    if(!validEmail){setStatus({ok:false,error:(t.emailReportInvalidTo||"Enter a valid recipient email.")});return;}
    setBusy(true);setStatus(null);
    const r=await gaEmailCompleteReport({
      clientId:String(client.id),
      to:to.trim(),
      subject:subj.trim()||(lang==="es"?"Tu reporte financiero":"Your financial report"),
      message:msg,
      lang,
      reportType,
      advisorName:settings?.advisorName||"",
      advisorEmail:settings?.advisorEmail||""
    });
    setBusy(false);
    setStatus(r);
    if(r.ok){setTimeout(()=>{onClose();},1600);}
  };
  return<Modal title={"📧 "+(lang==="es"?"Enviar ":"Email ")+rptLabel} onClose={onClose} width={520} disableBackdropClose>
    <div style={{fontSize:11,color:th.dim,marginBottom:14,lineHeight:1.55}}>{t.emailReportHelp||"Generates a PDF of the Complete Report and emails it to the recipient. Their reply will route to your Profile & Settings email."}</div>
    <Field label={t.emailReportTo||"Recipient email"}><input style={INP} value={to} onChange={e=>setTo(e.target.value)} placeholder="client@example.com" autoComplete="off"/></Field>
    <Field label={t.emailReportSubject||"Subject"}><input style={INP} value={subj} onChange={e=>setSubj(e.target.value)} autoComplete="off"/></Field>
    <Field label={t.emailReportMessage||"Message"}><textarea style={{...INP,minHeight:90,fontFamily:"inherit",resize:"vertical"}} value={msg} onChange={e=>setMsg(e.target.value)}/></Field>
    <div style={{fontSize:10,color:th.dim,marginTop:-4,marginBottom:14,fontStyle:"italic"}}>{t.emailReportSig||"Signature uses Advisor Name + Email from Profile & Settings."}</div>
    {status&&<div style={{fontSize:12,padding:"10px 12px",borderRadius:8,marginBottom:12,background:status.ok?th.pos+"11":th.neg+"11",border:`1px solid ${status.ok?th.pos:th.neg}44`,color:status.ok?th.pos:th.neg,lineHeight:1.5}}>{status.ok?("✓ "+(t.emailReportSent||"Sent. The PDF was attached and delivered.")):("✗ "+(status.error||(t.emailReportFailed||"Send failed.")))}</div>}
    <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:6}}>
      <Btn onClick={onClose} disabled={busy}>{t.cancel||"Cancel"}</Btn>
      <BSolid onClick={send} disabled={busy||!validEmail}>{busy?(t.emailReportSending||"Generating & sending…"):("📧 "+(t.emailReportSendBtn||"Send PDF"))}</BSolid>
    </div>
  </Modal>;
}
function CompleteReportTab({client,onUpdate,lang,t,settings}){
  const th=useTh();
  const[selMonth,setSelMonth]=useState("current");
  const[emailOpen,setEmailOpen]=useState(false);
  const{hClient,snap,hasData,isCur}=getClientForMonth(client,selMonth);
  const notes=client.notes||{};
  const hasNotes=!!(notes.goals||notes.shortTerm||notes.midTerm||notes.longTerm||notes.setbacks||notes.general);
  const hasPortfolio=!!client.savedPortfolio;
  const hasCompare=!!(client.savedCompare&&client.savedCompare.rows&&client.savedCompare.rows.length>=2);
  const hasCalcs=!!(client.savedCalcs&&client.savedCalcs.length>0);
  const hasPlan=!!(client.planStrategy||client.planOverrides?.phase1||client.planOverrides?.phase2||client.planOverrides?.phase3||client.planOverrides?.extra);
  // Per-client toggle of what appears on the report (default all on)
  const incl=client.reportInclude||{};
  const isOn=k=>incl[k]!==false;
  const toggle=k=>onUpdate({...client,reportInclude:{...incl,[k]:!isOn(k)}});
  const clearPortfolio=()=>{if(!confirm("Remove the portfolio from the Complete Report?"))return;onUpdate({...client,savedPortfolio:null});};
  const clearCompare=()=>{if(!confirm("Remove the compare snapshot from the Complete Report?"))return;onUpdate({...client,savedCompare:null});};
  const clearCalcs=()=>{if(!confirm("Remove all saved calculators from the Complete Report?"))return;onUpdate({...client,savedCalcs:[]});};
  const sectionRows=[
    {k:"notes",label:(t.notesGoalsHdrEmoji||"📝 Notes & Goals"),available:hasNotes,clear:null,help:"Fill in Notes & Goals tab"},
    {k:"portfolio",label:"💹 "+(t.selectedPortfolioHdr||"Selected Portfolio"),available:hasPortfolio,clear:clearPortfolio,help:'Use "📌 Include in Report" on the Portfolios tab'},
    {k:"compare",label:"📊 "+(t.periodComparisonHdr||"Period Comparison"),available:hasCompare,clear:clearCompare,help:'Save a snapshot from the Compare Report tab'},
    {k:"calcs",label:"🧮 "+(t.calcSnapsHdr||"Calculator Snapshots"),available:hasCalcs,clear:clearCalcs,help:"Save scenarios from the Calculators tab"},
    {k:"plan",label:(t.strategyPlanHdrEmoji||"📋 Strategy Plan"),available:hasPlan,clear:null,help:"Fill in the Strategy Plan tab"}
  ];
  return<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}><MonthSelector client={client} value={selMonth} onChange={setSelMonth} t={t}/>{!isCur&&snap&&<div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontSize:11,color:th.muted}}>{snap.label}</span>{snap.data&&<Pill color={th.pos}>● full data</Pill>}</div>}</div>
      <div className="ga-np" style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <Btn small onClick={()=>setEmailOpen(true)} disabled={!hasData}>📧 {t.emailReportBtn||"Email"}</Btn>
        <PrintBtn label={"🖨️ "+(t?.printSavePdf||"Print / Save PDF")}/>
      </div>
    </div>
    {emailOpen&&<EmailReportModal client={client} lang={lang} t={t} settings={settings} reportType="complete" onClose={()=>setEmailOpen(false)}/>}
    {!hasData?<NoDataMsg snap={snap}/>:<>
      {/* Report sections panel — control what's included and clear what isn't wanted */}
      <div className="ga-np" style={{...mCARD(th),padding:14,marginBottom:16,background:th.accent+"06",border:`1px solid ${th.accent}33`}}>
        <div style={{fontSize:12,fontWeight:700,color:th.accent,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>{t.reportSectionsHdrEmoji||"⚙️ Report Sections"}</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {sectionRows.map(r=>{const on=isOn(r.k)&&r.available;return<div key={r.k} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 10px",background:th.bg,borderRadius:6}}>
            <div onClick={()=>r.available&&toggle(r.k)} style={{width:32,height:18,borderRadius:99,background:on?th.pos:th.cardBorder,position:"relative",cursor:r.available?"pointer":"not-allowed",opacity:r.available?1:0.4,flexShrink:0}}><div style={{position:"absolute",top:2,left:on?16:2,width:14,height:14,borderRadius:99,background:"#fff",transition:"all 0.15s"}}/></div>
            <span style={{fontSize:12,color:r.available?th.text:th.dim,fontWeight:600,flex:1}}>{r.label}</span>
            {!r.available&&<span style={{fontSize:10,color:th.dim,fontStyle:"italic"}}>{r.help}</span>}
            {r.available&&r.clear&&<Btn small onClick={r.clear} color={th.neg}>🗑 Clear</Btn>}
          </div>;})}
        </div>
      </div>
      <ReportHdr client={client} selMonth={selMonth} isCur={isCur} t={t}/>
      {/* Main summary & detail (FullReport includes Income, Bills, Debt, Accounts, EF, Investment Allocation, Ratios, Trends, Portfolio Projection) */}
      <FullReport client={client} lang={lang} t={t} hClient={hClient}/>
      {/* Financial Statements: balance sheet, A&L, income stmt, cash flow — ratios are skipped to avoid duplication with FullReport */}
      <div style={{marginTop:24,borderTop:`2px solid ${th.cardBorder}`,paddingTop:24}}>
        <div style={{fontSize:12,fontWeight:800,color:th.accent,marginBottom:16,textTransform:"uppercase",letterSpacing:"0.08em"}}>📋 {t.financialStatements||"Financial Statements"}</div>
        <FinancialStatementsTab client={hClient} lang={lang} t={t} fullPage={true} skipRatios={true}/>
      </div>
      
      {isOn("compare")&&<CompareReportBlock client={client} t={t}/>}
      {isOn("calcs")&&<CalculatorsReportBlock client={client} t={t}/>}
      {isOn("notes")&&<NotesSection client={client} onUpdate={()=>{}} t={t} reportMode={true}/>}
      {isOn("plan")&&<PlanReportBlock client={client} lang={lang} t={t}/>}
    </>}
  </div>;
}

// ── Client-aware Income Calculator: P1/P2/Both, prefills hourly/salary from client ──
function ClientIncomeCalc({client,scope,t}){
  const th=useTh();
  const INP=mINP(th);
  const hasP2=!!client.partnerFirst;
  // Prefill from client incomeStreams for a person. We'll take first hourly-like stream for hourly, else salary.
  const prefillFor=person=>{
    const streams=(client.incomeStreams||[]).filter(s=>s.person===person||s.person==="joint");
    if(streams.length===0)return{pHourly:0,pHours:0,pSalary:0,sHourly:0,sHours:0,sSalary:0};
    const first=streams[0];const second=streams[1];
    const calcHourly=s=>{if(!s)return{hourly:0,hours:0,salary:0};const mo=toM(+s.gross||+s.net||0,s.freq);const annual=mo*12;// heuristic: if annual > 30000 and freq is bi-weekly/semi/weekly, treat as hourly
if(s.freq==="biweekly"||s.freq==="weekly"||s.freq==="semimonthly")return{hourly:Math.round(mo/173.33*100)/100,hours:40,salary:0};return{hourly:0,hours:0,salary:Math.round(annual)};};
    const p=calcHourly(first);const sec=calcHourly(second);
    return{pHourly:p.hourly,pHours:p.hours,pSalary:p.salary,sHourly:sec.hourly,sHours:sec.hours,sSalary:sec.salary};
  };
  const makeBaseState=(person)=>{const pre=prefillFor(person);return{filing:"single",age65:false,blind:false,spouseAge65:false,spouseBlind:false,stateRate:0,pHourly:pre.pHourly,pHours:pre.pHours,pOTHours:0,pOTMult:1.5,pWeeks:52,pSalary:pre.pSalary,sHourly:pre.sHourly,sHours:pre.sHours,sOTHours:0,sOTMult:1.5,sWeeks:52,sSalary:pre.sSalary,bonusOnce:0,bonusRecurring:0,bonusPeriods:0,otherIncome:0,retirePct:0,retireFixed:0,hsa:0,healthPremium:0,postTax:0,paychecks:26};};
  const[p1State,setP1State]=useState(()=>makeBaseState("p1"));
  const[p2State,setP2State]=useState(()=>makeBaseState("p2"));
  const u=(setter)=>k=>e=>setter(p=>({...p,[k]:typeof p[k]==="boolean"?e.target.checked:(+e.target.value||0)}));
  const us=(setter)=>k=>e=>setter(p=>({...p,[k]:e.target.value}));

  const computeResult=(f)=>{
    const pWage=f.pSalary>0?f.pSalary:(f.pHourly*f.pHours*f.pWeeks+f.pHourly*f.pOTMult*f.pOTHours*f.pWeeks);
    const sWage=f.sSalary>0?f.sSalary:(f.sHourly*f.sHours*f.sWeeks+f.sHourly*f.sOTMult*f.sOTHours*f.sWeeks);
    const totalBonus=f.bonusOnce+f.bonusRecurring*f.bonusPeriods;
    const gross=pWage+sWage+totalBonus+f.otherIncome;
    const preTax=gross*(f.retirePct/100)+f.retireFixed+f.hsa+f.healthPremium*12;
    const agiProxy=gross-preTax;
    let extraStd=0;if(f.age65)extraStd+=(f.filing==="single"||f.filing==="hoh")?2000:1600;if(f.blind)extraStd+=(f.filing==="single"||f.filing==="hoh")?2000:1600;if(f.filing==="mfj"){if(f.spouseAge65)extraStd+=1600;if(f.spouseBlind)extraStd+=1600;}
    let seniorBonus=0;if(f.age65){const maxB=f.filing==="mfj"?12000:6000;const ph=f.filing==="mfj"?150000:75000;if(agiProxy<=ph)seniorBonus=maxB;else if(agiProxy<ph+100000)seniorBonus=maxB*(1-(agiProxy-ph)/100000);}
    const stdDed=STD_DED[f.filing]+extraStd+seniorBonus;
    const taxable=Math.max(0,agiProxy-stdDed);
    const fedTax=calcFedTax(taxable,f.filing);
    const bracket=getBracket(taxable,f.filing);
    const stateTax=agiProxy*(f.stateRate/100);
    const ssTax=Math.min(gross,176100)*0.062;
    const medTax=gross*0.0145;
    const addMedTh=f.filing==="mfj"?250000:200000;
    const addMedTax=Math.max(0,gross-addMedTh)*0.009;
    const totalTax=fedTax+stateTax+ssTax+medTax+addMedTax;
    const netAnnual=gross-preTax-totalTax-f.postTax;
    return{gross,preTax,agiProxy,stdDed,taxable,fedTax,bracket,stateTax,ssTax,medTax,addMedTax,totalTax,netAnnual,grossCheck:gross/f.paychecks,netCheck:netAnnual/f.paychecks};
  };

  const renderForm=(f,setF,title)=>{
    const upd=u(setF);const updS=us(setF);
    return<div><div style={{fontSize:12,fontWeight:700,color:th.accent,marginBottom:10}}>{title}</div>
    <Row2><Field label={t?.filingLbl||"Filing"}><select style={INP} value={f.filing} onChange={updS("filing")}><option value="single">{t.singleLbl||"Single"}</option><option value="mfj">{t.mfjShort||"MFJ"}</option><option value="hoh">{t.hohShort||"HoH"}</option></select></Field><Field label={t?.stateTaxPct||"State %"}><MaskedNumInp style={INP} value={f.stateRate} onChange={upd("stateRate")} max={15}/></Field></Row2>
    <div style={{fontSize:10,fontWeight:700,color:th.dim,marginBottom:4,marginTop:8}}>{t.primaryJob||"PRIMARY JOB"}</div>
    <Row2><Field label={t.fldHourlyDollar||"Hourly $"}><MaskedNumInp style={INP} value={f.pHourly} onChange={upd("pHourly")}/></Field><Field label={t?.hrsPerWk||"Hrs/wk"}><MaskedNumInp style={INP} value={f.pHours} onChange={upd("pHours")} max={168}/></Field></Row2>
    <Field label={t?.orAnnualSalary||"Or Annual Salary"}><MaskedNumInp style={INP} value={f.pSalary} onChange={upd("pSalary")}/></Field>
    <div style={{fontSize:10,fontWeight:700,color:th.dim,marginBottom:4,marginTop:8}}>{t.secondJob||"SECOND JOB"}</div>
    <Row2><Field label={t.fldHourlyDollar||"Hourly $"}><MaskedNumInp style={INP} value={f.sHourly} onChange={upd("sHourly")}/></Field><Field label={t?.hrsPerWk||"Hrs/wk"}><MaskedNumInp style={INP} value={f.sHours} onChange={upd("sHours")} max={168}/></Field></Row2>
    <div style={{fontSize:10,fontWeight:700,color:th.dim,marginBottom:4,marginTop:8}}>{t.deductionsLbl||"DEDUCTIONS"}</div>
    <Row2><Field label={t?.retirePct||"Retire %"}><MaskedNumInp style={INP} value={f.retirePct} onChange={upd("retirePct")} max={100} step="0.5"/></Field><Field label={t?.paychecksPerYr||"Paychecks/yr"}><MaskedNumInp style={INP} value={f.paychecks} onChange={upd("paychecks")} max={52}/></Field></Row2>
    </div>;
  };

  const renderResult=(r,title)=>{
    return<div style={{...mCARD(th),padding:12,background:th.pos+"08",border:`1px solid ${th.pos}33`,marginTop:12}}>
      <div style={{fontSize:11,fontWeight:700,color:th.accent,marginBottom:8}}>{title}</div>
      <CalcRow label={t?.grossPerYr||"Gross/yr"} value={fmt(r.gross)} color={th.muted}/>
      <CalcRow label={t?.incomeTaxable||"Taxable"} value={fmt(r.taxable)} color={th.accent}/>
      <CalcRow label={t.incomeTotalTaxes||"Total Taxes"} value={fmt(r.totalTax)} color={th.neg}/>
      <CalcRow label={t?.netPerYr||"Net/yr"} value={fmt(r.netAnnual)} color={th.pos} big/>
      <CalcRow label={t.incomeNetPerCheck||"Net/paycheck"} value={fmt(r.netCheck)} color={th.pos}/>
    </div>;
  };

  const r1=computeResult(p1State);const r2=computeResult(p2State);
  const combined={gross:r1.gross+r2.gross,netAnnual:r1.netAnnual+r2.netAnnual,totalTax:r1.totalTax+r2.totalTax,taxable:r1.taxable+r2.taxable};

  if((scope==="both"||scope==="joint")&&hasP2)return<div><div style={{fontSize:11,color:th.dim,marginBottom:14,fontStyle:"italic"}}>Prefilled from client data where possible. Edit freely — nothing saves back.</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}><div>{renderForm(p1State,setP1State,`👤 ${client.firstName}`)}{renderResult(r1,"Results")}</div><div>{renderForm(p2State,setP2State,`👤 ${client.partnerFirst}`)}{renderResult(r2,"Results")}</div></div>
    <div style={{...mCARD(th),padding:14,marginTop:16,background:GOLD+"11",border:`1px solid ${GOLD}44`}}><div style={{fontSize:12,fontWeight:800,color:GOLD,marginBottom:8}}>👥 HOUSEHOLD COMBINED</div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}><div><div style={{fontSize:10,color:th.dim}}>Gross/yr</div><div style={{fontSize:14,fontWeight:800,color:th.muted}}>{fmt(combined.gross)}</div></div><div><div style={{fontSize:10,color:th.dim}}>Taxable</div><div style={{fontSize:14,fontWeight:800,color:th.accent}}>{fmt(combined.taxable)}</div></div><div><div style={{fontSize:10,color:th.dim}}>Total Tax</div><div style={{fontSize:14,fontWeight:800,color:th.neg}}>{fmt(combined.totalTax)}</div></div><div><div style={{fontSize:10,color:th.dim}}>Net/yr</div><div style={{fontSize:14,fontWeight:800,color:th.pos}}>{fmt(combined.netAnnual)}</div></div></div></div>
    </div>;
  if(scope==="p2"&&hasP2)return<div><div style={{fontSize:11,color:th.dim,marginBottom:14,fontStyle:"italic"}}>Prefilled from {client.partnerFirst}&#39;s income streams.</div>{renderForm(p2State,setP2State,`👤 ${client.partnerFirst}`)}{renderResult(r2,"Results")}</div>;
  return<div><div style={{fontSize:11,color:th.dim,marginBottom:14,fontStyle:"italic"}}>Prefilled from {client.firstName}&#39;s income streams.</div>{renderForm(p1State,setP1State,`👤 ${client.firstName}`)}{renderResult(r1,"Results")}</div>;
}

// ── Client-aware Debt Reduction: multi-select cards/loans with weighted avg APR ──
function ClientDebtCalc({client,scope,t}){
  const th=useTh();
  const INP=mINP(th);
  const allDebts=[...(client.cards||[]).map(c=>({...c,debtType:"card",person:c.owedBy||"joint"})),...(client.loans||[]).filter(l=>!l.linkedAssetId).map(l=>({...l,debtType:"loan",person:l.owner||"joint"}))];
  const scopedDebts=scope==="joint"?allDebts:allDebts.filter(d=>d.person===scope||d.person==="joint");
  const[selIds,setSelIds]=useState(new Set(scopedDebts.map(d=>d.id)));
  const[extraPay,setExtraPay]=useState(0);
  const[strat,setStrat]=useState("avalanche");
  const[scenarios,setScenarios]=useState([]);// new hypothetical debts: {id,name,balance,apr,min,debtType}
  const[newScen,setNewScen]=useState({name:"",balance:"",apr:"",min:"",debtType:"card"});
  const[showScen,setShowScen]=useState(false);
  const allCombined=[...scopedDebts,...scenarios];
  const sel=allCombined.filter(d=>selIds.has(d.id));
  const toggle=id=>setSelIds(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const markAll=()=>setSelIds(new Set(allCombined.map(d=>d.id)));
  const clearAll=()=>setSelIds(new Set());
  const addScen=()=>{if(!newScen.name||!newScen.balance){alert("Name and Balance required.");return;}const s={id:"scen_"+Date.now(),name:newScen.name,balance:+newScen.balance||0,apr:+newScen.apr||0,min:+newScen.min||0,debtType:newScen.debtType,person:"scenario",isScenario:true};setScenarios(p=>[...p,s]);setSelIds(p=>new Set([...p,s.id]));setNewScen({name:"",balance:"",apr:"",min:"",debtType:"card"});setShowScen(false);};
  const delScen=id=>{setScenarios(p=>p.filter(s=>s.id!==id));setSelIds(p=>{const n=new Set(p);n.delete(id);return n;});};
  const sumBal=sel.reduce((s,d)=>s+(+d.balance||0),0);
  const weightedApr=sumBal>0?sel.reduce((s,d)=>s+((+d.balance||0)*(+d.apr||0)),0)/sumBal:0;
  const sumMinPay=sel.reduce((s,d)=>s+(d.debtType==="card"?(d.isScenario?(+d.min||Math.max(25,(+d.balance||0)*0.02)):effectiveMin(d)):Math.max(+d.min||0,Math.max(25,Math.round((+d.balance||0)*0.01)))),0);
  const totalMonthly=sumMinPay+extraPay;
  const r=weightedApr/100/12;
  const months=totalMonthly>0&&sumBal>0?(r>0?Math.log(totalMonthly/(totalMonthly-sumBal*r))/Math.log(1+r):sumBal/totalMonthly):0;
  const totalInt=totalMonthly*months-sumBal;
  // CC vs Loan breakdown
  const ccSel=sel.filter(d=>d.debtType==="card");const loanSel=sel.filter(d=>d.debtType==="loan");
  const ccBal=ccSel.reduce((s,d)=>s+(+d.balance||0),0);const loanBal=loanSel.reduce((s,d)=>s+(+d.balance||0),0);
  const ccApr=ccBal>0?ccSel.reduce((s,d)=>s+((+d.balance||0)*(+d.apr||0)),0)/ccBal:0;
  const loanApr=loanBal>0?loanSel.reduce((s,d)=>s+((+d.balance||0)*(+d.apr||0)),0)/loanBal:0;
  const ccMin=ccSel.reduce((s,d)=>s+(d.isScenario?(+d.min||Math.max(25,(+d.balance||0)*0.02)):effectiveMin(d)),0);
  const loanMin=loanSel.reduce((s,d)=>s+Math.max(+d.min||0,Math.max(25,Math.round((+d.balance||0)*0.01))),0);

  return<div><div style={{fontSize:11,color:th.dim,marginBottom:14,fontStyle:"italic"}}>Prefilled from {scope==="joint"?"all":scope==="p1"?client.firstName+"'s":client.partnerFirst+"'s"} cards & loans. Add hypothetical debts with <b>＋ Scenario</b>.</div>

  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
    <span style={{fontSize:11,fontWeight:700,color:th.dim}}>DEBTS TO INCLUDE ({sel.length}/{allCombined.length})</span>
    <div style={{display:"flex",gap:4}}>
      <button onClick={markAll} style={{fontSize:10,padding:"3px 8px",borderRadius:5,background:"transparent",color:th.pos,border:`1px solid ${th.pos}55`,cursor:"pointer",fontWeight:600}}>✓ {t.markAll||"Mark all"}</button>
      <button onClick={clearAll} style={{fontSize:10,padding:"3px 8px",borderRadius:5,background:"transparent",color:th.dim,border:`1px solid ${th.cardBorder}`,cursor:"pointer",fontWeight:600}}>✗ {t.clearAll||"Clear all"}</button>
      <button onClick={()=>setShowScen(s=>!s)} style={{fontSize:10,padding:"3px 8px",borderRadius:5,background:th.accent+"22",color:th.accent,border:`1px solid ${th.accent}55`,cursor:"pointer",fontWeight:600}}>{showScen?"Cancel":"＋ Scenario"}</button>
    </div>
  </div>

  {showScen&&<div style={{...mCARD(th),padding:12,marginBottom:10,background:th.accent+"08",border:`1px solid ${th.accent}33`}}>
    <div style={{fontSize:11,fontWeight:700,color:th.accent,marginBottom:8}}>{t.newHypoDebt||"New Hypothetical Debt"}</div>
    <Row2><Field label={t?.name||"Name"}><input style={INP} value={newScen.name} onChange={e=>setNewScen(p=>({...p,name:e.target.value}))} placeholder="e.g. New Card"/></Field><Field label={t.type||"Type"}><select style={INP} value={newScen.debtType} onChange={e=>setNewScen(p=>({...p,debtType:e.target.value}))}><option value="card">{t.creditCard||"Credit Card"}</option><option value="loan">{t?.loanOpt||"Loan"}</option></select></Field></Row2>
    <Row2><Field label={t?.loanBalance||"Balance ($)"}><MaskedNumInp style={INP} value={newScen.balance} onChange={e=>setNewScen(p=>({...p,balance:e.target.value}))} onKeyDown={bE}/></Field><Field label={t?.loanApr||"APR (%)"}><MaskedNumInp style={INP} value={newScen.apr} onChange={e=>setNewScen(p=>({...p,apr:e.target.value}))} onKeyDown={bE} step="0.1"/></Field></Row2>
    <Field label={t?.minPaymentMoOpt||"Min Payment ($/mo, optional)"}><MaskedNumInp style={INP} value={newScen.min} onChange={e=>setNewScen(p=>({...p,min:e.target.value}))} onKeyDown={bE}/></Field>
    <div style={{display:"flex",gap:6,justifyContent:"flex-end",marginTop:8}}><Btn small onClick={()=>setShowScen(false)}>Cancel</Btn><BSolid onClick={addScen} style={{fontSize:11,padding:"4px 12px"}}>Add Scenario</BSolid></div>
  </div>}

  {allCombined.length===0?<div style={{fontSize:12,color:th.dim,fontStyle:"italic",padding:10}}>{t.noScopeDebts||"No debts for this scope. Add a scenario above to test."}</div>:<div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:14,maxHeight:220,overflowY:"auto"}}>{allCombined.map(d=>{const s=selIds.has(d.id);return<div key={d.id} onClick={()=>toggle(d.id)} style={{...mCARD(th),padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,border:`1px solid ${s?th.accent:th.cardBorder}`,background:d.isScenario?th.accent+"08":th.card}}><div style={{width:16,height:16,borderRadius:3,background:s?th.accent:th.cardBorder,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",flexShrink:0}}>{s&&"✓"}</div><div style={{flex:1,fontSize:12,color:th.text}}><b>{d.name}</b> <span style={{color:th.dim,fontSize:10}}>({d.debtType}{d.isScenario?" · scenario":""})</span></div><span style={{fontSize:11,color:th.neg,fontWeight:700}}>{fmt(d.balance)}</span><span style={{fontSize:11,color:th.warn}}>{(+d.apr||0).toFixed(1)}%</span>{d.isScenario&&<button onClick={e=>{e.stopPropagation();delScen(d.id);}} style={{fontSize:10,padding:"1px 6px",borderRadius:4,background:"#EF444422",color:"#EF4444",border:"none",cursor:"pointer"}}>×</button>}</div>;})}</div>}

  {/* CC vs Loan breakdown */}
  {(ccSel.length>0||loanSel.length>0)&&<div style={{...mCARD(th),padding:14,marginBottom:12}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:10}}>💳 CC vs 🏦 LOAN BREAKDOWN</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div style={{padding:10,background:th.neg+"08",borderRadius:8,border:`1px solid ${th.neg}33`}}><div style={{fontSize:11,fontWeight:700,color:th.neg,marginBottom:6}}>💳 Credit Cards ({ccSel.length})</div><div style={{fontSize:10,color:th.dim}}>{t.balanceColon||"Balance:"} <b style={{color:th.neg}}>{fmt(ccBal)}</b></div><div style={{fontSize:10,color:th.dim}}>{t.avgAprColon||"Avg APR:"} <b style={{color:th.warn}}>{ccApr.toFixed(2)}%</b></div><div style={{fontSize:10,color:th.dim}}>{t.minMoColon||"Min/mo:"} <b style={{color:GOLD}}>{fmt(ccMin)}</b></div></div><div style={{padding:10,background:th.blue+"08",borderRadius:8,border:`1px solid ${th.blue}33`}}><div style={{fontSize:11,fontWeight:700,color:th.blue,marginBottom:6}}>🏦 Loans ({loanSel.length})</div><div style={{fontSize:10,color:th.dim}}>{t.balanceColon||"Balance:"} <b style={{color:th.neg}}>{fmt(loanBal)}</b></div><div style={{fontSize:10,color:th.dim}}>{t.avgAprColon||"Avg APR:"} <b style={{color:th.warn}}>{loanApr.toFixed(2)}%</b></div><div style={{fontSize:10,color:th.dim}}>{t.minMoColon||"Min/mo:"} <b style={{color:GOLD}}>{fmt(loanMin)}</b></div></div></div></div>}

  <div style={{...mCARD(th),padding:14,marginBottom:12}}><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}><div><div style={{fontSize:10,color:th.dim}}>{t.totalBalance||"Total Balance"}</div><div style={{fontSize:15,fontWeight:800,color:th.neg}}>{fmt(sumBal)}</div></div><div><div style={{fontSize:10,color:th.dim}}>{t.weightedApr||"Weighted APR"}</div><div style={{fontSize:15,fontWeight:800,color:th.warn}}>{weightedApr.toFixed(2)}%</div></div><div><div style={{fontSize:10,color:th.dim}}>{t.minPayMo||"Min Pay/mo"}</div><div style={{fontSize:15,fontWeight:800,color:GOLD}}>{fmt(sumMinPay)}</div></div></div></div>
  <Row2><Field label={t?.extraMonthly||"Extra Monthly Payment ($)"}><MaskedNumInp style={INP} value={extraPay} onChange={e=>setExtraPay(+e.target.value||0)}/></Field><Field label={t?.strategyLbl||"Strategy"}><select style={INP} value={strat} onChange={e=>setStrat(e.target.value)}><option value="avalanche">{t?.avalancheOpt||"Avalanche (highest APR first)"}</option><option value="snowball">{t?.snowballOpt||"Snowball (smallest balance first)"}</option></select></Field></Row2>
  <div style={{...mCARD(th),padding:14,marginTop:10,background:th.pos+"08",border:`1px solid ${th.pos}33`}}>
    <CalcRow label={t?.monthlyPmtMinExtra||"Monthly Payment (min + extra)"} value={fmt(totalMonthly)} color={th.accent}/>
    <CalcRow label={t.payoffTimeLbl||"Payoff Time"} value={sumBal>0&&totalMonthly>0?Math.ceil(months)+" mo ("+(months/12).toFixed(1)+" yr)":"N/A"} color={th.pos} big/>
    <CalcRow label={t.totalInterest||"Total Interest"} value={fmt(totalInt)} color={th.neg}/>
    <CalcRow label={t.totalPaidLbl||"Total Paid"} value={fmt(sumBal+totalInt)} color={th.muted}/>
  </div>
  <div style={{...mCARD(th),padding:12,marginTop:10,fontSize:11,color:th.dim,lineHeight:1.6}}>ℹ️ Payoff uses blended weighted APR across selected debts. {strat==="avalanche"?"Avalanche prioritizes high-APR debts first (saves more interest).":"Snowball prioritizes smallest balances first (faster psychological wins)."}</div>
  </div>;
}

// ── Client-aware Car Loan Calc: picks from client properties tagged Vehicle or loans with type=vehicle ──
function ClientCarLoanCalc({client,scope,t}){
  const th=useTh();
  const INP=mINP(th);
  const vehicleLoans=(client.loans||[]).filter(l=>l.type==="vehicle"||l.type==="auto");
  const vehicleProps=(client.customAssets||[]).filter(a=>a.cat==="Vehicle");
  const[selLoanIds,setSelLoanIds]=useState(new Set(vehicleLoans.map(l=>l.id)));
  const[selVehId,setSelVehId]=useState(vehicleProps[0]?.id||"none");
  const[f,setF]=useState(()=>{
    const firstVeh=vehicleProps[0];
    return{price:firstVeh?+firstVeh.value||30000:30000,down:0,tradeIn:0,tradeInPayoff:0,salesTaxPct:7,dealerFee:0,docFee:0,titleTag:0,gapIns:0,extWarranty:0,apr:6.9,term:60,rebate:0};
  });
  // When vehicle selection changes, update price field
  useEffect(()=>{if(selVehId==="none")return;const v=vehicleProps.find(x=>x.id===selVehId);if(v){setF(p=>({...p,price:+v.value||p.price}));}},[selVehId]);// eslint-disable-line
  const selVeh=vehicleProps.find(v=>v.id===selVehId);
  const u=k=>e=>setF(p=>({...p,[k]:+e.target.value||0}));
  const toggleLoan=id=>setSelLoanIds(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const selLoans=vehicleLoans.filter(l=>selLoanIds.has(l.id));
  const sumExistingBal=selLoans.reduce((s,l)=>s+(+l.balance||0),0);
  const wAvgApr=sumExistingBal>0?selLoans.reduce((s,l)=>s+((+l.balance||0)*(+l.apr||0)),0)/sumExistingBal:0;
  const taxableBase=f.price-f.tradeIn-f.rebate;
  const salesTax=Math.max(0,taxableBase)*(f.salesTaxPct/100);
  const fees=f.dealerFee+f.docFee+f.titleTag+f.gapIns+f.extWarranty;
  const totalPrice=f.price+salesTax+fees-f.rebate;
  const amountFinanced=Math.max(0,totalPrice-f.down-f.tradeIn+f.tradeInPayoff);
  const mp=amountFinanced>0?mthPmt(amountFinanced,f.apr/100,f.term):0;
  return<div><div style={{fontSize:11,color:th.dim,marginBottom:14,fontStyle:"italic"}}>Prefilled from client&#39;s vehicles. Select existing vehicle loans to include their weighted-avg APR.</div>
    {vehicleProps.length>0&&<><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>SELECT VEHICLE (from Properties)</div><div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>{vehicleProps.map(v=><button key={v.id} onClick={()=>setSelVehId(v.id)} style={{fontSize:11,padding:"5px 12px",borderRadius:7,cursor:"pointer",background:selVehId===v.id?th.accent+"22":"transparent",color:selVehId===v.id?th.accent:th.muted,border:`1px solid ${selVehId===v.id?th.accent:th.cardBorder}`,fontWeight:selVehId===v.id?700:400}}>🚗 {v.name} · {fmt(+v.value||0)}</button>)}<button onClick={()=>setSelVehId("none")} style={{fontSize:11,padding:"5px 12px",borderRadius:7,cursor:"pointer",background:selVehId==="none"?th.dim+"22":"transparent",color:selVehId==="none"?th.muted:th.dim,border:`1px solid ${selVehId==="none"?th.dim:th.cardBorder}`,fontWeight:selVehId==="none"?700:400}}>— Manual entry —</button></div>{selVeh&&<div style={{fontSize:11,color:th.muted,marginBottom:10,padding:"6px 10px",background:th.accent+"08",borderRadius:6}}>Using: <b>{selVeh.name}</b>{selVeh.desc?` — ${selVeh.desc}`:""} · Value populated as price</div>}</>}
    {vehicleLoans.length>0&&<><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>EXISTING VEHICLE LOANS (optional)</div><div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:12,maxHeight:150,overflowY:"auto"}}>{vehicleLoans.map(l=>{const s=selLoanIds.has(l.id);return<div key={l.id} onClick={()=>toggleLoan(l.id)} style={{...mCARD(th),padding:"7px 12px",cursor:"pointer",display:"flex",gap:8,alignItems:"center",border:`1px solid ${s?th.accent:th.cardBorder}`}}><div style={{width:16,height:16,borderRadius:3,background:s?th.accent:th.cardBorder,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff"}}>{s&&"✓"}</div><span style={{flex:1,fontSize:12}}>{l.name}</span><span style={{fontSize:11,color:th.neg}}>{fmt(l.balance)}</span><span style={{fontSize:11,color:th.warn}}>{(+l.apr||0).toFixed(1)}%</span></div>;})}</div>{sumExistingBal>0&&<div style={{fontSize:11,color:th.muted,marginBottom:12,padding:"6px 10px",background:th.blue+"08",borderRadius:6}}>Existing weighted APR: <b>{wAvgApr.toFixed(2)}%</b> · applied as default below</div>}</>}
  {sumExistingBal>0&&wAvgApr!==f.apr&&<button onClick={()=>setF(p=>({...p,apr:Number(wAvgApr.toFixed(2))}))} style={{fontSize:11,padding:"4px 10px",borderRadius:6,background:th.blue+"22",color:th.blue,border:`1px solid ${th.blue}44`,cursor:"pointer",marginBottom:10}}>Use existing APR ({wAvgApr.toFixed(2)}%)</button>}
  <Row2><Field label={t.carVehiclePriceRow||"Vehicle Price"}><MaskedNumInp style={INP} value={f.price} onChange={u("price")}/></Field><Field label={t?.carRebate||"Rebate"}><MaskedNumInp style={INP} value={f.rebate} onChange={u("rebate")}/></Field></Row2>
  <Row2><Field label={t?.carTradeIn||"Trade-In"}><MaskedNumInp style={INP} value={f.tradeIn} onChange={u("tradeIn")}/></Field><Field label={t?.carTradePayoff||"Trade Payoff"}><MaskedNumInp style={INP} value={f.tradeInPayoff} onChange={u("tradeInPayoff")}/></Field></Row2>
  <Row2><Field label={t?.carDownLbl||"Down"}><MaskedNumInp style={INP} value={f.down} onChange={u("down")}/></Field><Field label={t.aprPh||"APR %"}><MaskedNumInp style={INP} value={f.apr} onChange={u("apr")} step="0.1"/></Field></Row2>
  <Row2><Field label={t?.carSalesTaxPct||"Sales Tax %"}><MaskedNumInp style={INP} value={f.salesTaxPct} onChange={u("salesTaxPct")} step="0.01"/></Field><Field label={t?.carFeesTotal||"Fees total"}><MaskedNumInp style={INP} value={fees} onChange={e=>setF(p=>({...p,dealerFee:+e.target.value||0,docFee:0,titleTag:0,gapIns:0,extWarranty:0}))}/></Field></Row2>
  <Field label={`${t.carTermLbl||"Term"}: ${f.term} ${t.carMonthsLbl||"months"}`}><input type="range" min={12} max={84} step={6} value={f.term} onChange={u("term")} style={{width:"100%",accentColor:th.accent,cursor:"pointer"}}/></Field>
  <div style={{...mCARD(th),padding:14,marginTop:12,background:th.pos+"08",border:`1px solid ${th.pos}33`}}>
    <CalcRow label={t.carTotalPriceRow||"Total Price"} value={fmt(totalPrice)} color={th.muted}/>
    <CalcRow label={t?.amountFinanced||"Amount Financed"} value={fmt(amountFinanced)} color={th.accent}/>
    <CalcRow label={t?.monthlyPayment||"Monthly Payment"} value={fmt(mp)} color={th.accent} big/>
    <CalcRow label={t.totalInterest||"Total Interest"} value={fmt(mp*f.term-amountFinanced)} color={th.neg}/>
  </div>
  </div>;
}

function ClientCalculatorsTab({client,onUpdate,t}){
  const th=useTh();
  const[tab,setTab]=useState("income");
  const hasP2=!!client.partnerFirst;
  const[scope,setScope]=useState(hasP2?"joint":"p1");
  const calcs=[
    {id:"income",emoji:"💰",label:"Income",C:"client-income",hasScope:true},
    {id:"debtReduction",emoji:"📉",label:"Debt Reduction",C:"client-debt",hasScope:true},
    {id:"carLoan",emoji:"🚗",label:"Car Loan",C:"client-car",hasScope:false},
    {id:"affordability",emoji:"🏡",label:"Affordability",C:AffordabilityCalc,hasScope:false},
    {id:"homeEquity",emoji:"🏠",label:"Home",C:HomeEquityCalc,hasScope:false},
    {id:"retirement",emoji:"🎯",label:"Retirement",C:RetirementCalc,hasScope:false},
    {id:"portfolio",emoji:"📈",label:"Portfolio",C:PortfolioStandaloneCalc,hasScope:false},
    {id:"interest",emoji:"📊",label:"Interest",C:InterestCalc,hasScope:false},
    {id:"savings",emoji:"💎",label:"HY Savings",C:SavingsCalc,hasScope:false}
  ];
  const current=calcs.find(c=>c.id===tab);
  const saved=client.savedCalcs||[];
  const existingSnap=saved.find(s=>s.calcId===tab);
  const calcBoxRef=useRef(null);

  // Capture inputs + CalcRow outputs from the DOM so saved snapshot shows actual numbers.
  const captureSnapshot=()=>{
    const root=calcBoxRef.current;if(!root)return{inputs:[],outputs:[]};
    const inputs=[];
    root.querySelectorAll("[data-cf]").forEach(field=>{
      const label=field.getAttribute("data-cf")||"";
      if(!label)return;
      const el=field.querySelector("input,select,textarea");
      if(!el)return;
      let val=el.value;
      if(el.tagName==="SELECT"){const opt=el.options[el.selectedIndex];if(opt)val=opt.text;}
      if(val===""||val==null)return;
      inputs.push({label,value:String(val)});
    });
    const outputs=[];
    root.querySelectorAll("[data-cr-label]").forEach(row=>{
      const label=row.getAttribute("data-cr-label")||"";
      const value=row.getAttribute("data-cr-value")||"";
      const big=row.getAttribute("data-cr-big")==="1";
      if(!label||!value)return;
      outputs.push({label,value,big});
    });
    return{inputs,outputs};
  };

  const saveSnapshot=()=>{
    const captured=captureSnapshot();
    const scopeLabel=current.hasScope?(scope==="joint"?(t.viewBoth||"Both"):scope==="p1"?client.firstName:client.partnerFirst):null;
    const snap={calcId:tab,name:current.emoji+" "+current.label,scope:scopeLabel,savedAt:new Date().toISOString(),inputs:captured.inputs,outputs:captured.outputs};
    const newSaved=existingSnap?saved.map(s=>s.calcId===tab?snap:s):[...saved,snap];
    onUpdate({...client,savedCalcs:newSaved});
    alert("✓ Snapshot saved. It will appear in the Complete Report.");
  };
  const clearSnapshot=()=>{
    if(!confirm(`Clear the saved ${current.label} snapshot?`))return;
    onUpdate({...client,savedCalcs:saved.filter(s=>s.calcId!==tab)});
  };
  const clearAllSnapshots=()=>{
    if(!confirm(`Clear ALL ${saved.length} calculator snapshot(s)?`))return;
    onUpdate({...client,savedCalcs:[]});
  };

  return<div>
    <div style={{...mCARD(th),padding:14,marginBottom:16,background:th.blue+"08",border:`1px solid ${th.blue}33`}}><div style={{fontSize:12,fontWeight:700,color:th.blue,marginBottom:4}}>🧮 {t.clientCalculators||"Client Calculators"}</div><div style={{fontSize:11,color:th.muted,lineHeight:1.6}}>Each calculator prefills from the client&#39;s data. Scratch-pad only — changes don&#39;t affect the profile. Click <b>Save Snapshot</b> to include the current state in the Complete Report.</div></div>

    {/* TAB BAR */}
    <div style={{display:"flex",gap:4,marginBottom:16,borderBottom:`1px solid ${th.cardBorder}`,paddingBottom:0,flexWrap:"wrap"}}>{calcs.map(c=><button key={c.id} onClick={()=>setTab(c.id)} style={{fontSize:12,padding:"8px 14px",background:"transparent",border:"none",cursor:"pointer",color:tab===c.id?th.accent:th.muted,fontWeight:tab===c.id?700:500,borderBottom:tab===c.id?`2px solid ${th.accent}`:"2px solid transparent",marginBottom:-1,whiteSpace:"nowrap"}}>{c.emoji} {c.label}{saved.some(s=>s.calcId===c.id)&&<span style={{marginLeft:4,fontSize:9,color:th.pos}}>●</span>}</button>)}</div>

    {/* HEADER: scope + save/clear buttons */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <h3 style={{fontSize:15,fontWeight:800,color:th.text,margin:0}}>{current.emoji} {current.label}</h3>
        {current.hasScope&&hasP2&&<div style={{display:"flex",gap:4,marginLeft:8}}>{[["joint","👥 Both"],["p1",`👤 ${client.firstName}`],["p2",`👤 ${client.partnerFirst}`]].map(([v,l])=><button key={v} onClick={()=>setScope(v)} style={{fontSize:10,padding:"4px 10px",borderRadius:7,cursor:"pointer",background:scope===v?th.accent+"22":"transparent",color:scope===v?th.accent:th.muted,border:`1px solid ${scope===v?th.accent:th.cardBorder}`,fontWeight:scope===v?700:400}}>{l}</button>)}</div>}
      </div>
      <div style={{display:"flex",gap:6}}>
        {existingSnap&&<Btn small onClick={clearSnapshot} color={th.neg}>🗑️ {t.clearSnapshot||"Clear Snapshot"}</Btn>}
        <BSolid onClick={saveSnapshot} style={{fontSize:11,padding:"5px 12px"}}>{existingSnap?"💾 Update Snapshot":"📌 Save Snapshot"}</BSolid>
        {saved.length>0&&<Btn small onClick={clearAllSnapshots} color={th.warn}>Clear All ({saved.length})</Btn>}
      </div>
    </div>

    {/* CALCULATOR RENDER */}
    <div ref={calcBoxRef} style={{maxWidth:900}}>{current.C==="client-income"?<ClientIncomeCalc client={client} scope={scope} t={t}/>:current.C==="client-debt"?<ClientDebtCalc client={client} scope={scope} t={t}/>:current.C==="client-car"?<ClientCarLoanCalc client={client} scope={scope} t={t}/>:(()=>{const Comp=current.C;return<Comp t={t}/>;})()}</div>
  </div>;}

function BackfillTab({client,onUpdate,t}){
  const th=useTh();
  const[secType,setSecType]=useState("bills");
  const[mode,setMode]=useState("update"); // "update" or "new"
  const[selRow,setSelRow]=useState(null);
  const[editDraft,setEditDraft]=useState(null);
  const[newRowModal,setNewRowModal]=useState(false);
  const[newRowData,setNewRowData]=useState(null); // Data from add modal to push
  const[selMonths,setSelMonths]=useState(new Set());
  const INP=mINP(th);

  const sections={
    bills:{label:"💳 Bills",rows:client.bills||[],key:"bills",display:r=>`${r.name||"?"} · ${fmt(+r.cost||0)} ${t[r.freq]||r.freq||""}`},
    cards:{label:"💳 Credit Cards",rows:client.cards||[],key:"cards",display:r=>`${r.name||"?"} · Bal ${fmt(+r.balance||0)} · ${r.apr||0}% APR`},
    loans:{label:"🏦 Loans",rows:(client.loans||[]).filter(l=>!l.linkedAssetId),key:"loans",display:r=>`${r.name||"?"} · Bal ${fmt(+r.balance||0)} · ${r.apr||0}% APR`},
    accounts:{label:"💰 Accounts",rows:client.accounts||[],key:"accounts",display:r=>`${r.name||"?"} · ${fmt(+r.value||0)}`},
    customAssets:{label:"🏛️ Properties",rows:client.customAssets||[],key:"customAssets",display:r=>`${r.name||"?"} · ${fmt(+r.value||0)}`},
    incomeStreams:{label:"💼 Income",rows:client.incomeStreams||[],key:"incomeStreams",display:r=>`${r.label||"?"} · ${fmt(+r.net||0)}/${t[r.freq]||r.freq||"?"}`}
  };
  const cur=sections[secType];
  const snaps=(client.monthSnapshots||[]).slice().reverse();
  const toggleMonth=l=>setSelMonths(p=>{const n=new Set(p);n.has(l)?n.delete(l):n.add(l);return n;});

  // Applies a row (either editDraft for update, or newRowData for new) to selected months
  const applyToMonths=(rowData,isNew)=>{
    if(!rowData||selMonths.size===0){alert("Select at least one month.");return;}
    const newSnaps=(client.monthSnapshots||[]).map(s=>{if(!selMonths.has(s.label)||!s.data)return s;
      const data={...s.data};const rowsInSnap=data[cur.key]||[];const exists=rowsInSnap.find(r=>r.id===rowData.id);
      if(isNew&&!exists)data[cur.key]=[...rowsInSnap,{...rowData}];
      else if(!isNew&&exists)data[cur.key]=rowsInSnap.map(r=>r.id===rowData.id?{...rowData}:r);
      else if(!isNew&&!exists)data[cur.key]=[...rowsInSnap,{...rowData}]; // update but row not in snap: add
      // Recompute aggregates
      const newDebt=(data.cards||[]).reduce((a,x)=>a+(+x.balance||0),0)+(data.loans||[]).reduce((a,x)=>a+(+x.balance||0),0);
      const newInc=(data.incomeStreams||[]).reduce((a,x)=>a+toM(+x.net||0,x.freq),0);
      const newBills=(data.bills||[]).reduce((a,x)=>a+toM(+x.cost||0,x.freq),0);
      const newMin=(data.cards||[]).reduce((a,x)=>a+effectiveMin(x),0);
      const newLiq=(data.accounts||[]).filter(a=>ACCT_META[a.type]?.liquid).reduce((a,x)=>a+(+x.value||0),0);
      return{...s,data,debt:Math.round(newDebt),income:Math.round(newInc),bills:Math.round(newBills),savings:Math.round(newLiq),cashFlow:Math.round(newInc-newBills-newMin)};
    });
    onUpdate({...client,monthSnapshots:newSnaps});
    alert(`Applied to ${selMonths.size} month(s).`);
    setSelRow(null);setEditDraft(null);setNewRowData(null);setSelMonths(new Set());
  };

  // Inline editor for "update" mode — renders fields for the selected row
  const renderEditor=()=>{
    if(!editDraft)return null;
    const upd=(k,v)=>setEditDraft(p=>({...p,[k]:v}));
    if(secType==="bills")return<div style={{...mCARD(th),padding:14,marginBottom:12,border:`1px solid ${th.accent}44`}}><Row2><Field label={t?.name||"Name"}><input style={INP} value={editDraft.name||""} onChange={e=>upd("name",e.target.value)}/></Field><Field label={t?.cost||"Amount ($)"}><MaskedNumInp style={INP} value={editDraft.cost||0} onChange={e=>upd("cost",+e.target.value||0)}/></Field></Row2><Row2><Field label={t?.frequency||"Frequency"}><select style={INP} value={editDraft.freq||"monthly2"} onChange={e=>upd("freq",e.target.value)}>{["weekly","biweekly","semimonthly","monthly2","annual"].map(k=><option key={k} value={k}>{t[k]||k}</option>)}</select></Field><Field label={t.type||"Type"}><select style={INP} value={editDraft.type||"regular"} onChange={e=>upd("type",e.target.value)}><option value="regular">{t?.regular||"Regular"}</option><option value="temporary">{t?.temporary||"Temporary"}</option><option value="annual">{t.annual||"Annual"}</option></select></Field></Row2></div>;
    if(secType==="cards")return<div style={{...mCARD(th),padding:14,marginBottom:12,border:`1px solid ${th.accent}44`}}><Row2><Field label={t?.name||"Name"}><input style={INP} value={editDraft.name||""} onChange={e=>upd("name",e.target.value)}/></Field><Field label={t?.loanBalance||"Balance ($)"}><MaskedNumInp style={INP} value={editDraft.balance||0} onChange={e=>upd("balance",+e.target.value||0)}/></Field></Row2><Row2><Field label={t?.loanApr||"APR (%)"}><MaskedNumInp style={INP} value={editDraft.apr||0} onChange={e=>upd("apr",+e.target.value||0)} step="0.1"/></Field><Field label={t?.limitField||"Limit ($)"}><MaskedNumInp style={INP} value={editDraft.limit||0} onChange={e=>upd("limit",+e.target.value||0)}/></Field></Row2></div>;
    if(secType==="loans")return<div style={{...mCARD(th),padding:14,marginBottom:12,border:`1px solid ${th.accent}44`}}><Row2><Field label={t?.name||"Name"}><input style={INP} value={editDraft.name||""} onChange={e=>upd("name",e.target.value)}/></Field><Field label={t?.loanBalance||"Balance ($)"}><MaskedNumInp style={INP} value={editDraft.balance||0} onChange={e=>upd("balance",+e.target.value||0)}/></Field></Row2><Row2><Field label={t?.loanApr||"APR (%)"}><MaskedNumInp style={INP} value={editDraft.apr||0} onChange={e=>upd("apr",+e.target.value||0)} step="0.1"/></Field></Row2></div>;
    if(secType==="accounts"||secType==="customAssets")return<div style={{...mCARD(th),padding:14,marginBottom:12,border:`1px solid ${th.accent}44`}}><Row2><Field label={t?.name||"Name"}><input style={INP} value={editDraft.name||""} onChange={e=>upd("name",e.target.value)}/></Field><Field label={t?.acctValue||"Value ($)"}><MaskedNumInp style={INP} value={editDraft.value||0} onChange={e=>upd("value",+e.target.value||0)}/></Field></Row2></div>;
    if(secType==="incomeStreams")return<div style={{...mCARD(th),padding:14,marginBottom:12,border:`1px solid ${th.accent}44`}}><Row2><Field label={t?.source||"Source"}><input style={INP} value={editDraft.label||""} onChange={e=>upd("label",e.target.value)}/></Field><Field label={t?.netField||"Net ($)"}><MaskedNumInp style={INP} value={editDraft.net||0} onChange={e=>upd("net",+e.target.value||0)}/></Field></Row2><Row2><Field label={t?.grossField||"Gross ($)"}><MaskedNumInp style={INP} value={editDraft.gross||0} onChange={e=>upd("gross",+e.target.value||0)}/></Field><Field label={t?.frequency||"Frequency"}><select style={INP} value={editDraft.freq||"biweekly"} onChange={e=>upd("freq",e.target.value)}>{["weekly","biweekly","semimonthly","monthly2"].map(k=><option key={k} value={k}>{t[k]||k}</option>)}</select></Field></Row2></div>;
    return null;
  };

  // NewRow modal: delegated to existing modals where possible
  const openNewRowEditor=()=>{
    const id=gid();
    if(secType==="bills")setNewRowData({id,name:"",cost:0,freq:"monthly2",type:"regular",dueDay:1,assignedTo:"joint",split:{p1:50,p2:50}});
    else if(secType==="cards")setNewRowData({id,name:"",balance:0,apr:0,min:0,limit:0,promos:[],owedBy:"joint"});
    else if(secType==="loans")setNewRowData({id,name:"",balance:0,apr:0,type:"personal",owner:"joint"});
    else if(secType==="accounts")setNewRowData({id,name:"",type:"checking",value:0,owner:"joint"});
    else if(secType==="customAssets")setNewRowData({id,name:"",value:0,cat:"Real Estate"});
    else if(secType==="incomeStreams")setNewRowData({id,person:"p1",label:"",gross:0,net:0,freq:"biweekly"});
    setSelRow(null);setEditDraft(null);
  };

  const renderNewRowEditor=()=>{
    if(!newRowData)return null;
    const upd=(k,v)=>setNewRowData(p=>({...p,[k]:v}));
    const common={...mCARD(th),padding:14,marginBottom:12,border:`1px solid ${th.warn}44`,background:th.warn+"08"};
    return<div style={common}><div style={{fontSize:11,fontWeight:700,color:th.warn,marginBottom:10}}>🆕 NEW ROW</div>
      {secType==="bills"&&<><Row2><Field label={t?.name||"Name"}><input style={INP} value={newRowData.name||""} onChange={e=>upd("name",e.target.value)}/></Field><Field label={t?.cost||"Amount ($)"}><MaskedNumInp style={INP} value={newRowData.cost||0} onChange={e=>upd("cost",+e.target.value||0)}/></Field></Row2><Row2><Field label={t?.frequency||"Frequency"}><select style={INP} value={newRowData.freq} onChange={e=>upd("freq",e.target.value)}>{["weekly","biweekly","semimonthly","monthly2","annual"].map(k=><option key={k} value={k}>{t[k]||k}</option>)}</select></Field><Field label={t.type||"Type"}><select style={INP} value={newRowData.type} onChange={e=>upd("type",e.target.value)}><option value="regular">{t?.regular||"Regular"}</option><option value="temporary">{t?.temporary||"Temporary"}</option><option value="annual">{t.annual||"Annual"}</option></select></Field></Row2></>}
      {secType==="cards"&&<><Row2><Field label={t?.name||"Name"}><input style={INP} value={newRowData.name||""} onChange={e=>upd("name",e.target.value)}/></Field><Field label={t?.loanBalance||"Balance ($)"}><MaskedNumInp style={INP} value={newRowData.balance||0} onChange={e=>upd("balance",+e.target.value||0)}/></Field></Row2><Row2><Field label={t?.loanApr||"APR (%)"}><MaskedNumInp style={INP} value={newRowData.apr||0} onChange={e=>upd("apr",+e.target.value||0)} step="0.1"/></Field><Field label={t?.limitField||"Limit ($)"}><MaskedNumInp style={INP} value={newRowData.limit||0} onChange={e=>upd("limit",+e.target.value||0)}/></Field></Row2></>}
      {secType==="loans"&&<><Row2><Field label={t?.name||"Name"}><input style={INP} value={newRowData.name||""} onChange={e=>upd("name",e.target.value)}/></Field><Field label={t?.loanBalance||"Balance ($)"}><MaskedNumInp style={INP} value={newRowData.balance||0} onChange={e=>upd("balance",+e.target.value||0)}/></Field></Row2><Row2><Field label={t?.loanApr||"APR (%)"}><MaskedNumInp style={INP} value={newRowData.apr||0} onChange={e=>upd("apr",+e.target.value||0)} step="0.1"/></Field></Row2></>}
      {secType==="accounts"&&<><Row2><Field label={t?.name||"Name"}><input style={INP} value={newRowData.name||""} onChange={e=>upd("name",e.target.value)}/></Field><Field label={t?.acctValue||"Value ($)"}><MaskedNumInp style={INP} value={newRowData.value||0} onChange={e=>upd("value",+e.target.value||0)}/></Field></Row2><Field label={t.type||"Type"}><select style={INP} value={newRowData.type} onChange={e=>upd("type",e.target.value)}><option value="checking">{t?.acctChecking||"Checking"}</option><option value="savings">{t?.acctSavings||"Savings"}</option><option value="retirement">{t?.retirementLbl||"Retirement"}</option><option value="brokerage">{t?.acctBrokerage||"Brokerage"}</option></select></Field></>}
      {secType==="customAssets"&&<><Row2><Field label={t?.name||"Name"}><input style={INP} value={newRowData.name||""} onChange={e=>upd("name",e.target.value)}/></Field><Field label={t?.acctValue||"Value ($)"}><MaskedNumInp style={INP} value={newRowData.value||0} onChange={e=>upd("value",+e.target.value||0)}/></Field></Row2></>}
      {secType==="incomeStreams"&&<><Row2><Field label={t.sourceName||"Source Name"}><input style={INP} value={newRowData.label||""} onChange={e=>upd("label",e.target.value)}/></Field><Field label={t?.netField||"Net ($)"}><MaskedNumInp style={INP} value={newRowData.net||0} onChange={e=>upd("net",+e.target.value||0)}/></Field></Row2><Row2><Field label={t?.grossField||"Gross ($)"}><MaskedNumInp style={INP} value={newRowData.gross||0} onChange={e=>upd("gross",+e.target.value||0)}/></Field><Field label={t?.frequency||"Frequency"}><select style={INP} value={newRowData.freq} onChange={e=>upd("freq",e.target.value)}>{["weekly","biweekly","semimonthly","monthly2"].map(k=><option key={k} value={k}>{t[k]||k}</option>)}</select></Field></Row2></>}
    </div>;
  };

  return<div><div style={{...mCARD(th),padding:14,marginBottom:16,background:th.blue+"08",border:`1px solid ${th.blue}33`}}><div style={{fontSize:12,fontWeight:700,color:th.blue,marginBottom:4}}>🔧 Backfill Historical Data</div><div style={{fontSize:11,color:th.muted,lineHeight:1.6}}>{t.pushRowPast||"Push a row into past months."} <b>{t.updateBtn||"Update"}</b>: edit an existing row inline and apply the changes. <b>New Row</b>: create a new row and add it to selected months. Only affects months with full snapshot data (●).</div></div>

  <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>1. CHOOSE SECTION</div>
  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>{Object.entries(sections).map(([k,s])=><button key={k} onClick={()=>{setSecType(k);setSelRow(null);setEditDraft(null);setNewRowData(null);}} style={{fontSize:11,padding:"5px 12px",borderRadius:8,cursor:"pointer",background:secType===k?th.accent+"22":"transparent",color:secType===k?th.accent:th.muted,border:`1px solid ${secType===k?th.accent:th.cardBorder}`,fontWeight:secType===k?700:400}}>{s.label} ({s.rows.length})</button>)}</div>

  <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>2. MODE</div>
  <div style={{display:"flex",gap:6,marginBottom:14}}>{[["update","✏️ Update Existing Row"],["new","🆕 Add New Row"]].map(([v,l])=><button key={v} onClick={()=>{setMode(v);setSelRow(null);setEditDraft(null);setNewRowData(null);if(v==="new")openNewRowEditor();}} style={{fontSize:11,padding:"6px 14px",borderRadius:8,cursor:"pointer",background:mode===v?th.accent+"22":"transparent",color:mode===v?th.accent:th.muted,border:`1px solid ${mode===v?th.accent:th.cardBorder}`,fontWeight:mode===v?700:400}}>{l}</button>)}</div>

  {mode==="update"&&<><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>3. PICK ROW TO EDIT</div>
  <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:16,maxHeight:180,overflowY:"auto"}}>{!cur.rows.length&&<div style={{fontSize:12,color:th.dim,fontStyle:"italic",padding:10}}>No rows in {cur.label}. Switch to "Add New Row" or add one in Intake first.</div>}{cur.rows.map(r=><div key={r.id} onClick={()=>{setSelRow(r);setEditDraft({...r});}} style={{...mCARD(th),padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,border:`1px solid ${selRow?.id===r.id?th.accent:th.cardBorder}`}}><div style={{width:14,height:14,borderRadius:99,border:`2px solid ${selRow?.id===r.id?th.accent:th.cardBorder}`,background:selRow?.id===r.id?th.accent:"transparent",flexShrink:0}}/><span style={{fontSize:12,color:th.text}}>{cur.display(r)}</span></div>)}</div>
  {editDraft&&renderEditor()}</>}

  {mode==="new"&&renderNewRowEditor()}

  <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8,marginTop:10}}>{mode==="new"?"3":"4"}. SELECT MONTHS TO APPLY</div>
  <div style={{display:"flex",gap:6,marginBottom:10}}><Btn small onClick={()=>setSelMonths(new Set(snaps.filter(s=>s.data).map(s=>s.label)))}>All</Btn><Btn small onClick={()=>setSelMonths(new Set())}>None</Btn></div>
  <div style={{maxHeight:200,overflowY:"auto",display:"flex",flexDirection:"column",gap:4,marginBottom:16}}>{!snaps.length&&<div style={{fontSize:12,color:th.dim,fontStyle:"italic",padding:10}}>{t.noHistMonths||"No historical months yet."}</div>}{snaps.map(s=>{const has=!!s.data;const sel=selMonths.has(s.label);return<div key={s.label} onClick={()=>has&&toggleMonth(s.label)} style={{...mCARD(th),padding:"7px 12px",display:"flex",alignItems:"center",gap:10,cursor:has?"pointer":"not-allowed",opacity:has?1:0.4,border:`1px solid ${sel?th.accent:th.cardBorder}`}}><div style={{width:16,height:16,borderRadius:3,background:sel?th.accent:th.cardBorder,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff"}}>{sel&&"✓"}</div><span style={{fontSize:12,color:th.text}}>{s.label}</span>{has&&<span style={{fontSize:9,color:th.pos,marginLeft:4}}>●</span>}{!has&&<span style={{fontSize:10,color:th.dim,marginLeft:"auto"}}>summary only</span>}</div>;})}</div>

  <div style={{display:"flex",justifyContent:"flex-end",gap:8}}><BSolid onClick={()=>mode==="update"?applyToMonths(editDraft,false):applyToMonths(newRowData,true)}>Apply to {selMonths.size} Month{selMonths.size!==1?"s":""}</BSolid></div>
  </div>;}


// A/L classification: accounts are always current if liquid/savings, else non-current
const isCurrentAsset=a=>{const m=ACCT_META[a.type];return m?.liquid||a.type==="checking"||a.type==="savings"||a.type==="money_market";};
const isCurrentLiability=l=>l.linkedAssetId?false:(l.type==="personal"||l.type==="student"||l.type==="medical");
// Loans linked to mortgage/vehicle are non-current; unsecured loans may be current

function MarketInvestmentModal({item,onSave,onDelete,onClose,t}){const th=useTh();const INP=mINP(th);const[f,setF]=useState({ticker:"",name:"",value:0,cat:"Investment",shares:0,costBasis:0,...(item||{})});const u=k=>e=>setF(p=>({...p,[k]:e.target.value}));const save=()=>{if(!f.ticker||!f.name){alert("Ticker and name required.");return;}onSave({...f,id:item?.id||gid(),value:+f.value||0,shares:+f.shares||0,costBasis:+f.costBasis||0,name:f.name.trim(),ticker:f.ticker.trim().toUpperCase()});};return<Modal title={item?"Edit Market Investment":"Add Market Investment"} onClose={onClose} width={460}><Row2><Field label={t?.tickerField||"Ticker *"}><input style={INP} value={f.ticker} onChange={u("ticker")} placeholder="e.g. VOO"/></Field><Field label={t?.assetCat||"Category"}><select style={INP} value={f.cat} onChange={u("cat")}><option value="US Large Cap">{t?.catUSLarge||"US Large Cap"}</option><option value="US Mid/Small Cap">{t?.catUSMidSmall||"US Mid/Small Cap"}</option><option value="International">{t?.catIntl||"International"}</option><option value="Bonds">{t?.catBonds||"Bonds"}</option><option value="Sector">{t?.catSector||"Sector"}</option><option value="Cash">{t?.catCashMMF||"Cash / MMF"}</option><option value="Crypto">{t?.catCrypto||"Crypto"}</option><option value="Individual Stock">{t?.catIndivStock||"Individual Stock"}</option><option value="Investment">{t?.catOther||"Other"}</option></select></Field></Row2><Field label={(t?.name||"Name")+" *"}><input style={INP} value={f.name} onChange={u("name")} placeholder="e.g. Vanguard S&P 500"/></Field><Row2><Field label={t?.currentValueField||"Current Value ($)"}><MaskedNumInp style={INP} value={f.value} onChange={u("value")}/></Field><Field label={t?.costBasisField||"Cost Basis ($)"}><MaskedNumInp style={INP} value={f.costBasis} onChange={u("costBasis")}/></Field></Row2><Field label={t?.sharesField||"Shares (optional)"}><MaskedNumInp style={INP} value={f.shares} onChange={u("shares")} step="0.01"/></Field><SaveBar onSave={save} onCancel={onClose} onDelete={item?onDelete:null} t={t}/></Modal>;}

function MarketInvestmentsSection({client,onUpdate,t}){const th=useTh();const[modal,setModal]=useState(null);const items=client.marketInvestments||[];const total=items.reduce((s,a)=>s+(+a.value||0),0);const basis=items.reduce((s,a)=>s+(+a.costBasis||0),0);const gain=total-basis;const save=a=>{const ex=items.find(x=>x.id===a.id);onUpdate({...client,marketInvestments:ex?items.map(x=>x.id===a.id?a:x):[...items,a]});setModal(null);};const del=id=>{onUpdate({...client,marketInvestments:items.filter(x=>x.id!==id)});setModal(null);};return<div>{modal&&<MarketInvestmentModal item={modal==="new"?null:modal} onSave={save} onDelete={modal!=="new"?()=>del(modal.id):null} onClose={()=>setModal(null)} t={t}/>}<SHdr label={"📈 "+(t?.marketInvestments||"Market Investments")} right={<Btn small onClick={()=>setModal("new")}>＋ Add Investment</Btn>}/>{!items.length&&<div style={{fontSize:12,color:th.dim,fontStyle:"italic",marginBottom:8}}>No market investments yet. Add stocks, bonds, ETFs, or crypto holdings.</div>}<div style={{display:"flex",flexDirection:"column",gap:6}}>{items.map(a=><div key={a.id} style={{...mCARD(th),padding:"10px 14px",display:"flex",alignItems:"center",gap:12}}><div style={{width:36,height:36,borderRadius:10,background:th.pos+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>📈</div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:th.accent}}>{a.ticker}<span style={{marginLeft:8,color:th.text,fontWeight:600}}>{a.name}</span></div><div style={{fontSize:10,color:th.dim,marginTop:2}}>{a.cat}{a.shares>0&&<span> · {a.shares} shares</span>}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:15,fontWeight:800,color:th.pos}}>{fmt(+a.value||0)}</div>{+a.costBasis>0&&<div style={{fontSize:10,color:(+a.value||0)-(+a.costBasis||0)>=0?th.pos:th.neg}}>{(+a.value||0)-(+a.costBasis||0)>=0?"+":""}{fmt((+a.value||0)-(+a.costBasis||0))}</div>}<Btn small onClick={()=>setModal(a)} style={{marginTop:4}}>{t.editLabel}</Btn></div></div>)}</div>{total>0&&<div style={{display:"flex",justifyContent:"flex-end",gap:12,paddingTop:10,marginTop:6,borderTop:`1px solid ${th.pos}44`}}><span style={{fontSize:11,color:th.muted}}>Value: <b style={{color:th.pos}}>{fmt(total)}</b>{basis>0&&<> · Gain/Loss: <b style={{color:gain>=0?th.pos:th.neg}}>{gain>=0?"+":""}{fmt(gain)}</b></>}</span></div>}</div>;}


function PlanReportBlock({client,lang,t}){
  const th=useTh();
  const ov=client.planOverrides||{};
  const strat=client.planStrategy||"avalanche";
  const hasStrat=!!client.planStrategy;
  const net=sumN(client.incomeStreams);
  const bills=sumB(client.bills);
  const cards=[...(client.cards||[])].filter(c=>+c.balance>0);
  const loans=[...(client.loans||[])].filter(l=>+l.balance>0);
  const allDebts=[...cards.map(c=>({id:c.id,name:c.name,balance:+c.balance,apr:+c.apr||0,min:effectiveMin(c),type:"card"})),...loans.map(l=>({id:l.id,name:l.name,balance:+l.balance,apr:+l.apr||0,min:Math.max(25,Math.round(+l.balance*0.01)),type:"loan"}))];
  const totalDebt=allDebts.reduce((s,d)=>s+d.balance,0);
  const totalMin=allDebts.reduce((s,d)=>s+d.min,0);
  const extra=Math.max(0,net-bills-totalMin);
  const liq=liquidA(client);
  const efTarget=bills*(client.efMonths||3);
  const efGap=Math.max(0,efTarget-liq);
  const calcPayoff=()=>{const sorted=strat==="avalanche"?[...allDebts].sort((a,b)=>b.apr-a.apr):[...allDebts].sort((a,b)=>a.balance-b.balance);let rem=sorted.map(d=>({...d,bal:d.balance}));let freed=0,months=0;const events=[];while(rem.some(d=>d.bal>0)&&months<600){months++;rem=rem.map(d=>{if(d.bal<=0)return d;const int=d.bal*(d.apr/100)/12;const pay=Math.min(d.bal+int,d.min+freed);return{...d,bal:Math.max(0,d.bal+int-pay)};});let leftover=extra;for(let i=0;i<rem.length;i++){if(rem[i].bal>0){rem[i].bal=Math.max(0,rem[i].bal-leftover);leftover=0;break;}}rem.forEach(d=>{if(d.bal<=0&&!events.find(e=>e.id===d.id)){events.push({id:d.id,name:d.name,month:months});freed+=d.min;}});}return{months,events};};
  const{months:debtMonths,events:payEvents}=calcPayoff();
  const efMonths=efGap>0?Math.ceil(efGap/Math.max(1,extra+totalMin)):0;
  const alloc=client.alloc||{stocks:25,retirement:20,realEstate:20,savings:15,vacation:10,other:10};
  const investPct=Math.min(1,((alloc.stocks||0)+(alloc.retirement||0))/100);
  const investStart=debtMonths+efMonths;
  const fullFree=extra+totalMin;
  const investPerMo=fullFree*investPct;
  const investFV=yrs=>{if(investPerMo<=0)return 0;const r=0.085/12;const n=yrs*12;return investPerMo*((Math.pow(1+r,n)-1)/r);};
  const fmtDur=m=>{if(m<=0)return"Now";if(m<12)return`${m} mo`;const y=Math.floor(m/12);const mo=m%12;return mo?`${y}yr ${mo}mo`:`${y} yr`;};
  const addDate=m=>{const d=new Date();d.setMonth(d.getMonth()+m);return d.toLocaleDateString("en-US",{month:"short",year:"numeric"});};
  const phaseSorted=strat==="avalanche"?[...allDebts].sort((a,b)=>b.apr-a.apr):[...allDebts].sort((a,b)=>a.balance-b.balance);
  const PhaseCard=({num,color,title,sub,badge,note})=>{if(!note&&!badge)return null;return<div style={{...mCARD(th),padding:14,marginBottom:10,borderLeft:`4px solid ${color}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:note?10:0}}><div><span style={{fontSize:10,fontWeight:700,color:color,textTransform:"uppercase",letterSpacing:"0.08em"}}>Phase {num}</span><div style={{fontSize:14,fontWeight:800,color:th.text,marginTop:2}}>{title}</div>{sub&&<div style={{fontSize:11,color:th.muted,marginTop:2}}>{sub}</div>}</div>{badge&&<div style={{textAlign:"right"}}><div style={{fontSize:18,fontWeight:800,color:color}}>{badge.val}</div><div style={{fontSize:10,color:th.dim}}>{badge.label}</div></div>}</div>{note&&<div style={{fontSize:12,color:th.muted,lineHeight:1.6,whiteSpace:"pre-wrap",paddingTop:8,borderTop:`1px solid ${th.cardBorder}`}}>{note}</div>}</div>;};
  const hasAny=hasStrat||totalDebt>0||efGap>0||investPerMo>0||ov.phase1||ov.phase2||ov.phase3||ov.extra;
  if(!hasAny)return null;
  return<div style={{marginBottom:14}}>
    {/* CARD 1 — Strategy Plan overview: title + KPI + debt-strategy caption */}
    <div style={{...mCARD(th),padding:16,marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:800,color:th.text,marginBottom:14,paddingBottom:8,borderBottom:`2px solid ${th.accent}`}}>📋 {t.strategyPlan||"Strategy Plan"}</div>
      <div style={{...mCARD(th),padding:14,marginBottom:hasStrat?14:0,background:net>0?th.pos+"08":th.neg+"08",border:`1px solid ${net>0?th.pos:th.neg}33`}}><div data-ga-grid="kpi-4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>{[["💼 "+(t.netIncome||"Net Income"),fmt(net),th.pos],["💳 "+(t.totalBills||"Bills"),fmt(bills),th.neg],["🏦 "+(t.minDebtPayAll||"Min Debt"),fmt(totalMin),th.warn],["💰 "+(t.extraPerMo||"Extra/mo"),fmt(extra),extra>0?GOLD:th.neg]].map(([l,v,c])=><div key={l}><div style={{fontSize:10,color:th.dim}}>{l}</div><div style={{fontSize:15,fontWeight:800,color:c}}>{v}</div></div>)}</div></div>
      {hasStrat&&<div style={{fontSize:12,color:th.muted,padding:"10px 12px",background:th.accent+"08",borderRadius:8}}>{t.debtStrategyColon||"Debt Strategy:"} <b style={{color:th.accent}}>{strat==="avalanche"?(t.avalancheStrategyDesc||"Avalanche (highest APR first — saves most interest)"):(t.snowballStrategyDesc||"Snowball (smallest balance first — quick wins)")}</b></div>}
    </div>
    {/* Debt Free standalone callout */}
    {totalDebt===0&&net>0&&<div style={{...mCARD(th),padding:14,marginBottom:14,background:th.pos+"11",border:`1px solid ${th.pos}33`,fontSize:13,fontWeight:700,color:th.pos}}>🎉 Debt Free — focus on building wealth.</div>}
    {/* CARD 2 — DEBT PAYOFF ORDER */}
    {totalDebt>0&&<div style={{...mCARD(th),padding:16,marginBottom:14}}>
      <div style={{fontSize:12,fontWeight:700,color:th.dim,marginBottom:10}}>💳 {t.debtPayoffOrderHdr||"DEBT PAYOFF ORDER"}</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>{phaseSorted.map((d,i)=>{const ev=payEvents.find(e=>e.id===d.id);return<div key={d.id} style={{...mCARD(th),padding:"10px 14px",display:"flex",alignItems:"center",gap:12}}><div style={{width:24,height:24,borderRadius:99,background:th.accent,color:"#fff",fontWeight:800,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div><div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:th.text}}>{d.name}</div><div style={{fontSize:11,color:th.dim}}>{fmt(d.balance)} · {d.apr}% APR · Min {fmt(d.min)}/mo</div></div>{ev&&<div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:700,color:th.pos}}>{fmtDur(ev.month)}</div><div style={{fontSize:10,color:th.dim}}>{addDate(ev.month)}</div></div>}</div>;})}</div>
    </div>}
    {/* CARD 3 — FINANCIAL ROADMAP (phases) */}
    <div style={{...mCARD(th),padding:16,marginBottom:14}}>
      <div style={{fontSize:12,fontWeight:700,color:th.dim,marginBottom:10}}>🗺️ FINANCIAL ROADMAP</div>
      {totalDebt>0&&<PhaseCard num={1} color={th.neg} title={t.payOffAllDebt||"Pay Off All Debt"} sub={`Applying ${fmt(extra)}/mo extra to fastest debt using ${strat}`} badge={{val:fmtDur(debtMonths),label:addDate(debtMonths)}} note={ov.phase1||`Focus all extra cash on debt. Projected payoff in ${fmtDur(debtMonths)}. Avoid new debt during this phase.`}/>}
      {efGap>0&&<PhaseCard num={totalDebt>0?2:1} color={th.warn} title={t.buildEmerFund||"Build Emergency Fund"} sub={`Need ${fmt(efGap)} more · ${client.efMonths||3}-month target`} badge={{val:fmtDur(debtMonths+efMonths),label:addDate(debtMonths+efMonths)}} note={ov.phase2||`After debt is gone, redirect payments to savings. Target ${client.efMonths||3} months of expenses (${fmt(efTarget)}). Keep in HYSA.`}/>}
      <PhaseCard num={totalDebt>0&&efGap>0?3:totalDebt>0||efGap>0?2:1} color={th.pos} title={t.investBuildWealth||"Invest & Build Wealth"} sub={`~${fmt(investPerMo)}/mo to investments (${(investPct*100).toFixed(0)}% allocation from your plan). Est. 8.5% avg return`} badge={{val:"🚀",label:investStart===0?"Start now":addDate(investStart)}} note={ov.phase3||`Allocate ${alloc.stocks||0}% stocks + ${alloc.retirement||0}% retirement. Dollar-cost average monthly. Max employer 401k match first.`}/>
    </div>
    {/* CARD 4 — INVESTMENT PROJECTION (already self-contained mCARD) */}
    {investPerMo>0&&<div style={{...mCARD(th),padding:14,marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:10}}>📈 {t.investmentProjectionHdr||"INVESTMENT PROJECTION"} · starts {addDate(investStart)} · {(investPct*100).toFixed(0)}% of extra cash</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>{[[5,"5 Years"],[10,"10 Years"],[20,"20 Years"]].map(([yrs,label])=><div key={yrs} style={{textAlign:"center"}}><div style={{fontSize:10,color:th.dim,marginBottom:4}}>{label}</div><div style={{fontSize:18,fontWeight:800,color:th.pos}}>{fmt(investFV(yrs))}</div><div style={{fontSize:10,color:th.dim}}>+{fmt(investFV(yrs)-investPerMo*yrs*12)} growth</div></div>)}</div></div>}
    {/* CARD 5 — Additional Notes (if any) */}
    {ov.extra&&<div style={{...mCARD(th),padding:16,marginBottom:14}}>
      <div style={{fontSize:12,fontWeight:700,color:th.accent,marginBottom:6}}>📝 Additional Notes / Recommendations</div>
      <div style={{fontSize:12,color:th.muted,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{ov.extra}</div>
    </div>}
  </div>;
}

function PortfolioReportBlock({client,t}){const th=useTh();const incl=client.reportInclude||{};if(incl.portfolio===false)return null;const saved=client.savedPortfolio;const cust=client.portfolioCustom;const holdings=saved?.holdings||cust?.holdings||[];if(!holdings.length)return null;return<div style={{...mCARD(th),padding:16,marginBottom:14}}><div style={{fontSize:13,fontWeight:800,color:th.text,marginBottom:14,paddingBottom:8,borderBottom:`2px solid ${th.accent}`}}>💹 {t.selectedPortfolioHdr||"Selected Portfolio"}</div><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}><thead><tr><th style={mTH(th)}>{t.colTicker||"Ticker"}</th><th style={mTH(th)}>{t.colName||"Name"}</th><th style={mTH(th)}>{t.colCategory||"Category"}</th><th style={mTHR(th)}>{t.colAllocPct||"Alloc %"}</th></tr></thead><tbody>{holdings.map(h=>{const tm=TICKER_META[h.ticker];return<tr key={h.id||h.ticker}><td style={{...mTD(th),fontWeight:700,color:th.accent}}>{h.ticker}</td><td style={mTD(th)}>{tm?.name||h.name}</td><td style={{...mTD(th),color:th.muted,fontSize:10}}>{tm?.cat||"—"}</td><td style={{...mTDR(th),fontWeight:700}}>{h.pct||0}%</td></tr>;})}</tbody></table></div>;}

function CompareReportBlock({client,t}){const th=useTh();const saved=client.savedCompare;if(!saved||!saved.rows||saved.rows.length<2)return null;const{rows,fields,ratioRows}=saved;const FLD_REMAP={"💼 Net Income":t.fldNetIncomeCmp,"💳 Bills":t.fldBillsCmp,"🏦 Min Debt Pay":t.fldMinDebtCmp,"💰 Cash Flow":t.fldCashFlowCmp,"💧 Liquid Savings":t.fldLiquidCmp,"📉 Total Debt":t.fldDebtCmp,"📈 Total Assets":t.fldAssetsCmp,"💎 Net Worth":t.fldNetWorthCmp};const RAT_REMAP={"DSR":t.ratioDSR,"Debt/Asset":t.ratioDebtAsset,"Current Ratio":t.ratioCurrent,"Retirement Rate":t.ratioRetirementRate,"Emergency Fund":t.ratioEmergencyFund,"Cash Flow":t.ratioCashFlow};const _trF=l=>FLD_REMAP[l]||l;const _trR=l=>RAT_REMAP[l]||l;return<div style={{...mCARD(th),padding:16,marginBottom:14}}><div style={{fontSize:13,fontWeight:800,color:th.text,marginBottom:14,paddingBottom:8,borderBottom:`2px solid ${th.accent}`}}>📊 {t.periodComparisonHdr||"Period Comparison"} · {t.savedOn||"Saved"} {fmtDate(new Date(saved.savedAt),_gaLang())}</div>{(()=>{if(!rows||rows.length<2)return null;const debts=rows.map(r=>r.debt||0).filter(x=>x>0);if(debts.length<2)return null;const min=Math.min(...debts),max=Math.max(...debts);if(max/min>5)return <div style={{padding:"8px 12px",marginTop:8,marginBottom:8,background:"#FBBF2422",border:"1px solid #FBBF24",borderRadius:8,fontSize:11,color:"#92400E"}}>{t.staleSnapWarn||"⚠️ This snapshot may have stale data — scale differs significantly from current."}</div>;return null;})()}<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:480,tableLayout:"fixed"}}><colgroup><col style={{width:"28%"}}/>{rows.map((_,i)=><col key={i} style={{width:`${(72-12)/rows.length}%`}}/>)}<col style={{width:"12%"}}/></colgroup><thead><tr><th style={mTH(th)}>{t.colMetric||"Metric"}</th>{rows.map(r=><th key={r.label} style={{...mTHR(th),fontSize:11,fontWeight:700,color:r.label.includes("Live")?th.pos:th.accent}}>{mLabel(r.label.replace(" (Live)",""),_gaLang())+(r.label.includes("(Live)")?" ("+(t.liveSuffix||"Live")+")":"")}</th>)}<th style={{...mTHR(th),color:th.dim,fontSize:11}}>Δ</th></tr></thead><tbody>{(fields||[]).map(f=>{const vals=rows.map(r=>r[f.k]||0);const ch=vals[vals.length-1]-vals[0];const pct=vals[0]?((ch/Math.abs(vals[0]))*100).toFixed(1):"—";return<tr key={f.k}><td style={{...mTD(th),fontWeight:600,color:f.c}}>{_trF(f.l)}</td>{vals.map((v,i)=><td key={i} style={{...mTDR(th),color:f.c,fontWeight:700}}>{fmt(v)}</td>)}<td style={{...mTDR(th),fontSize:11,color:ch>=0?th.pos:th.neg,fontWeight:700}}>{ch!==0?(ch>0?"+":"")+fmt(ch):""}{pct!=="—"&&<div style={{fontSize:10,opacity:0.7}}>{pct}%</div>}</td></tr>;})}</tbody></table></div>{ratioRows&&<div style={{marginTop:14}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>📐 {t.ratiosSub||"Ratios"}</div><table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}><colgroup><col style={{width:"28%"}}/>{rows.map((_,i)=><col key={i} style={{width:`${(72-12)/rows.length}%`}}/>)}<col style={{width:"12%"}}/></colgroup><tbody>{ratioRows.map(rf=>{const vals=rows.map(r=>r[rf.k]);return<tr key={rf.l}><td style={{...mTD(th),fontWeight:600,color:th.muted,fontSize:12}}>{_trR(rf.l)}</td>{vals.map((v,i)=>{let display="—";if(rf.k==="dsr"||rf.k==="dta")display=v>=99?"N/A":(v*100).toFixed(1)+"%";else if(rf.k==="cr")display=v>=999?"N/A":v.toFixed(2)+"x";else if(rf.k==="rsr")display=(v*100).toFixed(1)+"%";else if(rf.k==="efr")display=v.toFixed(1)+"mo";else if(rf.k==="cashFlow")display=v>=0?"✓":"✗";return<td key={i} style={{...mTDR(th),fontSize:12,fontWeight:700,color:th.muted}}>{display}</td>;})}<td style={{...mTDR(th),fontSize:11,color:th.dim}}>{rf.bm}</td></tr>;})}</tbody></table></div>}</div>;}

function CalculatorsReportBlock({client,t}){
  const th=useTh();
  const saved=client.savedCalcs||[];
  if(!saved.length)return null;
  return<div style={{...mCARD(th),padding:16,marginBottom:14}}>
    <div style={{fontSize:13,fontWeight:800,color:th.text,marginBottom:14,paddingBottom:8,borderBottom:`2px solid ${th.accent}`}}>🧮 {t.calculatorSnapshots||"Calculator Snapshots"}</div>
    {saved.map((c,i)=><div key={i} style={{marginBottom:18,pageBreakInside:"avoid"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:6}}>
        <div><span style={{fontSize:13,fontWeight:800,color:th.text}}>{c.name}</span>{c.scope&&<Pill color={th.accent}>{c.scope}</Pill>}</div>
        <div style={{fontSize:10,color:th.dim}}>{t.savedAt||"Saved"} {c.savedAt?new Date(c.savedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"—"}</div>
      </div>
      {c.summary&&!c.inputs&&!c.outputs&&<div style={{fontSize:11,color:th.muted,fontStyle:"italic",marginBottom:6}}>{c.summary}</div>}
      {(c.inputs&&c.inputs.length>0)||(c.outputs&&c.outputs.length>0)?<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:th.dim,marginBottom:6,letterSpacing:"0.07em"}}>{(t.inputs||"INPUTS").toUpperCase()}</div>
          {c.inputs&&c.inputs.length>0?<table style={{width:"100%",borderCollapse:"collapse"}}><tbody>{c.inputs.map((inp,j)=><tr key={j}><td style={{...mTD(th),fontSize:11,color:th.muted,padding:"4px 6px",borderBottom:`1px solid ${th.cardBorder}`}}>{inp.label}</td><td style={{...mTDR(th),fontSize:11,fontWeight:600,color:th.text,padding:"4px 6px",borderBottom:`1px solid ${th.cardBorder}`}}>{inp.value}</td></tr>)}</tbody></table>:<div style={{fontSize:11,color:th.dim,fontStyle:"italic"}}>—</div>}
        </div>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:th.dim,marginBottom:6,letterSpacing:"0.07em"}}>{(t.results||"RESULTS").toUpperCase()}</div>
          {c.outputs&&c.outputs.length>0?<table style={{width:"100%",borderCollapse:"collapse"}}><tbody>{c.outputs.map((out,j)=><tr key={j}><td style={{...mTD(th),fontSize:out.big?12:11,color:th.muted,padding:"4px 6px",borderBottom:`1px solid ${th.cardBorder}`,fontWeight:out.big?700:400}}>{out.label}</td><td style={{...mTDR(th),fontSize:out.big?14:11,fontWeight:out.big?800:700,color:out.big?th.accent:th.text,padding:"4px 6px",borderBottom:`1px solid ${th.cardBorder}`}}>{out.value}</td></tr>)}</tbody></table>:<div style={{fontSize:11,color:th.dim,fontStyle:"italic"}}>—</div>}
        </div>
      </div>:null}
    </div>)}
  </div>;
}

function AssetsLiabilitiesTab({client,lang,t}){const th=useTh();const[view,setView]=useState("all"); // "all" | "current" | "noncurrent"
  const accounts=client.accounts||[];const loans=client.loans||[];const cards=client.cards||[];const props=client.customAssets||[];const miAcct=client.marketInvestments||[];
  const curAssets=accounts.filter(isCurrentAsset);
  const nonCurAssets=accounts.filter(a=>!isCurrentAsset(a));
  const curAssetsTotal=curAssets.reduce((s,a)=>s+(+a.value||0),0);
  const nonCurAssetsTotal=nonCurAssets.reduce((s,a)=>s+(+a.value||0),0)+props.reduce((s,a)=>s+(+a.value||0),0)+miAcct.reduce((s,a)=>s+(+a.value||0),0);
  const curLiab=cards.reduce((s,c)=>s+(+c.balance||0),0)+loans.filter(isCurrentLiability).reduce((s,l)=>s+(+l.balance||0),0);
  const nonCurLiab=loans.filter(l=>!isCurrentLiability(l)).reduce((s,l)=>s+(+l.balance||0),0);
  const totA=curAssetsTotal+nonCurAssetsTotal;const totL=curLiab+nonCurLiab;
  const currentRatio=curLiab>0?curAssetsTotal/curLiab:999;
  const Row=({label,value,color,bold,indent})=><tr><td style={{...mTD(th),paddingLeft:indent?16:0,fontWeight:bold?700:400,color:bold?th.text:th.muted,fontSize:bold?13:12}}>{label}</td><td style={{...mTDR(th),fontWeight:bold?700:500,color:color||th.muted,fontSize:bold?13:12}}>{fmt(value)}</td></tr>;
  return<div><div style={{display:"flex",gap:6,marginBottom:14}}>{[["all",(t.filterAll||"All")],["current",(t.filterCurrentOnly||"Current Only")],["noncurrent",(t.filterNonCurrentOnly||"Non-Current Only")]].map(([v,l])=><button key={v} onClick={()=>setView(v)} style={{fontSize:11,padding:"5px 12px",borderRadius:8,cursor:"pointer",background:view===v?th.accent+"22":"transparent",color:view===v?th.accent:th.muted,border:`1px solid ${view===v?th.accent:th.cardBorder}`,fontWeight:view===v?700:400}}>{l}</button>)}</div>
  <div data-ga-grid="kpi-4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:18}}><SC label={"📊 "+(t.totalAssets||"Total Assets")} value={fmt(totA)} color={th.pos}/><SC label={"📋 "+(t.totalLiabilities||"Total Liabilities")} value={fmt(totL)} color={th.neg}/><SC label={"💎 "+(t.netWorth||"Net Worth")} value={fmt(totA-totL)} color={totA-totL>=0?th.pos:th.neg}/><SC label={"💧 "+(t.currentRatio||"Current Ratio")} value={curLiab===0?"N/A":currentRatio.toFixed(2)+"x"} color={ratColor("currentRatio",currentRatio,th)}/></div>
  <div data-ga-grid="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
    {(view==="all"||view==="current")&&<div style={{...mCARD(th),padding:16}}><div style={{fontSize:12,fontWeight:800,color:th.accent,marginBottom:12,paddingBottom:6,borderBottom:`2px solid ${th.accent}`}}>💧 {t.currentAssetsHdr||"CURRENT ASSETS"}</div><table style={{width:"100%"}}><tbody>{curAssets.map(a=><Row key={a.id} label={"  "+(ACCT_META[a.type]?.icon||"")+" "+a.name} value={+a.value||0} color={th.pos} indent/>)}{curAssets.length===0&&<tr><td colSpan={2} style={{fontSize:11,color:th.dim,fontStyle:"italic",padding:6}}>{t.noneLbl||"None"}</td></tr>}<tr style={{borderTop:`1px solid ${th.cardBorder}`}}><td style={{...mTD(th),fontWeight:700,paddingTop:8}}>{t.totalCurrentAssets||"TOTAL CURRENT ASSETS"}</td><td style={{...mTDR(th),fontWeight:800,color:th.pos,paddingTop:8}}>{fmt(curAssetsTotal)}</td></tr></tbody></table></div>}
    {(view==="all"||view==="current")&&<div style={{...mCARD(th),padding:16}}><div style={{fontSize:12,fontWeight:800,color:th.neg,marginBottom:12,paddingBottom:6,borderBottom:`2px solid ${th.neg}`}}>📌 {t.currentLiabHdr||"CURRENT LIABILITIES"}</div><table style={{width:"100%"}}><tbody>{cards.map(c=><Row key={c.id} label={"  💳 "+c.name} value={+c.balance||0} color={th.neg} indent/>)}{loans.filter(isCurrentLiability).map(l=><Row key={l.id} label={"  🏦 "+l.name} value={+l.balance||0} color={th.neg} indent/>)}{cards.length===0&&loans.filter(isCurrentLiability).length===0&&<tr><td colSpan={2} style={{fontSize:11,color:th.dim,fontStyle:"italic",padding:6}}>{t.noneLbl||"None"}</td></tr>}<tr style={{borderTop:`1px solid ${th.cardBorder}`}}><td style={{...mTD(th),fontWeight:700,paddingTop:8}}>{t.totalCurrentLiab||"TOTAL CURRENT LIABILITIES"}</td><td style={{...mTDR(th),fontWeight:800,color:th.neg,paddingTop:8}}>{fmt(curLiab)}</td></tr></tbody></table></div>}
    {(view==="all"||view==="noncurrent")&&<div style={{...mCARD(th),padding:16}}><div style={{fontSize:12,fontWeight:800,color:th.accent,marginBottom:12,paddingBottom:6,borderBottom:`2px solid ${th.accent}`}}>🏛️ NON-CURRENT ASSETS</div><table style={{width:"100%"}}><tbody>{nonCurAssets.map(a=><Row key={a.id} label={"  "+(ACCT_META[a.type]?.icon||"")+" "+a.name} value={+a.value||0} color={th.pos} indent/>)}{props.map(a=><Row key={"p"+a.id} label={"  🏛️ "+a.name+" (Property)"} value={+a.value||0} color={th.pos} indent/>)}{miAcct.map(a=><Row key={"mi"+a.id} label={"  📈 "+a.ticker+" "+a.name} value={+a.value||0} color={th.pos} indent/>)}{nonCurAssets.length===0&&props.length===0&&miAcct.length===0&&<tr><td colSpan={2} style={{fontSize:11,color:th.dim,fontStyle:"italic",padding:6}}>{t.noneLbl||"None"}</td></tr>}<tr style={{borderTop:`1px solid ${th.cardBorder}`}}><td style={{...mTD(th),fontWeight:700,paddingTop:8}}>{t.totalNonCurrentAssets||"TOTAL NON-CURRENT ASSETS"}</td><td style={{...mTDR(th),fontWeight:800,color:th.pos,paddingTop:8}}>{fmt(nonCurAssetsTotal)}</td></tr></tbody></table></div>}
    {(view==="all"||view==="noncurrent")&&<div style={{...mCARD(th),padding:16}}><div style={{fontSize:12,fontWeight:800,color:th.neg,marginBottom:12,paddingBottom:6,borderBottom:`2px solid ${th.neg}`}}>🏠 {t.nonCurrentLiabHdr||"NON-CURRENT LIABILITIES"}</div><table style={{width:"100%"}}><tbody>{loans.filter(l=>!isCurrentLiability(l)).map(l=><Row key={l.id} label={"  🏦 "+l.name+" ("+l.type+")"} value={+l.balance||0} color={th.neg} indent/>)}{loans.filter(l=>!isCurrentLiability(l)).length===0&&<tr><td colSpan={2} style={{fontSize:11,color:th.dim,fontStyle:"italic",padding:6}}>{t.noneLbl||"None"}</td></tr>}<tr style={{borderTop:`1px solid ${th.cardBorder}`}}><td style={{...mTD(th),fontWeight:700,paddingTop:8}}>{t.totalNonCurrentLiab||"TOTAL NON-CURRENT LIABILITIES"}</td><td style={{...mTDR(th),fontWeight:800,color:th.neg,paddingTop:8}}>{fmt(nonCurLiab)}</td></tr></tbody></table></div>}
  </div></div>;}

function FinancialPlanTab({client,onUpdate,t}){
  const th=useTh();
  const[strat,setStrat]=useState(client.planStrategy||"avalanche");
  const ov=client.planOverrides||{phase1:"",phase2:"",phase3:"",extra:""};
  const[editing,setEditing]=useState(null);
  const[draft,setDraft]=useState("");
  const[goalsDraft,setGoalsDraft]=useState(null);

  const net=sumN(client.incomeStreams);
  const bills=sumB(client.bills);
  const cards=[...(client.cards||[])].filter(c=>+c.balance>0);
  const loans=[...(client.loans||[])].filter(l=>+l.balance>0);
  const allDebts=[...cards.map(c=>({id:c.id,name:c.name,balance:+c.balance,apr:+c.apr||0,min:effectiveMin(c),type:"card"})),...loans.map(l=>({id:l.id,name:l.name,balance:+l.balance,apr:+l.apr||0,min:Math.max(25,Math.round(+l.balance*0.01)),type:"loan"}))];
  const totalDebt=allDebts.reduce((s,d)=>s+d.balance,0);
  const totalMin=allDebts.reduce((s,d)=>s+d.min,0);
  const extra=Math.max(0,net-bills-totalMin);
  const liq=liquidA(client);
  const efTarget=bills*(client.efMonths||3);
  const efGap=Math.max(0,efTarget-liq);

  // Calculate debt payoff with strategy
  const calcPayoff=()=>{const sorted=strat==="avalanche"?[...allDebts].sort((a,b)=>b.apr-a.apr):[...allDebts].sort((a,b)=>a.balance-b.balance);let rem=sorted.map(d=>({...d,bal:d.balance}));let freed=0,months=0;const events=[];while(rem.some(d=>d.bal>0)&&months<600){months++;rem=rem.map(d=>{if(d.bal<=0)return d;const int=d.bal*(d.apr/100)/12;const pay=Math.min(d.bal+int,d.min+freed);return{...d,bal:Math.max(0,d.bal+int-pay)};});let leftover=extra;for(let i=0;i<rem.length;i++){if(rem[i].bal>0){rem[i].bal=Math.max(0,rem[i].bal-leftover);leftover=0;break;}}rem.forEach(d=>{if(d.bal<=0&&!events.find(e=>e.id===d.id)){events.push({id:d.id,name:d.name,month:months});freed+=d.min;}});}return{months,events};};
  const{months:debtMonths,events:payEvents}=useMemo(calcPayoff,[strat,client.id,net,bills,totalDebt]);

  // EF time: after debt paid, full freed cash flows to EF
  const efMonths=efGap>0?Math.ceil(efGap/Math.max(1,extra+totalMin)):0;

  // Investment allocation: stocks + retirement only (not vacation/other which are spending)
  const alloc=client.alloc||{stocks:25,retirement:20,realEstate:20,savings:15,vacation:10,other:10};
  const investPct=Math.min(1,(alloc.stocks+alloc.retirement)/100);
  const investStart=debtMonths+efMonths;
  const fullFree=extra+totalMin;
  const investPerMo=fullFree*investPct;
  const investFV=yrs=>{if(investPerMo<=0)return 0;const r=0.085/12;const n=yrs*12;return investPerMo*((Math.pow(1+r,n)-1)/r);};

  const fmtDur=m=>{if(m<=0)return"Now";if(m<12)return`${m} mo`;const y=Math.floor(m/12);const mo=m%12;return mo?`${y}yr ${mo}mo`:`${y} yr`;};
  const addDate=m=>{const d=new Date();d.setMonth(d.getMonth()+m);return d.toLocaleDateString("en-US",{month:"short",year:"numeric"});};

  const saveOv=(key,val)=>{onUpdate({...client,planOverrides:{...ov,[key]:val}});setEditing(null);};
  const saveStrat=s=>{setStrat(s);onUpdate({...client,planStrategy:s});};
  const saveGoals=g=>{onUpdate({...client,notes:{...(client.notes||{}),...g}});setGoalsDraft(null);};

  const Phase=({num,color,title,sub,badge,noteKey,defaultNote})=>{const override=ov[noteKey];const displayNote=override||defaultNote;const isEditing=editing===noteKey;return<div style={{...mCARD(th),padding:14,marginBottom:8,borderLeft:`4px solid ${color}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:isEditing||displayNote?10:0}}><div><span style={{fontSize:10,fontWeight:700,color:color,textTransform:"uppercase",letterSpacing:"0.08em"}}>Phase {num}</span><div style={{fontSize:14,fontWeight:800,color:th.text,marginTop:2}}>{title}</div>{sub&&<div style={{fontSize:11,color:th.muted,marginTop:2}}>{sub}</div>}</div>{badge&&<div style={{textAlign:"right"}}><div style={{fontSize:18,fontWeight:800,color:color}}>{badge.val}</div><div style={{fontSize:10,color:th.dim}}>{badge.label}</div></div>}</div>{isEditing?<div><textarea value={draft} onChange={e=>setDraft(e.target.value)} style={{...mINP(th),width:"100%",boxSizing:"border-box",minHeight:70,fontSize:12,fontFamily:"inherit"}} autoFocus/><div style={{display:"flex",gap:6,marginTop:6,justifyContent:"flex-end"}}><Btn small onClick={()=>setEditing(null)}>Cancel</Btn><BSolid onClick={()=>saveOv(noteKey,draft)} style={{fontSize:11,padding:"4px 12px"}}>{t.saveNoteBtn||"Save Note"}</BSolid></div></div>:<div style={{display:"flex",alignItems:"flex-start",gap:8}}><div style={{flex:1,fontSize:12,color:override?th.text:th.muted,fontStyle:override?"normal":"italic",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{displayNote||"Click Edit to add your recommendation."}</div><button onClick={()=>{setDraft(override||"");setEditing(noteKey);}} style={{fontSize:10,padding:"3px 8px",borderRadius:6,background:"transparent",color:th.dim,border:`1px solid ${th.cardBorder}`,cursor:"pointer"}}>✏️ Edit</button></div>}</div>;};

  const SD=()=><div style={{height:1,background:th.cardBorder,margin:"20px 0"}}/>;

  return<div><div style={{...mCARD(th),padding:16,marginBottom:16,background:net>0?th.pos+"08":th.neg+"08",border:`1px solid ${net>0?th.pos:th.neg}33`}}><div data-ga-grid="kpi-4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>{[["💼 "+(t.netIncome||"Net Income"),fmt(net),th.pos],["💳 "+(t.totalBills||"Bills"),fmt(bills),th.neg],["🏦 "+(t.minDebtPayAll||"Min Debt"),fmt(totalMin),th.warn],["💰 "+(t.extraPerMo||"Extra/mo"),fmt(extra),extra>0?GOLD:th.neg]].map(([l,v,c])=><div key={l}><div style={{fontSize:10,color:th.dim}}>{l}</div><div style={{fontSize:15,fontWeight:800,color:c}}>{v}</div></div>)}</div></div>

  <div style={{display:"flex",gap:8,marginBottom:16}}>{[["avalanche","🎯 Avalanche"],["snowball","❄️ Snowball"]].map(([v,l])=><button key={v} onClick={()=>saveStrat(v)} style={{fontSize:12,padding:"7px 16px",borderRadius:8,cursor:"pointer",background:strat===v?th.accent+"22":"transparent",color:strat===v?th.accent:th.muted,border:`1px solid ${strat===v?th.accent:th.cardBorder}`,fontWeight:strat===v?700:400}}>{l}</button>)}<span style={{fontSize:11,color:th.dim,alignSelf:"center",marginLeft:6}}>{strat==="avalanche"?"Highest APR first (saves most interest)":"Smallest balance first (quick wins)"}</span></div>

  {totalDebt===0&&net>0&&<div style={{...mCARD(th),padding:14,marginBottom:16,background:th.pos+"11",border:`1px solid ${th.pos}33`,fontSize:13,fontWeight:700,color:th.pos}}>🎉 Debt Free! Focus on building wealth.</div>}

  {totalDebt>0&&<><div style={{fontSize:12,fontWeight:700,color:th.dim,marginBottom:8}}>💳 {t.debtPayoffOrderHdr||"DEBT PAYOFF ORDER"}</div><div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>{(strat==="avalanche"?[...allDebts].sort((a,b)=>b.apr-a.apr):[...allDebts].sort((a,b)=>a.balance-b.balance)).map((d,i)=>{const ev=payEvents.find(e=>e.id===d.id);return<div key={d.id} style={{...mCARD(th),padding:"10px 14px",display:"flex",alignItems:"center",gap:12}}><div style={{width:24,height:24,borderRadius:99,background:th.accent,color:"#fff",fontWeight:800,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div><div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:th.text}}>{d.name}</div><div style={{fontSize:11,color:th.dim}}>{fmt(d.balance)} · {d.apr}% APR · Min {fmt(d.min)}/mo</div></div>{ev&&<div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:700,color:th.pos}}>{fmtDur(ev.month)}</div><div style={{fontSize:10,color:th.dim}}>{addDate(ev.month)}</div></div>}</div>;})}</div></>}

  <SD/>
  <div style={{fontSize:12,fontWeight:700,color:th.dim,marginBottom:8}}>🗺️ FINANCIAL ROADMAP (editable)</div>
  {totalDebt>0&&<Phase num={1} color={th.neg} title={t.payOffAllDebt||"Pay Off All Debt"} sub={`Applying ${fmt(extra)}/mo extra to fastest debt using ${strat}`} badge={{val:fmtDur(debtMonths),label:addDate(debtMonths)}} noteKey="phase1" defaultNote={`Focus all extra cash on debt. Projected payoff in ${fmtDur(debtMonths)}. Avoid new debt during this phase.`}/>}
  {efGap>0&&<Phase num={totalDebt>0?2:1} color={th.warn} title={t.buildEmerFund||"Build Emergency Fund"} sub={`Need ${fmt(efGap)} more · ${client.efMonths||3}-month target`} badge={{val:fmtDur(debtMonths+efMonths),label:addDate(debtMonths+efMonths)}} noteKey="phase2" defaultNote={`After debt is gone, redirect payments to savings. Target ${client.efMonths||3} months of expenses (${fmt(efTarget)}). Keep in HYSA.`}/>}
  <Phase num={totalDebt>0&&efGap>0?3:totalDebt>0||efGap>0?2:1} color={th.pos} title={t.investBuildWealth||"Invest & Build Wealth"} sub={`~${fmt(investPerMo)}/mo to investments (${(investPct*100).toFixed(0)}% allocation from your plan). Est. 8.5% avg return`} badge={{val:"🚀",label:investStart===0?"Start now":addDate(investStart)}} noteKey="phase3" defaultNote={`Allocate ${alloc.stocks}% stocks + ${alloc.retirement}% retirement. Dollar-cost average monthly. Max employer 401k match first.`}/>

  {investPerMo>0&&<div style={{...mCARD(th),padding:14,marginTop:12}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:10}}>📈 {t.investmentProjectionHdr||"INVESTMENT PROJECTION"} · starts {addDate(investStart)} · {(investPct*100).toFixed(0)}% of extra cash</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>{[[5,"5 Years"],[10,"10 Years"],[20,"20 Years"]].map(([yrs,label])=><div key={yrs} style={{textAlign:"center"}}><div style={{fontSize:10,color:th.dim,marginBottom:4}}>{label}</div><div style={{fontSize:18,fontWeight:800,color:th.pos}}>{fmt(investFV(yrs))}</div><div style={{fontSize:10,color:th.dim}}>+{fmt(investFV(yrs)-investPerMo*yrs*12)} growth</div></div>)}</div></div>}

  <SD/>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{fontSize:12,fontWeight:700,color:th.dim}}>📝 ADDITIONAL NOTES / RECOMMENDATIONS</div>{editing!=="extra"&&<button onClick={()=>{setDraft(ov.extra||"");setEditing("extra");}} style={{fontSize:10,padding:"3px 10px",borderRadius:6,background:"transparent",color:th.dim,border:`1px solid ${th.cardBorder}`,cursor:"pointer"}}>✏️ Edit</button>}</div>
  {editing==="extra"?<div style={{...mCARD(th),padding:12}}><textarea value={draft} onChange={e=>setDraft(e.target.value)} style={{...mINP(th),width:"100%",boxSizing:"border-box",minHeight:120,fontSize:12,fontFamily:"inherit"}} autoFocus placeholder={t?.customRecsPh||"Add custom recommendations, action items, or notes..."}/><div style={{display:"flex",gap:6,marginTop:6,justifyContent:"flex-end"}}><Btn small onClick={()=>setEditing(null)}>Cancel</Btn><BSolid onClick={()=>saveOv("extra",draft)} style={{fontSize:11,padding:"4px 12px"}}>Save</BSolid></div></div>:<div style={{...mCARD(th),padding:14,fontSize:12,color:ov.extra?th.text:th.dim,fontStyle:ov.extra?"normal":"italic",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{ov.extra||"No additional notes. Click Edit to add recommendations."}</div>}

  <SD/>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{fontSize:12,fontWeight:700,color:th.dim}}>🎯 CLIENT GOALS (editable)</div>{!goalsDraft&&<button onClick={()=>setGoalsDraft({shortTerm:client.notes?.shortTerm||"",midTerm:client.notes?.midTerm||"",longTerm:client.notes?.longTerm||"",goals:client.notes?.goals||""})} style={{fontSize:10,padding:"3px 10px",borderRadius:6,background:"transparent",color:th.dim,border:`1px solid ${th.cardBorder}`,cursor:"pointer"}}>✏️ Edit</button>}</div>
  {goalsDraft?<div style={{...mCARD(th),padding:14}}>{[["shortTerm","Short-Term (0-1yr)"],["midTerm","Mid-Term (1-5yr)"],["longTerm","Long-Term (5+yr)"],["goals","Goals"]].map(([k,l])=><div key={k} style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:4}}>{l}</div><textarea value={goalsDraft[k]} onChange={e=>setGoalsDraft(d=>({...d,[k]:e.target.value}))} style={{...mINP(th),width:"100%",boxSizing:"border-box",minHeight:50,fontSize:12,fontFamily:"inherit"}}/></div>)}<div style={{display:"flex",gap:6,justifyContent:"flex-end"}}><Btn small onClick={()=>setGoalsDraft(null)}>Cancel</Btn><BSolid onClick={()=>saveGoals(goalsDraft)} style={{fontSize:11,padding:"4px 12px"}}>{t.saveGoalsBtn||"Save Goals"}</BSolid></div></div>:<div style={{...mCARD(th),padding:14}}>{[["Short-Term (0-1yr)",client.notes?.shortTerm],["Mid-Term (1-5yr)",client.notes?.midTerm],["Long-Term (5+yr)",client.notes?.longTerm],["Goals",client.notes?.goals]].filter(([,v])=>v).map(([l,v])=><div key={l} style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:700,color:th.dim}}>{l}</div><div style={{fontSize:12,color:th.muted,marginTop:2,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{v}</div></div>)}{!client.notes?.goals&&!client.notes?.shortTerm&&!client.notes?.midTerm&&!client.notes?.longTerm&&<div style={{fontSize:12,color:th.dim,fontStyle:"italic"}}>{t.noGoalsSet||"No goals set yet. Click Edit to add them."}</div>}</div>}
</div>;}
/* ── YEAR COMPARE VIEW ─────────────────────────────────────────────────── */
function YearCompareView({client,t,lang}){
  const th=useTh();
  const snaps=client.monthSnapshots||[];
  const byYear={};
  snaps.forEach(s=>{const parts=s.label.split(" ");const yr=parts[1]||String(new Date().getFullYear());if(!byYear[yr])byYear[yr]=[];byYear[yr].push(s);});
  const years=Object.keys(byYear).sort();
  const yearRows=years.map(yr=>{const list=byYear[yr].slice().sort((a,b)=>MS.indexOf(a.label.split(" ")[0])-MS.indexOf(b.label.split(" ")[0]));const latest=list[list.length-1];const avgCashFlow=list.reduce((s,x)=>s+(+x.cashFlow||0),0)/Math.max(1,list.length);const avgIncome=list.reduce((s,x)=>s+(+x.income||0),0)/Math.max(1,list.length);return{year:yr,snapCount:list.length,debt:Math.round(latest.debt||0),savings:Math.round(latest.savings||0),cashFlow:Math.round(avgCashFlow),income:Math.round(avgIncome),lastLabel:latest.label};});
  const liveNet=Math.round(sumN(client.incomeStreams));const liveBills=Math.round(sumB(client.bills));const liveMin=Math.round(sumMin(client.cards));const liveAvail=liveNet-liveBills-liveMin;const liveDebt=Math.round(totalL(client));const liveSav=Math.round(liquidA(client));const curYr=String(new Date().getFullYear());
  const hasCurYear=years.includes(curYr);
  const liveRow={year:curYr+"★",snapCount:"—",debt:liveDebt,savings:liveSav,cashFlow:liveAvail,income:liveNet,lastLabel:"Live"};
  const rows=hasCurYear?[...yearRows]:[...yearRows,liveRow];
  if(yearRows.length===0){return<div style={{...mCARD(th),padding:24,textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>📆</div><div style={{fontSize:14,fontWeight:700,color:th.text,marginBottom:4}}>{t.noYearData||"No year data yet"}</div><div style={{fontSize:12,color:th.dim}}>{t.noYearDataHelp||"Save snapshots in different years to compare year over year."}</div></div>;}
  const fields=[{k:"debt",l:t.totalDebt||"Total Debt",c:th.neg},{k:"savings",l:t.savings||"Savings",c:th.pos},{k:"cashFlow",l:(t.cashFlow||"Cash Flow")+"/mo",c:GOLD},{k:"income",l:(t.netIncome||"Net Income")+"/mo",c:th.blue}];
  return<div>
    <div style={{fontSize:11,color:th.muted,marginBottom:14,padding:"8px 12px",background:th.accent+"08",borderRadius:8,lineHeight:1.6}}>💡 {t.yearCompareHelp||"Shows the latest snapshot from each year with year-averaged cash flow and income."}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
      {fields.map(f=><div key={f.k} style={{...mCARD(th),padding:12}}>
        <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>{f.l}</div>
        <ResponsiveContainer width="100%" height={140} style={{outline:"none"}}>
          <AreaChart data={rows} margin={{top:18,right:8,left:0,bottom:0}}>
            <XAxis dataKey="year" tick={{fontSize:9,fill:th.dim}} axisLine={false} tickLine={false}/>
            <YAxis hide/>
            <ReTip contentStyle={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:8,fontSize:11}} formatter={v=>fmt(v)}/>
            <Area type="monotone" dataKey={f.k} stroke={f.c} strokeWidth={2} fill={f.c+"33"} dot={{r:2,strokeWidth:0,fill:f.c}} activeDot={{r:4,strokeWidth:0,fill:f.c}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>)}
    </div>
    <div style={{...mCARD(th),padding:14}}>
      <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:10}}>📊 {t.yearComparison||"Year Comparison"}</div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:520}}>
          <thead><tr>
            <th style={mTH(th)}>{t.year||"Year"}</th>
            <th style={mTHR(th)}>{t.totalDebt||"Debt"}</th>
            <th style={mTHR(th)}>{t.savings||"Savings"}</th>
            <th style={mTHR(th)}>{(t.cashFlow||"Cash Flow")+"/mo"}</th>
            <th style={mTHR(th)}>{(t.netIncome||"Net Income")+"/mo"}</th>
            <th style={mTHR(th)}>{t.snapshots||"Snaps"}</th>
          </tr></thead>
          <tbody>{rows.map((r,i)=><tr key={r.year+i}>
            <td style={{...mTD(th),fontWeight:700}}>{r.year}</td>
            <td style={{...mTDR(th),color:th.neg,fontWeight:700}}>{fmt(r.debt)}</td>
            <td style={{...mTDR(th),color:th.pos,fontWeight:700}}>{fmt(r.savings)}</td>
            <td style={{...mTDR(th),color:GOLD,fontWeight:700}}>{fmt(r.cashFlow)}</td>
            <td style={{...mTDR(th),color:th.blue,fontWeight:700}}>{fmt(r.income)}</td>
            <td style={{...mTDR(th),color:th.dim,fontSize:11}}>{r.snapCount}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </div>
  </div>;
}
/* ── COMPARE REPORT TAB ─────────────────────────────────────────────────── */
function CompareReportTab({client,onUpdate,lang,t}){const th=useTh();const[cmpMode,setCmpMode]=useState("months");const snaps=client.monthSnapshots||[];const now=new Date();const curLabel=`${MS[now.getMonth()]} ${now.getFullYear()}`;
// Sort snaps chronologically; exclude any snap whose label matches curLabel (current period)
const snapKey=s=>{const parts=s.label.split(" ");const yr=parseInt(parts[1])||now.getFullYear();const mo=MS.indexOf(parts[0]);return yr*12+(mo>=0?mo:0);};
const sortedSnaps=snaps.filter(s=>s.label!==curLabel).slice().sort((a,b)=>snapKey(a)-snapKey(b));
const[selMonths,setSelMonths]=useState(()=>{const last=sortedSnaps.slice(-2).map(s=>s.label);return last.length>=2?last:last.length===1?[last[0],"current"]:["current"];});
const toggle=l=>setSelMonths(p=>p.includes(l)?p.filter(x=>x!==l):(p.length<4?[...p,l]:p));
// Build rows in chronological order: snaps first, current last
const orderedSel=[...selMonths.filter(l=>l!=="current").sort((a,b)=>{const sa=snaps.find(x=>x.label===a),sb=snaps.find(x=>x.label===b);return snapKey(sa||{label:a})-snapKey(sb||{label:b});}),selMonths.includes("current")?"current":null].filter(Boolean);
const getSnap=label=>{if(label==="current"){const tA=totalA(client),tL=totalL(client);const net=sumN(client.incomeStreams),bills=sumB(client.bills),minD=sumMin(client.cards),liq=liquidA(client);const gross=client.incomeStreams.reduce((s,i)=>s+toM(i.gross,i.freq),0);const retire=(client.accounts||[]).filter(a=>ACCT_META[a.type]?.invest).reduce((s,a)=>s+(+a.value||0),0);const ccBal=client.cards.reduce((s,c)=>s+(+c.balance||0),0);const _availLive=Math.max(0,net-bills-minD);const _retContribLive=(client.alloc?.retirement||0)/100*_availLive;const dsr=net>0?minD/net:(minD>0?99:0);const dta=tA>0?tL/tA:(tL>0?99:0);const rsr=gross>0?_retContribLive/gross:0;const efr=bills>0?liq/bills:0;const cr=ccBal>0?liq/ccBal:999;return{label:curLabel+" (Live)",income:net,bills,minPay:minD,cashFlow:net-bills-minD,liquid:liq,debt:tL,netWorth:tA-tL,assets:tA,dsr,dta,rsr,efr,cr};}
const s=snaps.find(x=>x.label===label);if(!s)return null;
const d=s.data;const tA=d?(d.accounts||[]).reduce((a,x)=>a+(+x.value||0),0)+(d.customAssets||[]).reduce((a,x)=>a+(+x.value||0),0):0;const tL=s.debt||0;const liq=d?(d.accounts||[]).filter(a=>ACCT_META[a.type]?.liquid).reduce((a,x)=>a+(+x.value||0),0):s.savings||0;const minD=d?(d.cards||[]).reduce((a,c)=>a+effectiveMin(c),0):0;const gross=d?(d.incomeStreams||[]).reduce((a,i)=>a+toM(i.gross,i.freq),0):s.income||0;const retire=d?(d.accounts||[]).filter(a=>ACCT_META[a.type]?.invest).reduce((a,x)=>a+(+x.value||0),0):0;const ccBal=d?(d.cards||[]).reduce((a,c)=>a+(+c.balance||0),0):tL;const _availHist=Math.max(0,s.income-s.bills-minD);const _retContribHist=(d?.alloc?.retirement||client.alloc?.retirement||0)/100*_availHist;const dsr=s.income>0?minD/s.income:(minD>0?99:0);const dta=tA>0?tL/tA:(tL>0?99:0);const rsr=gross>0?_retContribHist/gross:0;const efr=s.bills>0?liq/s.bills:0;const cr=ccBal>0?liq/ccBal:999;return{label,income:s.income,bills:s.bills,minPay:minD,cashFlow:s.cashFlow,liquid:liq,debt:tL,netWorth:tA-tL||s.income-s.bills,assets:tA,dsr,dta,rsr,efr,cr};};
const rows=orderedSel.map(getSnap).filter(Boolean);const fields=[{k:"income",l:(t.fldNetIncomeCmp||"💼 Net Income"),c:th.pos},{k:"bills",l:(t.fldBillsCmp||"💳 Bills"),c:th.neg},{k:"minPay",l:(t.fldMinDebtCmp||"🏦 Min Debt Pay"),c:th.warn},{k:"cashFlow",l:(t.fldCashFlowCmp||"💰 Cash Flow"),c:GOLD},{k:"liquid",l:(t.fldLiquidCmp||"💧 Liquid Savings"),c:th.blue},{k:"debt",l:(t.fldDebtCmp||"📉 Total Debt"),c:th.neg},{k:"assets",l:(t.fldAssetsCmp||"📈 Total Assets"),c:th.pos},{k:"netWorth",l:(t.fldNetWorthCmp||"💎 Net Worth"),c:GOLD}];
const ratioRows=[{l:(t.ratioDSR||"DSR"),fmt:v=>v>=99?"N/A":(v*100).toFixed(1)+"%",good:v=>v<0.36,k:"dsr",bm:"<36%"},{l:(t.ratioDebtAsset||"Debt/Asset"),fmt:v=>v>=99?"N/A":(v*100).toFixed(1)+"%",good:v=>v<0.4,k:"dta",bm:"<40%"},{l:(t.ratioCurrent||"Current Ratio"),fmt:v=>v>=999?"N/A":v.toFixed(2)+"x",good:v=>v>1,k:"cr",bm:">1.0x"},{l:(t.ratioRetirementRate||"Retirement Rate"),fmt:v=>(v*100).toFixed(1)+"%",good:v=>v>=0.12,k:"rsr",bm:">12%"},{l:(t.ratioEmergencyFund||"Emergency Fund"),fmt:v=>v.toFixed(1)+"mo",good:v=>v>=3,k:"efr",bm:`>${client.efMonths||3}mo`},{l:(t.ratioCashFlow||"Cash Flow"),fmt:v=>v>=0?"✓ "+(t.positive||"Positive"):"✗ "+(t.negative||"Negative"),good:v=>v>=0,k:"cashFlow",bm:">0"}];
const _cmpTabs=<div style={{display:"flex",gap:8,marginBottom:14,borderBottom:`1px solid ${th.cardBorder}`,paddingBottom:0}}>{[["months","📅 "+(t.monthly2||"Monthly")],["years","📆 "+(t.yearly||"Yearly")]].map(([v,l])=><button key={v} onClick={()=>setCmpMode(v)} style={{fontSize:12,padding:"7px 14px",background:"transparent",border:"none",cursor:"pointer",color:cmpMode===v?th.accent:th.muted,fontWeight:cmpMode===v?700:500,borderBottom:cmpMode===v?`2px solid ${th.accent}`:"2px solid transparent",marginBottom:-1}}>{l}</button>)}</div>;
if(cmpMode==="years")return<div>{_cmpTabs}<YearCompareView client={client} t={t} lang={lang}/></div>;
return<div>{_cmpTabs}{(()=>{const saved=client.savedCompare;const saveCompareSnap=()=>{if(rows.length<2){alert(t.select2MonthsErr||"Select at least 2 months first.");return;}const snap={selMonths:orderedSel,rows,fields,ratioRows:ratioRows.map(r=>({l:r.l,bm:r.bm,k:r.k})),savedAt:new Date().toISOString()};onUpdate({...client,savedCompare:snap});alert(t.compareSnapAlert||"✓ Compare snapshot saved. It will appear in the Complete Report.");};const clearCompareSnap=()=>{if(!confirm(t.compareSnapClearConfirm||"Clear the saved Compare snapshot?"))return;onUpdate({...client,savedCompare:null});};return<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,gap:8,flexWrap:"wrap"}}><span style={{fontSize:11,color:th.muted}}>{t.compareSelectHelp||"Select 2–4 months (max). Ordered chronologically."}{saved&&<span style={{color:th.pos,marginLeft:6,fontSize:10}}>{t.snapshotSaved||"● Snapshot saved"}</span>}</span><div style={{display:"flex",gap:6}}>{saved&&<Btn small onClick={clearCompareSnap} color={th.neg}>🗑️ Clear Snapshot</Btn>}<BSolid onClick={saveCompareSnap} style={{fontSize:11,padding:"4px 12px"}}>{saved?"💾 Update Snapshot":"📌 Save Snapshot"}</BSolid></div></div>;})()}<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>{sortedSnaps.map(s=><button key={s.label} onClick={()=>toggle(s.label)} style={{fontSize:11,padding:"4px 12px",borderRadius:8,cursor:"pointer",background:selMonths.includes(s.label)?th.accent+"22":"transparent",color:selMonths.includes(s.label)?th.accent:th.muted,border:`1px solid ${selMonths.includes(s.label)?th.accent:th.cardBorder}`,fontWeight:selMonths.includes(s.label)?700:400}}>{s.label}{s.data&&<span style={{fontSize:9,color:th.pos,marginLeft:3}}>●</span>}</button>)}<button onClick={()=>toggle("current")} style={{fontSize:11,padding:"4px 12px",borderRadius:8,cursor:"pointer",background:selMonths.includes("current")?th.pos+"22":"transparent",color:selMonths.includes("current")?th.pos:th.muted,border:`1px solid ${selMonths.includes("current")?th.pos:th.cardBorder}`,fontWeight:selMonths.includes("current")?700:400}}>{t.currentLiveBtn||"▶ Current (Live)"}</button></div>
{rows.length<2?<div style={{...mCARD(th),padding:24,textAlign:"center",color:th.muted}}>{t.selectMonthsCompare||"Select at least 2 months to compare."}</div>:<><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:480,tableLayout:"fixed"}}><colgroup><col style={{width:`${28}%`}}/>{rows.map((_,i)=><col key={i} style={{width:`${(72-12)/rows.length}%`}}/>)}<col style={{width:"12%"}}/></colgroup><thead><tr><th style={mTH(th)}>{t.colMetric||"Metric"}</th>{rows.map(r=><th key={r.label} style={{...mTHR(th),fontWeight:700,color:r.label.includes("Live")?th.pos:th.accent,fontSize:11}}>{r.label}</th>)}<th style={{...mTHR(th),color:th.dim}}>{t.deltaChange||"Δ Change"}</th></tr></thead><tbody>{fields.map(f=>{const vals=rows.map(r=>r[f.k]||0);const ch=vals[vals.length-1]-vals[0];const pct=vals[0]?((ch/Math.abs(vals[0]))*100).toFixed(1):"—";const isGood=(f.k==="netWorth"||f.k==="cashFlow"||f.k==="liquid"||f.k==="assets"||f.k==="income")?ch>=0:ch<=0;return<tr key={f.k}><td style={{...mTD(th),fontWeight:600,color:f.c}}>{f.l}</td>{vals.map((v,i)=><td key={i} style={{...mTDR(th),color:f.c,fontWeight:700}}>{fmt(v)}</td>)}<td style={{...mTDR(th),fontWeight:700,color:isGood?th.pos:th.neg,fontSize:11}}>{ch!==0?(ch>0?"+":"")+fmt(ch):""}{pct!=="—"&&<div style={{fontSize:10,opacity:0.7}}>{pct}%</div>}</td></tr>;})} </tbody></table></div><div style={{marginTop:20}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:10}}>📐 {t.allRatios||"All Ratios"}</div><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:480,tableLayout:"fixed"}}><colgroup><col style={{width:`${28}%`}}/>{rows.map((_,i)=><col key={i} style={{width:`${(72-12)/rows.length}%`}}/>)}<col style={{width:"12%"}}/></colgroup><thead><tr><th style={mTH(th)}>{t.ratioLbl||"Ratio"}</th>{rows.map(r=><th key={r.label} style={{...mTHR(th),fontSize:10,fontWeight:700,color:r.label.includes("Live")?th.pos:th.accent}}>{r.label}</th>)}<th style={{...mTHR(th),color:th.muted,fontSize:10,fontWeight:700}}>{t.target||"Target"}</th></tr></thead><tbody>{ratioRows.map(rf=>{const vals=rows.map(r=>r[rf.k]);return<tr key={rf.l}><td style={{...mTD(th),fontWeight:600,color:th.muted,fontSize:12}}>{rf.l}</td>{vals.map((v,i)=><td key={i} style={{...mTDR(th),color:rf.good(v)?th.pos:th.neg,fontWeight:700,fontSize:12}}>{rf.fmt(v)}</td>)}<td style={{...mTDR(th),fontSize:11,color:th.muted,fontWeight:600}}>{rf.bm}</td></tr>;})} </tbody></table></div></div></>}</div>;}

function ClientReport({client,onUpdate,lang,t,settings}){const th=useTh();const[tab,setTab]=useState("summary");const tabs=[{id:"summary",l:"📊 "+t.summary},{id:"monthly",l:"📅 "+(t.monthlyReport||"Monthly Report")},{id:"financial",l:"📋 "+(t.financialStatements||"Financial Statements")},{id:"complete",l:"📄 "+(t.completeReport||"Complete Report")},{id:"compare",l:"📊 "+(t.compare||"Compare")}];return<div><div className="ga-np" style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>{tabs.map(tb=><button key={tb.id} onClick={()=>setTab(tb.id)} style={{fontSize:12,padding:"6px 16px",borderRadius:8,cursor:"pointer",background:tab===tb.id?th.accent:"transparent",color:tab===tb.id?"#fff":th.muted,fontWeight:tab===tb.id?700:400,border:`1px solid ${tab===tb.id?th.accent:th.cardBorder}`}}>{tb.l}</button>)}</div>{tab==="summary"&&<SummaryReport client={client} lang={lang} t={t}/>}{tab==="monthly"&&<MonthlyReportTab client={client} onUpdate={onUpdate} lang={lang} t={t} settings={settings}/>}{tab==="financial"&&<FinancialStatementReportTab client={client} lang={lang} t={t} settings={settings}/>}{tab==="complete"&&<CompleteReportTab client={client} onUpdate={onUpdate} lang={lang} t={t} settings={settings}/>}{tab==="compare"&&<CompareReportTab client={client} onUpdate={onUpdate} lang={lang} t={t}/>}</div>;}

/* ── REMINDERS PANEL ─────────────────────────────────────────────────────── */
function AlertsSettingsModal({settings,onSave,onClose,t}){const th=useTh();const[s,setS]=useState(settings.alertTypes||{noContact:true,highDSR:true,promoExpiring:true,debtRising:true,billDue:true,lowCashFlow:true,lowEF:true,missedSnap:true});const toggle=k=>setS(p=>({...p,[k]:!p[k]}));const labels={noContact:t.alertNoContact||"No Contact (30+ days)",highDSR:t.alertHighDSR||"High DSR (>36%)",promoExpiring:t.alertPromoExpiring||"Promo APR Expiring",debtRising:t.alertDebtRising||"Debt Rising Month-over-Month",billDue:t.alertBillDue||"Bills Due This Week",lowCashFlow:t.alertLowCashFlow||"Negative Cash Flow",lowEF:t.alertLowEF||"Low Emergency Fund",missedSnap:t.alertMissedSnap||"Missed Monthly Snapshot"};return<Modal title={"⚙️ "+(t.alertSettings||"Alert Settings")} onClose={onClose}><div style={{fontSize:12,color:th.muted,marginBottom:16}}>{t.alertSettingsIntro||"Toggle which alert types appear in the advisor panel:"}</div>{Object.entries(labels).map(([k,l])=><div key={k} onClick={()=>toggle(k)} style={{...mCARD(th),padding:"10px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,marginBottom:5,border:`1px solid ${s[k]?th.accent:th.cardBorder}`}}><div style={{width:32,height:18,borderRadius:99,background:s[k]?th.accent:th.cardBorder,position:"relative",transition:"all 0.15s"}}><div style={{position:"absolute",top:2,left:s[k]?16:2,width:14,height:14,borderRadius:99,background:"#fff",transition:"all 0.15s"}}/></div><span style={{fontSize:12,color:th.text}}>{l}</span></div>)}<div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}><Btn onClick={onClose}>{t.cancel||"Cancel"}</Btn><BSolid onClick={()=>{onSave({...settings,alertTypes:s});onClose();}}>{t.save||"Save"}</BSolid></div></Modal>;}

function RemindersPanel({clients,settings,t,onSettingsChange}){
  const th=useTh();
  const[tab,setTab]=useState("advisor");
  const[sortA,setSortA]=useState("priority");
  const[sortC,setSortC]=useState("default");
  const[filtClient,setFiltClient]=useState("");
  const[filtDue,setFiltDue]=useState("");
  const[filtType,setFiltType]=useState("");
  const[page,setPage]=useState(1);
  const[expanded,setExpanded]=useState(false);
  const[settingsOpen,setSettingsOpen]=useState(false);
  // v0.28.0 — Dismiss/mute expander state (per panel)
  const[showMutedAdv,setShowMutedAdv]=useState(false);
  const[showMutedCli,setShowMutedCli]=useState(false);
  const alertTypes=settings.alertTypes||{noContact:true,highDSR:true,promoExpiring:true,debtRising:true,billDue:true,lowCashFlow:true,lowEF:true,missedSnap:true};
  // v0.28.0 — dismissal storage. Each entry: {key, until (ISO|null=forever), dismissedAt}
  const dismissals=settings.alertDismissals||[];
  // Cleanup expired dismissals on mount (no-op if list is clean).
  useEffect(()=>{const now=Date.now();const cleaned=dismissals.filter(d=>d&&d.key&&(!d.until||new Date(d.until).getTime()>now));if(cleaned.length!==dismissals.length)onSettingsChange({...settings,alertDismissals:cleaned});/* eslint-disable-next-line react-hooks/exhaustive-deps */},[]);
  const dismissAlert=(key,kind)=>{let until,toastMsg;if(kind==="due"){const d=new Date();until=new Date(d.getFullYear(),d.getMonth()+1,1).toISOString();toastMsg=t?.dismissedCycleToast||"Marked handled for this cycle — re-appears next month";}else if(kind==="forever"){until=null;toastMsg=t?.dismissedForeverToast||"Muted forever";}else if(kind==="snooze30"){until=new Date(Date.now()+30*86400000).toISOString();toastMsg=t?.dismissed30dToast||"Snoozed for 30 days";}else{until=new Date(Date.now()+7*86400000).toISOString();toastMsg=t?.dismissed7dToast||"Snoozed for 7 days";}const nextList=[...dismissals.filter(x=>x.key!==key),{key,until,dismissedAt:new Date().toISOString()}];onSettingsChange({...settings,alertDismissals:nextList});if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("ga-toast",{detail:{kind:"success",msg:toastMsg}}));};
  const restoreAlert=key=>{onSettingsChange({...settings,alertDismissals:dismissals.filter(x=>x.key!==key)});if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("ga-toast",{detail:{kind:"success",msg:t?.restoredAlertToast||"Alert restored"}}));};
  let adv=getAdvRem(clients,settings);
  // Filter by enabled types — we match by task keyword
  const typeKeyMap={"No Contact":"noContact","High DSR":"highDSR","Promo":"promoExpiring","Debt Rising":"debtRising","Bill Due":"billDue","Cash Flow":"lowCashFlow","Emergency":"lowEF","Snapshot":"missedSnap"};
  adv=adv.filter(a=>{const key=Object.entries(typeKeyMap).find(([k])=>a.task?.includes(k));return!key||alertTypes[key[1]]!==false;});
  const cRem=getClientRem(clients);
  // Apply filters
  if(filtClient)adv=adv.filter(a=>a.clientName.toLowerCase().includes(filtClient.toLowerCase()));
  if(filtType)adv=adv.filter(a=>a.task?.toLowerCase().includes(filtType.toLowerCase())||a.priority===filtType);
  let sAdv=[...adv].sort((a,b)=>sortA==="priority"?(a.priority==="high"&&b.priority!=="high"?-1:1):sortA==="client"?a.clientName.localeCompare(b.clientName):a.task.localeCompare(b.task));
  let sCli=[...cRem].sort((a,b)=>sortC==="client"?a.clientName.localeCompare(b.clientName):sortC==="task"?a.task.localeCompare(b.task):sortC==="amount"?b.amount-a.amount:(a.daysUntil??99)-(b.daysUntil??99));
  if(filtDue)sCli=sCli.filter(u=>(u.clientName+" "+(u.name||"")+" "+(u.task||"")).toLowerCase().includes(filtDue.toLowerCase()));
  // v0.28.0 — partition into active vs muted using dismissal lookup
  const _isDis=k=>isAlertDismissed(k,dismissals);
  const activeAdv=sAdv.filter(a=>!_isDis(a.key));
  const activeCli=sCli.filter(u=>!_isDis(u.key));
  const mutedAdv=sAdv.filter(a=>_isDis(a.key));
  const mutedCli=sCli.filter(u=>_isDis(u.key));
  const pC=p=>p==="high"?th.neg:th.warn;
  const SEL={fontSize:11,padding:"3px 8px",borderRadius:7,background:"transparent",color:th.muted,border:`1px solid ${th.cardBorder}`,cursor:"pointer",outline:"none"};
  // Pagination logic: 3 lines compact, 10 per page expanded
  const currentList=tab==="advisor"?activeAdv:activeCli;
  const total=currentList.length;
  const perPage=expanded?10:3;
  const startIdx=(page-1)*perPage;
  const visible=currentList.slice(startIdx,startIdx+perPage);
  const hasMore=total>3;
  // v0.19.0 — side-by-side Advisor Alerts + Client Due cards (Claude design).
  // Both cards always render; no tab switching. Search/sort/expand stay per panel
  // via the existing shared state (filtClient applies to whichever side is open).
  // v0.28.0 — `advVisible` / `cliVisible` now drawn from active (non-dismissed) lists.
  const advVisible=activeAdv.slice(0,expanded?20:5);
  const cliVisible=activeCli.slice(0,expanded?20:5);
  const showAdvMore=activeAdv.length>5;
  const showCliMore=activeCli.length>5;
  // v0.28.0 — small ✕ dismiss button (transparent, low-vis, expands on focus)
  const DISMISS_BTN={background:"transparent",border:"none",color:th.dim,cursor:"pointer",fontSize:13,padding:"2px 6px",borderRadius:6,lineHeight:1,flexShrink:0,opacity:0.55,transition:"opacity 150ms ease,background-color 150ms ease"};
  const dismissLbl=t?.dismissAlert||"Dismiss";
  const restoreLbl=t?.restoreAlert||"Restore";
  const mutedExpanderLbl=n=>(t?.mutedAlertsLbl||"({n} muted)").replace("{n}",n);
  // Tiny human label of a dismissal's remaining duration
  const _untilLabel=k=>{const d=dismissals.find(x=>x.key===k);if(!d)return "";if(!d.until)return t?.mutedForeverLbl||"muted";const ms=new Date(d.until)-Date.now();if(ms<=0)return "";const days=Math.ceil(ms/86400000);return days===1?(t?.muted1dLbl||"1d"):(t?.mutedNdLbl||"{n}d").replace("{n}",days);};
  return<>{settingsOpen&&<AlertsSettingsModal settings={settings} onSave={onSettingsChange} onClose={()=>setSettingsOpen(false)} t={t}/>}<div data-ga-grid="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:16}}>
    {/* ── Advisor Alerts card (v0.20.0 — single icon: gear-only header per user feedback) ── */}
    <div style={{...mCARD(th),padding:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,gap:8,flexWrap:"nowrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0,flex:1}}>
          <span style={{fontSize:12,fontWeight:700,color:th.accent,letterSpacing:".06em",textTransform:"uppercase",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{(t.advisorAlertsLbl||"Advisor Alerts").replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\s]+/u,"")}{activeAdv.length>0&&<span style={{marginLeft:8,color:th.warn,fontFamily:"'JetBrains Mono',monospace",fontWeight:800}}>· {activeAdv.length}</span>}</span>
        </div>
        <button onClick={()=>setSettingsOpen(true)} title={t.alertSettingsTitle||"Alert Settings"} style={{...SEL,fontSize:13,padding:"3px 8px",flexShrink:0}}>⚙️</button>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
        <input placeholder={"🔍 "+(t?.searchPh||"Search...")} aria-label={t?.searchAdvisorAlertsAria||"Search advisor alerts"} value={filtClient} onChange={e=>setFiltClient(e.target.value)} style={{...mINP(th),fontSize:11,padding:"4px 10px",flex:"1 1 120px",minWidth:0}}/>
        <select value={sortA} onChange={e=>setSortA(e.target.value)} style={SEL}><option value="priority">{t?.sortPriority||"Priority"}</option><option value="client">{t.client||"Client"}</option></select>
      </div>
      {mutedAdv.length>0&&<button onClick={()=>setShowMutedAdv(v=>!v)} style={{background:"transparent",border:"none",color:th.dim,fontSize:10,cursor:"pointer",padding:"2px 0",textTransform:"none",letterSpacing:0,alignSelf:"flex-start",marginBottom:6}} aria-expanded={showMutedAdv}>{showMutedAdv?"▴ ":"▾ "}{mutedExpanderLbl(mutedAdv.length)}</button>}
      {activeAdv.length===0?<div style={{fontSize:11,color:th.dim,fontStyle:"italic",padding:"8px 0"}}>{t?.noAdvisorAlerts||"No advisor alerts."}</div>:
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {advVisible.map((a,i)=><div key={a.key||i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,background:pC(a.priority)+"11",border:`1px solid ${pC(a.priority)}22`}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:700,color:th.text,overflow:"hidden",textOverflow:"ellipsis"}}>{a.clientName}</div>
              <div style={{fontSize:11,color:th.muted,overflow:"hidden",textOverflow:"ellipsis"}}>{a.detail}</div>
            </div>
            <Pill color={pC(a.priority)} pulse={a.priority==="high"&&(a.type==="noContact"||a.type==="promo")}>{a.task}</Pill>
            <button onClick={()=>dismissAlert(a.key,"snooze7")} title={dismissLbl+" — "+(t?.dismissAdvHint||"snooze 7 days")} aria-label={dismissLbl+" "+a.task+" "+(t?.forClientLbl||"for")+" "+a.clientName} style={DISMISS_BTN} onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity="0.55"}>✕</button>
          </div>)}
        </div>}
      {showMutedAdv&&mutedAdv.length>0&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px dashed ${th.cardBorder}`}}>
        <div style={{fontSize:10,fontWeight:700,color:th.dim,letterSpacing:".06em",textTransform:"uppercase",marginBottom:6}}>{t?.mutedHdr||"Muted"}</div>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {mutedAdv.map((a,i)=><div key={a.key||i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 10px",borderRadius:7,background:th.cardBorder+"15",fontSize:11,opacity:0.85}}>
            <div style={{flex:1,minWidth:0,overflow:"hidden"}}>
              <span style={{color:th.muted,fontWeight:600}}>{a.clientName}</span>
              <span style={{color:th.dim,marginLeft:6}}>· {a.task.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\s]+/u,"")}</span>
            </div>
            <span style={{fontSize:9,color:th.dim,flexShrink:0,fontFamily:"'JetBrains Mono',monospace"}}>{_untilLabel(a.key)}</span>
            <button onClick={()=>restoreAlert(a.key)} title={restoreLbl} aria-label={restoreLbl+" "+a.task+" "+(t?.forClientLbl||"for")+" "+a.clientName} style={{...DISMISS_BTN,color:th.accent,opacity:0.7}}>↺</button>
          </div>)}
        </div>
      </div>}
      {showAdvMore&&<div style={{marginTop:8,textAlign:"center"}}>
        <button onClick={()=>setExpanded(e=>!e)} style={{fontSize:11,padding:"5px 14px",borderRadius:8,background:"transparent",color:th.accent,border:`1px solid ${th.accent}44`,cursor:"pointer",fontWeight:600}}>{expanded?"▲ "+(t?.showLess||"Show Less"):"▼ "+(t?.showMore||"Show More")+` (${activeAdv.length-5})`}</button>
      </div>}
    </div>
    {/* ── Client Due card (v0.20.0 — gear added, leading emoji removed for visual parity) ── */}
    <div style={{...mCARD(th),padding:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,gap:8,flexWrap:"nowrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0,flex:1}}>
          <span style={{fontSize:12,fontWeight:700,color:th.accent,letterSpacing:".06em",textTransform:"uppercase",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{(t.clientDueLbl||"Client Due").replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\s]+/u,"")}{activeCli.length>0&&<span style={{marginLeft:8,color:th.warn,fontFamily:"'JetBrains Mono',monospace",fontWeight:800}}>· {activeCli.length}</span>}</span>
        </div>
        <button onClick={()=>setSettingsOpen(true)} title={t.alertSettingsTitle||"Alert Settings"} style={{...SEL,fontSize:13,padding:"3px 8px",flexShrink:0}}>⚙️</button>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
        <input placeholder={"🔍 "+(t?.searchPh||"Search...")} aria-label={t?.searchClientDueAria||"Search bills and cards due"} value={filtDue} onChange={e=>setFiltDue(e.target.value)} style={{...mINP(th),fontSize:11,padding:"4px 10px",flex:"1 1 120px",minWidth:0}}/>
        <select value={sortC} onChange={e=>setSortC(e.target.value)} style={SEL}><option value="default">{t.dueDateOpt||"Due Date"}</option><option value="client">{t.client||"Client"}</option><option value="amount">{t?.amount||"Amount"}</option></select>
      </div>
      {mutedCli.length>0&&<button onClick={()=>setShowMutedCli(v=>!v)} style={{background:"transparent",border:"none",color:th.dim,fontSize:10,cursor:"pointer",padding:"2px 0",textTransform:"none",letterSpacing:0,alignSelf:"flex-start",marginBottom:6}} aria-expanded={showMutedCli}>{showMutedCli?"▴ ":"▾ "}{mutedExpanderLbl(mutedCli.length)}</button>}
      {activeCli.length===0?<div style={{fontSize:11,color:th.dim,fontStyle:"italic",padding:"8px 0"}}>{t?.noBillsDueSoon||"No bills or cards due soon."}</div>:
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {cliVisible.map((u,i)=><div key={u.key||i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",borderRadius:8,background:u.type==="card"?th.warn+"08":th.neg+"08",border:`1px solid ${u.type==="card"?th.warn:th.neg}22`,fontSize:11,gap:8}}>
            <div style={{minWidth:0,flex:1}}>
              <span style={{fontWeight:600,color:th.text}}>{u.name}</span>
              <span style={{color:th.dim,marginLeft:6}}>— {u.clientName}</span>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <span style={{color:th.warn,fontWeight:700}}>{fmtD(u.amount)}</span>
              {u.dueDay&&<span style={{fontSize:9,color:th.dim,display:"block"}}>{(t?.dayPrefix||"Day")} {u.dueDay}</span>}
            </div>
            <button onClick={()=>dismissAlert(u.key,"due")} title={(t?.markPaidHint||"Mark handled this cycle")} aria-label={(t?.markPaidHint||"Mark handled this cycle")+" — "+u.name+" "+(t?.forClientLbl||"for")+" "+u.clientName} style={DISMISS_BTN} onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity="0.55"}>✕</button>
          </div>)}
        </div>}
      {showMutedCli&&mutedCli.length>0&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px dashed ${th.cardBorder}`}}>
        <div style={{fontSize:10,fontWeight:700,color:th.dim,letterSpacing:".06em",textTransform:"uppercase",marginBottom:6}}>{t?.mutedHdr||"Muted"}</div>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {mutedCli.map((u,i)=><div key={u.key||i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 10px",borderRadius:7,background:th.cardBorder+"15",fontSize:11,opacity:0.85}}>
            <div style={{flex:1,minWidth:0,overflow:"hidden"}}>
              <span style={{color:th.muted,fontWeight:600}}>{u.name}</span>
              <span style={{color:th.dim,marginLeft:6}}>— {u.clientName}</span>
            </div>
            <span style={{color:th.dim,fontWeight:600}}>{fmtD(u.amount)}</span>
            <span style={{fontSize:9,color:th.dim,flexShrink:0,fontFamily:"'JetBrains Mono',monospace"}}>{_untilLabel(u.key)}</span>
            <button onClick={()=>restoreAlert(u.key)} title={restoreLbl} aria-label={restoreLbl+" "+u.name+" "+(t?.forClientLbl||"for")+" "+u.clientName} style={{...DISMISS_BTN,color:th.accent,opacity:0.7}}>↺</button>
          </div>)}
        </div>
      </div>}
      {showCliMore&&<div style={{marginTop:8,textAlign:"center"}}>
        <button onClick={()=>setExpanded(e=>!e)} style={{fontSize:11,padding:"5px 14px",borderRadius:8,background:"transparent",color:th.accent,border:`1px solid ${th.accent}44`,cursor:"pointer",fontWeight:600}}>{expanded?"▲ "+(t?.showLess||"Show Less"):"▼ "+(t?.showMore||"Show More")+` (${activeCli.length-5})`}</button>
      </div>}
    </div>
  </div></>;}

/* ── CALCULATORS ─────────────────────────────────────────────────────────── */
function AmortTablePaginated({data}){const th=useTh();const[page,setPage]=useState(1);const per=10;const total=data.length;const start=(page-1)*per;const visible=data.slice(start,start+per);return<><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}><thead><tr><th style={mTH(th)}>Year</th><th style={mTHR(th)}>Balance</th><th style={mTHR(th)}>Paid Interest</th><th style={mTHR(th)}>Paid Principal</th></tr></thead><tbody>{visible.map(r=><tr key={r.yr}><td style={mTD(th)}>Yr {r.yr}</td><td style={{...mTDR(th),color:th.neg}}>{fmt(r.bal)}</td><td style={{...mTDR(th),color:th.warn}}>{fmt(r.totInt)}</td><td style={{...mTDR(th),color:th.pos}}>{fmt(r.totPrin)}</td></tr>)}</tbody></table></div><Paginator total={total} page={page} setPage={setPage} perPage={per}/></>;}

function EquityTablePaginated({data}){const th=useTh();const[page,setPage]=useState(1);const per=10;const total=data.length;const start=(page-1)*per;const visible=data.slice(start,start+per);return<><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}><thead><tr><th style={mTH(th)}>Year</th><th style={mTHR(th)}>Home Value</th><th style={mTHR(th)}>Mortgage</th><th style={mTHR(th)}>Equity</th></tr></thead><tbody>{visible.map(r=><tr key={r.yr}><td style={mTD(th)}>Yr {r.yr}</td><td style={{...mTDR(th),color:th.blue}}>{fmt(r.val)}</td><td style={{...mTDR(th),color:th.neg}}>{fmt(r.bal)}</td><td style={{...mTDR(th),color:th.pos,fontWeight:700}}>{fmt(r.eq)}</td></tr>)}</tbody></table></div><Paginator total={total} page={page} setPage={setPage} perPage={per}/></>;}

function HomeEquityCalc({t}){const th=useTh();const[tab,setTab]=useState("equity");const INP=mINP(th);const[showHelp,setShowHelp]=useState(false);
// ── Equity/HELOC tab
const[eq,setEq]=useState({homeValue:400000,mortgage1:250000,mortgage2:0,liens:0,loanPct:80,apr:7.5,term:10});const ue=k=>e=>setEq(p=>({...p,[k]:+e.target.value||0}));const totalOwed=eq.mortgage1+eq.mortgage2+eq.liens;const maxLoan=Math.max(0,eq.homeValue*(eq.loanPct/100)-totalOwed);const helocPay=maxLoan>0?mthPmt(maxLoan,eq.apr/100,eq.term*12):0;
// ── Refinance tab
const[rf,setRf]=useState({balance:300000,currentRate:6.5,currentTerm:30,elapsed:5,newRate:5.5,newTerm:30,closingCosts:4000});const ur=k=>e=>setRf(p=>({...p,[k]:+e.target.value||0}));const oldMo=rf.balance>0?mthPmt(rf.balance,rf.currentRate/100,rf.currentTerm*12):0;const newMo=rf.balance>0?mthPmt(rf.balance,rf.newRate/100,rf.newTerm*12):0;const moSav=oldMo-newMo;const breakEven=moSav>0?Math.ceil(rf.closingCosts/moSav):0;const lifeSav=moSav*rf.newTerm*12-rf.closingCosts;
// ── Amortization tab
const[am,setAm]=useState({loanAmt:350000,apr:6.5,term:30,extra:0,extraFreq:1,startDate:new Date().toISOString().slice(0,7)});const ua=k=>e=>setAm(p=>({...p,[k]:+e.target.value||0}));const amMo=am.loanAmt>0?mthPmt(am.loanAmt,am.apr/100,am.term*12):0;const amTable=useMemo(()=>{if(!am.loanAmt||!am.apr)return[];let bal=am.loanAmt;const r=am.apr/100/12;const rows=[];let totInt=0,totPrin=0,mo=0;while(bal>0.01&&mo<am.term*12+1){mo++;const int=bal*r;const prin=Math.min(bal,amMo-int+am.extra);totInt+=int;totPrin+=prin;bal=Math.max(0,bal-prin);if(mo%12===0||bal<0.01)rows.push({yr:Math.ceil(mo/12),bal:Math.round(bal),totInt:Math.round(totInt),totPrin:Math.round(totPrin)});if(bal<0.01)break;}return rows;},[am.loanAmt,am.apr,am.term,am.extra]);
const noExtraMonths=am.loanAmt>0&&am.apr>0?Math.ceil(Math.log(amMo/(amMo-am.loanAmt*am.apr/100/12))/Math.log(1+am.apr/100/12)):0;const withExtraMonths=amTable.length>0?(amTable[amTable.length-1].yr*12):noExtraMonths;const moSaved=noExtraMonths-withExtraMonths;const intSaved=amTable.length>0?am.loanAmt*(am.apr/100)*(noExtraMonths-withExtraMonths)/12:0;
// ── Equity projection
const[ep,setEp]=useState({homeValue:400000,appRate:3.5,mortgageBal:300000,mortgageApr:6.5,monthlyPayment:2000,years:10});const uep=k=>e=>setEp(p=>({...p,[k]:+e.target.value||0}));const epData=useMemo(()=>{const rows=[];let bal=ep.mortgageBal,val=ep.homeValue;for(let y=1;y<=Math.min(ep.years,30);y++){val*=(1+ep.appRate/100);const r=ep.mortgageApr/100/12;for(let m=0;m<12;m++){const int=bal*r;const prin=Math.min(bal,ep.monthlyPayment-int);bal=Math.max(0,bal-prin);}rows.push({yr:y,val:Math.round(val),bal:Math.round(bal),eq:Math.round(val-bal)});}return rows;},[ep]);
const tabs2=[["equity",(t.tabEquityHeloc||"🏦 Equity/HELOC")],["refinance",(t.tabRefinance||"🔄 Refinance")],["amort",(t.tabAmortization||"📊 Amortization")],["projection",(t.tabEquityProjection||"📈 Equity Projection")]];
return<div><div style={{...mCARD(th),padding:"10px 14px",marginBottom:14,background:th.accent+"08",border:`1px solid ${th.accent}33`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setShowHelp(s=>!s)}><span style={{fontSize:12,fontWeight:700,color:th.accent}}>{t.homeGlossaryTitle||"📖 Home Calculator Glossary"} {showHelp?"▲":"▼"}</span></div>{showHelp&&<div style={{fontSize:11,color:th.muted,marginTop:10,lineHeight:1.7}}><div><b style={{color:th.accent}}>{t.glossaryLTV||"LTV (Loan-to-Value):"}</b> {t.glossaryLTVDesc||"% of home value a lender will loan against. Typical max: 80-95% for HELOC/refi. 80% = no PMI."}</div><div><b style={{color:th.accent}}>{t.glossaryHELOC||"HELOC:"}</b> {t.glossaryHELOCDesc||"Home Equity Line of Credit — a revolving credit line secured by your home equity."}</div><div><b style={{color:th.accent}}>{t.glossaryPI||"P&I (Principal & Interest):"}</b> {t.glossaryPIDesc||"The core loan payment — does not include taxes/insurance/HOA."}</div><div><b style={{color:th.accent}}>{t.glossaryBreakEven||"Break-even (Refinance):"}</b> {t.glossaryBreakEvenDesc||"Months to recover closing costs through monthly payment savings. Under 24 months = usually worth refinancing."}</div><div><b style={{color:th.accent}}>{t.glossaryAmortization||"Amortization:"}</b> {t.glossaryAmortizationDesc||"Schedule showing how much of each payment goes to principal vs. interest. Early payments are mostly interest."}</div><div><b style={{color:th.accent}}>{t.glossaryEquity||"Equity:"}</b> {t.glossaryEquityDesc||"Home value minus all mortgages/liens. The portion you actually own."}</div></div>}</div><div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>{tabs2.map(([v,l])=><button key={v} onClick={()=>setTab(v)} style={{fontSize:11,padding:"5px 12px",borderRadius:8,cursor:"pointer",background:tab===v?th.accent+"22":"transparent",color:tab===v?th.accent:th.muted,border:`1px solid ${tab===v?th.accent:th.cardBorder}`,fontWeight:tab===v?700:400}}>{l}</button>)}</div>
{tab==="equity"&&<div><Row2><Field label={t.homeValuePh||"Home Value ($)"}><MaskedNumInp style={INP} value={eq.homeValue} onChange={ue("homeValue")} onKeyDown={bE}/></Field><Field label={t.firstMortgage||"1st Mortgage ($)"}><MaskedNumInp style={INP} value={eq.mortgage1} onChange={ue("mortgage1")} onKeyDown={bE}/></Field></Row2><Row2><Field label={t.secondMortgage||"2nd Mortgage ($)"}><MaskedNumInp style={INP} value={eq.mortgage2} onChange={ue("mortgage2")} onKeyDown={bE}/></Field><Field label={t.otherLiens||"Other Liens ($)"}><MaskedNumInp style={INP} value={eq.liens} onChange={ue("liens")} onKeyDown={bE}/></Field></Row2><Row2><Field label={t.ltvLbl||"Max LTV (%)"}><MaskedNumInp style={INP} value={eq.loanPct} onChange={ue("loanPct")} onKeyDown={bE} min={50} max={95}/></Field><Field label={t.loanAprLbl||"Loan APR (%)"}><MaskedNumInp style={INP} value={eq.apr} onChange={ue("apr")} onKeyDown={bE} step="0.1"/></Field></Row2><Field label={t.termYearsLbl||"Term (years)"}><MaskedNumInp style={INP} value={eq.term} onChange={ue("term")} onKeyDown={bE} min={1} max={30}/></Field><div style={{...mCARD(th),padding:14,marginTop:8}}><CalcRow label={t.totalOwed||"Total Owed"} value={fmt(totalOwed)} color={th.neg}/><CalcRow label={t.maxBorrowable||"Max Borrowable"} value={fmt(maxLoan)} color={th.pos} big/><CalcRow label={t.monthlyPaymentLbl||"Monthly Payment"} value={fmtD(helocPay)} color={th.warn}/><CalcRow label={t.currentEquity||"Current Equity"} value={fmt(eq.homeValue-totalOwed)} color={GOLD}/></div></div>}
{tab==="refinance"&&<div><Row2><Field label={t.refiCurrentBalance||"Current Balance ($)"}><MaskedNumInp style={INP} value={rf.balance} onChange={ur("balance")} onKeyDown={bE}/></Field><Field label={t.refiYearsElapsed||"Years Elapsed"}><MaskedNumInp style={INP} value={rf.elapsed} onChange={ur("elapsed")} onKeyDown={bE} min={0} max={30}/></Field></Row2><Row2><Field label={t.refiCurrentRate||"Current Rate (%)"}><MaskedNumInp style={INP} value={rf.currentRate} onChange={ur("currentRate")} onKeyDown={bE} step="0.1"/></Field><Field label={t.refiNewRate||"New Rate (%)"}><MaskedNumInp style={INP} value={rf.newRate} onChange={ur("newRate")} onKeyDown={bE} step="0.1"/></Field></Row2><Row2><Field label={t.refiNewTerm||"New Term (years)"}><MaskedNumInp style={INP} value={rf.newTerm} onChange={ur("newTerm")} onKeyDown={bE} min={5} max={30}/></Field><Field label={t.refiClosingCosts||"Closing Costs ($)"}><MaskedNumInp style={INP} value={rf.closingCosts} onChange={ur("closingCosts")} onKeyDown={bE}/></Field></Row2><div style={{...mCARD(th),padding:14,marginTop:8}}><CalcRow label={t.refiOldMonthly||"Old Monthly"} value={fmtD(oldMo)} color={th.neg}/><CalcRow label={t.refiNewMonthly||"New Monthly"} value={fmtD(newMo)} color={th.pos}/><CalcRow label={t.refiMonthlySavings||"Monthly Savings"} value={fmtD(moSav)} color={moSav>0?GOLD:th.neg} big/><CalcRow label={t.refiBreakEven||"Break-even"} value={breakEven>0?`${breakEven} ${t.refiMonthsSuffix||"months"}`:"N/A"} color={th.muted}/><CalcRow label={t.refiLifetimeSavings||"Lifetime Savings"} value={fmt(Math.max(0,lifeSav))} color={lifeSav>0?th.pos:th.neg}/></div></div>}
{tab==="amort"&&<div><Row2><Field label={t.amortLoanAmount||"Loan Amount ($)"}><MaskedNumInp style={INP} value={am.loanAmt} onChange={ua("loanAmt")} onKeyDown={bE}/></Field><Field label={t.amortAPR||"APR (%)"}><MaskedNumInp style={INP} value={am.apr} onChange={ua("apr")} onKeyDown={bE} step="0.1"/></Field></Row2><Row2><Field label={t.amortTerm||"Term (years)"}><MaskedNumInp style={INP} value={am.term} onChange={ua("term")} onKeyDown={bE} min={5} max={30}/></Field><Field label={t.amortExtraPayMo||"Extra Payment/mo ($)"}><MaskedNumInp style={INP} value={am.extra} onChange={ua("extra")} onKeyDown={bE}/></Field></Row2><div style={{...mCARD(th),padding:14,marginBottom:12}}><CalcRow label={t.amortBaseMonthly||"Base Monthly"} value={fmtD(amMo)} color={th.accent}/>{am.extra>0&&<><CalcRow label={t.amortTotalMonthly||"Total Monthly"} value={fmtD(amMo+am.extra)} color={th.warn}/><CalcRow label={t.amortMonthsSaved||"Months Saved"} value={`${moSaved} ${t.refiMonthsSuffix||"months"}`} color={th.pos}/><CalcRow label={t.amortInterestSaved||"Interest Saved"} value={fmt(intSaved)} color={th.pos} big/></>}</div><AmortTablePaginated data={amTable}/></div>}
{tab==="projection"&&<div><Row2><Field label={t.epCurrentHomeValue||"Current Home Value ($)"}><MaskedNumInp style={INP} value={ep.homeValue} onChange={uep("homeValue")} onKeyDown={bE}/></Field><Field label={t.epAnnualApprec||"Annual Appreciation (%)"}><MaskedNumInp style={INP} value={ep.appRate} onChange={uep("appRate")} onKeyDown={bE} step="0.1"/></Field></Row2><Row2><Field label={t.epMortgageBalance||"Mortgage Balance ($)"}><MaskedNumInp style={INP} value={ep.mortgageBal} onChange={uep("mortgageBal")} onKeyDown={bE}/></Field><Field label={t.epMonthlyPI||"Monthly P&I ($)"}><MaskedNumInp style={INP} value={ep.monthlyPayment} onChange={uep("monthlyPayment")} onKeyDown={bE}/></Field></Row2><Row2><Field label={t.epMortgageAPR||"Mortgage APR (%)"}><MaskedNumInp style={INP} value={ep.mortgageApr} onChange={uep("mortgageApr")} onKeyDown={bE} step="0.1"/></Field><Field label={t.epYearsToProject||"Years to Project"}><MaskedNumInp style={INP} value={ep.years} onChange={uep("years")} onKeyDown={bE} min={1} max={30}/></Field></Row2><ResponsiveContainer width="100%" height={160} style={{outline:"none",marginBottom:12}}><AreaChart data={epData} margin={{top:10,right:0,left:0,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke={th.cardBorder}/><XAxis dataKey="yr" tick={{fontSize:9,fill:th.dim}} axisLine={false} tickLine={false} label={{value:"Year",position:"insideBottom",offset:-2,fontSize:9,fill:th.dim}}/><YAxis hide/><ReTip contentStyle={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:8,fontSize:11}} formatter={v=>fmt(v)}/><Area type="monotone" dataKey="val" name="Value" stroke={th.blue} fill={th.blue+"22"} strokeWidth={2}/><Area type="monotone" dataKey="eq" name="Equity" stroke={th.pos} fill={th.pos+"33"} strokeWidth={2}/><Area type="monotone" dataKey="bal" name="Balance" stroke={th.neg} fill={th.neg+"11"} strokeWidth={1}/></AreaChart></ResponsiveContainer><EquityTablePaginated data={epData}/></div>}
</div>;}
// 2025 tax brackets from the Excel file
const TAX_BRACKETS={
  single:[[0,11925,0.10],[11925,48475,0.12],[48475,103350,0.22],[103350,197300,0.24],[197300,250525,0.32],[250525,626350,0.35],[626350,Infinity,0.37]],
  mfj:[[0,23850,0.10],[23850,96950,0.12],[96950,206700,0.22],[206700,394600,0.24],[394600,501050,0.32],[501050,751600,0.35],[751600,Infinity,0.37]],
  hoh:[[0,15700,0.10],[15700,63100,0.12],[63100,100650,0.22],[100650,191150,0.24],[191150,244850,0.32],[244850,609350,0.35],[609350,Infinity,0.37]]
};
const STD_DED={single:15750,mfj:31500,hoh:23625};
const calcFedTax=(taxable,filing)=>{if(taxable<=0)return 0;const br=TAX_BRACKETS[filing];let tax=0;for(const[lo,hi,rate]of br){if(taxable>lo){tax+=(Math.min(taxable,hi)-lo)*rate;}else break;}return tax;};
const getBracket=(taxable,filing)=>{const br=TAX_BRACKETS[filing];for(const[lo,hi,rate]of br){if(taxable>lo&&taxable<=hi)return rate;}return 0.37;};

function IncomeCalc({t}){const th=useTh();
  const[f,setF]=useState({filing:"single",age65:false,blind:false,spouseAge65:false,spouseBlind:false,stateRate:0,pHourly:25,pHours:40,pOTHours:0,pOTMult:1.5,pWeeks:52,pSalary:0,sHourly:0,sHours:0,sOTHours:0,sOTMult:1.5,sWeeks:52,sSalary:0,bonusOnce:0,bonusRecurring:0,bonusPeriods:0,otherIncome:0,retirePct:0,retireFixed:0,hsa:0,healthPremium:0,postTax:0,paychecks:26});
  const u=k=>e=>setF(p=>({...p,[k]:typeof p[k]==="boolean"?e.target.checked:(+e.target.value||0)}));
  const us=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const INP=mINP(th);
  // Primary wages
  const pWage=f.pSalary>0?f.pSalary:(f.pHourly*f.pHours*f.pWeeks+f.pHourly*f.pOTMult*f.pOTHours*f.pWeeks);
  const sWage=f.sSalary>0?f.sSalary:(f.sHourly*f.sHours*f.sWeeks+f.sHourly*f.sOTMult*f.sOTHours*f.sWeeks);
  const totalBonus=f.bonusOnce+f.bonusRecurring*f.bonusPeriods;
  const gross=pWage+sWage+totalBonus+f.otherIncome;
  const preTax=gross*(f.retirePct/100)+f.retireFixed+f.hsa+f.healthPremium*12;
  const agiProxy=gross-preTax;
  // Extra standard deduction (65+/blind)
  let extraStd=0;
  if(f.age65)extraStd+=(f.filing==="single"||f.filing==="hoh")?2000:1600;
  if(f.blind)extraStd+=(f.filing==="single"||f.filing==="hoh")?2000:1600;
  if(f.filing==="mfj"){if(f.spouseAge65)extraStd+=1600;if(f.spouseBlind)extraStd+=1600;}
  // Senior bonus deduction (2025-2028)
  let seniorBonus=0;
  if(f.age65){const maxBonus=f.filing==="mfj"?12000:6000;const phaseStart=f.filing==="mfj"?150000:75000;if(agiProxy<=phaseStart)seniorBonus=maxBonus;else if(agiProxy<phaseStart+100000)seniorBonus=maxBonus*(1-(agiProxy-phaseStart)/100000);}
  const stdDed=STD_DED[f.filing]+extraStd+seniorBonus;
  const taxable=Math.max(0,agiProxy-stdDed);
  const fedTax=calcFedTax(taxable,f.filing);
  const bracket=getBracket(taxable,f.filing);
  const stateTax=agiProxy*(f.stateRate/100);
  const ssWageBase=176100;const ssTax=Math.min(gross,ssWageBase)*0.062;
  const medicareTax=gross*0.0145;
  const addMedThreshold=f.filing==="mfj"?250000:200000;
  const addMedTax=Math.max(0,gross-addMedThreshold)*0.009;
  const totalTax=fedTax+stateTax+ssTax+medicareTax+addMedTax;
  const netAnnual=gross-preTax-totalTax-f.postTax;
  const grossPerCheck=gross/f.paychecks;const netPerCheck=netAnnual/f.paychecks;
  return<div>
  <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>{t.incomeFilingPersonal||"📋 FILING & PERSONAL"}</div>
  <Row2><Field label={t.filingStatusLbl||"Filing Status"}><select style={INP} value={f.filing} onChange={us("filing")}><option value="single">{t.singleLbl||"Single"}</option><option value="mfj">{t.marriedJointly||"Married Filing Jointly"}</option><option value="hoh">{t.headOfHousehold||"Head of Household"}</option></select></Field><Field label={t.fldStateFlatTax||"State Flat Tax Rate (%)"}><MaskedNumInp style={INP} value={f.stateRate} onChange={u("stateRate")} min={0} max={15}/></Field></Row2>
  <Row2><Field label={t.incomeAge65||"Age 65+?"}><label style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:th.muted,padding:"6px 0"}}><input type="checkbox" checked={f.age65} onChange={u("age65")}/>{t.incomeYes||"Yes"}</label></Field><Field label={t.incomeBlind||"Blind?"}><label style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:th.muted,padding:"6px 0"}}><input type="checkbox" checked={f.blind} onChange={u("blind")}/>{t.incomeYes||"Yes"}</label></Field></Row2>
  {f.filing==="mfj"&&<Row2><Field label={t.incomeSpouseAge65||"Spouse Age 65+?"}><label style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:th.muted,padding:"6px 0"}}><input type="checkbox" checked={f.spouseAge65} onChange={u("spouseAge65")}/>{t.incomeYes||"Yes"}</label></Field><Field label={t.incomeSpouseBlind||"Spouse Blind?"}><label style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:th.muted,padding:"6px 0"}}><input type="checkbox" checked={f.spouseBlind} onChange={u("spouseBlind")}/>{t.incomeYes||"Yes"}</label></Field></Row2>}

  <div style={{height:1,background:th.cardBorder,margin:"14px 0"}}/>
  <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>💼 {t.primaryJob||"PRIMARY JOB"}</div>
  <Row2><Field label={t.hourlyRate||"Hourly Rate ($)"}><MaskedNumInp style={INP} value={f.pHourly} onChange={u("pHourly")}/></Field><Field label={t.fldHoursWeek||"Hours/Week"}><MaskedNumInp style={INP} value={f.pHours} onChange={u("pHours")} max={168}/></Field></Row2>
  <Row2><Field label={t.fldOtHours||"OT Hours/Week"}><MaskedNumInp style={INP} value={f.pOTHours} onChange={u("pOTHours")}/></Field><Field label={t.fldOtMult||"OT Multiplier"}><MaskedNumInp style={INP} value={f.pOTMult} onChange={u("pOTMult")} step="0.1"/></Field></Row2>
  <Row2><Field label={t.fldWeeksYear||"Weeks/Year"}><MaskedNumInp style={INP} value={f.pWeeks} onChange={u("pWeeks")} max={52}/></Field><Field label={t.fldAnnualSalaryOverride||"Annual Salary ($) (overrides hourly)"}><MaskedNumInp style={INP} value={f.pSalary} onChange={u("pSalary")}/></Field></Row2>

  <div style={{height:1,background:th.cardBorder,margin:"14px 0"}}/>
  <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>💼 {t.secondJob||"SECOND JOB"}</div>
  <Row2><Field label={t.hourlyRate||"Hourly Rate ($)"}><MaskedNumInp style={INP} value={f.sHourly} onChange={u("sHourly")}/></Field><Field label={t.fldHoursWeek||"Hours/Week"}><MaskedNumInp style={INP} value={f.sHours} onChange={u("sHours")} max={168}/></Field></Row2>
  <Row2><Field label={t.fldOtHours||"OT Hours/Week"}><MaskedNumInp style={INP} value={f.sOTHours} onChange={u("sOTHours")}/></Field><Field label={t.fldAnnualSalary||"Annual Salary ($)"}><MaskedNumInp style={INP} value={f.sSalary} onChange={u("sSalary")}/></Field></Row2>

  <div style={{height:1,background:th.cardBorder,margin:"14px 0"}}/>
  <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>{t.incomeBonusesOther||"💰 BONUSES & OTHER INCOME"}</div>
  <Row2><Field label={t.fldOneTimeBonus||"One-time Bonus ($)"}><MaskedNumInp style={INP} value={f.bonusOnce} onChange={u("bonusOnce")}/></Field><Field label={t.fldRecBonus||"Recurring Bonus ($)"}><MaskedNumInp style={INP} value={f.bonusRecurring} onChange={u("bonusRecurring")}/></Field></Row2>
  <Row2><Field label={t.fldBonusPeriods||"Bonus Periods/Yr"}><MaskedNumInp style={INP} value={f.bonusPeriods} onChange={u("bonusPeriods")} max={52}/></Field><Field label={t.fldOtherIncome||"Other Income/Yr ($)"}><MaskedNumInp style={INP} value={f.otherIncome} onChange={u("otherIncome")}/></Field></Row2>

  <div style={{height:1,background:th.cardBorder,margin:"14px 0"}}/>
  <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>📉 {t.preTaxDeductions||"PRE-TAX DEDUCTIONS"}</div>
  <Row2><Field label={t.fldRetGross||"Retirement % of gross"}><MaskedNumInp style={INP} value={f.retirePct} onChange={u("retirePct")} max={100} step="0.5"/></Field><Field label={t.fldRetFixed||"Retirement Fixed/Yr ($)"}><MaskedNumInp style={INP} value={f.retireFixed} onChange={u("retireFixed")}/></Field></Row2>
  <Row2><Field label={t.fldHsaFsa||"HSA/FSA/Yr ($)"}><MaskedNumInp style={INP} value={f.hsa} onChange={u("hsa")}/></Field><Field label={t.fldHealthPrem||"Health Premium/Mo ($)"}><MaskedNumInp style={INP} value={f.healthPremium} onChange={u("healthPremium")}/></Field></Row2>
  <Row2><Field label={t.fldPostTaxDed||"Post-tax Deductions/Yr ($)"}><MaskedNumInp style={INP} value={f.postTax} onChange={u("postTax")}/></Field><Field label={t.fldPaychecksYr||"Paychecks/Year"}><MaskedNumInp style={INP} value={f.paychecks} onChange={u("paychecks")} min={1} max={52}/></Field></Row2>

  <div style={{...mCARD(th),padding:16,marginTop:16,background:th.pos+"08",border:`1px solid ${th.pos}33`}}>
    <div style={{fontSize:12,fontWeight:700,color:th.accent,marginBottom:10}}>{t.incomeSummaryHdr||"📊 SUMMARY"}</div>
    <CalcRow label={t.incomeGrossAnnual||"Gross Income (annual)"} value={fmt(gross)} color={th.muted}/>
    <CalcRow label={t.incomePreTaxDeds||"Pre-tax Deductions"} value={fmt(preTax)} color={th.warn}/>
    <CalcRow label={t.incomeAGIProxy||"AGI (proxy)"} value={fmt(agiProxy)} color={th.muted}/>
    <CalcRow label={t.incomeTotalDeds||"Total Deductions"} value={fmt(stdDed)} color={th.muted}/>
    <CalcRow label={t.incomeTaxableIncome||"Taxable Income"} value={fmt(taxable)} color={th.accent}/>
    <CalcRow label={`${(t.incomeTaxBracket||"Tax Bracket")} (${(bracket*100).toFixed(0)}%)`} value={fmt(fedTax)} color={th.neg}/>
    <CalcRow label={t.incomeStateTax||"State Tax"} value={fmt(stateTax)} color={th.neg}/>
    <CalcRow label={t.incomeSocialSec||"Social Security"} value={fmt(ssTax)} color={th.neg}/>
    <CalcRow label={t.incomeMedicare||"Medicare"} value={fmt(medicareTax)} color={th.neg}/>
    {addMedTax>0&&<CalcRow label={t.incomeAddlMedicare||"Addl Medicare"} value={fmt(addMedTax)} color={th.neg}/>}
    <CalcRow label={t.incomeTotalTaxes||"Total Taxes"} value={fmt(totalTax)} color={th.neg}/>
    <CalcRow label={t.incomeNetAnnual||"Net Income (annual)"} value={fmt(netAnnual)} color={th.pos} big/>
    <CalcRow label={t.incomeGrossPerCheck||"Gross/Paycheck"} value={fmt(grossPerCheck)} color={th.muted}/>
    <CalcRow label={t.incomeNetPerCheck||"Net/Paycheck"} value={fmt(netPerCheck)} color={th.pos}/>
  </div>
  </div>;}
function DebtReductionCalc({t}){const th=useTh();const[mode,setMode]=useState("payoff");const[feeMode,setFeeMode]=useState("pct");const[f,setF]=useState({balance:5000,apr:28,payment:200,loanApr:12,loanTerm:36,origFee:2,origFlat:100});const u=k=>e=>setF(p=>({...p,[k]:+e.target.value||0}));const ccMonths=payM(f.balance,f.apr,f.payment);const ccTotal=ccMonths?(f.payment*ccMonths):null;const origCost=feeMode==="pct"?f.balance*(f.origFee/100):f.origFlat;const loanAmt=f.balance+origCost;const loanPayment=mthPmt(loanAmt,f.loanApr/100,f.loanTerm);const loanTotal=loanPayment*f.loanTerm;const savings=ccTotal?ccTotal-loanTotal:null;const INP=mINP(th);return<div><div style={{display:"flex",gap:8,marginBottom:16}}>{[["payoff","📉 "+(t.payoff||"Payoff")],["compare","⚖️ "+(t.ccVsLoan||"CC vs Loan")]].map(([v,l])=><button key={v} onClick={()=>setMode(v)} style={{fontSize:12,padding:"6px 14px",borderRadius:8,cursor:"pointer",background:mode===v?th.accent+"22":"transparent",color:mode===v?th.accent:th.muted,border:`1px solid ${mode===v?th.accent:th.cardBorder}`}}>{l}</button>)}</div><Row2><Field label={(t.cardBalance||"Card Balance")+" ($)"}><MaskedNumInp style={INP} value={f.balance} onChange={u("balance")} onKeyDown={bE}/></Field><Field label={(t.cardAPR||"Card APR")+" (%)"}><MaskedNumInp style={INP} value={f.apr} onChange={u("apr")} onKeyDown={bE} step="0.1"/></Field></Row2><Field label={(t.monthlyPaymentLbl||"Monthly Payment")+" ($)"}><MaskedNumInp style={INP} value={f.payment} onChange={u("payment")} onKeyDown={bE}/></Field>{mode==="compare"&&<><div style={{height:1,background:th.cardBorder,margin:"12px 0"}}/><Row2><Field label={(t.loanAPRLbl||"Loan APR")+" (%)"}><MaskedNumInp style={INP} value={f.loanApr} onChange={u("loanApr")} onKeyDown={bE} step="0.1"/></Field><Field label={t.loanTermMo||"Loan Term (months)"}><MaskedNumInp style={INP} value={f.loanTerm} onChange={u("loanTerm")} onKeyDown={bE}/></Field></Row2><div style={{...mCARD(th),padding:12,marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontSize:12,color:th.muted}}>{t.origFeeLbl||"Origination Fee"}</span><div style={{display:"flex",gap:6}}>{[["pct","% of Balance"],["flat","Flat ($)"]].map(([v,l])=><button key={v} onClick={()=>setFeeMode(v)} style={{fontSize:11,padding:"3px 10px",borderRadius:6,cursor:"pointer",background:feeMode===v?th.accent+"22":"transparent",color:feeMode===v?th.accent:th.muted,border:`1px solid ${feeMode===v?th.accent:th.cardBorder}`}}>{l}</button>)}</div></div>{feeMode==="pct"?<Row2><Field label={t.feePct||"Fee %"}><MaskedNumInp style={INP} value={f.origFee} onChange={u("origFee")} onKeyDown={bE} step="0.1"/></Field><Field label={t.feeAmt||"Fee Amount"}><div style={{...mINP(th),opacity:0.6}}>{fmt(origCost)}</div></Field></Row2>:<Row2><Field label={t.flatFee||"Flat Fee ($)"}><MaskedNumInp style={INP} value={f.origFlat} onChange={u("origFlat")} onKeyDown={bE}/></Field><Field label={t.pctOfBalance||"% of Balance"}><div style={{...mINP(th),opacity:0.6}}>{((origCost/Math.max(1,f.balance))*100).toFixed(2)}%</div></Field></Row2>}</div></>}<div style={{...mCARD(th),padding:16,marginTop:8}}>{mode==="payoff"?<><CalcRow label={t.payoffTimeLbl||"Payoff Time"} value={payL(ccMonths)} color={th.accent} big/><CalcRow label={t.totalPaidLbl||"Total Paid"} value={ccTotal?fmt(ccTotal):"—"} color={th.muted}/><CalcRow label={t.totalInterest||"Total Interest"} value={ccTotal?fmt(ccTotal-f.balance):"—"} color={th.neg}/></>:<><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}><div style={{...mCARD(th),padding:12,background:th.neg+"11"}}><div style={{fontSize:11,fontWeight:700,color:th.neg,marginBottom:6}}>💳 {t.creditCard||"Credit Card"}</div><CalcRow label={t.payoff||"Payoff"} value={payL(ccMonths)}/><CalcRow label={t.totalLbl||"Total"} value={ccTotal?fmt(ccTotal):"—"} color={th.neg}/></div><div style={{...mCARD(th),padding:12,background:th.pos+"11"}}><div style={{fontSize:11,fontWeight:700,color:th.pos,marginBottom:6}}>🏦 {t.personalLoan||"Personal Loan"}</div><CalcRow label={t.monthly2||"Monthly"} value={fmtD(loanPayment)}/><CalcRow label={t.totalLbl||"Total"} value={fmt(loanTotal)} color={th.pos}/></div></div>{savings!==null&&<CalcRow label={"💰 "+t.savings3} value={fmt(Math.abs(savings))+" "+(savings>0?"saved with loan":"saved with CC")} color={savings>0?th.pos:th.neg} big/>}</>}</div></div>;}
function CarLoanCalc({t}){const th=useTh();
  const[f,setF]=useState({price:30000,down:5000,tradeIn:0,tradeInPayoff:0,salesTaxPct:7,dealerFee:899,docFee:299,titleTag:450,gapIns:600,extWarranty:0,apr:6.9,term:60,rebate:0});
  const u=k=>e=>setF(p=>({...p,[k]:+e.target.value||0}));
  const INP=mINP(th);
  const taxableBase=f.price-f.tradeIn-f.rebate; // tax is on price minus trade-in credit (FL rule)
  const salesTax=Math.max(0,taxableBase)*(f.salesTaxPct/100);
  const fees=f.dealerFee+f.docFee+f.titleTag+f.gapIns+f.extWarranty;
  const totalPrice=f.price+salesTax+fees-f.rebate;
  const amountFinanced=Math.max(0,totalPrice-f.down-f.tradeIn+f.tradeInPayoff);
  const mp=amountFinanced>0?mthPmt(amountFinanced,f.apr/100,f.term):0;
  const total=mp*f.term;
  const totalInt=total-amountFinanced;
  return<div>
  <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>{t.carVehicleHdr||"🚗 VEHICLE"}</div>
  <Row2><Field label={t.fldVehiclePrice||"Vehicle Price ($)"}><MaskedNumInp style={INP} value={f.price} onChange={u("price")}/></Field><Field label={t.fldRebate||"Manufacturer Rebate ($)"}><MaskedNumInp style={INP} value={f.rebate} onChange={u("rebate")}/></Field></Row2>
  <Row2><Field label={t.fldTradeInValue||"Trade-In Value ($)"}><MaskedNumInp style={INP} value={f.tradeIn} onChange={u("tradeIn")}/></Field><Field label={t.fldTradeInPayoff||"Trade-In Payoff ($)"}><MaskedNumInp style={INP} value={f.tradeInPayoff} onChange={u("tradeInPayoff")}/></Field></Row2>

  <div style={{height:1,background:th.cardBorder,margin:"14px 0"}}/>
  <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>{t.carFeesTaxesHdr||"💵 FEES & TAXES"}</div>
  <Row2><Field label={t.fldSalesTaxRate||"Sales Tax Rate (%)"}><MaskedNumInp style={INP} value={f.salesTaxPct} onChange={u("salesTaxPct")} step="0.01"/></Field><Field label={t.fldTitleTag||"Title & Tag ($)"}><MaskedNumInp style={INP} value={f.titleTag} onChange={u("titleTag")}/></Field></Row2>
  <Row2><Field label={t.fldDealerFee||"Dealer Fee ($)"}><MaskedNumInp style={INP} value={f.dealerFee} onChange={u("dealerFee")}/></Field><Field label={t.fldDocFee||"Doc Fee ($)"}><MaskedNumInp style={INP} value={f.docFee} onChange={u("docFee")}/></Field></Row2>
  <Row2><Field label={t.fldGapIns||"GAP Insurance ($)"}><MaskedNumInp style={INP} value={f.gapIns} onChange={u("gapIns")}/></Field><Field label={t.fldExtWarranty||"Ext Warranty ($)"}><MaskedNumInp style={INP} value={f.extWarranty} onChange={u("extWarranty")}/></Field></Row2>

  <div style={{height:1,background:th.cardBorder,margin:"14px 0"}}/>
  <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>{t.carFinancingHdr||"💳 FINANCING"}</div>
  <Row2><Field label={t.carDownPayLbl||"Down Payment ($)"}><MaskedNumInp style={INP} value={f.down} onChange={u("down")}/></Field><Field label={t.carAPRLbl||"APR (%)"}><MaskedNumInp style={INP} value={f.apr} onChange={u("apr")} step="0.1"/></Field></Row2>
  <Field label={`${t.carTermLbl||"Term"}: ${f.term} ${t.carMonthsLbl||"months"}`}><input type="range" min={12} max={84} step={6} value={f.term} onChange={u("term")} style={{width:"100%",accentColor:th.accent,cursor:"pointer"}}/><div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:th.dim,marginTop:2}}><span>12</span><span>36</span><span>60</span><span>84 {t.carMonthsLbl||"mo"}</span></div></Field>

  <div style={{...mCARD(th),padding:16,marginTop:12}}>
    <CalcRow label={t.carVehiclePriceRow||"Vehicle Price"} value={fmt(f.price)} color={th.muted}/>
    <CalcRow label={t.carSalesTaxRow||"Sales Tax"} value={fmt(salesTax)} color={th.neg}/>
    <CalcRow label={t.carFeesRow||"Fees"} value={fmt(fees)} color={th.neg}/>
    <CalcRow label={t.carTotalPriceRow||"Total Price"} value={fmt(totalPrice)} color={th.warn}/>
    <CalcRow label={t.carAmountFinancedRow||"Amount Financed"} value={fmt(amountFinanced)} color={th.accent} big/>
    <CalcRow label={t.carMonthlyPaymentRow||"Monthly Payment"} value={fmt(mp)} color={th.accent} big/>
    <CalcRow label={t.carTotalInterestRow||"Total Interest"} value={fmt(totalInt)} color={th.neg}/>
    <CalcRow label={t.carTotalCostLoanRow||"Total Cost of Loan"} value={fmt(total)} color={th.muted}/>
  </div></div>;}
function AffordabilityCalc({t}){const th=useTh();
  const[f,setF]=useState({grossIncome:6000,existingDebt:500,dti:43,apr:7.0,term:30,taxRate:1.2,insurance:150,hoa:0});
  const[downMode,setDownMode]=useState("pct");
  const[downPct,setDownPct]=useState(20);const[downDollar,setDownDollar]=useState(80000);
  const u=k=>e=>setF(p=>({...p,[k]:+e.target.value||0}));
  const INP=mINP(th);
  const[showHelp,setShowHelp]=useState(false);
  // DTI-based max total monthly housing (PITI + other debt): grossIncome * dti% - existingDebt
  const maxTotalPayment=Math.max(0,f.grossIncome*(f.dti/100)-f.existingDebt);
  // Subtract property tax + insurance + HOA estimate (iterative: assume target price first)
  const r=f.apr/100/12;const n=f.term*12;
  // Start with no tax/ins, calculate initial price, then refine
  let estPrice=200000;for(let i=0;i<5;i++){const monthlyTax=estPrice*(f.taxRate/100)/12;const piti=maxTotalPayment-monthlyTax-f.insurance-f.hoa;if(piti<=0){estPrice=0;break;}const loan=r>0?piti*((Math.pow(1+r,n)-1)/(r*Math.pow(1+r,n))):piti*n;const dp=downMode==="pct"?downPct/100:(downDollar/estPrice||0.2);estPrice=loan/(1-dp);}
  const maxPrice=Math.max(0,estPrice);
  const actualDown=downMode==="pct"?maxPrice*(downPct/100):downDollar;
  const actualPct=maxPrice>0?(actualDown/maxPrice)*100:0;
  const loanAmt=Math.max(0,maxPrice-actualDown);
  const principalInt=loanAmt>0?mthPmt(loanAmt,f.apr/100,n):0;
  const monthlyTax=maxPrice*(f.taxRate/100)/12;
  const totalPITI=principalInt+monthlyTax+f.insurance+f.hoa;
  return<div>
  <div style={{...mCARD(th),padding:"10px 14px",marginBottom:14,background:th.accent+"08",border:`1px solid ${th.accent}33`}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setShowHelp(s=>!s)}>
      <span style={{fontSize:12,fontWeight:700,color:th.accent}}>{t.affordAbbrGlossary||"📖 Abbreviations Glossary"} {showHelp?"▲":"▼"}</span>
    </div>
    {showHelp&&<div style={{fontSize:11,color:th.muted,marginTop:10,lineHeight:1.7}}>
      <div><b style={{color:th.accent}}>{t.affordGlossaryDTI||"DTI (Debt-to-Income):"}</b> {t.affordGlossaryDTIDesc||"% of gross monthly income that goes to debt payments. Lenders typically cap at 43% (qualified mortgage rule). Conservative: 28-36%."}</div>
      <div><b style={{color:th.accent}}>{t.affordGlossaryPITI||"PITI:"}</b> {t.affordGlossaryPITIDesc||"Principal + Interest + Taxes + Insurance — the four parts of a total monthly mortgage payment. Lenders use this for affordability calcs."}</div>
      <div><b style={{color:th.accent}}>{t.glossaryPI||"P&I (Principal & Interest):"}</b> {t.glossaryPIDesc||"The core loan payment — does not include taxes/insurance/HOA."}</div>
      <div><b style={{color:th.accent}}>{t.affordGlossaryHOA||"HOA:"}</b> {t.affordGlossaryHOADesc||"Homeowners Association fees — monthly/quarterly dues for condos, townhomes, or planned communities."}</div>
      <div><b style={{color:th.accent}}>{t.affordGlossaryDP||"Down Payment:"}</b> {t.affordGlossaryDPDesc||"Cash paid upfront. 20%+ avoids PMI (Private Mortgage Insurance). FHA allows as low as 3.5%."}</div>
    </div>}
  </div>
  <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>{t.affordIncomeDebtHdr||"💰 INCOME & DEBT"}</div>
  <Row2><Field label={t.fldGrossMoIncome||"Gross Monthly Income ($)"}><MaskedNumInp style={INP} value={f.grossIncome} onChange={u("grossIncome")}/></Field><Field label={t.fldExistingMoDebt||"Existing Monthly Debt ($)"}><MaskedNumInp style={INP} value={f.existingDebt} onChange={u("existingDebt")}/></Field></Row2>
  <Field label={`${t.affordMaxDTI||"Max DTI"}: ${f.dti}%`}><input type="range" min={28} max={50} step={1} value={f.dti} onChange={u("dti")} style={{width:"100%",accentColor:th.accent,cursor:"pointer"}}/><div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:th.dim}}><span>28% ({t.affordConservative||"conservative"})</span><span>43% ({t.affordTypical||"typical"})</span><span>50% ({t.affordAggressive||"aggressive"})</span></div></Field>

  <div style={{height:1,background:th.cardBorder,margin:"14px 0"}}/>
  <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>{t.affordLoanCostsHdr||"🏠 LOAN & COSTS"}</div>
  <Row2><Field label={t.affordAPRLbl||"APR (%)"}><MaskedNumInp style={INP} value={f.apr} onChange={u("apr")} step="0.1"/></Field><Field label={t.affordTermLbl||"Term (years)"}><MaskedNumInp style={INP} value={f.term} onChange={u("term")} min={10} max={30}/></Field></Row2>
  <Row2><Field label={t.fldPropTaxRate||"Property Tax Rate (%/yr)"}><MaskedNumInp style={INP} value={f.taxRate} onChange={u("taxRate")} step="0.1"/></Field><Field label={t.fldInsMo||"Insurance ($/mo)"}><MaskedNumInp style={INP} value={f.insurance} onChange={u("insurance")}/></Field></Row2>
  <Field label={t.affordHOAMo||"HOA ($/mo)"}><MaskedNumInp style={INP} value={f.hoa} onChange={u("hoa")}/></Field>

  <div style={{height:1,background:th.cardBorder,margin:"14px 0"}}/>
  <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>{t.affordDownPaymentHdr||"💵 DOWN PAYMENT"}</div>
  <div style={{display:"flex",gap:6,marginBottom:10}}>{[["pct","%"],["dollar","$"]].map(([v,l])=><button key={v} onClick={()=>setDownMode(v)} style={{fontSize:11,padding:"5px 14px",borderRadius:8,cursor:"pointer",background:downMode===v?th.accent+"22":"transparent",color:downMode===v?th.accent:th.muted,border:`1px solid ${downMode===v?th.accent:th.cardBorder}`,fontWeight:downMode===v?700:400}}>{l}</button>)}</div>
  {downMode==="pct"?<Field label={`${t.affordDownPayment||"Down Payment"}: ${downPct}%`}><input type="range" min={0} max={50} step={1} value={downPct} onChange={e=>setDownPct(+e.target.value)} style={{width:"100%",accentColor:th.accent,cursor:"pointer"}}/><div style={{fontSize:11,color:th.muted,marginTop:4}}>≈ {fmt(actualDown)}</div></Field>:<Field label={t.affordDownPaymentDollar||"Down Payment ($)"}><MaskedNumInp style={INP} value={downDollar} onChange={e=>setDownDollar(+e.target.value||0)}/><div style={{fontSize:11,color:th.muted,marginTop:4}}>≈ {actualPct.toFixed(1)}% {t.affordHomePricePct||"of home price"}</div></Field>}

  <div style={{...mCARD(th),padding:16,marginTop:12,background:th.pos+"08",border:`1px solid ${th.pos}33`}}>
    <CalcRow label={t.affordMaxHousing||"Max Total Housing Payment"} value={fmt(maxTotalPayment)} color={th.accent}/>
    <CalcRow label={t.affordMaxHomePrice||"Max Home Price"} value={fmt(maxPrice)} color={th.pos} big/>
    <CalcRow label={t.affordDownPayment||"Down Payment"} value={fmt(actualDown)} color={th.warn}/>
    <CalcRow label={t.affordLoanAmt||"Loan Amount"} value={fmt(loanAmt)} color={th.muted}/>
    <CalcRow label={t.affordMonthlyPI||"Monthly P&I"} value={fmt(principalInt)} color={th.muted}/>
    <CalcRow label={t.affordMonthlyTax||"Monthly Tax"} value={fmt(monthlyTax)} color={th.muted}/>
    <CalcRow label={t.affordMonthlyIns||"Monthly Insurance"} value={fmt(f.insurance)} color={th.muted}/>
    {f.hoa>0&&<CalcRow label={t.affordMonthlyHOA||"Monthly HOA"} value={fmt(f.hoa)} color={th.muted}/>}
    <CalcRow label={t.affordTotalPITI||"Total PITI"} value={fmt(totalPITI)} color={th.accent}/>
  </div></div>;}
function InterestCalc({t}){const th=useTh();const[f,setF]=useState({principal:10000,rate:5,years:5,type:"compound",freq:12});const u=k=>e=>setF(p=>({...p,[k]:e.target.value}));const r=f.rate/100;const interest=f.type==="simple"?f.principal*r*f.years:f.principal*(Math.pow(1+r/f.freq,f.freq*f.years)-1);const total=f.principal+interest;const INP=mINP(th);return<div><Row2><Field label={t.principalLbl||"Principal ($)"}><MaskedNumInp style={INP} value={f.principal} onChange={u("principal")} onKeyDown={bE}/></Field><Field label={t.interestRateLbl||"Interest Rate (%)"}><MaskedNumInp style={INP} value={f.rate} onChange={u("rate")} onKeyDown={bE} step="0.1"/></Field></Row2><Row2><Field label={t.termYearsLbl||"Term (years)"}><MaskedNumInp style={INP} value={f.years} onChange={u("years")} onKeyDown={bE} min={1}/></Field><Field label={t.type||"Type"}><select style={INP} value={f.type} onChange={u("type")}><option value="compound">{t.compoundLbl||"Compound"}</option><option value="simple">{t.simpleLbl||"Simple"}</option></select></Field></Row2>{f.type==="compound"&&<Field label={t.compoundFreq||"Compound Frequency"}><select style={INP} value={f.freq} onChange={u("freq")}><option value={12}>{t.monthly2||"Monthly"}</option><option value={4}>{t.quarterly||"Quarterly"}</option><option value={1}>{t.annual||"Annual"}</option></select></Field>}<div style={{...mCARD(th),padding:16,marginTop:8}}><CalcRow label={t.interestEarned||"Interest Earned"} value={fmt(interest)} color={th.pos} big/><CalcRow label={t.totalAmount||"Total Amount"} value={fmt(total)} color={th.accent}/></div></div>;}
function SavingsCalc({t}){const th=useTh();const[f,setF]=useState({initial:1000,monthly:200,apy:4.5,years:10});const u=k=>e=>setF(p=>({...p,[k]:+e.target.value||0}));const r=f.apy/100/12;const n3=f.years*12;const fv=f.initial*Math.pow(1+r,n3)+(f.monthly>0?f.monthly*((Math.pow(1+r,n3)-1)/r):0);const contrib=f.initial+f.monthly*n3;const data3=[1,2,3,4,5,6,7,8,9,10].filter(y=>y<=f.years).map(y=>{const n2=y*12;const v=f.initial*Math.pow(1+r,n2)+(f.monthly>0?f.monthly*((Math.pow(1+r,n2)-1)/r):0);return{year:"Yr "+y,value:Math.round(v),contrib:Math.round(f.initial+f.monthly*n2)};});const INP=mINP(th);return<div><Row2><Field label={t.initialDeposit||"Initial Deposit ($)"}><MaskedNumInp style={INP} value={f.initial} onChange={u("initial")} onKeyDown={bE}/></Field><Field label={t.monthlyDeposit||"Monthly Deposit ($)"}><MaskedNumInp style={INP} value={f.monthly} onChange={u("monthly")} onKeyDown={bE}/></Field></Row2><Row2><Field label={t.apyLbl||"APY (%)"}><MaskedNumInp style={INP} value={f.apy} onChange={u("apy")} onKeyDown={bE} step="0.1"/></Field><Field label={t.years||"Years"}><MaskedNumInp style={INP} value={f.years} onChange={u("years")} onKeyDown={bE} min={1} max={50}/></Field></Row2><div style={{...mCARD(th),padding:16,marginBottom:10}}><CalcRow label={t.futureValue||"Future Value"} value={fmt(fv)} color={th.accent} big/><CalcRow label={t.totalContrib||"Total Contributed"} value={fmt(contrib)} color={th.muted}/><CalcRow label={t.interestEarned||"Interest Earned"} value={fmt(fv-contrib)} color={th.pos}/></div><ResponsiveContainer width="100%" height={140} style={{outline:"none"}}><AreaChart data={data3} margin={{top:10,right:0,left:0,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke={th.cardBorder}/><XAxis dataKey="year" tick={{fontSize:9,fill:th.dim}} axisLine={false} tickLine={false}/><YAxis hide/><ReTip contentStyle={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:8,fontSize:11}} formatter={v=>fmt(v)}/><Area type="monotone" dataKey="value" name="Value" stroke={th.accent} fill={th.accent+"33"} strokeWidth={2}/><Area type="monotone" dataKey="contrib" name="Contributed" stroke={th.muted} fill={th.muted+"22"} strokeWidth={1}/></AreaChart></ResponsiveContainer></div>;}
function RetirementCalc({t}){const th=useTh();const[f,setF]=useState({currentAge:30,retireAge:65,balance:25000,monthly:500,matchPct:50,matchLimit:6,salary:5000,worst:5,base:8,best:11});const u=k=>e=>setF(p=>({...p,[k]:+e.target.value||0}));const INP=mINP(th);const years=Math.max(0,f.retireAge-f.currentAge);const totalMonths=years*12;const employerMatch=Math.min(f.monthly,f.salary*(f.matchLimit/100))*(f.matchPct/100);const totalMonthly=f.monthly+employerMatch;const proj=rate=>{const r=rate/100/12;return r>0?f.balance*Math.pow(1+r,totalMonths)+totalMonthly*((Math.pow(1+r,totalMonths)-1)/r):f.balance+totalMonthly*totalMonths;};const scenarios=[{l:t.worst||"Worst",rate:f.worst,c:th.warn},{l:t.base||"Base",rate:f.base,c:th.accent},{l:t.best||"Best",rate:f.best,c:th.pos}];const totalContrib=f.balance+totalMonthly*totalMonths;const chartData=[];const step=Math.max(1,Math.round(years/10));for(let y=0;y<=years;y+=step){const m=y*12;const r_w=f.worst/100/12;const r_b=f.base/100/12;const r_g=f.best/100/12;const calc=(r,bal,mo)=>r>0?bal*Math.pow(1+r,m)+mo*((Math.pow(1+r,m)-1)/r):bal+mo*m;chartData.push({yr:"Yr "+y,worst:Math.round(calc(r_w,f.balance,totalMonthly)),base:Math.round(calc(r_b,f.balance,totalMonthly)),best:Math.round(calc(r_g,f.balance,totalMonthly))});}return<div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}><div style={{...mCARD(th),padding:14}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:10}}>👤 {(t.profile||"Profile").toUpperCase()}</div><Row2><Field label={t.currentAge||"Current Age"}><MaskedNumInp style={INP} value={f.currentAge} onChange={u("currentAge")} min={18} max={80} onKeyDown={bE}/></Field><Field label={t.retirementAge||"Retirement Age"}><MaskedNumInp style={INP} value={f.retireAge} onChange={u("retireAge")} min={40} max={80} onKeyDown={bE}/></Field></Row2><Field label={t.currentBalance||"Current Balance ($)"}><MaskedNumInp style={INP} value={f.balance} onChange={u("balance")} onKeyDown={bE}/></Field><Field label={t.monthlyContribution||"Monthly Contribution ($)"}><MaskedNumInp style={INP} value={f.monthly} onChange={u("monthly")} onKeyDown={bE}/></Field></div><div style={{...mCARD(th),padding:14}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:10}}>🏢 {(t.employerMatch||"Employer Match").toUpperCase()}</div><Field label={t.monthlyGrossSalary||"Monthly Gross Salary ($)"}><MaskedNumInp style={INP} value={f.salary} onChange={u("salary")} onKeyDown={bE}/></Field><Row2><Field label={t.matchPctOfContrib||"Match % of contrib"}><MaskedNumInp style={INP} value={f.matchPct} onChange={u("matchPct")} min={0} max={100} onKeyDown={bE}/></Field><Field label={t.upToPctOfSalary||"Up to % of salary"}><MaskedNumInp style={INP} value={f.matchLimit} onChange={u("matchLimit")} min={0} max={25} onKeyDown={bE}/></Field></Row2><div style={{...mCARD(th),padding:10,background:th.pos+"11",marginTop:8}}><div style={{fontSize:11,color:th.muted}}>{t.employerAdds||"Employer adds"}</div><div style={{fontSize:18,fontWeight:800,color:th.pos}}>{fmt(employerMatch)}/mo</div><div style={{fontSize:11,color:th.muted}}>{t.totalInvested||"Total invested"}: <b style={{color:th.pos}}>{fmt(totalMonthly)}/mo</b></div></div></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}><div style={{...mCARD(th),padding:10}}><div style={{fontSize:11,color:th.dim,marginBottom:4}}>⏱ {t.yearsToRetirement||"Years to retirement"}</div><div style={{fontSize:20,fontWeight:800,color:GOLD}}>{years} yrs</div></div><div style={{...mCARD(th),padding:10}}><div style={{fontSize:11,color:th.dim,marginBottom:4}}>💰 {t.totalContributed||"Total contributed"}</div><div style={{fontSize:16,fontWeight:800,color:th.muted}}>{fmt(totalContrib)}</div></div><div style={{...mCARD(th),padding:10}}><div style={{fontSize:11,color:th.dim,marginBottom:4}}>📅 {t.returnsOnReturns||"Returns on returns"}</div><div style={{fontSize:16,fontWeight:800,color:th.pos}}>{fmt(proj(f.base)-totalContrib)} (base)</div></div></div><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>📊 {(t.scenarios||"Scenarios — Expected Annual Return").toUpperCase()}</div><Row2><Field label={t.worstCase||"Worst Case (%)"}><MaskedNumInp style={INP} value={f.worst} onChange={u("worst")} min={1} max={15} step="0.5" onKeyDown={bE}/></Field><Field label={t.bestCase||"Best Case (%)"}><MaskedNumInp style={INP} value={f.best} onChange={u("best")} min={1} max={20} step="0.5" onKeyDown={bE}/></Field></Row2><Field label={t.baseCase||"Base Case (%)"}><MaskedNumInp style={INP} value={f.base} onChange={u("base")} min={1} max={15} step="0.5" onKeyDown={bE}/></Field><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>{scenarios.map(s=>{const bal=proj(s.rate);const mo4pct=bal*0.04/12;const growth=bal-totalContrib;return<div key={s.l} style={{...mCARD(th),padding:14,border:`2px solid ${s.c}44`,background:s.c+"08"}}><div style={{fontSize:12,fontWeight:800,color:s.c,marginBottom:8}}>{s.l} ({s.rate}%)</div><div style={{fontSize:18,fontWeight:800,color:s.c,marginBottom:4}}>{fmt(bal)}</div><div style={{fontSize:11,color:th.muted,marginBottom:2}}>{t.growthLbl||"Growth"}: <b style={{color:s.c}}>{fmt(growth)}</b></div><div style={{fontSize:11,color:th.muted,marginBottom:2}}>{t.fourPctRule||"4% rule/mo"}: <b style={{color:s.c}}>{fmt(mo4pct)}</b></div><div style={{fontSize:10,color:th.dim}}>{t.annualIncome||"Annual income"}: {fmt(bal*0.04)}</div></div>;})} </div><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>📈 {(t.growthProjection||"Growth Projection").toUpperCase()}</div><ResponsiveContainer width="100%" height={200} style={{outline:"none"}}><AreaChart data={chartData} margin={{top:10,right:4,left:4,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke={th.cardBorder}/><XAxis dataKey="yr" tick={{fontSize:9,fill:th.dim}} axisLine={false} tickLine={false}/><YAxis hide/><ReTip contentStyle={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:8,fontSize:11}} formatter={v=>fmt(v)}/><Area type="monotone" dataKey="best" name="Best" stroke={th.pos} fill={th.pos+"22"} strokeWidth={2}/><Area type="monotone" dataKey="base" name="Base" stroke={th.accent} fill={th.accent+"22"} strokeWidth={2}/><Area type="monotone" dataKey="worst" name="Worst" stroke={th.warn} fill={th.warn+"11"} strokeWidth={2}/></AreaChart></ResponsiveContainer></div>;}

function PortfolioStandaloneCalc({t}){const th=useTh();const[sel,setSel]=useState("growth");const[rates,setRates]=useState({conservative:5.5,growth:8.5,aggressive:11.0});const[monthly,setMonthly]=useState(500);const[initial,setInitial]=useState(0);const[years,setYears]=useState(10);const[showH,setShowH]=useState({});const INP=mINP(th);const port=PORTFOLIOS[sel];const ret=rates[sel]||8.5;const r=ret/100/12;const nY=years*12;const baseH=port.holdings.map(h=>({...h}));const fv=(initial>0?initial*Math.pow(1+r,nY):0)+(monthly>0?monthly*((Math.pow(1+r,nY)-1)/r):0);const contrib=initial+monthly*nY;const chartData=[];for(let y=1;y<=years;y++){const n2=y*12;const v=(initial>0?initial*Math.pow(1+r,n2):0)+(monthly>0?monthly*((Math.pow(1+r,n2)-1)/r):0);chartData.push({year:"Yr "+y,value:Math.round(v),contrib:Math.round(initial+monthly*n2)});}const saveRates=()=>{};return<div><div data-ga-grid="portfolios" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>{Object.entries(PORTFOLIOS).map(([k,p])=><div key={k} onClick={()=>setSel(k)} style={{...mCARD(th),padding:14,cursor:"pointer",background:sel===k?p.color+"22":th.card,border:`1px solid ${sel===k?p.color:th.cardBorder}`}}><div style={{fontSize:11,fontWeight:700,color:sel===k?p.color:th.muted,marginBottom:4}}>{t["capitalLabel"+p.nameKey.charAt(0).toUpperCase()+p.nameKey.slice(1)]||p.nameKey.toUpperCase()}</div><div style={{display:"flex",alignItems:"center",gap:4}}><MaskedNumInp value={rates[k]} min={0} max={30} step="0.5" onChange={e=>{e.stopPropagation();setRates(r=>({...r,[k]:+e.target.value||0}));}} onClick={e=>e.stopPropagation()} style={{...mIIN(th),width:44,textAlign:"center",fontWeight:800,fontSize:16,color:sel===k?p.color:th.dim}}/><span style={{fontSize:13,color:sel===k?p.color:th.dim}}>%</span></div><Pill color={p.color}>{p.risk} {t.riskSuffix||"Risk"}</Pill></div>)}</div><div data-ga-grid="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}><div><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>📋 {(t.holdingsHdr||"Holdings").toUpperCase()} — {t[port.nameKey]||port.nameKey}</div>{baseH.map((h,i)=>{const tm=TICKER_META[h.ticker];const dollarAmt=Math.max(0,monthly)*(h.pct/100);return<div key={h.ticker} style={{...mCARD(th),padding:"7px 12px",marginBottom:5}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><span style={{fontSize:12,fontWeight:700,color:PC[i%PC.length]}}>{h.ticker}</span><span style={{fontSize:11,color:th.muted,marginLeft:6}}>{tm?.name||h.name}</span></div><div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:700,color:PC[i%PC.length]}}>{h.pct}%</div>{dollarAmt>0&&<div style={{fontSize:10,color:th.dim,fontWeight:600}}>{fmtD(dollarAmt)}/mo</div>}</div></div>{tm?.desc&&<div style={{fontSize:10,color:th.dim,marginTop:3,fontStyle:"italic"}}>{tm.desc}</div>}</div>;})}</div><div><div style={{...mCARD(th),padding:14,marginBottom:10}}><Field label={t.initialInvestment||"Initial Investment ($)"}><MaskedNumInp style={INP} value={initial} onChange={e=>setInitial(+e.target.value||0)} onKeyDown={bE}/></Field><Field label={t.monthlyInvest+" ($)"}><MaskedNumInp style={INP} value={monthly} onChange={e=>setMonthly(+e.target.value||0)} onKeyDown={bE}/></Field><div style={{marginBottom:14}}><label style={{fontSize:11,color:th.muted,display:"block",marginBottom:5}}>{t.years||"Years"}: <b>{years}</b></label><input type="range" min={1} max={40} step={1} value={years} onChange={e=>setYears(+e.target.value)} style={{width:"100%",accentColor:th.accent,cursor:"pointer"}}/></div><div style={{...mCARD(th),padding:12}}><CalcRow label={`${t.futureValue||"Future Value"} (${years}${t.yearsAbbr||"yr"} @ ${ret}%)`} value={fmt(fv)} color={th.accent} big/><CalcRow label={t.totalContrib||"Total Contributed"} value={fmt(contrib)} color={th.muted}/><CalcRow label={t.investmentGrowth||"Investment Growth"} value={"+"+fmt(fv-contrib)} color={th.pos}/></div></div><ResponsiveContainer width="100%" height={150} style={{outline:"none"}}><AreaChart data={chartData} margin={{top:10,right:0,left:0,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke={th.cardBorder}/><XAxis dataKey="year" tick={{fontSize:9,fill:th.dim}} axisLine={false} tickLine={false}/><YAxis hide/><ReTip contentStyle={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:8,fontSize:11}} formatter={v=>fmt(v)}/><Area type="monotone" dataKey="value" name="Value" stroke={th.accent} fill={th.accent+"33"} strokeWidth={2}/><Area type="monotone" dataKey="contrib" name="Contributed" stroke={th.muted} fill={th.muted+"22"} strokeWidth={1}/></AreaChart></ResponsiveContainer></div></div></div>;}

function CalculatorsPage({t,activeCalc,onActiveChange}){const th=useTh();const[active,setActive]=useState(activeCalc||null);useEffect(()=>{const next=activeCalc||null;if(next!==active)setActive(next);},[activeCalc]);const calcs=[{id:"retirement",label:(t.calcRetirementPlanner||"🎯 Retirement Planner"),C:RetirementCalc},{id:"portfolio",label:(t.calcPortfolioCalc||"📈 Portfolio Calculator"),C:PortfolioStandaloneCalc},{id:"homeEquity",label:(t.calcHomeCalc||"🏠 Home Calculator"),C:HomeEquityCalc},{id:"income",label:(t.calcIncomeCalc||"💰 Income Calculator"),C:IncomeCalc},{id:"debtReduction",label:(t.calcDebtReduction||"📉 Debt Reduction"),C:DebtReductionCalc},{id:"carLoan",label:(t.calcCarLoan||"🚗 Car Loan"),C:CarLoanCalc},{id:"affordability",label:(t.calcAffordability||"🏡 Affordability"),C:AffordabilityCalc},{id:"interest",label:(t.calcInterestCalc||"📊 Interest Calculator"),C:InterestCalc},{id:"savings",label:(t.calcHySavings||"💎 High Yield Savings"),C:SavingsCalc}];if(active){const calc=calcs.find(c=>c.id===active);if(!calc){// v0.13.1 — URL pointed at an unknown calculator id; bounce to the picker silently
if(activeCalc)onActiveChange?.(null);return null;}const Comp=calc.C;return<div style={{padding:"24px 14px"}}><button onClick={()=>{setActive(null);onActiveChange?.(null);}} style={{fontSize:12,padding:"5px 12px",borderRadius:8,background:th.inp,color:th.muted,border:`1px solid ${th.cardBorder}`,cursor:"pointer",marginBottom:16}}>{t.back}</button><h2 style={{fontSize:16,fontWeight:800,color:th.text,marginBottom:20,marginTop:0}}>{calc.label}</h2><div style={{maxWidth:900}}><Comp t={t}/></div></div>;}return<div style={{padding:"24px 14px"}}>{/* v0.24.0 — page title removed (TopBar shows it). */}<p style={{fontSize:11,color:th.dim,marginBottom:20,marginTop:0}}>{t.financialCalcDesc||"Financial calculators for planning."}</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12}}>{calcs.map(c=><div key={c.id} onClick={()=>{setActive(c.id);onActiveChange?.(c.id);}} style={{...mCARD(th),padding:"16px 14px",cursor:"pointer",minHeight:136,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",gap:6}} onMouseEnter={e=>e.currentTarget.style.border=`1px solid ${th.accent}`} onMouseLeave={e=>e.currentTarget.style.border=`1px solid ${th.cardBorder}`}><div style={{fontSize:28,lineHeight:1}}>{c.label.split(" ")[0]}</div><div style={{fontSize:13,fontWeight:700,color:th.text,lineHeight:1.3,marginTop:4}}>{c.label.substring(c.label.indexOf(" ")+1)}</div><div style={{fontSize:10,color:th.muted,lineHeight:1.5,marginTop:4}}>{{retirement:"Retirement savings projection",portfolio:"Portfolio growth estimate",homeEquity:"Home equity & refinance",income:"Take-home pay breakdown",debtReduction:"Debt payoff strategies",carLoan:"Monthly payments & interest",affordability:"Home affordability estimate",interest:"Compound interest",savings:"HY savings growth"}[c.id]||""}</div></div>)}</div></div>;}

const expBackup=(clients,settings)=>{const data=JSON.stringify({__ga_backup__:true,v:2,ts:Date.now(),clients,settings},null,2);const blob=new Blob([data],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`golden_anchor_backup_${new Date().toISOString().slice(0,10)}.json`;a.click();};
const validateBackup=json=>{try{const d=JSON.parse(json);return d.__ga_backup__&&Array.isArray(d.clients)?d:null;}catch{return null;}};
/* ── EXCEL / CSV IMPORTER ────────────────────────────────────────────────── */
const xFreq=f=>{const s=(f||'').toLowerCase().replace(/[-\s]/g,'');if(s.includes('biweek')||s.includes('byweek'))return'biweekly';if(s.includes('week'))return'weekly';if(s.includes('year')||s.includes('annual'))return'annual';return'monthly2';};
const SKIP_SH=new Set(['cover','cover page','debt','savings','model-r','model','intro','graphs','summary']);
const moIdx=n=>{const m={jan:0,january:0,enero:0,feb:1,february:1,febrero:1,mar:2,march:2,marzo:2,apr:3,april:3,abril:3,may:4,mayo:4,jun:5,june:5,junio:5,jul:6,july:6,julio:6,aug:7,august:7,agosto:7,sep:8,september:8,septiembre:8,sept:8,oct:9,october:9,octubre:9,nov:10,november:10,noviembre:10,dec:11,december:11,diciembre:11,dic:11};const k=n.toLowerCase().replace(/[^a-záéíóúñ]/g,'').slice(0,10);for(const[key,v]of Object.entries(m))if(k.startsWith(key.slice(0,4)))return v;return-1;};
const isMonthSh=n=>{const lc=n.toLowerCase().trim();return!SKIP_SH.has(lc)&&(moIdx(lc)>=0||/\d{4}/.test(lc));};
const shToLabel=n=>{const t=n.trim();const m=t.match(/^([A-Za-záéíóúñ]+)(\d{4})$/i);if(m){const i=moIdx(m[1]);return i>=0?`${MS[i]} ${m[2]}`:t;}const i=moIdx(t);if(i>=0){const now=new Date();const yr=i>now.getMonth()?now.getFullYear()-1:now.getFullYear();return`${MS[i]} ${yr}`;}return t;};

function parseMonthRows(rows){
  const r={bills:[],incP1:[],incP2:[],cards:[],tempM:[],annualB:[],p1n:'',p2n:'',p1tot:0,p2tot:0};
  let st='idle',curIP=null,curDP=null,curSrc='',tc=0;
  const cv=(row,i)=>row[i]===null||row[i]===undefined?'':String(row[i]).trim();
  const cn=(row,i)=>parseFloat(row[i])||0;
  const rT=row=>row.map(v=>(v||'').toString().toLowerCase()).join(' ');
  for(let i=0;i<rows.length;i++){
    const row=rows[i]||[];const txt=rT(row);
    if(!txt.replace(/\s/g,''))continue;
    const b=cv(row,1),c=cv(row,2);
    const e=cn(row,4),g=cn(row,6),h=cn(row,7),jv=cn(row,9);
    // Temp bills (must check before debt/bills)
    if(txt.includes('temporary bills')&&!txt.includes('total')&&!txt.includes('temp credit')){tc++;st=tc===1?'tm':'ta';curSrc='';continue;}
    // Debt section header
    if(!txt.includes('total')&&txt.includes('debt')&&(txt.includes('apr')||txt.includes('$'))&&!txt.includes('interest free')&&!txt.includes('interest debt')&&e===0){st='debt';curDP=null;continue;}
    if(st==='debt'&&(txt.includes('credit cards')||txt.includes('credito')))continue;
    // Bills sections
    if(!txt.includes('total')&&!txt.includes('temporary')&&(txt.includes('bills')||txt.includes('gastos'))&&(txt.includes('1st')||txt.includes('1ra')||txt.includes('primera')||txt.includes('quarter')||st==='idle')){st='b1';continue;}
    if(!txt.includes('total')&&!txt.includes('temporary')&&(txt.includes('bills')||txt.includes('gastos'))&&(txt.includes('2nd')||txt.includes('segunda'))){st='b2';continue;}
    if((st==='b1'||st==='b2')&&txt.includes('total cost')){st='ab';continue;}
    // Income: paycheck style ("Mauricio's Paycheck", "Chabeli's Check")
    if(txt.match(/[''`]s?\s*(paycheck|check)\b/)&&!txt.includes('total')){
      const np=(b+' '+c).match(/([A-Za-záéíóúñ]{3,})[''`]s?\s*(paycheck|check)/i);
      const det=np?np[1]:'';
      if(!r.p1n||det.toLowerCase()===r.p1n.toLowerCase()){r.p1n=det||r.p1n||'P1';curIP='p1';st='inc';}
      else{r.p2n=r.p2n||det;curIP='p2';st='inc';}
      curSrc='';continue;
    }
    // Income: "Primera Quincena - Name" style
    if(!txt.includes('total')&&(txt.includes('primera')||(txt.includes('quincena')&&!txt.includes('segunda')))&&!txt.includes('temporary')){
      const dm=(b+' '+c).match(/[-–]\s*([A-Za-záéíóúñ]+)/);
      r.p1n=r.p1n||(dm?dm[1]:'P1');curIP='p1';st='inc';curSrc='';continue;
    }
    if(!txt.includes('total')&&(txt.includes('segunda')||(txt.includes('quincena')&&txt.includes('segunda')))&&!txt.includes('temporary')){
      const dm=(b+' '+c).match(/[-–]\s*([A-Za-záéíóúñ]+)/);
      r.p2n=r.p2n||(dm?dm[1]:'');curIP='p2';st='inc';curSrc='';continue;
    }
    // Total Earnings
    if(txt.includes('total earnings')){
      const tot=cn(row,3)||cn(row,4);
      if(curIP==='p1'&&tot>0)r.p1tot=tot;
      if(curIP==='p2'&&tot>0)r.p2tot=tot;
      st='ai';continue;
    }
    // === EXTRACT DATA ===
    // Bills
    if(st==='b1'||st==='b2'){
      const nm=b||c;const day=parseInt(cv(row,3))||null;
      if(nm&&e>0&&!nm.toLowerCase().match(/total|bills|gastos|temp/))
        r.bills.push({id:gid(),name:nm,assignedTo:'joint',cost:e,type:'regular',freq:'monthly2',dueDay:isNaN(day)?null:day,split:{p1:50,p2:50}});
    }
    // Income source label within income section (e.g. "Mediapro", "Victoria's Check")
    if(st==='inc'&&b&&!c&&e===0&&cn(row,3)===0&&b.length>1&&!b.toLowerCase().match(/total|income|salary|1st|2nd/)){
      curSrc=b.replace(/[''`]s?\s*(check|paycheck)/i,'').trim();
    }
    // Income paystubs
    if(st==='inc'&&c&&(cn(row,3)>0||cn(row,4)>0)){
      const actual=cn(row,3),sugg=cn(row,4),amt=actual>0?actual:sugg;
      if(amt>0&&c.length>1&&!c.toLowerCase().match(/^total|^1st income|^2nd income|^income/i)){
        const raw=c.replace(/[''`]s?\s*(1st|2nd|3rd|4th)?\s*paystub/i,'').trim();
        const label=raw||curSrc||'Paycheck';
        (curIP==='p1'?r.incP1:r.incP2).push({label,amount:amt});
      }
    }
    // Periodic income "Total" (not "Total Earnings") to capture per-person sub-totals
    if(st==='inc'&&(b.toLowerCase()==='total'||c.toLowerCase()==='total')&&(cn(row,3)>0||cn(row,4)>0)){
      const tot=cn(row,3)||cn(row,4);
      if(curIP==='p1'&&tot>r.p1tot)r.p1tot=tot;
      if(curIP==='p2'&&tot>r.p2tot)r.p2tot=tot;
    }
    // Debt cards
    if(st==='debt'){
      // Person sub-header (single name, no balance, no APR, no min pay, no due day) — stricter to avoid eating 0-balance cards
      if(c&&!b&&e===0&&g===0&&h===0&&jv===0&&!c.match(/^\d/)&&!txt.match(/credit|loan|card|total|interest|visa|amex|mastercard|discover|chase|capital|citi|wells|bank/i)&&c.length>1&&c.length<25){curDP=c;continue;}
      if(c&&!c.toLowerCase().match(/total|interest|credit cost|free debt/)){
        const apr=g>1?Math.round(g*10)/10:Math.round(g*1000)/10;
        r.cards.push({id:gid(),name:c,balance:e||0,apr:apr||0,min:h||0,limit:0,promos:[],owedBy:curDP||'__joint__',dueDay:jv||null});
      }
    }
    // Temp monthly (loans/recurring)
    if(st==='tm'){
      const nm=c;const amt=cn(row,8)||h||e;const freq=cv(row,6);
      if(nm&&amt>0&&!nm.toLowerCase().match(/total|interest|free|debt|credit cost/))
        r.tempM.push({id:gid(),name:nm,assignedTo:'joint',cost:amt,type:'temporary',freq:xFreq(freq)||'monthly2',dueDay:null,split:{p1:50,p2:50}});
    }
    // Annual bills
    if(st==='ta'){
      const nm=c;const freq=cv(row,6);
      if(nm&&e>0&&!nm.toLowerCase().match(/total|paid|cost/)){
        const biY=freq.toLowerCase().match(/bi.?year|6.?month/);
        r.annualB.push({id:gid(),name:nm,assignedTo:'joint',cost:biY?e*2:e,type:'annual',freq:'annual',dueDay:null,split:{p1:50,p2:50}});
      }
    }
  }
  return r;
}

function buildStreams(pr,p1Name,p2Name){
  const streams=[];
  const addP=(incArr,tot,person,name)=>{
    if(incArr.length>0){
      const grp={};
      incArr.forEach(s=>{const k=s.label||'Income';(grp[k]=(grp[k]||0)+s.amount);});
      const entries=Object.entries(grp).filter(([,v])=>v>0);
      // If all entries are generic ("Paycheck"/"Income") and we have a total, use total as one stream
      const allGeneric=entries.every(([k])=>k.match(/^(paycheck|income|paystub)$/i));
      if(allGeneric&&tot>0){
        streams.push({id:gid(),person,label:(name||person)+' Income',gross:tot,net:tot,freq:'monthly2'});
      } else {
        entries.forEach(([label,net])=>streams.push({id:gid(),person,label,gross:net,net,freq:'monthly2'}));
      }
    } else if(tot>0){
      streams.push({id:gid(),person,label:(name||person)+' Income',gross:tot,net:tot,freq:'monthly2'});
    }
  };
  addP(pr.incP1,pr.p1tot,'p1',p1Name);
  if(pr.p2n||p2Name)addP(pr.incP2,pr.p2tot,'p2',p2Name||pr.p2n);
  return streams;
}

async function parseWorkbook(file){
  return new Promise((res,rej)=>{
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array',cellDates:true});
        const mSheets=wb.SheetNames.filter(isMonthSh);
        if(!mSheets.length){rej(new Error('No month sheets found. Expected sheets named after months (e.g. Noviembre, June2025).'));return;}
        const parsed=mSheets.map(name=>{
          const rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:''});
          return{name,label:shToLabel(name),pr:parseMonthRows(rows)};
        });
        let p1n='',p2n='';
        for(const{pr}of parsed){if(!p1n&&pr.p1n)p1n=pr.p1n;if(!p2n&&pr.p2n)p2n=pr.p2n;if(p1n&&p2n)break;}
        const lat=parsed[parsed.length-1].pr;
        const incomeStreams=buildStreams(lat,p1n,p2n);
        const bills=[...lat.bills,...lat.tempM,...lat.annualB];
        const rawCards=lat.cards;
        const snapshots=parsed.map(({label,pr})=>{
          const si=buildStreams(pr,p1n,p2n);
          const sb=[...pr.bills,...pr.tempM,...pr.annualB];
          const sc=pr.cards;
          const net=si.reduce((s,i)=>s+toM(i.net,i.freq),0);
          const bt=sumB(sb);const dt=sc.reduce((s,c)=>s+(+c.balance||0),0);
          const mt=sc.reduce((s,c)=>s+(+c.min||0),0);
          const parts=label.split(' ');const moName=parts[0];const yr=parseInt(parts[1])||new Date().getFullYear();
          const mo=MS.indexOf(moName)+1;
          return{label,year:yr,month:mo,income:Math.round(net),bills:Math.round(bt),debt:Math.round(dt),savings:0,cashFlow:Math.round(net-bt-mt),savedAt:new Date().toISOString(),previousVersions:[],data:{incomeStreams:si,bills:sb,cards:sc,accounts:[],loans:[],customAssets:[]}};
        });
        res({p1n,p2n,isCouple:!!p2n,incomeStreams,bills,rawCards,snapshots,months:parsed.map(p=>p.label)});
      }catch(err){rej(err);}
    };
    reader.onerror=()=>rej(new Error('File read failed.'));
    reader.readAsArrayBuffer(file);
  });
}

function parseCRMCsv(text){
// Proper CSV tokenizer — handles quoted newlines, commas inside quotes
  const parseCSVFull=txt=>{const rows=[];let row=[],cur='',inQ=false;for(let i=0;i<txt.length;i++){const ch=txt[i];if(ch==='"'){if(inQ&&txt[i+1]==='"'){cur+='"';i++;}else inQ=!inQ;}else if(ch===','&&!inQ){row.push(cur.trim().replace(/^"|"$/g,''));cur='';}else if((ch==='\n'||ch==='\r')&&!inQ){if(ch==='\r'&&txt[i+1]==='\n')i++;if(row.length>0||cur.trim()){row.push(cur.trim().replace(/^"|"$/g,''));rows.push(row);row=[];cur='';}}else cur+=ch;}if(cur.trim()||row.length>0){row.push(cur.trim().replace(/^"|"$/g,''));rows.push(row);}return rows;};
  const allRows=parseCSVFull(text);
  if(allRows.length<2)return[];
  const hdr=allRows[0];
  // Detect format
  const isAppExport=hdr.includes('DOB')||hdr.includes('Type');
  const clients=[];
  for(let i=1;i<allRows.length;i++){
    const cols=allRows[i];
    const row={};hdr.forEach((h,j)=>row[h]=cols[j]||'');
    if(!row.Name&&!row['First Name'])continue;
    let firstName,lastName,email,phone,dob,social,address,clientType,recommendedBy;
    if(isAppExport){
      // App export format: Name,Email,Phone,DOB,Address,SSN,Type,Referred By
      const parts=(row.Name||'').trim().split(/\s+/);
      firstName=parts[0]||'Unknown';lastName=parts.slice(1).join(' ')||'';
      email=row.Email||'';phone=row.Phone||'';dob=row.DOB||'';social=row.SSN||'';
      address=row.Address||'';clientType=row.Type==='Finance + Health'?'financeAndHealth':'financeOnly';
      recommendedBy=row['Referred By']||'';
    } else {
      // CRM export format (Airtable / health CRM)
      const name=(row.Name||'').trim();const parts=name.split(/\s+/);
      firstName=parts[0]||'Unknown';lastName=parts.slice(1).join(' ')||'';
      email=row.Email||row['Client Email']||'';
      const ph=(row.Phone||'').replace(/[^\d]/g,'');
      phone=ph.length===10?`(${ph.slice(0,3)}) ${ph.slice(3,6)}-${ph.slice(6)}`:row.Phone||'';
      let rawDob=row['Date of Birth']||row.DOB||'';
      try{const d=new Date(rawDob);dob=isNaN(d)?'':(d.toISOString().split('T')[0]);}catch{dob='';}
      social=row['SSN (from Household Members)']||row.SSN||'';
      address=row.Address||'';
      const svc=(row.Services||'').toLowerCase();
      clientType=svc.includes('insurance')&&svc.includes('finance')?'financeAndHealth':svc.includes('insurance')?'financeAndHealth':'financeOnly';
      recommendedBy=row['Referral Source']||'';
    }
    clients.push({id:gid(),firstName,lastName,email,phone,address,dob,social,clientType,recommendedBy,incomeStreams:[],bills:[],cards:[],accounts:[],loans:[],customAssets:[],monthSnapshots:[],alloc:{stocks:25,retirement:20,realEstate:20,savings:15,vacation:10,other:10},notes:{shortTerm:'',midTerm:'',longTerm:'',setbacks:'',goals:'',general:''},portfolioCustom:{holdings:[],overrides:{},rates:{}}});
  }
  return clients;
}

/* ── IMPORT WIZARD ───────────────────────────────────────────────────────── */
function ImportWizard({onClose,onImport,existingClients,t}){
  const th=useTh();
  const[step,setStep]=useState('choose');
  const[mode,setMode]=useState('');
  const[xlFile,setXlFile]=useState(null);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState('');
  const[parsed,setParsed]=useState(null);
  const[csvClients,setCsvClients]=useState([]);
  const[selCSV,setSelCSV]=useState(new Set());
  const[names,setNames]=useState({firstName:'',lastName:'',partnerFirst:'',partnerLast:'',color1:'#4472C4',color2:'#ED7D31'});
  const[cardOwn,setCardOwn]=useState({});
  const[csvSearch,setCsvSearch]=useState('');
  const xlRef=useRef(),csvRef=useRef();
  const INP=mINP(th);

  const handleXLUpload=async f=>{
    if(!f)return;
    setXlFile(f);setLoading(true);setError('');
    try{
      const result=await parseWorkbook(f);
      setParsed(result);
      setNames(n=>({...n,firstName:result.p1n||'Unnamed',lastName:'Client',partnerFirst:result.p2n||'',color1:'#4472C4',color2:'#ED7D31'}));
      const owns={};
      result.rawCards.forEach(c=>{
        const det=c.owedBy!=='__joint__'?c.owedBy:null;
        // Default: joint for couples (flag detected person), p1 for single
        owns[c.id]=result.isCouple?'joint':(det&&det!=='__joint__'?'p1':'p1');
      });
      setCardOwn(owns);
      setLoading(false);
      setStep('names');
    }catch(err){setError(err.message);setLoading(false);}
  };

  const handleCSVUpload=f=>{
    if(!f)return;
    const reader=new FileReader();
    reader.onload=e=>{
      const clients=parseCRMCsv(e.target.result);
      setCsvClients(clients);
      // For 'both' mode start with nothing selected (user picks one); for csv mode select all
      setSelCSV(mode==='both'?new Set():new Set(clients.map(c=>c.id)));
      if(mode==='csv')setStep('csv_pick');
    };
    reader.readAsText(f);
  };

  const doImport=()=>{
    if(mode==='csv'){
      const toAdd=csvClients.filter(c=>selCSV.has(c.id)).map(c=>mig({...mk(),...c,monthSnapshots:[]}));
      onImport(toAdd);onClose();return;
    }
    // Excel or Both
    const isCouple=parsed.isCouple&&!!names.partnerFirst;
    // Apply card ownership
    const finalCards=parsed.rawCards.map(card=>({...card,owedBy:cardOwn[card.id]||'joint',promos:[]}));
    const snapshots=parsed.snapshots.map(snap=>({...snap,data:{...snap.data,cards:snap.data.cards.map(c=>({...c,owedBy:cardOwn[c.id]||'joint'}))}}));
    const allBills=parsed.bills.map(b=>({...b,assignedTo:isCouple?'joint':'p1',split:isCouple?{p1:50,p2:50}:{p1:100,p2:0}}));
    // CSV profile merge
    let profileData={};
    if(mode==='both'&&selCSV.size===1){
      const cc=csvClients.find(c=>selCSV.has(c.id));
      if(cc)profileData={email:cc.email,phone:cc.phone,address:cc.address,dob:cc.dob,social:cc.social,recommendedBy:cc.recommendedBy};
    }
    const newClient=mig({...mk(),...profileData,firstName:names.firstName||'Unnamed',lastName:names.lastName||'Client',partnerFirst:isCouple?names.partnerFirst:null,partnerLast:isCouple?names.partnerLast:null,color1:names.color1,color2:isCouple?names.color2:null,incomeStreams:parsed.incomeStreams,bills:allBills,cards:finalCards,accounts:[],loans:[],customAssets:[],monthSnapshots:snapshots});
    onImport([newClient]);onClose();
  };

  // ── RENDER STEPS ──
  if(step==='choose')return<Modal title={"📥 "+(t?.importClientData||"Import Client Data")} onClose={onClose}>
    <div style={{fontSize:12,color:th.muted,marginBottom:16}}>{t.whatImport||"What would you like to import?"}</div>
    {[['excel','📊','Financial Excel File','Import months of income, bills and debt from your Google Sheets export (.xlsx)'],['csv','👤','CRM Client List','Import client profiles from your insurance/health CRM export (.csv)'],['both','🔗','Link Both','Import Excel financial data and link it to a CRM client profile']].map(([m,icon,title,desc])=>
      <div key={m} onClick={()=>{setMode(m);setStep('upload');}} style={{...mCARD(th),padding:16,marginBottom:10,cursor:'pointer',display:'flex',gap:14,alignItems:'flex-start'}} onMouseEnter={e=>e.currentTarget.style.border=`1px solid ${th.accent}`} onMouseLeave={e=>e.currentTarget.style.border=`1px solid ${th.cardBorder}`}>
        <div style={{fontSize:28,flexShrink:0}}>{icon}</div>
        <div><div style={{fontWeight:700,color:th.text,marginBottom:3}}>{title}</div><div style={{fontSize:11,color:th.muted,lineHeight:1.5}}>{desc}</div></div>
      </div>
    )}
  </Modal>;

  if(step==='upload')return<Modal title={`📥 Upload File${mode==='both'?'s':''}`} onClose={onClose}>
    <input ref={xlRef} type="file" accept=".xlsx" onChange={e=>{if(e.target.files[0])handleXLUpload(e.target.files[0]);}} style={{display:'none'}}/>
    <input ref={csvRef} type="file" accept=".csv" onChange={e=>{if(e.target.files[0])handleCSVUpload(e.target.files[0]);}} style={{display:'none'}}/>
    {(mode==='excel'||mode==='both')&&<div style={{marginBottom:14}}>
      <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:6}}>📊 EXCEL FILE (.xlsx)</div>
      <div onClick={()=>xlRef.current?.click()} style={{...mCARD(th),padding:24,textAlign:'center',cursor:'pointer',border:`2px dashed ${xlFile&&!loading?th.pos:th.cardBorder}`,borderRadius:10}}>
        {loading?<><div style={{fontSize:14,marginBottom:4}}>⏳</div><div style={{fontSize:12,color:th.muted}}>{t.parsingMonths||"Parsing months…"}</div></>:xlFile?<><div style={{fontSize:14,marginBottom:4}}>✅</div><div style={{fontSize:12,color:th.pos,fontWeight:700}}>{xlFile.name}</div>{parsed&&<div style={{fontSize:11,color:th.muted,marginTop:4}}>{parsed.months.length} months found</div>}</>:<><div style={{fontSize:24,marginBottom:4}}>📂</div><div style={{fontSize:12,color:th.muted}}>{t.clickSelectXlsx||"Click to select .xlsx file"}<br/><span style={{fontSize:10}}>{t.googleSheetsExport||"Google Sheets export"}</span></div></>}
      </div>
      {parsed&&<div style={{...mCARD(th),padding:10,marginTop:8,fontSize:11}}>
        <div style={{color:th.muted,marginBottom:3}}>📅 {parsed.months.join(' · ')}</div>
        <div style={{color:th.muted,marginBottom:3}}>👤 {parsed.isCouple?`Couple: ${parsed.p1n||'P1'} & ${parsed.p2n||'P2'}`:`Single: ${parsed.p1n||'P1'}`}</div>
        <div style={{color:th.muted}}>💳 {parsed.rawCards.length} cards · 📋 {parsed.bills.length} bills · 💼 {parsed.incomeStreams.length} income streams</div>
      </div>}
      {error&&<div style={{fontSize:11,color:th.neg,marginTop:8,padding:8,background:th.neg+'11',borderRadius:8}}>⚠️ {error}</div>}
    </div>}
    {(mode==='csv'||mode==='both')&&<div style={{marginBottom:14}}>
      <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:6}}>{mode==='both'?'👤 OPTIONAL: CRM CSV FILE':'👤 CRM CSV FILE'}</div>
      <div onClick={()=>csvRef.current?.click()} style={{...mCARD(th),padding:20,textAlign:'center',cursor:'pointer',border:`2px dashed ${csvClients.length?th.pos:th.cardBorder}`,borderRadius:10}}>
        {csvClients.length?<><div style={{fontSize:14,marginBottom:4}}>✅</div><div style={{fontSize:12,color:th.pos,fontWeight:700}}>{csvClients.length} clients found</div></>:<><div style={{fontSize:24,marginBottom:4}}>📂</div><div style={{fontSize:12,color:th.muted}}>{t.clickSelectCsv||"Click to select .csv file"}</div></>}
      </div>
    </div>}
    <div style={{display:'flex',gap:8,justifyContent:'space-between',marginTop:8}}>
      <Btn onClick={()=>setStep('choose')}>Back</Btn>
      <div style={{display:'flex',gap:8}}>
        {mode==='excel'&&parsed&&!loading&&<BSolid onClick={()=>setStep('names')}>{t.continueArrow||"Continue →"}</BSolid>}
        {mode==='csv'&&csvClients.length>0&&<BSolid onClick={()=>setStep('csv_pick')}>{t.continueArrow||"Continue →"}</BSolid>}
        {mode==='both'&&parsed&&!loading&&<BSolid onClick={()=>setStep('names')}>{csvClients.length?'Continue →':'Skip CSV →'}</BSolid>}
      </div>
    </div>
  </Modal>;

  if(step==='names')return<Modal title={"👤 "+(t?.clientNamesTitle||"Client Names")} onClose={onClose}>
    <div style={{fontSize:11,color:th.muted,marginBottom:14}}>Names detected from the file — edit as needed.</div>
    <Row2><Field label={t?.firstName||"First Name"}><input style={INP} value={names.firstName} onChange={e=>setNames(n=>({...n,firstName:e.target.value}))}/></Field><Field label={t?.lastName||"Last Name"}><input style={INP} value={names.lastName} onChange={e=>setNames(n=>({...n,lastName:e.target.value}))}/></Field></Row2>
    {parsed?.isCouple&&<><div style={{height:1,background:th.cardBorder,margin:'12px 0'}}/><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>👥 Partner (detected in file)</div><Row2><Field label={t?.partnerFirst||"Partner First Name"}><input style={INP} value={names.partnerFirst} onChange={e=>setNames(n=>({...n,partnerFirst:e.target.value}))}/></Field><Field label={t?.partnerLast||"Partner Last Name"}><input style={INP} value={names.partnerLast} onChange={e=>setNames(n=>({...n,partnerLast:e.target.value}))}/></Field></Row2></>}
    <div style={{height:1,background:th.cardBorder,margin:'12px 0'}}/>
    <div style={{display:'flex',gap:16,marginBottom:4}}>
      <Field label={`${names.firstName||'P1'} Color`}><input type="color" value={names.color1} onChange={e=>setNames(n=>({...n,color1:e.target.value}))} style={{width:48,height:32,border:'none',cursor:'pointer',background:'none'}}/></Field>
      {parsed?.isCouple&&names.partnerFirst&&<Field label={`${names.partnerFirst} Color`}><input type="color" value={names.color2} onChange={e=>setNames(n=>({...n,color2:e.target.value}))} style={{width:48,height:32,border:'none',cursor:'pointer',background:'none'}}/></Field>}
    </div>
    <div style={{display:'flex',gap:8,justifyContent:'space-between',marginTop:16}}>
      <Btn onClick={()=>setStep('upload')}>Back</Btn>
      <BSolid onClick={()=>setStep(parsed?.rawCards?.length?'cards':mode==='both'&&csvClients.length?'csv_pick':'confirm')}>{t.continueArrow||"Continue →"}</BSolid>
    </div>
  </Modal>;

  if(step==='cards')return<Modal title={"💳 "+(t?.assignCardTitle||"Assign Card Ownership")} onClose={onClose} width={560}>
    <div style={{fontSize:11,color:th.muted,marginBottom:12}}>
      {parsed?.isCouple?'Cards default to Joint. ⚑ = originally detected under a specific person.':'Assign each card to the client.'}
    </div>
    <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:360,overflowY:'auto',marginBottom:16}}>
      {parsed?.rawCards.map(card=>{
        const detectedPerson=card.owedBy!=='__joint__'?card.owedBy:null;
        const cur=cardOwn[card.id]||'joint';
        const opts=[['p1',names.firstName||'P1'],parsed?.isCouple&&['joint','Joint'],parsed?.isCouple&&['p2',names.partnerFirst||'P2']].filter(Boolean);
        return<div key={card.id} style={{...mCARD(th),padding:'10px 14px',display:'flex',alignItems:'center',gap:12}}>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:700,color:th.text}}>{card.name}{detectedPerson&&<span style={{fontSize:10,color:th.warn,marginLeft:6}}>⚑ {detectedPerson}</span>}</div>
            <div style={{fontSize:11,color:th.dim}}>{fmt(card.balance)}{card.apr>0?` · ${card.apr}% APR`:' · 0% APR'}</div>
          </div>
          <div style={{display:'flex',gap:4}}>
            {opts.map(([v,l])=><button key={v} onClick={()=>setCardOwn(o=>({...o,[card.id]:v}))} style={{fontSize:11,padding:'3px 10px',borderRadius:6,cursor:'pointer',background:cur===v?th.accent+'33':'transparent',color:cur===v?th.accent:th.dim,border:`1px solid ${cur===v?th.accent:th.cardBorder}`,fontWeight:cur===v?700:400}}>{l}</button>)}
          </div>
        </div>;
      })}
    </div>
    <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
      <Btn onClick={()=>setStep('names')}>Back</Btn>
      <BSolid onClick={()=>setStep(mode==='both'&&csvClients.length?'csv_pick':'confirm')}>{t.continueArrow||"Continue →"}</BSolid>
    </div>
  </Modal>;

  if(step==='csv_pick'){const filteredCSV=csvClients.filter(c=>`${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(csvSearch.toLowerCase()));return<Modal title={"👥 "+(t?.selectClientTitle||"Select Client Profile")} onClose={onClose} width={520}>
    <div style={{fontSize:11,color:th.muted,marginBottom:10}}>{mode==='both'?'Select ONE client to link as profile for this import:':'Select which clients to import:'}</div>
    <div style={{display:'flex',gap:8,marginBottom:10,alignItems:'center'}}><input placeholder={t?.searchClientsPh||"Search clients…"} aria-label={t?.searchClientsPh||"Search clients"} value={csvSearch} onChange={e=>setCsvSearch(e.target.value)} style={{...mINP(th),flex:1,padding:'5px 10px',fontSize:12}}/>{mode!=='both'&&<><Btn small onClick={()=>setSelCSV(new Set(csvClients.map(x=>x.id)))}>All</Btn><Btn small onClick={()=>setSelCSV(new Set())}>None</Btn></>}</div>
    <div style={{display:'flex',flexDirection:'column',gap:5,maxHeight:320,overflowY:'auto',marginBottom:12}}>
      {filteredCSV.map(cl=>{
        const sel=selCSV.has(cl.id);
        return<div key={cl.id} onClick={()=>{if(mode==='both'){setSelCSV(new Set([cl.id]));}else{const ns=new Set(selCSV);sel?ns.delete(cl.id):ns.add(cl.id);setSelCSV(ns);}}} style={{...mCARD(th),padding:'9px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:10,border:`1px solid ${sel?th.accent:th.cardBorder}`}}>
          <div style={{width:17,height:17,borderRadius:3,background:sel?th.accent:th.cardBorder,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:10,color:'#fff',fontWeight:700}}>{sel&&'✓'}</div>
          <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:th.text}}>{cl.firstName} {cl.lastName}</div><div style={{fontSize:11,color:th.dim}}>{cl.email}{cl.phone?` · ${cl.phone}`:''}{cl.dob?` · ${cl.dob}`:''}</div></div>
        </div>;
      })}
      {!filteredCSV.length&&<div style={{fontSize:12,color:th.dim,padding:'12px',textAlign:'center'}}>{t.noClientsMatch||"No clients match search."}</div>}
    </div>
    <div style={{fontSize:11,color:th.dim,marginBottom:10}}>{mode==='both'?`${selCSV.size===1?'1 client selected':'Select 1 client to link'}`:`${selCSV.size} of ${csvClients.length} selected`}</div>
    <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
      <Btn onClick={()=>setStep(parsed?'cards':'upload')}>Back</Btn>
      <BSolid onClick={()=>mode==='csv'?doImport():setStep('confirm')} style={{opacity:selCSV.size===0?0.5:1}}>
        {mode==='csv'?`Import ${selCSV.size} Client${selCSV.size!==1?'s':''}`:mode==='both'&&selCSV.size===1?'Link & Continue →':'Select 1 to link'}
      </BSolid>
    </div>
  </Modal>;}

  if(step==='confirm'){
    const net=parsed?parsed.incomeStreams.reduce((s,i)=>s+toM(i.net,i.freq),0):0;
    const linkedCsv=mode==='both'&&selCSV.size===1?csvClients.find(c=>selCSV.has(c.id)):null;
    return<Modal title={"✅ "+(t?.reviewImportTitle||"Review & Import")} onClose={onClose}>
      <div style={{...mCARD(th),padding:18,marginBottom:14,background:th.pos+'08',border:`1px solid ${th.pos}33`}}>
        <div style={{fontSize:16,fontWeight:800,color:th.text,marginBottom:8}}>{names.firstName} {names.lastName}{names.partnerFirst?` & ${names.partnerFirst}`:''}</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:12}}>
          <div style={{color:th.accent,fontWeight:600}}>📅 {parsed?.snapshots?.length||0} months of data</div>
          <div style={{color:th.neg,fontWeight:600}}>💳 {parsed?.rawCards?.length||0} credit cards</div>
          <div style={{color:th.warn,fontWeight:600}}>📋 {parsed?.bills?.length||0} bills</div>
          <div style={{color:th.pos,fontWeight:600}}>💼 {fmt(net)}/mo income</div>
        </div>
      </div>
      {linkedCsv&&<div style={{...mCARD(th),padding:10,marginBottom:14,fontSize:11,color:th.muted}}>📎 Profile linked: {linkedCsv.firstName} {linkedCsv.lastName} · {linkedCsv.email}</div>}
      <div style={{fontSize:11,color:th.dim,marginBottom:16,lineHeight:1.6}}>Accounts, loans, and physical assets are not in the Excel — add them via the Intake tab after importing.</div>
      {(()=>{const fullName=`${names.firstName} ${names.lastName}`.toLowerCase();const dup=(existingClients||[]).find(c=>`${c.firstName} ${c.lastName}`.toLowerCase()===fullName);return dup?<div style={{...mCARD(useTh()),padding:12,marginBottom:14,background:useTh().warn+"11",border:`1px solid ${useTh().warn}44`,fontSize:12,color:useTh().warn}}>⚠️ A client named <b>{names.firstName} {names.lastName}</b> already exists. Importing will create a duplicate — consider archiving the existing one first.</div>:null;})()}
      <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
        <Btn onClick={()=>setStep(parsed?.rawCards?.length?'cards':mode==='both'&&csvClients.length?'csv_pick':'names')}>Back</Btn>
        <BSolid onClick={doImport}>✅ Import Client</BSolid>
      </div>
    </Modal>;
  }
  return null;
}

/* ── ARCHIVE / DELETE / BACKUP ───────────────────────────────────────────── */
// Find duplicates for a batch of incoming clients against existing list
// Match priority: (1) exact firstName+lastName+email, (2) firstName+lastName, (3) email only
const findDuplicate=(incoming,existing)=>{const fn=(incoming.firstName||"").toLowerCase().trim();const ln=(incoming.lastName||"").toLowerCase().trim();const em=(incoming.email||incoming.p1Email||"").toLowerCase().trim();return existing.find(c=>{const efn=(c.firstName||"").toLowerCase().trim();const eln=(c.lastName||"").toLowerCase().trim();const eem=(c.email||c.p1Email||"").toLowerCase().trim();const pfn=(c.partnerFirst||"").toLowerCase().trim();const pln=(c.partnerLast||"").toLowerCase().trim();if(fn===efn&&ln===eln&&em&&em===eem)return true;if(fn===efn&&ln===eln)return true;if(em&&em===eem)return true;if(fn===pfn&&ln===pln)return true;/* incoming matches partner side */return false;});};

// Smart merge: existing data preserved, new fills in blanks, never overwrites existing values
// Arrays (cards, bills, accounts, loans, customAssets, monthSnapshots): union by id, incoming fills gaps
const smartMerge=(existing,incoming)=>{const scalarKeys=["firstName","lastName","partnerFirst","partnerLast","email","phone","address","dob","social","clientType","recommendedBy","p1Phone","p2Phone","p1Email","p2Email","p1Dob","p2Dob","p1Social","p2Social","color1","color2"];const merged={...existing};scalarKeys.forEach(k=>{if(!merged[k]&&incoming[k])merged[k]=incoming[k];});const arrKeys=["incomeStreams","bills","cards","accounts","loans","customAssets"];arrKeys.forEach(k=>{const a=merged[k]||[];const b=incoming[k]||[];const existingIds=new Set(a.map(x=>x.id));const newOnes=b.filter(x=>!existingIds.has(x.id));merged[k]=[...a,...newOnes];});// Snapshots: union by label, keep existing
const existingLabels=new Set((merged.monthSnapshots||[]).map(s=>s.label));const newSnaps=(incoming.monthSnapshots||[]).filter(s=>!existingLabels.has(s.label));merged.monthSnapshots=[...(merged.monthSnapshots||[]),...newSnaps];return merged;};

function DuplicateResolverModal({incoming,existing,onResolve,onClose,t}){const th=useTh();const pairs=incoming.map(inc=>({incoming:inc,match:findDuplicate(inc,existing)}));const dups=pairs.filter(p=>p.match);const news=pairs.filter(p=>!p.match);const[actions,setActions]=useState(()=>{const a={};dups.forEach(p=>{a[p.incoming.id||p.incoming.firstName+p.incoming.lastName]="merge";});return a;});const setAct=(id,v)=>setActions(p=>({...p,[id]:v}));const apply=()=>{const result=[];news.forEach(p=>result.push({action:"add",client:p.incoming}));dups.forEach(p=>{const k=p.incoming.id||p.incoming.firstName+p.incoming.lastName;const a=actions[k]||"merge";if(a==="skip")return;if(a==="new")result.push({action:"add",client:{...p.incoming,id:gid()}});else result.push({action:"merge",existing:p.match,incoming:p.incoming});});onResolve(result);onClose();};return<Modal title={"⚠️ "+(t?.dupClientsTitle||"Duplicate Clients Found")} onClose={onClose} width={600}><div style={{fontSize:12,color:th.muted,marginBottom:16,lineHeight:1.6}}>Found {dups.length} possible duplicate{dups.length!==1?"s":""} and {news.length} new client{news.length!==1?"s":""} in your import. Choose what to do with each match:</div>{dups.length>0&&<><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>⚠️ POSSIBLE DUPLICATES</div><div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16,maxHeight:300,overflowY:"auto"}}>{dups.map(p=>{const k=p.incoming.id||p.incoming.firstName+p.incoming.lastName;const a=actions[k]||"merge";return<div key={k} style={{...mCARD(th),padding:12,border:`1px solid ${th.warn}44`}}><div style={{display:"flex",gap:12,marginBottom:10}}><div style={{flex:1,fontSize:11}}><div style={{color:th.dim}}>📥 Incoming</div><div style={{fontWeight:700,color:th.text}}>{p.incoming.firstName} {p.incoming.lastName}</div><div style={{color:th.dim,fontSize:10}}>{p.incoming.email||p.incoming.p1Email||""}</div></div><div style={{flex:1,fontSize:11}}><div style={{color:th.dim}}>📂 Existing</div><div style={{fontWeight:700,color:th.text}}>{p.match.firstName} {p.match.lastName}</div><div style={{color:th.dim,fontSize:10}}>{p.match.email||p.match.p1Email||""}{p.match.partnerFirst?` · partner: ${p.match.partnerFirst}`:""} · {(p.match.monthSnapshots||[]).length}mo</div></div></div><div style={{display:"flex",gap:4}}>{[["merge","🔄 Merge (update empty fields)",th.blue],["skip","⏭️ Skip",th.dim],["new","➕ Import as New",th.warn]].map(([v,l,co])=><button key={v} onClick={()=>setAct(k,v)} style={{fontSize:10,padding:"4px 8px",borderRadius:6,cursor:"pointer",background:a===v?co+"22":"transparent",color:a===v?co:th.muted,border:`1px solid ${a===v?co:th.cardBorder}`,fontWeight:a===v?700:400,flex:1}}>{l}</button>)}</div></div>;})}</div></>}{news.length>0&&<div style={{fontSize:11,color:th.pos,marginBottom:14}}>✓ {news.length} new client{news.length!==1?"s":""} will be imported.</div>}<div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn onClick={onClose}>Cancel</Btn><BSolid onClick={apply}>Apply</BSolid></div></Modal>;}

function DeleteClientModal({client,onConfirm,onClose,t}){const th=useTh();const name=`${client.firstName} ${client.lastName}`;return<Modal title={"🗑️ "+(t?.deleteClientTitle||"Delete Client")} onClose={onClose}><div style={{...mCARD(th),padding:14,marginBottom:16,background:th.neg+"11",border:`1px solid ${th.neg}33`}}><div style={{fontSize:13,fontWeight:700,color:th.neg,marginBottom:6}}>⚠️ This action is permanent</div><div style={{fontSize:12,color:th.muted,lineHeight:1.6}}>All data for <b>{name}</b> including {(client.monthSnapshots||[]).length} months of snapshots will be permanently deleted. This cannot be undone.</div></div><div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn onClick={onClose}>Cancel</Btn><button onClick={onConfirm} style={{fontSize:12,padding:"7px 16px",borderRadius:8,background:th.neg,color:"#fff",border:"none",cursor:"pointer",fontWeight:700}}>🗑️ Delete Forever</button></div></Modal>;}

function BackupImportModal({onImport,onClose,existingClients,t}){const th=useTh();const[mode,setMode]=useState("restore");const[preview,setPreview]=useState(null);const[err,setErr]=useState("");const[search,setSearch]=useState("");const[sel,setSel]=useState(new Set());const[confirmReplace,setConfirmReplace]=useState(false);const fileRef=useRef();const handleFile=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const d=validateBackup(ev.target.result);if(!d){setErr("Invalid backup file. Must be a Golden Anchor .json backup.");return;}setPreview(d);setErr("");const allIds=new Set(d.clients.map(c=>c.id));setSel(allIds);};r.readAsText(f);};const exNames=new Set((existingClients||[]).map(c=>`${c.firstName} ${c.lastName}`.toLowerCase()));const filtered=(preview?.clients||[]).filter(c=>{const n=`${c.firstName} ${c.lastName}`;return n.toLowerCase().includes(search.toLowerCase());});const isDup=c=>exNames.has(`${c.firstName} ${c.lastName}`.toLowerCase());const doImport=()=>{if(!preview)return;if(mode==="replace"){onImport(preview,"replace");onClose();}else{const selClients=preview.clients.filter(c=>sel.has(c.id));onImport({...preview,clients:selClients},"restore");onClose();}};return<Modal title={"📥 "+(t?.restoreBackupTitle||"Restore Backup")} onClose={onClose} width={560}><input ref={fileRef} type="file" accept=".json" onChange={handleFile} style={{display:"none"}}/><div onClick={()=>fileRef.current?.click()} style={{...mCARD(th),padding:16,textAlign:"center",cursor:"pointer",border:`2px dashed ${preview?th.pos:th.cardBorder}`,borderRadius:10,marginBottom:14}}>{preview?<><div style={{fontSize:14,marginBottom:2}}>✅</div><div style={{fontSize:12,color:th.pos,fontWeight:700}}>{preview.clients.length} clients in backup</div><div style={{fontSize:11,color:th.muted}}>From {new Date(preview.ts).toLocaleDateString()}</div></>:<><div style={{fontSize:24,marginBottom:4}}>📂</div><div style={{fontSize:12,color:th.muted}}>Select .json backup file</div></>}</div>{err&&<div style={{fontSize:11,color:th.neg,marginBottom:12,padding:"8px 10px",background:th.neg+"11",borderRadius:8}}>{err}</div>}{preview&&<><div style={{display:"flex",gap:8,marginBottom:10}}>{[["restore","🔄 Restore (select clients)"],["replace","⚠️ Replace All"]].map(([v,l])=><button key={v} onClick={()=>setMode(v)} style={{fontSize:11,padding:"5px 12px",borderRadius:7,cursor:"pointer",background:mode===v?(v==="replace"?th.neg:th.accent)+"22":"transparent",color:mode===v?(v==="replace"?th.neg:th.accent):th.muted,border:`1px solid ${mode===v?(v==="replace"?th.neg:th.accent):th.cardBorder}`,fontWeight:mode===v?700:400}}>{l}</button>)}</div>{mode==="restore"&&<><div style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}><input placeholder={t?.searchClientsPh||"Search clients…"} aria-label={t?.searchClientsPh||"Search clients"} value={search} onChange={e=>setSearch(e.target.value)} style={{...mINP(th),flex:1,padding:"5px 10px"}}/><Btn small onClick={()=>setSel(new Set(preview.clients.map(c=>c.id)))}>Select All</Btn><Btn small onClick={()=>setSel(new Set())}>Clear</Btn></div><div style={{maxHeight:240,overflowY:"auto",marginBottom:10,display:"flex",flexDirection:"column",gap:4}}>{filtered.map(c=>{const dup=isDup(c);const selected=sel.has(c.id);return<div key={c.id} onClick={()=>{const ns=new Set(sel);selected?ns.delete(c.id):ns.add(c.id);setSel(ns);}} style={{...mCARD(th),padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,border:`1px solid ${selected?th.accent:th.cardBorder}`}}><div style={{width:16,height:16,borderRadius:3,background:selected?th.accent:th.cardBorder,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:10,color:"#fff"}}>{selected&&"✓"}</div><div style={{flex:1}}><span style={{fontSize:12,fontWeight:600,color:th.text}}>{c.firstName} {c.lastName}</span>{dup&&<span style={{fontSize:10,color:th.warn,marginLeft:6,padding:"1px 5px",background:th.warn+"22",borderRadius:4}}>⚑ exists — will update</span>}{!dup&&<span style={{fontSize:10,color:th.pos,marginLeft:6}}>new</span>}</div><div style={{fontSize:11,color:th.dim}}>{(c.monthSnapshots||[]).length}mo</div></div>;})} </div><div style={{fontSize:11,color:th.dim,marginBottom:8}}>{sel.size} of {preview.clients.length} selected · {filtered.filter(c=>isDup(c)&&sel.has(c.id)).length} will update · {filtered.filter(c=>!isDup(c)&&sel.has(c.id)).length} will be added</div></>}{mode==="replace"&&<div style={{...mCARD(th),padding:14,marginBottom:10,background:th.neg+"08",border:`1px solid ${th.neg}33`}}><div style={{fontSize:12,fontWeight:700,color:th.neg,marginBottom:8}}>⚠️ Replace All will permanently delete your current clients and replace with:</div><div style={{maxHeight:160,overflowY:"auto"}}>{preview.clients.map(c=><div key={c.id} style={{fontSize:11,color:th.muted,padding:"3px 0"}}>{c.firstName} {c.lastName} · {(c.monthSnapshots||[]).length} months</div>)}</div></div>}</>}<div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn onClick={onClose}>Cancel</Btn>{preview&&<button onClick={doImport} style={{fontSize:12,padding:"7px 16px",borderRadius:8,background:mode==="replace"?th.neg:th.accent,color:"#fff",border:"none",cursor:"pointer",fontWeight:700}}>{mode==="replace"?"⚠️ Replace All":"✅ Restore "+sel.size+" Clients"}</button>}</div></Modal>;}

function ArchivedSection({clients,onRestore,onDelete,t}){const th=useTh();const archived=clients.filter(c=>c.archived);const[open,setOpen]=useState(false);const[delTarget,setDelTarget]=useState(null);if(!archived.length)return null;return<div style={{...mCARD(th),padding:14,marginTop:16,border:`1px solid ${th.warn}33`}}>{delTarget&&<DeleteClientModal client={delTarget} onConfirm={()=>{onDelete(delTarget.id);setDelTarget(null);}} onClose={()=>setDelTarget(null)} t={t}/>}<div onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}><span style={{fontSize:12,fontWeight:700,color:th.warn}}>📦 Archived Clients ({archived.length})</span><span style={{color:th.dim,fontSize:12}}>{open?"▲":"▼"}</span></div>{open&&<div style={{marginTop:12,display:"flex",flexDirection:"column",gap:6}}>{archived.map(c=><div key={c.id} style={{...mCARD(th),padding:"10px 14px",display:"flex",alignItems:"center",gap:12}}><div style={{width:32,height:32,borderRadius:99,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,background:th.muted+"22",color:th.muted,border:`2px solid ${th.muted}44`,flexShrink:0,filter:"grayscale(1)"}}>{c.firstName[0]}{c.lastName[0]}</div><div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:th.muted}}>{c.firstName} {c.lastName}{c.partnerFirst?` & ${c.partnerFirst}`:""}</div><div style={{fontSize:11,color:th.dim}}>{c.email}</div></div><div style={{display:"flex",gap:6}}><Btn small onClick={()=>onRestore(c.id)} color={th.pos}>↩ Restore</Btn><Btn small onClick={()=>{expBackup([c],{});}} color={th.blue}>⬇ Export</Btn><Btn small onClick={()=>setDelTarget(c)} color={th.neg}>🗑️</Btn></div></div>)}</div>}</div>;}
function ExportModal({clients,onClose,t}){const th=useTh();const[format,setFormat]=useState("backup");const[mode,setMode]=useState("all");const[search,setSearch]=useState("");const[sel,setSel]=useState(new Set(clients.map(c=>c.id)));const filtered=clients.filter(c=>!c.archived&&`${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()));const doExport=()=>{const toExp=mode==="all"?clients.filter(c=>!c.archived):clients.filter(c=>sel.has(c.id));if(format==="backup")expBackup(toExp,{});else{const rows=["Name,Email,Phone,DOB,Address,SSN,Type,Referred By"];toExp.forEach(c=>{rows.push(`"${c.firstName} ${c.lastName}","${c.email||""}","${c.phone||""}","${c.dob||""}","${c.address||""}","${c.social||""}","${c.clientType||""}","${c.recommendedBy||""}"`);});const blob=new Blob([rows.join("\n")],{type:"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`golden_anchor_clients_${new Date().toISOString().slice(0,10)}.csv`;a.click();}onClose();};return<Modal title={"⬇️ "+(t?.exportClientsTitle||"Export Clients")} onClose={onClose} width={500}><div style={{marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>Format</div><div style={{display:"flex",gap:8}}>{[["backup","💾 Full Backup (.json)","Includes all financial data, snapshots — re-importable"],["csv","👤 Profile CSV","Names, email, phone, DOB — importable as CRM profiles"]].map(([v,l,d])=><div key={v} onClick={()=>setFormat(v)} style={{...mCARD(th),padding:12,cursor:"pointer",flex:1,border:`1px solid ${format===v?th.accent:th.cardBorder}`}}><div style={{fontSize:12,fontWeight:700,color:format===v?th.accent:th.text,marginBottom:3}}>{l}</div><div style={{fontSize:10,color:th.muted}}>{d}</div></div>)}</div></div><div style={{marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>Which clients</div><div style={{display:"flex",gap:8,marginBottom:10}}>{[["all","All Active"],["select","Select Clients"]].map(([v,l])=><button key={v} onClick={()=>setMode(v)} style={{fontSize:11,padding:"5px 14px",borderRadius:8,cursor:"pointer",background:mode===v?th.accent+"22":"transparent",color:mode===v?th.accent:th.muted,border:`1px solid ${mode===v?th.accent:th.cardBorder}`,fontWeight:mode===v?700:400}}>{l}</button>)}</div>{mode==="select"&&<><div style={{display:"flex",gap:8,marginBottom:6}}><input placeholder={t?.searchPh||"Search…"} aria-label={t?.searchClientsPh||"Search clients"} value={search} onChange={e=>setSearch(e.target.value)} style={{...mINP(th),flex:1,padding:"5px 10px"}}/><Btn small onClick={()=>setSel(new Set(clients.filter(c=>!c.archived).map(c=>c.id)))}>All</Btn><Btn small onClick={()=>setSel(new Set())}>None</Btn></div><div style={{maxHeight:200,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>{filtered.map(c=>{const s=sel.has(c.id);return<div key={c.id} onClick={()=>{const ns=new Set(sel);s?ns.delete(c.id):ns.add(c.id);setSel(ns);}} style={{...mCARD(th),padding:"7px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,border:`1px solid ${s?th.accent:th.cardBorder}`}}><div style={{width:15,height:15,borderRadius:3,background:s?th.accent:th.cardBorder,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff"}}>{s&&"✓"}</div><span style={{fontSize:12,color:th.text}}>{c.firstName} {c.lastName}</span><span style={{fontSize:10,color:th.dim,marginLeft:"auto"}}>{(c.monthSnapshots||[]).length}mo</span></div>;})} </div><div style={{fontSize:11,color:th.dim,marginTop:6}}>{sel.size} selected</div></>}</div><div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn onClick={onClose}>Cancel</Btn><BSolid onClick={doExport}>{format==="backup"?"💾 Export Backup":"📄 Export CSV"}</BSolid></div></Modal>;}

/* ── DASHBOARD ───────────────────────────────────────────────────────────── */

function Dashboard({clients,t,settings,setSettings,onSelect,onAdd,onImportNew,onArchive,onRestore,onDelete,onRestoreBackup,onToggleHide,hideNumbers}){const th=useTh();const{isMobile}=useViewport();const[importOpen,setImportOpen]=useState(false);const[restoreOpen,setRestoreOpen]=useState(false);const[exportOpen,setExportOpen]=useState(false);const[dashSearch,setDashSearch]=useState("");const active=clients.filter(c=>!c.archived).filter(c=>{if(!dashSearch)return true;const q=dashSearch.toLowerCase();return `${c.firstName} ${c.lastName} ${c.partnerFirst||""} ${c.email||""}`.toLowerCase().includes(q);});const td=active.reduce((s,c)=>s+totalL(c),0);const ti=active.reduce((s,c)=>s+sumN(c.incomeStreams),0);const fO=active.filter(c=>c.clientType==="financeOnly").length;const fH=active.filter(c=>c.clientType==="financeAndHealth").length;const calcTrend=c=>{const s=c.monthSnapshots||[];if(s.length<2)return"stable";const diff=s[s.length-1].debt-s[0].debt;if(diff<0)return"improving";if(diff>100)return"worsening";return"stable";};const improvCount=active.filter(c=>calcTrend(c)==="improving").length;const stableCount=active.filter(c=>calcTrend(c)==="stable").length;const worseCount=active.filter(c=>calcTrend(c)==="worsening").length;const[trendMode,setTrendMode]=useState("revolving");// "all" | "revolving" | "current"
  const[trendRange,setTrendRange]=useState("12");// "3" | "6" | "12" | "all"
  const getDebtForMode=sn=>{if(!sn?.data)return sn?.debt||0;const d=sn.data;if(trendMode==="all")return(d.cards||[]).reduce((a,c)=>a+(+c.balance||0),0)+(d.loans||[]).reduce((a,l)=>a+(+l.balance||0),0);if(trendMode==="revolving")return(d.cards||[]).reduce((a,c)=>a+(+c.balance||0),0);// "current": revolving + short-term loans (personal/student), excludes mortgage/auto
return(d.cards||[]).reduce((a,c)=>a+(+c.balance||0),0)+(d.loans||[]).filter(l=>!l.linkedAssetId&&l.type!=="mortgage"&&l.type!=="vehicle").reduce((a,l)=>a+(+l.balance||0),0);};
  const _allLabels=Array.from(new Set(clients.flatMap(c=>(c.monthSnapshots||[]).map(s=>s.label))));const _labelKey=lbl=>{const parts=lbl.split(" ");const yr=parseInt(parts[1])||new Date().getFullYear();const mo=MS.indexOf(parts[0]);return yr*12+(mo>=0?mo:0);};const _sortedLabels=_allLabels.slice().sort((a,b)=>_labelKey(a)-_labelKey(b));const _rangeCount=trendRange==="3"?3:trendRange==="6"?6:trendRange==="12"?12:_sortedLabels.length;const _shownLabels=_sortedLabels.slice(-_rangeCount);const trend=(_shownLabels.length?_shownLabels:["Jan 2026","Feb 2026","Mar 2026","Apr 2026","May 2026"]).map(m=>({m:m.split(" ")[0]+(m.split(" ")[1]?("’"+m.split(" ")[1].slice(-2)):""),debt:clients.reduce((s,c)=>{const sn=(c.monthSnapshots||[]).find(x=>x.label===m);return s+getDebtForMode(sn);},0),savings:clients.reduce((s,c)=>{const sn=(c.monthSnapshots||[]).find(x=>x.label===m);return s+(sn?.savings||0);},0)}));return<div style={{padding:isMobile?14:24}}>{importOpen&&<ImportWizard onClose={()=>setImportOpen(false)} onImport={cs=>{onImportNew(cs);setImportOpen(false);}} existingClients={clients} t={t}/>}{restoreOpen&&<BackupImportModal onImport={onRestoreBackup} onClose={()=>setRestoreOpen(false)} existingClients={clients} t={t}/>}{exportOpen&&<ExportModal clients={clients} onClose={()=>setExportOpen(false)} t={t}/>}{/* v0.16.0 Phase 8 — 4 wide KPI cards matching Claude design */}
<div data-ga-grid="kpi-4" style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:12,marginBottom:isMobile?14:20}}>
  <SC label={"👥 "+(t?.kpiClients||"Clients")} value={clients.length} color={th.accent} sub={`${active.length} ${(t.active||"active")} · ${clients.length-active.length} ${(t.archivedLbl||"archived")}`}/>
  <SC label={"💼 "+(t.combinedNetMo||"Combined Net / mo")} value={hideNumbers?"●●●":fmt(ti)} color={th.pos}/>
  <SC label={"🏦 "+(t.combinedDebt||"Combined Debt")} value={hideNumbers?"●●●":fmt(td)} color={th.neg}/>
  <SC label={"💧 "+(t.liquidAssets||"Liquid Assets")} value={hideNumbers?"●●●":fmt(active.reduce((s,c)=>s+liquidA(c),0))} color={GOLD} sub={t.checkingSavingsLbl||"checking + savings"}/>
</div>

{/* v0.20.0 — Two-chart dashboard row: Income vs Spending (composed, 3fr) +
    Net Worth Distribution donut (2fr). Stacks on mobile. */}
<div data-ga-grid="two-col" style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"3fr 2fr",gap:12,marginBottom:14}}>
  {/* ── Left: Income vs Spending (composed bars + net line) ── */}
  <div style={{...mCARD(th),padding:isMobile?14:16}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>
      <div>
        <div style={{fontSize:11,fontWeight:800,color:th.dim,letterSpacing:"0.08em",textTransform:"uppercase"}}>📊 {t.incomeVsSpendingHdr||"Income vs Spending"}</div>
        <div style={{display:"flex",gap:14,marginTop:6,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:th.muted,display:"flex",alignItems:"center",gap:5}}><span style={{width:10,height:10,borderRadius:2,background:th.pos}}/>{t.income||"Income"}</span>
          <span style={{fontSize:11,color:th.muted,display:"flex",alignItems:"center",gap:5}}><span style={{width:10,height:10,borderRadius:2,background:th.neg}}/>{t.spending||"Spending"}</span>
          <span style={{fontSize:11,color:th.muted,display:"flex",alignItems:"center",gap:5}}><span style={{width:14,height:2,background:GOLD,borderRadius:1}}/>{t.netLbl||"Net"}</span>
        </div>
      </div>
      <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
        {[["3","3mo"],["6","6mo"],["12","12mo"],["all",t.allRange||"All"]].map(([v,l])=><button key={v} onClick={()=>setTrendRange(v)} style={{fontSize:10,padding:"3px 8px",borderRadius:6,background:trendRange===v?GOLD+"22":"transparent",color:trendRange===v?GOLD:th.dim,border:`1px solid ${trendRange===v?GOLD:th.cardBorder}`,cursor:"pointer",fontWeight:trendRange===v?700:400}}>{l}</button>)}
      </div>
    </div>
    <ResponsiveContainer width="100%" height={isMobile?200:230} style={{outline:"none"}}>
      <ComposedChart data={(()=>{const labels=_shownLabels.length?_shownLabels:["Jan 2026","Feb 2026","Mar 2026","Apr 2026","May 2026"];
        // v0.24.0 — disambiguate duplicate month names by appending '<YY> when the same month appears more than once in the range.
        const monthCounts={};labels.forEach(l=>{const k=l.split(" ")[0];monthCounts[k]=(monthCounts[k]||0)+1;});
        return labels.map(m=>{
          const parts=m.split(" ");const monthKey=monthCounts[parts[0]]>1&&parts[1]?`${parts[0]} '${String(parts[1]).slice(-2)}`:parts[0];
          const income=clients.reduce((s,c)=>{const sn=(c.monthSnapshots||[]).find(x=>x.label===m);return s+(sn?.income||0);},0);
          const spending=clients.reduce((s,c)=>{const sn=(c.monthSnapshots||[]).find(x=>x.label===m);return s+((sn?.bills||0)+((sn?.data?.cards||[]).reduce((a,cd)=>a+(+cd.min||0),0)));},0);
          return{m:monthKey,income,spending,net:income-spending};
        });
      })()} margin={{top:12,right:12,left:0,bottom:0}}>
        <CartesianGrid stroke={th.cardBorder} strokeDasharray="2 4" vertical={false}/>
        <XAxis dataKey="m" tick={{fontSize:11,fill:th.dim,fontFamily:"'JetBrains Mono',monospace"}} axisLine={false} tickLine={false}/>
        <YAxis tick={{fontSize:10,fill:th.dim,fontFamily:"'JetBrains Mono',monospace"}} axisLine={false} tickLine={false} tickFormatter={v=>fmtS(v)} width={50}/>
        <ReTip contentStyle={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:8,fontSize:11}} formatter={v=>fmt(v)}/>
        <Bar dataKey="income" name={t.income||"Income"} fill={th.pos} radius={[3,3,0,0]} maxBarSize={32}/>
        <Bar dataKey="spending" name={t.spending||"Spending"} fill={th.neg} radius={[3,3,0,0]} maxBarSize={32}/>
        <Line type="monotone" dataKey="net" name={t.netLbl||"Net"} stroke={GOLD} strokeWidth={2.5} dot={{r:3,fill:GOLD,strokeWidth:0}} activeDot={{r:5,fill:GOLD,strokeWidth:0}}/>
      </ComposedChart>
    </ResponsiveContainer>
  </div>
  {/* ── Right: Practice Net Worth Distribution donut ── */}
  {(()=>{
    const tiers={neg:0,low:0,mid:0,high:0};
    let totalNW=0;
    active.forEach(c=>{const nw=totalA(c)-totalL(c);totalNW+=nw;if(nw<0)tiers.neg++;else if(nw<50000)tiers.low++;else if(nw<250000)tiers.mid++;else tiers.high++;});
    const donutData=[
      {name:t.tierNeg||"Negative",value:tiers.neg,color:th.neg},
      {name:t.tierLow||"$0–50K",value:tiers.low,color:th.warn},
      {name:t.tierMid||"$50K–250K",value:tiers.mid,color:th.blue},
      {name:t.tierHigh||"$250K+",value:tiers.high,color:GOLD},
    ].filter(d=>d.value>0);
    return <div style={{...mCARD(th),padding:isMobile?14:16,display:"flex",flexDirection:"column"}}>
      <div style={{fontSize:11,fontWeight:800,color:th.dim,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>💎 {t.netWorthDistributionHdr||"Net Worth Distribution"}</div>
      <div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.netWorthDistributionSub||"Active clients grouped by current net worth tier."}</div>
      <div style={{display:"flex",alignItems:"center",gap:14,flex:1,minHeight:isMobile?180:200}}>
        <div style={{flex:"0 0 auto",position:"relative",width:isMobile?130:150,height:isMobile?130:150}}>
          {active.length===0?
            <div style={{width:"100%",height:"100%",borderRadius:999,border:`2px dashed ${th.cardBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:th.dim,textAlign:"center"}}>{t.noClientsYet||"No clients yet"}</div>
          :<>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData.length?donutData:[{name:"—",value:1,color:th.cardBorder}]} cx="50%" cy="50%" innerRadius={isMobile?44:52} outerRadius={isMobile?64:72} paddingAngle={donutData.length>1?2:0} dataKey="value" stroke="none">
                  {(donutData.length?donutData:[{color:th.cardBorder}]).map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Pie>
                <ReTip contentStyle={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:8,fontSize:11}} formatter={(v,n)=>[`${v} ${v===1?(t.client||"client"):(t.clients||"clients")}`,n]}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",pointerEvents:"none"}}>
              <div style={{fontSize:9,color:th.dim,letterSpacing:"0.04em",textTransform:"uppercase",fontWeight:700}}>{t.totalNet||"Total Net"}</div>
              <div style={{fontSize:isMobile?14:16,color:totalNW>=0?GOLD:th.neg,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",lineHeight:1.1,marginTop:2}}>{fmtS(totalNW)}</div>
            </div>
          </>}
        </div>
        <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:8}}>
          {donutData.length===0?<div style={{fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.noClientsYet||"Add clients to populate."}</div>:
            donutData.map(d=><div key={d.name} style={{display:"flex",alignItems:"center",gap:8,fontSize:11}}>
              <span style={{width:10,height:10,borderRadius:2,background:d.color,flexShrink:0}}/>
              <span style={{color:th.muted,flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{d.name}</span>
              <span style={{color:d.color,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{d.value}</span>
            </div>)
          }
        </div>
      </div>
    </div>;
  })()}
</div><RemindersPanel clients={clients} settings={settings} t={t} onSettingsChange={setSettings}/><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:20,marginBottom:10,gap:8,flexWrap:"wrap"}}><div style={{fontSize:12,fontWeight:700,color:th.dim}}>👥 {active.length} {active.length!==1?(t.clients||"Clients"):(t.client||"Client")}</div><input placeholder={"🔍 "+(t.searchClients||"Search clients...")} aria-label={t?.searchClientsPh||"Search clients"} value={dashSearch} onChange={e=>setDashSearch(e.target.value)} style={{...mINP(th),width:isMobile?"100%":240,maxWidth:isMobile?"none":240,padding:"6px 12px",fontSize:12,boxSizing:"border-box"}}/></div><div style={{display:"flex",flexDirection:"column",gap:8}}>{active.map(c=>{const n=sumN(c.incomeStreams);const tA=totalA(c);const tL=totalL(c);const sn=c.monthSnapshots||[];const im=sn.length>=2&&sn[sn.length-1].debt<sn[0].debt;return<div key={c.id} onClick={()=>onSelect(c)} style={{...mCARD(th),padding:isMobile?"12px 14px":"14px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:isMobile?10:16,flexWrap:isMobile?"wrap":"nowrap"}}><div style={{width:isMobile?38:44,height:isMobile?38:44,borderRadius:99,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:isMobile?12:14,background:c.color1+"22",color:c.color1,border:`2px solid ${c.color1}44`,flexShrink:0}}>{c.firstName[0]}{c.lastName[0]}</div><div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2,flexWrap:"wrap"}}><span style={{fontSize:isMobile?13:14,fontWeight:700,color:th.text}}>{c.firstName} {c.lastName}</span>{c.partnerFirst&&<span style={{fontSize:12,color:th.dim}}>& {c.partnerFirst}</span>}{im&&<Pill color={th.pos}>{t.improving}</Pill>}{!isMobile&&<span style={{fontSize:10,color:th.dim}}>{(c.monthSnapshots||[]).length} snapshots</span>}</div><div style={{fontSize:11,color:th.dim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.email}</div></div>{!isMobile&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20,textAlign:"right"}}><div><div style={{fontSize:10,color:th.dim,marginBottom:2}}>{t.netMo||"Net/mo"}</div><div style={{fontSize:13,fontWeight:700,color:th.pos}}>{hideNumbers?<span style={{filter:"blur(5px)",userSelect:"none"}}>●●●</span>:fmt(n)}</div></div><div><div style={{fontSize:10,color:th.dim,marginBottom:2}}>{t.debt||"Debt"}</div><div style={{fontSize:13,fontWeight:700,color:th.neg}}>{hideNumbers?<span style={{filter:"blur(5px)",userSelect:"none"}}>●●●</span>:fmt(tL)}</div></div><div><div style={{fontSize:10,color:th.dim,marginBottom:2}}>{t.netWorth||"Net Worth"}</div><div style={{fontSize:13,fontWeight:700,color:tA-tL>=0?GOLD:th.neg}}>{hideNumbers?<span style={{filter:"blur(5px)",userSelect:"none"}}>●●●</span>:fmt(tA-tL)}</div></div></div>}{isMobile&&<div style={{flexBasis:"100%",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:8,paddingTop:8,borderTop:`1px solid ${th.cardBorder}`}}><div><div style={{fontSize:9,color:th.dim,marginBottom:1}}>{t.netMo||"Net/mo"}</div><div style={{fontSize:12,fontWeight:700,color:th.pos}}>{hideNumbers?<span style={{filter:"blur(5px)",userSelect:"none"}}>●●●</span>:fmt(n)}</div></div><div><div style={{fontSize:9,color:th.dim,marginBottom:1}}>{t.debt||"Debt"}</div><div style={{fontSize:12,fontWeight:700,color:th.neg}}>{hideNumbers?<span style={{filter:"blur(5px)",userSelect:"none"}}>●●●</span>:fmt(tL)}</div></div><div><div style={{fontSize:9,color:th.dim,marginBottom:1}}>{t.netWorth||"Net Worth"}</div><div style={{fontSize:12,fontWeight:700,color:tA-tL>=0?GOLD:th.neg}}>{hideNumbers?<span style={{filter:"blur(5px)",userSelect:"none"}}>●●●</span>:fmt(tA-tL)}</div></div></div>}{!isMobile&&<span style={{color:th.accent,fontSize:18}}>›</span>}</div>;})} </div></div>;}

/* ── PAGES ───────────────────────────────────────────────────────────────── */
/* ── CLIENT LIST ─ v0.8.0 action-first bulk actions (WORKPLAN §3 Chat 4) ── */
function ClientList({clients,t,onSelect,onAdd,onRestore,onImportNew,onRestoreBackup,onArchiveMany,onRestoreMany,onDeleteMany,onSplit,onJoin}){
  const th=useTh();
  const{isMobile}=useViewport();
  const[search,setSearch]=useState("");
  const[showArch,setShowArch]=useState(false);
  const[importOpen,setImportOpen]=useState(false);
  const[exportOpen,setExportOpen]=useState(false);
  const[restoreOpen,setRestoreOpen]=useState(false);
  // v0.8.0 — action-first bulk flow: pick an action from the ☰ menu FIRST, then select clients.
  // There is no selection UI until a mode is active.
  const[mode,setMode]=useState(null);// null | "archive" | "restore" | "delete"
  const[sel,setSel]=useState(()=>new Set());
  const[confirmOpen,setConfirmOpen]=useState(false);
  const[delText,setDelText]=useState("");
  const[splitPick,setSplitPick]=useState(false);
  const[joinPick,setJoinPick]=useState(false);
  const[pickSearch,setPickSearch]=useState("");
  const[splitTarget,setSplitTarget]=useState(null);
  const[joinTarget,setJoinTarget]=useState(null);
  const[sortBy,setSortBy]=useState("name"); // v0.20.0 — sort options moved here from sidebar hamburger
  const active=clients.filter(c=>!c.archived);
  const archived=clients.filter(c=>c.archived);
  const _searchHit=c=>`${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(search.toLowerCase());
  const _sortFn=(a,b)=>{
    if(sortBy==="debt"){return totalL(b)-totalL(a);}
    if(sortBy==="income"){return sumN(b.incomeStreams||[])-sumN(a.incomeStreams||[]);}
    if(sortBy==="recent"){const aR=Math.max(0,...(a.monthSnapshots||[]).map(s=>+new Date(s.savedAt||0)));const bR=Math.max(0,...(b.monthSnapshots||[]).map(s=>+new Date(s.savedAt||0)));return bR-aR;}
    if(sortBy==="netWorth"){return(totalA(b)-totalL(b))-(totalA(a)-totalL(a));}
    return(a.lastName||"").localeCompare(b.lastName||"")||(a.firstName||"").localeCompare(b.firstName||"");
  };
  const filtered=active.filter(_searchHit).sort(_sortFn);
  // Per-mode selectability — Archive targets active clients, Restore targets archived, Delete targets either.
  const activeSelectable=mode==="archive"||mode==="delete";
  const archivedSelectable=mode==="restore"||mode==="delete";
  const selectablePool=[...(activeSelectable?filtered:[]),...(archivedSelectable?archived:[])];
  const selClients=[...sel].map(id=>clients.find(c=>c.id===id)).filter(Boolean);
  const selCount=selClients.length;
  const allPoolSelected=selectablePool.length>0&&selectablePool.every(c=>sel.has(c.id));
  const MM={
    archive:{icon:"📦",color:th.warn,bar:t.selectToArchive||"Select clients to archive",btn:t.bulkArchiveSel||"Archive",title:t.bulkArchiveTitle||"Archive Clients",q:t.bulkArchiveQ||"Archive these clients? Their data is preserved and can be restored."},
    restore:{icon:"↩",color:th.pos,bar:t.selectToRestore||"Select clients to restore",btn:t.bulkRestoreSel||"Restore",title:t.bulkRestoreTitle||"Restore Clients",q:t.bulkRestoreQ||"Restore these clients to your active client list?"},
    delete:{icon:"🗑️",color:th.neg,bar:t.selectToDelete||"Select clients to delete",btn:t.bulkDeleteSel||"Delete",title:t.bulkDeleteTitle||"Delete Clients",q:t.bulkDeleteQ||"This permanently deletes the clients below and all their data. This cannot be undone."}
  };
  const mm=mode?MM[mode]:null;
  const enterMode=m=>{setSel(new Set());setConfirmOpen(false);setDelText("");setMode(m);if(m==="restore"||m==="delete")setShowArch(true);};
  const exitMode=()=>{setMode(null);setSel(new Set());setDelText("");setConfirmOpen(false);};
  const toggleSel=id=>setSel(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleAll=()=>setSel(p=>{const n=new Set(p);if(allPoolSelected)selectablePool.forEach(c=>n.delete(c.id));else selectablePool.forEach(c=>n.add(c.id));return n;});
  const namesOf=cs=>cs.map(c=>`${c.firstName} ${c.lastName}`+(c.partnerFirst?` & ${c.partnerFirst}`:"")).join(", ");
  const runAction=()=>{
    if(mode==="archive")onArchiveMany([...sel]);
    else if(mode==="restore")onRestoreMany([...sel]);
    else if(mode==="delete"){if(delText!=="DELETE")return;onDeleteMany([...sel]);}
    exitMode();
  };
  const Cbx=({on,color})=><div style={{width:17,height:17,borderRadius:4,flexShrink:0,border:`2px solid ${on?color:th.dim}`,background:on?color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:800}}>{on?"✓":""}</div>;
  const openPicker=which=>{exitMode();setPickSearch("");which==="split"?setSplitPick(true):setJoinPick(true);};
  const closePickers=()=>{setSplitPick(false);setJoinPick(false);setPickSearch("");};
  const pq=c=>`${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(pickSearch.toLowerCase());
  const partnered=active.filter(c=>c.partnerFirst).filter(pq);
  const singles=active.filter(c=>!c.partnerFirst).filter(pq);
  const kebabItems=[
    {label:"📥 "+(t.kebabImportClients||"Import Clients"),onClick:()=>setImportOpen(true)},
    {label:"⬇️ "+(t.kebabExportClients||"Export Clients"),onClick:()=>setExportOpen(true)},
    {divider:true},
    {label:"💾 "+(t.kebabExportBackup||"Backup All"),onClick:()=>expBackup(clients,{})},
    {label:"📥 "+(t.kebabRestoreBackup||"Restore Backup"),onClick:()=>setRestoreOpen(true)},
    {divider:true},
    {label:"📦 "+(t.bulkArchiveSel||"Archive")+"…",onClick:()=>enterMode("archive")},
    {label:"↩ "+(t.bulkRestoreSel||"Restore")+"…",onClick:()=>enterMode("restore")},
    {label:"🗑️ "+(t.bulkDeleteSel||"Delete")+"…",color:th.neg,onClick:()=>enterMode("delete")},
    {divider:true},
    {label:"✂️ "+(t.bulkSplitSel||"Split")+"…",onClick:()=>openPicker("split")},
    {label:"🔗 "+(t.bulkJoinSel||"Join")+"…",onClick:()=>openPicker("join")}
  ];
  return <div style={{padding:isMobile?14:24}}>
    {importOpen&&<ImportWizard onClose={()=>setImportOpen(false)} onImport={cs=>{onImportNew(cs);setImportOpen(false);}} existingClients={clients} t={t}/>}
    {exportOpen&&<ExportModal clients={clients} onClose={()=>setExportOpen(false)} t={t}/>}
    {restoreOpen&&<BackupImportModal onImport={onRestoreBackup} onClose={()=>setRestoreOpen(false)} existingClients={clients} t={t}/>}
    {confirmOpen&&mm&&<Modal title={mm.icon+" "+mm.title} onClose={()=>setConfirmOpen(false)}>
      {mode==="delete"
        ?<div style={{...mCARD(th),padding:14,marginBottom:14,background:th.neg+"11",border:`1px solid ${th.neg}33`}}><div style={{fontSize:13,fontWeight:700,color:th.neg,marginBottom:6}}>⚠️ {t.permanentActionLbl||"This action is permanent"}</div><div style={{fontSize:12,color:th.muted,lineHeight:1.6}}>{mm.q}</div></div>
        :<div style={{fontSize:12,color:th.muted,lineHeight:1.7,marginBottom:14}}>{mm.q}</div>}
      <div style={{...mCARD(th),padding:"10px 14px",fontSize:12,color:th.text,marginBottom:14,maxHeight:170,overflowY:"auto",lineHeight:1.7}}>{namesOf(selClients)}</div>
      {mode==="delete"&&<><div style={{fontSize:11,color:th.muted,marginBottom:6}}>{t.bulkDeleteTypeHint||"Type DELETE to confirm"}</div><input value={delText} onChange={e=>setDelText(e.target.value)} placeholder="DELETE" style={{...mINP(th),width:"100%",boxSizing:"border-box",marginBottom:14}}/></>}
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn onClick={()=>setConfirmOpen(false)}>{t.cancel}</Btn><button onClick={runAction} disabled={mode==="delete"&&delText!=="DELETE"} style={{fontSize:12,padding:"7px 16px",borderRadius:8,background:(mode==="delete"&&delText!=="DELETE")?th.cardBorder:mm.color,color:(mode==="delete"&&delText!=="DELETE")?th.dim:"#fff",border:"none",cursor:(mode==="delete"&&delText!=="DELETE")?"not-allowed":"pointer",fontWeight:700}}>{mm.icon} {mm.btn} ({selCount})</button></div>
    </Modal>}
    {splitPick&&<Modal title={"✂️ "+(t.splitPickTitle||"Split a Client")} onClose={closePickers} width={520}><div style={{fontSize:12,color:th.muted,marginBottom:12}}>{t.splitPickHelp||"Pick a partnered client to split into two separate clients."}</div><input placeholder={"🔍 "+(t.searchClients||"Search clients...")} aria-label={t?.searchClientsPh||"Search clients"} value={pickSearch} onChange={e=>setPickSearch(e.target.value)} style={{...mINP(th),width:"100%",boxSizing:"border-box",marginBottom:10,padding:"6px 12px"}}/><div style={{maxHeight:280,overflowY:"auto"}}>{partnered.map(c=><div key={c.id} onClick={()=>{setSplitTarget(c);closePickers();}} style={{...mCARD(th),padding:"10px 14px",cursor:"pointer",marginBottom:6,display:"flex",alignItems:"center",gap:10}}><div style={{width:32,height:32,borderRadius:99,background:c.color1+"22",color:c.color1,border:`2px solid ${c.color1}44`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,flexShrink:0}}>{c.firstName[0]}{c.lastName[0]}</div><div><div style={{fontWeight:600,color:th.text}}>{c.firstName} {c.lastName} <span style={{color:th.dim,fontWeight:400}}>& {c.partnerFirst}</span></div><div style={{fontSize:11,color:th.dim}}>{c.email}</div></div></div>)}{!partnered.length&&<div style={{textAlign:"center",padding:20,color:th.dim,fontSize:12}}>{t.noPartneredClients||"No partnered clients to split."}</div>}</div><div style={{display:"flex",justifyContent:"flex-end",marginTop:14}}><Btn onClick={closePickers}>{t.cancel}</Btn></div></Modal>}
    {joinPick&&<Modal title={"🔗 "+(t.joinPickTitle||"Join Clients")} onClose={closePickers} width={520}><div style={{fontSize:12,color:th.muted,marginBottom:12}}>{t.joinPickHelp||"Pick a single client, then choose a partner to merge in."}</div><input placeholder={"🔍 "+(t.searchClients||"Search clients...")} aria-label={t?.searchClientsPh||"Search clients"} value={pickSearch} onChange={e=>setPickSearch(e.target.value)} style={{...mINP(th),width:"100%",boxSizing:"border-box",marginBottom:10,padding:"6px 12px"}}/><div style={{maxHeight:280,overflowY:"auto"}}>{singles.map(c=><div key={c.id} onClick={()=>{setJoinTarget(c);closePickers();}} style={{...mCARD(th),padding:"10px 14px",cursor:"pointer",marginBottom:6,display:"flex",alignItems:"center",gap:10}}><div style={{width:32,height:32,borderRadius:99,background:c.color1+"22",color:c.color1,border:`2px solid ${c.color1}44`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,flexShrink:0}}>{c.firstName[0]}{c.lastName[0]}</div><div><div style={{fontWeight:600,color:th.text}}>{c.firstName} {c.lastName}</div><div style={{fontSize:11,color:th.dim}}>{c.email}</div></div></div>)}{!singles.length&&<div style={{textAlign:"center",padding:20,color:th.dim,fontSize:12}}>{t.noSingleClients||"No single clients to join."}</div>}</div><div style={{display:"flex",justifyContent:"flex-end",marginTop:14}}><Btn onClick={closePickers}>{t.cancel}</Btn></div></Modal>}
    {splitTarget&&<SplitAssignModal client={splitTarget} onConfirm={(p1,p2)=>{onSplit(splitTarget.id,p1,p2);setSplitTarget(null);}} onClose={()=>setSplitTarget(null)} t={t}/>}
    {joinTarget&&<JoinModal client={joinTarget} allClients={clients} onConfirm={partner=>{onJoin(joinTarget,partner);setJoinTarget(null);}} onClose={()=>setJoinTarget(null)} t={t}/>}
    {/* v0.25.0 — Clients header: ONE horizontal row on desktop (no inner wrapper, no extra wrap).
        Controls stretch with the page; search grows, sort + kebab + Add hold their natural width. */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:8,marginBottom:14,flexWrap:isMobile?"wrap":"nowrap"}}>
      <input placeholder={"🔍 "+(t.searchClients||"Search...")} aria-label={t?.searchClientsPh||"Search clients"} value={search} onChange={e=>setSearch(e.target.value)} style={{...mINP(th),flex:isMobile?"1 1 100%":"1 1 320px",minWidth:0,padding:"7px 12px",fontSize:12,boxSizing:"border-box"}}/>
      {/* v0.25.1 — sort dropdown is now compact (~180px), label-prefixed once, value reads cleanly */}
      <select value={sortBy} onChange={e=>setSortBy(e.target.value)} title={t?.sortBy||"Sort by"} aria-label={t?.sortBy||"Sort clients by"} style={{...mINP(th),padding:"7px 28px 7px 12px",fontSize:11,fontWeight:600,cursor:"pointer",flex:"0 0 auto",width:isMobile?"100%":190,minWidth:0}}>
        <option value="name">⇅ {t?.sortByName||"Name"}</option>
        <option value="recent">⇅ {t?.sortByRecent||"Recent activity"}</option>
        <option value="debt">⇅ {t?.sortByDebt||"Debt (high→low)"}</option>
        <option value="income">⇅ {t?.sortByIncome||"Income (high→low)"}</option>
        <option value="netWorth">⇅ {t?.sortByNetWorth||"Net worth (high→low)"}</option>
      </select>
      <div style={{flex:"0 0 auto"}}><Kebab items={kebabItems} t={t}/></div>
      <button onClick={onAdd} style={{fontSize:12,padding:"8px 16px",borderRadius:10,background:th.accent,color:"#fff",fontWeight:700,border:"none",cursor:"pointer",flex:"0 0 auto",whiteSpace:"nowrap"}}>＋ {t.addClient}</button>
    </div>
    {mode&&<div style={{display:"flex",alignItems:"center",gap:isMobile?8:12,marginBottom:12,padding:isMobile?"8px 10px":"9px 14px",borderRadius:10,background:mm.color+"14",border:`1px solid ${mm.color}55`,flexWrap:"wrap"}}>
      <span style={{fontSize:13}}>{mm.icon}</span>
      <span style={{fontSize:12,fontWeight:700,color:mm.color,flex:isMobile?"1 1 100%":"none"}}>{mm.bar}</span>
      <div onClick={toggleAll} style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer"}}><Cbx on={allPoolSelected} color={mm.color}/><span style={{fontSize:11,color:th.muted}}>{t.selectAllVisible||"Select all"}</span></div>
      <span style={{fontSize:11,fontWeight:700,color:th.muted}}>{selCount} {t.selectedLbl||"selected"}</span>
      <div style={{marginLeft:isMobile?0:"auto",display:"flex",gap:8,flex:isMobile?"1 1 100%":"none",justifyContent:isMobile?"flex-end":"flex-start"}}>
        <Btn onClick={exitMode}>{t.cancel}</Btn>
        <button onClick={()=>{if(selCount>0){setDelText("");setConfirmOpen(true);}}} disabled={selCount===0} style={{fontSize:12,padding:"7px 16px",borderRadius:8,background:selCount>0?mm.color:th.cardBorder,color:selCount>0?"#fff":th.dim,border:"none",cursor:selCount>0?"pointer":"not-allowed",fontWeight:700}}>{mm.icon} {mm.btn} ({selCount})</button>
      </div>
    </div>}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>{filtered.map(c=>{const selectable=mode!==null&&activeSelectable;const dim=mode!==null&&!selectable;const on=sel.has(c.id);return<div key={c.id} onClick={()=>{if(mode===null)onSelect(c);else if(selectable)toggleSel(c.id);}} style={{...mCARD(th),padding:isMobile?"10px 12px":"12px 16px",display:"flex",alignItems:"center",gap:isMobile?10:12,cursor:(mode===null||selectable)?"pointer":"default",opacity:dim?0.4:1,border:`1px solid ${(on&&mm)?mm.color:th.cardBorder}`,flexWrap:isMobile?"wrap":"nowrap"}}>{selectable&&<Cbx on={on} color={mm.color}/>}<div style={{width:isMobile?34:36,height:isMobile?34:36,borderRadius:99,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,background:c.color1+"22",color:c.color1,border:`2px solid ${c.color1}44`,flexShrink:0}}>{c.firstName[0]}{c.lastName[0]}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:700,color:th.text,overflow:"hidden",textOverflow:"ellipsis"}}>{c.firstName} {c.lastName}{c.partnerFirst&&<span style={{color:th.dim,fontWeight:400}}> & {c.partnerFirst}</span>}</div><div style={{fontSize:11,color:th.dim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.email}{!isMobile&&` · ${(c.monthSnapshots||[]).length} snapshots`}</div></div>{!isMobile&&<span style={{color:th.muted,fontSize:11,flexShrink:0}}>{fmt(sumN(c.incomeStreams))}/mo</span>}{/* v0.25.1 — per-row kebab removed per user request. Use the section kebab + the per-client kebab inside ClientDetail header instead. */}{!isMobile&&mode===null&&<span style={{color:th.accent,fontSize:16,flexShrink:0}}>›</span>}{isMobile&&<div style={{flexBasis:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,paddingTop:6,marginTop:2,borderTop:`1px solid ${th.cardBorder}`,fontSize:11}}><span style={{color:th.dim}}>{(c.monthSnapshots||[]).length} snapshots</span><span style={{color:th.muted,fontWeight:600}}>{fmt(sumN(c.incomeStreams))}/mo</span></div>}</div>;})}{!filtered.length&&<div style={{fontSize:12,color:th.dim,fontStyle:"italic",padding:"8px 2px"}}>{t.noClientsMsg||"No clients found."}</div>}</div>
    {archived.length>0&&<div style={{marginTop:20,borderTop:`1px solid ${th.cardBorder}`,paddingTop:16}}>
      <button onClick={()=>setShowArch(s=>!s)} style={{fontSize:12,fontWeight:700,color:th.warn,background:"transparent",border:"none",cursor:"pointer",marginBottom:10}}>📦 {t.archivedClientsLbl||"Archived Clients"} ({archived.length}) {showArch?"▲":"▼"}</button>
      {showArch&&<div style={{display:"flex",flexDirection:"column",gap:6}}>{archived.map(c=>{const selectable=mode!==null&&archivedSelectable;const dim=mode!==null&&!selectable;const on=sel.has(c.id);return<div key={c.id} onClick={()=>{if(selectable)toggleSel(c.id);}} style={{...mCARD(th),padding:isMobile?"9px 12px":"10px 14px",display:"flex",alignItems:"center",gap:isMobile?10:12,cursor:selectable?"pointer":"default",opacity:dim?0.4:0.85,border:`1px solid ${(on&&mm)?mm.color:th.cardBorder}`,flexWrap:isMobile?"wrap":"nowrap"}}>{selectable&&<Cbx on={on} color={mm.color}/>}<div style={{width:isMobile?32:36,height:isMobile?32:36,borderRadius:99,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,background:th.muted+"22",color:th.muted,border:`2px solid ${th.muted}44`,flexShrink:0,filter:"grayscale(1)"}}>{c.firstName[0]}{c.lastName[0]}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:th.muted,overflow:"hidden",textOverflow:"ellipsis"}}>{c.firstName} {c.lastName}{c.partnerFirst&&<span style={{fontWeight:400}}> & {c.partnerFirst}</span>}</div><div style={{fontSize:11,color:th.dim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.email}</div></div>{mode===null&&<div style={{display:"flex",gap:6,flexBasis:isMobile?"100%":"auto",justifyContent:isMobile?"flex-end":"flex-start"}}><button onClick={e=>{e.stopPropagation();onSelect(c);}} style={{fontSize:11,padding:"4px 10px",borderRadius:7,background:th.inp,color:th.muted,border:`1px solid ${th.cardBorder}`,cursor:"pointer"}}>{t.viewLbl||"View"}</button><button onClick={e=>{e.stopPropagation();onRestore(c.id);}} style={{fontSize:11,padding:"4px 10px",borderRadius:7,background:th.pos+"22",color:th.pos,border:`1px solid ${th.pos}44`,cursor:"pointer",fontWeight:700}}>↩ {t.restoreLbl||"Restore"}</button></div>}</div>;})}</div>}
    </div>}
  </div>;
}
function PromotionsPage({settings,onSettingsChange,t}){
  const th=useTh();
  const INP=mINP(th);
  const promos=Array.isArray(settings.promotions)?settings.promotions:[];
  const services=Array.isArray(settings.services)&&settings.services.length?settings.services:["initial","quarterly","monthly","all"];
  const[editing,setEditing]=useState(null);
  const[draft,setDraft]=useState(null);
  const newPromo=()=>({id:gid(),name:"",type:"percent",value:25,appliesTo:"initial",startDate:"",endDate:"",code:"",clientFilter:"all",active:true,createdAt:new Date().toISOString()});
  const startEdit=p=>{setDraft({...p});setEditing(p.id);};
  const startNew=()=>{const p=newPromo();setDraft(p);setEditing(p.id);};
  const save=()=>{if(!draft.name.trim()){alert("Promotion name is required.");return;}const exists=promos.find(p=>p.id===draft.id);const updated=exists?promos.map(p=>p.id===draft.id?draft:p):[...promos,draft];onSettingsChange({...settings,promotions:updated});setEditing(null);setDraft(null);};
  const cancel=()=>{setEditing(null);setDraft(null);};
  const del=id=>{if(!confirm("Delete this promotion?"))return;onSettingsChange({...settings,promotions:promos.filter(p=>p.id!==id)});};
  const toggleActive=id=>onSettingsChange({...settings,promotions:promos.map(p=>p.id===id?{...p,active:!p.active}:p)});
  const describe=p=>{const val=p.type==="percent"?`${p.value}% off`:p.type==="flat"?`$${p.value} off`:`$${p.value} bundle price`;const when=p.startDate&&p.endDate?`${p.startDate} → ${p.endDate}`:p.startDate?`from ${p.startDate}`:p.endDate?`until ${p.endDate}`:"always active";return`${val} · ${when}`;};
  const isActive=p=>{if(!p.active)return false;const today=new Date().toISOString().slice(0,10);if(p.startDate&&today<p.startDate)return false;if(p.endDate&&today>p.endDate)return false;return true;};
  const Label=({children})=><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:4}}>{children}</div>;
  return<div style={{padding:24}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div>{/* v0.24.0 — page title removed (TopBar shows it). */}<p style={{fontSize:11,color:th.dim,margin:0}}>{t.promotionsDesc}</p></div>
      <BSolid onClick={startNew}>＋ {t.newPromotion||"New Promotion"}</BSolid>
    </div>
    <div style={{...mCARD(th),padding:14,marginBottom:20,background:th.accent+"06"}}>
      <div style={{fontSize:12,color:th.muted,lineHeight:1.7}}>💡 <b>{t.howItWorks||"How promotions work:"}</b> {t.howItWorksDesc||"Active promotions appear on client invoices and on your public flyer/landing page."}</div>
    </div>
    {promos.length===0&&!editing&&<div style={{...mCARD(th),padding:40,textAlign:"center"}}>
      <div style={{fontSize:40,marginBottom:8}}>🏷️</div>
      <div style={{fontSize:14,fontWeight:700,color:th.text,marginBottom:4}}>{t.noPromosTitle||"No promotions yet"}</div>
      <div style={{fontSize:12,color:th.dim,marginBottom:14}}>{t.noPromosDesc||'Click "New Promotion" to create your first discount.'}</div>
    </div>}
    {promos.length>0&&<div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
      {promos.map(p=>{const active=isActive(p);return<div key={p.id} style={{...mCARD(th),padding:14,borderLeft:`4px solid ${active?th.pos:th.dim}`}}>
        {editing===p.id?<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><Label>{(t.promotionName||"Promotion Name")+" *"}</Label><input style={INP} value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))} placeholder='e.g. "New Year Reset 2026"'/></div>
            <div><Label>{(t.promoCode||"Promo Code")+" (optional)"}</Label><input style={INP} value={draft.code} onChange={e=>setDraft(d=>({...d,code:e.target.value.toUpperCase()}))} placeholder="e.g. WELCOME25"/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
            <div><Label>{t.discountTypeLbl||"Discount Type"}</Label><select style={INP} value={draft.type} onChange={e=>setDraft(d=>({...d,type:e.target.value}))}><option value="percent">{t.percentOff||"% off"}</option><option value="flat">{t.flatOff||"$ off"}</option><option value="bundle">{t.bundlePrice||"Bundle price"}</option></select></div>
            <div><Label>{draft.type==="percent"?"% Off":draft.type==="flat"?"$ Off":"Bundle Price ($)"}</Label><MaskedNumInp style={INP} value={draft.value} onChange={e=>setDraft(d=>({...d,value:+e.target.value||0}))} min={0} max={draft.type==="percent"?100:99999} onKeyDown={bE}/></div>
            <div><Label>{t.applyToLbl||"Applies To"}</Label><select style={INP} value={draft.appliesTo} onChange={e=>setDraft(d=>({...d,appliesTo:e.target.value}))}><option value="initial">{t.initialCheckup||"Initial Checkup"}</option><option value="quarterly">{t.quarterlyCheckup||"Quarterly Checkup"}</option><option value="monthly">{t.monthlySubscription||"Monthly Subscription"}</option><option value="yearly">{t.annualBundleLbl||"Annual Bundle"}</option><option value="all">{t.allServices||"All Services"}</option></select></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
            <div><Label>{t.startDateLbl||"Start Date"}</Label><input style={INP} type="date" value={draft.startDate} onChange={e=>setDraft(d=>({...d,startDate:e.target.value}))}/></div>
            <div><Label>{t.endDateLbl||"End Date"}</Label><input style={INP} type="date" value={draft.endDate} onChange={e=>setDraft(d=>({...d,endDate:e.target.value}))}/></div>
            <div><Label>{t.clientFilterLbl||"Client Filter"}</Label><select style={INP} value={draft.clientFilter} onChange={e=>setDraft(d=>({...d,clientFilter:e.target.value}))}><option value="all">{t.allClients||"All clients"}</option><option value="new">{t.newClientsOnly||"New clients only"}</option><option value="health">{t.healthClients||"Health/insurance clients"}</option><option value="referred">{t.referredOnly||"Referred clients only"}</option></select></div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:th.muted,cursor:"pointer"}}><input type="checkbox" checked={draft.active} onChange={e=>setDraft(d=>({...d,active:e.target.checked}))} style={{accentColor:th.pos}}/> {t.active||"Active"}</label>
          </div>
          <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}><Btn onClick={cancel}>{t.cancel||"Cancel"}</Btn><BSolid onClick={save}>{t.save}</BSolid></div>
        </>:<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                <span style={{fontSize:14,fontWeight:800,color:th.text}}>{p.name}</span>
                <Pill color={active?th.pos:th.dim}>{active?("● "+(t.active||"Active")):("○ "+(t.paused||"Inactive"))}</Pill>
                {p.code&&<Pill color={th.accent}>{(t.promoCode||"CODE").toUpperCase()}: {p.code}</Pill>}
              </div>
              <div style={{fontSize:12,color:th.muted}}>{describe(p)}</div>
              {p.endDate&&(()=>{const dl=Math.ceil((new Date(p.endDate)-new Date())/864e5);const col=dl<0?"#6B7280":dl<30?"#EF4444":dl<60?"#F59E0B":"#6B7280";const lbl=dl<0?(t.promoExpired||"Expired"):`${dl} ${t.daysLeft||"days left"}`;return<span style={{display:"inline-block",marginTop:4,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:col+"22",color:col,border:`1px solid ${col}55`}}>{lbl}</span>;})()}
              <div style={{fontSize:11,color:th.dim,marginTop:4}}>{t.appliesToColon||"Applies to:"} <b>{p.appliesTo==="all"?"All services":p.appliesTo}</b>{p.clientFilter!=="all"&&<> · Filter: <b>{p.clientFilter}</b></>}</div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <Btn small onClick={()=>toggleActive(p.id)}>{p.active?(t.pause||"Pause"):(t.activate||"Activate")}</Btn>
              <Btn small onClick={()=>startEdit(p)}>{t.editLabel||"Edit"}</Btn>
              <Btn small onClick={()=>del(p.id)} color={th.neg}>🗑</Btn>
            </div>
          </div>
        </>}
      </div>;})}
    </div>}
    {editing&&!promos.find(p=>p.id===editing)&&<div style={{...mCARD(th),padding:14,marginBottom:20,borderLeft:`4px solid ${th.accent}`}}>
      <div style={{fontSize:13,fontWeight:800,color:th.accent,marginBottom:10}}>＋ {t.newPromotion||"New Promotion"}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <div><Label>{(t.promotionName||"Promotion Name")+" *"}</Label><input style={INP} value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))} placeholder='e.g. "New Year Reset 2026"'/></div>
        <div><Label>{(t.promoCode||"Promo Code")+" (optional)"}</Label><input style={INP} value={draft.code} onChange={e=>setDraft(d=>({...d,code:e.target.value.toUpperCase()}))} placeholder="e.g. WELCOME25"/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
        <div><Label>{t.discountTypeLbl||"Discount Type"}</Label><select style={INP} value={draft.type} onChange={e=>setDraft(d=>({...d,type:e.target.value}))}><option value="percent">{t.percentOff||"% off"}</option><option value="flat">{t.flatOff||"$ off"}</option><option value="bundle">{t.bundlePrice||"Bundle price"}</option></select></div>
        <div><Label>{draft.type==="percent"?"% Off":draft.type==="flat"?"$ Off":"Bundle Price ($)"}</Label><MaskedNumInp style={INP} value={draft.value} onChange={e=>setDraft(d=>({...d,value:+e.target.value||0}))} min={0} max={draft.type==="percent"?100:99999} onKeyDown={bE}/></div>
        <div><Label>{t.applyToLbl||"Applies To"}</Label><select style={INP} value={draft.appliesTo} onChange={e=>setDraft(d=>({...d,appliesTo:e.target.value}))}><option value="initial">{t.initialCheckup||"Initial Checkup"}</option><option value="quarterly">{t.quarterlyCheckup||"Quarterly Checkup"}</option><option value="monthly">{t.monthlySubscription||"Monthly Subscription"}</option><option value="yearly">{t.annualBundleLbl||"Annual Bundle"}</option><option value="all">{t.allServices||"All Services"}</option></select></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
        <div><Label>{t.startDateLbl||"Start Date"}</Label><input style={INP} type="date" value={draft.startDate} onChange={e=>setDraft(d=>({...d,startDate:e.target.value}))}/></div>
        <div><Label>{t.endDateLbl||"End Date"}</Label><input style={INP} type="date" value={draft.endDate} onChange={e=>setDraft(d=>({...d,endDate:e.target.value}))}/></div>
        <div><Label>{t.clientFilterLbl||"Client Filter"}</Label><select style={INP} value={draft.clientFilter} onChange={e=>setDraft(d=>({...d,clientFilter:e.target.value}))}><option value="all">{t.allClients||"All clients"}</option><option value="new">{t.newClientsOnly||"New clients only"}</option><option value="health">{t.healthClients||"Health/insurance clients"}</option><option value="referred">{t.referredOnly||"Referred clients only"}</option></select></div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:th.muted,cursor:"pointer"}}><input type="checkbox" checked={draft.active} onChange={e=>setDraft(d=>({...d,active:e.target.checked}))} style={{accentColor:th.pos}}/> {t.active||"Active"}</label>
      </div>
      <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}><Btn onClick={cancel}>{t.cancel||"Cancel"}</Btn><BSolid onClick={save}>{t.createPromotion||"Create Promotion"}</BSolid></div>
    </div>}
    <div style={{...mCARD(th),padding:16}}>
      <div style={{fontSize:12,fontWeight:700,color:th.dim,marginBottom:10}}>💡 {(t.suggestedTitle||"Suggested Starter Promotions").toUpperCase()}</div>
      <div style={{fontSize:11,color:th.muted,lineHeight:1.8}}>
        <div>• <b>Welcome Discount</b> — 40% off Initial Checkup ($149 → $89) for first 10 clients</div>
        <div>• <b>Health Client Bundle</b> — Free Initial Checkup for existing insurance clients (retention)</div>
        <div>• <b>Referral Reward</b> — 25% off Initial Checkup, code REFERRED25</div>
        <div>• <b>New Year Reset</b> — $99 Initial Checkup, January 1 – January 31</div>
        <div>• <b>Spring Review</b> — $99 Quarterly Checkup, March 15 – April 30</div>
        <div>• <b>Annual Bundle</b> — 4 Quarterly Checkups for $299 (save $97)</div>
      </div>
    </div>
  </div>;
}
function ResourcesPage({t}){const th=useTh();const guides=[{title:t.guideCreditTitle||"Understanding Your Credit Score",desc:t.guideCreditDesc||"How credit scores are calculated and actionable strategies to improve yours.",icon:"📊",url:"https://www.experian.com/blogs/ask-experian/credit-education/score-basics/understanding-credit-scores/"},{title:t.guideDebtTitle||"Debt Payoff Strategies",desc:t.guideDebtDesc||"Avalanche vs. Snowball — which method is right for your situation.",icon:"📉",url:"https://www.nerdwallet.com/article/finance/debt-snowball-vs-avalanche"},{title:t.guideEFTitle||"Building an Emergency Fund",desc:t.guideEFDesc||"Why 3-6 months of expenses matters and how to build it fast.",icon:"🛡️",url:"https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/"},{title:t.guideRetTitle||"Retirement Savings 101",desc:t.guideRetDesc||"Roth IRA, 401k, contribution strategies, and employer matching.",icon:"🎯",url:"https://www.investor.gov/additional-resources/retirement-toolkit"},{title:t.guideHomeTitle||"First-Time Homebuyer Guide",desc:t.guideHomeDesc||"Pre-approval, down payment, DTI requirements, and timing.",icon:"🏠",url:"https://www.consumerfinance.gov/owning-a-home/"},{title:t.guideInvestTitle||"Investment Allocation Basics",desc:t.guideInvestDesc||"Risk tolerance, time horizon, and diversification principles.",icon:"📈",url:"https://www.investor.gov/introduction-investing/getting-started/asset-allocation"}];return<div style={{padding:24}}>{/* v0.24.0 — page title removed (TopBar shows it). */}<p style={{fontSize:11,color:th.dim,marginBottom:16,marginTop:0}}>{t.resourcesDesc}</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14}}>{guides.map(g=><div key={g.title} style={{...mCARD(th),padding:16}}><div style={{fontSize:28,marginBottom:8}}>{g.icon}</div><div style={{fontWeight:700,fontSize:13,color:th.text,marginBottom:6}}>{g.title}</div><div style={{fontSize:11,color:th.muted,lineHeight:1.6,marginBottom:12}}>{g.desc}</div><a href={g.url} target="_blank" rel="noopener noreferrer" style={{fontSize:11,padding:"4px 12px",borderRadius:6,background:th.accent+"22",color:th.accent,border:`1px solid ${th.accent}44`,cursor:"pointer",textDecoration:"none",fontWeight:600,display:"inline-block"}}>{t.openGuide}</a></div>)}</div></div>;}
function ServiceRequestModal({svc,lang,t,onClose}){const th=useTh();const[f,setF]=useState({name:"",email:"",phone:"",message:""});const[sent,setSent]=useState(false);const u=k=>e=>setF(p=>({...p,[k]:e.target.value}));const send=()=>{const sub=encodeURIComponent(`Service Request: ${svc[lang]||svc.en}`);const body=encodeURIComponent(`Name: ${f.name}\nEmail: ${f.email}\nPhone: ${f.phone}\n\n${f.message||"Interested."}`);window.location.href=`mailto:mauricio@goldenanchor.life?subject=${sub}&body=${body}`;setSent(true);setTimeout(onClose,2000);};const INP=mINP(th);return<Modal title={"📋 "+t.requestServiceTitle} onClose={onClose}>{sent?<div style={{textAlign:"center",padding:20,color:th.pos,fontSize:14,fontWeight:700}}>✅ {t.requestSent}</div>:<><div style={{...mCARD(th),padding:12,marginBottom:16,display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:24}}>{svc.icon}</span><div><div style={{fontWeight:700,color:th.text}}>{svc[lang]||svc.en}</div><div style={{fontSize:11,color:th.accent}}>{svc.price}</div></div></div><Field label={t.yourName}><input style={INP} value={f.name} onChange={u("name")}/></Field><Row2><Field label={t.yourEmail}><input style={INP} value={f.email} onChange={u("email")}/></Field><Field label={t.yourPhone}><input style={INP} value={f.phone} onChange={u("phone")}/></Field></Row2><Field label={t.message}><textarea style={{...INP,height:80,resize:"vertical"}} value={f.message} onChange={u("message")} placeholder={t?.tellUsNeedsPh||"Tell us about your needs…"}/></Field><SaveBar onSave={send} onCancel={onClose} t={{...t,save:t.sendRequest}}/></>}</Modal>;}
function AboutPage({t,settings,lang}){const th=useTh();const[reqSvc,setReqSvc]=useState(null);return<div style={{padding:24}}>{reqSvc&&<ServiceRequestModal svc={reqSvc} lang={lang} t={t} onClose={()=>setReqSvc(null)}/>}<div style={{...mCARD(th),padding:24,marginBottom:20,textAlign:"center"}}><div style={{marginBottom:12,display:"flex",justifyContent:"center"}}><img src="/anchor-monogram.svg" style={{width:56,height:56}} alt="Golden Anchor"/></div><div style={{fontSize:22,fontWeight:500,color:GOLD,fontFamily:"'Newsreader',Georgia,serif",letterSpacing:"0.12em",textTransform:"uppercase"}}>Golden Anchor</div><div style={{fontSize:10,color:th.dim,letterSpacing:"0.2em",marginTop:2}}>{t.financialAdvisoryUpper||"FINANCIAL ADVISORY"}</div><div style={{fontSize:13,color:th.muted,marginTop:12,lineHeight:1.7,maxWidth:480,margin:"12px auto 0"}}>{t.aboutDesc}</div></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(420px,1fr))",gap:16,marginBottom:20}}><div style={{...mCARD(th),padding:18}}><div style={{fontSize:15,fontWeight:800,color:th.text,marginBottom:8}}>{settings?.advisorName||"Mauricio Hernandez"}</div><div style={{fontSize:12,color:th.muted,lineHeight:1.7,marginBottom:14}}>{t.advisorBio}</div><div style={{fontSize:12,fontWeight:700,color:th.dim,marginBottom:10}}>🏅 {t.certifications}</div>{CERTS.map(c=><div key={c} style={{fontSize:13,color:th.muted,marginBottom:7,display:"flex",gap:8,alignItems:"flex-start"}}><span style={{color:GOLD,flexShrink:0}}>✓</span><span>{c}</span></div>)}</div><div><div style={{...mCARD(th),padding:18,marginBottom:12}}><div style={{fontSize:12,fontWeight:700,color:th.dim,marginBottom:12}}>🔗 {t.connect}</div>{[{icon:"🌐",label:t.website,val:"goldenanchor.life",href:"https://goldenanchor.life"},{icon:"📸",label:"Instagram",val:`@${settings?.ig||"golden_anchor_inc"}`,href:`https://instagram.com/${settings?.ig||"golden_anchor_inc"}`},{icon:"✉️",label:t.lblEmail||"Email",val:settings?.advisorEmail,href:`mailto:${settings?.advisorEmail}`}].map(l=><div key={l.label} style={{marginBottom:12}}><div style={{fontSize:10,color:th.dim}}>{l.label}</div><a href={l.href} target={l.href?.startsWith("http")?"_blank":"_self"} rel="noreferrer" style={{fontSize:12,color:th.accent,fontWeight:600,textDecoration:"none"}}>{l.val}</a></div>)}</div><div style={{...mCARD(th),padding:18,background:GOLD+"11",border:`1px solid ${GOLD}44`}}><div style={{fontSize:11,fontWeight:700,color:GOLD,marginBottom:8}}>🏷 {t.referralCode||"REFERRAL CODE"}</div><div style={{fontSize:26,fontWeight:800,color:GOLD,letterSpacing:"0.1em",fontFamily:"monospace"}}>GOLDEN-2026</div><div style={{fontSize:11,color:th.muted,marginTop:6}}>{t.referralDesc}</div></div></div></div><div style={{fontSize:14,fontWeight:700,color:th.text,marginBottom:12}}>🛠️ {t.services}</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(540px,1fr))",gap:12}}>{SVCS.map((s,i)=>{const payUrl=settings?.stripeLinks?.[s.id]||"";const hasPay=!!payUrl;return<div key={s.id||i} style={{...mCARD(th),padding:14,display:"flex",flexDirection:"column"}}><div style={{fontSize:22,marginBottom:6}}>{s.icon}</div><div style={{fontWeight:700,fontSize:13,color:th.text,marginBottom:2}}>{s[lang]||s.en}</div><div style={{fontSize:11,color:th.accent,fontWeight:600,marginBottom:6}}>{s.price}</div><div style={{fontSize:11,color:th.muted,lineHeight:1.5,marginBottom:10,flex:1}}>{(lang==="es"&&s.descEs)||s.desc}</div><div style={{display:"flex",gap:6}}><button onClick={()=>setReqSvc(s)} style={{flex:1,fontSize:11,padding:"4px 8px",borderRadius:6,background:th.accent+"22",color:th.accent,border:`1px solid ${th.accent}44`,cursor:"pointer",fontWeight:600}}>📋 {t.requestService}</button>{s.price!=="Free"&&<a href={hasPay?payUrl:undefined} target={hasPay?"_blank":undefined} rel="noreferrer" title={hasPay?(t.payNowOpens||"Opens Stripe Checkout in a new tab"):(t.payNowNotConfigured||"Configure URL in Settings → Stripe Links")} onClick={e=>{if(!hasPay){e.preventDefault();}}} style={{flex:1,fontSize:11,padding:"4px 8px",borderRadius:6,background:hasPay?GOLD+"22":th.inp,color:hasPay?GOLD:th.dim,border:`1px solid ${hasPay?GOLD+"66":th.cardBorder}`,cursor:hasPay?"pointer":"not-allowed",fontWeight:600,textDecoration:"none",textAlign:"center",display:"inline-block"}}>💳 {t.payNow||"Pay Now"}</a>}</div></div>;})}</div></div>;}

/* ── CLIENT DETAIL ───────────────────────────────────────────────────────── */
function ClientDetail({client,onUpdate,lang,t,onBack,startTab,allClients,onSplit,onJoin,onArchive,onDelete,settings,onTabChange}){const th=useTh();const{isMobile}=useViewport();const[tab,setTab]=useState(startTab||"report");const[editOpen,setEditOpen]=useState(false);const[splitOpen,setSplitOpen]=useState(false);const[joinOpen,setJoinOpen]=useState(false);const[archiveConf,setArchiveConf]=useState(false);const[deleteConf,setDeleteConf]=useState(false);const tA=totalA(client),tL=totalL(client);const tabs=[{id:"report",l:"📊 "+t.report},{id:"monthly",l:"📅 "+t.monthly},{id:"financialStatements",l:"📋 "+t.financialStatements},{id:"investments",l:"💹 "+t.investments},{id:"plan",l:(t.strategyPlanHdrEmoji||"📋 Strategy Plan")},{id:"calculators",l:"🧮 Calculators"},{id:"backfill",l:"🔧 Backfill"},{id:"notes",l:"🗒 "+t.notes}];const fileRef=useRef();const tabRowRef=useRef();const[canScrollL,setCanScrollL]=useState(false);const[canScrollR,setCanScrollR]=useState(false);
  useEffect(()=>{const el=tabRowRef.current;if(!el)return;const update=()=>{setCanScrollL(el.scrollLeft>4);setCanScrollR(el.scrollLeft+el.clientWidth<el.scrollWidth-4);};update();el.addEventListener("scroll",update,{passive:true});window.addEventListener("resize",update);return()=>{el.removeEventListener("scroll",update);window.removeEventListener("resize",update);};},[]);const impC=e=>{const f=e.target.files[0];if(!f)return;const reader=new FileReader();reader.onload=ev=>{try{const nc=parseCSV(ev.target.result,client);onUpdate(nc);alert("Imported!");}catch{alert("Invalid CSV.");}};reader.readAsText(f);e.target.value="";};
const[trendMode,setTrendMode]=useState("revolving");// "all"|"revolving"|"current"
const[trendRange,setTrendRange]=useState("6");// "3" | "6" | "12" | "all"
const debtForMode=(snap,useLive)=>{if(useLive){const all=totalL(client);if(trendMode==="all")return all;if(trendMode==="revolving")return client.cards.reduce((s,c)=>s+(+c.balance||0),0);return client.cards.reduce((s,c)=>s+(+c.balance||0),0)+(client.loans||[]).filter(l=>!l.linkedAssetId&&l.type!=="mortgage"&&l.type!=="vehicle").reduce((s,l)=>s+(+l.balance||0),0);}if(!snap?.data){return trendMode==="revolving"?(snap?.debt||0):(snap?.debt||0);}const d=snap.data;if(trendMode==="all")return(d.cards||[]).reduce((s,c)=>s+(+c.balance||0),0)+(d.loans||[]).reduce((s,l)=>s+(+l.balance||0),0);if(trendMode==="revolving")return(d.cards||[]).reduce((s,c)=>s+(+c.balance||0),0);return(d.cards||[]).reduce((s,c)=>s+(+c.balance||0),0)+(d.loans||[]).filter(l=>!l.linkedAssetId&&l.type!=="mortgage"&&l.type!=="vehicle").reduce((s,l)=>s+(+l.balance||0),0);};
const liveSnap={label:"Now",debt:Math.round(debtForMode(null,true)),savings:Math.round(liquidA(client)),cashFlow:Math.round(sumN(client.incomeStreams)-sumB(client.bills)-sumMin(client.cards)),income:Math.round(sumN(client.incomeStreams))};
const _rangeN=trendRange==="3"?3:trendRange==="6"?6:trendRange==="12"?12:(client.monthSnapshots||[]).length;const trendData=[...(client.monthSnapshots||[]).slice(-_rangeN).map(s=>({...s,label:s.label.split(" ")[0]+(s.label.split(" ")[1]?("’"+s.label.split(" ")[1].slice(-2)):""),debt:Math.round(debtForMode(s,false))})),liveSnap];
// v0.13.1 — Sync internal `tab` to startTab prop. Fixes bug where Back/Forward
// changes the URL + parent's `selectedTab` but ClientDetail's internal tab
// state was stuck at whatever the user last clicked. startTab acts as the
// controlled value; this useEffect keeps the local state matching.
useEffect(()=>{if(startTab&&startTab!==tab)setTab(startTab);},[startTab]);
return<HideCtx.Provider value={{hide:client.hideNumbers||false}}><div style={{flex:1,overflowY:"auto"}}>{archiveConf&&<Modal title={client.archived?"↩ Restore Client":"📦 Archive Client"} onClose={()=>setArchiveConf(false)}><div style={{fontSize:12,color:useTh().muted,marginBottom:16,lineHeight:1.7}}>{client.archived?<>Restore <b>{client.firstName} {client.lastName}</b> to your active client list?</>:<>Archive <b>{client.firstName} {client.lastName}</b>? Data is preserved and can be restored.</>}</div><div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn onClick={()=>setArchiveConf(false)}>Cancel</Btn><BSolid onClick={()=>{onArchive(client.id);setArchiveConf(false);onBack();}}>{client.archived?"Restore":"Archive"}</BSolid></div></Modal>}{deleteConf&&<DeleteClientModal client={client} onConfirm={()=>{onDelete(client.id);setDeleteConf(false);onBack();}} onClose={()=>setDeleteConf(false)} t={t}/>}{editOpen&&<ClientForm client={client} onSave={c=>{onUpdate(c);setEditOpen(false);}} onDelete={null} onClose={()=>setEditOpen(false)} t={t}/>}{splitOpen&&client.partnerFirst&&<SplitAssignModal client={client} onConfirm={(p1,p2)=>{onSplit(p1,p2);setSplitOpen(false);}} onClose={()=>setSplitOpen(false)} t={t}/>}{joinOpen&&<JoinModal client={client} allClients={allClients} onConfirm={sel=>{onJoin(client,sel);setJoinOpen(false);}} onClose={()=>setJoinOpen(false)} t={t}/>}<input ref={fileRef} type="file" accept=".csv" onChange={impC} style={{display:"none"}}/><div className="ga-np" style={{padding:isMobile?"12px 14px":"18px 24px",borderBottom:`1px solid ${th.cardBorder}`}}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}><button onClick={onBack} style={{fontSize:12,padding:"5px 12px",borderRadius:8,background:th.inp,color:th.muted,border:`1px solid ${th.cardBorder}`,cursor:"pointer"}}>{t.back}</button><div style={{width:40,height:40,borderRadius:99,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,background:GOLD+"22",color:GOLD,border:`2px solid ${GOLD}44`,flexShrink:0}}>{client.firstName[0]}{client.lastName[0]}</div><div><div style={{fontWeight:700,fontSize:15,color:th.text}}>{client.firstName} {client.lastName}{client.partnerFirst&&<span style={{color:th.muted,fontWeight:400}}> & {client.partnerFirst}</span>}</div><div style={{fontSize:11,color:th.dim}}>{client.email}</div></div><div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}><Kebab items={[{label:"✏️ "+(t.kebabEditClient||"Edit Client"),onClick:()=>setEditOpen(true)},client.partnerFirst?{label:"✂️ "+(t.kebabSplitClient||"Split Client"),onClick:()=>setSplitOpen(true),color:th.warn}:{label:"🔗 "+(t.kebabJoinClient||"Join Client"),onClick:()=>setJoinOpen(true),color:th.pos},{divider:true},{label:"⬆️ "+(t.kebabImportCsv||"Import CSV"),onClick:()=>fileRef.current?.click()},{label:"⬇️ "+(t.kebabExportCsv||"Export CSV"),onClick:()=>expCSV(client)},{label:"💾 "+(t.kebabExportBackup||"Export Backup"),onClick:()=>expBackup([client],{}),color:th.blue},{divider:true},{label:client.archived?"↩ "+(t.kebabUnarchive||"Unarchive"):"📦 "+(t.kebabArchive||"Archive"),onClick:()=>setArchiveConf(true),color:client.archived?th.pos:th.warn},{label:"🗑️ "+(t.kebabDelete||"Delete"),onClick:()=>setDeleteConf(true),color:th.neg}]} t={t}/></div></div><div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr 1fr",gap:10,marginBottom:14}}><SC label={"💼 "+t.totalIncome} value={fmt(sumN(client.incomeStreams))} color={th.pos}/><SC label={"💳 "+t.totalDebt} value={fmt(tL)} color={th.neg}/><SC label={"📊 "+t.totalAssets} value={fmt(tA)} color={th.blue}/><SC label={"💎 "+t.netWorth} value={fmt(tA-tL)} color={tA-tL>=0?th.pos:th.neg}/></div><div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>{/* v0.34.0 — Phase 5: ClientDetail "● live" trend pair now uses SmoothAreaLine.
   Debt vs Savings chart: gold = savings, orange = debt.
   Cash Flow vs Income chart: gold = cash flow (primary), orange = income. */}
{[{k1:"debt",k2:"savings",l:"📈 "+t.debtTrend,c1:"#ED7D31",c2:GOLD},{k1:"cashFlow",k2:"income",l:"💰 "+(t.cashFlowTrend||"Cash Flow Trend"),c1:"#ED7D31",c2:GOLD}].map((ch,ci)=><div key={ci} style={{...mCARD(th),padding:12}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,gap:8,flexWrap:"wrap",rowGap:6}}>
    <span style={{fontSize:11,fontWeight:700,color:th.dim,flex:"0 1 auto",minWidth:0}}>{ch.l} <span style={{fontSize:9,color:th.pos}}>● live</span></span>
    {ci===0&&<div style={{display:"flex",gap:3,flexWrap:"wrap",alignItems:"center",flex:"0 1 auto"}}>{[["3","3m"],["6","6m"],["12","12m"],["all",t.allRange||"All"]].map(([v,l])=><button key={v} onClick={()=>setTrendRange(v)} style={{fontSize:9,padding:"2px 6px",borderRadius:5,background:trendRange===v?GOLD+"22":"transparent",color:trendRange===v?GOLD:th.dim,border:`1px solid ${trendRange===v?GOLD:th.cardBorder}`,cursor:"pointer",fontWeight:trendRange===v?700:400}}>{l}</button>)}<div style={{width:1,height:12,background:th.cardBorder,margin:"0 2px"}}/>{[["all",(t.filterAll||"All")],["revolving",(t.filterRev||"Rev")],["current",(t.filterCur||"Cur")]].map(([v,l])=><button key={v} onClick={()=>setTrendMode(v)} style={{fontSize:9,padding:"2px 6px",borderRadius:5,background:trendMode===v?GOLD+"22":"transparent",color:trendMode===v?GOLD:th.dim,border:`1px solid ${trendMode===v?GOLD:th.cardBorder}`,cursor:"pointer",fontWeight:trendMode===v?700:400}}>{l}</button>)}</div>}
  </div>
  <SmoothAreaLine data={trendData} height={110} debtKey={ch.k1} savingsKey={ch.k2} debtColor={ch.c1} savingsColor={ch.c2}/>
</div>)}</div></div><div style={{padding:isMobile?"0 14px":"0 24px"}}><div className="ga-np" style={{display:"flex",alignItems:"stretch",gap:0,marginBottom:16,borderBottom:`1px solid ${th.cardBorder}`,position:"relative"}}>
  <button onClick={()=>tabRowRef.current?.scrollBy({left:-260,behavior:"smooth"})} title="Scroll left" disabled={!canScrollL} style={{flexShrink:0,width:28,height:36,display:"flex",alignItems:"center",justifyContent:"center",background:canScrollL?th.card:"transparent",border:canScrollL?`1px solid ${th.cardBorder}`:"1px solid transparent",borderBottom:"none",color:canScrollL?th.text:th.dim,cursor:canScrollL?"pointer":"default",opacity:canScrollL?1:0.3,fontSize:14,lineHeight:1,padding:0,borderRadius:"6px 6px 0 0"}}>‹</button>
  <div ref={tabRowRef} style={{flex:1,display:"flex",gap:6,overflowX:"auto",overflowY:"hidden",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",msOverflowStyle:"none",scrollSnapType:"x proximity"}} onWheel={e=>{if(e.deltaY!==0&&Math.abs(e.deltaY)>Math.abs(e.deltaX)){e.currentTarget.scrollLeft+=e.deltaY;}}}>
    <style>{`[ref][style*="scroll-snap-type"]::-webkit-scrollbar{display:none}`}</style>
    {tabs.map(tb=><button key={tb.id} onClick={()=>{setTab(tb.id);onTabChange?.(tb.id);}} style={{flexShrink:0,scrollSnapAlign:"start",fontSize:12,padding:"8px 14px",background:"transparent",border:"none",cursor:"pointer",color:tab===tb.id?th.accent:th.muted,fontWeight:tab===tb.id?700:500,borderBottom:tab===tb.id?`2px solid ${th.accent}`:"2px solid transparent",marginBottom:-1,whiteSpace:"nowrap"}}>{tb.l}</button>)}
  </div>
  <button onClick={()=>tabRowRef.current?.scrollBy({left:260,behavior:"smooth"})} title="Scroll right" disabled={!canScrollR} style={{flexShrink:0,width:28,height:36,display:"flex",alignItems:"center",justifyContent:"center",background:canScrollR?th.card:"transparent",border:canScrollR?`1px solid ${th.cardBorder}`:"1px solid transparent",borderBottom:"none",color:canScrollR?th.text:th.dim,cursor:canScrollR?"pointer":"default",opacity:canScrollR?1:0.3,fontSize:14,lineHeight:1,padding:0,borderRadius:"6px 6px 0 0"}}>›</button>
</div>{tab==="report"&&<ClientReport client={client} onUpdate={onUpdate} lang={lang} t={t} settings={settings}/>}{tab==="monthly"&&<MonthlyTab client={client} onUpdate={onUpdate} lang={lang} t={t} settings={settings}/>}{tab==="financialStatements"&&<FinancialStatementsTab client={client} lang={lang} t={t}/>}{tab==="al"&&<AssetsLiabilitiesTab client={client} lang={lang} t={t}/>}{tab==="investments"&&<InvestmentsTab client={client} onUpdate={onUpdate} t={t}/>}{tab==="plan"&&<FinancialPlanTab client={client} onUpdate={onUpdate} t={t}/>}{tab==="backfill"&&<BackfillTab client={client} onUpdate={onUpdate} t={t}/>}{tab==="calculators"&&<ClientCalculatorsTab client={client} onUpdate={onUpdate} t={t}/>}{tab==="notes"&&<NotesSection client={client} onUpdate={onUpdate} t={t} settings={settings}/>}<div style={{height:40}}/></div></div></HideCtx.Provider>;}

/* ── LOGIN (Supabase Auth) ──────────────────────────────────────────────── */
function Login({onLogin,t,isDark,onToggle}){
  const[em,setEm]=useState("");const[pw,setPw]=useState("");const[err,setErr]=useState("");const[busy,setBusy]=useState(false);const[mode,setMode]=useState("signin");const[info,setInfo]=useState("");
  // Detect Supabase password-recovery callback (URL hash contains type=recovery)
  useEffect(()=>{if(typeof window==="undefined")return;const h=window.location.hash||"";if(h.includes("type=recovery")){setMode("setNew");setInfo(t.resetSetNewIntro||"Enter your new password below.");}},[]);
  const go=async()=>{
    setErr("");setInfo("");
    if(!supabase){setErr((t.supabaseError||"Connection error. Please reload.")+" (env vars missing)");return;}
    setBusy(true);
    try{
      if(mode==="signin"){
        const{data,error}=await supabase.auth.signInWithPassword({email:em,password:pw});
        if(error){setErr(error.message||"Invalid credentials.");setBusy(false);return;}
        if(data?.session?.user){onLogin(data.session.user);}else{setErr("No session.");setBusy(false);}
      }else if(mode==="forgot"){
        if(!em){setErr(t.emailRequired||"Email required.");setBusy(false);return;}
        const redirectTo=(typeof window!=="undefined")?window.location.origin:undefined;
        const{error}=await supabase.auth.resetPasswordForEmail(em,{redirectTo});
        if(error){setErr(error.message||"Reset failed.");setBusy(false);return;}
        setInfo(t.resetEmailSent||"If that email exists in our system, a reset link has been sent. Check your inbox.");
        setBusy(false);
      }else if(mode==="setNew"){
        if(!pw||pw.length<8){setErr(t.passwordMin8||"Password must be at least 8 characters.");setBusy(false);return;}
        const{data,error}=await supabase.auth.updateUser({password:pw});
        if(error){setErr(error.message||"Password update failed.");setBusy(false);return;}
        setInfo(t.resetDone||"Password updated. Signing you in…");
        if(data?.user){setTimeout(()=>{if(typeof window!=="undefined"&&window.location.hash)window.location.hash="";onLogin(data.user);},700);}else{setBusy(false);}
      }
    }catch(e){setErr(e?.message||"Operation failed.");setBusy(false);}
  };
  const INP={background:isDark?"#111827":"#F0F7FF",border:`1px solid ${isDark?"#4B5563":"#CBD5E1"}`,color:isDark?"#F1F5F9":"#0F172A",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",width:"100%",boxSizing:"border-box"};
  const switchMode=(m)=>{setMode(m);setErr("");setInfo("");setPw("");};
  const title=mode==="forgot"?(t.resetPassword||"Reset Password"):mode==="setNew"?(t.setNewPassword||"Set New Password"):(t.signIn||"Sign In");
  const btnLabel=mode==="forgot"?(t.sendResetLink||"Send Reset Link"):mode==="setNew"?(t.updatePassword||"Update Password"):(t.signIn||"Sign In");
  return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:isDark?"linear-gradient(135deg,#0D1724,#1F2937)":"linear-gradient(135deg,#1C3557,#2A4A73)"}}><div style={{width:340}}><div style={{textAlign:"center",marginBottom:32}}><div style={{fontSize:44,marginBottom:8}}>⚓</div><div style={{fontSize:26,fontWeight:500,color:GOLD,fontFamily:"'Newsreader',Georgia,serif",letterSpacing:"0.10em",textTransform:"uppercase"}}>Golden Anchor</div><div style={{fontSize:10,color:"#94A3B8",letterSpacing:"0.2em",marginTop:2}}>{t.financialAdvisoryUpper||"FINANCIAL ADVISORY"}</div></div><div style={{background:isDark?"#1F2937":"#FFFFFF",border:`1px solid ${isDark?"#374151":"#CBD5E1"}`,borderRadius:16,padding:28,boxShadow:"0 32px 80px #0006"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><span style={{fontSize:12,fontWeight:600,color:"#6B7280"}}>{title}</span><button onClick={onToggle} style={{fontSize:11,padding:"3px 10px",borderRadius:8,background:isDark?"#374151":"#EFF6FF",color:isDark?"#9CA3AF":"#1D4ED8",border:"none",cursor:"pointer"}}>{isDark?t.lightMode:t.darkMode}</button></div>{mode!=="setNew"&&<div style={{marginBottom:14}}><label style={{fontSize:11,color:"#6B7280",display:"block",marginBottom:5}}>{t.email}</label><input value={em} onChange={ev=>setEm(ev.target.value)} style={INP} onKeyDown={ev=>ev.key==="Enter"&&!busy&&go()} autoComplete="email"/></div>}{mode!=="forgot"&&<div style={{marginBottom:14}}><label style={{fontSize:11,color:"#6B7280",display:"block",marginBottom:5}}>{mode==="setNew"?(t.newPassword||"New Password"):t.password}</label><input type="password" value={pw} onChange={ev=>setPw(ev.target.value)} style={INP} onKeyDown={ev=>ev.key==="Enter"&&!busy&&go()} autoComplete={mode==="setNew"?"new-password":"current-password"}/></div>}{err&&<div style={{fontSize:11,color:"#EF4444",marginBottom:12,padding:"8px 10px",background:"#EF444411",borderRadius:8}}>{err}</div>}{info&&<div style={{fontSize:11,color:"#10B981",marginBottom:12,padding:"8px 10px",background:"#10B98111",borderRadius:8}}>{info}</div>}<button onClick={go} disabled={busy} style={{width:"100%",padding:12,borderRadius:12,fontWeight:800,fontSize:14,cursor:busy?"wait":"pointer",background:`linear-gradient(135deg,${GOLD},#D4AF37)`,color:"#0D1B2A",border:"none",marginTop:4,opacity:busy?0.7:1}}>{busy?"…":btnLabel}</button>{mode==="signin"&&<div style={{textAlign:"center",marginTop:12}}><button onClick={()=>switchMode("forgot")} style={{background:"transparent",border:"none",color:isDark?"#9CA3AF":"#1D4ED8",fontSize:11,cursor:"pointer",textDecoration:"underline"}}>{t.forgotPassword||"Forgot password?"}</button></div>}{mode==="forgot"&&<div style={{textAlign:"center",marginTop:12}}><button onClick={()=>switchMode("signin")} style={{background:"transparent",border:"none",color:isDark?"#9CA3AF":"#1D4ED8",fontSize:11,cursor:"pointer",textDecoration:"underline"}}>← {t.backToSignIn||"Back to Sign In"}</button></div>}<div style={{marginTop:10,padding:"8px 10px",background:isDark?"#111827":"#F0F7FF",borderRadius:8,fontSize:10,color:"#6B7280"}}>{t.noAccountYet||"Need an account? Contact Mauricio."}</div></div></div></div>;}

/* ── APP ─────────────────────────────────────────────────────────────────── */

// === DEPLOY MARKER — confirms this build is the latest ===

/* ── LogoImg — renders settings logo or brand asset (size-aware per HANDOFF Phase 1) ──
   v0.15.0: when no settings logo is uploaded, falls back to /anchor-monogram.svg at small
   sizes (≤48px — crisp at favicon/sidebar scale) and /logo-anchor.png at larger sizes
   (photographic anchor, looks right at hero/login scale). ⚓ emoji is the final fallback
   only if the asset itself fails to load. */
function LogoImg({settings,mode,size,fallbackColor}){
  const logo = mode==="light" ? (settings?.logoLight||"") : (settings?.logoDark||"");
  const px = size||32;
  if(logo) return <img src={logo} alt="Golden Anchor" style={{height:px,width:"auto",maxWidth:px*2,objectFit:"contain",display:"inline-block",verticalAlign:"middle"}}/>;
  const brandSrc = px<=48 ? "/anchor-monogram.svg" : "/logo-anchor.png";
  return <img src={brandSrc} alt="Golden Anchor" style={{height:px,width:"auto",maxWidth:px*2,objectFit:"contain",display:"inline-block",verticalAlign:"middle"}} onError={e=>{e.currentTarget.replaceWith(Object.assign(document.createElement("span"),{textContent:"⚓",style:`color:${fallbackColor||GOLD};font-size:${px}px`}));}}/>;
}

/* ── SignaturePad — Canvas draw OR typed name+date toggle ── */
function SignaturePad({value,onChange,t,theme,label,defaultName,typedOnly=false}){
  // v0.16.1: default mode is "typed" (was "draw").
  // v0.31.0: `typedOnly` collapses the component to a single typed input — no
  // mode toggle, no canvas. Used on the public intake engagement letter where
  // a typed signature is the only legally-defensible flow.
  const [mode,setMode]=useState((value&&value.kind==="drawn"&&!typedOnly)?"draw":"typed");
  const [typed,setTyped]=useState(value?.kind==="typed"?(value.text||""):(value&&typeof value==="string"?value:(defaultName||"")));
  const canvasRef=useRef(null);
  const isDrawingRef=useRef(false);
  const lastRef=useRef(null);
  const TH=theme||{};
  // v0.29.1 — Auto-commit the prefilled `defaultName` to parent state on mount.
  // v0.31.0 — Also re-commit when defaultName changes (e.g. invite-token resolve
  // updates the prospect's name AFTER SignaturePad first mounted). Without this,
  // typed stays empty if defaultName arrived async.
  useEffect(()=>{
    if(mode==="typed"&&!value&&defaultName&&defaultName.trim()){
      if(!typed||!typed.trim())setTyped(defaultName);
      onChange&&onChange({kind:"typed",text:defaultName,signedAt:new Date().toISOString()});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[defaultName]);
  useEffect(()=>{
    const c=canvasRef.current; if(!c) return;
    const ctx=c.getContext("2d");
    ctx.lineWidth=2; ctx.lineCap="round"; ctx.lineJoin="round";
    ctx.strokeStyle="#0F172A";
    if(value&&value.kind==="drawn"&&value.dataUrl){
      const img=new Image();
      img.onload=()=>{ ctx.clearRect(0,0,c.width,c.height); ctx.drawImage(img,0,0,c.width,c.height); };
      img.src=value.dataUrl;
    }
  },[mode]);
  const getPos=(e)=>{ const c=canvasRef.current; const r=c.getBoundingClientRect(); const sx=c.width/r.width, sy=c.height/r.height; const cx=e.touches?e.touches[0].clientX:e.clientX; const cy=e.touches?e.touches[0].clientY:e.clientY; return {x:(cx-r.left)*sx,y:(cy-r.top)*sy}; };
  const start=(e)=>{ e.preventDefault(); isDrawingRef.current=true; lastRef.current=getPos(e); };
  const move=(e)=>{ if(!isDrawingRef.current) return; e.preventDefault(); const c=canvasRef.current; const ctx=c.getContext("2d"); const p=getPos(e); ctx.beginPath(); ctx.moveTo(lastRef.current.x,lastRef.current.y); ctx.lineTo(p.x,p.y); ctx.stroke(); lastRef.current=p; };
  const end=()=>{ if(!isDrawingRef.current) return; isDrawingRef.current=false; const c=canvasRef.current; const dataUrl=c.toDataURL("image/png"); onChange&&onChange({kind:"drawn",dataUrl,signedAt:new Date().toISOString()}); };
  const clear=()=>{ const c=canvasRef.current; if(!c) return; const ctx=c.getContext("2d"); ctx.clearRect(0,0,c.width,c.height); onChange&&onChange(null); };
  const onTyped=(v)=>{ setTyped(v); onChange&&onChange({kind:"typed",text:v,signedAt:new Date().toISOString()}); };
  return <div style={{border:`1px solid ${TH.cardBorder||"#E2E8F0"}`,borderRadius:10,padding:12,background:TH.card||"#fff"}}>
    {label&&<div style={{fontSize:11,fontWeight:700,color:TH.muted||"#475569",marginBottom:8}}>{label}</div>}
    {!typedOnly&&<div style={{display:"flex",gap:4,marginBottom:8}}>
      <button type="button" onClick={()=>setMode("draw")} style={{flex:1,padding:"6px 10px",fontSize:11,fontWeight:600,borderRadius:6,cursor:"pointer",background:mode==="draw"?(TH.accent||GOLD):"transparent",color:mode==="draw"?"#fff":(TH.muted||"#475569"),border:`1px solid ${mode==="draw"?(TH.accent||GOLD):(TH.cardBorder||"#E2E8F0")}`}}>✍️ {t.sigDrawTab||"Draw signature"}</button>
      <button type="button" onClick={()=>setMode("typed")} style={{flex:1,padding:"6px 10px",fontSize:11,fontWeight:600,borderRadius:6,cursor:"pointer",background:mode==="typed"?(TH.accent||GOLD):"transparent",color:mode==="typed"?"#fff":(TH.muted||"#475569"),border:`1px solid ${mode==="typed"?(TH.accent||GOLD):(TH.cardBorder||"#E2E8F0")}`}}>⌨️ {t.sigTypedTab||"Type name"}</button>
    </div>}
    {mode==="draw"&&!typedOnly?<div>
      <canvas ref={canvasRef} width={500} height={140} style={{width:"100%",height:140,background:"#FFFFFF",border:`1px dashed ${TH.cardBorder||"#CBD5E1"}`,borderRadius:8,touchAction:"none",cursor:"crosshair",display:"block"}} onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
        <span style={{fontSize:10,color:TH.dim||"#94A3B8",fontStyle:"italic"}}>{t.sigDrawHint||"Sign with mouse or finger"}</span>
        <button type="button" onClick={clear} style={{fontSize:10,padding:"3px 8px",borderRadius:5,background:"transparent",color:TH.muted||"#475569",border:`1px solid ${TH.cardBorder||"#E2E8F0"}`,cursor:"pointer"}}>↺ {t.sigClear||"Clear"}</button>
      </div>
    </div>:<div>
      <input value={typed} onChange={e=>onTyped(e.target.value)} placeholder={t.sigTypedPlaceholder||"Type your full legal name"} style={{width:"100%",padding:"10px 12px",fontSize:18,fontFamily:"'Brush Script MT',cursive,serif",fontStyle:"italic",background:"#FFFFFF",border:`1px dashed ${TH.cardBorder||"#CBD5E1"}`,borderRadius:8,color:"#0F172A",outline:"none",boxSizing:"border-box"}}/>
      <div style={{fontSize:10,color:TH.dim||"#94A3B8",marginTop:6,fontStyle:"italic"}}>{t.sigTypedHint||"By typing your name above and submitting, you are signing this document electronically."}</div>
    </div>}
  </div>;
}

/* ── ToSModal — mandatory acceptance gate on first login ── */
function ToSModal({onAccept,onCancel,t,theme}){
  const[checked,setChecked]=useState(false);
  return <div style={{position:"fixed",inset:0,background:"#000a",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:14}}>
    <div style={{background:theme.card,border:`2px solid ${theme.accent}`,borderRadius:16,padding:24,maxWidth:520,width:"100%",boxShadow:"0 32px 80px #0009",maxHeight:"90vh",overflowY:"auto"}}>
      <div style={{fontSize:22,fontWeight:800,color:theme.text,marginBottom:14}}>⚓ {t.tosTitle||"Terms of Service & Privacy"}</div>
      <div style={{fontSize:12,color:theme.muted,lineHeight:1.7,marginBottom:16,padding:"12px",background:theme.bg,borderRadius:8,maxHeight:220,overflowY:"auto"}}>
        <p style={{margin:"0 0 8px"}}><b>Golden Anchor Financial Advisory</b></p>
        <p style={{margin:"0 0 8px"}}>{t.tosBody1||"Welcome. By using this application, you agree to our Terms of Service and Privacy Policy. Golden Anchor provides financial education and coaching. Mauricio Hernandez (FL License FL0215) does not provide investment advisory services, manage securities, or act as a fiduciary unless separately agreed in writing."}</p>
        <p style={{margin:"0 0 4px",fontWeight:600}}>{t.tosKeyTerms||"Key terms:"}</p>
        <ul style={{margin:"4px 0 0 18px",padding:0}}>
          <li>{t.tosBullet1||"Education and coaching — not investment advice"}</li>
          <li>{t.tosBullet2||"Your data is encrypted and confidential"}</li>
          <li>{t.tosBullet3||"Consult professionals for tax, legal, or investment decisions"}</li>
        </ul>
      </div>
      <label style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:18,padding:"10px 12px",background:theme.bg,borderRadius:8,cursor:"pointer"}}>
        <input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)} style={{width:18,height:18,cursor:"pointer",marginTop:2,flexShrink:0}}/>
        <span style={{fontSize:12,color:theme.text,lineHeight:1.5}}>{t.tosAcceptMsg||"I have read and accept the Terms of Service and Privacy Policy"}</span>
      </label>
      <div style={{display:"flex",gap:8}}>
        <button type="button" onClick={onCancel} style={{flex:1,padding:"14px 16px",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",background:"transparent",color:theme.muted,border:`1px solid ${theme.cardBorder}`,minHeight:48}}>{t.tosRejectBtn||"Cancel"}</button>
        <button type="button" onClick={()=>{ if(checked) onAccept(); }} style={{flex:1,padding:"14px 16px",borderRadius:10,fontWeight:800,fontSize:14,cursor:checked?"pointer":"not-allowed",background:checked?GOLD:theme.cardBorder,color:checked?"#0D1B2A":"#fff",border:"none",opacity:checked?1:0.55,minHeight:48,touchAction:"manipulation"}}>{t.tosAcceptBtn||"Accept & Continue"}</button>
      </div>
    </div>
  </div>;
}

/* ── EngagementLetter — renders the full letter with token substitution.
   Section 4 (Compensation & Fees) shows the selected service price.        */
function EngagementLetter({settings,clientName1,clientName2,selectedService,lang,t,theme,signatureClient1,signatureClient2,onSig1,onSig2,readOnly}){
  const TH=theme;
  const L=ENGAGEMENT_LETTER[lang]||ENGAGEMENT_LETTER.en;
  const today=new Date().toLocaleDateString(lang==="es"?"es-US":"en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const greetNames=[clientName1,clientName2].filter(s=>!!s&&s.trim()).join(" & ");
  const greeting = `${lang==="es"?"Estimado/a":"Dear"} ${greetNames||"___________"},`;
  const ctx={
    date: today,
    firmName: settings.companyName || "Golden Anchor Financial Planning & Wealth Management",
    firmPhone: settings.companyPhone || settings.advisorPhone || "(305) 490-6868",
    firmEmail: settings.advisorEmail || "mauricio@goldenanchor.life",
    firmTagline: ELT_DEFAULTS.firmTagline,
    advisorName: settings.advisorName || "Mauricio Hernandez",
    clientGreeting: greeting,
    selectedServiceName: selectedService?.name || "—",
    selectedServicePrice: selectedService?.price || "—",
    ongoingFeeAmount: settings.ongoingFeeAmount || ELT_DEFAULTS.ongoingFeeAmount,
    ongoingFeeMonthlyLite: settings.ongoingFeeMonthlyLite || ELT_DEFAULTS.ongoingFeeMonthlyLite,
    aumPct: settings.aumPct || ELT_DEFAULTS.aumPct,
    aumFrequency: settings.aumFrequency || ELT_DEFAULTS.aumFrequency
  };
  const fill=(s)=>fillTokens(s,ctx);
  const isCouple=!!(clientName2&&clientName2.trim());
  return <div style={{background:"#FFFFFF",color:"#0F172A",padding:"28px 26px",borderRadius:12,fontFamily:"Georgia,serif",lineHeight:1.6,fontSize:13}}>
    {/* Header: advisor name on top, company name below, then contact line (no labels) */}
    <div style={{textAlign:"center",borderBottom:"2px solid #D4A017",paddingBottom:16,marginBottom:18}}>
      <div style={{marginBottom:8}}><LogoImg settings={settings} mode="light" size={56}/></div>
      <div style={{fontSize:24,fontWeight:800,color:"#1F2937",letterSpacing:"0.01em"}}>{ctx.advisorName}</div>
      <div style={{fontSize:14,color:"#475569",marginTop:4}}>{ctx.firmName}</div>
      <div style={{fontSize:13,fontStyle:"italic",color:"#64748B",marginTop:6}}>{L.headerSub}</div>
    </div>
    {/* Contact line — phone · email, no labels */}
    <div style={{textAlign:"center",fontSize:12,color:"#475569",marginBottom:14}}>
      {[ctx.firmPhone, ctx.firmEmail].filter(v=>v&&v!=="—").join(" · ")}
      {ctx.firmTagline && <div style={{fontSize:12,fontStyle:"italic",color:"#94A3B8",marginTop:4}}>{ctx.firmTagline}</div>}
    </div>
    <div style={{fontSize:12,marginBottom:16,fontWeight:600}}>{fill(L.dateLabel)}</div>
    {/* Greeting */}
    <div style={{fontSize:14,marginBottom:12,fontWeight:600}}>{fill(L.greeting)}</div>
    <div style={{marginBottom:12,textAlign:"justify"}}>{L.intro}</div>
    <div style={{marginBottom:14,textAlign:"justify"}}>{L.introCarefully}</div>
    <div style={{marginBottom:6}}>{L.sincerely}</div>
    {/* Advisor signature — v0.31.0 hardened against legacy formats:
       - Legacy strings starting with "data:" or "http" → drawn image
       - Other strings → treated as typed text (was breaking on "Mauricio Hernandez")
       - Empty/null → fall back to advisor name as a typed cursive render so the letter
         always shows SOMETHING (better than placeholder when the advisor's saved sig is mid-migration) */}
    <div style={{marginBottom:24,paddingBottom:6,borderBottom:`1px solid #94A3B855`,minHeight:60}}>
      {(() => {
        const sig = settings.advisorSignature;
        const advisorName = settings.advisorName || ctx.advisorName || "";
        // Empty signature — render advisor name in cursive as a defensible fallback
        if (!sig) {
          return advisorName
            ? <span style={{fontSize:26,fontStyle:"italic",fontFamily:"'Brush Script MT',cursive,serif",color:"#0F172A"}}>{advisorName}</span>
            : <span style={{color:"#94A3B8",fontStyle:"italic"}}>{t.advisorSigPending||"(advisor signature)"}</span>;
        }
        if (typeof sig === "string") {
          if (sig.startsWith("data:") || sig.startsWith("http")) {
            return <img src={sig} alt="advisor signature" style={{height:50,maxWidth:240,objectFit:"contain"}}/>;
          }
          // Legacy: plain string was the typed name. Render in cursive.
          return <span style={{fontSize:26,fontStyle:"italic",fontFamily:"'Brush Script MT',cursive,serif",color:"#0F172A"}}>{sig}</span>;
        }
        if (sig.kind === "drawn" && sig.dataUrl) return <img src={sig.dataUrl} alt="advisor signature" style={{height:50,maxWidth:240,objectFit:"contain"}}/>;
        if (sig.kind === "typed" && sig.text) return <span style={{fontSize:26,fontStyle:"italic",fontFamily:"'Brush Script MT',cursive,serif",color:"#0F172A"}}>{sig.text}</span>;
        return advisorName
          ? <span style={{fontSize:26,fontStyle:"italic",fontFamily:"'Brush Script MT',cursive,serif",color:"#0F172A"}}>{advisorName}</span>
          : <span style={{color:"#94A3B8",fontStyle:"italic"}}>{t.advisorSigPending||"(advisor signature)"}</span>;
      })()}
    </div>
    <div style={{fontSize:13,fontWeight:700,marginBottom:24,paddingTop:0}}>{fill(L.signatureLine)}</div>
    {/* Sections */}
    {L.sections.map(sec=><div key={sec.n} style={{marginBottom:18,pageBreakInside:"avoid"}}>
      <div style={{fontSize:14,fontWeight:800,color:"#1F2937",marginBottom:8,borderBottom:"1px solid #E2E8F0",paddingBottom:4}}>{sec.n}. {sec.title}</div>
      {sec.body && <div style={{marginBottom:8,textAlign:"justify"}}>{sec.body}</div>}
      {sec.sub && sec.sub.map((sb,i)=><div key={i} style={{marginBottom:10,paddingLeft:8}}>
        <div style={{fontWeight:700,marginBottom:4,fontSize:13}}>{sb.t}</div>
        {sb.b && <div style={{marginBottom:6}}>{sb.b}</div>}
        {sb.list && <ul style={{margin:"0 0 6px 18px",padding:0}}>{sb.list.map((li,j)=><li key={j} style={{marginBottom:4}}>{li}</li>)}</ul>}
        {sb.after && <div style={{marginTop:6}}>{sb.after}</div>}
      </div>)}
      {sec.steps && <ol style={{margin:"6px 0 0 22px",padding:0}}>{sec.steps.map((st,i)=><li key={i} style={{marginBottom:6}}><b>{st[0]}.</b> {st[1]}</li>)}</ol>}
      {sec.list && <ul style={{margin:"4px 0 0 18px",padding:0}}>{sec.list.map((li,j)=><li key={j} style={{marginBottom:4}}>{li}</li>)}</ul>}
      {sec.kind==="section4" && sec.section4 && <div style={{margin:"8px 0",padding:"12px 14px",background:"#FEF9E7",border:"1px solid #F0D870",borderRadius:8}}>
        <div style={{marginBottom:8}}>
          <div style={{fontWeight:700}}>{sec.section4.planLabel}: <span style={{color:"#92400E"}}>{ctx.selectedServiceName} — {ctx.selectedServicePrice}</span></div>
          <div style={{fontSize:12,fontStyle:"italic",color:"#475569",marginLeft:8,marginTop:2}}>{sec.section4.planNote}</div>
        </div>
        <div style={{marginBottom:8}}><b>{sec.section4.ongoingLabel}:</b> {fill(sec.section4.ongoingValue)}</div>
        <div><b>{sec.section4.referralLabel}:</b> {sec.section4.referralValue}</div>
      </div>}
      {sec.after && <div style={{marginTop:8,fontStyle:"italic",fontSize:12}}>{sec.after}</div>}
    </div>)}
    {/* Client signatures */}
    <div style={{marginTop:28,paddingTop:18,borderTop:"2px solid #D4A017"}}>
      <div style={{fontSize:14,fontWeight:800,marginBottom:14,color:"#1F2937"}}>{t.clientSignaturesHdr||"Client Signature(s)"}</div>
      {!readOnly && <>
        <div style={{marginBottom:14}}>
          {/* v0.31.0 — Inline the typed signature in the "Client signature: <name>" label.
             When the prospect types their name, it shows in cursive on the bar above the SignaturePad. */}
          <div style={{fontSize:12,fontWeight:700,marginBottom:6,display:"flex",alignItems:"baseline",gap:6,flexWrap:"wrap"}}>
            <span>{t.clientSig1Label||"Client signature"}:</span>
            {signatureClient1?.kind==="typed"&&signatureClient1.text
              ? <span style={{fontSize:22,fontStyle:"italic",fontFamily:"'Brush Script MT',cursive,serif",color:"#0F172A",fontWeight:400,lineHeight:1.1}}>{signatureClient1.text}</span>
              : <span style={{color:"#94A3B8",fontStyle:"italic"}}>{clientName1||"___________"}</span>}
          </div>
          <SignaturePad value={signatureClient1} onChange={onSig1} t={t} theme={TH} defaultName={clientName1} typedOnly={true}/>
        </div>
        {isCouple && <div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,marginBottom:6,display:"flex",alignItems:"baseline",gap:6,flexWrap:"wrap"}}>
            <span>{t.clientSig2Label||"Co-client signature"}:</span>
            {signatureClient2?.kind==="typed"&&signatureClient2.text
              ? <span style={{fontSize:22,fontStyle:"italic",fontFamily:"'Brush Script MT',cursive,serif",color:"#0F172A",fontWeight:400,lineHeight:1.1}}>{signatureClient2.text}</span>
              : <span style={{color:"#94A3B8",fontStyle:"italic"}}>{clientName2||"___________"}</span>}
          </div>
          <SignaturePad value={signatureClient2} onChange={onSig2} t={t} theme={TH} defaultName={clientName2} typedOnly={true}/>
        </div>}
      </>}
      {readOnly && <>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:"#475569"}}>{clientName1||"—"}</div>
          {signatureClient1?.kind==="drawn" && <img src={signatureClient1.dataUrl} alt="sig" style={{height:48,maxWidth:240,border:"1px solid #E2E8F0",borderRadius:6,padding:4,background:"#FFF"}}/>}
          {signatureClient1?.kind==="typed" && <div style={{fontSize:22,fontStyle:"italic",fontFamily:"'Brush Script MT',cursive,serif"}}>{signatureClient1.text}</div>}
          {signatureClient1?.signedAt && <div style={{fontSize:10,color:"#64748B",marginTop:2}}>{(t.signedAtLbl||"Signed")}: {new Date(signatureClient1.signedAt).toLocaleString()}</div>}
        </div>
        {isCouple && <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:"#475569"}}>{clientName2}</div>
          {signatureClient2?.kind==="drawn" && <img src={signatureClient2.dataUrl} alt="sig2" style={{height:48,maxWidth:240,border:"1px solid #E2E8F0",borderRadius:6,padding:4,background:"#FFF"}}/>}
          {signatureClient2?.kind==="typed" && <div style={{fontSize:22,fontStyle:"italic",fontFamily:"'Brush Script MT',cursive,serif"}}>{signatureClient2.text}</div>}
          {signatureClient2?.signedAt && <div style={{fontSize:10,color:"#64748B",marginTop:2}}>{(t.signedAtLbl||"Signed")}: {new Date(signatureClient2.signedAt).toLocaleString()}</div>}
        </div>}
      </>}
    </div>
  </div>;
}


if(typeof window!=="undefined"){window.__GA_BUILD__="2026-05-23-v0340-smooth-area-line";console.log("%c⚓ Golden Anchor build:","color:#D4A017;font-weight:bold",window.__GA_BUILD__);}

/* ── IntakeFormBody — shared editor body used by PublicIntake step 4 and
   IntakeSubmissionEditor modal. Wraps the income/bills/debt/customAssets/
   notes editors against a client-shaped draft, plus SSN + DOB + address +
   how-heard fields. Restored in v0.15.1 — the component was referenced
   since v0.7.1 but never defined (production bug: step 4 went blank). */
function IntakeFormBody({draft,setDraft,t,TH,lang}){
  const INP={width:"100%",padding:"10px 12px",background:TH.inp,border:"1px solid "+TH.inpBorder,color:TH.text,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"};
  const LBL={fontSize:11,color:TH.muted,marginBottom:4,fontWeight:600};
  const Div=()=><div style={{height:1,background:TH.cardBorder,margin:"22px 0"}}/>;
  const up=k=>e=>setDraft(d=>({...d,[k]:e.target.value}));
  const hasP2=!!(draft.partnerFirst&&String(draft.partnerFirst).trim());
  return <ThemeCtx.Provider value={TH}>
    <div style={{fontSize:13,fontWeight:700,color:TH.text,marginBottom:8}}>{t.personalInfoHdr||"Personal information"}</div>
    <div style={{marginBottom:10}}><div style={LBL}>{t.address||"Address"}</div><input style={INP} value={draft.address||""} onChange={up("address")}/></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
      <div><div style={LBL}>{t.dob||"Date of birth"}</div><input type="date" style={INP} value={draft.dob||""} onChange={up("dob")}/></div>
      <div><div style={LBL}>{t.social||"SSN"}</div><input style={INP} value={draft.social||""} onChange={e=>setDraft(d=>({...d,social:fmtSSN?fmtSSN(e.target.value):e.target.value}))} placeholder="XXX-XX-XXXX" autoComplete="off" data-lpignore="true" data-1p-ignore="true"/></div>
    </div>
    {hasP2 && <>
      <div style={{fontSize:11,fontWeight:700,color:TH.dim,marginTop:14,marginBottom:8}}>👤 {draft.partnerFirst||"Partner"} — {t.personalInfoHdr||"Personal info"}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <div><div style={LBL}>{t.dob||"Date of birth"}</div><input type="date" style={INP} value={draft.p2Dob||""} onChange={up("p2Dob")}/></div>
        <div><div style={LBL}>{t.social||"SSN"}</div><input style={INP} value={draft.p2Social||""} onChange={e=>setDraft(d=>({...d,p2Social:fmtSSN?fmtSSN(e.target.value):e.target.value}))} placeholder="XXX-XX-XXXX" autoComplete="off" data-lpignore="true" data-1p-ignore="true"/></div>
      </div>
    </>}
    <div style={{marginTop:12,marginBottom:10}}><div style={LBL}>{t.howHeardLbl||"How did you hear about us?"}</div><input style={INP} value={draft.howHeard||""} onChange={up("howHeard")} placeholder={t.howHeardPlaceholder||"Referral, ad, online search…"}/></div>
    <Div/>
    <IncomeSection client={draft} onUpdate={setDraft} t={t}/>
    <Div/>
    <BillsSection client={draft} onUpdate={setDraft} t={t}/>
    <Div/>
    <DebtSection client={draft} onUpdate={setDraft} t={t}/>
    <Div/>
    <CustomAssetsSection client={draft} onUpdate={setDraft} t={t}/>
    <Div/>
    <div style={{fontSize:13,fontWeight:700,color:TH.text,marginBottom:8}}>📝 {t.goalsAndNotesHdr||"Goals & notes"}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
      <div><div style={LBL}>{t.shortTermLbl||"Short-term (0–1yr)"}</div><textarea style={{...INP,minHeight:60,fontFamily:"inherit",resize:"vertical"}} value={draft.notes?.shortTerm||""} onChange={e=>setDraft(d=>({...d,notes:{...(d.notes||{}),shortTerm:e.target.value}}))}/></div>
      <div><div style={LBL}>{t.midTermLbl||"Mid-term (1–5yr)"}</div><textarea style={{...INP,minHeight:60,fontFamily:"inherit",resize:"vertical"}} value={draft.notes?.midTerm||""} onChange={e=>setDraft(d=>({...d,notes:{...(d.notes||{}),midTerm:e.target.value}}))}/></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
      <div><div style={LBL}>{t.longTermLbl||"Long-term (5+yr)"}</div><textarea style={{...INP,minHeight:60,fontFamily:"inherit",resize:"vertical"}} value={draft.notes?.longTerm||""} onChange={e=>setDraft(d=>({...d,notes:{...(d.notes||{}),longTerm:e.target.value}}))}/></div>
      <div><div style={LBL}>{t.generalNotesLbl||"General notes / anything else we should know"}</div><textarea style={{...INP,minHeight:60,fontFamily:"inherit",resize:"vertical"}} value={draft.notes?.general||""} onChange={e=>setDraft(d=>({...d,notes:{...(d.notes||{}),general:e.target.value}}))}/></div>
    </div>
  </ThemeCtx.Provider>;
}

/* ── PUBLIC INTAKE (Tier-3, v0.7.1 — full parity with old IntakeSection) ── */
/* ── v0.30.0 — Phase 4 public intake redesign — helper components ──────────
   New 5-stage flow: Welcome → Service → Engagement Letter → Your Information → Done modal.
   All helpers defined at top-level per pitfall #17 (no nested-component focus loss).
   Layout split: web (>720px) vs mobile (<=720px) — driven by `isMobile` viewport flag.
   Brand tokens (#C9A84C, JetBrains Mono, Newsreader italic) come from colors_and_type.css. */

// 5-step rail rendered at the top of every intake stage. Numbered circles +
// "›" separators on web; wrapping chips on mobile. The "done" step has no
// number; shows a ✓ glyph when the user lands on it (during the Done modal).
function IntakeStepRail({stage,doneActive,t,TH,isMobile}){
  const STEPS=[
    {k:"welcome",lbl:t.intakeStepWelcome||"Welcome"},
    {k:"service",lbl:t.intakeStepService||"Service"},
    {k:"engagement",lbl:t.intakeStepEngagement||"Engagement"},
    {k:"intake",lbl:t.intakeStepInfo||"Your information"},
    {k:"done",lbl:t.intakeStepDone||"Done"}
  ];
  const order=["welcome","service","engagement","intake","done"];
  const curIdx=order.indexOf(stage);
  if(isMobile){
    return<div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",marginBottom:14}}>
      {STEPS.map((s,i)=>{const here=i===curIdx||(s.k==="done"&&doneActive),done=i<curIdx;return<div key={s.k} style={{padding:"5px 12px",borderRadius:99,fontSize:10,fontWeight:700,border:`1px solid ${here?GOLD:TH.cardBorder}`,background:here?GOLD+"22":"transparent",color:here?GOLD:(done?TH.muted:TH.dim),letterSpacing:"0.02em"}}>{s.k==="done"&&(here||doneActive)?"✓ ":(done?"✓ ":(i+1)+" ")}{s.lbl}</div>;})}
    </div>;
  }
  return<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:0,marginBottom:24,flexWrap:"wrap"}}>
    {STEPS.map((s,i)=>{
      const here=i===curIdx||(s.k==="done"&&doneActive);
      const done=i<curIdx;
      const isDoneStep=s.k==="done";
      return<Fragment key={s.k}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"6px 14px",borderRadius:999,border:`1px solid ${here?GOLD:"transparent"}`,background:here?GOLD+"22":"transparent",color:here?"#0D1B2A":(done?"#755023":TH.dim),fontSize:12,fontWeight:600}}>
          <span style={{width:22,height:22,borderRadius:11,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,background:here?"#0D1B2A":(done?"#755023":TH.cardBorder),color:here?GOLD:"#fff"}}>{isDoneStep?(here||doneActive?"✓":""):(done?"✓":(i+1))}</span>
          <span style={{color:here?GOLD:(done?"#755023":TH.dim)}}>{s.lbl}</span>
        </div>
        {i<STEPS.length-1&&<span style={{width:22,height:1,background:TH.cardBorder,margin:"0 4px"}}/>}
      </Fragment>;
    })}
  </div>;
}

// Selected-service mini card. Used as the right-hand sticky sidebar on web during
// Engagement and Intake stages. Mauricio's "you can change later" affordance.
function IntakeSelectedServiceCard({service,lang,t,TH,showChange,onChange}){
  if(!service)return null;
  return<div style={{background:TH.card,border:`1px solid ${TH.cardBorder}`,borderRadius:12,padding:16,position:"sticky",top:24}}>
    <div style={{fontSize:10,fontWeight:700,color:GOLD,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>{t.intakeSelectedServiceHdr||"Selected service"}</div>
    <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:10}}>
      <div style={{width:46,height:46,borderRadius:8,background:GOLD+"22",border:`1px solid ${GOLD}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{service.icon}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:700,color:TH.text,lineHeight:1.3}}>{service.name}</div>
        <div style={{fontSize:13,fontWeight:800,color:GOLD,marginTop:2,fontVariantNumeric:"tabular-nums"}}>{service.price}</div>
      </div>
    </div>
    {service.desc&&<div style={{fontSize:11,color:TH.muted,lineHeight:1.6,marginBottom:12}}>{service.desc}</div>}
    {showChange&&<button onClick={onChange} style={{fontSize:11,padding:"5px 12px",borderRadius:99,background:"transparent",color:TH.muted,border:`1px solid ${TH.cardBorder}`,cursor:"pointer",fontWeight:600,marginBottom:12}}>← {t.intakeChangeService||"Change"}</button>}
    <div style={{padding:"10px 12px",background:TH.bg,borderRadius:8,border:`1px dashed ${TH.cardBorder}`,fontSize:11,color:TH.dim,lineHeight:1.5,fontStyle:"italic"}}>{t.intakePrivacyHint||"Your information stays encrypted and only your advisor sees it."}</div>
  </div>;
}

// Welcome stage. v0.31.0 — tighter padding, larger hero on web (anchor logo + headline
// share a single full-width band), less empty white. Web: 2-col stays but headline sits
// higher and CTA more prominent. Mobile: same compact phone-frame.
function IntakeWelcomeStage({onStart,advisorSettings,lang,t,TH,isMobile}){
  const tagline=t.taglineSecuring||"Securing Your Health, Anchoring Your Future.";
  const wordmark=(advisorSettings.companyName||"Golden Anchor").toUpperCase();
  if(isMobile){
    return<div style={{maxWidth:520,margin:"0 auto",padding:"0 4px"}}>
      <div style={{background:TH.card,border:`1px solid ${TH.cardBorder}`,borderRadius:16,padding:"22px 20px 24px",textAlign:"center"}}>
        <div style={{marginBottom:10}}><img src="/logo-anchor.png" alt="Golden Anchor" style={{width:120,height:120,objectFit:"contain"}}/></div>
        <div style={{fontSize:17,fontWeight:500,color:GOLD,fontFamily:"'Newsreader',Georgia,serif",letterSpacing:"0.14em"}}>{wordmark}</div>
        <div style={{fontSize:11,fontStyle:"italic",color:GOLD+"BB",fontFamily:"'Newsreader',Georgia,serif",marginTop:4,letterSpacing:"0.02em"}}>{tagline}</div>
        <div style={{height:1,width:48,background:GOLD,margin:"14px auto"}}/>
        <div style={{fontSize:22,fontWeight:500,fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",color:TH.text,lineHeight:1.2,marginBottom:6}}>{t.intakeWelcomeHeadline||(lang==="es"?"Bienvenido a Golden Anchor":"Welcome to Golden Anchor")}</div>
        <div style={{fontSize:13,color:TH.muted,lineHeight:1.6,marginBottom:16,maxWidth:380,margin:"0 auto 16px"}}>{t.intakeWelcomeSub||"Let's start with a few questions so your advisor knows how to help. It takes about 5 minutes."}</div>
        <button onClick={onStart} style={{width:"100%",padding:"14px 24px",borderRadius:8,background:GOLD,color:"#0D1B2A",border:"none",fontSize:14,fontWeight:800,cursor:"pointer",letterSpacing:"0.02em",minHeight:48,touchAction:"manipulation",boxShadow:"0 4px 12px rgba(201,168,76,0.28)"}}>{t.intakeWelcomeStartBtn||(lang==="es"?"Comenzar →":"Start intake →")}</button>
        <div style={{fontSize:11,color:TH.dim,marginTop:12,display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontStyle:"italic"}}>🔒 {t.intakePrivacyLine||(lang==="es"?"Encriptado y privado. Solo lo ve tu asesor.":"Encrypted and private. Only your advisor sees this.")}</div>
      </div>
    </div>;
  }
  // Web: 2-col, hero on right. Tightened padding throughout; larger anchor image.
  return<div style={{maxWidth:1040,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 360px",gap:20,alignItems:"stretch"}}>
    <div style={{background:TH.card,border:`1px solid ${TH.cardBorder}`,borderRadius:16,padding:"30px 32px"}}>
      <div style={{fontSize:10,fontWeight:700,color:GOLD,letterSpacing:"0.10em",textTransform:"uppercase",marginBottom:8}}>{t.intakeWelcomeTag||(lang==="es"?"Admisión pública":"Public intake")}</div>
      <div style={{fontSize:34,fontWeight:500,fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",color:TH.text,lineHeight:1.1,marginBottom:10,letterSpacing:"-0.005em"}}>{t.intakeWelcomeHeadline||(lang==="es"?"Bienvenido a Golden Anchor":"Welcome to Golden Anchor")}</div>
      <div style={{height:1,width:60,background:GOLD,margin:"2px 0 14px"}}/>
      <div style={{fontSize:14,color:TH.muted,lineHeight:1.65,marginBottom:18,maxWidth:480}}>{t.intakeWelcomeSubWeb||(lang==="es"?"Cuéntanos un poco sobre tu situación para que tu asesor llegue preparado a tu primera cita. Toma alrededor de 5 minutos y puedes guardar y volver más tarde.":"Tell us a bit about your situation so your advisor arrives prepared to your first meeting. It takes about 5 minutes; you can save and come back later.")}</div>
      <button onClick={onStart} style={{padding:"14px 28px",borderRadius:8,background:GOLD,color:"#0D1B2A",border:"none",fontSize:14,fontWeight:800,cursor:"pointer",letterSpacing:"0.02em",boxShadow:"0 4px 12px rgba(201,168,76,0.28)"}}>{t.intakeWelcomeStartBtn||(lang==="es"?"Comenzar →":"Start intake →")}</button>
      <div style={{fontSize:12,color:TH.dim,marginTop:14,display:"flex",alignItems:"center",gap:6,fontStyle:"italic"}}>🔒 {t.intakePrivacyLine||(lang==="es"?"Encriptado y privado. Solo lo ve tu asesor.":"Encrypted and private. Only your advisor sees this.")}</div>
    </div>
    <div style={{background:"radial-gradient(at 60% 30%, "+GOLD+"33, transparent 60%), linear-gradient(135deg, #0D1B2A 0%, #1F2937 100%)",border:`1px solid ${TH.cardBorder}`,borderRadius:16,padding:"24px 18px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",minHeight:280}}>
      <img src="/logo-anchor.png" alt="Golden Anchor" style={{width:140,height:140,objectFit:"contain",marginBottom:12}}/>
      <div style={{fontSize:14,fontWeight:500,color:GOLD,fontFamily:"'Newsreader',Georgia,serif",letterSpacing:"0.14em"}}>{wordmark}</div>
      <div style={{height:1,width:48,background:GOLD,margin:"10px auto"}}/>
      <div style={{fontSize:13,fontStyle:"italic",color:"#EDD594",fontFamily:"'Newsreader',Georgia,serif",lineHeight:1.5,maxWidth:260}}>{tagline}</div>
    </div>
  </div>;
}

// Section wrapper used by the new intake form. Numbered gold circle + italic
// Newsreader title + gold-to-transparent hairline.
function IntakeFormSection({n,title,children}){
  const TH=useTh();
  return<div style={{marginBottom:32}}>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
      <span style={{width:26,height:26,borderRadius:13,background:GOLD+"22",border:`1px solid ${GOLD}55`,color:GOLD,fontSize:11,fontWeight:800,display:"inline-flex",alignItems:"center",justifyContent:"center",fontVariantNumeric:"tabular-nums",flexShrink:0}}>{n}</span>
      <span style={{fontSize:18,fontWeight:500,fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",color:TH.text,whiteSpace:"nowrap"}}>{title}</span>
      <span style={{flex:1,height:1,background:`linear-gradient(to right, ${GOLD}55, transparent)`}}/>
    </div>
    {children}
  </div>;
}

// Currency input with $ glyph and gold focus ring. Returns a controlled number.
function IntakeCurrencyInput({value,onChange,placeholder,TH}){
  const[focused,setFocused]=useState(false);
  return<div style={{position:"relative"}}>
    <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:TH.dim,fontSize:13,fontWeight:600,pointerEvents:"none"}}>$</span>
    <input inputMode="decimal" value={value||""} onChange={e=>{const v=e.target.value.replace(/[^0-9.]/g,"");onChange(v);}} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} placeholder={placeholder||"0"} style={{width:"100%",padding:"12px 14px 12px 28px",background:TH.inp,border:`1px solid ${focused?GOLD:TH.inpBorder}`,outline:focused?`2px solid ${GOLD}33`:"none",color:TH.text,borderRadius:8,fontSize:13,boxSizing:"border-box",fontVariantNumeric:"tabular-nums",fontFamily:"'JetBrains Mono',ui-monospace,Menlo,monospace"}}/>
  </div>;
}

// Field label primitive — caps + tracking matches Claude Design.
function IntakeFieldLabel({children}){const TH=useTh();return<div style={{fontSize:10,fontWeight:700,color:TH.muted,marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase"}}>{children}</div>;}

// New simplified 5-section intake form. Replaces the heavy IntakeFormBody for the
// public intake. Captures 12 currency totals + 2 textareas → stored on
// draft.intakeSnapshot. The advisor still gets full edit capability via the
// existing IntakeFormBody when reviewing a submission.
function IntakeFormV2({draft,setDraft,t,TH,lang,prefilledNotice=true}){
  const snap=draft.intakeSnapshot||{};
  const setSnap=(k,v)=>setDraft(d=>({...d,intakeSnapshot:{...(d.intakeSnapshot||{}),[k]:v}}));
  const setField=k=>e=>setDraft(d=>({...d,[k]:e.target.value}));
  const INP={width:"100%",padding:"12px 14px",background:TH.inp,border:`1px solid ${TH.inpBorder}`,color:TH.text,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"};
  const TXT={...INP,minHeight:96,fontFamily:"inherit",resize:"vertical",lineHeight:1.5};
  const isCouple=draft.householdType==="couple";
  return<ThemeCtx.Provider value={TH}>
    {/* 1 — Contact */}
    <IntakeFormSection n={1} title={t.intakeSection1Title||(lang==="es"?"Contacto":"Contact")}>
      {prefilledNotice&&<div style={{padding:"10px 14px",background:GOLD+"11",border:`1px solid ${GOLD}33`,borderRadius:10,fontSize:12,color:TH.text,marginBottom:14,lineHeight:1.5}}>✨ {t.intakePrefilledNote||(lang==="es"?"Tu asesor pre-llenó tu nombre, correo y teléfono desde la invitación. Revísalos y ajústalos si hace falta.":"Your advisor pre-filled your name, email, and phone from the invitation. Review them and tweak if needed.")}</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <div><IntakeFieldLabel>{t.firstNameLbl||"First name"} *</IntakeFieldLabel><input style={INP} value={draft.firstName||""} onChange={setField("firstName")}/></div>
        <div><IntakeFieldLabel>{t.lastNameLbl||"Last name"} *</IntakeFieldLabel><input style={INP} value={draft.lastName||""} onChange={setField("lastName")}/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <div><IntakeFieldLabel>{t.emailLbl||"Email"} *</IntakeFieldLabel><input type="email" style={INP} value={draft.email||""} onChange={setField("email")}/></div>
        <div><IntakeFieldLabel>{t.phoneLbl||"Phone"}</IntakeFieldLabel><input style={INP} value={draft.phone||""} onChange={setField("phone")}/></div>
      </div>
      <div style={{marginBottom:12}}><IntakeFieldLabel>{t.intakeHouseholdLbl||(lang==="es"?"¿Aplicas como individuo o pareja?":"Are you applying as an individual or a couple?")}</IntakeFieldLabel>
        <div style={{display:"flex",gap:8}}>
          {[{id:"single",lbl:t.householdSingle||(lang==="es"?"Solo yo":"Just me"),emoji:"👤"},{id:"couple",lbl:t.householdCouple||(lang==="es"?"Mi pareja y yo":"My partner & me"),emoji:"💑"}].map(opt=><button key={opt.id} type="button" onClick={()=>setDraft(d=>({...d,householdType:opt.id}))} style={{flex:1,padding:"12px 16px",borderRadius:8,border:`2px solid ${draft.householdType===opt.id?GOLD:TH.cardBorder}`,background:draft.householdType===opt.id?GOLD+"22":"transparent",color:TH.text,cursor:"pointer",fontSize:13,fontWeight:600,textAlign:"left",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{opt.emoji}</span>{opt.lbl}</button>)}
        </div>
      </div>
      {isCouple&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <div><IntakeFieldLabel>{t.partnerFirstNameLbl||(lang==="es"?"Nombre de tu pareja":"Partner first name")} *</IntakeFieldLabel><input style={INP} value={draft.partnerFirst||""} onChange={setField("partnerFirst")}/></div>
        <div><IntakeFieldLabel>{t.partnerLastNameLbl||(lang==="es"?"Apellido":"Partner last name")}</IntakeFieldLabel><input style={INP} value={draft.partnerLast||""} onChange={setField("partnerLast")}/></div>
      </div>}
    </IntakeFormSection>
    {/* 2 — Income */}
    <IntakeFormSection n={2} title={t.intakeSection2Title||(lang==="es"?"Ingresos":"Income")}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <div><IntakeFieldLabel>{t.intakeMonthlyNetLbl||(lang==="es"?"Ingreso neto mensual":"Monthly net income")}</IntakeFieldLabel><IntakeCurrencyInput value={snap.monthlyNet} onChange={v=>setSnap("monthlyNet",v)} TH={TH}/><div style={{fontSize:10,color:TH.dim,marginTop:4,fontStyle:"italic"}}>{t.intakeMonthlyNetHint||(lang==="es"?"Después de impuestos — lo que llega a tu cuenta.":"After taxes — what hits your bank account.")}</div></div>
        {isCouple&&<div><IntakeFieldLabel>{t.intakePartnerNetLbl||(lang==="es"?"Neto mensual de tu pareja":"Partner monthly net")}</IntakeFieldLabel><IntakeCurrencyInput value={snap.partnerMonthlyNet} onChange={v=>setSnap("partnerMonthlyNet",v)} TH={TH}/></div>}
      </div>
      <div><IntakeFieldLabel>{t.intakeOtherIncomeLbl||(lang==="es"?"Otros ingresos (renta, extras, etc.)":"Other income (rental, side, etc.)")}</IntakeFieldLabel><IntakeCurrencyInput value={snap.otherIncome} onChange={v=>setSnap("otherIncome",v)} TH={TH}/></div>
    </IntakeFormSection>
    {/* 3 — Debts */}
    <IntakeFormSection n={3} title={t.intakeSection3Title||(lang==="es"?"Deudas y obligaciones":"Debts & liabilities")}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <div><IntakeFieldLabel>{t.intakeTotalCardsLbl||(lang==="es"?"Balance total de tarjetas de crédito":"Total credit-card balances")}</IntakeFieldLabel><IntakeCurrencyInput value={snap.totalCards} onChange={v=>setSnap("totalCards",v)} TH={TH}/></div>
        <div><IntakeFieldLabel>{t.intakeTotalLoansLbl||(lang==="es"?"Préstamos (auto, estudios, personales)":"Total loans (car, student, personal)")}</IntakeFieldLabel><IntakeCurrencyInput value={snap.totalLoans} onChange={v=>setSnap("totalLoans",v)} TH={TH}/></div>
      </div>
      <div><IntakeFieldLabel>{t.intakeMortgageLbl||(lang==="es"?"Saldo de hipoteca":"Mortgage balance")}</IntakeFieldLabel><IntakeCurrencyInput value={snap.mortgage} onChange={v=>setSnap("mortgage",v)} TH={TH}/></div>
    </IntakeFormSection>
    {/* 4 — Assets */}
    <IntakeFormSection n={4} title={t.intakeSection4Title||(lang==="es"?"Activos e inversiones":"Assets & investments")}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <div><IntakeFieldLabel>{t.intakeCheckingLbl||(lang==="es"?"Cuenta corriente y ahorros":"Checking & savings")}</IntakeFieldLabel><IntakeCurrencyInput value={snap.checking} onChange={v=>setSnap("checking",v)} TH={TH}/></div>
        <div><IntakeFieldLabel>{t.intakeRetirementLbl||(lang==="es"?"Cuentas de retiro (401k / IRA)":"Retirement accounts (401k / IRA)")}</IntakeFieldLabel><IntakeCurrencyInput value={snap.retirement} onChange={v=>setSnap("retirement",v)} TH={TH}/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <div><IntakeFieldLabel>{t.intakeBrokerageLbl||(lang==="es"?"Inversiones de corretaje / brokerage":"Brokerage / taxable investments")}</IntakeFieldLabel><IntakeCurrencyInput value={snap.brokerage} onChange={v=>setSnap("brokerage",v)} TH={TH}/></div>
        <div><IntakeFieldLabel>{t.intakeHomeEquityLbl||(lang==="es"?"Equity de la casa (valor − hipoteca)":"Real-estate equity (home value − mortgage)")}</IntakeFieldLabel><IntakeCurrencyInput value={snap.homeEquity} onChange={v=>setSnap("homeEquity",v)} TH={TH}/></div>
      </div>
      <div><IntakeFieldLabel>{t.intakeOtherAssetsLbl||(lang==="es"?"Otros activos (carros, joyas, valiosos)":"Other assets (vehicles, valuables)")}</IntakeFieldLabel><IntakeCurrencyInput value={snap.otherAssets} onChange={v=>setSnap("otherAssets",v)} TH={TH}/></div>
    </IntakeFormSection>
    {/* 5 — Goals */}
    <IntakeFormSection n={5} title={t.intakeSection5Title||(lang==="es"?"Metas y notas":"Goals & notes")}>
      <div style={{marginBottom:14}}><IntakeFieldLabel>{t.intakeGoalsHelpLbl||(lang==="es"?"¿Con qué quieres que tu asesor te ayude?":"What do you want help with?")}</IntakeFieldLabel><textarea style={TXT} rows={4} value={snap.goalsHelp||""} onChange={e=>setSnap("goalsHelp",e.target.value)} placeholder={t.intakeGoalsHelpPh||(lang==="es"?"p. ej. bajar deudas de tarjeta, comprar casa en 18 meses…":"e.g. pay down credit cards, buy a home in 18 months…")}/></div>
      <div><IntakeFieldLabel>{t.intakeOtherInfoLbl||(lang==="es"?"¿Algo más que tu asesor deba saber?":"Anything else your advisor should know?")}</IntakeFieldLabel><textarea style={TXT} rows={4} value={snap.otherInfo||""} onChange={e=>setSnap("otherInfo",e.target.value)} placeholder={t.intakeOtherInfoPh||(lang==="es"?"Cambios de trabajo, eventos próximos, dependientes, salud…":"Upcoming life events, job changes, dependents, health considerations…")}/></div>
    </IntakeFormSection>
  </ThemeCtx.Provider>;
}

// Done modal — overlay confirmation that keeps the underlying form mounted.
// Triggered when Submit or Pay Now lands. v0.31.0: dropped reference token +
// "Submit another" — added "You can safely close this tab" line.
function IntakeDoneModal({open,onClose,lang,t,TH,payingNow,noPaymentLink}){
  useEffect(()=>{if(!open)return;const h=e=>{if(e.key==="Escape")onClose();};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[open,onClose]);
  if(!open)return null;
  const mainCopy=payingNow?
    (noPaymentLink
      ? (t.intakeDonePayMissing||(lang==="es"?"Tu intake llegó. Tu asesor te enviará el enlace de pago directamente.":"Your intake is in. Your advisor will send you the payment link directly."))
      : (t.intakeDoneSubPay||(lang==="es"?"Te estamos redirigiendo al pago seguro en una nueva pestaña. También te enviamos una copia de la carta de compromiso a tu correo.":"Redirecting you to secure checkout in a new tab. We've also emailed you a copy of the engagement letter."))
    )
    : (t.intakeDoneSub||(lang==="es"?"Tu asesor revisará tu información y te contactará en un día hábil. Te enviamos una copia de la carta de compromiso firmada a tu correo.":"Your advisor will review and reach out within one business day. We've emailed you a copy of the signed engagement letter."));
  return<div role="dialog" aria-modal="true" style={{position:"fixed",inset:0,background:"rgba(13,27,42,0.72)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:18,animation:"ga-fade 200ms ease"}}>
    <div style={{background:"#fff",border:`1px solid ${TH.cardBorder}`,borderRadius:20,padding:isMobileViewport()?"32px 22px":"40px 36px",maxWidth:480,width:"100%",boxShadow:"0 32px 80px rgba(0,0,0,0.45)",animation:"ga-modal-pop 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",textAlign:"center",color:"#0F172A"}}>
      <div style={{width:76,height:76,borderRadius:38,background:"#10B98122",border:"1px solid #10B98155",color:"#10B981",fontSize:36,display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:800,marginBottom:18}}>✓</div>
      <div style={{fontSize:28,fontWeight:500,fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",lineHeight:1.1,marginBottom:8,color:"#0F172A"}}>{t.intakeDoneTitle||(lang==="es"?"¡Recibimos tu información!":"Submission received")}</div>
      <div style={{height:1,width:60,background:GOLD,margin:"14px auto 18px"}}/>
      <div style={{fontSize:13,color:"#475569",lineHeight:1.6,marginBottom:14,maxWidth:400,margin:"0 auto 14px"}}>{mainCopy}</div>
      <div style={{fontSize:12,color:"#64748B",fontStyle:"italic",marginTop:6}}>{t.intakeDoneCloseTab||(lang==="es"?"Ya puedes cerrar esta pestaña.":"You can safely close this tab.")}</div>
    </div>
  </div>;
}

// Helper for the modal to detect mobile viewport (avoids prop-drilling).
function isMobileViewport(){return typeof window!=="undefined"&&window.innerWidth<720;}

function PublicIntake(){
  const urlParams=typeof window!=="undefined"?new URLSearchParams(window.location.search):new URLSearchParams("");
  const inviteToken=urlParams.get("invite")||urlParams.get("token")||"";
  const promoFromUrl=urlParams.get("promo")||"";
  const[resolvedAdvisorId,setResolvedAdvisorId]=useState(urlParams.get("advisor")||"");
  const[resolvedSettings,setResolvedSettings]=useState(null);
  const advisorId=resolvedAdvisorId;
  const initialLang=(urlParams.get("lang")||"en").toLowerCase()==="es"?"es":"en";
  const[lang,setLang]=useState(initialLang);
  const t=T[lang]||T.en;
  // v0.30.0 — 5-stage flow: welcome → service → engagement → intake → done modal.
  // Old "household" step is gone; its content (name/email/phone + couple toggle)
  // is now Section 1 of the IntakeFormV2.
  const[step,setStep]=useState("welcome");
  const[draft,setDraft]=useState(()=>mk({recommendedBy:"",howHeard:"",preferredService:"",contactMethod:"email",householdType:"single",intakeSnapshot:{}}));
  const householdType=draft.householdType||"single";
  const[selectedServiceId,setSelectedServiceId]=useState("");
  const[promoCode,setPromoCode]=useState(promoFromUrl);
  const[sig1,setSig1]=useState(null);
  const[sig2,setSig2]=useState(null);
  const[submitting,setSubmitting]=useState(false);
  const[submitted,setSubmitted]=useState(false);
  const[payingNow,setPayingNow]=useState(false);
  const[noPaymentLink,setNoPaymentLink]=useState(false);
  const[err,setErr]=useState("");
  const[inviteResolved,setInviteResolved]=useState(!inviteToken);
  const[inviteError,setInviteError]=useState("");
  const vp=useViewport();
  const isMobile=vp.isMobile;
  // v0.31.0 — Browser back navigation. Pushes a history entry on each step
  // transition and listens for popstate so the back button walks through the
  // flow naturally. Initial mount uses replaceState so back from welcome
  // exits the intake (returns to the previous page).
  useEffect(()=>{
    if(typeof window==="undefined")return;
    if(!window.history.state||!window.history.state.gaIntakeStep){
      window.history.replaceState({gaIntakeStep:"welcome"},"",window.location.href);
    }
    const onPop=(e)=>{
      const target=e?.state?.gaIntakeStep;
      if(target==="welcome"||target==="service"||target==="engagement"||target==="intake"){
        setStep(target);
        setErr("");
      }
    };
    window.addEventListener("popstate",onPop);
    return()=>window.removeEventListener("popstate",onPop);
  },[]);
  const goToStep=(newStep)=>{
    if(typeof window!=="undefined"){
      try{window.history.pushState({gaIntakeStep:newStep},"",window.location.href);}catch{}
    }
    setStep(newStep);
  };
  useEffect(()=>{if(!inviteToken)return;let cancelled=false;(async()=>{
    const r=await gaResolveIntakeInvite(inviteToken);
    if(cancelled)return;
    if(!r.ok){setInviteError(r.error||"invite-resolve-failed");setInviteResolved(true);return;}
    setResolvedAdvisorId(r.advisorId||resolvedAdvisorId);
    if(r.advisorProfile)setResolvedSettings(r.advisorProfile);
    else if(r.advisorSettings)setResolvedSettings(r.advisorSettings);
    if(r.lang==="es"||r.lang==="en")setLang(r.lang);
    // v0.32.0 — prefill prospect + partner from the invite row. Both members
    // of a couple invite land in the engagement letter greeting, both signatures
    // (defaultName auto-commits), and the Contact section on Tab 4.
    const pFirst=(r.prospectName||"").trim().split(" ")[0]||"";
    const pLast=((r.prospectName||"").trim().split(" ").slice(1).join(" "))||"";
    const partnerFirst=(r.partnerName||"").trim().split(" ")[0]||"";
    const partnerLast=((r.partnerName||"").trim().split(" ").slice(1).join(" "))||"";
    setDraft(d=>({
      ...d,
      firstName:d.firstName||pFirst,
      lastName:d.lastName||pLast,
      email:d.email||r.prospectEmail||"",
      phone:d.phone||r.prospectPhone||"",
      householdType:d.householdType==="couple"||r.householdType==="couple"?"couple":(d.householdType||"single"),
      partnerFirst:d.partnerFirst||partnerFirst,
      partnerLast:d.partnerLast||partnerLast,
      partnerEmail:d.partnerEmail||r.partnerEmail||"",
      partnerPhone:d.partnerPhone||r.partnerPhone||""
    }));
    setInviteResolved(true);
  })();return()=>{cancelled=true;};},[inviteToken]);
  const[mode,setMode]=useState(()=>{if(typeof window==="undefined")return "dark";try{return window.localStorage.getItem("ga_intake_mode")||"dark";}catch(e){return "dark";}});
  const isDark=mode==="dark";
  const TH=isDark?{bg:"#0D1B2A",text:"#fff",muted:"#94A3B8",dim:"#64748B",pos:"#10B981",neg:"#EF4444",accent:GOLD,card:"#1A2940",cardBorder:"#1F2C44",inp:"#0F1E33",inpBorder:"#1F2C44",modal:"#1A2940",warn:"#F59E0B",blue:"#3B82F6",nav:"#1A2940",navBorder:"#1F2C44",sideText:"#fff",sideMuted:"#94A3B8"}:{bg:"#F8FAFC",text:"#0F172A",muted:"#475569",dim:"#94A3B8",pos:"#059669",neg:"#DC2626",accent:"#B8860B",card:"#FFFFFF",cardBorder:"#E2E8F0",inp:"#F1F5F9",inpBorder:"#CBD5E1",modal:"#FFFFFF",warn:"#D97706",blue:"#2563EB",nav:"#FFFFFF",navBorder:"#E2E8F0",sideText:"#0F172A",sideMuted:"#475569"};
  useEffect(()=>{if(typeof document!=="undefined"){document.documentElement.style.background=TH.bg;document.body.style.background=TH.bg;document.body.style.margin="0";}try{window.localStorage.setItem("ga_intake_mode",mode);}catch(e){}},[mode,TH.bg]);
  const advisorSettings = resolvedSettings || {};
  const services = (advisorSettings.services && advisorSettings.services.length) ? advisorSettings.services : SVCS.map(v=>({id:v.id,icon:v.icon,name:lang==="es"?v.es:v.en,price:v.price,stripeUrl:(advisorSettings.stripeLinks||{})[v.id]||v.payUrl||"",payUrl:(advisorSettings.stripeLinks||{})[v.id]||v.payUrl||"",desc:lang==="es"?v.descEs:v.desc}));
  const selectedService = services.find(sv=>sv.id===selectedServiceId);
  if(!advisorId){return<div style={{minHeight:"100dvh",background:TH.bg,color:TH.text,display:"flex",alignItems:"center",justifyContent:"center",padding:24,flexDirection:"column",gap:14,textAlign:"center",fontFamily:"system-ui,sans-serif"}}><div style={{fontSize:48,color:GOLD}}>⚓</div><div style={{fontSize:16,fontWeight:700,maxWidth:480}}>{t.intakeInvalidLink||"This intake link is invalid or expired."}</div><div style={{fontSize:12,color:TH.muted,maxWidth:480}}>{t.intakeContactAdvisor||"Please contact your advisor directly."}</div></div>;}
  // v0.33.0 — Public intake unified on the Claude Design gold palette regardless
  // of light/dark mode. The advisor-side IntakeFormBody (income/bills/debt/assets
  // sections) used `th.accent` (dark goldenrod #B8860B in light, plain GOLD in dark)
  // and `th.blue` (#2563EB) for some accents — both reading as wrong on the prospect's
  // intake. Force `accent`, `blue`, and a couple of neutral tones onto the brand gold
  // chain so the restored advisor-form chrome matches the welcome/service/engagement
  // stages above it.
  const synthTheme={bg:TH.bg,nav:TH.card,navBorder:TH.cardBorder,card:TH.card,cardBorder:TH.cardBorder,modal:TH.modal,inp:TH.inp,inpBorder:TH.inpBorder,text:TH.text,muted:TH.muted,dim:TH.dim,sideText:TH.text,sideMuted:TH.muted,accent:GOLD,pos:TH.pos,neg:TH.neg,warn:TH.warn,blue:GOLD};
  // Submit fires from the Intake stage's Submit or Pay Now buttons. Done modal
  // (overlay) renders on success — form stays mounted underneath so Esc/back
  // resets cleanly.
  const goSubmit=async(payNow)=>{
    setErr("");
    if(!draft.firstName?.trim()){setErr(t.intakeFirstReq||"First name required.");return;}
    if(!draft.lastName?.trim()){setErr(t.intakeLastReq||"Last name required.");return;}
    if(!draft.email?.trim()||!vEmail(draft.email)){setErr(t.intakeEmailReq||"Valid email required.");return;}
    if(householdType==="couple"&&!String(draft.partnerFirst||"").trim()){setErr(t.intakePartnerFirstReq||"Partner first name required.");return;}
    setSubmitting(true);
    setPayingNow(!!payNow);
    const payload={...draft,monthSnapshots:[],savedCalcs:[],savedCompare:null,savedPortfolio:null,householdType,selectedServiceId,promoCode,engagementLetter:{signedAt:new Date().toISOString(),signature1:sig1,signature2:householdType==="couple"?sig2:null,version:"v1"}};
    delete payload.id;delete payload.archived;delete payload.hideNumbers;delete payload.currentMonthLabel;
    const res=await gaSubmitIntake(advisorId,lang,payload);
    if(res.ok){
      if(inviteToken&&res.submissionId){gaMarkIntakeInviteSubmitted(inviteToken,res.submissionId);}
      setSubmitted(true);
      // v0.31.0 — Fire engagement-copy email in the background. Server picks
      // up advisor settings + this submission and emails the prospect + advisor
      // a copy of the filled letter. Non-blocking — UX continues even if email fails.
      try{
        if(typeof window!=="undefined"&&typeof fetch==="function"){
          fetch("/api/send-engagement-copy",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({advisorId,submissionId:res.submissionId||null,inviteToken:inviteToken||null,lang})}).catch(()=>{});
        }
      }catch{}
      if(payNow){
        const stripeUrl=(selectedService&&(selectedService.payUrl||selectedService.stripeUrl))||"";
        if(stripeUrl){
          try{
            const url=new URL(stripeUrl);
            if(promoCode)url.searchParams.set("prefilled_promo_code",promoCode);
            if(draft.email)url.searchParams.set("prefilled_email",draft.email);
            setTimeout(()=>{window.open(url.toString(),"_blank","noopener,noreferrer");},600);
            setNoPaymentLink(false);
          }catch(e){
            setNoPaymentLink(true);
          }
        }else{
          setNoPaymentLink(true);
        }
      }
    }else{setErr(t.intakeError||"Submission failed. Please try again.");setSubmitting(false);}
  };
  // Step navigation. v0.31.0 — uses goToStep so each transition pushes a history entry.
  const next=()=>{
    setErr("");
    if(step==="welcome"){goToStep("service");return;}
    if(step==="service"){
      if(!selectedServiceId){setErr(t.intakePickService||"Please pick a service.");return;}
      goToStep("engagement");return;
    }
    if(step==="engagement"){
      const sigEmpty=s=>!s||(s.kind==="typed"&&!s.text?.trim())||(s.kind==="drawn"&&!s.dataUrl);
      if(sigEmpty(sig1)){setErr(t.intakeSigRequired||"Your signature is required.");return;}
      if(householdType==="couple"&&sigEmpty(sig2)){setErr(t.intakeSig2Required||"Both signatures are required for a couple.");return;}
      goToStep("intake");return;
    }
  };
  const back=()=>{
    setErr("");
    if(typeof window!=="undefined"&&window.history.length>1){window.history.back();return;}
    if(step==="service")goToStep("welcome");
    else if(step==="engagement")goToStep("service");
    else if(step==="intake")goToStep("engagement");
  };
  const resetFlow=()=>{setSubmitted(false);setSubmitting(false);setPayingNow(false);setNoPaymentLink(false);goToStep("welcome");setSelectedServiceId("");setSig1(null);setSig2(null);setErr("");setDraft(()=>mk({recommendedBy:"",howHeard:"",preferredService:"",contactMethod:"email",householdType:"single",intakeSnapshot:{}}));};
  // Inputs reused across stages
  const showSidebar=!isMobile&&(step==="engagement"||step==="intake")&&!!selectedService;
  return<ThemeCtx.Provider value={synthTheme}>
    <div style={{minHeight:"100dvh",background:TH.bg,color:TH.text,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",padding:isMobile?"20px 14px":"24px 24px",lineHeight:1.5,WebkitTextSizeAdjust:"100%"}}>
      <div style={{maxWidth:1080,margin:"0 auto"}}>
        {/* Top toolbar — theme + lang toggle */}
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:6,gap:6}}>
          <button onClick={()=>setMode(m=>m==="dark"?"light":"dark")} style={{background:"transparent",border:"1px solid "+TH.cardBorder,color:TH.muted,padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>{isDark?"☀️ "+(t.lightMode||"Light"):"🌙 "+(t.darkMode||"Dark")}</button>
          <button onClick={()=>setLang(l=>l==="en"?"es":"en")} style={{background:"transparent",border:"1px solid "+TH.cardBorder,color:TH.muted,padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>🌐 EN | ES</button>
        </div>
        {/* Brand strip (compact on stages after welcome) */}
        {step!=="welcome"&&<div style={{textAlign:"center",marginBottom:14,paddingTop:4}}>
          <div style={{fontSize:18,fontWeight:500,color:GOLD,fontFamily:"'Newsreader',Georgia,serif",letterSpacing:"0.14em",textTransform:"uppercase"}}>{advisorSettings.companyName||"Golden Anchor"}</div>
          <div style={{fontSize:10,fontStyle:"italic",color:GOLD+"BB",fontFamily:"'Newsreader',Georgia,serif",marginTop:4,letterSpacing:"0.02em"}}>{t.taglineSecuring||"Securing Your Health, Anchoring Your Future."}</div>
        </div>}
        {/* Step rail */}
        <IntakeStepRail stage={step} doneActive={submitted} t={t} TH={TH} isMobile={isMobile}/>
        {/* Stage 0 — Welcome (full-bleed; no surrounding card) */}
        {step==="welcome"&&<IntakeWelcomeStage onStart={()=>goToStep("service")} advisorSettings={advisorSettings} lang={lang} t={t} TH={TH} isMobile={isMobile}/>}
        {/* Stage 1+ container — main card + optional sticky sidebar */}
        {step!=="welcome"&&<div style={{display:"grid",gridTemplateColumns:showSidebar?"1fr 340px":"1fr",gap:24,alignItems:"flex-start"}}>
          <div>
            {/* Stage 1 — Service */}
            {step==="service"&&<div style={{background:TH.card,border:`1px solid ${TH.cardBorder}`,borderRadius:16,padding:isMobile?"22px 18px":"32px 28px"}}>
              <div style={{fontSize:10,fontWeight:700,color:GOLD,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>{t.intakeStepNofN?t.intakeStepNofN.replace("{n}","2").replace("{total}","4"):(lang==="es"?"Paso 2 de 4":"Step 2 of 4")}</div>
              <div style={{fontSize:isMobile?22:26,fontWeight:500,fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",color:TH.text,lineHeight:1.15,marginBottom:6}}>{t.stepServiceQTitle||(lang==="es"?"Elige un servicio":"Pick a service")}</div>
              <div style={{height:1,width:60,background:GOLD,margin:"4px 0 14px"}}/>
              <div style={{fontSize:13,color:TH.muted,marginBottom:18,lineHeight:1.6,maxWidth:520}}>{t.stepServiceHelp2||(lang==="es"?"Escoge lo que necesitas hoy. El precio es transparente — solo se cobra después de una llamada de descubrimiento.":"Choose what you need today. Pricing is transparent — you'll only be charged after a discovery call.")}</div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
                {services.map(svc=>{const sel=selectedServiceId===svc.id;return<button key={svc.id} onClick={()=>setSelectedServiceId(svc.id)} style={{textAlign:"left",padding:"16px 18px",borderRadius:12,border:`1px solid ${sel?GOLD:TH.cardBorder}`,background:sel?GOLD+"11":TH.card,color:TH.text,cursor:"pointer",transition:"border-color 200ms cubic-bezier(0.2,0.8,0.2,1), background 200ms",display:"flex",alignItems:"flex-start",gap:14}}>
                  <div style={{width:46,height:46,borderRadius:8,background:GOLD+"22",border:`1px solid ${GOLD}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{svc.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8,marginBottom:4}}>
                      <span style={{fontSize:14,fontWeight:700,lineHeight:1.3}}>{svc.name}</span>
                      <span style={{fontSize:13,fontWeight:800,color:GOLD,fontVariantNumeric:"tabular-nums",whiteSpace:"nowrap"}}>{svc.price}</span>
                    </div>
                    {svc.desc&&<div style={{fontSize:12,color:TH.muted,lineHeight:1.5}}>{svc.desc}</div>}
                  </div>
                </button>;})}
              </div>
            </div>}
            {/* Stage 2 — Engagement */}
            {step==="engagement"&&<div style={{background:TH.card,border:`1px solid ${TH.cardBorder}`,borderRadius:16,padding:isMobile?"22px 18px":"32px 28px"}}>
              <div style={{fontSize:10,fontWeight:700,color:GOLD,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>{t.intakeStepNofN?t.intakeStepNofN.replace("{n}","3").replace("{total}","4"):(lang==="es"?"Paso 3 de 4":"Step 3 of 4")}</div>
              <div style={{fontSize:isMobile?22:26,fontWeight:500,fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",color:TH.text,lineHeight:1.15,marginBottom:6}}>{t.stepEngagementTitle2||(lang==="es"?"Carta de compromiso":"Engagement Letter")}</div>
              <div style={{height:1,width:60,background:GOLD,margin:"4px 0 14px"}}/>
              <div style={{fontSize:13,color:TH.muted,marginBottom:18,lineHeight:1.6,maxWidth:560}}>{t.stepEngagementHelp2||(lang==="es"?"Léela y firma antes de continuar. Te enviaremos una copia por correo después de enviar tu intake.":"Please read and acknowledge before continuing. A signed copy will be emailed to you after submission.")}</div>
              {/* Cream-paper letter panel */}
              <div style={{background:"#FBF8F0",border:`1px solid ${TH.cardBorder}`,borderRadius:12,padding:isMobile?"22px 18px":"28px 32px",marginBottom:18}}>
                <EngagementLetter settings={advisorSettings} clientName1={[draft.firstName,draft.lastName].filter(Boolean).join(" ")} clientName2={householdType==="couple"?[draft.partnerFirst,draft.partnerLast].filter(Boolean).join(" "):""} selectedService={selectedService} lang={lang} t={t} theme={{...synthTheme,card:"#FBF8F0",cardBorder:TH.cardBorder}} signatureClient1={sig1} signatureClient2={sig2} onSig1={setSig1} onSig2={setSig2} readOnly={false}/>
              </div>
            </div>}
            {/* Stage 3 — Intake form. v0.31.0 restores the full structured advisor-style
               form (IntakeFormBody) so prospects can add line-item credit cards, income
               streams, debts, accounts, loans, etc. — the same shape the advisor edits
               post-conversion. Contact block is rendered inline above so name/email/phone
               + couple toggle are captured here too (no separate "household" step). */}
            {step==="intake"&&<div style={{background:TH.card,border:`1px solid ${TH.cardBorder}`,borderRadius:16,padding:isMobile?"22px 18px":"32px 28px"}}>
              <div style={{fontSize:10,fontWeight:700,color:GOLD,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>{t.intakeStepNofN?t.intakeStepNofN.replace("{n}","4").replace("{total}","4"):(lang==="es"?"Paso 4 de 4":"Step 4 of 4")}</div>
              <div style={{fontSize:isMobile?22:26,fontWeight:500,fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",color:TH.text,lineHeight:1.15,marginBottom:6}}>{t.stepIntakeTitle||(lang==="es"?"Tu información":"Your information")}</div>
              <div style={{height:1,width:60,background:GOLD,margin:"4px 0 14px"}}/>
              <div style={{fontSize:13,color:TH.muted,marginBottom:18,lineHeight:1.6,maxWidth:560}}>{t.stepIntakeHelpV2||(lang==="es"?"Captura tu información completa — agrega tus tarjetas, ingresos, deudas, cuentas y metas igual que en el reporte mensual. Solo tu asesor lo ve.":"Capture your full picture — add credit cards, income, debts, accounts, and goals just like in a monthly snapshot. Only your advisor sees this.")}</div>
              {/* Contact block (Section 1) — name/email/phone + couple toggle, prefilled from invite */}
              <IntakeFormSection n={1} title={t.intakeSection1Title||(lang==="es"?"Contacto":"Contact")}>
                {!!inviteToken&&<div style={{padding:"10px 14px",background:GOLD+"11",border:`1px solid ${GOLD}33`,borderRadius:10,fontSize:12,color:TH.text,marginBottom:14,lineHeight:1.5}}>✨ {t.intakePrefilledNote||(lang==="es"?"Tu asesor pre-llenó tu nombre, correo y teléfono desde la invitación. Revísalos y ajústalos si hace falta.":"Your advisor pre-filled your name, email, and phone from the invitation. Review them and tweak if needed.")}</div>}
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:12}}>
                  <div><IntakeFieldLabel>{t.firstNameLbl||"First name"} *</IntakeFieldLabel><input style={{width:"100%",padding:"12px 14px",background:TH.inp,border:`1px solid ${TH.inpBorder}`,color:TH.text,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}} value={draft.firstName||""} onChange={e=>setDraft(d=>({...d,firstName:e.target.value}))}/></div>
                  <div><IntakeFieldLabel>{t.lastNameLbl||"Last name"} *</IntakeFieldLabel><input style={{width:"100%",padding:"12px 14px",background:TH.inp,border:`1px solid ${TH.inpBorder}`,color:TH.text,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}} value={draft.lastName||""} onChange={e=>setDraft(d=>({...d,lastName:e.target.value}))}/></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:12}}>
                  <div><IntakeFieldLabel>{t.emailLbl||"Email"} *</IntakeFieldLabel><input type="email" style={{width:"100%",padding:"12px 14px",background:TH.inp,border:`1px solid ${TH.inpBorder}`,color:TH.text,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}} value={draft.email||""} onChange={e=>setDraft(d=>({...d,email:e.target.value}))}/></div>
                  <div><IntakeFieldLabel>{t.phoneLbl||"Phone"}</IntakeFieldLabel><input type="tel" inputMode="tel" style={{width:"100%",padding:"12px 14px",background:TH.inp,border:`1px solid ${TH.inpBorder}`,color:TH.text,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}} value={draft.phone||""} onChange={e=>setDraft(d=>({...d,phone:fmtPh?fmtPh(e.target.value):e.target.value}))}/></div>
                </div>
                <div style={{marginBottom:12}}><IntakeFieldLabel>{t.intakeHouseholdLbl||(lang==="es"?"¿Aplicas como individuo o pareja?":"Are you applying as an individual or a couple?")}</IntakeFieldLabel>
                  <div style={{display:"flex",gap:8}}>
                    {[{id:"single",lbl:t.householdSingle||(lang==="es"?"Solo yo":"Just me"),emoji:"👤"},{id:"couple",lbl:t.householdCouple||(lang==="es"?"Mi pareja y yo":"My partner & me"),emoji:"💑"}].map(opt=><button key={opt.id} type="button" onClick={()=>setDraft(d=>({...d,householdType:opt.id}))} style={{flex:1,padding:"12px 16px",borderRadius:8,border:`2px solid ${(draft.householdType||"single")===opt.id?GOLD:TH.cardBorder}`,background:(draft.householdType||"single")===opt.id?GOLD+"22":"transparent",color:TH.text,cursor:"pointer",fontSize:13,fontWeight:600,textAlign:"left",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{opt.emoji}</span>{opt.lbl}</button>)}
                  </div>
                </div>
                {(draft.householdType==="couple")&&<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:12}}>
                  <div><IntakeFieldLabel>{t.partnerFirstNameLbl||(lang==="es"?"Nombre de tu pareja":"Partner first name")} *</IntakeFieldLabel><input style={{width:"100%",padding:"12px 14px",background:TH.inp,border:`1px solid ${TH.inpBorder}`,color:TH.text,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}} value={draft.partnerFirst||""} onChange={e=>setDraft(d=>({...d,partnerFirst:e.target.value}))}/></div>
                  <div><IntakeFieldLabel>{t.partnerLastNameLbl||(lang==="es"?"Apellido":"Partner last name")}</IntakeFieldLabel><input style={{width:"100%",padding:"12px 14px",background:TH.inp,border:`1px solid ${TH.inpBorder}`,color:TH.text,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}} value={draft.partnerLast||""} onChange={e=>setDraft(d=>({...d,partnerLast:e.target.value}))}/></div>
                </div>}
              </IntakeFormSection>
              {/* Full structured intake form (line-item rich data — restored from pre-v0.30 behavior) */}
              <IntakeFormBody draft={draft} setDraft={setDraft} t={t} TH={TH} lang={lang}/>
              {/* Sticky footer with Back / Submit / Pay Now */}
              <div style={{marginTop:24,paddingTop:20,borderTop:`1px solid ${TH.cardBorder}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,flexWrap:"wrap"}}>
                <div style={{fontSize:11,color:TH.dim,fontStyle:"italic",lineHeight:1.5,flex:"1 1 200px",maxWidth:360}}>{t.intakeFooterPrivacy||(lang==="es"?"El pago abre en una pestaña nueva. También puedes pagar después de la llamada de descubrimiento.":"Opens secure checkout in a new tab. You can also pay after the discovery call.")}</div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <button onClick={back} disabled={submitting} style={{padding:"12px 18px",borderRadius:8,background:"transparent",color:TH.muted,fontWeight:700,fontSize:13,border:`1px solid ${TH.cardBorder}`,cursor:"pointer",whiteSpace:"nowrap"}}>← {t.backBtn||"Back"}</button>
                  <button onClick={()=>goSubmit(false)} disabled={submitting} style={{padding:"12px 22px",borderRadius:8,background:"transparent",color:submitting?TH.muted:TH.text,fontWeight:700,fontSize:13,border:`1px solid ${TH.cardBorder}`,cursor:submitting?"default":"pointer",whiteSpace:"nowrap"}}>{submitting&&!payingNow?(t.intakeSubmitting||"Submitting…"):"✓ "+(t.intakeSubmit||"Submit intake")}</button>
                  <button onClick={()=>goSubmit(true)} disabled={submitting||!selectedService} style={{padding:"12px 22px",borderRadius:8,background:GOLD,color:"#0D1B2A",fontWeight:800,fontSize:13,border:"none",cursor:(submitting||!selectedService)?"default":"pointer",whiteSpace:"nowrap",opacity:selectedService?1:0.4,boxShadow:selectedService?"0 4px 12px rgba(201,168,76,0.28)":"none"}}>💳 {(t.intakePayNow2||(lang==="es"?"Pagar ahora":"Pay now"))} · {selectedService?.price||"$"} →</button>
                </div>
              </div>
              {/* Promo code field — only render when set */}
              {promoFromUrl&&<div style={{marginTop:14,padding:"10px 12px",background:GOLD+"15",border:`1px solid ${GOLD}44`,borderRadius:8,fontSize:12,color:TH.text}}>🎟️ {t.promoApplied||"Promo code applied:"} <b style={{color:GOLD,fontFamily:"'JetBrains Mono',monospace"}}>{promoCode}</b></div>}
            </div>}
            {/* Error band */}
            {err&&<div role="alert" style={{fontSize:12,color:"#FCA5A5",background:"#EF444422",border:"1px solid #EF444466",borderRadius:8,padding:"10px 14px",marginTop:14}}>⚠️ {err}</div>}
            {/* Back/Continue row — Welcome+Intake hide their own; Service+Engagement use this */}
            {(step==="service"||step==="engagement")&&<div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
              <button onClick={back} style={{padding:"12px 22px",borderRadius:8,background:"transparent",color:TH.text,fontWeight:700,fontSize:13,border:`1px solid ${TH.cardBorder}`,cursor:"pointer"}}>← {t.backBtn||"Back"}</button>
              <button onClick={next} style={{flex:1,padding:"12px 22px",borderRadius:8,background:GOLD,color:"#0D1B2A",fontWeight:800,fontSize:13,border:"none",cursor:"pointer",letterSpacing:"0.02em",boxShadow:"0 4px 12px rgba(201,168,76,0.28)"}}>{t.continueBtn||"Continue"} →</button>
            </div>}
            <div style={{textAlign:"center",fontSize:10,color:TH.dim,marginTop:24,lineHeight:1.6,padding:"0 8px"}}>{t.disclaimer||""}</div>
          </div>
          {/* Sticky service sidebar (web only, engagement + intake) */}
          {showSidebar&&<IntakeSelectedServiceCard service={selectedService} lang={lang} t={t} TH={TH} showChange={step!=="engagement"} onChange={()=>goToStep("service")}/>}
        </div>}
      </div>
      {/* Done modal — overlays the form, doesn't replace it */}
      <IntakeDoneModal open={submitted} onClose={resetFlow} lang={lang} t={t} TH={TH} payingNow={payingNow} noPaymentLink={noPaymentLink}/>
    </div>
  </ThemeCtx.Provider>;
}



/* ── NewInviteModal — v0.29.0 ────────────────────────────────────────────
   Replaces the old "Send invite to a prospect" inline disclosure. Single
   compact modal: language picker + name + email + phone + personal note.
   Calls existing gaSendIntakeInvite server endpoint. On success: flips to
   "✓ Invite sent" briefly, fires onSent so the parent table can refresh,
   then auto-closes. */
function NewInviteModal({open,onClose,onSent,settings,t}){
  const th=useTh();
  const{isMobile}=useViewport();
  const[lang,setLang]=useState("en");
  const[name,setName]=useState("");
  const[email,setEmail]=useState("");
  const[phone,setPhone]=useState("");
  const[note,setNote]=useState("");
  // v0.32.0 — second-person fields. Toggled via the couple option below.
  const[householdType,setHouseholdType]=useState("single");
  const[partnerName,setPartnerName]=useState("");
  const[partnerEmail,setPartnerEmail]=useState("");
  const[partnerPhone,setPartnerPhone]=useState("");
  const[busy,setBusy]=useState(false);
  const[sent,setSent]=useState(false);
  const[err,setErr]=useState("");
  useEffect(()=>{if(!open){setLang("en");setName("");setEmail("");setPhone("");setNote("");setHouseholdType("single");setPartnerName("");setPartnerEmail("");setPartnerPhone("");setBusy(false);setSent(false);setErr("");}},[open]);
  useEffect(()=>{if(!open)return;const h=e=>{if(e.key==="Escape")onClose();};document.addEventListener("keydown",h);return()=>document.removeEventListener("keydown",h);},[open,onClose]);
  if(!open)return null;
  const submit=async()=>{
    setErr("");
    // v0.32.0 — name required (was: only email). Email still required since
    // it's the channel for delivery.
    if(!name.trim()){setErr(t?.intakeSendNameReq||"Prospect name is required.");return;}
    if(!email){setErr(t?.intakeSendEmailReq||"Enter prospect email first.");return;}
    if(householdType==="couple"&&!partnerName.trim()){setErr(t?.intakeSendPartnerNameReq||"Partner name is required for couple invites.");return;}
    setBusy(true);
    const r=await gaSendIntakeInvite({
      prospectName:name,
      prospectEmail:email,
      prospectPhone:phone,
      lang,
      channelEmail:true,channelSms:false,smsConsent:false,
      advisorName:settings?.advisorName||"",
      advisorEmail:settings?.advisorEmail||"",
      personalNote:note,
      householdType,
      partnerName:householdType==="couple"?partnerName:"",
      partnerEmail:householdType==="couple"?partnerEmail:"",
      partnerPhone:householdType==="couple"?partnerPhone:""
    });
    setBusy(false);
    if(r.ok){setSent(true);if(onSent)onSent();setTimeout(()=>{setSent(false);onClose();},1400);}
    else setErr(r.error||(t?.intakeSendFailed||"Send failed"));
  };
  const lbl=(s)=>({fontSize:10,fontWeight:700,color:th.muted,letterSpacing:".06em",textTransform:"uppercase",marginBottom:4,display:"block"});
  const inp={padding:"10px 12px",fontSize:13,background:th.inp,border:"1px solid "+th.inpBorder,color:th.text,borderRadius:8,outline:"none",width:"100%",boxSizing:"border-box"};
  const segWrap={display:"inline-flex",gap:3,padding:3,borderRadius:999,background:th.inp,border:"1px solid "+th.inpBorder};
  const segBtn=(active)=>({padding:"6px 14px",fontSize:11,borderRadius:999,background:active?GOLD:"transparent",color:active?"#0D1B2A":th.muted,border:"none",cursor:"pointer",fontWeight:700,whiteSpace:"nowrap"});
  const notePh=lang==="es"?"Hola, te comparto el link para tu chequeo inicial…":"Hi, here's the intake link for your initial checkup…";
  return<div role="dialog" aria-modal="true" onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.67)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:isMobile?12:24}}>
    <div style={{background:th.modal,border:"1px solid "+th.cardBorder,borderRadius:16,padding:24,maxWidth:600,width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.55)"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:14}}>
        <div>
          <div style={{fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",fontSize:22,fontWeight:500,color:GOLD,lineHeight:1.1}}>{t?.intakeNewInviteTitle||"New invite"}</div>
          <div style={{fontSize:12,color:th.muted,marginTop:6,maxWidth:380,lineHeight:1.5}}>{t?.intakeNewInviteSubtitle||"Send a prospect a private intake link. Pick the language they'll fill the form in."}</div>
        </div>
        <button onClick={onClose} aria-label={t?.close||"Close"} style={{background:"transparent",border:"none",color:th.muted,fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>✕</button>
      </div>
      <div style={{height:1,background:th.cardBorder,margin:"14px 0 18px"}}/>
      {/* Lang segmented */}
      <div style={{marginBottom:14}}>
        <label style={lbl()}>{t?.intakeNewInviteLangLbl||"Send invite in"}</label>
        <div style={segWrap}>
          <button onClick={()=>setLang("en")} style={segBtn(lang==="en")}>EN — English</button>
          <button onClick={()=>setLang("es")} style={segBtn(lang==="es")}>ES — Español</button>
        </div>
      </div>
      {/* Individual vs Couple toggle */}
      <div style={{marginBottom:14}}>
        <label style={lbl()}>{t?.intakeHouseholdLbl||"Are you applying as an individual or a couple?"}</label>
        <div style={{display:"flex",gap:8}}>
          {[{id:"single",lbl:t?.householdSingle||"Just me",emoji:"👤"},{id:"couple",lbl:t?.householdCouple||"Partner & me",emoji:"💑"}].map(opt=><button key={opt.id} type="button" onClick={()=>setHouseholdType(opt.id)} style={{flex:1,padding:"10px 14px",borderRadius:8,border:`2px solid ${householdType===opt.id?GOLD:th.cardBorder}`,background:householdType===opt.id?GOLD+"22":"transparent",color:th.text,cursor:"pointer",fontSize:12,fontWeight:600,textAlign:"left",display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{opt.emoji}</span>{opt.lbl}</button>)}
        </div>
      </div>
      {/* Prospect Name + Email */}
      <div style={{fontSize:10,fontWeight:700,color:GOLD,letterSpacing:".06em",textTransform:"uppercase",marginBottom:8,marginTop:4}}>{householdType==="couple"?(t?.intakePrimaryProspect||"Primary prospect"):(t?.intakeProspect||"Prospect")}</div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:12}}>
        <div>
          <label style={lbl()}>{(t?.intakeProspectName||"Full name")+" *"}</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder={t?.intakeProspectNamePh||"Jane Doe"} style={inp}/>
        </div>
        <div>
          <label style={lbl()}>{(t?.email||"Email")+" *"}</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="jane@email.com" style={inp}/>
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <label style={lbl()}>{(t?.phone||"Phone")+" ("+(t?.optional||"optional")+")"}</label>
        <input type="tel" value={phone} onChange={e=>setPhone(fmtPh?fmtPh(e.target.value):e.target.value)} placeholder="(305) 555-0000" style={inp} inputMode="tel" autoComplete="tel"/>
      </div>
      {/* Partner block — only when couple */}
      {householdType==="couple"&&<>
        <div style={{height:1,background:th.cardBorder,margin:"4px 0 14px"}}/>
        <div style={{fontSize:10,fontWeight:700,color:GOLD,letterSpacing:".06em",textTransform:"uppercase",marginBottom:8}}>{t?.intakePartner||"Partner"}</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:12}}>
          <div>
            <label style={lbl()}>{(t?.partnerFullNameLbl||"Partner full name")+" *"}</label>
            <input value={partnerName} onChange={e=>setPartnerName(e.target.value)} placeholder={t?.partnerNamePh||"John Doe"} style={inp}/>
          </div>
          <div>
            <label style={lbl()}>{(t?.partnerEmailLbl||"Partner email")+" ("+(t?.optional||"optional")+")"}</label>
            <input type="email" value={partnerEmail} onChange={e=>setPartnerEmail(e.target.value)} placeholder="john@email.com" style={inp}/>
          </div>
        </div>
        <div style={{marginBottom:14}}>
          <label style={lbl()}>{(t?.partnerPhoneLbl||"Partner phone")+" ("+(t?.optional||"optional")+")"}</label>
          <input type="tel" value={partnerPhone} onChange={e=>setPartnerPhone(fmtPh?fmtPh(e.target.value):e.target.value)} placeholder="(305) 555-0000" style={inp} inputMode="tel" autoComplete="tel"/>
        </div>
      </>}
      {/* Note */}
      <div style={{marginBottom:18}}>
        <label style={lbl()}>{(t?.intakeNewInviteNoteLbl||"Personal note")+" ("+(t?.optional||"optional")+")"}</label>
        <textarea rows={2} value={note} onChange={e=>setNote(e.target.value)} placeholder={notePh} style={{...inp,resize:"vertical",lineHeight:1.5,fontFamily:"inherit"}}/>
      </div>
      {/* Error / Submit */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <div style={{fontSize:11,color:th.neg,fontWeight:600,flex:"1 1 200px"}}>{err}</div>
        <button onClick={submit} disabled={busy||sent} style={{padding:"10px 22px",fontSize:12,borderRadius:8,background:sent?th.pos:GOLD,color:sent?"#fff":"#0D1B2A",border:"none",cursor:busy?"default":"pointer",fontWeight:700,whiteSpace:"nowrap",opacity:busy&&!sent?0.6:1}}>
          {sent?("✓ "+(t?.intakeInviteSent||"Invite sent")):busy?(t?.intakeSendBusy||"Sending…"):("📨 "+(lang==="es"?(t?.intakeSendInviteEs||"Enviar invitación"):(t?.intakeSendInviteEn||"Send invite")))}
        </button>
      </div>
    </div>
  </div>;
}

/* ── INTAKE SUBMISSIONS — v0.29.0 admin page rebuild ──────────────────────
   Header with collapsible Public URL toggle + New Invite button.
   Filter pills (All / Pending / Reviewed / Approved).
   Submissions table with row kebab menu (10 items mirroring the modal).
   Old "Send invite" + "Sent invites" disclosures are GONE — the new modal
   covers send, and the kebab covers per-row resend / open / copy / etc. */
function IntakeSubmissionsPage({t,authUser,onConvert,settings}){
  const th=useTh();
  const{isMobile}=useViewport();
  const[subs,setSubs]=useState([]);
  const[loading,setLoading]=useState(true);
  const[sel,setSel]=useState(null);
  const[convertConfirm,setConvertConfirm]=useState(null);
  const[urlCopied,setUrlCopied]=useState("");
  const[editing,setEditing]=useState(null);
  const[deleteConfirm,setDeleteConfirm]=useState(null);
  const[clearConfirm,setClearConfirm]=useState(null);
  // v0.29.0 — new UI state
  const[urlOpen,setUrlOpen]=useState(false);              // Public URL toggle (collapsed by default)
  const[inviteOpen,setInviteOpen]=useState(false);        // New Invite modal
  const[filter,setFilter]=useState("all");                // all|pending|reviewed|approved|archived
  const[menuOpenId,setMenuOpenId]=useState(null);         // which row's kebab is open
  // Close kebab on Esc or outside-click
  useEffect(()=>{if(!menuOpenId)return;const h=e=>{if(e.key==="Escape")setMenuOpenId(null);};const c=e=>{if(!e.target.closest||!e.target.closest("[data-row-kebab]"))setMenuOpenId(null);};document.addEventListener("keydown",h);document.addEventListener("mousedown",c);return()=>{document.removeEventListener("keydown",h);document.removeEventListener("mousedown",c);};},[menuOpenId]);
  const publicBase=(typeof window!=="undefined"?window.location.origin:"")+"/intake?advisor="+(authUser?.id||"");
  const publicUrlEs=publicBase+"&lang=es";
  useEffect(()=>{let cancelled=false;(async()=>{const list=await gaLoadIntakeSubmissions(authUser?.id);if(!cancelled){setSubs(list);setLoading(false);}})();return()=>{cancelled=true;};},[authUser?.id]);
  // v0.6.1 — Robust copy: try Clipboard API first, fall back to execCommand on a
  // hidden textarea. If both fail, prompt() so the user can copy manually.
  const copyUrl=async(url,which)=>{
    let ok=false;
    try{if(typeof navigator!=="undefined"&&navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(url);ok=true;}}catch{}
    if(!ok&&typeof document!=="undefined"){try{const ta=document.createElement("textarea");ta.value=url;ta.setAttribute("readonly","");ta.style.position="fixed";ta.style.top="-1000px";ta.style.opacity="0";document.body.appendChild(ta);ta.focus();ta.select();ta.setSelectionRange(0,url.length);ok=document.execCommand("copy");document.body.removeChild(ta);}catch{}}
    if(ok){setUrlCopied(which);setTimeout(()=>setUrlCopied(""),2000);}
    else{try{window.prompt(t.intakeCopyUrl||"Copy",url);}catch{}}
  };
  const setStatus=async(id,status,extras)=>{const patch={status,reviewed_at:new Date().toISOString(),...(extras||{})};const ok=await gaUpdateIntakeStatus(id,patch);if(ok)setSubs(s=>s.map(x=>x.id===id?{...x,...patch}:x));return ok;};
  const doDelete=async(id)=>{const ok=await gaDeleteIntakeSubmission(id);if(ok){setSubs(s=>s.filter(x=>x.id!==id));if(sel&&sel.id===id)setSel(null);}return ok;};
  const doClearByStatus=async(status)=>{const n=await gaDeleteIntakeSubmissionsByStatus(authUser?.id,status);if(n>0){setSubs(s=>s.filter(x=>x.status!==status));if(sel&&sel.status===status)setSel(null);}return n;};
  const saveEdit=async(updatedData)=>{const ok=await gaUpdateIntakeData(editing.id,updatedData);if(ok){setSubs(s=>s.map(x=>x.id===editing.id?{...x,data:updatedData}:x));setEditing(null);}return ok;};
  const doConvert=async(sub)=>{
    const d=sub.data||{};
    const submittedNote="Submitted via public intake on "+new Date(sub.created_at).toLocaleDateString()+".";
    const existingGeneral=(d.notes&&d.notes.general)||"";
    const generalCombined=existingGeneral?existingGeneral+"\n"+submittedNote:submittedNote;
    const legacyNotes=(!d.notes&&(d.goals||d.notes_text))?{shortTerm:"",midTerm:"",longTerm:"",setbacks:"",goals:d.goals||"",general:[d.notes_text||"",d.preferredService?("Requested service: "+d.preferredService):"",d.contactMethod?("Preferred contact: "+d.contactMethod):"",submittedNote].filter(Boolean).join("\n")}:null;
    const baseClient={...d,id:gid(),archived:false,hideNumbers:false,monthSnapshots:[],color1:d.color1||"#4472C4",color2:d.partnerFirst?(d.color2||"#ED7D31"):null,recommendedBy:d.recommendedBy||d.howHeard||"",clientType:d.clientType||(d.preferredService==="insurance-consult"?"financeAndHealth":"financeOnly"),notes:legacyNotes||{shortTerm:"",midTerm:"",longTerm:"",setbacks:"",goals:"",...(d.notes||{}),general:generalCombined}};
    if(!Array.isArray(d.incomeStreams)&&d.monthlyNetIncome&&+d.monthlyNetIncome>0){
      baseClient.incomeStreams=[{id:gid(),person:"p1",label:"Main Job",gross:Math.round(+d.monthlyNetIncome*1.3),net:+d.monthlyNetIncome,freq:"monthly2"}];
    }
    const newClient=mig(baseClient);
    // v0.29.0 — Convert sets status='approved' (the 'converted' value is gone post-migration).
    // We still track converted_at + client_local_id for the audit trail.
    await setStatus(sub.id,"approved",{approved_at:new Date().toISOString(),converted_at:new Date().toISOString(),client_local_id:String(newClient.id)});
    onConvert(newClient);
  };
  // v0.29.0 — derived state
  const pendingCount=subs.filter(s=>s.status==="pending").length;
  const visibleSubs=subs.filter(s=>{if(filter==="all")return s.status!=="archived";return s.status===filter;}).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const statusColor=st=>st==="pending"?th.warn:st==="reviewed"?th.blue:st==="approved"?th.pos:st==="archived"?th.dim:th.muted;
  const statusLabelFor=st=>st==="pending"?(t.intakeStatusPending||"Pending"):st==="reviewed"?(t.intakeStatusReviewed||"Reviewed"):st==="approved"?(t.intakeStatusApproved||"Approved"):st==="archived"?(t.intakeStatusArchived||"Archived"):st;
  const svcName=id=>{const s=SVCS.find(x=>x.id===id);return s?(s[_gaLang()]||s.en):(id||"—");};
  // Per-row resend invite — reuses prospect info from the submission's data
  const resendInvite=async(sub,lng)=>{const d=sub.data||{};const r=await gaSendIntakeInvite({prospectName:((d.firstName||"")+" "+(d.lastName||"")).trim(),prospectEmail:d.email||"",prospectPhone:d.phone||"",lang:lng||sub.lang||"en",channelEmail:true,channelSms:false,smsConsent:false,advisorName:settings?.advisorName||"",advisorEmail:settings?.advisorEmail||""});if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("ga-toast",{detail:{kind:r.ok?"success":"error",msg:r.ok?(t.intakeResentToast||"Invite resent"):(t.intakeSendFailed||"Send failed")}}));setMenuOpenId(null);};
  // Returns the public intake URL for a submission's language
  const copySubmissionLink=async(sub)=>{const url=publicBase+(sub.lang==="es"||sub.data?.lang==="es"?"&lang=es":"");try{await navigator.clipboard.writeText(url);}catch{try{window.prompt("Copy",url);}catch{}}if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("ga-toast",{detail:{kind:"success",msg:t.intakeLinkCopiedToast||"Intake link copied"}}));setMenuOpenId(null);};
  const messageProspect=(sub)=>{const e=sub.data?.email;if(!e){setMenuOpenId(null);return;}window.location.href="mailto:"+e+"?subject="+encodeURIComponent("Golden Anchor — follow-up");setMenuOpenId(null);};
  return<>
    <NewInviteModal open={inviteOpen} onClose={()=>setInviteOpen(false)} settings={settings} t={t} onSent={async()=>{const fresh=await gaLoadIntakeSubmissions(authUser?.id);setSubs(fresh);}}/>
    <div style={{padding:isMobile?"16px 14px":"22px 20px",maxWidth:1280,margin:"0 auto"}}>
    {/* v0.29.0 — Header row: counter + Public-URL toggle pill + New Invite button */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
      <div style={{fontSize:12,fontWeight:600,letterSpacing:"0.04em"}}>
        <span style={{color:GOLD,fontWeight:700}}>{pendingCount} {(t.intakeStatusPending||"pending").toLowerCase()}</span>
        <span style={{color:th.dim,margin:"0 8px"}}>/</span>
        <span style={{color:th.dim}}>{subs.length} {t.totalLbl||"total"}</span>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <button onClick={()=>setUrlOpen(o=>!o)} aria-expanded={urlOpen} style={{padding:"7px 14px",borderRadius:999,background:urlOpen?GOLD+"1A":"transparent",border:"1px solid "+GOLD+"55",color:GOLD,cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:6,transition:"background-color 150ms ease"}}>
          <span style={{display:"inline-block",transition:"transform 200ms ease",transform:urlOpen?"rotate(90deg)":"rotate(0)"}}>▶</span>
          📋 {t.publicIntakeUrl||"Public intake URL"}
        </button>
        <BSolid onClick={()=>setInviteOpen(true)}>📨 {t.intakeNewInviteBtn||"New invite"}</BSolid>
      </div>
    </div>
    {/* v0.29.0 — Collapsible URL card (was always-open + had send-invite/sent-invites
        disclosures inline; both removed in favor of NewInviteModal + row kebab) */}
    {urlOpen&&<div style={{...mCARD(th),padding:18,marginBottom:14}}>
      <div style={{fontSize:11,color:th.muted,marginBottom:14,lineHeight:1.6}}>{t.intakeShareUrlHelp||"Anyone with this URL can submit an intake. Submissions land in the table below. Use the ES link for Spanish-speaking prospects."}</div>
      {[{lang:"EN",url:publicBase,k:"en"},{lang:"ES",url:publicUrlEs,k:"es"}].map(row=><div key={row.k} style={{display:"flex",gap:8,marginBottom:row.k==="en"?8:0,alignItems:"center"}}>
        <div style={{width:32,height:26,display:"flex",alignItems:"center",justifyContent:"center",background:GOLD+"1A",border:"1px solid "+GOLD+"44",borderRadius:6,color:GOLD,fontWeight:800,fontSize:10,letterSpacing:"0.06em",flexShrink:0}}>{row.lang}</div>
        <input value={row.url} readOnly onClick={e=>e.target.select()} title={row.url} style={{flex:1,minWidth:0,padding:"8px 10px",fontSize:11,fontFamily:"'JetBrains Mono',monospace",background:th.inp,border:"1px solid "+th.inpBorder,color:th.text,borderRadius:6,cursor:"text",textOverflow:"ellipsis"}}/>
        <button onClick={()=>copyUrl(row.url,row.k)} style={{padding:"8px 16px",fontSize:11,borderRadius:8,background:urlCopied===row.k?th.pos+"1A":"transparent",color:urlCopied===row.k?th.pos:GOLD,border:"1px solid "+(urlCopied===row.k?th.pos+"66":GOLD+"55"),cursor:"pointer",fontWeight:700,whiteSpace:"nowrap",flexShrink:0,transition:"all 150ms ease"}}>{urlCopied===row.k?"✓ "+(t.intakeCopiedShort||"Copied"):(t.intakeCopyUrl||"Copy")}</button>
      </div>)}
    </div>}
    {/* v0.29.0 — Filter pills */}
    <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
      {[["all",t.allLbl||"All",subs.filter(x=>x.status!=="archived").length],["pending",t.intakeStatusPending||"Pending",subs.filter(x=>x.status==="pending").length],["reviewed",t.intakeStatusReviewed||"Reviewed",subs.filter(x=>x.status==="reviewed").length],["approved",t.intakeStatusApproved||"Approved",subs.filter(x=>x.status==="approved").length],["archived",t.intakeStatusArchived||"Archived",subs.filter(x=>x.status==="archived").length]].map(([k,l,n])=>{const active=filter===k;return<button key={k} onClick={()=>setFilter(k)} style={{padding:"6px 14px",borderRadius:999,background:active?GOLD+"1A":"transparent",color:active?GOLD:th.muted,border:"1px solid "+(active?GOLD+"44":th.cardBorder),cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>{l} <span style={{opacity:0.7,fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>({n})</span></button>;})}
    </div>
    {/* v0.29.0 — Submissions table */}
    {loading?<div style={{textAlign:"center",color:th.muted,padding:40,fontSize:13}}>{t.loadingClients||"Loading…"}</div>:
     visibleSubs.length===0?<div style={{...mCARD(th),padding:32,textAlign:"center"}}>
       <div style={{fontSize:36,marginBottom:10}}>📭</div>
       <div style={{fontSize:14,color:th.text,marginBottom:6,fontWeight:600}}>{t.intakeNoSubmissions||"No intake submissions yet."}</div>
       <div style={{fontSize:11,color:th.muted,lineHeight:1.6,maxWidth:380,margin:"0 auto"}}>{filter==="all"?(t.intakeNoSubmissionsHelp||"Share your public intake URL with prospects to receive submissions here."):(t.intakeNoMatching||"No submissions match this filter.")}</div>
     </div>:
     <div style={{...mCARD(th),padding:0,overflow:"visible"}}>
       <div style={{overflowX:"auto"}}>
       <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,tableLayout:"auto"}}>
         <thead><tr style={{borderBottom:"1px solid "+th.cardBorder}}>
           <th style={{padding:"12px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:th.muted,letterSpacing:"0.05em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{t.intakeColSubmitted||"Submitted"}</th>
           <th style={{padding:"12px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:th.muted,letterSpacing:"0.05em",textTransform:"uppercase"}}>{t.intakeColProspect||"Prospect"}</th>
           <th style={{padding:"12px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:th.muted,letterSpacing:"0.05em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{t.intakeColService||"Service"}</th>
           <th style={{padding:"12px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:th.muted,letterSpacing:"0.05em",textTransform:"uppercase"}}>{t.intakeColLang||"Lang"}</th>
           <th style={{padding:"12px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:th.muted,letterSpacing:"0.05em",textTransform:"uppercase"}}>{t.intakeColStatus||"Status"}</th>
           <th style={{padding:"12px 16px"}}/>
         </tr></thead>
         <tbody>
         {visibleSubs.map((s,idx)=>{
           const d=s.data||{};
           const fullName=((d.firstName||"")+" "+(d.lastName||"")).trim()||"(no name)";
           const rowLang=(s.lang||d.lang||"en").toLowerCase();
           const isMenu=menuOpenId===s.id;
           const cellSt={padding:"14px 16px",borderTop:idx===0?"none":"1px solid "+th.cardBorder,verticalAlign:"middle"};
           return<tr key={s.id}>
             <td style={{...cellSt,whiteSpace:"nowrap",color:th.muted,fontSize:11}}>{new Date(s.created_at).toLocaleDateString()}</td>
             <td style={cellSt}>
               <div style={{fontSize:13,fontWeight:700,color:th.text}}>{fullName}</div>
               <div style={{fontSize:11,color:th.muted,marginTop:2}}>{d.email||""}</div>
             </td>
             <td style={{...cellSt,color:th.muted,fontSize:12}}>{svcName(d.preferredService)}</td>
             <td style={cellSt}><Pill color={rowLang==="es"?GOLD:th.blue}>{rowLang.toUpperCase()}</Pill></td>
             <td style={cellSt}><Pill color={statusColor(s.status)}>{statusLabelFor(s.status)}</Pill></td>
             <td style={{...cellSt,textAlign:"right",whiteSpace:"nowrap",position:"relative"}} data-row-kebab>
               <Btn small onClick={()=>setSel(sel?.id===s.id?null:s)}>{t.intakeOpenBtn||"Open"}</Btn>
               <button onClick={e=>{e.stopPropagation();setMenuOpenId(isMenu?null:s.id);}} aria-label={t.openMenu||"Open menu"} aria-haspopup="menu" aria-expanded={isMenu} style={{width:28,height:28,padding:0,marginLeft:6,borderRadius:8,background:"transparent",border:"1px solid "+th.cardBorder,color:th.muted,cursor:"pointer",fontSize:14,verticalAlign:"middle"}}>⋯</button>
               {isMenu&&<div role="menu" style={{position:"absolute",top:42,right:14,minWidth:240,background:th.modal,border:"1px solid "+th.cardBorder,borderRadius:12,padding:6,boxShadow:"0 8px 24px rgba(0,0,0,0.25)",zIndex:"var(--ga-z-dropdown, 70)",textAlign:"left"}}>
                 {[
                   {key:"open",l:"👁️ "+(t.intakeMenuOpen||"Open submission"),fn:()=>{setSel(s);setMenuOpenId(null);}},
                   {key:"resend",l:"📨 "+(rowLang==="es"?(t.intakeMenuResendEs||"Resend invite (ES)"):(t.intakeMenuResendEn||"Resend invite (EN)")),fn:()=>resendInvite(s,rowLang)},
                   {key:"copylink",l:"🔗 "+(t.intakeMenuCopyLink||"Copy intake link"),fn:()=>copySubmissionLink(s)},
                   {key:"message",l:"💬 "+(t.intakeMenuMessage||"Message prospect"),fn:()=>messageProspect(s),disabled:!d.email},
                   {divider:true,key:"d1"},
                   ...(s.status!=="reviewed"&&s.status!=="approved"?[{key:"review",l:"✓ "+(t.intakeMarkReviewed||"Mark as reviewed"),fn:async()=>{await setStatus(s.id,"reviewed");setMenuOpenId(null);}}]:[]),
                   ...(s.status!=="approved"?[{key:"approve",l:"⭐ "+(t.intakeMarkApproved||"Mark as approved"),fn:async()=>{await setStatus(s.id,"approved",{approved_at:new Date().toISOString()});setMenuOpenId(null);}}]:[]),
                   {key:"convert",l:"➕ "+(t.intakeConvertBtn||"Convert to client"),fn:()=>{setConvertConfirm(s);setMenuOpenId(null);}},
                   {divider:true,key:"d2"},
                   {key:"archive",l:"🗑 "+(t.intakeMenuArchive||"Archive"),fn:async()=>{await setStatus(s.id,"archived",{archived_at:new Date().toISOString()});setMenuOpenId(null);},danger:true},
                 ].map(it=>it.divider?<div key={it.key} style={{height:1,background:th.cardBorder,margin:"4px 4px"}}/>:<button key={it.key} onClick={it.fn} disabled={it.disabled} style={{display:"block",width:"100%",padding:"8px 10px",borderRadius:8,fontSize:12,fontWeight:600,background:"transparent",color:it.disabled?th.dim:(it.danger?th.neg:th.text),border:"none",cursor:it.disabled?"not-allowed":"pointer",textAlign:"left",whiteSpace:"nowrap"}} onMouseEnter={e=>{if(!it.disabled)e.currentTarget.style.background=th.accent+"14";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>{it.l}</button>)}
               </div>}
             </td>
           </tr>;
         })}
         </tbody>
       </table>
       </div>
     </div>
    }
    {sel&&<div style={{...mCARD(th),padding:isMobile?16:20,marginTop:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:14,fontWeight:700,color:th.text}}>{((sel.data?.firstName||"")+" "+(sel.data?.lastName||"")).trim()}</div>
        <button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:th.muted,fontSize:22,cursor:"pointer",minWidth:36,minHeight:36}}>×</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit,minmax(220px,1fr))",gap:8,marginBottom:18,fontSize:12}}>
        {Object.entries(sel.data||{}).map(([k,v])=>{
          let val=v;if(typeof val==="boolean")val=val?"✓":"";
          if(val===null||val===undefined||val==="")return null;
          return<div key={k} style={{padding:"6px 0",borderBottom:"1px solid "+th.cardBorder}}><span style={{color:th.dim,fontSize:10,textTransform:"uppercase",letterSpacing:"0.05em",marginRight:6}}>{k}:</span><span style={{color:th.text,wordBreak:"break-word"}}>{String(val)}</span></div>;
        })}
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <BSolid onClick={()=>setConvertConfirm(sel)}>↪ {t.intakeConvertBtn||"Convert to Client"}</BSolid>
        <Btn onClick={()=>setEditing(sel)} color={th.blue}>✏️ {t.intakeEditBtn||"Edit Intake"}</Btn>
        {sel.status==="pending"&&<Btn onClick={async()=>{await setStatus(sel.id,"reviewed");}}>{t.intakeMarkReviewed||"Mark Reviewed"}</Btn>}
        {sel.status!=="approved"&&<Btn onClick={async()=>{await setStatus(sel.id,"approved",{approved_at:new Date().toISOString()});}}>⭐ {t.intakeMarkApproved||"Mark Approved"}</Btn>}
        {sel.status!=="archived"&&<Btn color={th.dim} onClick={async()=>{await setStatus(sel.id,"archived",{archived_at:new Date().toISOString()});setSel(null);}}>🗑 {t.intakeMenuArchive||"Archive"}</Btn>}
        <Btn onClick={()=>setDeleteConfirm(sel)} color={th.neg}>🗑️ {t.intakeDeleteBtn||"Delete"}</Btn>
      </div>
    </div>}
    {convertConfirm&&<Modal title={t.intakeConvertBtn||"Convert to Client"} onClose={()=>setConvertConfirm(null)} width={420}>
      <div style={{fontSize:13,color:th.text,marginBottom:8}}>{t.intakeConfirmConvert||"Convert this submission into a new client?"}</div>
      <div style={{fontSize:11,color:th.muted,marginBottom:18}}>{t.firstName}: <b style={{color:th.text}}>{((convertConfirm.data?.firstName||"")+" "+(convertConfirm.data?.lastName||"")).trim()}</b></div>
      <SaveBar onSave={async()=>{await doConvert(convertConfirm);setConvertConfirm(null);}} onCancel={()=>setConvertConfirm(null)} t={t} saveLabel={t.intakeConvertBtn||"Convert"}/>
    </Modal>}
    {deleteConfirm&&<Modal title={t.intakeDeleteBtn||"Delete Submission"} onClose={()=>setDeleteConfirm(null)} width={420}>
      <div style={{fontSize:13,color:th.text,marginBottom:8}}>{t.intakeConfirmDelete||"Delete this submission? This cannot be undone."}</div>
      <div style={{fontSize:11,color:th.muted,marginBottom:18}}>{t.firstName}: <b style={{color:th.text}}>{((deleteConfirm.data?.firstName||"")+" "+(deleteConfirm.data?.lastName||"")).trim()}</b></div>
      <SaveBar onSave={async()=>{await doDelete(deleteConfirm.id);setDeleteConfirm(null);}} onCancel={()=>setDeleteConfirm(null)} t={t} saveLabel={t.intakeDeleteBtn||"Delete"}/>
    </Modal>}
    {editing&&<IntakeSubmissionEditor submission={editing} onSave={saveEdit} onCancel={()=>setEditing(null)} t={t}/>}
    </div>
  </>;
}

/* ── IntakeSubmissionEditor (v0.7.1) ─────────────────────────────────────── */
function IntakeSubmissionEditor({submission,onSave,onCancel,t}){
  const th=useTh();
  const[draft,setDraft]=useState(()=>mig({...mk(),...(submission.data||{}),id:gid(),monthSnapshots:[]}));
  const[saving,setSaving]=useState(false);
  const TH={bg:th.bg,text:th.text,muted:th.muted,dim:th.dim,pos:th.pos,neg:th.neg,accent:th.accent,card:th.card,cardBorder:th.cardBorder,inp:th.inp,inpBorder:th.inpBorder||th.cardBorder,modal:th.modal,warn:th.warn,blue:th.blue};
  const lang=_gaLang();
  const handleSave=async()=>{
    setSaving(true);
    const payload={...draft,monthSnapshots:[],savedCalcs:[],savedCompare:null,savedPortfolio:null};
    delete payload.id;delete payload.archived;delete payload.hideNumbers;delete payload.currentMonthLabel;
    const ok=await onSave(payload);
    if(!ok)setSaving(false);
  };
  return<Modal title={"✏️ "+((t.intakeEditBtn||"Edit Intake")+" — "+((submission.data?.firstName||"")+" "+(submission.data?.lastName||"")).trim())} onClose={onCancel} width={800}>
    <div style={{maxHeight:"70vh",overflowY:"auto",paddingRight:6}}>
      <IntakeFormBody draft={draft} setDraft={setDraft} t={t} TH={TH} lang={lang}/>
    </div>
    <div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${th.cardBorder}`,display:"flex",gap:8,justifyContent:"flex-end"}}>
      <Btn onClick={onCancel}>{t.cancel||"Cancel"}</Btn>
      <BSolid onClick={handleSave} disabled={saving}>{saving?"…":(t.save||"Save")}</BSolid>
    </div>
  </Modal>;
}

// v0.13.0 — Deep-linkable URLs. Maps in-app navigation state {nav, selectedId,
// selectedTab} to a real URL path so refresh / bookmark / share / browser
// Back-Forward all work. The /intake route stays under D-28 (handled by
// isPublicIntakeRoute) and is not parsed here.
const _GA_NAVS=["dashboard","clients","intake-submissions","calculators","promotions","resources","about"];
const _GA_CLIENT_TABS=["report","monthly","financialStatements","investments","plan","calculators","backfill","notes"];
function buildGAPath(nav,selectedId,selectedTab,selectedCalc){
  if(selectedId!=null){
    const id=encodeURIComponent(String(selectedId));
    // v0.13.1 — always include the tab segment (was omitting default "report" in v0.13.0).
    const tab=selectedTab&&_GA_CLIENT_TABS.includes(selectedTab)?selectedTab:"report";
    return "/clients/"+id+"/"+tab;
  }
  // v0.13.1 — /calculators/<calc-id> when a specific calc is open
  if(nav==="calculators"&&selectedCalc)return "/calculators/"+encodeURIComponent(String(selectedCalc));
  if(_GA_NAVS.includes(nav))return "/"+nav;
  return "/dashboard";
}
function parseGAPath(pathname){
  // returns {nav, clientId, selectedTab, selectedCalc} or null when path is /intake (handled separately).
  const p=(pathname||"/").replace(/\/+$/,"")||"/";
  if(p==="/"||p==="")return{nav:"dashboard",clientId:null,selectedTab:"report",selectedCalc:null};
  if(p.indexOf("/intake")===0)return null;
  const parts=p.split("/").filter(Boolean);
  if(parts[0]==="clients"&&parts[1]){
    let clientId;try{clientId=decodeURIComponent(parts[1]);}catch{clientId=parts[1];}
    const tab=parts[2]&&_GA_CLIENT_TABS.includes(parts[2])?parts[2]:"report";
    return{nav:"clients",clientId,selectedTab:tab,selectedCalc:null};
  }
  // v0.13.1 — /calculators/<calc-id> opens that calculator directly
  if(parts[0]==="calculators"&&parts[1]){
    let calcId;try{calcId=decodeURIComponent(parts[1]);}catch{calcId=parts[1];}
    return{nav:"calculators",clientId:null,selectedTab:"report",selectedCalc:calcId};
  }
  if(_GA_NAVS.includes(parts[0]))return{nav:parts[0],clientId:null,selectedTab:"report",selectedCalc:null};
  return{nav:"dashboard",clientId:null,selectedTab:"report",selectedCalc:null};
}

/* ── AVATARS — preset profile images (v0.18.0). Mirrors design-system
   Avatar.jsx. SVGs live in /public/avatars/ (copied from assets/avatars). */
const AVATAR_PRESETS=[
  {group:"Brand",  id:"mh-gold",       label:"MH · gold"},
  {group:"Brand",  id:"mh-navy",       label:"MH · navy"},
  {group:"Brand",  id:"anchor-gold",   label:"Anchor"},
  {group:"Brand",  id:"monogram-cream",label:"GA · cream"},
  {group:"Finance",id:"coin",          label:"Gold coin"},
  {group:"Finance",id:"chart",         label:"Growth"},
  {group:"Finance",id:"briefcase",     label:"Briefcase"},
  {group:"Finance",id:"key",           label:"Key"},
  {group:"Animal", id:"fox",           label:"Fox"},
  {group:"Animal", id:"owl",           label:"Owl"},
  {group:"Animal", id:"whale",         label:"Whale"},
  {group:"Animal", id:"bear",          label:"Bear"},
];
function AvatarImg({id,size,ring}){
  const valid=AVATAR_PRESETS.find(p=>p.id===id);
  const src=valid?`/avatars/${valid.id}.svg`:null;
  if(!src) return <div style={{width:size,height:size,borderRadius:999,background:GOLD,color:"#0D1B2A",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:Math.round(size*0.4),boxShadow:ring?`0 0 0 2px ${GOLD}`:"none"}}>MH</div>;
  return <img src={src} alt="" width={size} height={size} style={{display:"block",borderRadius:999,background:"transparent",boxShadow:ring?`0 0 0 2px ${GOLD}`:"none"}}/>;
}
function AvatarPickerModal({open,current,onPick,onClose,t,theme}){
  if(!open) return null;
  const th=theme;
  const groups=["Brand","Finance","Animal"];
  const groupLabels={Brand:t?.brandLbl||"Brand",Finance:t?.financeLbl||"Finance",Animal:t?.animalsLbl||"Animals"};
  return <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.67)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:16,boxShadow:"0 32px 80px rgba(0,0,0,0.55)",width:"min(540px, 100%)",maxHeight:"90vh",overflowY:"auto",padding:22}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:th.text}}>{t?.chooseProfileImage||"Choose a profile image"}</div>
          <div style={{fontSize:11,color:th.muted,marginTop:4}}>{t?.chooseProfileImageHelp||"Click any image to set it as your avatar — it updates the top bar and sidebar instantly."}</div>
        </div>
        <button onClick={onClose} title={t?.close||"Close"} style={{background:"transparent",border:"none",color:th.muted,fontSize:22,cursor:"pointer",lineHeight:1,padding:4}}>×</button>
      </div>
      {groups.map(g=><div key={g} style={{marginTop:18}}>
        <div style={{fontSize:10,fontWeight:700,color:th.accent,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>{groupLabels[g]}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:10}}>
          {AVATAR_PRESETS.filter(p=>p.group===g).map(p=>{
            const active=p.id===current;
            return <button key={p.id} onClick={()=>onPick(p.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,background:active?th.accent+"1A":"transparent",border:`1px solid ${active?th.accent+"66":th.cardBorder}`,borderRadius:10,padding:"10px 6px",cursor:"pointer"}}>
              <img src={`/avatars/${p.id}.svg`} alt="" width="64" height="64" style={{display:"block",borderRadius:999}}/>
              <span style={{fontSize:10,color:active?th.accent:th.muted,fontWeight:active?700:500}}>{p.label}</span>
            </button>;
          })}
        </div>
      </div>)}
      <div style={{marginTop:18,padding:"10px 12px",background:th.bg,border:`1px solid ${th.cardBorder}`,borderRadius:10,fontSize:10,color:th.dim,fontStyle:"italic",lineHeight:1.6}}>{t?.avatarPickerFooter||"Live in /public/avatars/ — drop in your own SVGs (80×80, circular) to extend the set."}</div>
    </div>
  </div>;
}

/* ── SecurityPage — change password (Supabase). v0.18.0 ─────────────────── */
function SecurityPage({t}){
  const th=useTh();
  const[pw,setPw]=useState("");const[pw2,setPw2]=useState("");const[busy,setBusy]=useState(false);
  const[err,setErr]=useState("");const[msg,setMsg]=useState("");
  const INP={width:"100%",padding:"10px 12px",background:th.inp,border:"1px solid "+th.inpBorder,color:th.text,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"};
  const go=async()=>{
    setErr("");setMsg("");
    if(!pw||pw.length<8){setErr(t?.passwordMin8||"Password must be at least 8 characters.");return;}
    if(pw!==pw2){setErr(t?.passwordMismatch||"Passwords don't match.");return;}
    if(!supabase){setErr(t?.supabaseError||"Connection error.");return;}
    setBusy(true);
    try{
      const{error}=await supabase.auth.updateUser({password:pw});
      if(error)setErr(error.message||"Update failed.");
      else{setMsg(t?.passwordUpdated||"Password updated successfully.");setPw("");setPw2("");}
    }catch(e){setErr(e?.message||"Update failed.");}
    setBusy(false);
  };
  return <div className="ga-np" style={{padding:24,maxWidth:520,margin:"0 auto"}}>
    {/* v0.24.0 — page title removed (TopBar shows it). */}
    <div style={{fontSize:12,color:th.muted,marginBottom:18}}>{t?.securitySub||"Change your account password. Sessions on other devices stay signed in until they expire."}</div>
    <div style={{...mCARD(th),padding:18}}>
      <div style={{fontSize:11,fontWeight:700,color:th.accent,letterSpacing:".06em",textTransform:"uppercase",marginBottom:14}}>{t?.changePassword||"Change Password"}</div>
      <div style={{marginBottom:12}}><div style={{fontSize:11,color:th.muted,marginBottom:4,fontWeight:600}}>{t?.newPassword||"New password"}</div><input type="password" value={pw} onChange={e=>setPw(e.target.value)} style={INP} autoComplete="new-password"/></div>
      <div style={{marginBottom:12}}><div style={{fontSize:11,color:th.muted,marginBottom:4,fontWeight:600}}>{t?.confirmPassword||"Confirm new password"}</div><input type="password" value={pw2} onChange={e=>setPw2(e.target.value)} style={INP} autoComplete="new-password" onKeyDown={e=>e.key==="Enter"&&!busy&&go()}/></div>
      {err&&<div style={{fontSize:11,color:th.neg,padding:"8px 10px",background:th.neg+"11",borderRadius:8,marginBottom:10}}>{err}</div>}
      {msg&&<div style={{fontSize:11,color:th.pos,padding:"8px 10px",background:th.pos+"11",borderRadius:8,marginBottom:10}}>{msg}</div>}
      <button onClick={go} disabled={busy} style={{width:"100%",padding:"11px",borderRadius:10,background:GOLD,color:"#0D1B2A",fontWeight:800,fontSize:13,border:"none",cursor:busy?"wait":"pointer",opacity:busy?0.7:1}}>{busy?"…":(t?.updatePassword||"Update password")}</button>
    </div>
    <div style={{marginTop:14,fontSize:11,color:th.dim,fontStyle:"italic",lineHeight:1.6}}>{t?.securityNote||"Tip: use a password manager. We do not store your password directly — Supabase Auth handles hashing."}</div>
  </div>;
}

/* ── BillingPage — services & Stripe links editor. v0.18.0 ──────────────── */
function BillingPage({settings,onSettingsChange,t}){
  const th=useTh();
  const services=Array.isArray(settings.services)?settings.services:[];
  const INP={padding:"8px 10px",background:th.inp,border:"1px solid "+th.inpBorder,color:th.text,borderRadius:6,fontSize:12,outline:"none",boxSizing:"border-box"};
  const set=(i,k,v)=>onSettingsChange({...settings,services:services.map((s,idx)=>idx===i?{...s,[k]:v}:s)});
  const addSvc=()=>onSettingsChange({...settings,services:[...services,{id:"svc-"+Date.now(),name:"New Service",price:"$0",stripeUrl:""}]});
  const delSvc=i=>{if(!confirm("Delete this service?"))return;onSettingsChange({...settings,services:services.filter((_,idx)=>idx!==i)});};
  return <div className="ga-np" style={{padding:24,maxWidth:900,margin:"0 auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,flexWrap:"wrap",gap:10}}>
      {/* v0.24.0 — page title removed (TopBar shows it). */}
      <div>
        <div style={{fontSize:12,color:th.muted}}>{t?.billingSub||"Manage your service catalog and Stripe payment links."}</div>
      </div>
      <button onClick={addSvc} style={{padding:"8px 14px",borderRadius:8,background:GOLD,color:"#0D1B2A",fontWeight:700,fontSize:12,border:"none",cursor:"pointer"}}>＋ {t?.addService||"Add service"}</button>
    </div>
    <div style={{...mCARD(th),padding:16,marginTop:14}}>
      <div style={{fontSize:11,fontWeight:700,color:th.accent,letterSpacing:".06em",textTransform:"uppercase",marginBottom:12}}>{t?.serviceCatalog||"Service Catalog"}</div>
      {services.length===0?<div style={{fontSize:12,color:th.dim,fontStyle:"italic",padding:14,textAlign:"center"}}>{t?.noServices||"No services configured yet. Click \"Add service\" to start."}</div>:
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {services.map((s,i)=><div key={s.id||i} style={{display:"grid",gridTemplateColumns:"1.4fr 0.6fr 2fr auto",gap:8,alignItems:"center"}}>
            <input style={INP} value={s.name||""} onChange={e=>set(i,"name",e.target.value)} placeholder={t?.serviceNamePh||"Service name"}/>
            <input style={{...INP,fontFamily:"'JetBrains Mono',monospace"}} value={s.price||""} onChange={e=>set(i,"price",e.target.value)} placeholder="$0"/>
            <input style={{...INP,fontFamily:"'JetBrains Mono',monospace",fontSize:11}} value={s.stripeUrl||""} onChange={e=>set(i,"stripeUrl",e.target.value)} placeholder={t?.stripeUrlPh||"https://buy.stripe.com/..."}/>
            <button onClick={()=>delSvc(i)} title={t?.delete||"Delete"} style={{padding:"6px 10px",borderRadius:6,background:"transparent",color:th.neg,border:`1px solid ${th.neg}44`,cursor:"pointer",fontSize:12}}>🗑</button>
          </div>)}
        </div>}
    </div>
    <div style={{marginTop:14,fontSize:11,color:th.dim,fontStyle:"italic",lineHeight:1.6}}>{t?.billingNote||"Stripe payment links are created in your Stripe dashboard. Paste the full URL into the field above — clients will be redirected there when they click \"Submit & pay now\" on the intake form."}</div>
  </div>;
}

/* ── BackupPage — download + restore all data. v0.18.0 ─────────────────── */
function BackupPage({clients,settings,onRestoreBackup,t}){
  const th=useTh();
  const[restoreOpen,setRestoreOpen]=useState(false);
  return <div className="ga-np" style={{padding:24,maxWidth:680,margin:"0 auto"}}>
    {restoreOpen&&<BackupImportModal onImport={(b,m)=>{onRestoreBackup(b,m);setRestoreOpen(false);}} onClose={()=>setRestoreOpen(false)} existingClients={clients} t={t}/>}
    {/* v0.24.0 — page title removed (TopBar shows it). */}
    <div style={{fontSize:12,color:th.muted,marginBottom:18}}>{t?.backupSub||"Export every client and your settings as a single JSON file. Keep a copy somewhere safe — Supabase has its own backups but a manual export is your fallback."}</div>
    <div style={{...mCARD(th),padding:18,marginBottom:14}}>
      <div style={{fontSize:11,fontWeight:700,color:th.accent,letterSpacing:".06em",textTransform:"uppercase",marginBottom:8}}>{t?.downloadEverything||"Download Everything"}</div>
      <div style={{fontSize:12,color:th.muted,marginBottom:12,lineHeight:1.5}}>{(t?.downloadEverythingHelp||"Downloads {n} clients + all your settings as a single JSON file.").replace("{n}",clients.length)}</div>
      <button onClick={()=>expBackup(clients,settings)} style={{width:"100%",padding:"12px",borderRadius:10,background:GOLD,color:"#0D1B2A",fontWeight:800,fontSize:13,border:"none",cursor:"pointer"}}>⬇ {t?.downloadBackup||"Download backup (JSON)"}</button>
    </div>
    <div style={{...mCARD(th),padding:18,marginBottom:14}}>
      <div style={{fontSize:11,fontWeight:700,color:th.accent,letterSpacing:".06em",textTransform:"uppercase",marginBottom:8}}>{t?.restoreFromBackup||"Restore from Backup"}</div>
      <div style={{fontSize:12,color:th.muted,marginBottom:12,lineHeight:1.5}}>{t?.restoreFromBackupHelp||"Upload a backup JSON file. You'll be asked whether to merge with current data or replace it."}</div>
      <button onClick={()=>setRestoreOpen(true)} style={{width:"100%",padding:"12px",borderRadius:10,background:"transparent",color:th.text,fontWeight:700,fontSize:13,border:`1px solid ${th.cardBorder}`,cursor:"pointer"}}>📂 {t?.uploadBackup||"Upload backup JSON"}</button>
    </div>
    <div style={{fontSize:11,color:th.dim,fontStyle:"italic",lineHeight:1.6}}>{t?.backupNote||"Backups never include passwords or session tokens — only client data and app settings."}</div>
  </div>;
}

/* ── ArchivedClientsPage — list + restore + permanent delete. v0.18.0 ──── */
function ArchivedClientsPage({clients,onRestore,onDelete,t}){
  const th=useTh();
  const archived=clients.filter(c=>c.archived);
  return <div className="ga-np" style={{padding:24,maxWidth:880,margin:"0 auto"}}>
    {/* v0.24.0 — page title removed (TopBar shows it). */}
    <div style={{fontSize:12,color:th.muted,marginBottom:18}}>{(t?.archivedClientsSub||"{n} client(s) currently archived. Restore them back to the active list, or delete permanently. Deleted clients cannot be recovered.").replace("{n}",archived.length)}</div>
    {archived.length===0?<div style={{...mCARD(th),padding:30,textAlign:"center",color:th.dim,fontStyle:"italic"}}>{t?.noArchivedClients||"No archived clients."}</div>:
      <div style={{...mCARD(th),padding:0,overflow:"hidden"}}>
        {archived.map((c,i)=><div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderTop:i===0?"none":`1px solid ${th.cardBorder}`}}>
          <div style={{width:40,height:40,borderRadius:99,background:GOLD+"22",color:GOLD,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,border:`2px solid ${GOLD}44`,flexShrink:0}}>{(c.firstName||"?")[0]}{(c.lastName||"?")[0]}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:700,color:th.text}}>{c.firstName} {c.lastName}{c.partnerFirst?` & ${c.partnerFirst}`:""}</div>
            <div style={{fontSize:11,color:th.dim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.email||"—"}</div>
          </div>
          <button onClick={()=>onRestore(c.id)} title={t?.restore||"Restore"} style={{padding:"6px 12px",borderRadius:8,background:th.pos+"22",color:th.pos,fontWeight:700,fontSize:11,border:`1px solid ${th.pos}44`,cursor:"pointer"}}>↩ {t?.restoreLbl||"Restore"}</button>
          <button onClick={()=>{if(confirm(`Permanently delete ${c.firstName} ${c.lastName}? This cannot be undone.`))onDelete(c.id);}} title={t?.deletePermanent||"Delete permanently"} style={{padding:"6px 12px",borderRadius:8,background:"transparent",color:th.neg,fontWeight:700,fontSize:11,border:`1px solid ${th.neg}44`,cursor:"pointer"}}>🗑 {t?.delete||"Delete"}</button>
        </div>)}
      </div>}
  </div>;
}

/* ── WhatsNewPage — release notes. v0.18.0 — hardcoded, edit this array. ─ */
const WHATS_NEW_ENTRIES=[
  {v:"v0.28.0",date:"2026-05-22",title:"Dismiss or mute alerts",bullets:[
    "Each advisor alert + client-due row now has a small ✕ — click to snooze.",
    "Credit-card / bill alerts dismiss until next billing cycle and re-appear automatically next month — perfect for the 'I paid it' case.",
    "Each card has a '(N muted) ▾' expander to see what you snoozed and restore it with one click.",
    "Toast confirms every dismiss + restore, in English or Spanish."
  ]},
  {v:"v0.27.0",date:"2026-05-22",title:"Smoother dashboard — skeleton, count-ups, pulse",bullets:[
    "Dashboard now loads with a soft shimmer skeleton instead of a plain ⚓ Loading… text.",
    "KPI tile numbers smoothly count up when they change (filter clients, archive someone, etc.) instead of snapping.",
    "Critical alert pills ('No Contact >60d', 'Promo Expiring <14d') gently pulse so they don't get lost in the list.",
    "Every search input now has a proper screen-reader label.",
    "All animations respect your OS 'Reduce motion' setting."
  ]},
  {v:"v0.26.0",date:"2026-05-22",title:"Accessibility + polish pass",bullets:[
    "Dark-mode greys bumped to pass WCAG AA contrast — small labels are noticeably more readable.",
    "Every Save / Archive / Restore / Delete now triggers a green ✓ confirmation toast.",
    "TopBar icon buttons (theme, hide-numbers, EN/ES, avatar) all carry accessible labels and 'pressed' state.",
    "Tables, hover states, focus rings, and motion-reduction all standardized.",
    "Z-index scale defined as CSS variables — fewer modal-stacking surprises going forward."
  ]},
  {v:"v0.25.x",date:"2026-05-22",title:"Clients page tidied",bullets:[
    "Search + Sort + actions all sit on one row on desktop again (no more vertical stacking).",
    "Per-row kebab was added then removed — felt noisy. Bulk actions remain in the section kebab; per-client actions live inside the client detail header.",
    "Sort dropdown shrunk to a compact 190px with cleaner ⇅-prefixed labels."
  ]},
  {v:"v0.24.0",date:"2026-05-22",title:"Audit-driven bug pass",bullets:[
    "Duplicate page titles removed from 11 pages — the TopBar already shows them.",
    "Dashboard chart now disambiguates 'Jan' vs 'Jan' across years (Jan '25 / Jan '26).",
    "Settings phone fields auto-format. EmailSupport modal clarifies that 'recipient' is the reply-to address.",
    "Alert pill titles no longer have leading emojis hard-coded — cleaner labels."
  ]},
  {v:"v0.23.0",date:"2026-05-22",title:"Client Due search + T&C gate + intake Welcome",bullets:[
    "Client Due card has its own search bar (was sharing the advisor-alerts one).",
    "Terms of Service modal now waits for full bootstrap before showing — no more dashboard 'flash' behind it.",
    "Public intake `/intake?invite=...` opens with a branded Welcome step before the form.",
    "Calculators page goes from 2-col to 3-4 col tiles with descriptions. Resources page tightens to match.",
    "Promotions get a colored 'X days left' / 'Expired' badge."
  ]},
  {v:"v0.21.0",date:"2026-05-21",title:"PDF / print rebuild",bullets:[
    "Saving any report as PDF now uses Source Serif 4 for body text, Newsreader italic for titles, JetBrains Mono with tabular numerals for currency.",
    "Branded print header + footer on every page (gold hairline, monogram + wordmark).",
    "Intake-form PDF template rebuilt to match the same spec."
  ]},
  {v:"v0.20.0",date:"2026-05-21",title:"Net Worth donut + Email Support + sort + alert parity",bullets:[
    "Dashboard now shows a Net Worth Distribution donut (Negative / $0–50K / $50K–250K / $250K+).",
    "In-app Email Support modal — send a question to mauricio@goldenanchor.life right from the avatar menu.",
    "Client sort moved out of the dashboard onto the Clients page where it belongs.",
    "Advisor Alerts + Client Due cards rendered side-by-side."
  ]},
  {v:"v0.19.0",date:"2026-05-21",title:"Sidebar polish + Client Detail nav + ES translations",bullets:[
    "Sidebar items got proper spacing, dividers, and active-state highlighting.",
    "Client Detail tabs gain ◀ / ▶ arrows so you can step through tabs on narrow screens.",
    "Spanish translations filled in across many newer labels."
  ]},
  {v:"v0.18.0",date:"2026-05-21",title:"Avatar picker + Security/Billing/Backup/Help pages",bullets:[
    "Profile in the top-right menu now opens an Avatar Picker (12 SVG presets — Brand, Finance, Animal).",
    "Security page lets you change your password in-app.",
    "Billing & Plan replaces the old Services & Stripe section — add/edit/delete services and paste Stripe links.",
    "Backup page exposes one-click JSON download + restore.",
    "Archived Clients page with Restore + permanent Delete per row.",
    "Help & Support page with FAQ + email-the-advisor link.",
    "Sidebar cleanup: theme, EN/ES, and Sign Out moved to the top bar where they belong."
  ]},
  {v:"v0.17.0",date:"2026-05-21",title:"TopBar + Settings page (Claude design Phase 8)",bullets:[
    "New TopBar on every page with title, EN/ES, theme, and gold MH avatar dropdown.",
    "Settings became a full page (6 cards) instead of a modal."
  ]},
  {v:"v0.16.x",date:"2026-05-21",title:"Phase 8 dashboard + bugfix pass",bullets:[
    "Dashboard: 4 wide KPIs, Income vs Spending composed chart, sidebar profile widget.",
    "Defined the missing IntakeFormBody — step 4 of public intake no longer goes blank.",
    "Engagement letter Section 4 simplified ($500/yr or $30/mo Lite; AUM + Commissions lines removed).",
    "Public intake submit/pay split into two buttons."
  ]},
  {v:"v0.15.x",date:"2026-05-21",title:"Claude Design System port (Phases 1-4)",bullets:[
    "Brand assets, Plus Jakarta Sans + Newsreader fonts, PDF rebuild, area charts everywhere."
  ]}
];
function WhatsNewPage({t}){
  const th=useTh();
  return <div className="ga-np" style={{padding:24,maxWidth:820,margin:"0 auto"}}>
    {/* v0.24.0 — page title removed (TopBar shows it). */}
    <div style={{fontSize:12,color:th.muted,marginBottom:18}}>{t?.whatsNewSub||"Recent updates to the app. Full changelog lives in the GitHub repo."}</div>
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {WHATS_NEW_ENTRIES.map(e=><div key={e.v} style={{...mCARD(th),padding:18}}>
        <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:6,flexWrap:"wrap"}}>
          <span style={{fontSize:14,fontWeight:800,color:GOLD,fontFamily:"'JetBrains Mono',monospace"}}>{e.v}</span>
          <span style={{fontSize:10,color:th.dim,letterSpacing:"0.04em"}}>{e.date}</span>
        </div>
        <div style={{fontSize:13,fontWeight:700,color:th.text,marginBottom:10}}>{e.title}</div>
        <ul style={{margin:"0 0 0 18px",padding:0,fontSize:12,color:th.muted,lineHeight:1.7}}>
          {e.bullets.map((b,i)=><li key={i} style={{marginBottom:4}}>{b}</li>)}
        </ul>
      </div>)}
    </div>
  </div>;
}

/* ── HelpSupportPage — FAQ + email link. v0.18.0 ────────────────────────── */
const FAQ_ENTRIES=[
  {q:"How do I add a new client?",a:"From the Clients tab or Dashboard, click the gold \"+ Add\" button at the top right. Fill in name + email at minimum. You can also send an intake invite from Intake Forms → \"New invite\" and the prospect fills out their own info."},
  {q:"Why isn't my signature showing on engagement letters?",a:"Open the avatar dropdown (top right) → Settings → Branding → draw or type your signature. Save. Open any client's engagement letter — your signature should appear at the top. If the public intake doesn't show it, check that you've signed at least once in Profile & Settings."},
  {q:"How do I send an intake invite to a prospect?",a:"Go to Intake Forms (sidebar) → click the gold \"New invite\" button. Enter the prospect's name, email, and phone, pick a language, and choose Email or SMS. Click Send."},
  {q:"How do I export a single client's data?",a:"Open the client → click the kebab (⋯) in the top-right of the header → Export CSV. To back up ALL clients at once, open the avatar dropdown → Backup data → Download backup."},
  {q:"How do I change my password?",a:"Avatar dropdown (top right) → Security. Type a new password (8+ characters) and confirm. Other devices stay signed in until their sessions expire."},
  {q:"Why are some numbers blurred?",a:"You've turned on \"Hide all numbers\" — the 👁 button in the top bar. Click it again to show numbers. This is for screen-sharing or showing the app to non-clients."}
];
/* ── EmailSupportModal — in-app contact form. Sends via Resend through
   /api/send-support-email to finance@goldenanchor.life. v0.20.0           */
function EmailSupportModal({onClose,t,settings,authUser}){
  const th=useTh();
  const[subject,setSubject]=useState(t?.emailSupportDefaultSubject||"Question about the app");
  const[message,setMessage]=useState("");
  const[busy,setBusy]=useState(false);
  const[err,setErr]=useState("");
  const[done,setDone]=useState(false);
  const INP={width:"100%",padding:"10px 12px",background:th.inp,border:"1px solid "+th.inpBorder,color:th.text,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"};
  const send=async()=>{
    setErr("");
    if(!message.trim()||message.trim().length<5){setErr(t?.emailSupportTooShort||"Please write at least a few words about your question.");return;}
    setBusy(true);
    const r=await gaSendSupportEmail({
      subject:subject.trim()||"Golden Anchor app — support request",
      message:message.trim(),
      advisorName:settings?.advisorName||"",
      advisorEmail:settings?.advisorEmail||authUser?.email||"",
      buildMarker:(typeof window!=="undefined"&&window.__GA_BUILD__)||"—"
    });
    setBusy(false);
    if(r.ok){setDone(true);setTimeout(()=>onClose(),1800);}
    else setErr(r.error||"Send failed.");
  };
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.67)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:14}}>
    <div style={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:16,boxShadow:"0 32px 80px rgba(0,0,0,0.55)",width:"min(560px,100%)",maxHeight:"90vh",overflowY:"auto",padding:22}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:th.text}}>📧 {t?.emailSupportTitle||"Email support"}</div>
          <div style={{fontSize:11,color:th.muted,marginTop:4,lineHeight:1.5}}>{t?.emailSupportHelp||"Sends your message to finance@goldenanchor.life. We'll reply to your advisor email on file."}</div>
        </div>
        <button onClick={onClose} title={t?.close||"Close"} style={{background:"transparent",border:"none",color:th.muted,fontSize:22,cursor:"pointer",lineHeight:1,padding:4}}>×</button>
      </div>
      {!done?<>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:th.muted,marginBottom:4,fontWeight:600}}>{t?.emailSupportReplyTo||"Reply-to (we'll respond to this address)"}</div>
          <div style={{fontSize:12,color:th.text,padding:"8px 12px",background:th.bg,border:`1px solid ${th.cardBorder}`,borderRadius:8,fontFamily:"'JetBrains Mono',monospace"}}>{settings?.advisorEmail||authUser?.email||"(no email on file)"}</div>
          <div style={{fontSize:10,color:th.dim,marginTop:4,fontStyle:"italic"}}>{t?.emailSupportDestHint||"Goes to finance@goldenanchor.life"}</div>
        </div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:th.muted,marginBottom:4,fontWeight:600}}>{t?.emailReportSubject||"Subject"}</div>
          <input value={subject} onChange={e=>setSubject(e.target.value)} style={INP}/>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:th.muted,marginBottom:4,fontWeight:600}}>{t?.emailReportMessage||"Message"}</div>
          <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder={t?.emailSupportPh||"Describe your question or issue. Include screenshots if useful by replying to the email after sending."} style={{...INP,minHeight:140,resize:"vertical"}}/>
        </div>
        {err&&<div style={{fontSize:11,color:th.neg,padding:"8px 10px",background:th.neg+"11",borderRadius:8,marginBottom:10}}>⚠️ {err}</div>}
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button onClick={onClose} disabled={busy} style={{padding:"10px 16px",borderRadius:8,background:"transparent",color:th.muted,border:`1px solid ${th.cardBorder}`,cursor:"pointer",fontSize:12,fontWeight:600}}>{t?.cancel||"Cancel"}</button>
          <button onClick={send} disabled={busy} style={{padding:"10px 18px",borderRadius:8,background:GOLD,color:"#0D1B2A",fontWeight:800,fontSize:13,border:"none",cursor:busy?"wait":"pointer",opacity:busy?0.6:1}}>{busy?(t?.intakeSubmitting||"Sending…"):"📧 "+(t?.send||"Send")}</button>
        </div>
      </>:
      <div style={{textAlign:"center",padding:"30px 10px"}}>
        <div style={{fontSize:48,color:th.pos,marginBottom:10}}>✓</div>
        <div style={{fontSize:14,fontWeight:700,color:th.text,marginBottom:6}}>{t?.emailSupportSent||"Message sent!"}</div>
        <div style={{fontSize:12,color:th.muted}}>{t?.emailSupportSentSub||"Our team will reply to your advisor email shortly."}</div>
      </div>}
    </div>
  </div>;
}

function HelpSupportPage({t,settings,authUser}){
  const th=useTh();
  const[open,setOpen]=useState(null);
  const[modalOpen,setModalOpen]=useState(false);
  return <div className="ga-np" style={{padding:24,maxWidth:820,margin:"0 auto"}}>
    {modalOpen&&<EmailSupportModal onClose={()=>setModalOpen(false)} t={t} settings={settings} authUser={authUser}/>}
    {/* v0.24.0 — page title removed (TopBar shows it). */}
    <div style={{fontSize:12,color:th.muted,marginBottom:18}}>{t?.helpSub||"Common questions. Can't find an answer? Email support directly."}</div>
    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
      {FAQ_ENTRIES.map((e,i)=><div key={i} style={{...mCARD(th),padding:0,overflow:"hidden"}}>
        <button onClick={()=>setOpen(o=>o===i?null:i)} style={{width:"100%",textAlign:"left",padding:"14px 16px",background:"transparent",border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
          <span style={{fontSize:13,fontWeight:700,color:th.text}}>{e.q}</span>
          <span style={{fontSize:14,color:th.muted,flexShrink:0}}>{open===i?"−":"+"}</span>
        </button>
        {open===i&&<div style={{padding:"0 16px 16px",fontSize:12,color:th.muted,lineHeight:1.7,borderTop:`1px solid ${th.cardBorder}`,paddingTop:14}}>{e.a}</div>}
      </div>)}
    </div>
    <div style={{...mCARD(th),padding:18,background:GOLD+"08",border:`1px solid ${GOLD}33`}}>
      <div style={{fontSize:13,fontWeight:700,color:th.text,marginBottom:6}}>📧 {t?.stillNeedHelp||"Still need help?"}</div>
      <div style={{fontSize:12,color:th.muted,marginBottom:12,lineHeight:1.6}}>{t?.stillNeedHelpSubInApp||"Open a support request directly from the app — our team will reply to your advisor email."}</div>
      <button onClick={()=>setModalOpen(true)} style={{display:"inline-block",padding:"10px 16px",borderRadius:8,background:GOLD,color:"#0D1B2A",fontWeight:700,fontSize:12,border:"none",cursor:"pointer"}}>📧 {t?.emailSupport||"Email support"}</button>
    </div>
  </div>;
}

/* ── SettingsCard — 2-col read-only card for the Profile & Settings page.
   Click "Edit" to open the ProfileModal scoped to that section.            */
function SettingsCard({title,rows,onEdit,t,th}){
  return <div style={{...mCARD(th),padding:16,minHeight:0}}>
    <div style={{fontSize:12,fontWeight:700,color:th.accent,letterSpacing:".06em",textTransform:"uppercase",marginBottom:12}}>{title}</div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {/* v0.25.0 — let labels shrink so values get more room. Removed ellipsis; values wrap onto 2 lines if very long. */}
      {rows.map(([k,v],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",fontSize:12,paddingBottom:8,borderBottom:`1px dashed ${th.cardBorder}`,gap:10}}>
        <span style={{color:th.muted,flex:"0 1 auto",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{k}</span>
        <span style={{color:th.text,fontWeight:600,fontVariantNumeric:"tabular-nums",textAlign:"right",flex:"1 1 auto",minWidth:0,wordBreak:"break-word"}}>{v}</span>
      </div>)}
    </div>
    <div style={{marginTop:12,textAlign:"right"}}>
      <button onClick={onEdit} style={{fontSize:11,padding:"5px 14px",borderRadius:8,background:th.accent+"22",color:th.accent,border:`1px solid ${th.accent}44`,cursor:"pointer",fontWeight:700}}>{t?.edit||"Edit"}</button>
    </div>
  </div>;
}

/* ── SettingsPage — full-page replacement for the old scrollable ProfileModal.
   Matches ui_kits/advisor_app/index.html SettingsView (2-col card grid).    */
function SettingsPage({settings,onEdit,onBackup,onRestoreBackup,t,clients}){
  const th=useTh();
  const numArchived=(clients||[]).filter(c=>c.archived).length;
  const advisorRows=[
    [t?.nameLbl||"Name", settings.advisorName||"—"],
    [t?.emailLbl||"Email", settings.advisorEmail||"—"],
    [t?.phoneLbl||"Phone", settings.advisorPhone?(typeof fmtPh==="function"?fmtPh(settings.advisorPhone):settings.advisorPhone):"—"],
    [t?.instagram||"Instagram", settings.ig||"—"],
    [t?.company||"Company", settings.companyName||"—"],
  ];
  const accent=(settings.darkAccent||GOLD).toString().toUpperCase();
  const bg=((settings.darkBg)||"#111827").toString().toUpperCase();
  const card=((settings.darkCard)||"#1F2937").toString().toUpperCase();
  const appearanceRows=[
    [t?.theme||"Theme", settings.darkMode!==false?(t?.darkMode||"Dark"):(t?.lightMode||"Light")],
    [t?.accent||"Accent", `Gold ${accent}`],
    [t?.background||"Background", `Navy ${bg}`],
    [t?.card||"Card", `Navy 600 ${card}`],
    [t?.appZoom||"App zoom", Math.round((settings.appZoom||1)*100)+"%"],
  ];
  const localizationRows=[
    [t?.language||"Language", t?.englishEn||"English (EN)"],
    [t?.dateFormat||"Date format", "Month DD, YYYY"],
    [t?.currency||"Currency", "USD ($)"],
  ];
  const remindersRows=[
    [t?.noContactThresh||"No-contact threshold", (settings.noContactDays||30)+" "+(t?.daysLbl||"days")],
    [t?.highDsrAlert||"High DSR alert", settings.dsrAlert!==false?(t?.onLbl||"On"):(t?.offLbl||"Off")],
    [t?.promoExpiringAlert||"Promo expiring alert", (settings.promoLeadDays||60)+" "+(t?.daysOutLbl||"days out")],
    [t?.debtRisingAlert||"Debt-rising alert", settings.debtRisingAlert?(t?.onLbl||"On"):(t?.offLbl||"Off")],
  ];
  const svcList=Array.isArray(settings.services)&&settings.services.length?settings.services:[
    {name:t?.initialCheckup||"Initial Checkup",price:"$149"},
    {name:t?.quarterlyReview||"Quarterly Review",price:"$199"},
    {name:t?.strategySession||"Strategy Session",price:"$129"},
    {name:t?.monthlyLite||"Monthly Lite",price:"$49/mo"},
    {name:t?.insuranceConsult||"Insurance Consult",price:"Free"}
  ];
  const servicesRows=svcList.slice(0,6).map(s=>[s.name||"Service",`${s.price||"—"} · ${s.stripeUrl?(t?.linkedLbl||"linked"):(t?.unlinkedLbl||"not linked")}`]);
  const backupRows=[
    [t?.lastBackupLbl||"Last verified backup", settings.lastBackupVerified||"—"],
    [t?.autoBackup||"Auto-backup", t?.weeklyLbl||"Weekly"],
    [t?.exportFormat||"Export format", "JSON + CSV"],
  ];
  return <div className="ga-np" style={{padding:24,maxWidth:1100,margin:"0 auto"}}>
    {/* v0.24.0 — page title removed (TopBar shows it). */}
    <div style={{fontSize:12,color:th.muted,marginBottom:18}}>{t?.profileSettingsSub||"Edit any section to update your details, services, or theme."}</div>
    <div data-ga-grid="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <SettingsCard title={"👤 "+(t?.advisorInformation||"Advisor Information")} rows={advisorRows} onEdit={()=>onEdit("profile")} t={t} th={th}/>
      <SettingsCard title={"🎨 "+(t?.appearance||"Appearance")} rows={appearanceRows} onEdit={()=>onEdit("appearance")} t={t} th={th}/>
      <SettingsCard title={"🌍 "+(t?.localization||"Localization")} rows={localizationRows} onEdit={()=>onEdit("localization")} t={t} th={th}/>
      <SettingsCard title={"🔔 "+(t?.reminders||"Reminders")} rows={remindersRows} onEdit={()=>onEdit("reminders")} t={t} th={th}/>
      <SettingsCard title={"💼 "+(t?.servicesAndStripeLinks||"Services & Stripe Links")} rows={servicesRows} onEdit={()=>onEdit("services")} t={t} th={th}/>
      <SettingsCard title={"💾 "+(t?.backupAndData||"Backup & Data")} rows={backupRows} onEdit={()=>onEdit("backup")} t={t} th={th}/>
    </div>
    {numArchived>0 && <div style={{marginTop:14,padding:"10px 14px",background:th.warn+"11",border:`1px solid ${th.warn}33`,borderRadius:10,fontSize:11,color:th.muted}}>🗂 {numArchived} {t?.archivedClientsLbl||"archived clients"} · <button onClick={()=>onEdit("archived")} style={{background:"transparent",border:"none",color:th.accent,fontWeight:700,fontSize:11,cursor:"pointer",padding:0,textDecoration:"underline"}}>{t?.viewArchived||"View archived"}</button></div>}
  </div>;
}

/* ── AvatarBubble — gold initials chip used in TopBar + sidebar footer ──── */
function AvatarBubble({initials,size,ring,onClick,title}){
  return <button onClick={onClick} title={title} style={{background:"transparent",border:ring?`2px solid ${GOLD}`:"2px solid transparent",padding:0,cursor:onClick?"pointer":"default",lineHeight:0,borderRadius:999,width:size+4,height:size+4,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{width:size,height:size,borderRadius:999,background:GOLD,color:"#0D1B2A",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:Math.round(size*0.38),letterSpacing:"0.03em"}}>{initials||"MH"}</div>
  </button>;
}

/* ── TopBar — global header. Matches ui_kits/advisor_app/TopBar.jsx.
   Title + breadcrumb on the left; EN/ES + hide + theme + avatar dropdown on
   the right. Avatar opens the big account menu (Profile, Settings, Security,
   Billing, Backup, Archived clients, What's new, Help, Sign out).          */
function TopBar({title,breadcrumb,isDark,setDark,lang,setLang,hideNumbers,setHide,signedIn,onNav,onPickAvatar,onSignOut,advisorName,advisorEmail,avatarId,avatarInitials,th,isMobile,onOpenDrawer,t,version,archivedCount}){
  const[menu,setMenu]=useState(false);
  const menuRef=useRef();
  useEffect(()=>{
    const h=e=>{if(menuRef.current&&!menuRef.current.contains(e.target))setMenu(false);};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);
  const items=[
    {icon:"🖼",label:t?.menuProfile||"Profile",sub:t?.menuProfileSub||"Change profile image",onClick:onPickAvatar},
    {icon:"⚙️",label:t?.menuSettings||"Settings",sub:t?.menuSettingsSub||"Theme, language, info",onClick:()=>onNav("settings")},
    {icon:"🛡️",label:t?.menuSecurity||"Security",sub:t?.menuSecuritySub||"Change password",onClick:()=>onNav("security")},
    {icon:"🏷️",label:t?.menuBilling||"Billing & plan",sub:t?.menuBillingSub||"Services & Stripe links",onClick:()=>onNav("billing")},
    {divider:true},
    {icon:"💾",label:t?.menuBackup||"Backup data",sub:t?.menuBackupSub||"Download / restore JSON",onClick:()=>onNav("backup")},
    {icon:"🗂",label:t?.menuArchived||"Archived clients"+(archivedCount?` (${archivedCount})`:""),onClick:()=>onNav("archived")},
    {icon:"📥",label:t?.menuWhatsNew||"What's new",sub:version||"v0.28.0",onClick:()=>onNav("whats-new")},
    {icon:"❓",label:t?.menuHelp||"Help & support",onClick:()=>onNav("help")},
    {divider:true},
    {icon:"🚪",label:t?.signOut||"Sign out",danger:true,onClick:onSignOut}
  ];
  return <div className="ga-np" style={{padding:isMobile?"12px 14px":"16px 24px",borderBottom:`1px solid ${th.cardBorder}`,background:th.bg,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
    <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
      {isMobile&&<button onClick={onOpenDrawer} title={t?.menu||"Menu"} aria-label={t?.menu||"Menu"} style={{background:th.accent+"22",border:`1px solid ${th.accent}44`,color:th.accent,borderRadius:8,padding:"8px 10px",cursor:"pointer",fontSize:16,lineHeight:1}}>☰</button>}
      <div style={{minWidth:0}}>
        {breadcrumb&&<div style={{fontSize:11,color:th.dim,marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{breadcrumb}</div>}
        <div style={{fontSize:isMobile?16:20,fontWeight:800,color:th.text,letterSpacing:"-0.01em",lineHeight:1.1}}>{title}</div>
      </div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div role="group" aria-label={t?.languageSelector||"Language"} style={{display:"flex",border:`1px solid ${th.cardBorder}`,borderRadius:8,overflow:"hidden"}}>
        {["en","es"].map(l=><button key={l} onClick={()=>setLang(l)} aria-pressed={lang===l} aria-label={l==="en"?(t?.langEn||"English"):(t?.langEs||"Spanish")} style={{padding:"5px 12px",fontSize:11,fontWeight:700,background:lang===l?th.accent+"22":"transparent",color:lang===l?th.accent:th.muted,border:"none",cursor:"pointer",letterSpacing:"0.05em",textTransform:"uppercase"}}>{l}</button>)}
      </div>
      <button onClick={()=>setHide(!hideNumbers)} title={t?.hideNumbers||"Hide all numbers"} aria-label={hideNumbers?(t?.showNumbers||"Show all numbers"):(t?.hideNumbers||"Hide all numbers")} aria-pressed={hideNumbers} style={{background:hideNumbers?th.accent+"22":"transparent",color:hideNumbers?th.accent:th.muted,border:`1px solid ${hideNumbers?th.accent+"44":th.cardBorder}`,borderRadius:8,padding:"5px 11px",fontSize:14,cursor:"pointer",lineHeight:1}}>{hideNumbers?"👁️‍🗨️":"👁️"}</button>
      <button onClick={()=>setDark(!isDark)} title={t?.theme||"Theme"} aria-label={isDark?(t?.switchToLight||"Switch to light mode"):(t?.switchToDark||"Switch to dark mode")} style={{background:"transparent",color:th.muted,border:`1px solid ${th.cardBorder}`,borderRadius:8,padding:"5px 11px",fontSize:14,cursor:"pointer",lineHeight:1}}>{isDark?"🌙":"☀️"}</button>
      <div ref={menuRef} style={{position:"relative"}}>
        <button onClick={()=>setMenu(o=>!o)} title={t?.accountMenu||"Account & app menu"} aria-label={t?.accountMenu||"Account & app menu"} aria-haspopup="menu" aria-expanded={menu} style={{background:"transparent",border:menu?`2px solid ${GOLD}`:"2px solid transparent",padding:0,cursor:"pointer",lineHeight:0,borderRadius:999,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center"}}>
          {avatarId?<AvatarImg id={avatarId} size={30}/>:<div style={{width:30,height:30,borderRadius:999,background:GOLD,color:"#0D1B2A",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11}}>{avatarInitials||"MH"}</div>}
        </button>
        {menu&&<div style={{position:"absolute",top:42,right:0,background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:12,boxShadow:"0 12px 40px rgba(0,0,0,0.45)",width:280,zIndex:80,padding:6}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 10px 12px",borderBottom:`1px solid ${th.cardBorder}`,marginBottom:4}}>
            {avatarId?<AvatarImg id={avatarId} size={36}/>:<div style={{width:36,height:36,borderRadius:999,background:GOLD,color:"#0D1B2A",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13}}>{avatarInitials||"MH"}</div>}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:th.text}}>{advisorName||"Mauricio Hernandez"}</div>
              <div style={{fontSize:10,color:th.muted,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{advisorEmail||"—"}</div>
              {signedIn&&<div style={{marginTop:6,display:"inline-flex",alignItems:"center",gap:4,fontSize:9,fontWeight:700,letterSpacing:"0.06em",background:th.pos+"22",color:th.pos,border:`1px solid ${th.pos}44`,borderRadius:99,padding:"2px 7px",textTransform:"uppercase"}}>● {t?.signedIn||"Signed in"}</div>}
            </div>
          </div>
          {items.map((it,i)=>it.divider?<div key={i} style={{height:1,background:th.cardBorder,margin:"4px 8px"}}/>:
            <button key={i} onClick={()=>{setMenu(false);it.onClick&&it.onClick();}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",textAlign:"left",padding:"8px 10px",background:"transparent",border:"none",color:it.danger?th.neg:th.text,fontSize:12,cursor:"pointer",borderRadius:8,fontWeight:it.danger?700:500}} onMouseEnter={e=>{e.currentTarget.style.background=th.bg;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
              <span style={{width:18,fontSize:13,lineHeight:1,textAlign:"center"}}>{it.icon}</span>
              <span style={{flex:1,minWidth:0}}>
                <span style={{display:"block",lineHeight:1.2}}>{it.label}</span>
                {it.sub&&<span style={{display:"block",fontSize:10,color:th.dim,marginTop:2,fontWeight:400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{it.sub}</span>}
              </span>
            </button>
          )}
          <div style={{padding:"10px 10px 6px",borderTop:`1px solid ${th.cardBorder}`,marginTop:4,fontSize:9,color:th.dim,display:"flex",justifyContent:"space-between",letterSpacing:"0.04em"}}>
            <span>Golden Anchor · {version||"v0.28.0"}</span>
            <span>⚓ {t?.educationalCoaching||"Educational coaching"}</span>
          </div>
        </div>}
      </div>
    </div>
  </div>;
}

export default function App(){
  const[authUser,setAuthUser]=useState(null);const[authReady,setAuthReady]=useState(false);const[bootstrapping,setBootstrapping]=useState(false);
  // v0.6.1 — Read persisted lang+isDark from settings so toggles survive refresh.
  const _gaInitSettings=(()=>{try{return{...DEF_SETTINGS,...JSON.parse(localStorage.getItem("ga_settings")||"{}")};} catch{return DEF_SETTINGS;}})();
  const[lang,setLang]=useState(_gaInitSettings.lang==="es"?"es":"en");
  const[isDark,setDark]=useState(_gaInitSettings.isDark!==false);
  const[settings,setSettings]=useState(_gaInitSettings);
  // v0.5.2a — Toast for save failures + auto-logout state
  const[toast,setToast]=useState(null); // {kind:"error"|"info", msg, ts}
  const[idleWarn,setIdleWarn]=useState(false);
  const[justRestoredDraft,setJustRestoredDraft]=useState(false);
  // Auto-logout config: 30 min total, 1 min warning before
  const IDLE_TIMEOUT_MS=30*60*1000;
  const IDLE_WARN_MS=29*60*1000;
  const _idleTimerRef=useRef(null);
  const _idleWarnTimerRef=useRef(null);
  const _baseTh=isDark?makeDark(settings.darkAccent||GOLD):makeLight(settings.lightAccent||"#2563EB");const theme={..._baseTh,bg:(isDark?settings.darkBg:settings.lightBg)||_baseTh.bg,card:(isDark?settings.darkCard:settings.lightCard)||_baseTh.card};const t=T[lang]||T.en; // EN/ES toggle wired in v0.2.0; v0.8.1 page/card bg overrides
  const[nav,setNav]=useState("dashboard");const[selected,setSelected]=useState(null);const[selectedTab,setSelectedTab]=useState("report");const[selectedCalc,setSelectedCalc]=useState(null);// v0.13.1 — which calculator is open inside the /calculators page
  const[addOpen,setAddOpen]=useState(false);const[profileOpen,setProfileOpen]=useState(false);const[importDupResolver,setImportDupResolver]=useState(null);const[sidebarCollapsed,setSidebarCollapsed]=useState(false);const[drawerOpen,setDrawerOpen]=useState(false);const[avatarPickerOpen,setAvatarPickerOpen]=useState(false);const[clientsMenuOpen,setClientsMenuOpen]=useState(false);const[clientsSort,setClientsSort]=useState("name");const[sidebarImportOpen,setSidebarImportOpen]=useState(false);const vp=useViewport();const isPublicIntakeRoute=typeof window!=="undefined"&&/\/intake\/?(\?|$)/.test((window.location.pathname||"")+(window.location.search||""));
  // Close Clients hamburger on outside click
  useEffect(()=>{if(!clientsMenuOpen)return;const h=e=>{const el=document.getElementById("ga-clients-menu");if(el&&!el.contains(e.target))setClientsMenuOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[clientsMenuOpen]);
  const[clients,setClients]=useState(()=>{try{const s=localStorage.getItem("ga_v3");return s?JSON.parse(s).map(mig):SEED.map(mig);}catch{return SEED.map(mig);}});
  // v0.5.2a — Listen for save-failure events (dispatched by gaSaveClient/gaSaveSettings on error)
  // v0.28.0 — Also listen for ga-toast events (alert dismiss/restore feedback)
  useEffect(()=>{
    const onSaveFail=(e)=>{const which=e?.detail?.which||"data";setToast({kind:"error",msg:(t.saveFailedToast||"Couldn't save {x} — your changes are local only. Reload and try again.").replace("{x}",which),ts:Date.now()});};
    const onToast=(e)=>{const d=e?.detail||{};setToast({kind:d.kind||"success",msg:d.msg||"",ts:Date.now()});};
    if(typeof window!=="undefined"){window.addEventListener("ga-save-failed",onSaveFail);window.addEventListener("ga-toast",onToast);}
    return()=>{if(typeof window!=="undefined"){window.removeEventListener("ga-save-failed",onSaveFail);window.removeEventListener("ga-toast",onToast);}};
  },[t]);
  // v0.5.2a — Auto-dismiss toast after 6s
  useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(null),6000);return()=>clearTimeout(id);},[toast]);
  // v0.5.2a — Auto-logout idle timer (resets on user activity, only while signed in and not bootstrapping)
  useEffect(()=>{
    if(!authUser||bootstrapping)return;
    const armWarning=()=>{_idleWarnTimerRef.current=setTimeout(()=>setIdleWarn(true),IDLE_WARN_MS);};
    const armLogout=()=>{_idleTimerRef.current=setTimeout(async()=>{
      // Save in-flight selected-client edits as a draft before signing out
      try{if(selected){localStorage.setItem("ga_session_draft",JSON.stringify({clientId:selected.id,data:selected,savedAt:Date.now()}));}}catch{}
      if(supabase){try{await supabase.auth.signOut();}catch{}}
      setIdleWarn(false);setAuthUser(null);setSelected(null);
    },IDLE_TIMEOUT_MS);};
    const reset=()=>{
      if(_idleWarnTimerRef.current)clearTimeout(_idleWarnTimerRef.current);
      if(_idleTimerRef.current)clearTimeout(_idleTimerRef.current);
      setIdleWarn(false);armWarning();armLogout();
    };
    const evts=["mousemove","keydown","touchstart","click","scroll"];
    evts.forEach(e=>window.addEventListener(e,reset,{passive:true}));
    armWarning();armLogout();
    return()=>{
      evts.forEach(e=>window.removeEventListener(e,reset));
      if(_idleWarnTimerRef.current)clearTimeout(_idleWarnTimerRef.current);
      if(_idleTimerRef.current)clearTimeout(_idleTimerRef.current);
    };
  },[authUser,bootstrapping,selected]);
  // Restore Supabase session on mount
  useEffect(()=>{
    let mounted=true;
    if(!supabase){setAuthReady(true);return;}
    supabase.auth.getSession().then(({data})=>{if(!mounted)return;setAuthUser(data?.session?.user||null);setAuthReady(true);});
    const{data:sub}=supabase.auth.onAuthStateChange((_event,session)=>{if(!mounted)return;setAuthUser(session?.user||null);});
    return()=>{mounted=false;sub?.subscription?.unsubscribe?.();};
  },[]);
  // Refs for cloud-sync gating — see persist effect below
  const _lastClientsRef=useRef(null);
  const _lastSettingsRef=useRef(null);
  const _cloudReadyRef=useRef(false);
  // On login: migrate localStorage if cloud is empty, then load clients + settings from Supabase
  useEffect(()=>{
    if(!authUser||!supabase){_cloudReadyRef.current=false;return;}
    let cancelled=false;
    _cloudReadyRef.current=false;
    (async()=>{
      setBootstrapping(true);
      try{
        await gaMigrateLocalStorage(authUser.id);
        const remote=await gaLoadClients(authUser.id);
        if(cancelled)return;
        if(Array.isArray(remote)&&remote.length>0){
          const mapped=remote.map(mig);
          _lastClientsRef.current=mapped;  // seed BEFORE setClients so save effect sees no diff
          setClients(mapped);
        }else{
          _lastClientsRef.current=clients;  // local data became the seed (migration uploaded it)
        }
        const remoteSettings=await gaLoadSettings(authUser.id);
        if(cancelled)return;
        if(remoteSettings){_lastSettingsRef.current=remoteSettings;setSettings(s=>({...s,...remoteSettings}));}
        else{_lastSettingsRef.current=settings;}
      }finally{if(!cancelled){setBootstrapping(false);_cloudReadyRef.current=true;
        // v0.5.2a — Restore session draft (if any) saved by previous auto-logout
        try{
          const raw=localStorage.getItem("ga_session_draft");
          if(raw){
            const d=JSON.parse(raw);
            if(d?.clientId&&d?.data){
              setSelected(d.data);setSelectedTab("monthly");setNav("clients");
              setJustRestoredDraft(true);
              setToast({kind:"info",msg:t.draftRestoredToast||"Restored your in-flight edits from your previous session. Save when ready.",ts:Date.now()});
            }
            localStorage.removeItem("ga_session_draft");
          }
        }catch{}
      }}
    })();
    return()=>{cancelled=true;};
  },[authUser?.id]);
  // Persist clients: localStorage always, Supabase only after cloud bootstrap completes
  useEffect(()=>{try{localStorage.setItem("ga_v3",JSON.stringify(clients));}catch{}
    if(!authUser||!supabase||!_cloudReadyRef.current)return;
    const prev=_lastClientsRef.current||[];
    const prevById=new Map(prev.map(c=>[c.id,c]));
    const nextIds=new Set(clients.map(c=>c.id));
    for(const c of clients){const p=prevById.get(c.id);if(!p||JSON.stringify(p)!==JSON.stringify(c)){gaSaveClient(authUser.id,c);}}
    for(const p of prev){if(!nextIds.has(p.id))gaDeleteClient(authUser.id,p.id);}
    _lastClientsRef.current=clients;
  },[clients,authUser]);
  // Persist settings: localStorage always, Supabase only after cloud bootstrap and only when changed
  useEffect(()=>{try{localStorage.setItem("ga_settings",JSON.stringify(settings));}catch{}
    if(!authUser||!supabase||!_cloudReadyRef.current)return;
    if(JSON.stringify(_lastSettingsRef.current)===JSON.stringify(settings))return;
    gaSaveSettings(authUser.id,settings);
    _lastSettingsRef.current=settings;
  },[settings,authUser]);
  useEffect(()=>{if(typeof window!=="undefined")window.__GA_LANG=lang;},[lang]);
  // v0.11.0 — Browser history integration. Push a history entry on each
  // in-app navigation change (nav / open client / tab) so the browser Back
  // button moves within the app instead of unloading it. See pitfall #16.
  const _historySeededRef=useRef(false);
  const _popstateRestoringRef=useRef(false);
  // v0.13.0 — Hydrate state from the current URL once, on first authenticated tick
  // (or once clients have loaded if the URL refers to a specific client). Declared
  // BEFORE the seed effect so it runs first in the same render tick — the seed
  // effect guards on _hydrationDoneRef so it won't replaceState a stale default
  // before this has a chance to apply the URL. See pitfall #17.
  const _hydrationDoneRef=useRef(false);
  useEffect(()=>{
    if(typeof window==="undefined")return;
    if(isPublicIntakeRoute)return;
    if(!authUser)return;
    if(_hydrationDoneRef.current)return;
    const parsed=parseGAPath(window.location.pathname);
    if(!parsed){_hydrationDoneRef.current=true;return;}
    // If URL targets a specific client but client list hasn't loaded yet, defer.
    if(parsed.clientId!=null&&clients.length===0)return;
    _hydrationDoneRef.current=true;
    if(parsed.nav!==nav)setNav(parsed.nav);
    if(parsed.selectedTab!==selectedTab)setSelectedTab(parsed.selectedTab);
    if(parsed.clientId!=null){
      const c=clients.find(x=>String(x.id)===parsed.clientId);
      if(c&&c.id!==selected?.id)setSelected(c);
    }
    // v0.13.1 — calculator deep-link
    if((parsed.selectedCalc||null)!==selectedCalc)setSelectedCalc(parsed.selectedCalc||null);
  },[authUser,clients,isPublicIntakeRoute,nav,selectedTab,selected?.id,selectedCalc]);
  useEffect(()=>{
    if(typeof window==="undefined")return;
    if(isPublicIntakeRoute)return;        // /intake is its own page — no in-app history
    if(!authUser)return;                  // only track history once past the login gate
    if(!_hydrationDoneRef.current)return; // wait for URL hydration to settle before pushing
    if(_popstateRestoringRef.current){_popstateRestoringRef.current=false;return;} // change came from Back/Forward — don't re-push
    const snap={ga:true,nav,selectedId:selected?.id??null,selectedTab,selectedCalc};
    const url=buildGAPath(nav,selected?.id??null,selectedTab,selectedCalc);
    if(!_historySeededRef.current){window.history.replaceState(snap,"",url);_historySeededRef.current=true;}
    else{window.history.pushState(snap,"",url);}
  },[nav,selected?.id,selectedTab,selectedCalc,authUser,isPublicIntakeRoute]);
  useEffect(()=>{
    if(typeof window==="undefined")return;
    if(isPublicIntakeRoute)return;
    const onPop=(e)=>{
      if(drawerOpen){setDrawerOpen(false);window.history.pushState({ga:true,nav,selectedId:selected?.id??null,selectedTab,selectedCalc},"",buildGAPath(nav,selected?.id??null,selectedTab,selectedCalc));return;}
      const st=e.state;
      _popstateRestoringRef.current=true;
      if(st&&st.ga){
        setNav(st.nav||"dashboard");
        setSelectedTab(st.selectedTab||"report");
        setSelectedCalc(st.selectedCalc||null); // v0.13.1
        if(st.selectedId==null){setSelected(null);}
        else{const c=clients.find(x=>x.id===st.selectedId);setSelected(c||null);}
      }else{
        // v0.13.0 — Back/Forward landed on a state-less entry (e.g. an external
        // link or manual URL edit). Parse the current URL and apply.
        const parsed=parseGAPath(window.location.pathname);
        if(parsed){
          setNav(parsed.nav);
          setSelectedTab(parsed.selectedTab);
          setSelectedCalc(parsed.selectedCalc||null); // v0.13.1
          if(parsed.clientId==null){setSelected(null);}
          else{const c=clients.find(x=>String(x.id)===parsed.clientId);setSelected(c||null);}
        }else{
          setNav("dashboard");setSelected(null);setSelectedTab("report");setSelectedCalc(null);
        }
      }
    };
    window.addEventListener("popstate",onPop);
    return()=>window.removeEventListener("popstate",onPop);
  },[clients,drawerOpen,nav,selected?.id,selectedTab,isPublicIntakeRoute]);
  // v0.9.1 — Paint document.documentElement + body with theme.bg so the area
  // outside the flex container (overscroll bounce on iOS, safe-area insets,
  // status-bar tint) doesn't show the browser-default white. Same pattern as
  // PublicIntake (line ~2311).
  useEffect(()=>{if(typeof document==="undefined")return;document.documentElement.style.background=theme.bg;document.body.style.background=theme.bg;document.body.style.margin="0";},[theme.bg]);
  // v0.6.1 — Mirror lang+isDark into settings so they persist (settings persists to LS + Supabase).
  useEffect(()=>{setSettings(s=>(s.lang===lang&&s.isDark===isDark)?s:{...s,lang,isDark});},[lang,isDark]);
  useEffect(()=>{
    const s=document.createElement("style");
    s.id="ga-styles";
    s.textContent=`
      input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
      input[type=number]{-moz-appearance:textfield;appearance:textfield}
      *{-webkit-tap-highlight-color:transparent}
      html,body{overscroll-behavior-y:none}
      /* v0.26.0 — z-index scale (UI/UX Pro Max High-severity guideline #4) */
      :root{--ga-z-tooltip:10;--ga-z-sticky:20;--ga-z-sidebar:30;--ga-z-header:40;--ga-z-dropdown:70;--ga-z-overlay:90;--ga-z-modal:100;--ga-z-toast:120;}
      /* v0.26.0 — Reduced motion (UI/UX Pro Max guideline #8) */
      @media (prefers-reduced-motion: reduce){
        *,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important;scroll-behavior:auto!important}
      }
      /* v0.26.0 — 150ms hover transition baseline (CRM pattern) */
      button,a,[role="button"]{transition:background-color 150ms ease,border-color 150ms ease,color 150ms ease,opacity 150ms ease}
      /* v0.26.0 — Table header readability bump (11pt → 12pt) */
      th{font-size:12px!important}
      th[data-mini]{font-size:11px!important}/* opt-out for genuinely dense tables */
      /* v0.26.0 — Focus ring for keyboard users (Accessibility guideline) */
      *:focus-visible{outline:2px solid #C9A84C;outline-offset:2px;border-radius:6px}
      button:focus:not(:focus-visible){outline:none}
      /* v0.27.0 — Skeleton shimmer (bootstrap loading) */
      @keyframes ga-skel-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
      .ga-skel{background:linear-gradient(90deg,var(--ga-skel-a,#0000) 0%,var(--ga-skel-b,#fff1) 50%,var(--ga-skel-a,#0000) 100%) var(--ga-skel-base,#94A3B814);background-size:200% 100%;animation:ga-skel-shimmer 1.4s ease-in-out infinite;border-radius:8px}
      /* v0.27.0 — Critical alert pill pulse (No Contact / Promo Expiring) */
      @keyframes ga-pill-pulse{0%,100%{opacity:1}50%{opacity:0.55}}
      .ga-pill-pulse{animation:ga-pill-pulse 1.5s ease-in-out infinite}
      /* v0.30.0 — Public intake Done modal animations */
      @keyframes ga-fade{from{opacity:0}to{opacity:1}}
      @keyframes ga-modal-pop{from{opacity:0;transform:translateY(8px) scale(0.96)}to{opacity:1;transform:none}}
      @supports(padding:env(safe-area-inset-top)){
        body{padding-top:env(safe-area-inset-top,0);padding-left:env(safe-area-inset-left,0);padding-right:env(safe-area-inset-right,0)}
      }
      @media(max-width:719px){
        table{font-size:11px}
        button{touch-action:manipulation}
        /* v0.9.3 — Defensive mobile grid collapse. Many surfaces hard-code
           gridTemplateColumns:"1fr 1fr 1fr" or "repeat(4,1fr)" inline,
           which clips KPI cards off the right edge on narrow viewports.
           Tag those rows with class "ga-grid-collapse" or rely on the
           generic rule: any inline display:grid scoped via [data-ga-grid]
           collapses to 2 cols on mobile. Cards inside need minWidth:0 to
           shrink — SC cards already have that via the data attribute. */
        [data-ga-grid="kpi"]{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        [data-ga-grid="kpi-3"]{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        [data-ga-grid="kpi-4"]{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        [data-ga-grid="portfolios"]{grid-template-columns:1fr!important}
        [data-ga-grid="two-col"]{grid-template-columns:1fr!important}
        /* Fallback for any inline 3-or-4 column grid not yet tagged.
           Walks up to direct children of role=main / .ga-page. Conservative
           selector so we don't fight intentional desktop layouts. */
        .ga-mobile-collapse{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        /* SC stat cards must be allowed to shrink inside collapsed grids,
           otherwise their fixed-ish content keeps them at desktop width. */
        .ga-sc,.ga-sc *{min-width:0!important}
        .ga-sc{overflow:hidden}
      }
      @media print{
        /* v0.21.0 — Claude Design PDF spec (Prompt 10).
           Brand-font'd, emoji-free, page-broken, branded-header print output. */
        #ga-sidebar,#ga-sidebar-mobile,#ga-appbar,.ga-top-bar{display:none!important}
        .ga-np{display:none!important}
        html,body{background:#FFFFFF!important;margin:0;padding:0;overflow:visible!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;font-family:'Source Serif 4',Georgia,'Times New Roman',serif!important;color:#0F172A!important;font-size:10.5pt!important;line-height:1.55!important;scrollbar-width:none!important}
        *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
        #root,div{overflow:visible!important;max-height:none!important}
        ::-webkit-scrollbar{display:none!important}
        .recharts-wrapper,.recharts-responsive-container{width:100%!important;overflow:visible!important}
        .recharts-surface{overflow:visible!important}
        /* Report titles render in Newsreader italic — apply via a .ga-report-title class on the JSX */
        .ga-report-title,h1.ga-report-title{font-family:'Newsreader',Georgia,serif!important;font-style:italic!important;font-weight:500!important;font-size:22pt!important;color:#0D1B2A!important;text-align:center!important;line-height:1.1!important;margin:4px 0 4px!important;letter-spacing:-0.005em!important}
        /* Section headers — Plus Jakarta Sans, 0.08em tracking, gold underline (hairline). */
        h2,h3,.section-hdr{font-family:'Plus Jakarta Sans',system-ui,sans-serif!important;font-weight:800!important;text-transform:uppercase!important;letter-spacing:0.08em!important;color:#B8901E!important;font-size:9.5pt!important;border-bottom:1px solid #C9A84C!important;padding-bottom:2px!important;margin:14px 0 6px!important}
        h1{font-family:'Newsreader',Georgia,serif!important;font-weight:500!important}
        /* Currency cells in JetBrains Mono with tabular numerals. */
        td.num,.ga-money,.ga-mono,td[align="right"]{font-family:'JetBrains Mono',ui-monospace,monospace!important;font-variant-numeric:tabular-nums!important;font-feature-settings:"tnum" 1!important}
        /* Brand-printed header (visible only in print). The component just needs class="ga-print-header". */
        .ga-print-header{display:flex!important;justify-content:space-between!important;align-items:flex-end!important;padding-bottom:8px!important;margin-bottom:14px!important;border-bottom:1px solid #C9A84C!important;font-family:'Plus Jakarta Sans',system-ui,sans-serif!important}
        .ga-print-header img.brand-mark{width:28px!important;height:28px!important;display:block!important}
        .ga-print-header .brand-wordmark{font-family:'Newsreader',Georgia,serif!important;font-weight:500!important;letter-spacing:0.14em!important;font-size:9pt!important;color:#C9A84C!important;text-transform:uppercase!important;line-height:1}
        .ga-print-header .brand-sub{font-family:'Source Serif 4',Georgia,serif!important;font-style:italic!important;font-size:7pt!important;color:#475569!important;margin-top:2px!important}
        .ga-print-header .client-name{font-weight:600!important;font-size:9.5pt!important;color:#0F172A!important;font-family:'Plus Jakarta Sans',system-ui,sans-serif!important}
        .ga-print-header .client-meta{font-size:7.5pt!important;color:#475569!important;line-height:1.4}
        /* Page breaks — explicit between sections marked .ga-print-page. */
        .ga-print-page{break-before:page!important;page-break-before:always!important}
        .ga-print-page:first-of-type{break-before:auto!important;page-break-before:auto!important}
        /* Block elements that should never split. */
        h1,h2,h3,h4{page-break-after:avoid!important;break-after:avoid!important}
        table{page-break-inside:avoid!important;break-inside:avoid!important}
        thead{display:table-header-group}
        tr{page-break-inside:avoid!important;break-inside:avoid!important}
        .ga-section,.ga-section-card{page-break-inside:avoid!important;break-inside:avoid-page!important}
        /* Hide leading emoji in section headers — wrap them in a span.ga-emoji.
           Existing JSX uses raw emoji prefixes; until we wrap them, this rule
           is a no-op safety net. New code should use <span class="ga-emoji">📊</span> */
        .ga-emoji{display:none!important}
        /* Page margins + footer area. */
        @page{margin:18mm 14mm 22mm 14mm;background:#FFFFFF}
        /* Disclaimer footer — renders inline at the bottom of the printable content.
           Add <div class="ga-print-footer">...</div> at the end of each report. */
        .ga-print-footer{margin-top:24px!important;padding-top:10px!important;border-top:1px solid #C9A84C!important;font-family:'Plus Jakarta Sans',system-ui,sans-serif!important;font-size:7.5pt!important;color:#6B7280!important;line-height:1.5!important;font-style:italic!important;text-align:center!important}
      }
      /* Print header is ONLY visible in print mode — hide on screen. */
      @media screen{.ga-print-header,.ga-print-footer,.ga-print-only{display:none!important}}
    `;
    document.head.appendChild(s);
    return()=>{const el=document.getElementById("ga-styles");if(el)el.remove();};
  },[]);
  // v0.26.0 — "✓ Saved" toast helper (UI/UX Pro Max guideline #6 — Submit Feedback)
  const toastSaved=useCallback((msg)=>setToast({kind:"success",msg:msg||(t.savedToast||"Saved"),ts:Date.now()}),[t]);
  const upClient=useCallback(c=>{const mc=mig(c);setClients(p=>p.map(x=>x.id===mc.id?mc:x));setSelected(mc);toastSaved(t.savedClientToast||"Client saved");},[toastSaved,t]);
  const addClient=newC=>{const mc=mig(newC);setClients(p=>[...p,mc]);setAddOpen(false);setSelectedTab("monthly");setSelected(mc);setNav("clients");toastSaved(t.savedClientAddedToast||"Client added");};
  const importMultiple=useCallback(cs=>{setClients(prev=>[...prev,...cs.map(mig)]);},[]);
  const archiveClient=useCallback(id=>{setClients(p=>p.map(c=>c.id===id?{...c,archived:!c.archived}:c));toastSaved(t.archivedToast||"Client archived");},[toastSaved,t]);
  const restoreClient=useCallback(id=>{setClients(p=>p.map(c=>c.id===id?{...c,archived:false}:c));toastSaved(t.restoredToast||"Client restored");},[toastSaved,t]);
  const deleteClient=useCallback(id=>{setClients(p=>p.filter(c=>c.id!==id));setSelected(null);toastSaved(t.deletedToast||"Client deleted");},[toastSaved,t]);
  const restoreBackup=useCallback((backup,mode)=>{const mc=backup.clients.map(mig);if(mode==="replace"){setClients(mc);if(backup.settings)setSettings(s=>({...s,...backup.settings}));}else{setClients(prev=>{const newClients=[];const updated=[...prev];mc.forEach(bc=>{const dup=findDuplicate(bc,updated);if(dup){const idx=updated.findIndex(c=>c.id===dup.id);updated[idx]=smartMerge(dup,bc);}else newClients.push(bc);});return[...updated,...newClients];});}},[])
  const splitClient=(p1,p2)=>{setClients(prev=>[...prev.filter(x=>x.id!==selected?.id),p1,p2]);setSelected(null);setNav("clients");};
  const joinClients=(c1,c2)=>{const joined=mig({...c1,id:c1.id,partnerFirst:c2.firstName,partnerLast:c2.lastName,color2:c2.color1,incomeStreams:[...c1.incomeStreams,...c2.incomeStreams.map(s=>({...s,id:gid(),person:"p2"}))],bills:[...c1.bills,...c2.bills.filter(b=>!c1.bills.some(x=>x.name===b.name)).map(b=>({...b,id:gid(),assignedTo:"p2",split:{p1:0,p2:100}}))],cards:[...c1.cards,...c2.cards.map(cc=>({...cc,id:gid(),owedBy:"p2"}))],accounts:[...c1.accounts,...c2.accounts.map(a=>({...a,id:gid(),owner:"p2"}))],loans:[...c1.loans,...c2.loans.map(l=>({...l,id:gid(),owner:"p2"}))]});setClients(prev=>[...prev.filter(x=>x.id!==c1.id&&x.id!==c2.id),joined]);setSelected(joined);setNav("clients");};
  // v0.8.0 — bulk client actions (Chat 4)
  const archiveMany=useCallback(ids=>{const s=new Set(ids);setClients(p=>p.map(c=>s.has(c.id)?{...c,archived:true}:c));},[]);
  const restoreMany=useCallback(ids=>{const s=new Set(ids);setClients(p=>p.map(c=>s.has(c.id)?{...c,archived:false}:c));},[]);
  const deleteMany=useCallback(ids=>{const s=new Set(ids);setClients(p=>p.filter(c=>!s.has(c.id)));setSelected(null);},[]);
  const splitClientPair=useCallback((origId,p1,p2)=>{setClients(prev=>[...prev.filter(x=>x.id!==origId),p1,p2]);setSelected(null);},[]);
  const NAV=[{id:"dashboard",l:"📊 "+t.dashboard},{id:"clients",l:"👥 "+t.clients},{id:"intake-submissions",l:"📥 "+(t.intakeSubmissions||"Intake Forms")},{id:"calculators",l:"🧮 "+t.calculators},{id:"promotions",l:"🏷️ "+t.promotions},{id:"resources",l:"📚 "+t.resources},{id:"about",l:"⚓ "+t.about}];
  if(isPublicIntakeRoute)return<PublicIntake/>;
  if(!authReady)return<ThemeCtx.Provider value={theme}><div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:theme.bg,color:theme.muted,fontSize:13}}>…</div></ThemeCtx.Provider>;
  if(!authUser)return<ThemeCtx.Provider value={theme}><Login onLogin={u=>setAuthUser(u)} t={t} isDark={isDark} onToggle={()=>setDark(d=>!d)}/></ThemeCtx.Provider>;
  if(bootstrapping)return<ThemeCtx.Provider value={theme}><BootstrapSkeleton theme={theme} t={t} isMobile={vp.isMobile}/></ThemeCtx.Provider>;
  // T&C gate moved AFTER bootstrap so it doesn't flash-and-disappear when stale settings load in.
  if(!settings.tosAcceptedAt)return<ThemeCtx.Provider value={theme}><ToSModal onAccept={()=>{setSettings(s=>({...s,tosAcceptedAt:new Date().toISOString().slice(0,10),tosVersion:"1.0"}));}} onCancel={async()=>{if(supabase)try{await supabase.auth.signOut();}catch{}setAuthUser(null);}} t={t} theme={theme}/></ThemeCtx.Provider>;
  const globalHide=settings.hideNumbers||false;
  return<ThemeCtx.Provider value={theme}><HideCtx.Provider value={{hide:globalHide}}>
    {/* v0.5.2a — Idle warning modal */}
    {idleWarn&&<div style={{position:"fixed",inset:0,background:"#0008",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}><div style={{background:theme.modal,border:`2px solid ${theme.warn}`,borderRadius:14,padding:24,maxWidth:380,boxShadow:"0 32px 80px #0009"}}><div style={{fontSize:28,marginBottom:8,textAlign:"center"}}>⏰</div><div style={{fontSize:14,fontWeight:700,color:theme.text,marginBottom:8,textAlign:"center"}}>{t.idleWarnTitle||"You'll be signed out soon"}</div><div style={{fontSize:12,color:theme.muted,marginBottom:16,textAlign:"center",lineHeight:1.5}}>{t.idleWarnBody||"You've been inactive for a while. Click below to stay signed in, or you'll be logged out in 1 minute. Any in-flight client edits will be saved as a draft."}</div><button onClick={()=>{setIdleWarn(false);}} style={{width:"100%",padding:"10px 16px",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",background:theme.accent,color:"#0D1B2A",border:"none"}}>{t.stayLoggedIn||"Stay Signed In"}</button></div></div>}
    {/* v0.5.2a — Toast (save failures / info) */}
    {toast&&<div role="status" aria-live="polite" style={{position:"fixed",bottom:24,right:24,maxWidth:380,zIndex:120,background:toast.kind==="error"?"#EF4444":toast.kind==="success"?"#10B981":theme.accent,color:"#fff",padding:"12px 16px",borderRadius:10,boxShadow:"0 12px 40px #0008",fontSize:12,fontWeight:600,lineHeight:1.5,display:"flex",alignItems:"flex-start",gap:10}}><span style={{fontSize:16}}>{toast.kind==="error"?"⚠️":toast.kind==="success"?"✓":"ℹ️"}</span><span style={{flex:1}}>{toast.msg}</span><button onClick={()=>setToast(null)} aria-label={t.close||"Close"} style={{background:"transparent",border:"none",color:"#fff",cursor:"pointer",fontSize:14,padding:0,opacity:0.8}}>✕</button></div>}
    {importDupResolver&&<DuplicateResolverModal incoming={importDupResolver.incoming} existing={clients} onResolve={importDupResolver.resolver} onClose={()=>setImportDupResolver(null)} t={t}/>}{addOpen&&<NewClientModal onSave={addClient} onClose={()=>setAddOpen(false)} t={t}/>}
    {profileOpen&&<ProfileModal settings={settings} onSave={s=>{setSettings(s);setProfileOpen(false);}} onClose={()=>setProfileOpen(false)} t={t}/>}
    <AvatarPickerModal open={avatarPickerOpen} current={settings.avatarId||"mh-gold"} onPick={id=>{setSettings(s=>({...s,avatarId:id}));setAvatarPickerOpen(false);}} onClose={()=>setAvatarPickerOpen(false)} t={t} theme={theme}/>
    {sidebarImportOpen&&<ImportWizard onClose={()=>setSidebarImportOpen(false)} onImport={cs=>{importMultiple(cs);setSidebarImportOpen(false);}} existingClients={clients} t={t}/>}
    {/* v0.9.1 — mobile drawer + scrim live OUTSIDE the zoom-applying flex below.
        CSS `zoom` creates a containing block for position:fixed in WebKit/iOS,
        which was trapping the drawer inside the zoomed parent and clipping it
        off-screen on the left. Hoisting them to the top-level fragment makes
        them position:fixed relative to the viewport again. */}
    {vp.isMobile&&drawerOpen&&<div onClick={()=>setDrawerOpen(false)} style={{position:"fixed",inset:0,background:"#000a",zIndex:90,touchAction:"none"}} aria-hidden="true"/>}
    {vp.isMobile&&<div id="ga-sidebar-mobile" style={{width:260,background:theme.nav,borderRight:`1px solid ${theme.navBorder}`,display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,height:"100vh",transform:drawerOpen?"translateX(0)":"translateX(-100%)",transition:"transform 0.25s ease-out",zIndex:100,boxShadow:drawerOpen?"4px 0 32px #000a":"none",visibility:drawerOpen?"visible":"hidden"}}>
      <div style={{padding:"18px 16px",borderBottom:`1px solid ${theme.navBorder}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:4}}><div style={{overflow:"hidden"}}><div style={{fontSize:16,fontWeight:500,color:GOLD,fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",letterSpacing:"0.10em",textTransform:"uppercase",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:6}}>{settings.logoLight||settings.logoDark?<LogoImg settings={settings} mode={isDark?"dark":"light"} size={24}/>:<span>⚓</span>} {settings.companyName?(settings.companyName.length>22?settings.companyName.slice(0,20)+"…":settings.companyName):"Golden Anchor"}</div><div style={{fontSize:9,color:theme.sideMuted,letterSpacing:"0.14em",marginTop:2}}>{t.advisorPortalUpper||"ADVISOR PORTAL"}</div></div><button onClick={()=>setDrawerOpen(false)} aria-label={t?.navCloseMenu||"Close menu"} style={{background:"transparent",border:"none",color:theme.sideMuted,cursor:"pointer",fontSize:20,padding:4,minWidth:36,minHeight:36}}>✕</button></div>
      <nav style={{flex:1,padding:10,overflowY:"auto"}}>{NAV.map(n=><button key={n.id} onClick={()=>{setNav(n.id);setSelected(null);setSelectedCalc(null);setDrawerOpen(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",justifyContent:"flex-start",borderRadius:9,background:nav===n.id&&!selected?GOLD+"22":"transparent",color:nav===n.id&&!selected?GOLD:theme.sideMuted,fontWeight:600,border:"none",cursor:"pointer",fontSize:14,textAlign:"left",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden"}}>{n.l}</button>)}</nav>
      <div style={{padding:10,borderTop:`1px solid ${theme.navBorder}`}}>
        {/* v0.18.0 — sidebar bottom is JUST the profile widget. Theme / EN-ES / Sign-out
            now live in the TopBar avatar dropdown so they don't duplicate. */}
        <button onClick={()=>{setNav("settings");setSelected(null);setSelectedCalc(null);setDrawerOpen(false);}} style={{width:"100%",padding:"10px",borderRadius:10,fontSize:12,cursor:"pointer",background:"transparent",color:theme.sideText,border:`1px solid ${theme.navBorder}`,display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
          <AvatarImg id={settings.avatarId||"mh-gold"} size={36}/>
          <div style={{minWidth:0,flex:1,overflow:"hidden"}}>
            <div style={{fontSize:12,fontWeight:700,color:theme.sideText,overflow:"hidden",textOverflow:"ellipsis"}}>{settings.advisorName||authUser?.email||"Mauricio"}</div>
            <div style={{fontSize:10,color:GOLD,marginTop:1}}>⚙️ {t.profileSettings||"Profile & settings"} ›</div>
          </div>
        </button>
      </div>
    </div>}
    <div style={{display:"flex",minHeight:"100vh",width:"100%",background:theme.bg,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",fontVariantNumeric:"tabular-nums",fontFeatureSettings:"'tnum' 1",color:theme.text,fontSize:"14px",zoom:(settings.appZoom||1)}}>
      {!vp.isMobile&&<div id="ga-sidebar" style={{width:sidebarCollapsed?64:234,flexShrink:0,background:theme.nav,borderRight:`1px solid ${theme.navBorder}`,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",transition:"width 0.25s cubic-bezier(0.2,0.8,0.2,1)"}}>
        <div style={{padding:sidebarCollapsed?"20px 12px 14px":"20px 16px 14px",borderBottom:`1px solid ${theme.navBorder}`,display:"flex",alignItems:"center",justifyContent:sidebarCollapsed?"center":"space-between",gap:4,minHeight:72}}>
          {sidebarCollapsed?
            <button onClick={()=>setSidebarCollapsed(false)} title={t?.navExpand||"Expand sidebar"} style={{width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",background:GOLD+"14",borderRadius:10,border:`1px solid ${GOLD}33`,cursor:"pointer",padding:0}} onMouseEnter={e=>{e.currentTarget.style.background=GOLD+"26";}} onMouseLeave={e=>{e.currentTarget.style.background=GOLD+"14";}}>
              <img src="/anchor-monogram.svg" alt="" style={{width:24,height:24,display:"block"}}/>
            </button>
          :
            <>
              <div style={{display:"flex",alignItems:"center",gap:11,overflow:"hidden"}}>
                <img src="/anchor-monogram.svg" alt="" style={{width:30,height:30,flexShrink:0}}/>
                <div style={{overflow:"hidden"}}>
                  <div style={{fontFamily:"'Newsreader',Georgia,serif",fontSize:13,fontWeight:500,color:"#EDD594",letterSpacing:"0.10em",whiteSpace:"nowrap",textTransform:"uppercase",lineHeight:1}}>{settings.companyName?(settings.companyName.length>22?settings.companyName.slice(0,20)+"…":settings.companyName):"Golden Anchor"}</div>
                  <div style={{fontSize:9,color:theme.sideMuted,marginTop:4,letterSpacing:"0.08em",whiteSpace:"nowrap",textTransform:"uppercase",fontWeight:600}}>{t.advisorPortalUpper||"Advisor Portal"}</div>
                </div>
              </div>
              <button onClick={()=>setSidebarCollapsed(true)} title={t?.navCollapse||"Collapse sidebar"} style={{background:"transparent",border:"none",color:theme.sideMuted,fontSize:16,cursor:"pointer",padding:4,lineHeight:1,borderRadius:6}}>‹</button>
            </>
          }
        </div>
        <nav style={{flex:1,padding:10,overflowY:"auto"}}>{NAV.map(n=>{const parts=n.l.split(" ");const icon=parts[0];const label=parts.slice(1).join(" ");const active=nav===n.id&&!selected;return<button key={n.id} onClick={()=>{setNav(n.id);setSelected(null);setSelectedCalc(null);setDrawerOpen(false);}} title={sidebarCollapsed?label:""} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:sidebarCollapsed?"10px 0":"8px 12px",justifyContent:sidebarCollapsed?"center":"flex-start",borderRadius:9,background:active?GOLD+"22":"transparent",color:active?GOLD:theme.sideMuted,fontWeight:600,border:"none",cursor:"pointer",fontSize:13,textAlign:"left",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",position:"relative"}}>{active&&!sidebarCollapsed&&<span style={{position:"absolute",left:0,top:"22%",bottom:"22%",width:3,background:GOLD,borderRadius:"0 3px 3px 0"}}/>}{sidebarCollapsed?icon:n.l}</button>;})}</nav>
        <div style={{padding:10,borderTop:`1px solid ${theme.navBorder}`}}>
          {/* v0.18.0 — sidebar bottom is JUST the profile widget. Theme / EN-ES / Sign-out
              moved to the TopBar avatar dropdown so they don't duplicate. */}
          <button onClick={()=>{setNav("settings");setSelected(null);setSelectedCalc(null);setDrawerOpen(false);}} title={t?.profileSettings||"Profile & Settings"} style={{width:"100%",padding:sidebarCollapsed?"6px":"10px",borderRadius:10,fontSize:12,cursor:"pointer",background:"transparent",color:theme.sideText,border:`1px solid ${theme.navBorder}`,display:"flex",alignItems:"center",gap:sidebarCollapsed?0:10,justifyContent:sidebarCollapsed?"center":"flex-start",textAlign:"left"}}>
            <AvatarImg id={settings.avatarId||"mh-gold"} size={sidebarCollapsed?28:36}/>
            {!sidebarCollapsed && <div style={{minWidth:0,flex:1,overflow:"hidden"}}>
              <div style={{fontSize:12,fontWeight:700,color:theme.sideText,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{settings.advisorName||authUser?.email||"Mauricio"}</div>
              <div style={{fontSize:10,color:GOLD,marginTop:1,whiteSpace:"nowrap"}}>⚙️ {t.profileSettings||"Profile & settings"} ›</div>
            </div>}
          </button>
        </div>
      </div>}
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column",minWidth:0,maxWidth:"100%"}}>
        <TopBar
          title={selected?((selected.firstName||"")+(selected.lastName?" "+selected.lastName:"")):(
            nav==="settings"?(t?.profileSettings||"Profile & Settings"):
            nav==="security"?(t?.securityHdr||"Security"):
            nav==="billing"?(t?.billingHdr||"Billing & Plan"):
            nav==="backup"?(t?.backupHdr||"Backup & Restore"):
            nav==="archived"?(t?.archivedClientsHdr||"Archived Clients"):
            nav==="whats-new"?(t?.whatsNewHdr||"What's New"):
            nav==="help"?(t?.helpHdr||"Help & Support"):
            (NAV.find(n=>n.id===nav)?.l||"")
          )}
          breadcrumb={selected?((t?.clients||"Clients")+" · "+selected.firstName+" "+selected.lastName):null}
          isDark={isDark} setDark={()=>setDark(d=>!d)}
          lang={lang} setLang={setLang}
          hideNumbers={settings.hideNumbers||false} setHide={v=>setSettings(s=>({...s,hideNumbers:v}))}
          signedIn={!!authUser}
          onNav={(n)=>{setNav(n);setSelected(null);setSelectedCalc(null);setDrawerOpen(false);}}
          onPickAvatar={()=>setAvatarPickerOpen(true)}
          onSignOut={async()=>{if(supabase){try{await supabase.auth.signOut();}catch{}}setAuthUser(null);}}
          advisorName={settings.advisorName||authUser?.email||"Mauricio Hernandez"}
          advisorEmail={settings.advisorEmail||authUser?.email||""}
          avatarId={settings.avatarId||"mh-gold"}
          avatarInitials={(settings.advisorName||authUser?.email||"MH").trim().split(/\s+/).slice(0,2).map(p=>p[0]).join("").toUpperCase().slice(0,2)||"MH"}
          th={theme}
          isMobile={vp.isMobile} onOpenDrawer={()=>setDrawerOpen(true)}
          t={t}
          archivedCount={clients.filter(c=>c.archived).length}
          version={(()=>{const b=typeof window!=="undefined"?(window.__GA_BUILD__||""):"";/* v0.28.0 — regex bumped to \d{2} for minor so v0280 → v0.28.0 (was buggy: parsed as v0.2.80). */const m=b.match(/v(\d)(\d{2})(\d+)-/);return m?`v${m[1]}.${parseInt(m[2],10)}.${parseInt(m[3],10)}`:"v0.28.0";})()}
        />
        <div style={{flex:1,overflowY:"auto"}}>
        {selected?<ClientDetail client={selected} onUpdate={upClient} lang={lang} t={t} onBack={()=>setSelected(null)} startTab={selectedTab} allClients={clients} onSplit={splitClient} onJoin={joinClients} onArchive={archiveClient} onDelete={deleteClient} settings={settings} onTabChange={setSelectedTab}/>:
          nav==="dashboard"?<Dashboard clients={clients} t={t} settings={settings} onSelect={c=>{setSelectedTab("report");setSelected(c);setNav("clients");}} setSettings={setSettings} onAdd={()=>setAddOpen(true)} onImportNew={importMultiple} onArchive={archiveClient} onRestore={restoreClient} onDelete={deleteClient} onRestoreBackup={restoreBackup} onToggleHide={()=>setSettings(s=>({...s,hideNumbers:!s.hideNumbers}))} hideNumbers={settings.hideNumbers||false}/>:
          nav==="clients"?<ClientList clients={clients} t={t} onSelect={c=>{setSelectedTab("report");setSelected(c);}} onAdd={()=>setAddOpen(true)} onRestore={restoreClient} onImportNew={importMultiple} onRestoreBackup={restoreBackup} onArchiveMany={archiveMany} onRestoreMany={restoreMany} onDeleteMany={deleteMany} onSplit={splitClientPair} onJoin={joinClients}/>:
          nav==="intake-submissions"?<IntakeSubmissionsPage t={t} authUser={authUser} settings={settings} onConvert={c=>{addClient(c);}}/>:
          nav==="calculators"?<CalculatorsPage t={t} activeCalc={selectedCalc} onActiveChange={setSelectedCalc}/>:
          nav==="promotions"?<PromotionsPage settings={settings} onSettingsChange={setSettings} t={t}/>:
          nav==="resources"?<ResourcesPage t={t}/>:
          nav==="settings"?<SettingsPage settings={settings} clients={clients} onEdit={()=>setProfileOpen(true)} t={t}/>:
          nav==="security"?<SecurityPage t={t}/>:
          nav==="billing"?<BillingPage settings={settings} onSettingsChange={setSettings} t={t}/>:
          nav==="backup"?<BackupPage clients={clients} settings={settings} onRestoreBackup={restoreBackup} t={t}/>:
          nav==="archived"?<ArchivedClientsPage clients={clients} onRestore={restoreClient} onDelete={deleteClient} t={t}/>:
          nav==="whats-new"?<WhatsNewPage t={t}/>:
          nav==="help"?<HelpSupportPage t={t} settings={settings} authUser={authUser}/>:
          <AboutPage t={t} settings={settings} lang={lang}/>}
      </div></div>
    </div>
  </HideCtx.Provider></ThemeCtx.Provider>;
}
