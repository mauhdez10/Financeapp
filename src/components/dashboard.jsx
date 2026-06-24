// Dashboard + reminders panel — extracted from App.jsx in Phase 2 of
// docs/ARCHITECTURE-PLAN.md (D-37). Verbatim from the single-file era.
import { useEffect, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip as ReTip, XAxis, YAxis } from "recharts";
import { ACCT_META, MS } from "../constants/meta";
import { useTh } from "../contexts/theme";
import { GOLD, mCARD, mINP } from "../styles/theme";
import { fmt, fmtD, fmtS, getAdvRem, getClientRem, isAlertDismissed, liquidA, sumB, sumMin, sumN, toM, totalA, totalL } from "../utils/finance";
import { ChartSettingsModal, DashSlotPicker } from "./chartEditors";
import { Donut, Dumbbell, ForecastCone, GroupedYoY, HeatmapCalendar, NetWorthBridge, PayoffProgression, Radar5, RadialGauge, RankedHBars, Sankey, SlopeGraph, SmoothAreaLine, Sparkline, StackedBars, Sunburst, Treemap, Waterfall } from "./charts";
import { BackupImportModal, ExportModal, ImportWizard } from "./clientData";
import { BSolid, Btn, KpiTile, Modal, Pill, useViewport } from "./primitives";

export function AlertsSettingsModal({settings,onSave,onClose,t}){const th=useTh();const[s,setS]=useState(settings.alertTypes||{noContact:true,highDSR:true,promoExpiring:true,debtRising:true,billDue:true,lowCashFlow:true,lowEF:true,missedSnap:true});const toggle=k=>setS(p=>({...p,[k]:!p[k]}));const labels={noContact:t.alertNoContact||"No Contact (30+ days)",highDSR:t.alertHighDSR||"High DSR (>36%)",promoExpiring:t.alertPromoExpiring||"Promo APR Expiring",debtRising:t.alertDebtRising||"Debt Rising Month-over-Month",billDue:t.alertBillDue||"Bills Due This Week",lowCashFlow:t.alertLowCashFlow||"Negative Cash Flow",lowEF:t.alertLowEF||"Low Emergency Fund",missedSnap:t.alertMissedSnap||"Missed Monthly Snapshot"};return<Modal title={"⚙️ "+(t.alertSettings||"Alert Settings")} onClose={onClose}><div style={{fontSize:12,color:th.muted,marginBottom:16}}>{t.alertSettingsIntro||"Toggle which alert types appear in the advisor panel:"}</div>{Object.entries(labels).map(([k,l])=><div key={k} onClick={()=>toggle(k)} style={{...mCARD(th),padding:"10px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,marginBottom:5,border:`1px solid ${s[k]?th.accent:th.cardBorder}`}}><div style={{width:32,height:18,borderRadius:99,background:s[k]?th.accent:th.cardBorder,position:"relative",transition:"all 0.15s"}}><div style={{position:"absolute",top:2,left:s[k]?16:2,width:14,height:14,borderRadius:99,background:"#fff",transition:"all 0.15s"}}/></div><span style={{fontSize:12,color:th.text}}>{l}</span></div>)}<div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}><Btn onClick={onClose}>{t.cancel||"Cancel"}</Btn><BSolid onClick={()=>{onSave({...settings,alertTypes:s});onClose();}}>{t.save||"Save"}</BSolid></div></Modal>;}

export function RemindersPanel({clients,settings,t,onSettingsChange}){
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
          {mutedAdv.map((a,i)=><div key={a.key||i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 10px",borderRadius:7,background:"rgba(127,127,127,0.07)",fontSize:11,opacity:0.85}}>
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
              <span style={{color:th.dim,marginLeft:6}}>· {u.clientName}</span>
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
          {mutedCli.map((u,i)=><div key={u.key||i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 10px",borderRadius:7,background:"rgba(127,127,127,0.07)",fontSize:11,opacity:0.85}}>
            <div style={{flex:1,minWidth:0,overflow:"hidden"}}>
              <span style={{color:th.muted,fontWeight:600}}>{u.name}</span>
              <span style={{color:th.dim,marginLeft:6}}>· {u.clientName}</span>
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

const dashChartOptions=t=>[
  {id:"incomeVsSpending",label:"📊 "+(t?.incomeVsSpendingHdr||"Income vs Spending")},
  {id:"sankey",label:"🌊 "+(t?.cashFlowMapHdr||"Cash Flow Map (Sankey)")},
  {id:"netWorthDonut",label:"💎 "+(t?.netWorthDistributionHdr||"Net Worth Distribution")},
  {id:"clientsTreemap",label:"🗺️ "+(t?.clientsByNetWorthHdr||"Clients by Net Worth")},
  // v0.54 (PR 5) — RankedHBars alternative for "Clients by Net Worth" per
  // preview/27-dashboard-row.html. Treemap kept above as a version choice.
  {id:"clientsRanked",label:"🏆 "+(t?.clientsRankedSlot||"Clients · Ranked H-Bars")},
  {id:"practiceHealth",label:"🎯 "+(t?.practiceHealthHdr||"Practice Health")},
  {id:"netWorthBridge",label:"⚖️ "+(t?.netWorthBridgeHdr||"Net Worth Bridge")},
  // v0.47.0 — expanded slot options. Each renders practice-aggregated data.
  {id:"debtVsSavingsTrend",label:"📈 "+(t?.debtVsSavingsSlot||"Debt vs Savings Trend")},
  {id:"cashFlowTrend",label:"💰 "+(t?.cashFlowTrendSlot||"Cash Flow Trend")},
  {id:"debtRanked",label:"🏦 "+(t?.debtRankedSlot||"Debts by Balance")},
  {id:"practiceWaterfall",label:"🌊 "+(t?.practiceWaterfallSlot||"Practice Cash Flow Waterfall")},
  {id:"healthRadar",label:"🎯 "+(t?.healthRadarSlot||"Practice Health (Radar)")},
  {id:"netWorthForecast",label:"🔮 "+(t?.netWorthForecastSlot||"Net Worth Forecast")},
  {id:"assetSunburst",label:"☀️ "+(t?.assetSunburstSlot||"Asset Allocation (Sunburst)")},
  {id:"clientsDumbbell",label:"⚖️ "+(t?.clientsDumbbellSlot||"Client Net Worth Δ")},
  {id:"netWorthSlope",label:"📐 "+(t?.netWorthSlopeSlot||"Net Worth Prior vs Current")},
  {id:"billsStacked",label:"💳 "+(t?.billsStackedSlot||"Bills by Category")},
  {id:"billsYoY",label:"📅 "+(t?.billsYoYSlot||"Bills YoY")},
  {id:"spendingHeatmap",label:"🔥 "+(t?.spendingHeatmapSlot||"Spending Heatmap")},
  {id:"payoffProgression",label:"📉 "+(t?.payoffProgressionSlot||"Debt Payoff Timeline")},
  {id:"kpiSparklines",label:"✨ "+(t?.kpiSparklinesSlot||"KPI Sparklines")},
];

/* ── v0.46.0 — ChartSettingsModal: rebuilt as a temporary Chart Gallery.
   Renders every chart component the app supports with realistic sample data
   so we can audit which to keep / swap / retire. Dashboard slot picker
   preserved below the gallery for in-place swaps. */
export function Dashboard({clients,t,settings,setSettings,onSelect,onAdd,onImportNew,onArchive,onRestore,onDelete,onRestoreBackup,onToggleHide,hideNumbers}){const th=useTh();const{isMobile}=useViewport();const[importOpen,setImportOpen]=useState(false);const[restoreOpen,setRestoreOpen]=useState(false);const[exportOpen,setExportOpen]=useState(false);const[dashSearch,setDashSearch]=useState("");const active=clients.filter(c=>!c.archived).filter(c=>{if(!dashSearch)return true;const q=dashSearch.toLowerCase();return `${c.firstName} ${c.lastName} ${c.partnerFirst||""} ${c.email||""}`.toLowerCase().includes(q);});const td=active.reduce((s,c)=>s+totalL(c),0);const ti=active.reduce((s,c)=>s+sumN(c.incomeStreams),0);const fO=active.filter(c=>c.clientType==="financeOnly").length;const fH=active.filter(c=>c.clientType==="financeAndHealth").length;const calcTrend=c=>{const s=c.monthSnapshots||[];if(s.length<2)return"stable";const diff=s[s.length-1].debt-s[0].debt;if(diff<0)return"improving";if(diff>100)return"worsening";return"stable";};const improvCount=active.filter(c=>calcTrend(c)==="improving").length;const stableCount=active.filter(c=>calcTrend(c)==="stable").length;const worseCount=active.filter(c=>calcTrend(c)==="worsening").length;const[trendMode,setTrendMode]=useState("revolving");// "all" | "revolving" | "current"
  const[trendRange,setTrendRange]=useState("12");// "3" | "6" | "12" | "all"
  const getDebtForMode=sn=>{if(!sn?.data)return sn?.debt||0;const d=sn.data;if(trendMode==="all")return(d.cards||[]).reduce((a,c)=>a+(+c.balance||0),0)+(d.loans||[]).reduce((a,l)=>a+(+l.balance||0),0);if(trendMode==="revolving")return(d.cards||[]).reduce((a,c)=>a+(+c.balance||0),0);// "current": revolving + short-term loans (personal/student), excludes mortgage/auto
return(d.cards||[]).reduce((a,c)=>a+(+c.balance||0),0)+(d.loans||[]).filter(l=>!l.linkedAssetId&&l.type!=="mortgage"&&l.type!=="vehicle").reduce((a,l)=>a+(+l.balance||0),0);};
  const _allLabels=Array.from(new Set(clients.flatMap(c=>(c.monthSnapshots||[]).map(s=>s.label))));const _labelKey=lbl=>{const parts=lbl.split(" ");const yr=parseInt(parts[1])||new Date().getFullYear();const mo=MS.indexOf(parts[0]);return yr*12+(mo>=0?mo:0);};const _sortedLabels=_allLabels.slice().sort((a,b)=>_labelKey(a)-_labelKey(b));const _rangeCount=trendRange==="3"?3:trendRange==="6"?6:trendRange==="12"?12:_sortedLabels.length;const _shownLabels=_sortedLabels.slice(-_rangeCount);const trend=(_shownLabels.length?_shownLabels:["Jan 2026","Feb 2026","Mar 2026","Apr 2026","May 2026"]).map(m=>({m:m.split(" ")[0]+(m.split(" ")[1]?("’"+m.split(" ")[1].slice(-2)):""),debt:clients.reduce((s,c)=>{const sn=(c.monthSnapshots||[]).find(x=>x.label===m);return s+getDebtForMode(sn);},0),savings:clients.reduce((s,c)=>{const sn=(c.monthSnapshots||[]).find(x=>x.label===m);return s+(sn?.savings||0);},0)}));return<div style={{padding:isMobile?14:24}}>{importOpen&&<ImportWizard onClose={()=>setImportOpen(false)} onImport={cs=>{onImportNew(cs);setImportOpen(false);}} existingClients={clients} t={t}/>}{restoreOpen&&<BackupImportModal onImport={onRestoreBackup} onClose={()=>setRestoreOpen(false)} existingClients={clients} t={t}/>}{exportOpen&&<ExportModal clients={clients} onClose={()=>setExportOpen(false)} t={t}/>}{/* v0.16.0 Phase 8 — 4 wide KPI cards matching Claude design */}
{/* v0.56 — KpiTile with inline sparkline per Mauricio's image 3.
   Each tile builds its own series from the practice-wide trend data. */}
{(()=>{
  const liqNow=active.reduce((s,c)=>s+liquidA(c),0);
  // Series per metric, oldest→newest, with current live value appended.
  const clientSeries=(()=>{const out=[];const labels=_shownLabels;labels.forEach(m=>{out.push(active.filter(c=>(c.monthSnapshots||[]).some(sn=>sn.label===m)).length);});out.push(active.length);return out.length<2?[active.length,active.length]:out;})();
  const incomeSeries=(()=>{const out=_shownLabels.map(m=>{let v=0;active.forEach(c=>{const sn=(c.monthSnapshots||[]).find(x=>x.label===m);if(sn)v+=sn.income||0;});return v;});out.push(ti);return out.length<2?[ti,ti]:out;})();
  const debtSeries=trend.map(p=>p.debt).concat([td]);
  const liqSeries=trend.map(p=>p.savings).concat([liqNow]);
  // Delta = current vs previous period (last vs second-to-last).
  const dlt=arr=>{const n=arr.length;if(n<2)return null;const cur=arr[n-1],prev=arr[n-2];const ch=cur-prev;if(ch===0)return null;return{up:ch>0,down:ch<0,value:(ch>0?"+":"")+fmtS(Math.abs(ch))};};
  return<div data-ga-grid="kpi-4" style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:12,marginBottom:isMobile?14:20}}>
    <KpiTile label={t?.kpiClients||"Clients"} value={clients.length} color={th.accent} spark={clientSeries} delta={dlt(clientSeries)} sub={t.thisMonth||"this month"}/>
    <KpiTile label={t.combinedNetMo||"Combined Net / mo"} value={hideNumbers?"●●●":fmtS(ti)} color={th.pos} spark={incomeSeries} delta={dlt(incomeSeries)} sub={t.vsLastMo||"vs last mo"}/>
    <KpiTile label={t.combinedDebt||"Combined Debt"} value={hideNumbers?"●●●":fmtS(td)} color={th.neg} spark={debtSeries} delta={(()=>{const d=dlt(debtSeries);if(!d)return null;return{...d,up:debtSeries[debtSeries.length-1]<debtSeries[debtSeries.length-2],down:debtSeries[debtSeries.length-1]>debtSeries[debtSeries.length-2]};})()}/>
    <KpiTile label={t.liquidAssets||"Liquid Assets"} value={hideNumbers?"●●●":fmtS(liqNow)} color={GOLD} spark={liqSeries} delta={dlt(liqSeries)} sub={t.checkingSavingsLbl||"checking + savings"}/>
  </div>;
})()}

{/* v0.39.0 — Slot-driven dashboard row. Each card has a gear icon to swap charts.
    Slot choices persist to settings.dashboardSlots. */}
{(()=>{
  const dashCharts={
    incomeVsSpending:{id:"incomeVsSpending",label:"📊 "+(t.incomeVsSpendingHdr||"Income vs Spending"),render:()=><>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8,paddingRight:30}}>
        <div>
          <div style={{fontSize:10,fontWeight:500,color:th.muted,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>{t.incomeVsSpendingHdr||"Income vs Spending"}</div>
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
        <ComposedChart data={(()=>{const labels=_shownLabels.length?_shownLabels:["Jan 2026","Feb 2026","Mar 2026","Apr 2026","May 2026"];const monthCounts={};labels.forEach(l=>{const k=l.split(" ")[0];monthCounts[k]=(monthCounts[k]||0)+1;});return labels.map(m=>{const parts=m.split(" ");const monthKey=monthCounts[parts[0]]>1&&parts[1]?`${parts[0]} '${String(parts[1]).slice(-2)}`:parts[0];const income=clients.reduce((s,c)=>{const sn=(c.monthSnapshots||[]).find(x=>x.label===m);return s+(sn?.income||0);},0);const spending=clients.reduce((s,c)=>{const sn=(c.monthSnapshots||[]).find(x=>x.label===m);return s+((sn?.bills||0)+((sn?.data?.cards||[]).reduce((a,cd)=>a+(+cd.min||0),0)));},0);return{m:monthKey,income,spending,net:income-spending};});})()} margin={{top:12,right:12,left:0,bottom:0}}>
          <defs>
            {/* v0.61.1 — thin gradient bars (vivid top → transparent base) read lighter than solid blocks */}
            <linearGradient id="ivsInc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={th.pos} stopOpacity="0.95"/><stop offset="100%" stopColor={th.pos} stopOpacity="0.32"/></linearGradient>
            <linearGradient id="ivsSpd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={th.neg} stopOpacity="0.85"/><stop offset="100%" stopColor={th.neg} stopOpacity="0.26"/></linearGradient>
          </defs>
          <CartesianGrid stroke={th.cardBorder} strokeDasharray="2 4" vertical={false} opacity={0.6}/>
          <XAxis dataKey="m" tick={{fontSize:11,fill:th.dim,fontFamily:"'JetBrains Mono',monospace"}} axisLine={false} tickLine={false}/>
          <YAxis tick={{fontSize:10,fill:th.dim,fontFamily:"'JetBrains Mono',monospace"}} axisLine={false} tickLine={false} tickFormatter={v=>fmtS(v)} width={50}/>
          <ReTip contentStyle={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:8,fontSize:11}} formatter={v=>fmt(v)}/>
          <Bar dataKey="income" name={t.income||"Income"} fill="url(#ivsInc)" radius={[3,3,0,0]} maxBarSize={11}/>
          <Bar dataKey="spending" name={t.spending||"Spending"} fill="url(#ivsSpd)" radius={[3,3,0,0]} maxBarSize={11}/>
          <Line type="monotone" dataKey="net" name={t.netLbl||"Net"} stroke={GOLD} strokeWidth={1.6} dot={{r:2.2,fill:GOLD,strokeWidth:0}} activeDot={{r:4,fill:GOLD,strokeWidth:0}}/>
        </ComposedChart>
      </ResponsiveContainer>
    </>},
    sankey:{id:"sankey",label:"🌊 "+(t.cashFlowMapHdr||"Cash Flow Map (Sankey)"),render:()=>{
      let totalI=0,totalB=0,totalM=0;
      active.forEach(c=>{totalI+=sumN(c.incomeStreams||[]);totalB+=sumB(c.bills||[]);totalM+=sumMin(c.cards||[]);});
      const cashFlow=Math.max(0,totalI-totalB-totalM);
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>🌊 {t.cashFlowMapHdr||"Cash Flow Map"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.cashFlowMapSub||"Where the practice's aggregate income flows."}</div></div>
        {totalI<=0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center",padding:20,minHeight:isMobile?180:200}}>{t.noFlowYet||"Add client income to see flow."}</div>:<Sankey width={460} height={isMobile?220:260} nodes={[{id:"inc",label:""+(t.income||"Income"),layer:0,color:th.pos},{id:"bills",label:""+(t.bills||"Bills"),layer:1,color:th.neg},{id:"min",label:"🏦 "+(t.minPay||"Debt Min"),layer:1,color:th.warn},{id:"cash",label:"💰 "+(t.cashFlow||"Cash Flow"),layer:1,color:GOLD}]} links={[{from:"inc",to:"bills",value:totalB,color:th.neg},{from:"inc",to:"min",value:totalM,color:th.warn},{from:"inc",to:"cash",value:cashFlow,color:GOLD}]}/>}
      </>;
    }},
    netWorthDonut:{id:"netWorthDonut",label:"💎 "+(t.netWorthDistributionHdr||"Net Worth Distribution"),render:()=>{
      const tiers={neg:0,low:0,mid:0,high:0};let totalNW=0;
      active.forEach(c=>{const nw=totalA(c)-totalL(c);totalNW+=nw;if(nw<0)tiers.neg++;else if(nw<50000)tiers.low++;else if(nw<250000)tiers.mid++;else tiers.high++;});
      const donutData=[{name:t.tierNeg||"Negative",value:tiers.neg,color:th.neg},{name:t.tierLow||"$0–50K",value:tiers.low,color:th.warn},{name:t.tierMid||"$50K–250K",value:tiers.mid,color:th.blue},{name:t.tierHigh||"$250K+",value:tiers.high,color:GOLD}].filter(d=>d.value>0);
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>💎 {t.netWorthDistributionHdr||"Net Worth Distribution"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.netWorthDistributionSub||"Active clients grouped by current net worth tier."}</div></div>
        <div style={{display:"flex",alignItems:"center",gap:14,flex:1,minHeight:isMobile?180:200}}>
          <Donut data={donutData} size={isMobile?120:130} innerRatio={isMobile?(40/60):(46/65)} paddingAngle={donutData.length>1?2:0} centerLabel={t.totalNet||"Total Net"} centerValue={fmtS(totalNW)} centerColor={totalNW>=0?GOLD:th.neg} placeholder={t.noClientsYet||"No clients yet"}/>
          <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:8}}>
            {donutData.length===0?<div style={{fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.noClientsYet||"Add clients to populate."}</div>:donutData.map(d=><div key={d.name} style={{display:"flex",alignItems:"center",gap:8,fontSize:11}}><span style={{width:10,height:10,borderRadius:2,background:d.color,flexShrink:0}}/><span style={{color:th.muted,flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{d.name}</span><span style={{color:d.color,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{d.value}</span></div>)}
          </div>
        </div>
      </>;
    }},
    clientsTreemap:{id:"clientsTreemap",label:"🗺️ "+(t.clientsByNetWorthHdr||"Clients by Net Worth"),render:()=>{
      const tmData=active.map(c=>{const nw=totalA(c)-totalL(c);return{label:c.firstName+" "+(c.lastName?c.lastName[0]+".":""),value:Math.max(0,nw),color:nw>=250000?GOLD:nw>=50000?th.blue:nw>=0?th.warn:th.neg};}).filter(d=>d.value>0);
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>🗺️ {t.clientsByNetWorthHdr||"Clients by Net Worth"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.clientsByNetWorthSub||"Tile size = current net worth per client."}</div></div>
        <Treemap data={tmData} width={460} height={isMobile?220:240} placeholder={t.noClientsYet||"No clients yet."}/>
      </>;
    }},
    // v0.54 (PR 5) — RankedHBars variant per preview/27-dashboard-row.html spec.
    // Top 8 by net worth, gold on highest then blue/orange/grey shading.
    clientsRanked:{id:"clientsRanked",label:"🏆 "+(t.clientsRankedSlot||"Clients · Ranked H-Bars"),render:()=>{
      const palette=[GOLD,"#5B9BD5","#4472C4","#ED7D31","#EDD594","#755023","#374151","#475569"];
      const rhData=active.map(c=>{const nw=totalA(c)-totalL(c);return{label:c.firstName+" "+(c.lastName?c.lastName[0]+".":""),value:Math.max(0,nw)};}).filter(d=>d.value>0).sort((a,b)=>b.value-a.value).slice(0,8).map((d,i)=>({...d,color:palette[i]}));
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>🏆 {t.clientsRankedSlot||"Clients · Ranked H-Bars"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.clientsRankedSub||"Top 8 active clients by net worth."}</div></div>
        {rhData.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.noClientsYet||"No clients yet."}</div>:<RankedHBars data={rhData} maxBars={8} width={460}/>}
      </>;
    }},
    practiceHealth:{id:"practiceHealth",label:"🎯 "+(t.practiceHealthHdr||"Practice Health"),render:()=>{
      let inc=0,bls=0,mnd=0,liq=0;
      active.forEach(c=>{inc+=sumN(c.incomeStreams||[]);bls+=sumB(c.bills||[]);mnd+=sumMin(c.cards||[]);liq+=liquidA(c);});
      const dsr=inc>0?mnd/inc:0;
      const sr=inc>0?Math.max(0,inc-bls-mnd)/inc:0;
      const ef=bls>0?liq/bls:0;
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>🎯 {t.practiceHealthHdr||"Practice Health"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.practiceHealthSub||"Aggregate across all active clients."}</div></div>
        {active.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center"}}>{t.noClientsYet||"No clients yet."}</div>:<div style={{display:"flex",alignItems:"center",justifyContent:"space-around",flex:1,flexWrap:"wrap",gap:8,minHeight:isMobile?180:220}}>
          <RadialGauge value={dsr*100} max={60} target={36} size={104} label={"DSR"} subLabel={"≤ 36%"} direction="lower" thresholds={[0.6,0.83]} fmt={v=>v.toFixed(0)+"%"}/>
          <RadialGauge value={sr*100} max={40} target={20} size={104} label={t.savingsRateLbl||"Savings"} subLabel={"≥ 20%"} direction="higher" thresholds={[0.5,0.25]} fmt={v=>v.toFixed(0)+"%"}/>
          <RadialGauge value={ef} max={12} target={3} size={104} label={t.efMonthsLbl||"EF Mo"} subLabel={"3-6"} direction="higher" thresholds={[0.25,0.125]} fmt={v=>v.toFixed(1)}/>
        </div>}
      </>;
    }},
    netWorthBridge:{id:"netWorthBridge",label:"⚖️ "+(t.netWorthBridgeHdr||"Net Worth Bridge"),render:()=>{
      const labels=_shownLabels.length?_shownLabels:[];
      const data=labels.map(m=>{
        const a={liquid:0,invest:0,property:0,other:0};const l={cards:0,loans:0};
        active.forEach(c=>{const sn=(c.monthSnapshots||[]).find(x=>x.label===m);if(sn?.data){(sn.data.accounts||[]).forEach(x=>{const meta=ACCT_META[x.type];const v=+x.value||0;if(meta?.liquid)a.liquid+=v;else if(meta?.invest)a.invest+=v;else a.other+=v;});(sn.data.customAssets||[]).forEach(x=>a.property+=+x.value||0);(sn.data.cards||[]).forEach(cd=>l.cards+=+cd.balance||0);(sn.data.loans||[]).forEach(ln=>l.loans+=+ln.balance||0);}});
        return{label:m,assets:a,liabilities:l};
      });
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>⚖️ {t.netWorthBridgeHdr||"Net Worth Bridge"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.netWorthBridgeSub||"Assets above zero, liabilities below."}</div></div>
        {data.length<2?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center"}}>{t.needMoreSnapshots||"Need 2+ monthly snapshots."}</div>:<NetWorthBridge data={data} width={460} height={isMobile?200:240}/>}
      </>;
    }},
    // v0.47.0 — expanded slot options ↓
    debtVsSavingsTrend:{id:"debtVsSavingsTrend",label:"📈 "+(t.debtVsSavingsSlot||"Debt vs Savings Trend"),render:()=>{
      const data=trend.map(p=>({label:p.m,debt:p.debt,savings:p.savings}));
      const live={label:"▶ Now",debt:Math.round(active.reduce((s,c)=>s+c.cards.reduce((a,cd)=>a+(+cd.balance||0),0),0)),savings:Math.round(active.reduce((s,c)=>s+liquidA(c),0))};
      data.push(live);
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:10,fontWeight:500,color:th.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4,fontFamily:"'JetBrains Mono',monospace"}}>{t.debtVsSavingsSlot||"Debt vs Savings Trend"}</div><div style={{display:"flex",gap:14,marginBottom:8,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:th.muted,display:"flex",alignItems:"center",gap:5}}><span style={{width:10,height:10,borderRadius:2,background:"#EF4444"}}/>{t.totalDebt||"Debt"}</span>
          <span style={{fontSize:11,color:th.muted,display:"flex",alignItems:"center",gap:5}}><span style={{width:10,height:10,borderRadius:2,background:"#10B981"}}/>{t.savings||"Savings"}</span>
        </div></div>
        {data.length<2?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.needMoreSnapshots||"Need 2+ snapshots."}</div>:<SmoothAreaLine data={data} height={isMobile?180:210} debtColor="#EF4444" savingsColor="#10B981" templateId="smoothAreaLine.debtVsSavings" legendDebt="Debt" legendSav="Savings"/>}
      </>;
    }},
    cashFlowTrend:{id:"cashFlowTrend",label:"💰 "+(t.cashFlowTrendSlot||"Cash Flow Trend"),render:()=>{
      const labels=_shownLabels.length?_shownLabels:[];
      const data=labels.map(m=>{
        let income=0,bills=0,minDebt=0;
        active.forEach(c=>{const sn=(c.monthSnapshots||[]).find(x=>x.label===m);if(sn){income+=sn.income||0;bills+=sn.bills||0;minDebt+=(sn.data?.cards||[]).reduce((a,cd)=>a+(+cd.min||0),0);}});
        const parts=m.split(" ");
        return{label:parts[0]+(parts[1]?"’"+String(parts[1]).slice(-2):""),cashFlow:income-bills-minDebt,income};
      });
      const liveInc=active.reduce((s,c)=>s+sumN(c.incomeStreams||[]),0);
      const liveBls=active.reduce((s,c)=>s+sumB(c.bills||[]),0);
      const liveMin=active.reduce((s,c)=>s+sumMin(c.cards||[]),0);
      data.push({label:"▶ Now",cashFlow:liveInc-liveBls-liveMin,income:liveInc});
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>💰 {t.cashFlowTrendSlot||"Cash Flow Trend"}</div><div style={{display:"flex",gap:14,marginBottom:8,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:th.muted,display:"flex",alignItems:"center",gap:5}}><span style={{width:10,height:10,borderRadius:2,background:"#10B981"}}/>{t.cashFlow||"Cash Flow"}</span>
          <span style={{fontSize:11,color:th.muted,display:"flex",alignItems:"center",gap:5}}><span style={{width:10,height:10,borderRadius:2,background:GOLD}}/>{t.income||"Income"}</span>
        </div></div>
        {data.length<2?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.needMoreSnapshots||"Need 2+ snapshots."}</div>:<SmoothAreaLine data={data} height={isMobile?180:210} debtKey="cashFlow" savingsKey="income" debtColor="#10B981" savingsColor={GOLD} templateId="smoothAreaLine.cashFlowTrend" legendDebt="Cash Flow" legendSav="Income"/>}
      </>;
    }},
    debtRanked:{id:"debtRanked",label:"🏦 "+(t.debtRankedSlot||"Debts by Balance"),render:()=>{
      const debts=[];
      active.forEach(c=>{
        (c.cards||[]).forEach(cd=>{const bal=+cd.balance||0;if(bal>0)debts.push({label:`${cd.name||"Card"} · ${c.firstName}`,value:bal,color:"#EF4444"});});
        (c.loans||[]).forEach(ln=>{const bal=+ln.balance||0;if(bal>0)debts.push({label:`${ln.name||"Loan"} · ${c.firstName}`,value:bal,color:ln.type==="mortgage"?"#DC2626":ln.type==="vehicle"?"#F97316":"#3B82F6"});});
      });
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>🏦 {t.debtRankedSlot||"Debts by Balance"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.debtRankedSub||"Top debts across all active clients."}</div></div>
        {debts.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.noDebtYet||"No debt logged."}</div>:<RankedHBars data={debts} maxBars={10} width={460}/>}
      </>;
    }},
    practiceWaterfall:{id:"practiceWaterfall",label:"🌊 "+(t.practiceWaterfallSlot||"Practice Cash Flow Waterfall"),render:()=>{
      let inc=0,bls=0,mnd=0;
      active.forEach(c=>{inc+=sumN(c.incomeStreams||[]);bls+=sumB(c.bills||[]);mnd+=sumMin(c.cards||[]);});
      const free=inc-bls-mnd;
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>🌊 {t.practiceWaterfallSlot||"Practice Cash Flow Waterfall"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.practiceWaterfallSub||"Income → bills → debt → free, aggregated."}</div></div>
        {inc<=0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.noIncomeYet||"Add client income."}</div>:<Waterfall width={460} height={isMobile?180:220} segments={[
          {label:t.income||"Income",value:inc,color:"#10B981"},
          {label:t.bills||"Bills",value:-bls,color:"#EF4444"},
          {label:t.minPay||"Debt Min",value:-mnd,color:"#EF4444"},
          {label:t.cashFlow||"Free",value:Math.max(0,free),kind:"total"},
        ]}/>}
      </>;
    }},
    healthRadar:{id:"healthRadar",label:"🎯 "+(t.healthRadarSlot||"Practice Health (Radar)"),render:()=>{
      let inc=0,bls=0,mnd=0,liq=0,totL=0,totA=0;
      active.forEach(c=>{inc+=sumN(c.incomeStreams||[]);bls+=sumB(c.bills||[]);mnd+=sumMin(c.cards||[]);liq+=liquidA(c);totL+=totalL(c);totA+=totalA(c);});
      const dsr=inc>0?mnd/inc:0,sr=inc>0?Math.max(0,inc-bls-mnd)/inc:0,ef=bls>0?liq/bls:0,dta=totA>0?totL/totA:1,cf=inc>0?Math.max(0,inc-bls-mnd)/inc:0;
      const values=[Math.max(0,Math.min(1,1-dsr/0.5)),Math.max(0,Math.min(1,sr/0.25)),Math.max(0,Math.min(1,ef/6)),Math.max(0,Math.min(1,1-dta/0.8)),Math.max(0,Math.min(1,cf/0.1))];
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>🎯 {t.healthRadarSlot||"Practice Health (Radar)"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.healthRadarSub||"5-axis financial health, aggregated."}</div></div>
        {active.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.noClientsYet||"No clients yet."}</div>:<div style={{display:"flex",justifyContent:"center"}}><Radar5 size={isMobile?220:250} axes={["DSR","Save","EF","D/A","CF"]} values={values}/></div>}
      </>;
    }},
    netWorthForecast:{id:"netWorthForecast",label:"🔮 "+(t.netWorthForecastSlot||"Net Worth Forecast"),render:()=>{
      const labels=_shownLabels.length?_shownLabels:[];
      const history=labels.map(m=>{let nw=0;active.forEach(c=>{const sn=(c.monthSnapshots||[]).find(x=>x.label===m);if(sn?.data){const a=(sn.data.accounts||[]).reduce((s,x)=>s+(+x.value||0),0)+(sn.data.customAssets||[]).reduce((s,x)=>s+(+x.value||0),0);const l=(sn.data.cards||[]).reduce((s,x)=>s+(+x.balance||0),0)+(sn.data.loans||[]).reduce((s,x)=>s+(+x.balance||0),0);nw+=a-l;}});const parts=m.split(" ");return{label:parts[0]+(parts[1]?"’"+String(parts[1]).slice(-2):""),value:nw};});
      const liveNW=active.reduce((s,c)=>s+(totalA(c)-totalL(c)),0);
      history.push({label:"Now",value:liveNW});
      const growth=history.length>=2?(history[history.length-1].value-history[0].value)/Math.max(1,history.length-1):liveNW*0.02;
      const projection=[];
      for(let i=1;i<=5;i++){projection.push({label:`+${i}y`,value:liveNW+growth*12*i});}
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:10,fontWeight:500,color:th.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4,fontFamily:"'JetBrains Mono',monospace"}}>{t.netWorthForecastSlot||"Net Worth Forecast"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.netWorthForecastSub||"History + 5-year projection cone."}</div></div>
        {history.length<2?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.needMoreSnapshots||"Need 2+ snapshots."}</div>:<ForecastCone history={history} projection={projection} width={460} height={isMobile?200:230} confidence={0.22}/>}
      </>;
    }},
    assetSunburst:{id:"assetSunburst",label:"☀️ "+(t.assetSunburstSlot||"Asset Allocation (Sunburst)"),render:()=>{
      const cash={label:t.cashAssets||"Cash",color:"#06B6D4",children:[]};
      const invest={label:t.investmentsLbl||"Investments",color:"#8B5CF6",children:[]};
      const property={label:t.propertyLbl||"Property",color:"#10B981",children:[]};
      const liqMap={},invMap={},propMap={};
      active.forEach(c=>{
        (c.accounts||[]).forEach(a=>{const meta=ACCT_META[a.type];const v=+a.value||0;if(v<=0)return;const name=ACCT_META[a.type]?.label||a.type||"Other";if(meta?.liquid){liqMap[name]=(liqMap[name]||0)+v;}else if(meta?.invest){invMap[name]=(invMap[name]||0)+v;}else{propMap[name]=(propMap[name]||0)+v;}});
        (c.customAssets||[]).forEach(a=>{const v=+a.value||0;if(v<=0)return;const name=a.name||"Other";propMap[name]=(propMap[name]||0)+v;});
      });
      Object.entries(liqMap).forEach(([k,v],i)=>cash.children.push({label:k,value:v,color:["#3B82F6","#06B6D4","#0EA5E9","#22D3EE"][i%4]}));
      Object.entries(invMap).forEach(([k,v],i)=>invest.children.push({label:k,value:v,color:["#8B5CF6","#A78BFA","#7C3AED","#6366F1"][i%4]}));
      Object.entries(propMap).forEach(([k,v],i)=>property.children.push({label:k,value:v,color:["#10B981","#059669","#16A34A","#15803D"][i%4]}));
      const data=[cash,invest,property].filter(g=>g.children.length>0);
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>☀️ {t.assetSunburstSlot||"Asset Allocation (Sunburst)"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.assetSunburstSub||"Cash / investments / property, nested."}</div></div>
        {data.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.noAssetsYet||"No assets logged."}</div>:<div style={{display:"flex",justifyContent:"center"}}><Sunburst data={data} size={isMobile?220:250}/></div>}
      </>;
    }},
    clientsDumbbell:{id:"clientsDumbbell",label:"⚖️ "+(t.clientsDumbbellSlot||"Client Net Worth Δ"),render:()=>{
      const labels=_shownLabels;
      const firstLbl=labels[0],lastLbl=labels[labels.length-1];
      const data=active.map(c=>{
        const first=firstLbl?(c.monthSnapshots||[]).find(x=>x.label===firstLbl):null;
        const last=lastLbl?(c.monthSnapshots||[]).find(x=>x.label===lastLbl):null;
        const aOf=sn=>sn?.data?((sn.data.accounts||[]).reduce((s,x)=>s+(+x.value||0),0)+(sn.data.customAssets||[]).reduce((s,x)=>s+(+x.value||0),0)):0;
        const lOf=sn=>sn?.data?((sn.data.cards||[]).reduce((s,x)=>s+(+x.balance||0),0)+(sn.data.loans||[]).reduce((s,x)=>s+(+x.balance||0),0)):0;
        const was=first?aOf(first)-lOf(first):0;
        const now=last?aOf(last)-lOf(last):(totalA(c)-totalL(c));
        return{label:c.firstName+" "+(c.lastName?c.lastName[0]+".":""),a:was,b:now};
      }).filter(d=>d.a||d.b);
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>⚖️ {t.clientsDumbbellSlot||"Client Net Worth Δ"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.clientsDumbbellSub||"Where each client was vs where they are now."}</div></div>
        {data.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.needMoreSnapshots||"Need snapshots."}</div>:<Dumbbell data={data} leftLabel={firstLbl||"Prior"} rightLabel="Now" width={460} maxRows={8}/>}
      </>;
    }},
    netWorthSlope:{id:"netWorthSlope",label:"📐 "+(t.netWorthSlopeSlot||"Net Worth Prior vs Current"),render:()=>{
      const labels=_shownLabels;
      const firstLbl=labels[0],lastLbl=labels[labels.length-1];
      const data=active.map((c,i)=>{
        const first=firstLbl?(c.monthSnapshots||[]).find(x=>x.label===firstLbl):null;
        const last=lastLbl?(c.monthSnapshots||[]).find(x=>x.label===lastLbl):null;
        const aOf=sn=>sn?.data?((sn.data.accounts||[]).reduce((s,x)=>s+(+x.value||0),0)+(sn.data.customAssets||[]).reduce((s,x)=>s+(+x.value||0),0)):0;
        const lOf=sn=>sn?.data?((sn.data.cards||[]).reduce((s,x)=>s+(+x.balance||0),0)+(sn.data.loans||[]).reduce((s,x)=>s+(+x.balance||0),0)):0;
        const a=first?aOf(first)-lOf(first):0;
        const b=last?aOf(last)-lOf(last):(totalA(c)-totalL(c));
        return{label:c.firstName+" "+(c.lastName?c.lastName[0]+".":""),a,b,color:b>=a?"#10B981":"#EF4444"};
      });
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>📐 {t.netWorthSlopeSlot||"Net Worth Prior vs Current"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.netWorthSlopeSub||"Tufte slope chart per client."}</div></div>
        {data.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.noClientsYet||"No clients."}</div>:<SlopeGraph data={data} leftLabel={firstLbl?firstLbl.split(" ")[0]:"Prior"} rightLabel="Now" height={isMobile?200:230} width={460}/>}
      </>;
    }},
    billsStacked:{id:"billsStacked",label:"💳 "+(t.billsStackedSlot||"Bills by Category"),render:()=>{
      const labels=_shownLabels.length?_shownLabels:[];
      const categories=["housing","transport","insurance","food","other"];
      const data=labels.map(m=>{
        const row={label:m.split(" ")[0],housing:0,transport:0,insurance:0,food:0,other:0};
        active.forEach(c=>{const sn=(c.monthSnapshots||[]).find(x=>x.label===m);if(sn?.data){(sn.data.bills||[]).forEach(b=>{const cat=(b.category||"other").toLowerCase();const v=toM(+b.cost||0,b.freq);if(row[cat]!==undefined)row[cat]+=v;else row.other+=v;});}});
        return row;
      });
      const colors={housing:"#3B82F6",transport:"#F97316",insurance:"#8B5CF6",food:"#F59E0B",other:"#94A3B8"};
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>💳 {t.billsStackedSlot||"Bills by Category"}</div><div style={{display:"flex",gap:10,marginBottom:8,flexWrap:"wrap"}}>{categories.map(c=><span key={c} style={{fontSize:10,color:th.muted,display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:colors[c]}}/>{c}</span>)}</div></div>
        {data.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.needMoreSnapshots||"Need snapshots."}</div>:<StackedBars data={data} categories={categories} colors={colors} width={460} height={isMobile?180:210}/>}
      </>;
    }},
    billsYoY:{id:"billsYoY",label:"📅 "+(t.billsYoYSlot||"Bills YoY"),render:()=>{
      const labels=_shownLabels;
      const thisYrLabel=labels[labels.length-1]?.split(" ")[1];
      const buckets={};
      active.forEach(c=>{
        (c.monthSnapshots||[]).forEach(sn=>{
          const parts=(sn.label||"").split(" ");
          const yr=parts[1];if(!yr)return;
          (sn.data?.bills||[]).forEach(b=>{const cat=(b.category||"Other").charAt(0).toUpperCase()+(b.category||"Other").slice(1);buckets[cat]=buckets[cat]||{current:0,prior:0};const v=toM(+b.cost||0,b.freq);if(yr===thisYrLabel)buckets[cat].current+=v;else buckets[cat].prior+=v;});
        });
      });
      const data=Object.entries(buckets).map(([label,v])=>({label,current:v.current,prior:v.prior})).filter(d=>d.current||d.prior).slice(0,6);
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>📅 {t.billsYoYSlot||"Bills YoY"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.billsYoYSub||"Current year vs prior year by category."}</div></div>
        {data.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.needMoreSnapshots||"Need multi-year snapshots."}</div>:<GroupedYoY data={data} curLabel={thisYrLabel||"This Yr"} priorLabel={"Prior"} width={460} height={isMobile?180:210}/>}
      </>;
    }},
    spendingHeatmap:{id:"spendingHeatmap",label:"🔥 "+(t.spendingHeatmapSlot||"Spending Heatmap"),render:()=>{
      const cells=[];
      active.forEach(c=>{
        (c.monthSnapshots||[]).forEach(sn=>{const parts=(sn.label||"").split(" ");const monthName=parts[0];const yr=parts[1];const monthIdx=MS.indexOf(monthName)+1;if(monthIdx<=0||!yr)return;const v=(sn.bills||0)+((sn.data?.cards||[]).reduce((a,c)=>a+(+c.min||0),0));const exist=cells.find(x=>x.year===+yr&&x.month===monthIdx);if(exist)exist.value+=v;else cells.push({year:+yr,month:monthIdx,value:v});});
      });
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>🔥 {t.spendingHeatmapSlot||"Spending Heatmap"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.spendingHeatmapSub||"Year × month intensity. Cream → amber."}</div></div>
        {cells.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.needMoreSnapshots||"Need snapshots."}</div>:<HeatmapCalendar data={cells} width={460} height={isMobile?150:180}/>}
      </>;
    }},
    payoffProgression:{id:"payoffProgression",label:"📉 "+(t.payoffProgressionSlot||"Debt Payoff Timeline"),render:()=>{
      const debts=[];
      active.forEach(c=>{
        (c.cards||[]).forEach(cd=>{const bal=+cd.balance||0;if(bal>0)debts.push({name:`${cd.name||"Card"} · ${c.firstName}`,balance:bal,apr:+cd.apr||22,min:+cd.min||Math.max(25,bal*0.025),color:"#EF4444"});});
        (c.loans||[]).forEach(ln=>{const bal=+ln.balance||0;if(bal>0&&ln.type!=="mortgage")debts.push({name:`${ln.name||"Loan"} · ${c.firstName}`,balance:bal,apr:+ln.apr||7,min:+ln.payment||Math.max(50,bal*0.015),color:ln.type==="vehicle"?"#F97316":"#3B82F6"});});
      });
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>📉 {t.payoffProgressionSlot||"Debt Payoff Timeline"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.payoffProgressionSub||"Avalanche projection, excludes mortgages."}</div></div>
        {debts.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.noDebtYet||"No debt logged."}</div>:<PayoffProgression debts={debts} width={460} height={isMobile?180:210} maxMonths={120}/>}
      </>;
    }},
    kpiSparklines:{id:"kpiSparklines",label:"✨ "+(t.kpiSparklinesSlot||"KPI Sparklines"),render:()=>{
      const labels=_shownLabels;
      const nwSeries=labels.map(m=>{let v=0;active.forEach(c=>{const sn=(c.monthSnapshots||[]).find(x=>x.label===m);if(sn?.data){const a=(sn.data.accounts||[]).reduce((s,x)=>s+(+x.value||0),0)+(sn.data.customAssets||[]).reduce((s,x)=>s+(+x.value||0),0);const l=(sn.data.cards||[]).reduce((s,x)=>s+(+x.balance||0),0)+(sn.data.loans||[]).reduce((s,x)=>s+(+x.balance||0),0);v+=a-l;}});return v;});
      const debtSeries=trend.map(p=>p.debt);
      const savSeries=trend.map(p=>p.savings);
      const cfSeries=labels.map(m=>{let v=0;active.forEach(c=>{const sn=(c.monthSnapshots||[]).find(x=>x.label===m);if(sn){v+=(sn.income||0)-(sn.bills||0)-((sn.data?.cards||[]).reduce((a,cd)=>a+(+cd.min||0),0));}});return v;});
      const liveNW=active.reduce((s,c)=>s+(totalA(c)-totalL(c)),0);
      const liveDebt=active.reduce((s,c)=>s+c.cards.reduce((a,cd)=>a+(+cd.balance||0),0),0);
      const liveSav=active.reduce((s,c)=>s+liquidA(c),0);
      const liveCF=active.reduce((s,c)=>s+(sumN(c.incomeStreams||[])-sumB(c.bills||[])-sumMin(c.cards||[])),0);
      const rows=[
        {l:t.netWorth||"Net worth",d:[...nwSeries,liveNW],c:liveNW>=0?"#10B981":"#EF4444",v:fmtS(liveNW)},
        {l:t.totalDebt||"Debt",d:[...debtSeries,liveDebt],c:"#EF4444",v:fmtS(liveDebt)},
        {l:t.savings||"Savings",d:[...savSeries,liveSav],c:"#10B981",v:fmtS(liveSav)},
        {l:t.cashFlow||"Cash flow",d:[...cfSeries,liveCF],c:GOLD,v:fmtS(liveCF)},
      ];
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>✨ {t.kpiSparklinesSlot||"KPI Sparklines"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.kpiSparklinesSub||"At-a-glance trend per KPI."}</div></div>
        {/* v0.58.1 — KPI Sparklines bug from Mauricio: sparkline curve + area fill
           collided with the value text on the right ($237K, $12K, etc.) and bled
           past the card's right padding. v0.56 set the row gap to 4px; the
           sparkline's area-fill gradient + 1.5px stroke + last data point all
           landed under the value glyphs. Fix: row gap 4→14, sparkline wrapper
           gains paddingRight:12 so the curve ends well before the value column,
           value column minWidth 54→68 for breathing room. Stroke 1.5→1.25 per
           charts MASTER.md spec (thin lines). */}
        <div style={{display:"flex",flexDirection:"column",gap:10,padding:"4px 6px 0",flex:1,justifyContent:"center"}}>
          {rows.map((r,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:14,fontSize:12,minHeight:52}}>
            <span style={{color:th.muted,flex:"0 0 88px",fontWeight:600}}>{r.l}</span>
            <div style={{flex:1,minWidth:0,display:"flex",alignItems:"center",paddingRight:12}}>
              <div style={{flex:1,minWidth:0}}><Sparkline data={r.d} color={r.c} width={500} height={44} strokeWidth={1.25} fill={false}/></div>
            </div>
            <span style={{color:r.c,fontFamily:"'JetBrains Mono',monospace",fontVariantNumeric:"tabular-nums",fontWeight:700,minWidth:68,textAlign:"right"}}>{r.v}</span>
          </div>)}
        </div>
      </>;
    }},
  };
  const dashOpts=dashChartOptions(t);
  const rawSlots=settings.dashboardSlots||["incomeVsSpending","sankey","netWorthDonut"];
  const slots=rawSlots.slice(0,3);
  while(slots.length<3)slots.push(["incomeVsSpending","sankey","netWorthDonut"][slots.length]);
  const setSlot=(i,id)=>{const s=[...slots];s[i]=id;setSettings({...settings,dashboardSlots:s});};
  return<div data-ga-grid="three-col" style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(0,4fr) minmax(0,4fr) minmax(0,3fr)",gap:12,marginBottom:14}}>
    {slots.map((slotId,i)=>{
      const ch=dashCharts[slotId]||dashCharts.incomeVsSpending;
      return<div key={i} className="ga-lift" style={{...mCARD(th),padding:isMobile?14:16,display:"flex",flexDirection:"column",position:"relative"}}>
        <DashSlotPicker currentId={slotId} options={dashOpts} onPick={id=>setSlot(i,id)} th={th} t={t}/>
        {ch.render()}
      </div>;
    })}
  </div>;
})()}<RemindersPanel clients={clients} settings={settings} t={t} onSettingsChange={setSettings}/><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:24,marginBottom:12,gap:8,flexWrap:"wrap"}}><div style={{fontSize:10,fontWeight:500,color:th.dim,letterSpacing:"0.13em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>{active.length} {active.length!==1?(t.clients||"Clients"):(t.client||"Client")}</div><input placeholder={t.searchClients||"Search clients..."} aria-label={t?.searchClientsPh||"Search clients"} value={dashSearch} onChange={e=>setDashSearch(e.target.value)} style={{...mINP(th),width:isMobile?"100%":240,maxWidth:isMobile?"none":240,padding:"6px 12px",fontSize:12,boxSizing:"border-box"}}/></div><div style={{display:"flex",flexDirection:"column",gap:8}}>{active.map(c=>{const n=sumN(c.incomeStreams);const tA=totalA(c);const tL=totalL(c);const sn=c.monthSnapshots||[];const im=sn.length>=2&&sn[sn.length-1].debt<sn[0].debt;return<div key={c.id} className="ga-lift" onClick={()=>onSelect(c)} style={{...mCARD(th),padding:isMobile?"12px 14px":"14px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:isMobile?10:16,flexWrap:isMobile?"wrap":"nowrap"}}><div style={{width:isMobile?38:44,height:isMobile?38:44,borderRadius:isMobile?10:11,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,fontSize:isMobile?12:14,fontFamily:"'JetBrains Mono',monospace",background:c.color1+"22",color:c.color1,border:`1px solid ${c.color1}44`,flexShrink:0}}>{c.firstName[0]}{c.lastName[0]}</div><div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2,flexWrap:"wrap"}}><span style={{fontSize:isMobile?13:14,fontWeight:700,color:th.text}}>{c.firstName} {c.lastName}</span>{c.partnerFirst&&<span style={{fontSize:12,color:th.dim}}>& {c.partnerFirst}</span>}{im&&<Pill color={th.pos}>{t.improving}</Pill>}{!isMobile&&<span style={{fontSize:10,color:th.dim}}>{(c.monthSnapshots||[]).length} snapshots</span>}</div><div style={{fontSize:11,color:th.dim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.email}</div></div>{!isMobile&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20,textAlign:"right"}}><div><div style={{fontSize:10,color:th.dim,marginBottom:2}}>{t.netMo||"Net/mo"}</div><div style={{fontSize:13,fontWeight:700,color:th.pos}}>{hideNumbers?<span style={{filter:"blur(5px)",userSelect:"none"}}>●●●</span>:fmt(n)}</div></div><div><div style={{fontSize:10,color:th.dim,marginBottom:2}}>{t.debt||"Debt"}</div><div style={{fontSize:13,fontWeight:700,color:th.neg}}>{hideNumbers?<span style={{filter:"blur(5px)",userSelect:"none"}}>●●●</span>:fmt(tL)}</div></div><div><div style={{fontSize:10,color:th.dim,marginBottom:2}}>{t.netWorth||"Net Worth"}</div><div style={{fontSize:13,fontWeight:700,color:tA-tL>=0?GOLD:th.neg}}>{hideNumbers?<span style={{filter:"blur(5px)",userSelect:"none"}}>●●●</span>:fmt(tA-tL)}</div></div></div>}{isMobile&&<div style={{flexBasis:"100%",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:8,paddingTop:8,borderTop:`1px solid ${th.cardBorder}`}}><div><div style={{fontSize:9,color:th.dim,marginBottom:1}}>{t.netMo||"Net/mo"}</div><div style={{fontSize:12,fontWeight:700,color:th.pos}}>{hideNumbers?<span style={{filter:"blur(5px)",userSelect:"none"}}>●●●</span>:fmt(n)}</div></div><div><div style={{fontSize:9,color:th.dim,marginBottom:1}}>{t.debt||"Debt"}</div><div style={{fontSize:12,fontWeight:700,color:th.neg}}>{hideNumbers?<span style={{filter:"blur(5px)",userSelect:"none"}}>●●●</span>:fmt(tL)}</div></div><div><div style={{fontSize:9,color:th.dim,marginBottom:1}}>{t.netWorth||"Net Worth"}</div><div style={{fontSize:12,fontWeight:700,color:tA-tL>=0?GOLD:th.neg}}>{hideNumbers?<span style={{filter:"blur(5px)",userSelect:"none"}}>●●●</span>:fmt(tA-tL)}</div></div></div>}{!isMobile&&<span style={{color:th.accent,fontSize:18}}>›</span>}</div>;})} </div></div>;}

/* ── PAGES ───────────────────────────────────────────────────────────────── */
/* ── CLIENT LIST ─ v0.8.0 action-first bulk actions (WORKPLAN §3 Chat 4) ── */

