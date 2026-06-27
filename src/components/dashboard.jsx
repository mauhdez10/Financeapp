// Dashboard + reminders panel — extracted from App.jsx in Phase 2 of
// docs/ARCHITECTURE-PLAN.md (D-37). Verbatim from the single-file era.
import { useEffect, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip as ReTip, XAxis, YAxis } from "recharts";
import { useTh } from "../contexts/theme";
import { GOLD, mCARD, mINP } from "../styles/theme";
import { fmt, fmtD, fmtS, getAdvRem, getClientRem, isAlertDismissed } from "../utils/finance";
import { gaAdvisorReminders } from "../services/supabase";
import { ChartSettingsModal, DashSlotPicker } from "./chartEditors";
import { dashChartOptions } from "../constants/chartOptions";
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
  // v0.83.2 — advisor reminders from the server RPC (over summary + monthly tables, RLS-scoped).
  // Restores noContact + highDSR + debtRising for advisors whose `clients` are now blob-less summaries.
  // serverAdv=null means "not loaded / RPC failed / not advisor" → fall back to the client-side _advSum
  // (last_activity No-Contact only). Keyed/labelled to match the original getAdvRem reminders so old
  // dismissals still apply. (promoExpiring + the per-bill/card "Client Due" reminders need due-date
  // fields not present in the summary columns — still blob-only; tracked as a follow-up.)
  const[serverAdv,setServerAdv]=useState(null);
  const _hasSummaryRows=(clients||[]).some(c=>c._summary);
  const _ncDaysSetting=+settings.noContactDays||30;
  useEffect(()=>{
    if(!_hasSummaryRows){setServerAdv(null);return;}
    let dead=false;
    gaAdvisorReminders(_ncDaysSetting).then(rows=>{
      if(dead)return;
      if(!Array.isArray(rows)){setServerAdv(null);return;}
      const TASKS={noContact:"📞 No Contact",highDSR:"⚠️ High DSR",debtRising:"📈 Debt Rising"};
      setServerAdv(rows.map(r=>{const type=r.rem_type;const id=r.client_local_id;let detail;
        if(type==="noContact")detail="Last review "+(+r.val>=999?"never":Math.round(+r.val)+"d ago");
        else if(type==="highDSR")detail="DSR "+Math.round((+r.val||0)*100)+"%";
        else detail="+"+fmt(+r.val||0);
        return{type,clientId:id,clientName:(r.client_name||"").trim(),priority:r.priority||"med",task:TASKS[type]||type,detail,key:type+":"+id};
      }));
    }).catch(()=>{if(!dead)setServerAdv(null);});
    return()=>{dead=true;};
  },[_hasSummaryRows,_ncDaysSetting,clients]);
  // Cleanup expired dismissals on mount (no-op if list is clean).
  useEffect(()=>{const now=Date.now();const cleaned=dismissals.filter(d=>d&&d.key&&(!d.until||new Date(d.until).getTime()>now));if(cleaned.length!==dismissals.length)onSettingsChange({...settings,alertDismissals:cleaned});/* eslint-disable-next-line react-hooks/exhaustive-deps */},[]);
  const dismissAlert=(key,kind)=>{let until,toastMsg;if(kind==="due"){const d=new Date();until=new Date(d.getFullYear(),d.getMonth()+1,1).toISOString();toastMsg=t?.dismissedCycleToast||"Marked handled for this cycle — re-appears next month";}else if(kind==="forever"){until=null;toastMsg=t?.dismissedForeverToast||"Muted forever";}else if(kind==="snooze30"){until=new Date(Date.now()+30*86400000).toISOString();toastMsg=t?.dismissed30dToast||"Snoozed for 30 days";}else{until=new Date(Date.now()+7*86400000).toISOString();toastMsg=t?.dismissed7dToast||"Snoozed for 7 days";}const nextList=[...dismissals.filter(x=>x.key!==key),{key,until,dismissedAt:new Date().toISOString()}];onSettingsChange({...settings,alertDismissals:nextList});if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("ga-toast",{detail:{kind:"success",msg:toastMsg}}));};
  const restoreAlert=key=>{onSettingsChange({...settings,alertDismissals:dismissals.filter(x=>x.key!==key)});if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("ga-toast",{detail:{kind:"success",msg:t?.restoredAlertToast||"Alert restored"}}));};
  // v0.83 — advisor `clients` are now SUMMARY rows (no bills/cards/snapshots blobs). The reminder
  // derivers need full blobs; until they're reworked to a server source, skip summary rows so we
  // don't emit phantom "no contact 999d" alerts. Client-role rows are full blobs and pass through.
  // TODO scale: drive advisor reminders from a server RPC over the summary/monthly tables.
  const _remClients=(clients||[]).filter(c=>!c._summary);
  let adv=getAdvRem(_remClients,settings);
  // v0.83 — advisor clients are lightweight summaries (no blobs), so getAdvRem can't see them.
  // Restore the headline No-Contact reminder from the summary's last_activity (other advisor
  // reminders await a server RPC over the summary/monthly tables — see TODO above).
  const _ncDays=+settings.noContactDays||30;
  const _advSum=(clients||[]).filter(c=>c._summary&&!c.archived).map(c=>{
    const la=c.last_activity?new Date(c.last_activity):null;
    const d=la&&!isNaN(la.getTime())?Math.floor((Date.now()-la.getTime())/86400000):null;
    if(d==null||d<_ncDays)return null;
    return{key:"ncsum-"+c.id,type:"noContact",priority:d>=_ncDays*2?"high":"med",clientName:(c.firstName+" "+c.lastName).trim(),clientId:c.id,task:"No Contact",detail:String(d)+"d"};
  }).filter(Boolean);
  // v0.83.2 — prefer the server reminders (noContact + highDSR + debtRising); fall back to the
  // client-side last_activity No-Contact derivation only when the RPC hasn't loaded / errored.
  adv=[...adv,...(serverAdv!==null?serverAdv:_advSum)];
  // Filter by enabled types — we match by task keyword
  const typeKeyMap={"No Contact":"noContact","High DSR":"highDSR","Promo":"promoExpiring","Debt Rising":"debtRising","Bill Due":"billDue","Cash Flow":"lowCashFlow","Emergency":"lowEF","Snapshot":"missedSnap"};
  adv=adv.filter(a=>{const key=Object.entries(typeKeyMap).find(([k])=>a.task?.includes(k));return!key||alertTypes[key[1]]!==false;});
  const cRem=getClientRem(_remClients);
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


/* ── v0.46.0 — ChartSettingsModal: rebuilt as a temporary Chart Gallery.
   Renders every chart component the app supports with realistic sample data
   so we can audit which to keep / swap / retire. Dashboard slot picker
   preserved below the gallery for in-place swaps. */
// ── month_key "YYYY-MM" → existing "Mon’YY" label style (server aggregates)
const _mlabel=(mk)=>{const[y,m]=String(mk).split("-");const MON=["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return(MON[+m]||"")+"’"+String(y).slice(-2);};
// ── apply the trendRange window to a trend array (last n rows)
const _win=(rows,range)=>{const n=range==="3"?3:range==="6"?6:range==="12"?12:rows.length;return rows.slice(-n);};

export function Dashboard({clients,dashData,t,settings,setSettings,onSelect,onAdd,onImportNew,onArchive,onRestore,onDelete,onRestoreBackup,loadAllBlobs,onToggleHide,hideNumbers}){const th=useTh();const{isMobile}=useViewport();const[importOpen,setImportOpen]=useState(false);const[restoreOpen,setRestoreOpen]=useState(false);const[exportOpen,setExportOpen]=useState(false);const[rosterShown,setRosterShown]=useState(60);/* v0.82.2 — windowed roster: cap DOM nodes at high client counts */
  // v0.81 — dashboard charts now render from server-side aggregates (dashData),
  // not the in-memory clients array (scales to ~50k clients). `clients` kept ONLY
  // for the Import/Export/Backup modals + the bottom client roster list.
  const S=dashData?.summary||{};const TR=dashData?.trend||[];
  const td=S.total_debt||0;const ti=S.total_income||0;const fO=S.finance_only||0;const fH=S.finance_health||0;const liqNow=S.liquid||0;const clientCount=S.client_count||0;
  // `active` still backs the bottom client roster list (per-client rows). Charts no longer read it.
  const active=clients.filter(c=>!c.archived);
  const[trendMode,setTrendMode]=useState("revolving");// "all" | "revolving" | "current"
  const[trendRange,setTrendRange]=useState("12");// "3" | "6" | "12" | "all"
  // Debt-for-mode now reads a server trend ROW: revolving=l_cards, all=+l_loans_all, current=+l_loans_current
  const getDebtForMode=row=>{if(!row)return 0;const cards=+row.l_cards||0;if(trendMode==="all")return cards+(+row.l_loans_all||0);if(trendMode==="current")return cards+(+row.l_loans_current||0);return cards;};
  const _w=_win(TR,trendRange);
  const _shownLabels=_w.map(r=>r.month_key);
  const trend=_w.map(r=>({m:_mlabel(r.month_key),debt:getDebtForMode(r),savings:+r.savings||0}));return<div style={{padding:isMobile?14:24}}>{importOpen&&<ImportWizard onClose={()=>setImportOpen(false)} onImport={cs=>{onImportNew(cs);setImportOpen(false);}} existingClients={clients} t={t}/>}{restoreOpen&&<BackupImportModal onImport={onRestoreBackup} onClose={()=>setRestoreOpen(false)} existingClients={clients} t={t}/>}{exportOpen&&<ExportModal clients={clients} loadAllBlobs={loadAllBlobs} onClose={()=>setExportOpen(false)} t={t}/>}{/* v0.16.0 Phase 8 — 4 wide KPI cards matching Claude design */}
{/* v0.56 — KpiTile with inline sparkline per Mauricio's image 3.
   Each tile builds its own series from the practice-wide trend data. */}
{(()=>{
  // Series per metric, oldest→newest, with current live value appended — from server trend.
  const clientSeries=(()=>{const out=_w.map(r=>+r.client_count||0);out.push(clientCount);return out.length<2?[clientCount,clientCount]:out;})();
  const incomeSeries=(()=>{const out=_w.map(r=>+r.income||0);out.push(ti);return out.length<2?[ti,ti]:out;})();
  const debtSeries=_w.map(r=>+r.debt||0).concat([td]);
  const liqSeries=_w.map(r=>+r.savings||0).concat([liqNow]);
  // Delta = current vs previous period (last vs second-to-last).
  const dlt=arr=>{const n=arr.length;if(n<2)return null;const cur=arr[n-1],prev=arr[n-2];const ch=cur-prev;if(ch===0)return null;return{up:ch>0,down:ch<0,value:(ch>0?"+":"")+fmtS(Math.abs(ch))};};
  return<div data-ga-grid="kpi-4" style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:12,marginBottom:isMobile?14:20}}>
    <KpiTile label={t?.kpiClients||"Clients"} value={clientCount} color={th.accent} spark={clientSeries} delta={dlt(clientSeries)} sub={t.thisMonth||"this month"}/>
    <KpiTile label={t.combinedNetMo||"Combined Net / mo"} value={hideNumbers?"●●●":fmtS(ti)} color={th.pos} spark={incomeSeries} delta={dlt(incomeSeries)} sub={t.vsLastMo||"vs last mo"}/>
    <KpiTile label={t.combinedDebt||"Combined Debt"} value={hideNumbers?"●●●":fmtS(td)} color={th.neg} spark={debtSeries} delta={(()=>{const d=dlt(debtSeries);if(!d)return null;return{...d,up:debtSeries[debtSeries.length-1]<debtSeries[debtSeries.length-2],down:debtSeries[debtSeries.length-1]>debtSeries[debtSeries.length-2]};})()}/>
    <KpiTile label={t.liquidAssetsLbl||"Liquid Assets"} value={hideNumbers?"●●●":fmtS(liqNow)} color={GOLD} spark={liqSeries} delta={dlt(liqSeries)} sub={t.checkingSavingsLbl||"checking + savings"}/>
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
        <ComposedChart data={_w.map(r=>({m:_mlabel(r.month_key),income:+r.income||0,spending:+r.spending||0,net:(+r.income||0)-(+r.spending||0)}))} margin={{top:12,right:12,left:0,bottom:0}}>
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
      const totalI=S.total_income||0,totalB=S.total_bills||0,totalM=S.total_min||0;
      const cashFlow=Math.max(0,totalI-totalB-totalM);
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>🌊 {t.cashFlowMapHdr||"Cash Flow Map"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.cashFlowMapSub||"Where the practice's aggregate income flows."}</div></div>
        {totalI<=0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center",padding:20,minHeight:isMobile?180:200}}>{t.noFlowYet||"Add client income to see flow."}</div>:<Sankey width={460} height={isMobile?220:260} nodes={[{id:"inc",label:""+(t.income||"Income"),layer:0,color:th.pos},{id:"bills",label:""+(t.bills||"Bills"),layer:1,color:th.neg},{id:"min",label:"🏦 "+(t.minPay||"Debt Min"),layer:1,color:th.warn},{id:"cash",label:"💰 "+(t.cashFlow||"Cash Flow"),layer:1,color:GOLD}]} links={[{from:"inc",to:"bills",value:totalB,color:th.neg},{from:"inc",to:"min",value:totalM,color:th.warn},{from:"inc",to:"cash",value:cashFlow,color:GOLD}]}/>}
      </>;
    }},
    netWorthDonut:{id:"netWorthDonut",label:"💎 "+(t.netWorthDistributionHdr||"Net Worth Distribution"),render:()=>{
      const tiers={neg:S.nw_neg||0,low:S.nw_low||0,mid:S.nw_mid||0,high:S.nw_high||0};const totalNW=S.total_nw||0;
      const donutData=[{name:t.tierNeg||"Negative",value:tiers.neg,color:th.neg},{name:t.tierLow||"$0–50K",value:tiers.low,color:th.warn},{name:t.tierMid||"$50K–250K",value:tiers.mid,color:th.blue},{name:t.tierHigh||"$250K+",value:tiers.high,color:GOLD}].filter(d=>d.value>0);
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>💎 {t.netWorthDistributionHdr||"Net Worth Distribution"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.netWorthDistributionSub||"Active clients grouped by current net worth tier."}</div></div>
        <div style={{display:"flex",alignItems:"center",gap:14,flex:1,minHeight:isMobile?180:200}}>
          <Donut data={donutData} size={isMobile?120:130} innerRatio={isMobile?(40/60):(46/65)} paddingAngle={donutData.length>1?2:0} centerLabel={t.totalNet||"Total Net"} centerValue={fmtS(totalNW)} centerColor={totalNW>=0?GOLD:th.neg} placeholder={t.noClientsYetDonut||"No clients yet"}/>
          <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:8}}>
            {donutData.length===0?<div style={{fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.addClientsToPopulate||"Add clients to populate."}</div>:donutData.map(d=><div key={d.name} style={{display:"flex",alignItems:"center",gap:8,fontSize:11}}><span style={{width:10,height:10,borderRadius:2,background:d.color,flexShrink:0}}/><span style={{color:th.muted,flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{d.name}</span><span style={{color:d.color,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{d.value}</span></div>)}
          </div>
        </div>
      </>;
    }},
    clientsTreemap:{id:"clientsTreemap",label:"🗺️ "+(t.clientsByNetWorthHdr||"Clients by Net Worth"),render:()=>{
      const tmData=(dashData?.deltas||[]).map(d=>{const nw=+d.nw_now||0;return{label:d.first_name+" "+(d.last_name?d.last_name[0]+".":""),value:Math.max(0,nw),color:nw>=250000?GOLD:nw>=50000?th.blue:nw>=0?th.warn:th.neg};}).filter(d=>d.value>0);
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>🗺️ {t.clientsByNetWorthHdr||"Clients by Net Worth"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.clientsByNetWorthSub||"Tile size = current net worth per client."}</div></div>
        <Treemap data={tmData} width={460} height={isMobile?220:240} placeholder={t.noClientsYet||"No clients yet."}/>
      </>;
    }},
    // v0.54 (PR 5) — RankedHBars variant per preview/27-dashboard-row.html spec.
    // Top 8 by net worth, gold on highest then blue/orange/grey shading.
    clientsRanked:{id:"clientsRanked",label:"🏆 "+(t.clientsRankedSlot||"Clients · Ranked H-Bars"),render:()=>{
      const palette=[GOLD,"#5B9BD5","#4472C4","#ED7D31","#EDD594","#755023","#374151","#475569"];
      const rhData=(dashData?.deltas||[]).map(d=>({label:d.first_name+" "+(d.last_name?d.last_name[0]+".":""),value:Math.max(0,+d.nw_now||0)})).filter(d=>d.value>0).slice(0,8).map((d,i)=>({...d,color:palette[i]}));
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>🏆 {t.clientsRankedSlot||"Clients · Ranked H-Bars"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.clientsRankedSub||"Top 8 active clients by net worth."}</div></div>
        {rhData.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.noClientsYet||"No clients yet."}</div>:<RankedHBars data={rhData} maxBars={8} width={460}/>}
      </>;
    }},
    practiceHealth:{id:"practiceHealth",label:"🎯 "+(t.practiceHealthHdr||"Practice Health"),render:()=>{
      const inc=S.total_income||0,bls=S.total_bills||0,mnd=S.total_min||0,liq=S.liquid||0;
      const dsr=inc>0?mnd/inc:0;
      const sr=inc>0?Math.max(0,inc-bls-mnd)/inc:0;
      const ef=bls>0?liq/bls:0;
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>🎯 {t.practiceHealthHdr||"Practice Health"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.practiceHealthSub||"Aggregate across all active clients."}</div></div>
        {clientCount===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center"}}>{t.noClientsYet||"No clients yet."}</div>:<div style={{display:"flex",alignItems:"center",justifyContent:"space-around",flex:1,flexWrap:"wrap",gap:8,minHeight:isMobile?180:220}}>
          <RadialGauge value={dsr*100} max={60} target={36} size={104} label={"DSR"} subLabel={"≤ 36%"} direction="lower" thresholds={[0.6,0.83]} fmt={v=>v.toFixed(0)+"%"}/>
          <RadialGauge value={sr*100} max={40} target={20} size={104} label={t.savingsRateLbl||"Savings"} subLabel={"≥ 20%"} direction="higher" thresholds={[0.5,0.25]} fmt={v=>v.toFixed(0)+"%"}/>
          <RadialGauge value={ef} max={12} target={3} size={104} label={t.efMonthsLbl||"EF Mo"} subLabel={"3-6"} direction="higher" thresholds={[0.25,0.125]} fmt={v=>v.toFixed(1)}/>
        </div>}
      </>;
    }},
    netWorthBridge:{id:"netWorthBridge",label:"⚖️ "+(t.netWorthBridgeHdr||"Net Worth Bridge"),render:()=>{
      const data=_w.map(r=>({label:r.month_key,assets:{liquid:+r.a_liquid||0,invest:+r.a_invest||0,property:+r.a_property||0,other:+r.a_other||0},liabilities:{cards:+r.l_cards||0,loans:+r.l_loans_all||0}}));
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>⚖️ {t.netWorthBridgeHdr||"Net Worth Bridge"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.netWorthBridgeSub||"Assets above zero, liabilities below."}</div></div>
        {data.length<2?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center"}}>{t.needMoreSnapshots||"Need 2+ monthly snapshots."}</div>:<NetWorthBridge data={data} width={460} height={isMobile?200:240}/>}
      </>;
    }},
    // v0.47.0 — expanded slot options ↓
    debtVsSavingsTrend:{id:"debtVsSavingsTrend",label:"📈 "+(t.debtVsSavingsSlot||"Debt vs Savings Trend"),render:()=>{
      const data=_w.map(r=>({label:_mlabel(r.month_key),debt:+r.l_cards||0,savings:+r.savings||0}));
      // CAVEAT: summary has no revolving-only live total; use td (total debt). See report.
      const live={label:"▶ Now",debt:Math.round(td),savings:Math.round(liqNow)};
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
      const data=_w.map(r=>({label:_mlabel(r.month_key),cashFlow:(+r.income||0)-(+r.spending||0),income:+r.income||0}));
      data.push({label:"▶ Now",cashFlow:(S.total_income||0)-(S.total_bills||0)-(S.total_min||0),income:S.total_income||0});
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>💰 {t.cashFlowTrendSlot||"Cash Flow Trend"}</div><div style={{display:"flex",gap:14,marginBottom:8,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:th.muted,display:"flex",alignItems:"center",gap:5}}><span style={{width:10,height:10,borderRadius:2,background:"#10B981"}}/>{t.cashFlow||"Cash Flow"}</span>
          <span style={{fontSize:11,color:th.muted,display:"flex",alignItems:"center",gap:5}}><span style={{width:10,height:10,borderRadius:2,background:GOLD}}/>{t.income||"Income"}</span>
        </div></div>
        {data.length<2?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.needMoreSnapshots||"Need 2+ snapshots."}</div>:<SmoothAreaLine data={data} height={isMobile?180:210} debtKey="cashFlow" savingsKey="income" debtColor="#10B981" savingsColor={GOLD} templateId="smoothAreaLine.cashFlowTrend" legendDebt="Cash Flow" legendSav="Income"/>}
      </>;
    }},
    debtRanked:{id:"debtRanked",label:"🏦 "+(t.debtRankedSlot||"Debts by Balance"),render:()=>{
      const debts=(dashData?.debts||[]).map(d=>({label:`${d.name} · ${d.first}`,value:+d.bal||0,color:d.kind==="card"?"#EF4444":(d.ltype==="mortgage"?"#DC2626":d.ltype==="vehicle"?"#F97316":"#3B82F6")})).filter(d=>d.value>0);
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>🏦 {t.debtRankedSlot||"Debts by Balance"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.debtRankedSub||"Top debts across all active clients."}</div></div>
        {debts.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.noDebtYet||"No debt logged."}</div>:<RankedHBars data={debts} maxBars={10} width={460}/>}
      </>;
    }},
    practiceWaterfall:{id:"practiceWaterfall",label:"🌊 "+(t.practiceWaterfallSlot||"Practice Cash Flow Waterfall"),render:()=>{
      const inc=S.total_income||0,bls=S.total_bills||0,mnd=S.total_min||0;
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
      const inc=S.total_income||0,bls=S.total_bills||0,mnd=S.total_min||0,liq=S.liquid||0,totL=S.total_debt||0,totA=(S.total_nw||0)+(S.total_debt||0);
      const dsr=inc>0?mnd/inc:0,sr=inc>0?Math.max(0,inc-bls-mnd)/inc:0,ef=bls>0?liq/bls:0,dta=totA>0?totL/totA:1,cf=inc>0?Math.max(0,inc-bls-mnd)/inc:0;
      const values=[Math.max(0,Math.min(1,1-dsr/0.5)),Math.max(0,Math.min(1,sr/0.25)),Math.max(0,Math.min(1,ef/6)),Math.max(0,Math.min(1,1-dta/0.8)),Math.max(0,Math.min(1,cf/0.1))];
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>🎯 {t.healthRadarSlot||"Practice Health (Radar)"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.healthRadarSub||"5-axis financial health, aggregated."}</div></div>
        {clientCount===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.noClientsYet||"No clients yet."}</div>:<div style={{display:"flex",justifyContent:"center"}}><Radar5 size={isMobile?220:250} axes={["DSR","Save","EF","D/A","CF"]} values={values}/></div>}
      </>;
    }},
    netWorthForecast:{id:"netWorthForecast",label:"🔮 "+(t.netWorthForecastSlot||"Net Worth Forecast"),render:()=>{
      const history=_w.map(r=>({label:_mlabel(r.month_key),value:((+r.a_liquid||0)+(+r.a_invest||0)+(+r.a_property||0)+(+r.a_other||0))-((+r.l_cards||0)+(+r.l_loans_all||0))}));
      const liveNW=S.total_nw||0;
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
      const PAL={cash:["#3B82F6","#06B6D4","#0EA5E9","#22D3EE"],invest:["#8B5CF6","#A78BFA","#7C3AED","#6366F1"],property:["#10B981","#059669","#16A34A","#15803D"]};
      const idx={cash:0,invest:0,property:0};
      (dashData?.assets||[]).forEach(row=>{const v=+row.val||0;if(v<=0)return;const parent=row.bucket==="cash"?cash:row.bucket==="invest"?invest:property;const b=row.bucket==="cash"?"cash":row.bucket==="invest"?"invest":"property";parent.children.push({label:row.name,value:v,color:PAL[b][idx[b]%4]});idx[b]++;});
      const data=[cash,invest,property].filter(g=>g.children.length>0);
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>☀️ {t.assetSunburstSlot||"Asset Allocation (Sunburst)"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.assetSunburstSub||"Cash / investments / property, nested."}</div></div>
        {data.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.noAssetsYet||"No assets logged."}</div>:<div style={{display:"flex",justifyContent:"center"}}><Sunburst data={data} size={isMobile?220:250}/></div>}
      </>;
    }},
    clientsDumbbell:{id:"clientsDumbbell",label:"⚖️ "+(t.clientsDumbbellSlot||"Client Net Worth Δ"),render:()=>{
      const firstLbl=_shownLabels[0]?_mlabel(_shownLabels[0]):null;
      const data=(dashData?.deltas||[]).map(d=>({label:d.first_name+" "+(d.last_name?d.last_name[0]+".":""),a:+d.nw_first||0,b:+d.nw_now||0})).filter(d=>d.a||d.b);
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>⚖️ {t.clientsDumbbellSlot||"Client Net Worth Δ"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.clientsDumbbellSub||"Where each client was vs where they are now."}</div></div>
        {data.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.needMoreSnapshots||"Need snapshots."}</div>:<Dumbbell data={data} leftLabel={firstLbl||"Prior"} rightLabel="Now" width={460} maxRows={8}/>}
      </>;
    }},
    netWorthSlope:{id:"netWorthSlope",label:"📐 "+(t.netWorthSlopeSlot||"Net Worth Prior vs Current"),render:()=>{
      const firstLbl=_shownLabels[0]?_mlabel(_shownLabels[0]):null;
      const data=(dashData?.deltas||[]).map(d=>{const a=+d.nw_first||0,b=+d.nw_now||0;return{label:d.first_name+" "+(d.last_name?d.last_name[0]+".":""),a,b,color:b>=a?"#10B981":"#EF4444"};});
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>📐 {t.netWorthSlopeSlot||"Net Worth Prior vs Current"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.netWorthSlopeSub||"Tufte slope chart per client."}</div></div>
        {data.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.noClientsShort||"No clients."}</div>:<SlopeGraph data={data} leftLabel={firstLbl||"Prior"} rightLabel="Now" height={isMobile?200:230} width={460}/>}
      </>;
    }},
    billsStacked:{id:"billsStacked",label:"💳 "+(t.billsStackedSlot||"Bills by Category"),render:()=>{
      const categories=["housing","transport","insurance","food","other"];
      // NOT CONVERTED — needs per-category bill line-items per month, which dashData does
      // not provide (trend has total `spending` only, no category split). Guarded to the
      // existing empty/placeholder state rather than loading client blobs. See report.
      const data=[];
      const colors={housing:"#3B82F6",transport:"#F97316",insurance:"#8B5CF6",food:"#F59E0B",other:"#94A3B8"};
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>💳 {t.billsStackedSlot||"Bills by Category"}</div><div style={{display:"flex",gap:10,marginBottom:8,flexWrap:"wrap"}}>{categories.map(c=><span key={c} style={{fontSize:10,color:th.muted,display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:colors[c]}}/>{c}</span>)}</div></div>
        {data.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.needMoreSnapshots||"Need snapshots."}</div>:<StackedBars data={data} categories={categories} colors={colors} width={460} height={isMobile?180:210}/>}
      </>;
    }},
    billsYoY:{id:"billsYoY",label:"📅 "+(t.billsYoYSlot||"Bills YoY"),render:()=>{
      const thisYrLabel=_shownLabels.length?String(_shownLabels[_shownLabels.length-1]).split("-")[0]:undefined;
      // NOT CONVERTED — needs per-category bill totals split by year, which dashData does
      // not provide (no category breakdown in trend). Guarded to placeholder. See report.
      const data=[];
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>📅 {t.billsYoYSlot||"Bills YoY"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.billsYoYSub||"Current year vs prior year by category."}</div></div>
        {data.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.needMoreSnapshots||"Need multi-year snapshots."}</div>:<GroupedYoY data={data} curLabel={thisYrLabel||"This Yr"} priorLabel={"Prior"} width={460} height={isMobile?180:210}/>}
      </>;
    }},
    spendingHeatmap:{id:"spendingHeatmap",label:"🔥 "+(t.spendingHeatmapSlot||"Spending Heatmap"),render:()=>{
      // Year × month spend intensity — derived from the full server trend (all months,
      // not windowed). Each trend row's `spending` is the practice-wide monthly spend.
      const cells=TR.map(r=>{const[y,m]=String(r.month_key).split("-");return{year:+y,month:+m,value:+r.spending||0};}).filter(c=>c.year&&c.month);
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>🔥 {t.spendingHeatmapSlot||"Spending Heatmap"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.spendingHeatmapSub||"Year × month intensity. Cream → amber."}</div></div>
        {cells.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.needMoreSnapshots||"Need snapshots."}</div>:<HeatmapCalendar data={cells} width={460} height={isMobile?150:180}/>}
      </>;
    }},
    payoffProgression:{id:"payoffProgression",label:"📉 "+(t.payoffProgressionSlot||"Debt Payoff Timeline"),render:()=>{
      // NOT CONVERTED — the avalanche projection needs per-debt APR + minimum payment,
      // which dashData.debts does not carry (only name/bal/kind/ltype/first). Guarded to
      // the existing placeholder rather than loading client blobs. See report.
      const debts=[];
      return<>
        <div style={{paddingRight:30}}><div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>📉 {t.payoffProgressionSlot||"Debt Payoff Timeline"}</div><div style={{fontSize:10,color:th.muted,marginBottom:10}}>{t.payoffProgressionSub||"Avalanche projection, excludes mortgages."}</div></div>
        {debts.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:30,fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.noDebtYet||"No debt logged."}</div>:<PayoffProgression debts={debts} width={460} height={isMobile?180:210} maxMonths={120}/>}
      </>;
    }},
    kpiSparklines:{id:"kpiSparklines",label:"✨ "+(t.kpiSparklinesSlot||"KPI Sparklines"),render:()=>{
      const nwSeries=_w.map(r=>((+r.a_liquid||0)+(+r.a_invest||0)+(+r.a_property||0)+(+r.a_other||0))-((+r.l_cards||0)+(+r.l_loans_all||0)));
      const debtSeries=trend.map(p=>p.debt);
      const savSeries=trend.map(p=>p.savings);
      const cfSeries=_w.map(r=>(+r.income||0)-(+r.spending||0));
      const liveNW=S.total_nw||0;
      const liveDebt=td;
      const liveSav=liqNow;
      const liveCF=(S.total_income||0)-(S.total_bills||0)-(S.total_min||0);
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
})()}<RemindersPanel clients={clients} settings={settings} t={t} onSettingsChange={setSettings}/><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:24,marginBottom:12,gap:8,flexWrap:"wrap"}}><div style={{fontSize:10,fontWeight:500,color:th.dim,letterSpacing:"0.13em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>{active.length} {active.length!==1?(t.clients||"Clients"):(t.client||"Client")}</div></div><div style={{display:"flex",flexDirection:"column",gap:8}}>{active.slice(0,rosterShown).map(c=>{/* v0.83 — roster reads SUMMARY fields (advisor rows are summaries, not blobs). "Improving" pill dropped: can't derive from a summary. */const n=+c.monthly_income||0;const tL=+c.total_debt||0;const nw=+c.net_worth||0;return<div key={c.id} className="ga-lift" onClick={()=>onSelect(c)} style={{...mCARD(th),padding:isMobile?"12px 14px":"14px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:isMobile?10:16,flexWrap:isMobile?"wrap":"nowrap"}}><div style={{width:isMobile?38:44,height:isMobile?38:44,borderRadius:isMobile?10:11,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,fontSize:isMobile?12:14,fontFamily:"'JetBrains Mono',monospace",background:c.color1+"22",color:c.color1,border:`1px solid ${c.color1}44`,flexShrink:0}}>{c.firstName[0]}{c.lastName[0]}</div><div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2,flexWrap:"wrap"}}><span style={{fontSize:isMobile?13:14,fontWeight:700,color:th.text}}>{c.firstName} {c.lastName}</span>{c.partnerFirst&&<span style={{fontSize:12,color:th.dim}}>& {c.partnerFirst}</span>}{!isMobile&&<span style={{fontSize:10,color:th.dim}}>{c.snapshot_count||0} snapshots</span>}</div><div style={{fontSize:11,color:th.dim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.email}</div></div>{!isMobile&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20,textAlign:"right"}}><div><div style={{fontSize:10,color:th.dim,marginBottom:2}}>{t.netMo||"Net/mo"}</div><div style={{fontSize:13,fontWeight:700,color:th.pos}}>{hideNumbers?<span style={{filter:"blur(5px)",userSelect:"none"}}>●●●</span>:fmt(n)}</div></div><div><div style={{fontSize:10,color:th.dim,marginBottom:2}}>{t.debt||"Debt"}</div><div style={{fontSize:13,fontWeight:700,color:th.neg}}>{hideNumbers?<span style={{filter:"blur(5px)",userSelect:"none"}}>●●●</span>:fmt(tL)}</div></div><div><div style={{fontSize:10,color:th.dim,marginBottom:2}}>{t.netWorth||"Net Worth"}</div><div style={{fontSize:13,fontWeight:700,color:nw>=0?GOLD:th.neg}}>{hideNumbers?<span style={{filter:"blur(5px)",userSelect:"none"}}>●●●</span>:fmt(nw)}</div></div></div>}{isMobile&&<div style={{flexBasis:"100%",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:8,paddingTop:8,borderTop:`1px solid ${th.cardBorder}`}}><div><div style={{fontSize:9,color:th.dim,marginBottom:1}}>{t.netMo||"Net/mo"}</div><div style={{fontSize:12,fontWeight:700,color:th.pos}}>{hideNumbers?<span style={{filter:"blur(5px)",userSelect:"none"}}>●●●</span>:fmt(n)}</div></div><div><div style={{fontSize:9,color:th.dim,marginBottom:1}}>{t.debt||"Debt"}</div><div style={{fontSize:12,fontWeight:700,color:th.neg}}>{hideNumbers?<span style={{filter:"blur(5px)",userSelect:"none"}}>●●●</span>:fmt(tL)}</div></div><div><div style={{fontSize:9,color:th.dim,marginBottom:1}}>{t.netWorth||"Net Worth"}</div><div style={{fontSize:12,fontWeight:700,color:nw>=0?GOLD:th.neg}}>{hideNumbers?<span style={{filter:"blur(5px)",userSelect:"none"}}>●●●</span>:fmt(nw)}</div></div></div>}{!isMobile&&<span style={{color:th.accent,fontSize:18}}>›</span>}</div>;})}{active.length>rosterShown&&<button onClick={()=>setRosterShown(s=>s+120)} style={{marginTop:4,alignSelf:"flex-start",fontSize:12,padding:"8px 16px",borderRadius:8,background:th.inp,color:th.muted,border:`1px solid ${th.cardBorder}`,cursor:"pointer",fontWeight:600}}>{(t.showMoreClients||"Show more")+" ("+(active.length-rosterShown)+")"}</button>} </div></div>;}

/* ── PAGES ───────────────────────────────────────────────────────────────── */
/* ── CLIENT LIST ─ v0.8.0 action-first bulk actions (WORKPLAN §3 Chat 4) ── */

