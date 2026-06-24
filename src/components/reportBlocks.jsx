// Read-only report blocks — extracted from App.jsx in Phase 2 of
// docs/ARCHITECTURE-PLAN.md (D-37). Verbatim from the single-file era.
import { TICKER_META, _gaLang, mLabel } from "../constants/meta";
import { useTh } from "../contexts/theme";
import { GOLD, mCARD, mTD, mTDR, mTH, mTHR } from "../styles/theme";
import { effectiveMin, fmt, fmtDate, liquidA, sumB, sumN } from "../utils/finance";
import { Pill } from "./primitives";
import { Calculator, Target } from "lucide-react";

export function PlanReportBlock({client,lang,t}){
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

export function PortfolioReportBlock({client,t}){const th=useTh();const incl=client.reportInclude||{};if(incl.portfolio===false)return null;const saved=client.savedPortfolio;const cust=client.portfolioCustom;const holdings=saved?.holdings||cust?.holdings||[];if(!holdings.length)return null;return<div style={{...mCARD(th),padding:16,marginBottom:14}}><div style={{fontSize:13,fontWeight:800,color:th.text,marginBottom:14,paddingBottom:8,borderBottom:`2px solid ${th.accent}`}}>💹 {t.selectedPortfolioHdr||"Selected Portfolio"}</div><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}><thead><tr><th style={mTH(th)}>{t.colTicker||"Ticker"}</th><th style={mTH(th)}>{t.colName||"Name"}</th><th style={mTH(th)}>{t.colCategory||"Category"}</th><th style={mTHR(th)}>{t.colAllocPct||"Alloc %"}</th></tr></thead><tbody>{holdings.map(h=>{const tm=TICKER_META[h.ticker];return<tr key={h.id||h.ticker}><td style={{...mTD(th),fontWeight:700,color:th.accent}}>{h.ticker}</td><td style={mTD(th)}>{tm?.name||h.name}</td><td style={{...mTD(th),color:th.muted,fontSize:10}}>{tm?.cat||"—"}</td><td style={{...mTDR(th),fontWeight:700}}>{h.pct||0}%</td></tr>;})}</tbody></table></div>;}

export function CompareReportBlock({client,t}){const th=useTh();const saved=client.savedCompare;if(!saved||!saved.rows||saved.rows.length<2)return null;const{rows,fields,ratioRows}=saved;const FLD_REMAP={"💼 Net Income":t.fldNetIncomeCmp,"💳 Bills":t.fldBillsCmp,"🏦 Min Debt Pay":t.fldMinDebtCmp,"💰 Cash Flow":t.fldCashFlowCmp,"💧 Liquid Savings":t.fldLiquidCmp,"📉 Total Debt":t.fldDebtCmp,"📈 Total Assets":t.fldAssetsCmp,"💎 Net Worth":t.fldNetWorthCmp};const RAT_REMAP={"DSR":t.ratioDSR,"Debt/Asset":t.ratioDebtAsset,"Current Ratio":t.ratioCurrent,"Retirement Rate":t.ratioRetirementRate,"Emergency Fund":t.ratioEmergencyFund,"Cash Flow":t.ratioCashFlow};const _trF=l=>FLD_REMAP[l]||l;const _trR=l=>RAT_REMAP[l]||l;return<div style={{...mCARD(th),padding:16,marginBottom:14}}><div style={{fontSize:13,fontWeight:800,color:th.text,marginBottom:14,paddingBottom:8,borderBottom:`2px solid ${th.accent}`}}>{t.periodComparisonHdr||"Period Comparison"} · {t.savedOn||"Saved"} {fmtDate(new Date(saved.savedAt),_gaLang())}</div>{(()=>{if(!rows||rows.length<2)return null;const debts=rows.map(r=>r.debt||0).filter(x=>x>0);if(debts.length<2)return null;const min=Math.min(...debts),max=Math.max(...debts);if(max/min>5)return <div style={{padding:"8px 12px",marginTop:8,marginBottom:8,background:"#FBBF2422",border:"1px solid #FBBF24",borderRadius:8,fontSize:11,color:"#92400E"}}>{t.staleSnapWarn||"⚠️ This snapshot may have stale data — scale differs significantly from current."}</div>;return null;})()}<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:480,tableLayout:"fixed"}}><colgroup><col style={{width:"28%"}}/>{rows.map((_,i)=><col key={i} style={{width:`${(72-12)/rows.length}%`}}/>)}<col style={{width:"12%"}}/></colgroup><thead><tr><th style={mTH(th)}>{t.colMetric||"Metric"}</th>{rows.map(r=><th key={r.label} style={{...mTHR(th),fontSize:11,fontWeight:700,color:r.label.includes("Live")?th.pos:th.accent}}>{mLabel(r.label.replace(" (Live)",""),_gaLang())+(r.label.includes("(Live)")?" ("+(t.liveSuffix||"Live")+")":"")}</th>)}<th style={{...mTHR(th),color:th.dim,fontSize:11}}>Δ</th></tr></thead><tbody>{(fields||[]).map(f=>{const vals=rows.map(r=>r[f.k]||0);const ch=vals[vals.length-1]-vals[0];const pct=vals[0]?((ch/Math.abs(vals[0]))*100).toFixed(1):"—";return<tr key={f.k}><td style={{...mTD(th),fontWeight:600,color:f.c}}>{_trF(f.l)}</td>{vals.map((v,i)=><td key={i} style={{...mTDR(th),color:f.c,fontWeight:700}}>{fmt(v)}</td>)}<td style={{...mTDR(th),fontSize:11,color:ch>=0?th.pos:th.neg,fontWeight:700}}>{ch!==0?(ch>0?"+":"")+fmt(ch):""}{pct!=="—"&&<div style={{fontSize:10,opacity:0.7}}>{pct}%</div>}</td></tr>;})}</tbody></table></div>{ratioRows&&<div style={{marginTop:14}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>{t.ratiosSub||"Ratios"}</div><table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}><colgroup><col style={{width:"28%"}}/>{rows.map((_,i)=><col key={i} style={{width:`${(72-12)/rows.length}%`}}/>)}<col style={{width:"12%"}}/></colgroup><tbody>{ratioRows.map(rf=>{const vals=rows.map(r=>r[rf.k]);return<tr key={rf.l}><td style={{...mTD(th),fontWeight:600,color:th.muted,fontSize:12}}>{_trR(rf.l)}</td>{vals.map((v,i)=>{let display="—";if(rf.k==="dsr"||rf.k==="dta")display=v>=99?"N/A":(v*100).toFixed(1)+"%";else if(rf.k==="cr")display=v>=999?"N/A":v.toFixed(2)+"x";else if(rf.k==="rsr")display=(v*100).toFixed(1)+"%";else if(rf.k==="efr")display=v.toFixed(1)+"mo";else if(rf.k==="cashFlow")display=v>=0?"✓":"✗";return<td key={i} style={{...mTDR(th),fontSize:12,fontWeight:700,color:th.muted}}>{display}</td>;})}<td style={{...mTDR(th),fontSize:11,color:th.dim}}>{rf.bm}</td></tr>;})}</tbody></table></div>}</div>;}

export function CalculatorsReportBlock({client,t}){
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


