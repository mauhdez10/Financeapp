import { useState, useEffect, useCallback, useRef, useMemo, useId, createContext, useContext, Fragment } from "react";
import { Bar, XAxis, YAxis, Tooltip as ReTip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, LabelList, AreaChart, Area, CartesianGrid, ComposedChart, Line, Legend } from "recharts";
import * as XLSX from "xlsx";
import { AboutPage, LineField, PLAN_FEATURES, PlanComparison, PricingCarousel, PricingPage, PricingPlans, PromotionsPage, ResourcesPage, ServiceRequestModal } from "./pages/marketing";
import { HeroVisual, LOTTIE_HERO_URL, Login, LandingPage } from "./pages/landing";
import { EngagementLetter, LogoImg, SignaturePad, ToSModal } from "./components/legal";
import { IntakeCurrencyInput, IntakeDoneModal, IntakeFieldLabel, IntakeFormBody, IntakeFormSection, IntakeSelectedServiceCard, IntakeStepRail, IntakeSubmissionEditor, IntakeSubmissionsPage, IntakeWelcomeStage, NewInviteModal, PublicIntake, isMobileViewport } from "./pages/intake";
import { AVATAR_PRESETS, ArchivedClientsPage, AvatarImg, AvatarPickerModal, BackupPage, BillingPage, EmailSupportModal, FAQ_ENTRIES, HelpSupportPage, SecurityPage, SettingsCard, SettingsPage, WHATS_NEW_ENTRIES, WhatsNewPage } from "./pages/admin";
import { PortalShareModal, PublicPortal, LinkInviteModal, LinkedOverview } from "./pages/portal";
import { OnboardingWizard } from "./pages/onboarding";
import { gaClientAIText } from "./utils/aiExport";
import { gaAcceptLink, gaLinkedOverview } from "./services/supabase";
import { PremiumCtx, usePremiumGate, hasPremium, planOf, planLabel, PremiumUpgrade, PremiumLockNote } from "./components/premium";
import { MembersAdminPage, isGaAdmin } from "./pages/members";
import { PublicShell, PublicFaqPage, PublicContactPage, PublicAboutPage } from "./pages/public";
import { UsefulLinksPage } from "./pages/links";
if(typeof window!=="undefined"){window.__GA_BUILD__="2026-06-24-v08011-phase2-dashboard-extracted";console.log("%c⚓ Golden Anchor build:","color:#D4A017;font-weight:bold",window.__GA_BUILD__);}
// ── Phase 0 modules (D-37, 2026-06-10) — see docs/ARCHITECTURE-PLAN.md ──
import { supabase, gaLoadClients, gaSaveClient, gaDeleteClient, gaLoadSettings, gaSaveSettings, gaLoadIntakeSubmissions, gaSubmitIntake, gaUpdateIntakeStatus, gaUpdateIntakeData, gaDeleteIntakeSubmission, gaDeleteIntakeSubmissionsByStatus, gaLoadIntakeInvites, gaDeleteIntakeInvite, gaDeleteAllIntakeInvites, gaSendIntakeInvite, gaSendSupportEmail, gaResolveIntakeInvite, gaMarkIntakeInviteSubmitted, genPortalToken, gaResolvePortal, gaListPortalLinks, gaCreatePortalLink, gaSendPortalLink, gaRevokePortalLink, gaEmailCompleteReport, gaDownloadCompleteReport, gaMigrateLocalStorage, gaClearLocalCache } from "./services/supabase";
import { GOLD, makeDark, makeLight, DARK_ACCENTS, LIGHT_ACCENTS, LIGHT_BG_PRESETS, LIGHT_CARD_PRESETS, DARK_BG_PRESETS, DARK_CARD_PRESETS, stripLeadEmoji, mINP, mCARD, mTH, mTHR, mTD, mTDR, mIIN } from "./styles/theme";
import { ThemeCtx, useTh, HideCtx, useHN, ChartConfigCtx, useChartConfig } from "./contexts/theme";
import { ACCT_META, LOAN_META, ACCA, LOKA, CP, PC, SVCS, svcPayUrl, DEF_PORT_RATES, TICKER_META, PORTFOLIOS, ALT_PACKS, MAIN_PACKS, MS, MS_ES, ML_ES, mLabel, ML, CERTS, PHYS_CATS, ACCT_L_ES, LOAN_L_ES, PHYS_L_ES, _gaLang, acctL, loanL, physL, DEF_SETTINGS } from "./constants/meta";
import { useTweenedData, useSvgId, useReducedMotion } from "./hooks/anim";
import { Donut, Waterfall, PairedBars, LiveTrendCard, SmoothAreaLine, Sankey, Treemap, RadialGauge, RankedHBars, BulletChart, Sparkline, Radar5, NetWorthBridge, PayoffProgression, AmortizationArea, CompoundGrowthStack, StackedBars, HeatmapCalendar, GroupedYoY, ForecastCone, SlopeGraph, Sunburst, Dumbbell } from "./components/charts";
import { RATIOS_META, ratFmt, ratColor, ratStatus, fmtDate, setLocale, gid, mkAcct, mkLoan, mk, migrateCard, migrateAccounts, migrateLoans, migrateAcctTypes, extractAcctsToProps, mig, SEED, FREQ, toM, fmt, fmtD, fmtS, bE, vEmail, fmtPh, fmtSSN, actB, sumB, sumN, sumG, effectiveMin, sumMin, cardMoInt, totalMoInt, payM, payL, mthPmt, availCredit, syncAssetLoans, getProperties, totalA, totalL, liquidA, esc, pLine, genCSV, dlCSV, expCSV, expAllCSV, parseCSV, isAlertDismissed, getClientRem, getAdvRem } from "./utils/finance";
import { expBackup, validateBackup, findDuplicate, smartMerge, parseCRMCsv, parseWorkbook } from "./utils/import";
import { LayoutDashboard, Users, FileInput, Calculator, Tag, BookOpen, Anchor, Settings as SettingsIcon, Shield, Receipt, HardDriveDownload, Archive, Sparkles, Bell, HelpCircle, LogOut, ImageIcon, BarChart3, PiggyBank, TrendingUp, Home, Wallet, TrendingDown, Car, KeyRound, Percent, Gem, Globe, AtSign, Mail, Phone, Award, GraduationCap, HeartHandshake, Target, Languages, ShieldCheck, CalendarCheck } from "lucide-react";
import { T } from "./translations";
import { ENGAGEMENT_LETTER, ELT_DEFAULTS, fillTokens } from "./engagementLetterTemplate";

import { BSolid, BootstrapSkeleton, Btn, CCircle, CalcRow, FH, Field, GAIcon, IAdd, InfoTip, Kebab, KpiTile, MaskedNumInp, Modal, NumInp, PTag, Paginator, Pill, ProfileToggleField, Row2, SA, SBadge, SC, SHdr, SSNInput, SaveBar, Skel, Tog, YearInp, _GA_ICONS, useAnimatedDisplay, useSrt, useViewport } from "./components/primitives";
import { AffordabilityCalc, AmortTablePaginated, CalculatorsPage, CarLoanCalc, DebtReductionCalc, EquityTablePaginated, HomeEquityCalc, IncomeCalc, InterestCalc, PortfolioStandaloneCalc, RetirementCalc, STD_DED, SavingsCalc, TAX_BRACKETS, calcFedTax, getBracket } from "./components/calculators";
import { IncomeModal, CardModal, BillModal, AccountModal, LoanModal, AssetModal, SplitAssignModal, JoinModal } from "./components/clientModals";
import { IncomeSection, BillsSection, DebtSection, CustomAssetsSection, SavingsSection, NotesSection } from "./components/clientSections";
import { ClientCalculatorsTab } from "./components/clientCalcs";
import { ChartSettingsModal, DashSlotPicker } from "./components/chartEditors";
import { PlanReportBlock, PortfolioReportBlock, CompareReportBlock, CalculatorsReportBlock } from "./components/reportBlocks";
import { ImportWizard, DuplicateResolverModal, DeleteClientModal, BackupImportModal, ExportModal } from "./components/clientData";
import { MonthlyTab, FinancialStatementsTab, InvestmentsTab, BackfillTab, AssetsLiabilitiesTab, FinancialPlanTab, ClientReport } from "./components/clientReports";
import { Dashboard } from "./components/dashboard";
function ProfileModal({settings,onSave,onClose,t,section,clients}){const th=useTh();const[s,setS]=useState({...settings});const[svcSecOpen,setSvcSecOpen]=useState({memberships:true});const[svcOpen,setSvcOpen]=useState({});const[themeOpen,setThemeOpen]=useState(false);const[bgOpen,setBgOpen]=useState(false);const[brandingOpen,setBrandingOpen]=useState(false);const[optionalOpen,setOptionalOpen]=useState(false);const[servicesOpen,setServicesOpen]=useState(false);const[backupOpen,setBackupOpen]=useState(false);const u=k=>e=>setS(p=>({...p,[k]:e.target.value}));const INP=mINP(th);
const services = s.services && s.services.length ? s.services : SVCS.map(v=>({id:v.id,icon:v.icon,name:(v.en||""),price:(v.price||""),stripeUrl:(s.stripeLinks||{})[v.id]||""}));
const updateService=(idx,field,val)=>{const next=services.map((sv,i)=>i===idx?{...sv,[field]:val}:sv);setS(p=>({...p,services:next}));};
const addService=()=>{const next=[...services,{id:"svc-"+Date.now(),icon:"💼",name:"",price:"",stripeUrl:""}];setS(p=>({...p,services:next}));};
const removeService=(idx)=>{if(!confirm(t.confirmRemoveSvc||"Remove this service?"))return;const next=services.filter((_,i)=>i!==idx);setS(p=>({...p,services:next}));};
const uploadLogo=(mode)=>(e)=>{const f=e.target.files&&e.target.files[0];if(!f)return;if(f.size>500*1024){alert((t.logoTooLarge||"Logo image is too large (max 500KB).")+" "+(f.size/1024).toFixed(0)+"KB");return;}const r=new FileReader();r.onload=ev=>{const key=mode==="light"?"logoLight":"logoDark";setS(p=>({...p,[key]:ev.target.result}));};r.readAsDataURL(f);};
const clearLogo=(mode)=>{const key=mode==="light"?"logoLight":"logoDark";setS(p=>({...p,[key]:""}));};
const AccRow=({label,k,presets})=><div style={{marginBottom:14}}><div style={{fontSize:11,color:th.muted,marginBottom:6}}>{label}</div><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>{presets.map(p=><div key={p.v} onClick={()=>setS(prev=>({...prev,[k]:p.v}))} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer"}}><div style={{width:26,height:26,borderRadius:"50%",background:p.v,border:s[k]===p.v?"3px solid white":"2px solid transparent",boxShadow:s[k]===p.v?`0 0 0 2px ${p.v}`:"0 0 0 1px #0002"}}/><span style={{fontSize:9,color:th.dim}}>{t["color"+p.l]||p.l}</span></div>)}<input type="color" value={s[k]||presets[0].v} onChange={e=>setS(p=>({...p,[k]:e.target.value}))} style={{width:26,height:26,cursor:"pointer",border:"none",borderRadius:4}}/><input value={s[k]||''} onChange={e=>setS(p=>({...p,[k]:e.target.value}))} style={{...mIIN(th),width:80,fontFamily:"monospace",fontSize:11}} placeholder="#000000"/></div></div>;
// v0.56 — BgPicker: dropped the hex text input per Mauricio's feedback
// ("Appearance should have the box with the colors instead of the weird
// numbers no one understands"). Now just shows preset swatches (28px,
// up from 24px so they read as solid color tiles) plus a custom color
// picker. The hex value still updates from picker selection — just no
// raw text entry.
const BgPicker=({label,k,presets,def})=>{const v=s[k]||def;return<div style={{marginBottom:10}}><div style={{fontSize:10,color:th.muted,marginBottom:6,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase"}}>{label}</div><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>{presets.map(c=><div key={c} onClick={()=>setS(p=>({...p,[k]:c}))} title={c} style={{width:32,height:32,borderRadius:8,background:c,cursor:"pointer",border:(v||"").toLowerCase()===c.toLowerCase()?`2px solid ${th.accent}`:`1px solid ${th.cardBorder}`,boxShadow:(v||"").toLowerCase()===c.toLowerCase()?`0 0 0 3px ${th.accent}33`:"none",transition:"transform 100ms ease"}}/>)}<label title={t.customColorLbl||"Custom color"} style={{position:"relative",width:32,height:32,borderRadius:8,border:`1px dashed ${th.cardBorder}`,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",color:th.dim,fontSize:14}}>＋<input type="color" value={/^#[0-9a-fA-F]{6}$/.test(v||"")?v:def} onChange={e=>setS(p=>({...p,[k]:e.target.value}))} style={{position:"absolute",inset:0,opacity:0,cursor:"pointer"}}/></label></div></div>;};
// ToggleField extracted to top-level ProfileToggleField — see comment above ProfileModal.
// Call sites pass {k,label,s,setS,th,INP} directly so the component type stays stable.
if(section==="services"){
  /* MD-H (v0.75.2) — owner: "stripe links should be collapsible twice, one per section
     and one per service with a + - sign". Sections group the catalog; each service row
     collapses to icon·name·price and expands to its fields. */
  const SVC_GROUPS=[
    {id:"memberships",label:t.svcGroupMemberships||"Memberships",ids:["monthly-lite","monthly-lite-plus","annual-bundle"]},
    {id:"onetime",label:t.svcGroupOneTime||"One-time services",ids:["initial-checkup","quarterly-review","strategy-session"]},
    {id:"other",label:t.svcGroupOther||"Other & custom",ids:null},
  ];
  const grouped=SVC_GROUPS.map(g=>({...g,rows:services.map((svc,idx)=>({svc,idx})).filter(({svc})=>g.ids?g.ids.includes(svc.id):!SVC_GROUPS.flatMap(x=>x.ids||[]).includes(svc.id))}));
  const PM=({open})=><span style={{fontSize:14,fontWeight:700,color:th.accent,fontFamily:"'JetBrains Mono',monospace",width:16,display:"inline-block",textAlign:"center"}}>{open?"−":"+"}</span>;
  return<Modal title={t.servicesAndStripeLinks||"Services & Stripe Links"} onClose={onClose} width={520} disableBackdropClose={true}>
<div style={{fontSize:10,color:th.dim,marginBottom:12,lineHeight:1.5,fontStyle:"italic"}}>{t.ourServicesHelp||"Edit the name, price, and Stripe Payment Link for each service. These appear on the public intake form for clients to choose from."}</div>
{grouped.map(g=>{const secOpen=!!svcSecOpen[g.id];return<div key={g.id} style={{marginBottom:8,border:`1px solid ${th.cardBorder}`,borderRadius:9,overflow:"hidden"}}>
  <button type="button" onClick={()=>setSvcSecOpen(p=>({...p,[g.id]:!p[g.id]}))} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"10px 12px",background:th.bg,border:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
    <PM open={secOpen}/><span style={{flex:1,fontSize:11,fontWeight:700,color:th.text,letterSpacing:"0.04em",textTransform:"uppercase"}}>{g.label}</span><span style={{fontSize:10,color:th.dim,fontFamily:"'JetBrains Mono',monospace"}}>{g.rows.length}</span>
  </button>
  {secOpen&&<div style={{padding:"8px 10px"}}>
    {g.rows.map(({svc,idx})=>{const k=svc.id||("i"+idx);const open=!!svcOpen[k];return<div key={k} style={{marginBottom:6,border:`1px solid ${th.cardBorder}`,borderRadius:8,overflow:"hidden"}}>
      <button type="button" onClick={()=>setSvcOpen(p=>({...p,[k]:!p[k]}))} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
        <PM open={open}/><span style={{fontSize:13}}>{svc.icon||"💼"}</span><span style={{flex:1,fontSize:12,fontWeight:600,color:th.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{svc.name||(t.svcUnnamed||"Unnamed service")}</span><span style={{fontSize:11,fontWeight:700,color:th.accent,fontFamily:"'JetBrains Mono',monospace",flexShrink:0}}>{svc.price||"—"}</span>{svc.stripeUrl?<span title="Stripe link set" style={{width:7,height:7,borderRadius:99,background:th.pos,flexShrink:0}}/>:<span title="No Stripe link" style={{width:7,height:7,borderRadius:99,background:th.cardBorder,flexShrink:0}}/>}
      </button>
      {open&&<div style={{padding:"6px 10px 10px",background:th.bg}}>
        <Row2><Field label={t.svcIcon||"Icon"}><input style={INP} value={svc.icon||""} onChange={e=>updateService(idx,"icon",e.target.value)} maxLength={3}/></Field><Field label={t.svcPrice||"Price"}><input style={INP} value={svc.price||""} onChange={e=>updateService(idx,"price",e.target.value)} placeholder="$149"/></Field></Row2>
        <Field label={t.svcName||"Service name"}><input style={INP} value={svc.name||""} onChange={e=>updateService(idx,"name",e.target.value)}/></Field>
        <Field label={t.svcStripeUrl||"Stripe Payment Link"}><input style={{...INP,fontFamily:"monospace",fontSize:11}} placeholder="https://buy.stripe.com/..." value={svc.stripeUrl||""} onChange={e=>updateService(idx,"stripeUrl",e.target.value)}/></Field>
        <button type="button" onClick={()=>removeService(idx)} style={{fontSize:10,padding:"3px 8px",borderRadius:5,background:"transparent",color:th.neg,border:`1px solid ${th.neg}44`,cursor:"pointer"}}>{t.removeSvc||"Remove"}</button>
      </div>}
    </div>;})}
    {!g.rows.length&&<div style={{fontSize:11,color:th.dim,fontStyle:"italic",padding:"4px 2px"}}>{t.svcGroupEmpty||"No services here yet."}</div>}
  </div>}
</div>;})}
<button type="button" onClick={addService} style={{fontSize:11,padding:"6px 12px",borderRadius:8,background:GOLD+"22",color:GOLD,border:`1px solid ${GOLD}55`,cursor:"pointer",fontWeight:600}}>+ {t.addService||"Add service"}</button>
<SaveBar onSave={()=>onSave(s)} onCancel={onClose} t={t}/>
</Modal>;}
if(section==="backup"){return<Modal title={t.backupAndData||"Backup & Data"} onClose={onClose} width={520} disableBackdropClose={true}>
<div style={{fontSize:11,color:th.dim,marginBottom:12,lineHeight:1.6,fontStyle:"italic"}}>{t.settingsBackupHelp||"Export a full backup monthly via Dashboard → ⋯ → Backup All (JSON). Save the file to your password-manager vault or encrypted drive."}</div>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:th.bg,borderRadius:8,marginBottom:12,border:`1px solid ${th.cardBorder}`}}><span style={{fontSize:11,color:th.muted}}>{t.lastBackupLbl||"Last verified backup"}</span><span style={{fontSize:11,fontWeight:700,color:th.text,fontFamily:"'JetBrains Mono',monospace"}}>{s.lastBackupVerified?fmtDate(s.lastBackupVerified):(t.settingsBackupNever||"never")}</span></div>
<button onClick={()=>expBackup(clients||[],s)} style={{fontSize:12,padding:"10px 14px",borderRadius:9,background:th.accent,color:"#1A1208",border:"none",cursor:"pointer",fontWeight:700,display:"block",width:"100%",marginBottom:8}}>{t.saveBackupBtn||"Save backup (.json)"}</button><div style={{fontSize:10,color:th.dim,marginBottom:14,lineHeight:1.5,fontStyle:"italic"}}>{t.saveBackupHelp||"Choose where to save, your computer or a synced Drive folder. (Some browsers save straight to Downloads.)"}</div><button onClick={()=>setS(p=>({...p,lastBackupVerified:new Date().toISOString().slice(0,10)}))} style={{fontSize:11,padding:"6px 12px",borderRadius:8,background:th.accent+"22",color:th.accent,border:`1px solid ${th.accent}44`,cursor:"pointer",fontWeight:600}}>✓ {t.settingsBackupMarkVerified||"Mark Verified Today"}</button>
<SaveBar onSave={()=>onSave(s)} onCancel={onClose} t={t}/>
</Modal>;}
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

/* ── INTAKE ──────────────────────────────────────────────────────────────── */

const INTAKE_TXT={
  en:{title:"Client Intake Form",subtitle:"Golden Anchor Financial Advisory",helper:"Please fill out this form with your current financial information. Leave blank any rows that don't apply. Your advisor will enter this data into the system.",sectionPersonal:"Personal Information",sectionPartner:"Partner/Spouse Information (if applicable)",sectionIncome:"Income Sources",incomeNote:"List every source of income (jobs, side gigs, rental, investment income). Use gross (before taxes) and net (after taxes).",fieldPerson:"Person (P1/P2/Joint)",fieldLabel:"Source/Job",fieldGross:"Gross Amount",fieldNet:"Net Amount",fieldFreq:"Frequency (weekly/bi-weekly/semi-monthly/monthly/annual)",sectionBills:"Monthly Bills & Expenses",billsNote:"List all regular bills. Assign to P1, P2, or Joint. Include due day (1-31) and type (regular/temporary).",fieldBillName:"Bill Name",fieldCost:"Amount",fieldBillFreq:"Frequency",fieldDue:"Due Day",fieldSplit:"Split % (P1/P2)",sectionCards:"Credit Cards & Debt",cardsNote:"Include ALL credit cards and loans, even ones with $0 balance. List APR (interest rate) as %. If promotional rate applies, note it separately.",fieldCardName:"Card/Loan Name",fieldBalance:"Balance",fieldAPR:"APR (%)",fieldMinPay:"Min Payment",fieldLimit:"Credit Limit",fieldOwner:"Owner (P1/P2/Joint)",sectionAccounts:"Bank & Investment Accounts",accountsNote:"Liquid accounts (checking, savings, money market), investment accounts (brokerage, IRA, 401k).",fieldAcctName:"Account Name",fieldType:"Type (checking/savings/retirement/IRA/brokerage)",fieldValue:"Current Balance",sectionProperties:"Physical Properties",propertiesNote:"Real estate, vehicles, precious metals, collectibles, business ownership.",fieldPropName:"Name",fieldCat:"Category",fieldCurrentValue:"Current Value",fieldPurchase:"Purchase Cost",fieldDebtOwed:"Current Debt",fieldDesc:"Description",sectionGoals:"Financial Goals",shortTermLbl:"Short-Term Goals (0-1 yr)",midTermLbl:"Mid-Term Goals (1-5 yr)",longTermLbl:"Long-Term Goals (5+ yr)",mainGoalsLbl:"Main Goals (what you want to achieve)",generalNotesLbl:"Other Notes",signature:"Client Signature",date:"Date"},
  es:{title:"Formulario de Información del Cliente",subtitle:"Asesoría Financiera Golden Anchor",helper:"Por favor complete este formulario con su información financiera actual. Deje en blanco las filas que no apliquen. Su asesor ingresará esta información al sistema.",sectionPersonal:"Información Personal",sectionPartner:"Información de Pareja/Cónyuge (si aplica)",sectionIncome:"Fuentes de Ingreso",incomeNote:"Liste toda fuente de ingreso (trabajos, ingresos adicionales, alquileres, inversiones). Use bruto (antes de impuestos) y neto (después de impuestos).",fieldPerson:"Persona (P1/P2/Conjunto)",fieldLabel:"Fuente/Trabajo",fieldGross:"Monto Bruto",fieldNet:"Monto Neto",fieldFreq:"Frecuencia (semanal/quincenal/bisemanal/mensual/anual)",sectionBills:"Gastos Mensuales",billsNote:"Liste todos los gastos regulares. Asigne a P1, P2, o Conjunto. Incluya día de pago (1-31) y tipo (regular/temporal).",fieldBillName:"Nombre del Gasto",fieldCost:"Monto",fieldBillFreq:"Frecuencia",fieldDue:"Día de Pago",fieldSplit:"División % (P1/P2)",sectionCards:"Tarjetas de Crédito y Deudas",cardsNote:"Incluya TODAS las tarjetas y préstamos, aún los de saldo $0. Liste la tasa (APR) en %. Si aplica tasa promocional, anótela por separado.",fieldCardName:"Nombre Tarjeta/Préstamo",fieldBalance:"Saldo",fieldAPR:"Tasa (%)",fieldMinPay:"Pago Mínimo",fieldLimit:"Límite de Crédito",fieldOwner:"Dueño (P1/P2/Conjunto)",sectionAccounts:"Cuentas Bancarias e Inversiones",accountsNote:"Cuentas líquidas (cheques, ahorros, mercado monetario), cuentas de inversión (corretaje, IRA, 401k).",fieldAcctName:"Nombre de Cuenta",fieldType:"Tipo (cheques/ahorros/retiro/IRA/corretaje)",fieldValue:"Saldo Actual",sectionProperties:"Propiedades Físicas",propertiesNote:"Bienes raíces, vehículos, metales preciosos, coleccionables, negocio.",fieldPropName:"Nombre",fieldCat:"Categoría",fieldCurrentValue:"Valor Actual",fieldPurchase:"Costo de Compra",fieldDebtOwed:"Deuda Actual",fieldDesc:"Descripción",sectionGoals:"Metas Financieras",shortTermLbl:"Metas Corto Plazo (0-1 año)",midTermLbl:"Metas Mediano Plazo (1-5 años)",longTermLbl:"Metas Largo Plazo (5+ años)",mainGoalsLbl:"Metas Principales (qué desea lograr)",generalNotesLbl:"Otras Notas",signature:"Firma del Cliente",date:"Fecha"}
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
    <div style={{display:"flex",flexDirection:"column",gap:8}}>{filtered.map(c=>{const selectable=mode!==null&&activeSelectable;const dim=mode!==null&&!selectable;const on=sel.has(c.id);return<div key={c.id} className="ga-lift" onClick={()=>{if(mode===null)onSelect(c);else if(selectable)toggleSel(c.id);}} style={{...mCARD(th),padding:isMobile?"10px 12px":"12px 16px",display:"flex",alignItems:"center",gap:isMobile?10:12,cursor:(mode===null||selectable)?"pointer":"default",opacity:dim?0.4:1,border:`1px solid ${(on&&mm)?mm.color:th.cardBorder}`,flexWrap:isMobile?"wrap":"nowrap"}}>{selectable&&<Cbx on={on} color={mm.color}/>}<div style={{width:isMobile?34:36,height:isMobile?34:36,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,fontSize:13,fontFamily:"'JetBrains Mono',monospace",background:c.color1+"22",color:c.color1,border:`1px solid ${c.color1}44`,flexShrink:0}}>{c.firstName[0]}{c.lastName[0]}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:700,color:th.text,overflow:"hidden",textOverflow:"ellipsis"}}>{c.firstName} {c.lastName}{c.partnerFirst&&<span style={{color:th.dim,fontWeight:400}}> & {c.partnerFirst}</span>}</div><div style={{fontSize:11,color:th.dim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.email}{!isMobile&&` · ${(c.monthSnapshots||[]).length} snapshots`}</div></div>{!isMobile&&<span style={{color:th.muted,fontSize:11,flexShrink:0}}>{fmt(sumN(c.incomeStreams))}/mo</span>}{/* v0.25.1 — per-row kebab removed per user request. Use the section kebab + the per-client kebab inside ClientDetail header instead. */}{!isMobile&&mode===null&&<span style={{color:th.accent,fontSize:16,flexShrink:0}}>›</span>}{isMobile&&<div style={{flexBasis:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,paddingTop:6,marginTop:2,borderTop:`1px solid ${th.cardBorder}`,fontSize:11}}><span style={{color:th.dim}}>{(c.monthSnapshots||[]).length} snapshots</span><span style={{color:th.muted,fontWeight:600}}>{fmt(sumN(c.incomeStreams))}/mo</span></div>}</div>;})}{!filtered.length&&<div style={{fontSize:12,color:th.dim,fontStyle:"italic",padding:"8px 2px"}}>{t.noClientsMsg||"No clients found."}</div>}</div>
    {archived.length>0&&<div style={{marginTop:20,borderTop:`1px solid ${th.cardBorder}`,paddingTop:16}}>
      <button onClick={()=>setShowArch(s=>!s)} style={{fontSize:12,fontWeight:700,color:th.warn,background:"transparent",border:"none",cursor:"pointer",marginBottom:10}}>📦 {t.archivedClientsLbl||"Archived Clients"} ({archived.length}) {showArch?"▲":"▼"}</button>
      {showArch&&<div style={{display:"flex",flexDirection:"column",gap:6}}>{archived.map(c=>{const selectable=mode!==null&&archivedSelectable;const dim=mode!==null&&!selectable;const on=sel.has(c.id);return<div key={c.id} onClick={()=>{if(selectable)toggleSel(c.id);}} style={{...mCARD(th),padding:isMobile?"9px 12px":"10px 14px",display:"flex",alignItems:"center",gap:isMobile?10:12,cursor:selectable?"pointer":"default",opacity:dim?0.4:0.85,border:`1px solid ${(on&&mm)?mm.color:th.cardBorder}`,flexWrap:isMobile?"wrap":"nowrap"}}>{selectable&&<Cbx on={on} color={mm.color}/>}<div style={{width:isMobile?32:36,height:isMobile?32:36,borderRadius:99,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,background:th.muted+"22",color:th.muted,border:`2px solid ${th.muted}44`,flexShrink:0,filter:"grayscale(1)"}}>{c.firstName[0]}{c.lastName[0]}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:th.muted,overflow:"hidden",textOverflow:"ellipsis"}}>{c.firstName} {c.lastName}{c.partnerFirst&&<span style={{fontWeight:400}}> & {c.partnerFirst}</span>}</div><div style={{fontSize:11,color:th.dim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.email}</div></div>{mode===null&&<div style={{display:"flex",gap:6,flexBasis:isMobile?"100%":"auto",justifyContent:isMobile?"flex-end":"flex-start"}}><button onClick={e=>{e.stopPropagation();onSelect(c);}} style={{fontSize:11,padding:"4px 10px",borderRadius:7,background:th.inp,color:th.muted,border:`1px solid ${th.cardBorder}`,cursor:"pointer"}}>{t.viewLbl||"View"}</button><button onClick={e=>{e.stopPropagation();onRestore(c.id);}} style={{fontSize:11,padding:"4px 10px",borderRadius:7,background:th.pos+"22",color:th.pos,border:`1px solid ${th.pos}44`,cursor:"pointer",fontWeight:700}}>↩ {t.restoreLbl||"Restore"}</button></div>}</div>;})}</div>}
    </div>}
  </div>;
}
function ClientDetail({client,onUpdate,lang,t,onBack,startTab,allClients,onSplit,onJoin,onArchive,onDelete,settings,onTabChange,clientMode}){const th=useTh();const{isMobile}=useViewport();const{gated}=usePremiumGate();const[tab,setTab]=useState(startTab||"report");const[editOpen,setEditOpen]=useState(false);const[splitOpen,setSplitOpen]=useState(false);const[joinOpen,setJoinOpen]=useState(false);const[archiveConf,setArchiveConf]=useState(false);const[deleteConf,setDeleteConf]=useState(false);const[portalOpen,setPortalOpen]=useState(false);const[linkOpen,setLinkOpen]=useState(false);const tA=totalA(client),tL=totalL(client);const tabs=[{id:"report",l:"📊 "+t.report},{id:"monthly",l:"📅 "+t.monthly},{id:"financialStatements",l:"📋 "+t.financialStatements},{id:"investments",l:"💹 "+t.investments},{id:"plan",l:(t.strategyPlanHdrEmoji||"📋 Strategy Plan")},{id:"calculators",l:"🧮 Calculators"},{id:"backfill",l:"🔧 Backfill"},{id:"notes",l:"🗒 "+t.notes}];const fileRef=useRef();const tabRowRef=useRef();const[canScrollL,setCanScrollL]=useState(false);const[canScrollR,setCanScrollR]=useState(false);
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
return<HideCtx.Provider value={{hide:client.hideNumbers||false}}><div style={{flex:1,overflowY:"auto"}}>{portalOpen&&<PortalShareModal client={client} settings={settings} t={t} onClose={()=>setPortalOpen(false)}/>}{linkOpen&&<LinkInviteModal client={client} settings={settings} t={t} onClose={()=>setLinkOpen(false)}/>}{archiveConf&&<Modal title={client.archived?"↩ Restore Client":"📦 Archive Client"} onClose={()=>setArchiveConf(false)}><div style={{fontSize:12,color:useTh().muted,marginBottom:16,lineHeight:1.7}}>{client.archived?<>Restore <b>{client.firstName} {client.lastName}</b> to your active client list?</>:<>Archive <b>{client.firstName} {client.lastName}</b>? Data is preserved and can be restored.</>}</div><div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn onClick={()=>setArchiveConf(false)}>Cancel</Btn><BSolid onClick={()=>{onArchive(client.id);setArchiveConf(false);onBack();}}>{client.archived?"Restore":"Archive"}</BSolid></div></Modal>}{deleteConf&&<DeleteClientModal client={client} onConfirm={()=>{onDelete(client.id);setDeleteConf(false);onBack();}} onClose={()=>setDeleteConf(false)} t={t}/>}{editOpen&&<ClientForm client={client} onSave={c=>{onUpdate(c);setEditOpen(false);}} onDelete={null} onClose={()=>setEditOpen(false)} t={t}/>}{splitOpen&&client.partnerFirst&&<SplitAssignModal client={client} onConfirm={(p1,p2)=>{onSplit(p1,p2);setSplitOpen(false);}} onClose={()=>setSplitOpen(false)} t={t}/>}{joinOpen&&<JoinModal client={client} allClients={allClients} onConfirm={sel=>{onJoin(client,sel);setJoinOpen(false);}} onClose={()=>setJoinOpen(false)} t={t}/>}<input ref={fileRef} type="file" accept=".csv" onChange={impC} style={{display:"none"}}/><div className="ga-np" style={{padding:isMobile?"12px 14px":"18px 24px",borderBottom:`1px solid ${th.cardBorder}`}}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>{!clientMode&&<button onClick={onBack} style={{fontSize:12,padding:"5px 12px",borderRadius:8,background:th.inp,color:th.muted,border:`1px solid ${th.cardBorder}`,cursor:"pointer"}}>{t.back}</button>}<div style={{width:40,height:40,borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,fontSize:14,fontFamily:"'JetBrains Mono',monospace",background:GOLD+"22",color:GOLD,border:`1px solid ${GOLD}44`,flexShrink:0}}>{client.firstName[0]}{client.lastName[0]}</div><div><div style={{fontWeight:600,fontSize:15,color:th.text,letterSpacing:"-0.01em"}}>{client.firstName} {client.lastName}{client.partnerFirst&&<span style={{color:th.muted,fontWeight:400}}> & {client.partnerFirst}</span>}</div><div style={{fontSize:11,color:th.dim}}>{client.email}</div></div><div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}><Kebab items={clientMode?[{label:(t.kebabEditClient||"Edit"),onClick:()=>setEditOpen(true)},{label:(t.kebabExportCsv||"Export CSV"),onClick:()=>expCSV(client)},{label:(t.kebabExportBackup||"Export Backup"),onClick:()=>expBackup([client],{}),color:th.blue},{label:(t.kebabCopyAI||"Copy AI summary"),onClick:async()=>{try{await navigator.clipboard.writeText(gaClientAIText(client));alert(t.aiCopied||"Full profile copied — paste it into any AI assistant.");}catch(e){alert("Copy failed: "+e.message);}},color:th.accent}]:[{label:"✏️ "+(t.kebabEditClient||"Edit Client"),onClick:()=>setEditOpen(true)},{label:"🤖 "+(t.kebabCopyAI||"Copy AI summary"),onClick:async()=>{try{await navigator.clipboard.writeText(gaClientAIText(client));alert(t.aiCopied||"Full profile copied — paste it into any AI assistant.");}catch(e){alert("Copy failed: "+e.message);}},color:th.accent},client.partnerFirst?{label:"✂️ "+(t.kebabSplitClient||"Split Client"),onClick:()=>setSplitOpen(true),color:th.warn}:{label:"🔗 "+(t.kebabJoinClient||"Join Client"),onClick:()=>setJoinOpen(true),color:th.pos},{divider:true},{label:"⬆️ "+(t.kebabImportCsv||"Import CSV"),onClick:()=>fileRef.current?.click()},{label:"⬇️ "+(t.kebabExportCsv||"Export CSV"),onClick:()=>expCSV(client)},{label:"💾 "+(t.kebabExportBackup||"Export Backup"),onClick:()=>expBackup([client],{}),color:th.blue},{label:"🔗 "+(t.sharePortal||"Share portal"),onClick:()=>setPortalOpen(true),color:th.accent},{label:"👤 "+(t.linkClientAccount||"Link client account"),onClick:()=>setLinkOpen(true),color:th.accent},{divider:true},{label:client.archived?"↩ "+(t.kebabUnarchive||"Unarchive"):"📦 "+(t.kebabArchive||"Archive"),onClick:()=>setArchiveConf(true),color:client.archived?th.pos:th.warn},{label:"🗑️ "+(t.kebabDelete||"Delete"),onClick:()=>setDeleteConf(true),color:th.neg}]} t={t}/></div></div><div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr 1fr",gap:10,marginBottom:14}}>{(()=>{const spk=k=>trendData.map(d=>+d[k]||0);const dl=(arr,goodUp)=>{const n=arr.length;if(n<2)return null;const ch=arr[n-1]-arr[n-2];if(ch===0)return null;const rose=ch>0;const good=goodUp?rose:!rose;const pv=Math.abs(arr[n-2]||0);const pct=pv?Math.round(Math.abs(ch)/pv*100):0;return{up:good,down:!good,value:(pct||1)+"%"};};const cf=Math.round(sumN(client.incomeStreams)-sumB(client.bills)-sumMin(client.cards));return<><KpiTile label={t.totalIncome||"Net Income"} value={fmt(sumN(client.incomeStreams))} color={th.pos} spark={spk("income")} delta={dl(spk("income"),true)}/><KpiTile label={t.totalDebt||"Total Debt"} value={fmt(tL)} color={th.neg} spark={spk("debt")} delta={dl(spk("debt"),false)}/><KpiTile label={t.liquidAssets||"Liquid Savings"} value={fmt(liquidA(client))} color={GOLD} spark={spk("savings")} delta={dl(spk("savings"),true)}/><KpiTile label={t.cashFlow||"Cash Flow"} value={fmt(cf)} color={cf>=0?th.pos:th.neg} spark={spk("cashFlow")} delta={dl(spk("cashFlow"),true)}/></>;})()}</div><div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>{/* v0.53.0 — PR 6 (HANDOFF-v0.46). The "● live" trend pair now uses
   LiveTrendCard which wraps SmoothAreaLine (line) or PairedBars (bar)
   behind a per-card toggle persisted to localStorage. Colors moved to
   the handoff "screen" palette (#DC2626 / #059669). Cash Flow card
   keeps cashflow=green, income=gold. */}
{[
  {k1:"debt",k2:"savings",l:"📈 "+t.debtTrend,c1:"#DC2626",c2:"#059669",tid:"smoothAreaLine.debtVsSavings"},
  {k1:"cashFlow",k2:"income",l:"💰 "+(t.cashFlowTrend||"Cash Flow Trend"),c1:"#059669",c2:GOLD,tid:"smoothAreaLine.cashFlowTrend"}
].map((ch,ci)=><div key={ci} className="ga-lift" style={{...mCARD(th),padding:14}}>
  <LiveTrendCard client={client} trendData={trendData} debtKey={ch.k1} savingsKey={ch.k2} debtColor={ch.c1} savingsColor={ch.c2} title={ch.l} templateId={ch.tid} t={t} leftControl={ci===0?<div style={{display:"flex",gap:3,flexWrap:"wrap",alignItems:"center"}}>{[["3","3m"],["6","6m"],["12","12m"],["all",t.allRange||"All"]].map(([v,l])=><button key={v} onClick={()=>setTrendRange(v)} style={{fontSize:9,padding:"2px 6px",borderRadius:5,background:trendRange===v?GOLD+"22":"transparent",color:trendRange===v?GOLD:th.dim,border:`1px solid ${trendRange===v?GOLD:th.cardBorder}`,cursor:"pointer",fontWeight:trendRange===v?700:400}}>{l}</button>)}<div style={{width:1,height:12,background:th.cardBorder,margin:"0 2px"}}/>{[["all",(t.filterAll||"All")],["revolving",(t.filterRev||"Rev")],["current",(t.filterCur||"Cur")]].map(([v,l])=><button key={v} onClick={()=>setTrendMode(v)} style={{fontSize:9,padding:"2px 6px",borderRadius:5,background:trendMode===v?GOLD+"22":"transparent",color:trendMode===v?GOLD:th.dim,border:`1px solid ${trendMode===v?GOLD:th.cardBorder}`,cursor:"pointer",fontWeight:trendMode===v?700:400}}>{l}</button>)}</div>:null}/>
</div>)}</div></div><div style={{padding:isMobile?"0 14px":"0 24px"}}><div className="ga-np" style={{display:"flex",alignItems:"stretch",gap:0,marginBottom:16,borderBottom:`1px solid ${th.cardBorder}`,position:"relative"}}>
  <button onClick={()=>tabRowRef.current?.scrollBy({left:-260,behavior:"smooth"})} title="Scroll left" disabled={!canScrollL} style={{flexShrink:0,width:28,height:36,display:"flex",alignItems:"center",justifyContent:"center",background:canScrollL?th.card:"transparent",border:canScrollL?`1px solid ${th.cardBorder}`:"1px solid transparent",borderBottom:"none",color:canScrollL?th.text:th.dim,cursor:canScrollL?"pointer":"default",opacity:canScrollL?1:0.3,fontSize:14,lineHeight:1,padding:0,borderRadius:"6px 6px 0 0"}}>‹</button>
  <div ref={tabRowRef} style={{flex:1,display:"flex",gap:6,overflowX:"auto",overflowY:"hidden",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",msOverflowStyle:"none",scrollSnapType:"x proximity"}} onWheel={e=>{if(e.deltaY!==0&&Math.abs(e.deltaY)>Math.abs(e.deltaX)){e.currentTarget.scrollLeft+=e.deltaY;}}}>
    <style>{`[ref][style*="scroll-snap-type"]::-webkit-scrollbar{display:none}`}</style>
    {tabs.map(tb=><button key={tb.id} onClick={()=>{setTab(tb.id);onTabChange?.(tb.id);}} style={{flexShrink:0,scrollSnapAlign:"start",fontSize:12,padding:"8px 14px",background:"transparent",border:"none",cursor:"pointer",color:tab===tb.id?th.accent:th.muted,fontWeight:tab===tb.id?700:500,borderBottom:tab===tb.id?`2px solid ${th.accent}`:"2px solid transparent",marginBottom:-1,whiteSpace:"nowrap"}}>{stripLeadEmoji(tb.l)}</button>)}
  </div>
  <button onClick={()=>tabRowRef.current?.scrollBy({left:260,behavior:"smooth"})} title="Scroll right" disabled={!canScrollR} style={{flexShrink:0,width:28,height:36,display:"flex",alignItems:"center",justifyContent:"center",background:canScrollR?th.card:"transparent",border:canScrollR?`1px solid ${th.cardBorder}`:"1px solid transparent",borderBottom:"none",color:canScrollR?th.text:th.dim,cursor:canScrollR?"pointer":"default",opacity:canScrollR?1:0.3,fontSize:14,lineHeight:1,padding:0,borderRadius:"6px 6px 0 0"}}>›</button>
</div>{tab==="report"&&<ClientReport client={client} onUpdate={onUpdate} lang={lang} t={t} settings={settings}/>}{tab==="monthly"&&<MonthlyTab client={client} onUpdate={onUpdate} lang={lang} t={t} settings={settings}/>}{tab==="financialStatements"&&<FinancialStatementsTab client={client} lang={lang} t={t}/>}{tab==="al"&&<AssetsLiabilitiesTab client={client} lang={lang} t={t}/>}{tab==="investments"&&<InvestmentsTab client={client} onUpdate={onUpdate} t={t}/>}{tab==="plan"&&<FinancialPlanTab client={client} onUpdate={onUpdate} t={t}/>}{tab==="backfill"&&<BackfillTab client={client} onUpdate={onUpdate} t={t}/>}{tab==="calculators"&&(gated?<PremiumUpgrade client={client} onUpdate={onUpdate} lang={lang} feature="calculators"/>:<ClientCalculatorsTab client={client} onUpdate={onUpdate} t={t}/>)}{tab==="notes"&&<NotesSection client={client} onUpdate={onUpdate} t={t} settings={settings}/>}<div style={{height:40}}/></div></div></HideCtx.Provider>;}

/* ── LOGIN (Supabase Auth) ──────────────────────────────────────────────── */
// v0.56 — HeroVisual: animated brand element on the landing page.
//
// Strategy: ship an animated SVG fallback that looks Lottie-quality with zero
// external assets, AND wire lottie-react infrastructure to swap in a real
// Lottie animation when LOTTIE_HERO_URL is set (paste a LottieFiles JSON URL
// or local /public/*.json path). Mauricio: visit lottiefiles.com, search
// "anchor" / "finance growth" / "chart drawing", pick one, copy its `.json`
// URL, drop into LOTTIE_HERO_URL below. Reduced motion suppresses ALL motion.
const _GA_NAVS=["dashboard","clients","intake-submissions","calculators","promotions","pricing","resources","useful-links","about","settings","security","billing","backup","archived","whats-new","help","members"];
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
  // v0.72.2 — exact match only: "/intake-submissions" was swallowed by this prefix
  // check, so deep-links/refreshes on the Intake Forms admin page bounced to the
  // dashboard (pre-existing since v0.13; surfaced by the Phase 2b verification sweep).
  if(p==="/intake"||p.indexOf("/intake/")===0)return null;
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
function AvatarBubble({initials,size,ring,onClick,title}){
  return <button onClick={onClick} title={title} style={{background:"transparent",border:ring?`2px solid ${GOLD}`:"2px solid transparent",padding:0,cursor:onClick?"pointer":"default",lineHeight:0,borderRadius:999,width:size+4,height:size+4,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{width:size,height:size,borderRadius:999,background:GOLD,color:"#0D1B2A",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:Math.round(size*0.38),letterSpacing:"0.03em"}}>{initials||"MH"}</div>
  </button>;
}

/* ── TopBar — global header. Matches ui_kits/advisor_app/TopBar.jsx.
   Title + breadcrumb on the left; EN/ES + hide + theme + avatar dropdown on
   the right. Avatar opens the big account menu (Profile, Settings, Security,
   Billing, Backup, Archived clients, What's new, Help, Sign out).          */
function TopBar({title,breadcrumb,isDark,setDark,lang,setLang,hideNumbers,setHide,signedIn,onNav,onPickAvatar,onOpenChartSettings,onSignOut,advisorName,advisorEmail,avatarId,avatarInitials,th,isMobile,onOpenDrawer,t,version,archivedCount,role}){
  const[menu,setMenu]=useState(false);
  const menuRef=useRef();
  useEffect(()=>{
    const h=e=>{if(menuRef.current&&!menuRef.current.contains(e.target))setMenu(false);};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);
  // v0.44.0 — Avatar menu items use Lucide icon keys (rendered via <GAIcon/>)
  const items=role==="client"?[
    {icon:"settings",label:t?.menuProfileSettings||"Profile settings",sub:t?.menuSettingsSub||"Theme, language, info",onClick:()=>onNav("settings")},
    {icon:"security",label:t?.menuSecurity||"Security",sub:t?.menuSecuritySub||"Change password",onClick:()=>onNav("security")},
    {icon:"billing",label:t?.menuBilling||"Billing & plan",sub:t?.menuBillingSubClient||"Your plan",onClick:()=>onNav("billing")},
    {icon:"help",label:t?.menuHelp||"Help & support",onClick:()=>onNav("help")},
    {divider:true},
    {icon:"signOut",label:t?.signOut||"Sign out",danger:true,onClick:onSignOut}
  ]:[
    {icon:"profile",label:t?.menuProfile||"Profile",sub:t?.menuProfileSub||"Change profile image",onClick:onPickAvatar},
    {icon:"charts",label:t?.menuChartSettings||"Chart Settings",sub:t?.menuChartSettingsSub||"Pick Dashboard charts",onClick:onOpenChartSettings},
    {icon:"settings",label:t?.menuSettings||"Settings",sub:t?.menuSettingsSub||"Theme, language, info",onClick:()=>onNav("settings")},
    {icon:"security",label:t?.menuSecurity||"Security",sub:t?.menuSecuritySub||"Change password",onClick:()=>onNav("security")},
    {icon:"billing",label:t?.menuBilling||"Billing & plan",sub:t?.menuBillingSub||"Services & Stripe links",onClick:()=>onNav("billing")},
    {divider:true},
    {icon:"backup",label:t?.menuBackup||"Backup data",sub:t?.menuBackupSub||"Download / restore JSON",onClick:()=>onNav("backup")},
    {icon:"archived",label:t?.menuArchived||"Archived clients"+(archivedCount?` (${archivedCount})`:""),onClick:()=>onNav("archived")},
    {icon:"whatsNew",label:t?.menuWhatsNew||"What's new",sub:version||"v0.44.0",onClick:()=>onNav("whats-new")},
    {icon:"help",label:t?.menuHelp||"Help & support",onClick:()=>onNav("help")},
    {divider:true},
    {icon:"signOut",label:t?.signOut||"Sign out",danger:true,onClick:onSignOut}
  ];
  return <div className="ga-np" style={{padding:isMobile?"10px 14px":"12px 24px",background:th.bg,borderBottom:`1px solid ${th.navBorder}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
    <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
      {isMobile&&<button onClick={onOpenDrawer} title={t?.menu||"Menu"} aria-label={t?.menu||"Menu"} style={{background:th.accent+"22",border:`1px solid ${th.accent}44`,color:th.accent,borderRadius:8,padding:"8px 10px",cursor:"pointer",fontSize:16,lineHeight:1}}>☰</button>}
      <div style={{minWidth:0}}>
        {breadcrumb&&<div style={{fontSize:11,color:th.dim,marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{breadcrumb}</div>}
        <div style={{fontSize:isMobile?16:20,fontWeight:800,letterSpacing:"-0.01em",lineHeight:1.1,display:"inline-block",backgroundImage:isDark?"linear-gradient(100deg,#F4DC9B 0%,#D8B14E 46%,#C9A84C 100%)":"linear-gradient(100deg,#B8901E 0%,#8A6B1E 100%)",WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent",WebkitTextFillColor:"transparent"}}>{title}</div>
      </div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div role="group" aria-label={t?.languageSelector||"Language"} style={{display:"flex",border:"1px solid "+th.cardBorder,borderRadius:8,overflow:"hidden"}}>{["en","es"].map(l=><button key={l} onClick={()=>setLang(l)} aria-pressed={lang===l} style={{padding:"5px 11px",fontSize:11,fontWeight:700,background:lang===l?th.accent+"22":"transparent",color:lang===l?th.accent:th.muted,border:"none",cursor:"pointer",letterSpacing:"0.05em",textTransform:"uppercase"}}>{l}</button>)}</div>
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
              <span style={{width:18,display:"flex",alignItems:"center",justifyContent:"center",color:it.danger?th.neg:th.muted}}><GAIcon name={it.icon} size={15}/></span>
              <span style={{flex:1,minWidth:0}}>
                <span style={{display:"block",lineHeight:1.2}}>{it.label}</span>
                {it.sub&&<span style={{display:"block",fontSize:10,color:th.dim,marginTop:2,fontWeight:400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{it.sub}</span>}
              </span>
            </button>
          )}
          <div style={{padding:"10px 10px 6px",borderTop:`1px solid ${th.cardBorder}`,marginTop:4,fontSize:9,color:th.dim,display:"flex",justifyContent:"space-between",letterSpacing:"0.04em"}}>
            <span>Golden Anchor · {version||"v0.36.0"}</span>
            <span>⚓ {t?.educationalCoaching||"Educational coaching"}</span>
          </div>
        </div>}
      </div>
    </div>
  </div>;
}

/* ── PORTAL SHARE MODAL (advisor side) ──────────────────────────────────── */
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
  const _baseTh=isDark?makeDark(settings.darkAccent||GOLD):makeLight(settings.lightAccent||"#C9A84C");
// v0.61 — glass cards are the redesign default. mCARD reads th.glassBg, which we
// always pin to the factory glass value (translucent in dark, white in light) so the
// modern texture shows regardless of any legacy stored solid card color. The old
// solid card-color override still flows into th.card for the few direct th.card users.
const _cardOv=isDark?settings.darkCard:settings.lightCard;
// v0.62 — bg is pinned to the factory B near-black/off-white too (like glassBg). A legacy
// stored darkBg (#111827 navy) was overriding the redesign and making the page read blue.
const theme={..._baseTh,bg:_baseTh.bg,card:_cardOv||_baseTh.card,glassBg:_baseTh.glassBg};const t=T[lang]||T.en; // EN/ES toggle wired in v0.2.0
  // v0.69.7 — seed nav/tab/calc from the URL synchronously so a refresh paints the
  // correct page on the FIRST render (no dashboard flash before hydration runs).
  const _gaInitRoute=(()=>{try{if(typeof window==="undefined")return null;return parseGAPath(window.location.pathname);}catch{return null;}})();
  const[nav,setNav]=useState((_gaInitRoute&&_gaInitRoute.nav)||"dashboard");
  // MD-E (v0.73.1) — pre-auth routes are real URLs: / (landing→login for now), /login, /pricing.
  const _preAuthOf=(p)=>p==="/pricing"?"pricing":p==="/login"?"login":p==="/link"?"login":p==="/about-us"?"about":p==="/contact"?"contact":p==="/faq"?"faq":"landing";
  const _preAuthUrl=(v)=>v==="pricing"?"/pricing":v==="login"?"/login":v==="about"?"/about-us":v==="contact"?"/contact":v==="faq"?"/faq":"/";
  const[preAuth,setPreAuthRaw]=useState(()=>{if(typeof window==="undefined")return"landing";return _preAuthOf(window.location.pathname);});
  const[linkedView,setLinkedView]=useState(null); // MD-C: sanitized advisor record for a LINKED client account
  const[selected,setSelected]=useState(null);const[selectedTab,setSelectedTab]=useState((_gaInitRoute&&_gaInitRoute.selectedTab)||"report");const[selectedCalc,setSelectedCalc]=useState((_gaInitRoute&&_gaInitRoute.selectedCalc)||null);// v0.13.1 — which calculator is open inside the /calculators page
  const[addOpen,setAddOpen]=useState(false);const[profileOpen,setProfileOpen]=useState(false);const[profileSection,setProfileSection]=useState(null);const[importDupResolver,setImportDupResolver]=useState(null);const[sidebarCollapsed,setSidebarCollapsed]=useState(false);const[drawerOpen,setDrawerOpen]=useState(false);const[avatarPickerOpen,setAvatarPickerOpen]=useState(false);const[chartSettingsOpen,setChartSettingsOpen]=useState(false);const[clientsMenuOpen,setClientsMenuOpen]=useState(false);const[clientsSort,setClientsSort]=useState("name");const[sidebarImportOpen,setSidebarImportOpen]=useState(false);const vp=useViewport();const isPublicIntakeRoute=typeof window!=="undefined"&&/\/intake\/?(\?|$)/.test((window.location.pathname||"")+(window.location.search||""));const isPublicPortalRoute=typeof window!=="undefined"&&/\/portal\/?(\?|$)/.test((window.location.pathname||"")+(window.location.search||""));
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
      try{if(selected){localStorage.setItem("ga_session_draft",JSON.stringify({clientId:selected.id,data:selected,savedAt:Date.now(),uid:authUser?.id}));}}catch{}
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
      // SECURITY (v0.68.1): never let one account's cached data show or upload under another
      // on a shared browser. If the cache belongs to a different user, purge it before anything.
      const _foreignCache=(()=>{try{const u=localStorage.getItem("ga_cache_uid");return u!==authUser.id;}catch{return false;}})();
      if(_foreignCache){gaClearLocalCache();setClients([]);setSettings(s=>({...DEF_SETTINGS,lang:s.lang,isDark:s.isDark}));}
      try{localStorage.setItem("ga_cache_uid",authUser.id);}catch(e){}
      try{
        if(!_foreignCache)await gaMigrateLocalStorage(authUser.id);
        const remote=await gaLoadClients(authUser.id);
        if(cancelled)return;
        if(Array.isArray(remote)&&remote.length>0){
          const mapped=remote.map(mig);
          _lastClientsRef.current=mapped;  // seed BEFORE setClients so save effect sees no diff
          setClients(mapped);
        }else{
          if(_foreignCache){_lastClientsRef.current=[];setClients([]);}
          else if((authUser?.user_metadata?.role)==="client"){const _self=mig({id:gid(),firstName:(authUser?.user_metadata?.firstName)||"",lastName:"",email:authUser?.email||"",clientType:"financeOnly",color1:GOLD});_lastClientsRef.current=[];setClients([_self]);}
          else{_lastClientsRef.current=clients;}  // local data became the seed (migration uploaded it)
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
            if(d?.clientId&&d?.data&&d.uid===authUser?.id&&(authUser?.user_metadata?.role)!=="client"){
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
  useEffect(()=>{if((authUser?.user_metadata?.role)!=="client"||bootstrapping||!_cloudReadyRef.current||clients.length>0)return;const _self=mig({id:gid(),firstName:(authUser?.user_metadata?.firstName)||"",lastName:"",email:authUser?.email||"",clientType:"financeOnly",color1:GOLD});setClients([_self]);},[bootstrapping,clients.length,authUser]);
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
    if(isPublicIntakeRoute||isPublicPortalRoute)return;
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
    if(isPublicIntakeRoute||isPublicPortalRoute)return;        // /intake is its own page — no in-app history
    if(!authUser)return;                  // only track history once past the login gate
    if(!_hydrationDoneRef.current)return; // wait for URL hydration to settle before pushing
    if(_popstateRestoringRef.current){_popstateRestoringRef.current=false;return;} // change came from Back/Forward — don't re-push
    const snap={ga:true,nav,selectedId:selected?.id??null,selectedTab,selectedCalc};
    const url=buildGAPath(nav,selected?.id??null,selectedTab,selectedCalc);
    if(!_historySeededRef.current){window.history.replaceState(snap,"",url);_historySeededRef.current=true;}
    else{window.history.pushState(snap,"",url);}
  },[nav,selected?.id,selectedTab,selectedCalc,authUser,isPublicIntakeRoute]);
  // MD-E (v0.73.1) — pre-auth URL plumbing: navigate, Back/Forward, and post-signout cleanup.
  const goPre=(v)=>{setPreAuthRaw(v);if(typeof window!=="undefined"){window.history.pushState({gaPre:v},"",_preAuthUrl(v));window.scrollTo(0,0);}};
  useEffect(()=>{
    if(typeof window==="undefined"||authUser)return;
    const onPop=()=>{setPreAuthRaw(_preAuthOf(window.location.pathname));};
    window.addEventListener("popstate",onPop);return()=>window.removeEventListener("popstate",onPop);
  },[authUser]);
  useEffect(()=>{ // unauthed visitor on an in-app URL (deep link or just signed out) → clean to /
    if(typeof window==="undefined")return;
    if(!authReady||authUser||isPublicIntakeRoute||isPublicPortalRoute)return;
    const p=window.location.pathname;
    if(!["/","/login","/pricing","/about-us","/contact","/faq","/link"].includes(p)){window.history.replaceState({gaPre:"landing"},"","/");setPreAuthRaw("landing");}
  },[authReady,authUser,isPublicIntakeRoute,isPublicPortalRoute]);
  useEffect(()=>{
    if(typeof window==="undefined")return;
    if(isPublicIntakeRoute||isPublicPortalRoute)return;
    const onPop=(e)=>{
      if(!authUser)return; // pre-auth Back/Forward is handled by its own listener above
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
  },[clients,drawerOpen,nav,selected?.id,selectedTab,isPublicIntakeRoute,authUser]);
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
      /* v0.62 — Direction B+C motion (Emil-grounded: custom ease-out, ≤200ms, transform/opacity only).
         .ga-lift = springy hover lift (Direction C). .ga-press = button press feedback.
         .ga-rise = staggered entrance. --ga-lift/--ga-acc are set per-theme on the app shell.
         Reduced-motion is neutralised by the @media block below. */
      :root{--ga-ease:cubic-bezier(.23,1,.32,1);--ga-spring:cubic-bezier(.2,1.1,.3,1);--ga-lift:0 14px 34px rgba(0,0,0,.5);--ga-acc:#C9A84C;--ga-acc-rgb:201,168,76;}
      @media (hover:hover) and (pointer:fine){
        .ga-lift{transition:transform .2s var(--ga-ease),box-shadow .25s var(--ga-ease),border-color .2s var(--ga-ease);}
        /* v0.62.2 — Halo hover: soft accent corona bloom instead of a hard border (less dense). */
        .ga-lift:hover{transform:translateY(-2px);border-color:rgba(var(--ga-acc-rgb),.40)!important;box-shadow:0 0 0 1px rgba(var(--ga-acc-rgb),.16)!important;}
      }
      .ga-press{transition:transform .12s var(--ga-ease)!important;}
      .ga-press:active{transform:scale(.97);}
      .ga-rise{opacity:0;transform:translateY(8px);animation:gaRise .3s var(--ga-ease) forwards;}
      @keyframes gaRise{to{opacity:1;transform:translateY(0);}}
      /* v0.64 — spotlight glow (translated from 21st.dev GlowCard): a gold radial that
         follows the cursor across the card. --mx/--my set by a pointermove listener. */
      .ga-spot{position:relative;}
      .ga-spot::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .3s var(--ga-ease);background:radial-gradient(240px circle at var(--mx,50%) var(--my,50%), rgba(var(--ga-acc-rgb),0.14), transparent 60%);z-index:0;}
      @media (hover:hover) and (pointer:fine){.ga-spot:hover::after{opacity:1;}}
      .ga-spot>*{position:relative;z-index:1;}
      /* design pass 2026-06-10: ONE hover effect per surface — spotlight never stacks on lift */
      .ga-lift.ga-spot::after{display:none!important;}
      /* v0.79 — the hero cube (Resend-reference): slow 3D tumble, reduced-motion = static */
      @keyframes gaCubeSpin{from{transform:rotateX(-24deg) rotateY(0deg);}to{transform:rotateX(-24deg) rotateY(360deg);}}
      .ga-cube-wrap{perspective:1100px;}
      .ga-cube{transform-style:preserve-3d;animation:gaCubeSpin 36s linear infinite;}
      @media (prefers-reduced-motion: reduce){.ga-cube{animation:none;transform:rotateX(-24deg) rotateY(-32deg);}}
      /* v0.78 — liquid glass (owner's spec: luminosity blend + masked gradient border) */
      .ga-liquid{background:rgba(255,255,255,0.01);background-blend-mode:luminosity;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);border:none;box-shadow:inset 0 1px 1px rgba(255,255,255,0.1);position:relative;overflow:hidden;}
      .ga-liquid::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1.4px;background:linear-gradient(180deg,rgba(255,255,255,0.45) 0%,rgba(255,255,255,0.15) 20%,rgba(255,255,255,0) 40%,rgba(255,255,255,0) 60%,rgba(255,255,255,0.15) 80%,rgba(255,255,255,0.45) 100%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;}
      .ga-hero-grid{position:absolute;inset:0;pointer-events:none;display:none;}
      @media(min-width:900px){.ga-hero-grid{display:block;}}
      .ga-hero-grid span{position:absolute;top:0;bottom:0;width:1px;background:rgba(255,255,255,0.10);}
      /* v0.26.0 — Reduced motion (UI/UX Pro Max guideline #8) */
      @media (prefers-reduced-motion: reduce){
        *,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important;scroll-behavior:auto!important}
        .ga-spot::after{display:none!important}
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
        /* v0.57 — Prevent iOS Safari auto-zoom on input focus by forcing ≥16px
           font-size on text-entry controls. Visual change is negligible on mobile
           (text was already 13px → 16px reads as slightly larger), and it ends
           the focus-zoom-no-zoom-out trap that traps users on form fields. */
        input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]),
        select,textarea{font-size:16px!important}
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
        [data-ga-grid="bento"]{grid-template-columns:1fr!important}
        [data-ga-grid="about-hero"]{grid-template-columns:1fr!important}
        /* Fallback for any inline 3-or-4 column grid not yet tagged.
           Walks up to direct children of role=main / .ga-page. Conservative
           selector so we don't fight intentional desktop layouts. */
        .ga-mobile-collapse{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        /* SC stat cards must be allowed to shrink inside collapsed grids,
           otherwise their fixed-ish content keeps them at desktop width. */
        .ga-sc,.ga-sc *{min-width:0!important}
        .ga-sc{overflow:hidden}
      }
      /* v0.72.3 — touch pass (moderate): comfortable tap targets on touch devices only.
         pointer:coarse matches phones/tablets, never mouse laptops, so desktop density
         is untouched. 40px floor (HIG asks 44; 40 keeps dense rows from ballooning),
         44px on form controls where mis-taps hurt most. */
      @media(pointer:coarse){
        button,[role="button"]{min-height:40px;min-width:40px;touch-action:manipulation}
        select,input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]){min-height:44px}
        td,th{padding-top:9px!important;padding-bottom:9px!important}
        .ga-spot::after{display:none!important}
      }
      @media print{
        /* v0.45.0 — Compact Print: matches preview/18-pdf-reports.html. Multi-section
           per page, tight typography, hairline borders, brand-gold section-header
           rule that extends right. Drops per-section page-break-before — content
           flows naturally so a Complete Report is ~7 pages instead of ~14. */
        #ga-sidebar,#ga-sidebar-mobile,#ga-appbar,.ga-top-bar{display:none!important}
        .ga-np{display:none!important}
        html,body{background:#FAFAF7!important;margin:0;padding:0;overflow:visible!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;font-family:'Source Serif 4',Georgia,'Times New Roman',serif!important;color:#0F172A!important;font-size:9.5pt!important;line-height:1.45!important;scrollbar-width:none!important}
        *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
        #root,div{overflow:visible!important;max-height:none!important}
        ::-webkit-scrollbar{display:none!important}
        .recharts-wrapper,.recharts-responsive-container{width:100%!important;overflow:visible!important}
        .recharts-surface{overflow:visible!important}
        /* Italic report title (cover page) — smaller, centered, walnut */
        .ga-report-title,h1.ga-report-title{font-family:'Newsreader',Georgia,serif!important;font-style:italic!important;font-weight:500!important;font-size:20pt!important;color:#0D1B2A!important;text-align:center!important;line-height:1.1!important;margin:4px 0 2px!important;letter-spacing:-0.005em!important}
        /* Section headers — claude design .sect-head style: small uppercase brand-gold with right-extending hairline */
        h2,h3,.section-hdr{font-family:'Plus Jakarta Sans',system-ui,sans-serif!important;font-size:8pt!important;color:#B8901E!important;letter-spacing:0.14em!important;font-weight:700!important;text-transform:uppercase!important;border:none!important;padding:0!important;margin:12px 0 6px!important;display:flex!important;align-items:center!important;gap:6px!important}
        h2::after,h3::after,.section-hdr::after{content:""!important;flex:1!important;height:1px!important;background:#E2E8F0!important}
        h1{font-family:'Newsreader',Georgia,serif!important;font-weight:500!important;color:#0D1B2A!important;font-style:italic!important}
        /* Body text + numbers */
        td,p,span,div,li{color:#0F172A}
        td.num,.ga-money,.ga-mono,td[align="right"]{font-family:'JetBrains Mono',ui-monospace,monospace!important;font-variant-numeric:tabular-nums!important;font-feature-settings:"tnum" 1!important}
        /* Compact section cards — minimal chrome, no top accent rule. Multiple cards per page. */
        .ga-section,.ga-section-card{background:transparent!important;border:none!important;border-radius:0!important;padding:0 0 10px!important;margin:0 0 12px!important;box-shadow:none!important;page-break-inside:avoid!important;break-inside:avoid-page!important}
        /* Tight grid spacing */
        [data-ga-grid="kpi-4"],[data-ga-grid="kpi-3"]{margin-bottom:12px!important;gap:6px!important}
        /* Tables — hairline, claude design */
        table{border-collapse:collapse!important;width:100%!important;font-size:8.5pt!important}
        th{font-family:'Plus Jakarta Sans',system-ui,sans-serif!important;font-weight:700!important;color:#475569!important;font-size:7pt!important;text-transform:uppercase!important;letter-spacing:0.04em!important;border-bottom:1px solid #CBD5E1!important;padding:4px 4px 6px 0!important}
        td{border-bottom:1px solid #F1F5F9!important;padding:4px 4px 4px 0!important;color:#0F172A!important}
        tfoot td,tr.total td{border-top:1px solid #C9A84C!important;border-bottom:none!important;font-weight:700!important;padding-top:6px!important;font-size:9pt!important}
        /* Brand-printed header — slimmer, brand-gold underline */
        .ga-print-header{display:flex!important;justify-content:space-between!important;align-items:flex-end!important;padding-bottom:8px!important;margin-bottom:12px!important;border-bottom:1px solid #C9A84C!important;font-family:'Plus Jakarta Sans',system-ui,sans-serif!important}
        .ga-print-header img.brand-mark{width:26px!important;height:26px!important;display:block!important}
        .ga-print-header .brand-wordmark{font-family:'Newsreader',Georgia,serif!important;font-weight:500!important;letter-spacing:0.14em!important;font-size:9pt!important;color:#C9A84C!important;text-transform:uppercase!important;line-height:1;font-style:italic!important}
        .ga-print-header .brand-sub{font-family:'Source Serif 4',Georgia,serif!important;font-style:italic!important;font-size:7pt!important;color:#475569!important;margin-top:1px!important}
        .ga-print-header .client-name{font-weight:600!important;font-size:9pt!important;color:#0F172A!important;font-family:'Plus Jakarta Sans',system-ui,sans-serif!important}
        .ga-print-header .client-meta{font-size:7pt!important;color:#475569!important;line-height:1.4}
        /* v0.45 — per-section breaks disabled. Sections flow naturally; only the
           Financial Statements + Strategy Plan + Compare/Calcs sections still force
           a break (they're large enough to deserve their own page each). */
        .ga-print-page{break-before:auto!important;page-break-before:auto!important}
        .ga-print-page-force,.ga-print-page.ga-print-page-force{break-before:page!important;page-break-before:always!important}
        h1,h2,h3,h4{page-break-after:avoid!important;break-after:avoid!important}
        table{page-break-inside:auto!important;break-inside:auto!important}
        thead{display:table-header-group}
        tr{page-break-inside:avoid!important;break-inside:avoid!important}
        /* Hide leading emoji in section headers (existing .ga-emoji rule + Lucide nav SVGs which carry data-lucide attr) */
        .ga-emoji,svg.lucide,[data-lucide]{display:none!important}
        /* Tight page margins */
        @page{margin:14mm 14mm 16mm 14mm;background:#FAFAF7}
        /* Disclaimer footer — slim claude-design footer instead of a card */
        .ga-print-footer{margin-top:14px!important;padding:8px 0!important;border-top:1px solid #C9A84C!important;border-radius:0!important;background:transparent!important;font-family:'Plus Jakarta Sans',system-ui,sans-serif!important;font-size:7pt!important;color:#6B7280!important;line-height:1.45!important;font-style:italic!important;text-align:left!important;display:flex!important;justify-content:space-between!important;letter-spacing:0.04em!important}
        /* Watermark removed in v0.45 — claude design doesn't have it; cleaner pages */
        .ga-print-watermark{display:none!important}
        /* KPI strip cards — compact, claude design style */
        .ga-sc{background:#FFFFFF!important;border:1px solid #E2E8F0!important;padding:6px 8px!important;border-radius:3px!important;box-shadow:none!important}
        /* Mini chart inset — claude design .pdf-chart background */
        .pdf-chart{background:#F8F6EF!important;border:1px solid #E8E2D0!important;border-radius:3px!important;padding:8px 10px 6px!important;margin-bottom:10px!important}
      }
      /* Print header is ONLY visible in print mode — hide on screen. */
      @media screen{.ga-print-header,.ga-print-footer,.ga-print-only{display:none!important}}
    `;
    document.head.appendChild(s);
    // v0.64 — spotlight: update --mx/--my on the hovered .ga-spot card (cursor-follow glow)
    const onSpot=e=>{const el=e.target.closest&&e.target.closest(".ga-spot");if(!el)return;const r=el.getBoundingClientRect();el.style.setProperty("--mx",(e.clientX-r.left)+"px");el.style.setProperty("--my",(e.clientY-r.top)+"px");};
    window.addEventListener("pointermove",onSpot,{passive:true});
    return()=>{const el=document.getElementById("ga-styles");if(el)el.remove();window.removeEventListener("pointermove",onSpot);};
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
  // v0.44.0 — Sidebar items use Lucide icons (`icon` key) instead of emoji prefixes
  const role=(authUser?.user_metadata?.role==="client")?"client":"advisor";
  // v0.71.1 — role-access guard: a client deep-linking to an advisor surface
  // (/clients, /promotions, /intake-submissions, /backup, /archived) bounces to
  // their overview. Their data is their own either way (RLS); this closes the
  // surface, not a data leak. Hook order: runs unconditionally, before the
  // early returns below (pitfall #13).
  useEffect(()=>{
    const allowed=["dashboard","calculators","resources","useful-links","pricing","about","settings","security","billing","help","whats-new"];
    if(role==="client"&&!allowed.includes(nav)){setNav("dashboard");setSelected(null);setSelectedCalc(null);}
  },[role,nav]);
  // MD-C (v0.76) — accept a pending link invite (/link?token=…) after client login.
  useEffect(()=>{
    if(typeof window==="undefined"||!authUser||role!=="client")return;
    if(window.location.pathname!=="/link")return;
    const tok=new URLSearchParams(window.location.search).get("token");
    window.history.replaceState({},"","/dashboard");
    if(!tok)return;
    (async()=>{
      const r=await gaAcceptLink(tok);
      if(r.ok){const o=await gaLinkedOverview();if(o.ok&&o.linked)setLinkedView({client:o.client,advisor:o.advisor});setToast({kind:"success",msg:lang==="es"?"¡Cuenta conectada con tu asesor!":"Account linked with your advisor!",ts:Date.now()});}
      else setToast({kind:"error",msg:r.error||"Link failed",ts:Date.now()});
    })();
  },[authUser,role]);
  // MD-C — load the linked overview for client accounts (read-only mirror).
  useEffect(()=>{
    if(!authUser||role!=="client"||bootstrapping)return;
    let dead=false;
    (async()=>{const o=await gaLinkedOverview();if(!dead&&o.ok&&o.linked)setLinkedView({client:o.client,advisor:o.advisor});})();
    return()=>{dead=true;};
  },[authUser,role,bootstrapping]);
  const displayName=role==="client"?((((clients[0]?.firstName||"")+" "+(clients[0]?.lastName||"")).trim())||authUser?.email||"You"):(settings.advisorName||authUser?.email||"Mauricio Hernandez");
  const NAV=role==="client"?[{id:"dashboard",icon:"dashboard",l:(t.myOverview||"Overview")},{id:"calculators",icon:"calculators",l:t.calculators},{id:"resources",icon:"resources",l:t.resources},{id:"useful-links",icon:"resources",l:(t.usefulLinks||"Useful Links")},{id:"pricing",icon:"billing",l:(t.pricing||(lang==="es"?"Precios":"Pricing"))},{id:"about",icon:"about",l:t.about}]:[{id:"dashboard",icon:"dashboard",l:t.dashboard},{id:"clients",icon:"clients",l:t.clients},{id:"intake-submissions",icon:"intake",l:(t.intakeSubmissions||"Intake Forms")},...(isGaAdmin(authUser?.email)?[{id:"members",icon:"clients",l:(lang==="es"?"Miembros":"Members")}]:[]),{id:"calculators",icon:"calculators",l:t.calculators},{id:"promotions",icon:"promotions",l:t.promotions},{id:"pricing",icon:"billing",l:(t.pricing||(lang==="es"?"Precios":"Pricing"))},{id:"resources",icon:"resources",l:t.resources},{id:"useful-links",icon:"resources",l:(t.usefulLinks||"Useful Links")},{id:"about",icon:"about",l:t.about}];
  if(isPublicIntakeRoute)return<PublicIntake/>;if(isPublicPortalRoute)return<PublicPortal/>;
  if(!authReady)return<ThemeCtx.Provider value={theme}><div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:theme.bg,color:theme.muted,fontSize:13}}>…</div></ThemeCtx.Provider>;
  if(!authUser){
    const _shellProps={lang,isDark,onToggle:()=>setDark(d=>!d),onLangToggle:()=>setLang(l=>l==="en"?"es":"en"),onNav:goPre,onSignIn:()=>goPre("login")};
    return<ThemeCtx.Provider value={theme}>{
      preAuth==="pricing"?<PricingPage variant="public" t={t} lang={lang} settings={settings} onBack={()=>goPre("landing")} onSignIn={()=>goPre("login")} onRequest={null} isDark={isDark} onToggleTheme={()=>setDark(d=>!d)} onToggleLang={()=>setLang(l=>l==="en"?"es":"en")}/>
      :preAuth==="login"?<Login onLogin={u=>setAuthUser(u)} t={t} isDark={isDark} onToggle={()=>setDark(d=>!d)} lang={lang} onLangToggle={()=>setLang(l=>l==="en"?"es":"en")} onShowPricing={()=>goPre("pricing")} onBackToLanding={()=>goPre("landing")}/>
      :preAuth==="about"?<PublicShell {..._shellProps} active="about"><PublicAboutPage t={t} lang={lang} settings={settings} isDark={isDark}/></PublicShell>
      :preAuth==="contact"?<PublicShell {..._shellProps} active="contact"><PublicContactPage lang={lang} settings={settings}/></PublicShell>
      :preAuth==="faq"?<PublicShell {..._shellProps} active="faq"><PublicFaqPage lang={lang}/></PublicShell>
      :<LandingPage lang={lang} isDark={isDark} onToggle={()=>setDark(d=>!d)} onLangToggle={()=>setLang(l=>l==="en"?"es":"en")} onSignIn={()=>goPre("login")} onPricing={()=>goPre("pricing")} onNav={goPre}/>
    }</ThemeCtx.Provider>;
  }
  if(bootstrapping)return<ThemeCtx.Provider value={theme}><BootstrapSkeleton theme={theme} t={t} isMobile={vp.isMobile}/></ThemeCtx.Provider>;
  // T&C gate moved AFTER bootstrap so it doesn't flash-and-disappear when stale settings load in.
  if(!settings.tosAcceptedAt)return<ThemeCtx.Provider value={theme}><ToSModal onAccept={()=>{setSettings(s=>({...s,tosAcceptedAt:new Date().toISOString().slice(0,10),tosVersion:"1.0"}));}} onCancel={async()=>{if(supabase)try{await supabase.auth.signOut();}catch{}gaClearLocalCache();setClients([]);setAuthUser(null);}} t={t} theme={theme}/></ThemeCtx.Provider>;
  // MD-D (v0.73) — client onboarding wizard, once per account, after ToS.
  if(role==="client"&&clients[0]&&!clients[0].onboardedAt&&!linkedView)return<ThemeCtx.Provider value={theme}><OnboardingWizard client={clients[0]} lang={lang} theme={theme} onComplete={async(patch,meta)=>{upClient(patch);if(meta&&(meta.health||meta.car)){try{await gaSendSupportEmail({subject:"New client insurance interest (onboarding)",message:`Client: ${(patch.firstName||"")+" "+(patch.lastName||"")}\nAccount email: ${authUser?.email||"?"}\nRequested: ${[meta.health?"FREE health-insurance consultation":null,meta.car?"Car insurance":null].filter(Boolean).join(" + ")}\nSource: onboarding wizard`});}catch(e){console.error("[GA] onboarding lead email failed",e);}}}}/></ThemeCtx.Provider>;
  const globalHide=settings.hideNumbers||false;setLocale({currency:settings.currency||"USD",dateFormat:settings.dateFormat||"long"});
  return<ThemeCtx.Provider value={theme}><HideCtx.Provider value={{hide:globalHide}}><ChartConfigCtx.Provider value={settings.chartCustomizations||{}}><PremiumCtx.Provider value={{gated:role==="client"&&!!clients[0]&&!hasPremium(clients[0])}}>
    {/* v0.5.2a — Idle warning modal */}
    {idleWarn&&<div style={{position:"fixed",inset:0,background:"#0008",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}><div style={{background:theme.modal,border:`2px solid ${theme.warn}`,borderRadius:14,padding:24,maxWidth:380,boxShadow:"0 32px 80px #0009"}}><div style={{fontSize:28,marginBottom:8,textAlign:"center"}}>⏰</div><div style={{fontSize:14,fontWeight:700,color:theme.text,marginBottom:8,textAlign:"center"}}>{t.idleWarnTitle||"You'll be signed out soon"}</div><div style={{fontSize:12,color:theme.muted,marginBottom:16,textAlign:"center",lineHeight:1.5}}>{t.idleWarnBody||"You've been inactive for a while. Click below to stay signed in, or you'll be logged out in 1 minute. Any in-flight client edits will be saved as a draft."}</div><button onClick={()=>{setIdleWarn(false);}} style={{width:"100%",padding:"10px 16px",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",background:theme.accent,color:"#0D1B2A",border:"none"}}>{t.stayLoggedIn||"Stay Signed In"}</button></div></div>}
    {/* v0.5.2a — Toast (save failures / info) */}
    {toast&&<div role="status" aria-live="polite" style={{position:"fixed",bottom:24,right:24,maxWidth:380,zIndex:120,background:toast.kind==="error"?"#EF4444":toast.kind==="success"?"#10B981":theme.accent,color:"#fff",padding:"12px 16px",borderRadius:10,boxShadow:"0 12px 40px #0008",fontSize:12,fontWeight:600,lineHeight:1.5,display:"flex",alignItems:"flex-start",gap:10}}><span style={{fontSize:16}}>{toast.kind==="error"?"⚠️":toast.kind==="success"?"✓":"ℹ️"}</span><span style={{flex:1}}>{toast.msg}</span><button onClick={()=>setToast(null)} aria-label={t.close||"Close"} style={{background:"transparent",border:"none",color:"#fff",cursor:"pointer",fontSize:14,padding:0,opacity:0.8}}>✕</button></div>}
    {importDupResolver&&<DuplicateResolverModal incoming={importDupResolver.incoming} existing={clients} onResolve={importDupResolver.resolver} onClose={()=>setImportDupResolver(null)} t={t}/>}{addOpen&&<NewClientModal onSave={addClient} onClose={()=>setAddOpen(false)} t={t}/>}
    {profileOpen&&<ProfileModal section={profileSection} clients={clients} settings={settings} onSave={s=>{setSettings(s);setProfileOpen(false);setProfileSection(null);}} onClose={()=>{setProfileOpen(false);setProfileSection(null);}} t={t}/>}
    <AvatarPickerModal open={avatarPickerOpen} current={settings.avatarId||"mh-gold"} onPick={id=>{setSettings(s=>({...s,avatarId:id}));setAvatarPickerOpen(false);}} onClose={()=>setAvatarPickerOpen(false)} t={t} theme={theme}/>
    {chartSettingsOpen&&<ChartSettingsModal settings={settings} onSave={setSettings} onClose={()=>setChartSettingsOpen(false)} t={t}/>}
    {sidebarImportOpen&&<ImportWizard onClose={()=>setSidebarImportOpen(false)} onImport={cs=>{importMultiple(cs);setSidebarImportOpen(false);}} existingClients={clients} t={t}/>}
    {/* v0.9.1 — mobile drawer + scrim live OUTSIDE the zoom-applying flex below.
        CSS `zoom` creates a containing block for position:fixed in WebKit/iOS,
        which was trapping the drawer inside the zoomed parent and clipping it
        off-screen on the left. Hoisting them to the top-level fragment makes
        them position:fixed relative to the viewport again. */}
    {vp.isMobile&&drawerOpen&&<div onClick={()=>setDrawerOpen(false)} style={{position:"fixed",inset:0,background:"#000a",zIndex:90,touchAction:"none"}} aria-hidden="true"/>}
    {vp.isMobile&&<div id="ga-sidebar-mobile" style={{width:260,background:theme.nav,borderRight:`1px solid ${theme.navBorder}`,display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,height:"100vh",transform:drawerOpen?"translateX(0)":"translateX(-100%)",transition:"transform 0.25s ease-out",zIndex:100,boxShadow:drawerOpen?"4px 0 32px #000a":"none",visibility:drawerOpen?"visible":"hidden"}}>
      <div style={{padding:"18px 16px",borderBottom:`1px solid ${theme.navBorder}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:4}}><div style={{overflow:"hidden"}}><div style={{fontSize:16,fontWeight:500,color:theme.navAcc,fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",letterSpacing:"0.10em",textTransform:"uppercase",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:6}}>{settings.logoLight||settings.logoDark?<LogoImg settings={settings} mode={isDark?"dark":"light"} size={24}/>:<span>⚓</span>} {settings.companyName?(settings.companyName.length>22?settings.companyName.slice(0,20)+"…":settings.companyName):"Golden Anchor"}</div><div style={{fontSize:9,color:theme.sideMuted,letterSpacing:"0.14em",marginTop:2}}>{role==="client"?(t.clientPortalUpper||"CLIENT PORTAL"):(t.advisorPortalUpper||"ADVISOR PORTAL")}</div></div><button onClick={()=>setDrawerOpen(false)} aria-label={t?.navCloseMenu||"Close menu"} style={{background:"transparent",border:"none",color:theme.sideMuted,cursor:"pointer",fontSize:20,padding:4,minWidth:36,minHeight:36}}>✕</button></div>
      <nav style={{flex:1,padding:10,overflowY:"auto"}}>{NAV.map(n=>{const active=nav===n.id&&!selected;return<button key={n.id} onClick={()=>{setNav(n.id);setSelected(null);setSelectedCalc(null);setDrawerOpen(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:11,padding:"10px 12px",justifyContent:"flex-start",borderRadius:8,background:active?"rgba(127,127,127,0.09)":"transparent",color:active?theme.navAcc:theme.sideMuted,fontWeight:active?600:500,border:"none",cursor:"pointer",fontSize:14,textAlign:"left",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden"}}><GAIcon name={n.icon} size={18} color={active?theme.navAcc:undefined}/><span>{n.l}</span></button>;})}</nav>
      <div style={{padding:10,borderTop:`1px solid ${theme.navBorder}`}}>
        {/* v0.18.0 — sidebar bottom is JUST the profile widget. Theme / EN-ES / Sign-out
            now live in the TopBar avatar dropdown so they don't duplicate. */}
        <button onClick={()=>{setNav("settings");setSelected(null);setSelectedCalc(null);setDrawerOpen(false);}} style={{width:"100%",padding:"10px",borderRadius:10,fontSize:12,cursor:"pointer",background:"transparent",color:theme.sideText,border:`1px solid ${theme.navBorder}`,display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
          <AvatarImg id={settings.avatarId||"mh-gold"} size={36}/>
          <div style={{minWidth:0,flex:1,overflow:"hidden"}}>
            <div style={{fontSize:12,fontWeight:700,color:theme.sideText,overflow:"hidden",textOverflow:"ellipsis"}}>{displayName}</div>
            <div style={{fontSize:10,color:theme.navAcc,marginTop:1}}>{t.profileSettings||"Profile & settings"} ›</div>
          </div>
        </button>
      </div>
    </div>}
    <div style={{display:"flex",minHeight:"100vh",width:"100%",background:`radial-gradient(1250px 880px at 99% -20%, ${theme.glow1||"transparent"}, transparent 52%), linear-gradient(218deg, ${theme.bgHi||theme.bg} 0%, ${theme.bg} 46%, ${theme.bgLo||theme.bg} 100%)`,backgroundAttachment:"fixed",fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",fontVariantNumeric:"tabular-nums",fontFeatureSettings:"'tnum' 1",color:theme.text,fontSize:"14px",zoom:(settings.appZoom||1),"--ga-lift":isDark?"0 14px 34px rgba(0,0,0,.5)":"0 1px 2px rgba(20,20,16,.05), 0 14px 34px rgba(20,20,16,.08)","--ga-acc":theme.accent,"--ga-acc-rgb":isDark?"226,195,117":"184,144,30"}}>
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
                  <div style={{fontFamily:"'Newsreader',Georgia,serif",fontSize:13,fontWeight:500,color:theme.navAcc,letterSpacing:"0.10em",whiteSpace:"nowrap",textTransform:"uppercase",lineHeight:1}}>{settings.companyName?(settings.companyName.length>22?settings.companyName.slice(0,20)+"…":settings.companyName):"Golden Anchor"}</div>
                  <div style={{fontSize:9,color:theme.sideMuted,marginTop:4,letterSpacing:"0.08em",whiteSpace:"nowrap",textTransform:"uppercase",fontWeight:600}}>{role==="client"?(t.clientPortalUpper||(lang==="es"?"Portal de Cliente":"Client Portal")):(t.advisorPortalUpper||"Advisor Portal")}</div>
                </div>
              </div>
              <button onClick={()=>setSidebarCollapsed(true)} title={t?.navCollapse||"Collapse sidebar"} style={{background:"transparent",border:"none",color:theme.sideMuted,fontSize:16,cursor:"pointer",padding:4,lineHeight:1,borderRadius:6}}>‹</button>
            </>
          }
        </div>
        <nav style={{flex:1,padding:10,overflowY:"auto"}}>{NAV.map(n=>{const active=nav===n.id&&!selected;return<button key={n.id} onClick={()=>{setNav(n.id);setSelected(null);setSelectedCalc(null);setDrawerOpen(false);}} title={sidebarCollapsed?n.l:""} style={{width:"100%",display:"flex",alignItems:"center",gap:11,padding:sidebarCollapsed?"10px 0":"9px 12px",justifyContent:sidebarCollapsed?"center":"flex-start",borderRadius:8,background:active?"rgba(127,127,127,0.09)":"transparent",color:active?theme.navAcc:theme.sideMuted,fontWeight:active?600:500,border:"none",cursor:"pointer",fontSize:13,textAlign:"left",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",position:"relative"}}>{active&&!sidebarCollapsed&&<span style={{position:"absolute",left:0,top:"22%",bottom:"22%",width:3,background:theme.navAcc,borderRadius:"0 3px 3px 0"}}/>}<GAIcon name={n.icon} size={17} color={active?theme.navAcc:undefined}/>{!sidebarCollapsed&&<span>{n.l}</span>}</button>;})}</nav>
        <div style={{padding:10,borderTop:`1px solid ${theme.navBorder}`}}>
          {/* v0.18.0 — sidebar bottom is JUST the profile widget. Theme / EN-ES / Sign-out
              moved to the TopBar avatar dropdown so they don't duplicate. */}
          <button onClick={()=>{setNav("settings");setSelected(null);setSelectedCalc(null);setDrawerOpen(false);}} title={t?.profileSettings||"Profile & Settings"} style={{width:"100%",padding:sidebarCollapsed?"6px":"10px",borderRadius:10,fontSize:12,cursor:"pointer",background:"transparent",color:theme.sideText,border:`1px solid ${theme.navBorder}`,display:"flex",alignItems:"center",gap:sidebarCollapsed?0:10,justifyContent:sidebarCollapsed?"center":"flex-start",textAlign:"left"}}>
            <AvatarImg id={settings.avatarId||"mh-gold"} size={sidebarCollapsed?28:36}/>
            {!sidebarCollapsed && <div style={{minWidth:0,flex:1,overflow:"hidden"}}>
              <div style={{fontSize:12,fontWeight:700,color:theme.sideText,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayName}</div>
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
          lang={lang} setLang={l=>{setLang(l);setSettings(s=>({...s,lang:l}));}}
          hideNumbers={settings.hideNumbers||false} setHide={v=>setSettings(s=>({...s,hideNumbers:v}))}
          signedIn={!!authUser}
          onNav={(n)=>{setNav(n);setSelected(null);setSelectedCalc(null);setDrawerOpen(false);}}
          onPickAvatar={()=>setAvatarPickerOpen(true)}
          onOpenChartSettings={()=>setChartSettingsOpen(true)}
          onSignOut={async()=>{if(supabase){try{await supabase.auth.signOut();}catch{}}gaClearLocalCache();setSelected(null);setClients([]);setAuthUser(null);}}
          advisorName={displayName}
          advisorEmail={role==="client"?(authUser?.email||""):(settings.advisorEmail||authUser?.email||"")}
          avatarId={settings.avatarId||"mh-gold"}
          avatarInitials={(displayName||"MH").trim().split(/\s+/).slice(0,2).map(p=>p[0]).join("").toUpperCase().slice(0,2)||"MH"}
          th={theme}
          isMobile={vp.isMobile} onOpenDrawer={()=>setDrawerOpen(true)}
          t={t}
          archivedCount={clients.filter(c=>c.archived).length}
          role={role}
          version={(()=>{const b=typeof window!=="undefined"?(window.__GA_BUILD__||""):"";/* v0.28.0 — regex bumped to \d{2} for minor so v0280 → v0.28.0 (was buggy: parsed as v0.2.80). */const m=b.match(/v(\d)(\d{2})(\d+)-/);return m?`v${m[1]}.${parseInt(m[2],10)}.${parseInt(m[3],10)}`:"v0.36.0";})()}
        />
        <div style={{flex:1,overflowY:"auto"}}>
        {selected?<ClientDetail client={selected} onUpdate={upClient} lang={lang} t={t} onBack={()=>setSelected(null)} startTab={selectedTab} allClients={clients} onSplit={splitClient} onJoin={joinClients} onArchive={archiveClient} onDelete={deleteClient} settings={settings} onTabChange={setSelectedTab}/>:
          nav==="dashboard"?(role==="client"?(linkedView?<LinkedOverview data={linkedView} lang={lang}/>:clients[0]?<ClientDetail client={clients[0]} clientMode={true} onUpdate={upClient} lang={lang} t={t} onBack={()=>{}} startTab={selectedTab} allClients={clients} settings={settings} onTabChange={setSelectedTab}/>:<div className="ga-np" style={{padding:24,color:theme.muted,fontSize:13}}>{t.settingUpProfile||"Setting up your profile…"}</div>):<Dashboard clients={clients} t={t} settings={settings} onSelect={c=>{setSelectedTab("report");setSelected(c);setNav("clients");}} setSettings={setSettings} onAdd={()=>setAddOpen(true)} onImportNew={importMultiple} onArchive={archiveClient} onRestore={restoreClient} onDelete={deleteClient} onRestoreBackup={restoreBackup} onToggleHide={()=>setSettings(s=>({...s,hideNumbers:!s.hideNumbers}))} hideNumbers={settings.hideNumbers||false}/>):
          nav==="clients"?<ClientList clients={clients} t={t} onSelect={c=>{setSelectedTab("report");setSelected(c);}} onAdd={()=>setAddOpen(true)} onRestore={restoreClient} onImportNew={importMultiple} onRestoreBackup={restoreBackup} onArchiveMany={archiveMany} onRestoreMany={restoreMany} onDeleteMany={deleteMany} onSplit={splitClientPair} onJoin={joinClients}/>:
          nav==="intake-submissions"?<IntakeSubmissionsPage t={t} authUser={authUser} settings={settings} onConvert={c=>{addClient(c);}}/>:
          nav==="calculators"?<CalculatorsPage t={t} activeCalc={selectedCalc} onActiveChange={setSelectedCalc}/>:
          nav==="pricing"?<PricingPage variant="app" t={t} lang={lang} settings={settings} onRequest={null}/>:nav==="promotions"?<PromotionsPage settings={settings} onSettingsChange={setSettings} t={t}/>:
          nav==="resources"?<ResourcesPage t={t}/>:
          nav==="members"?(isGaAdmin(authUser?.email)&&role!=="client"?<MembersAdminPage t={t} lang={lang}/>:<div className="ga-np" style={{padding:40,textAlign:"center",color:theme.dim,fontSize:13}}>{lang==="es"?"Solo administradores.":"Admins only."}</div>):
          nav==="useful-links"?<UsefulLinksPage lang={lang} client={role==="client"?clients[0]:null} onUpdateClient={upClient}/>:
          nav==="settings"?<SettingsPage role={role} onUpdateClient={upClient} settings={settings} clients={clients} onEdit={(sec)=>{setProfileSection(sec||null);setProfileOpen(true);}} onSave={patch=>{setSettings(s=>({...s,...patch}));if(patch.lang==="en"||patch.lang==="es")setLang(patch.lang);}} t={t}/>:
          nav==="security"?<SecurityPage t={t}/>:
          nav==="billing"?<BillingPage settings={settings} onSettingsChange={setSettings} t={t}/>:
          nav==="backup"?<BackupPage clients={clients} settings={settings} onRestoreBackup={restoreBackup} t={t}/>:
          nav==="archived"?<ArchivedClientsPage clients={clients} onRestore={restoreClient} onDelete={deleteClient} t={t}/>:
          nav==="whats-new"?<WhatsNewPage t={t} role={role}/>:
          nav==="help"?<HelpSupportPage t={t} settings={settings} authUser={authUser}/>:
          <AboutPage t={t} settings={settings} lang={lang} isDark={isDark}/>}
      </div></div>
    </div>
  </PremiumCtx.Provider></ChartConfigCtx.Provider></HideCtx.Provider></ThemeCtx.Provider>;
}
