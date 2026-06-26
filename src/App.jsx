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
if(typeof window!=="undefined"){window.__GA_BUILD__="2026-06-26-v08317-dsr-ratio-percent-format";console.log("%c⚓ Golden Anchor build:","color:#D4A017;font-weight:bold",window.__GA_BUILD__);}
// ── Phase 0 modules (D-37, 2026-06-10) — see docs/ARCHITECTURE-PLAN.md ──
import { supabase, gaLoadClients, gaSaveClient, gaDeleteClient, gaLoadClientSummaries, gaLoadClient, gaLoadAllClientBlobs, gaSetArchived, gaLoadSettings, gaSaveSettings, gaLoadIntakeSubmissions, gaSubmitIntake, gaUpdateIntakeStatus, gaUpdateIntakeData, gaDeleteIntakeSubmission, gaDeleteIntakeSubmissionsByStatus, gaLoadIntakeInvites, gaDeleteIntakeInvite, gaDeleteAllIntakeInvites, gaSendIntakeInvite, gaSendSupportEmail, gaResolveIntakeInvite, gaMarkIntakeInviteSubmitted, genPortalToken, gaResolvePortal, gaListPortalLinks, gaCreatePortalLink, gaSendPortalLink, gaRevokePortalLink, gaEmailCompleteReport, gaDownloadCompleteReport, gaMigrateLocalStorage, gaClearLocalCache, gaDashboardAll } from "./services/supabase";
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
import { ClientList } from "./components/clientList";
import { NewClientModal, ClientForm } from "./components/clientEditor";
import { ProfileModal } from "./components/profileModal";
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
  const[selected,setSelected]=useState(null);const[loadingClient,setLoadingClient]=useState(false);const[selectedTab,setSelectedTab]=useState((_gaInitRoute&&_gaInitRoute.selectedTab)||"report");const[selectedCalc,setSelectedCalc]=useState((_gaInitRoute&&_gaInitRoute.selectedCalc)||null);// v0.13.1 — which calculator is open inside the /calculators page
  const[addOpen,setAddOpen]=useState(false);const[profileOpen,setProfileOpen]=useState(false);const[profileSection,setProfileSection]=useState(null);const[importDupResolver,setImportDupResolver]=useState(null);const[sidebarCollapsed,setSidebarCollapsed]=useState(false);const[drawerOpen,setDrawerOpen]=useState(false);const[avatarPickerOpen,setAvatarPickerOpen]=useState(false);const[chartSettingsOpen,setChartSettingsOpen]=useState(false);const[clientsMenuOpen,setClientsMenuOpen]=useState(false);const[clientsSort,setClientsSort]=useState("name");const[sidebarImportOpen,setSidebarImportOpen]=useState(false);const vp=useViewport();const isPublicIntakeRoute=typeof window!=="undefined"&&/\/intake\/?(\?|$)/.test((window.location.pathname||"")+(window.location.search||""));const isPublicPortalRoute=typeof window!=="undefined"&&/\/portal\/?(\?|$)/.test((window.location.pathname||"")+(window.location.search||""));
  // Close Clients hamburger on outside click
  useEffect(()=>{if(!clientsMenuOpen)return;const h=e=>{const el=document.getElementById("ga-clients-menu");if(el&&!el.contains(e.target))setClientsMenuOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[clientsMenuOpen]);
  const[clients,setClients]=useState(()=>SEED.map(mig));  // v0.81.1: no ga_v3 full-cache — Supabase is source of truth (scale: removes the ~5MB localStorage wall)
  const[dashData,setDashData]=useState(null);  // v0.82: advisor dashboard renders from server aggregates (RPCs), not the client blob array
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
        const _isClient=(authUser?.user_metadata?.role)==="client";
        if(!_foreignCache)await gaMigrateLocalStorage(authUser.id);
        if(_isClient){
          // CLIENT ROLE (unchanged): single self-record, full blob in clients[0].
          const remote=await gaLoadClients(authUser.id);
          if(cancelled)return;
          if(Array.isArray(remote)&&remote.length>0){
            const mapped=remote.map(mig);
            _lastClientsRef.current=mapped;  // seed BEFORE setClients so save effect sees no diff
            setClients(mapped);
          }else if(_foreignCache){_lastClientsRef.current=[];setClients([]);}
          else{const _self=mig({id:gid(),firstName:(authUser?.user_metadata?.firstName)||"",lastName:"",email:authUser?.email||"",clientType:"financeOnly",color1:GOLD});_lastClientsRef.current=[];setClients([_self]);}
        }else{
          // ADVISOR ROLE (v0.83 scale): load lightweight SUMMARY rows; full blobs load on open via gaLoadClient.
          const sums=await gaLoadClientSummaries(authUser.id);
          if(cancelled)return;
          const rows=Array.isArray(sums)?sums:[];
          _lastClientsRef.current=rows;  // seed so the (client-role-guarded) save effect sees no diff
          setClients(rows);
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
  // Persist clients to Supabase only (no localStorage full-cache as of v0.81.1 — see scale plan)
  // v0.83 — ADVISOR persistence is now EXPLICIT (mutation callbacks call gaSaveClient/gaSetArchived/
  // gaDeleteClient directly). The advisor `clients` array holds SUMMARY rows, not blobs, so the
  // array-diff save below would persist summaries — wrong. Guard it to the CLIENT role (1 self-blob).
  useEffect(()=>{
    if(!authUser||!supabase||!_cloudReadyRef.current)return;
    if((authUser?.user_metadata?.role)!=="client")return;
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
  // v0.82 — advisor dashboard data from server RPCs (no client-blob iteration). Refetch on nav→dashboard and after edits.
  useEffect(()=>{
    if(nav!=="dashboard"||!authUser||!supabase||(authUser?.user_metadata?.role)==="client")return;
    let cancelled=false;
    gaDashboardAll().then(d=>{if(!cancelled)setDashData(d);}).catch(()=>{});
    return()=>{cancelled=true;};
  },[nav,authUser,clients]);
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
      // v0.83 — advisor rows are summaries; load the full blob for `selected`. Client-role rows are blobs.
      if(c&&c.id!==selected?.id){if(_isAdvisor()&&authUser&&c._summary){gaLoadClient(authUser.id,c.id).then(b=>{if(b)setSelected(mig(b));});}else setSelected(c);}
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
        else{const c=clients.find(x=>String(x.id)===String(st.selectedId));
          // v0.83 — load the blob for advisor summary rows; client-role rows are already blobs.
          if(c&&_isAdvisor()&&authUser&&c._summary){gaLoadClient(authUser.id,c.id).then(b=>setSelected(b?mig(b):null));}else setSelected(c||null);}
      }else{
        // v0.13.0 — Back/Forward landed on a state-less entry (e.g. an external
        // link or manual URL edit). Parse the current URL and apply.
        const parsed=parseGAPath(window.location.pathname);
        if(parsed){
          setNav(parsed.nav);
          setSelectedTab(parsed.selectedTab);
          setSelectedCalc(parsed.selectedCalc||null); // v0.13.1
          if(parsed.clientId==null){setSelected(null);}
          else{const c=clients.find(x=>String(x.id)===parsed.clientId);
            if(c&&_isAdvisor()&&authUser&&c._summary){gaLoadClient(authUser.id,c.id).then(b=>setSelected(b?mig(b):null));}else setSelected(c||null);}
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
  // a11y (WCAG 3.1.1) — keep <html lang> in sync with the active language so screen
  // readers pronounce content correctly. Skip the public portal/intake routes — those
  // pages early-return and manage their own lang (they set documentElement.lang themselves).
  useEffect(()=>{if(typeof document==="undefined"||isPublicPortalRoute||isPublicIntakeRoute)return;document.documentElement.lang=lang;},[lang,isPublicPortalRoute,isPublicIntakeRoute]);
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
  // v0.83 — advisor scale: `clients` holds SUMMARY rows; full blobs live in Supabase and load on
  // open (gaLoadClient). Advisor mutations call the service fns directly, then refresh the summary
  // rows. CLIENT role (single self-blob in clients[0]) keeps the setClients path — its save effect
  // still persists. `_isAdvisor()` is read at call time (authUser is stable across a session).
  const _isAdvisor=useCallback(()=>(authUser?.user_metadata?.role)!=="client",[authUser]);
  const refreshSummaries=useCallback(async()=>{if(!authUser)return;const s=await gaLoadClientSummaries(authUser.id);if(s){_lastClientsRef.current=s;setClients(s);}},[authUser]);
  // v0.83.3 — export-all/backup must page the FULL blobs, not the summary rows the advisor `clients` holds.
  // Client role: clients[] is already the full self-blob, return as-is.
  const loadAllBlobs=useCallback(async()=>{if(_isAdvisor()&&authUser){const all=await gaLoadAllClientBlobs(authUser.id);return Array.isArray(all)?all.map(mig):[];}return clients;},[_isAdvisor,authUser,clients]);
  // Open a client = load its full blob (advisor rows are summaries). Client-role rows are already blobs.
  const openClient=useCallback(async(row,tab)=>{
    if(tab)setSelectedTab(tab);
    if(!row)return;
    if(!_isAdvisor()||!row._summary||!authUser){setSelected(mig(row));return;}
    setLoadingClient(true);
    try{const blob=await gaLoadClient(authUser.id,row.id);setSelected(blob?mig(blob):mig(row));}
    finally{setLoadingClient(false);}
  },[_isAdvisor,authUser]);
  const upClient=useCallback(async c=>{const mc=mig(c);let ok=true;
    // v0.83.1 — gate the success toast on the advisor save result. gaSaveClient returns false +
    // dispatches ga-save-failed (error toast) on failure; without this guard the green "saved"
    // toast immediately overwrote that error → user told "saved" when it wasn't (silent data loss).
    if(_isAdvisor()&&authUser){ok=await gaSaveClient(authUser.id,mc);setSelected(mc);await refreshSummaries();}
    else{setClients(p=>p.map(x=>x.id===mc.id?mc:x));setSelected(mc);}
    if(ok)toastSaved(t.savedClientToast||"Client saved");
  },[toastSaved,t,_isAdvisor,authUser,refreshSummaries]);
  const addClient=async newC=>{const mc=mig(newC);let ok=true;
    if(_isAdvisor()&&authUser){ok=await gaSaveClient(authUser.id,mc);setSelected(mc);await refreshSummaries();}
    else{setClients(p=>[...p,mc]);setSelected(mc);}
    setAddOpen(false);setSelectedTab("monthly");setNav("clients");if(ok)toastSaved(t.savedClientAddedToast||"Client added");
  };
  const importMultiple=useCallback(async cs=>{const arr=cs.map(mig);
    if(_isAdvisor()&&authUser){for(const c of arr)await gaSaveClient(authUser.id,c);await refreshSummaries();}
    else{setClients(prev=>[...prev,...arr]);}
  },[_isAdvisor,authUser,refreshSummaries]);
  const archiveClient=useCallback(async id=>{
    if(_isAdvisor()&&authUser){const cur=(_lastClientsRef.current||[]).find(c=>c.id===id);await gaSetArchived(authUser.id,id,!(cur&&cur.archived));await refreshSummaries();}
    else{setClients(p=>p.map(c=>c.id===id?{...c,archived:!c.archived}:c));}
    toastSaved(t.archivedToast||"Client archived");
  },[toastSaved,t,_isAdvisor,authUser,refreshSummaries]);
  const restoreClient=useCallback(async id=>{
    if(_isAdvisor()&&authUser){await gaSetArchived(authUser.id,id,false);await refreshSummaries();}
    else{setClients(p=>p.map(c=>c.id===id?{...c,archived:false}:c));}
    toastSaved(t.restoredToast||"Client restored");
  },[toastSaved,t,_isAdvisor,authUser,refreshSummaries]);
  const deleteClient=useCallback(async id=>{
    if(_isAdvisor()&&authUser){await gaDeleteClient(authUser.id,id);setSelected(null);await refreshSummaries();}
    else{setClients(p=>p.filter(c=>c.id!==id));setSelected(null);}
    toastSaved(t.deletedToast||"Client deleted");
  },[toastSaved,t,_isAdvisor,authUser,refreshSummaries]);
  const restoreBackup=useCallback(async(backup,mode)=>{const mc=backup.clients.map(mig);
    if(_isAdvisor()&&authUser){
      // Replace vs merge over the SERVER set: load current blobs to dedupe/merge, then persist.
      if(mode==="replace"){const prev=_lastClientsRef.current||[];for(const p of prev)await gaDeleteClient(authUser.id,p.id);for(const bc of mc)await gaSaveClient(authUser.id,bc);if(backup.settings)setSettings(s=>({...s,...backup.settings}));}
      else{const sums=_lastClientsRef.current||[];for(const bc of mc){const dupRow=findDuplicate(bc,sums);if(dupRow){const full=await gaLoadClient(authUser.id,dupRow.id);await gaSaveClient(authUser.id,smartMerge(full?mig(full):dupRow,bc));}else await gaSaveClient(authUser.id,bc);}}
      await refreshSummaries();
    }else{
      if(mode==="replace"){setClients(mc);if(backup.settings)setSettings(s=>({...s,...backup.settings}));}else{setClients(prev=>{const newClients=[];const updated=[...prev];mc.forEach(bc=>{const dup=findDuplicate(bc,updated);if(dup){const idx=updated.findIndex(c=>c.id===dup.id);updated[idx]=smartMerge(dup,bc);}else newClients.push(bc);});return[...updated,...newClients];});}
    }
  },[_isAdvisor,authUser,refreshSummaries])
  // splitClient operates on the OPEN `selected` blob (already a full blob). p1/p2 are new blobs.
  const splitClient=async(p1,p2)=>{
    if(_isAdvisor()&&authUser){await gaSaveClient(authUser.id,p1);await gaSaveClient(authUser.id,p2);if(selected?.id!=null)await gaDeleteClient(authUser.id,selected.id);setSelected(null);await refreshSummaries();}
    else{setClients(prev=>[...prev.filter(x=>x.id!==selected?.id),p1,p2]);setSelected(null);}
    setNav("clients");
  };
  // joinClients(target,partner): args may be SUMMARY rows — load both blobs, then merge.
  const _mergeJoin=(c1,c2)=>mig({...c1,id:c1.id,partnerFirst:c2.firstName,partnerLast:c2.lastName,color2:c2.color1,incomeStreams:[...c1.incomeStreams,...c2.incomeStreams.map(s=>({...s,id:gid(),person:"p2"}))],bills:[...c1.bills,...c2.bills.filter(b=>!c1.bills.some(x=>x.name===b.name)).map(b=>({...b,id:gid(),assignedTo:"p2",split:{p1:0,p2:100}}))],cards:[...c1.cards,...c2.cards.map(cc=>({...cc,id:gid(),owedBy:"p2"}))],accounts:[...c1.accounts,...c2.accounts.map(a=>({...a,id:gid(),owner:"p2"}))],loans:[...c1.loans,...c2.loans.map(l=>({...l,id:gid(),owner:"p2"}))]});
  const joinClients=async(c1,c2)=>{
    if(_isAdvisor()&&authUser){
      const a=await gaLoadClient(authUser.id,c1.id);const b=await gaLoadClient(authUser.id,c2.id);
      if(!a||!b){setToast({kind:"error",msg:t.saveFailedToast?t.saveFailedToast.replace("{x}","client"):"Couldn't load client data to join.",ts:Date.now()});return;}
      const joined=_mergeJoin(mig(a),mig(b));
      await gaSaveClient(authUser.id,joined);await gaDeleteClient(authUser.id,c2.id);
      setSelected(joined);await refreshSummaries();
    }else{
      const joined=_mergeJoin(c1,c2);setClients(prev=>[...prev.filter(x=>x.id!==c1.id&&x.id!==c2.id),joined]);setSelected(joined);
    }
    setNav("clients");
  };
  // v0.8.0 — bulk client actions (Chat 4)
  const archiveMany=useCallback(async ids=>{
    if(_isAdvisor()&&authUser){for(const id of ids)await gaSetArchived(authUser.id,id,true);await refreshSummaries();}
    else{const s=new Set(ids);setClients(p=>p.map(c=>s.has(c.id)?{...c,archived:true}:c));}
  },[_isAdvisor,authUser,refreshSummaries]);
  const restoreMany=useCallback(async ids=>{
    if(_isAdvisor()&&authUser){for(const id of ids)await gaSetArchived(authUser.id,id,false);await refreshSummaries();}
    else{const s=new Set(ids);setClients(p=>p.map(c=>s.has(c.id)?{...c,archived:false}:c));}
  },[_isAdvisor,authUser,refreshSummaries]);
  const deleteMany=useCallback(async ids=>{
    if(_isAdvisor()&&authUser){for(const id of ids)await gaDeleteClient(authUser.id,id);setSelected(null);await refreshSummaries();}
    else{const s=new Set(ids);setClients(p=>p.filter(c=>!s.has(c.id)));setSelected(null);}
  },[_isAdvisor,authUser,refreshSummaries]);
  // splitClientPair: from the ClientList picker — origId/p1/p2 are full blobs (SplitAssignModal output).
  const splitClientPair=useCallback(async(origId,p1,p2)=>{
    if(_isAdvisor()&&authUser){await gaSaveClient(authUser.id,p1);await gaSaveClient(authUser.id,p2);await gaDeleteClient(authUser.id,origId);setSelected(null);await refreshSummaries();}
    else{setClients(prev=>[...prev.filter(x=>x.id!==origId),p1,p2]);setSelected(null);}
  },[_isAdvisor,authUser,refreshSummaries]);
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
          nav==="dashboard"?(role==="client"?(linkedView?<LinkedOverview data={linkedView} lang={lang}/>:clients[0]?<ClientDetail client={clients[0]} clientMode={true} onUpdate={upClient} lang={lang} t={t} onBack={()=>{}} startTab={selectedTab} allClients={clients} settings={settings} onTabChange={setSelectedTab}/>:<div className="ga-np" style={{padding:24,color:theme.muted,fontSize:13}}>{t.settingUpProfile||"Setting up your profile…"}</div>):<Dashboard clients={clients} dashData={dashData} t={t} settings={settings} onSelect={c=>{openClient(c,"report");setNav("clients");}} setSettings={setSettings} onAdd={()=>setAddOpen(true)} onImportNew={importMultiple} onArchive={archiveClient} onRestore={restoreClient} onDelete={deleteClient} onRestoreBackup={restoreBackup} loadAllBlobs={loadAllBlobs} onToggleHide={()=>setSettings(s=>({...s,hideNumbers:!s.hideNumbers}))} hideNumbers={settings.hideNumbers||false}/>):
          nav==="clients"?<ClientList clients={clients} t={t} onSelect={c=>openClient(c,"report")} loadClientBlob={_isAdvisor()&&authUser?(id=>gaLoadClient(authUser.id,id)):null} loadAllBlobs={loadAllBlobs} onAdd={()=>setAddOpen(true)} onRestore={restoreClient} onImportNew={importMultiple} onRestoreBackup={restoreBackup} onArchiveMany={archiveMany} onRestoreMany={restoreMany} onDeleteMany={deleteMany} onSplit={splitClientPair} onJoin={joinClients}/>:
          nav==="intake-submissions"?<IntakeSubmissionsPage t={t} authUser={authUser} settings={settings} onConvert={c=>{addClient(c);}}/>:
          nav==="calculators"?<CalculatorsPage t={t} activeCalc={selectedCalc} onActiveChange={setSelectedCalc}/>:
          nav==="pricing"?<PricingPage variant="app" t={t} lang={lang} settings={settings} onRequest={null}/>:nav==="promotions"?<PromotionsPage settings={settings} onSettingsChange={setSettings} t={t}/>:
          nav==="resources"?<ResourcesPage t={t}/>:
          nav==="members"?(isGaAdmin(authUser?.email)&&role!=="client"?<MembersAdminPage t={t} lang={lang}/>:<div className="ga-np" style={{padding:40,textAlign:"center",color:theme.dim,fontSize:13}}>{lang==="es"?"Solo administradores.":"Admins only."}</div>):
          nav==="useful-links"?<UsefulLinksPage lang={lang} client={role==="client"?clients[0]:null} onUpdateClient={upClient}/>:
          nav==="settings"?<SettingsPage role={role} onUpdateClient={upClient} settings={settings} clients={clients} onEdit={(sec)=>{setProfileSection(sec||null);setProfileOpen(true);}} onSave={patch=>{setSettings(s=>({...s,...patch}));if(patch.lang==="en"||patch.lang==="es")setLang(patch.lang);}} t={t}/>:
          nav==="security"?<SecurityPage t={t}/>:
          nav==="billing"?<BillingPage settings={settings} onSettingsChange={setSettings} t={t}/>:
          nav==="backup"?<BackupPage clients={clients} loadAllBlobs={loadAllBlobs} settings={settings} onRestoreBackup={restoreBackup} t={t}/>:
          nav==="archived"?<ArchivedClientsPage clients={clients} onRestore={restoreClient} onDelete={deleteClient} t={t}/>:
          nav==="whats-new"?<WhatsNewPage t={t} role={role}/>:
          nav==="help"?<HelpSupportPage t={t} settings={settings} authUser={authUser}/>:
          <AboutPage t={t} settings={settings} lang={lang} isDark={isDark}/>}
      </div></div>
    </div>
  </PremiumCtx.Provider></ChartConfigCtx.Provider></HideCtx.Provider></ThemeCtx.Provider>;
}
