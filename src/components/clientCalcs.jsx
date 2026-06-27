// Client-scoped calculators — extracted from App.jsx in Phase 2 of
// docs/ARCHITECTURE-PLAN.md (D-37). Verbatim from the single-file era.
import { useEffect, useRef, useState } from "react";
import { LOAN_META } from "../constants/meta";
import { useTh } from "../contexts/theme";
import { GOLD, mCARD, mINP } from "../styles/theme";
import { bE, effectiveMin, fmt, mthPmt, sumN, toM } from "../utils/finance";
import { AffordabilityCalc, HomeEquityCalc, InterestCalc, RetirementCalc, STD_DED, SavingsCalc, calcFedTax, getBracket } from "./calculators";
import { AmortizationArea, PayoffProgression, RankedHBars } from "./charts";
import { BSolid, Btn, CalcRow, Field, MaskedNumInp, Row2 } from "./primitives";
import { Car, Home } from "lucide-react";

export function ClientIncomeCalc({client,scope,t}){
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

  if((scope==="both"||scope==="joint")&&hasP2)return<div><div style={{fontSize:11,color:th.dim,marginBottom:14,fontStyle:"italic"}}>{t.prefillEditFreely||"Prefilled from client data where possible. Edit freely — nothing saves back."}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}><div>{renderForm(p1State,setP1State,`👤 ${client.firstName}`)}{renderResult(r1,"Results")}</div><div>{renderForm(p2State,setP2State,`👤 ${client.partnerFirst}`)}{renderResult(r2,"Results")}</div></div>
    <div style={{...mCARD(th),padding:14,marginTop:16,background:GOLD+"11",border:`1px solid ${GOLD}44`}}><div style={{fontSize:12,fontWeight:800,color:GOLD,marginBottom:8}}>👥 {t.householdCombined||"HOUSEHOLD COMBINED"}</div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}><div><div style={{fontSize:10,color:th.dim}}>{t.grossPerYr||"Gross/yr"}</div><div style={{fontSize:14,fontWeight:800,color:th.muted}}>{fmt(combined.gross)}</div></div><div><div style={{fontSize:10,color:th.dim}}>{t.incomeTaxable||"Taxable"}</div><div style={{fontSize:14,fontWeight:800,color:th.accent}}>{fmt(combined.taxable)}</div></div><div><div style={{fontSize:10,color:th.dim}}>{t.incomeTotalTaxes||"Total Taxes"}</div><div style={{fontSize:14,fontWeight:800,color:th.neg}}>{fmt(combined.totalTax)}</div></div><div><div style={{fontSize:10,color:th.dim}}>{t.netPerYr||"Net/yr"}</div><div style={{fontSize:14,fontWeight:800,color:th.pos}}>{fmt(combined.netAnnual)}</div></div></div></div>
    </div>;
  if(scope==="p2"&&hasP2)return<div><div style={{fontSize:11,color:th.dim,marginBottom:14,fontStyle:"italic"}}>{(t.prefillIncomeStreams||"Prefilled from {n}'s income streams.").replace("{n}",client.partnerFirst)}</div>{renderForm(p2State,setP2State,`👤 ${client.partnerFirst}`)}{renderResult(r2,"Results")}</div>;
  return<div><div style={{fontSize:11,color:th.dim,marginBottom:14,fontStyle:"italic"}}>{(t.prefillIncomeStreams||"Prefilled from {n}'s income streams.").replace("{n}",client.firstName)}</div>{renderForm(p1State,setP1State,`👤 ${client.firstName}`)}{renderResult(r1,"Results")}</div>;
}

// ── Client-aware Debt Reduction: multi-select cards/loans with weighted avg APR ──
export function ClientDebtCalc({client,scope,t}){
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
  const addScen=()=>{if(!newScen.name||!newScen.balance){alert(t.nameBalanceReq||"Name and Balance required.");return;}const s={id:"scen_"+Date.now(),name:newScen.name,balance:+newScen.balance||0,apr:+newScen.apr||0,min:+newScen.min||0,debtType:newScen.debtType,person:"scenario",isScenario:true};setScenarios(p=>[...p,s]);setSelIds(p=>new Set([...p,s.id]));setNewScen({name:"",balance:"",apr:"",min:"",debtType:"card"});setShowScen(false);};
  const delScen=id=>{setScenarios(p=>p.filter(s=>s.id!==id));setSelIds(p=>{const n=new Set(p);n.delete(id);return n;});};
  const sumBal=sel.reduce((s,d)=>s+(+d.balance||0),0);
  const weightedApr=sumBal>0?sel.reduce((s,d)=>s+((+d.balance||0)*(+d.apr||0)),0)/sumBal:0;
  const sumMinPay=sel.reduce((s,d)=>s+(d.debtType==="card"?(d.isScenario?(+d.min||Math.max(25,(+d.balance||0)*0.02)):effectiveMin(d)):Math.max(+d.min||0,Math.max(25,Math.round((+d.balance||0)*0.01)))),0);
  const totalMonthly=sumMinPay+extraPay;
  const r=weightedApr/100/12;
  // payoff months — guard like canonical payM (finance.js): a blended min that can't outrun
  // interest (totalMonthly<=sumBal*r) makes Math.log() of a non-positive number → NaN. Return
  // null instead so the result renders "N/A" rather than literal "NaN mo (NaN yr)".
  const months=totalMonthly>0&&sumBal>0?(r>0?(()=>{const n=Math.log(totalMonthly/(totalMonthly-sumBal*r))/Math.log(1+r);return isFinite(n)&&n>0?n:null;})():sumBal/totalMonthly):0;
  const totalInt=months!=null&&isFinite(months)?totalMonthly*months-sumBal:null;
  // CC vs Loan breakdown
  const ccSel=sel.filter(d=>d.debtType==="card");const loanSel=sel.filter(d=>d.debtType==="loan");
  const ccBal=ccSel.reduce((s,d)=>s+(+d.balance||0),0);const loanBal=loanSel.reduce((s,d)=>s+(+d.balance||0),0);
  const ccApr=ccBal>0?ccSel.reduce((s,d)=>s+((+d.balance||0)*(+d.apr||0)),0)/ccBal:0;
  const loanApr=loanBal>0?loanSel.reduce((s,d)=>s+((+d.balance||0)*(+d.apr||0)),0)/loanBal:0;
  const ccMin=ccSel.reduce((s,d)=>s+(d.isScenario?(+d.min||Math.max(25,(+d.balance||0)*0.02)):effectiveMin(d)),0);
  const loanMin=loanSel.reduce((s,d)=>s+Math.max(+d.min||0,Math.max(25,Math.round((+d.balance||0)*0.01))),0);

  return<div><div style={{fontSize:11,color:th.dim,marginBottom:14,fontStyle:"italic"}}>{(t.prefillCardsLoans||"Prefilled from {n} cards & loans. Add hypothetical debts with ＋ Scenario.").replace("{n}",scope==="joint"?(t.scopeAllWord||"all"):scope==="p1"?client.firstName:client.partnerFirst)}</div>

  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
    <span style={{fontSize:11,fontWeight:700,color:th.dim}}>{t.debtsToInclude||"DEBTS TO INCLUDE"} ({sel.length}/{allCombined.length})</span>
    <div style={{display:"flex",gap:4}}>
      <button onClick={markAll} style={{fontSize:10,padding:"3px 8px",borderRadius:5,background:"transparent",color:th.pos,border:`1px solid ${th.pos}55`,cursor:"pointer",fontWeight:600}}>✓ {t.markAll||"Mark all"}</button>
      <button onClick={clearAll} style={{fontSize:10,padding:"3px 8px",borderRadius:5,background:"transparent",color:th.dim,border:`1px solid ${th.cardBorder}`,cursor:"pointer",fontWeight:600}}>✗ {t.clearAll||"Clear all"}</button>
      <button onClick={()=>setShowScen(s=>!s)} style={{fontSize:10,padding:"3px 8px",borderRadius:5,background:th.accent+"22",color:th.accent,border:`1px solid ${th.accent}55`,cursor:"pointer",fontWeight:600}}>{showScen?(t.cancel||"Cancel"):(t.addScenarioBtn||"＋ Scenario")}</button>
    </div>
  </div>

  {showScen&&<div style={{...mCARD(th),padding:12,marginBottom:10,background:th.accent+"08",border:`1px solid ${th.accent}33`}}>
    <div style={{fontSize:11,fontWeight:700,color:th.accent,marginBottom:8}}>{t.newHypoDebt||"New Hypothetical Debt"}</div>
    <Row2><Field label={t?.name||"Name"}><input style={INP} value={newScen.name} onChange={e=>setNewScen(p=>({...p,name:e.target.value}))} placeholder={t.egNewCard||"e.g. New Card"}/></Field><Field label={t.type||"Type"}><select style={INP} value={newScen.debtType} onChange={e=>setNewScen(p=>({...p,debtType:e.target.value}))}><option value="card">{t.creditCard||"Credit Card"}</option><option value="loan">{t?.loanOpt||"Loan"}</option></select></Field></Row2>
    <Row2><Field label={t?.loanBalance||"Balance ($)"}><MaskedNumInp style={INP} value={newScen.balance} onChange={e=>setNewScen(p=>({...p,balance:e.target.value}))} onKeyDown={bE}/></Field><Field label={t?.loanApr||"APR (%)"}><MaskedNumInp style={INP} value={newScen.apr} onChange={e=>setNewScen(p=>({...p,apr:e.target.value}))} onKeyDown={bE} step="0.1"/></Field></Row2>
    <Field label={t?.minPaymentMoOpt||"Min Payment ($/mo, optional)"}><MaskedNumInp style={INP} value={newScen.min} onChange={e=>setNewScen(p=>({...p,min:e.target.value}))} onKeyDown={bE}/></Field>
    <div style={{display:"flex",gap:6,justifyContent:"flex-end",marginTop:8}}><Btn small onClick={()=>setShowScen(false)}>{t.cancel||"Cancel"}</Btn><BSolid onClick={addScen} style={{fontSize:11,padding:"4px 12px"}}>{t.addScenario||"Add Scenario"}</BSolid></div>
  </div>}

  {allCombined.length===0?<div style={{fontSize:12,color:th.dim,fontStyle:"italic",padding:10}}>{t.noScopeDebts||"No debts for this scope. Add a scenario above to test."}</div>:<div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:14,maxHeight:220,overflowY:"auto"}}>{allCombined.map(d=>{const s=selIds.has(d.id);return<div key={d.id} onClick={()=>toggle(d.id)} style={{...mCARD(th),padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,border:`1px solid ${s?th.accent:th.cardBorder}`,background:d.isScenario?th.accent+"08":th.card}}><div style={{width:16,height:16,borderRadius:3,background:s?th.accent:th.cardBorder,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",flexShrink:0}}>{s&&"✓"}</div><div style={{flex:1,fontSize:12,color:th.text}}><b>{d.name}</b> <span style={{color:th.dim,fontSize:10}}>({d.debtType}{d.isScenario?(" · "+(t.scenarioTag||"scenario")):""})</span></div><span style={{fontSize:11,color:th.neg,fontWeight:700}}>{fmt(d.balance)}</span><span style={{fontSize:11,color:th.warn}}>{(+d.apr||0).toFixed(1)}%</span>{d.isScenario&&<button onClick={e=>{e.stopPropagation();delScen(d.id);}} aria-label={`${t?.removeSvc||"Remove"} ${d.name||""}`.trim()} title={`${t?.removeSvc||"Remove"} ${d.name||""}`.trim()} style={{fontSize:10,padding:"1px 6px",borderRadius:4,background:"#EF444422",color:"#EF4444",border:"none",cursor:"pointer"}}>×</button>}</div>;})}</div>}

  {/* v0.54 (PR 7) — CC vs Loan breakdown tightened per preview/29-cc-vs-loan.html.
     Compact 12/14px padding, 3-up stat strip per card (Avg APR · Min/mo · Util/DSR),
     all accounts inline with target row gold-tinted, hairline 4px progress bar. */}
  {(()=>{
    if(ccSel.length===0&&loanSel.length===0)return null;
    const ccLimit=ccSel.reduce((s,d)=>s+(+d.creditLimit||0),0);
    const ccUtil=ccLimit>0?Math.min(100,Math.round(ccBal/ccLimit*100)):null;
    const income=sumN(client.incomeStreams||[]);
    const loanDsr=income>0?(loanMin/income*100):null;
    // Avalanche target = highest APR (snowball = smallest balance)
    let target=null;
    if(sel.length){const sorted=sel.slice().sort((a,b)=>strat==="snowball"?(+a.balance-+b.balance):((+b.apr||0)-(+a.apr||0)));target=sorted[0]?.id;}
    const renderCard=(kind,list,bal,apr,minPay,statThird,statThirdGood)=>{
      const accentBg=kind==="cc"?"#DC2626":"#5B9BD5";
      const iconSvg=kind==="cc"
        ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}><rect x="2" y="6" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/></svg>
        : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}><rect x="3" y="8" width="18" height="12" rx="1"/><path d="M3 8 L12 3 L21 8"/><line x1="6" y1="20" x2="6" y2="13"/><line x1="12" y1="20" x2="12" y2="13"/><line x1="18" y1="20" x2="18" y2="13"/></svg>;
      const fillGradient=kind==="cc"?"linear-gradient(to right,#DC2626,#FCA5A5)":"linear-gradient(to right,#4472C4,#93C5FD)";
      const sorted=list.slice().sort((a,b)=>(+b.balance||0)-(+a.balance||0));
      return<div style={{...mCARD(th),padding:"12px 14px",display:"flex",flexDirection:"column",minHeight:0}}>
        {/* h-row: icon + title + count + total */}
        <div style={{display:"flex",alignItems:"center",gap:8,paddingBottom:8,marginBottom:8,borderBottom:`1px solid ${th.cardBorder}`}}>
          <div style={{width:26,height:26,borderRadius:8,display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0,background:accentBg+"28",color:accentBg}}>{iconSvg}</div>
          <div style={{fontSize:11,color:th.text,fontWeight:700}}>{kind==="cc"?(t.creditCards||"Credit Cards"):(t.loans||"Loans")}<span style={{color:th.dim,fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:400,marginLeft:4}}>{list.length} {t.accountsLbl||"accounts"}</span></div>
          <div style={{marginLeft:"auto",fontFamily:"'JetBrains Mono',monospace",fontVariantNumeric:"tabular-nums",fontSize:13,color:GOLD,fontWeight:700}}>{fmt(bal)}</div>
        </div>
        {/* 3-up stat strip */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
          <div style={{padding:"6px 8px",background:th.bg,border:`1px solid ${th.cardBorder}`,borderRadius:6}}>
            <div style={{fontSize:8.5,color:th.dim,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700}}>{t.avgAprLbl||"Avg APR"}</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontVariantNumeric:"tabular-nums",fontSize:13,fontWeight:700,marginTop:1,color:kind==="cc"?"#DC2626":th.text}}>{apr.toFixed(2)}%</div>
          </div>
          <div style={{padding:"6px 8px",background:th.bg,border:`1px solid ${th.cardBorder}`,borderRadius:6}}>
            <div style={{fontSize:8.5,color:th.dim,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700}}>{t.minPerMoLbl||"Min / mo"}</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontVariantNumeric:"tabular-nums",fontSize:13,fontWeight:700,marginTop:1,color:th.text}}>{fmt(minPay)}</div>
          </div>
          <div style={{padding:"6px 8px",background:th.bg,border:`1px solid ${th.cardBorder}`,borderRadius:6}}>
            <div style={{fontSize:8.5,color:th.dim,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700}}>{statThird.label}</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontVariantNumeric:"tabular-nums",fontSize:13,fontWeight:700,marginTop:1,color:statThird.value==null?th.dim:(statThirdGood?th.pos:"#DC2626")}}>{statThird.value==null?"—":statThird.value}</div>
          </div>
        </div>
        {/* line items */}
        <div>
          {sorted.map((d,i)=>{
            const isTarget=d.id===target;
            return<div key={d.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,padding:"5px 8px",borderRadius:5,fontSize:11,background:isTarget?GOLD+"14":"transparent",borderTop:i>0?`1px dashed ${th.cardBorder}`:"none"}}>
              <span style={{color:isTarget?GOLD:th.text,fontWeight:isTarget?700:400,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name||(kind==="cc"?(t.card||"Card"):(t.loan||"Loan"))}</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:isTarget?GOLD:th.dim}}>{(+d.apr||0).toFixed(2)}%</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:GOLD,fontWeight:600,minWidth:56,textAlign:"right"}}>{fmt(+d.balance||0)}</span>
            </div>;
          })}
        </div>
        {/* hairline progress bar — placeholder uses balance/limit for CC, payoff fraction for loans */}
        {(()=>{
          let pct=0;
          if(kind==="cc"&&ccLimit>0){pct=Math.max(0,Math.min(100,Math.round((1-ccBal/Math.max(1,ccLimit))*100)));}
          else if(kind==="loan"){const totalOrig=list.reduce((s,d)=>s+Math.max(+d.balance||0,+d.originalBalance||+d.balance||0),0);if(totalOrig>0)pct=Math.max(0,Math.min(100,Math.round((1-bal/totalOrig)*100)));}
          return<>
            <div style={{height:4,background:th.cardBorder,borderRadius:99,overflow:"hidden",marginTop:8}}><div style={{height:"100%",width:`${pct}%`,borderRadius:99,background:fillGradient}}/></div>
            <div style={{fontSize:9.5,color:th.muted,marginTop:4,display:"flex",justifyContent:"space-between"}}>
              <span>{t.paydownProgress||"Paydown progress"} · <span style={{color:GOLD,fontFamily:"'JetBrains Mono',monospace"}}>{pct}%</span></span>
            </div>
          </>;
        })()}
      </div>;
    };
    return<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
      {ccSel.length>0&&renderCard("cc",ccSel,ccBal,ccApr,ccMin,{label:t.utilLbl||"Util",value:ccUtil!=null?ccUtil+"%":null},(ccUtil??50)<=30)}
      {loanSel.length>0&&renderCard("loan",loanSel,loanBal,loanApr,loanMin,{label:"DSR",value:loanDsr!=null?loanDsr.toFixed(1)+"%":null},(loanDsr??50)<=36)}
    </div>;
  })()}

  <div style={{...mCARD(th),padding:14,marginBottom:12}}><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}><div><div style={{fontSize:10,color:th.dim}}>{t.totalBalance||"Total Balance"}</div><div style={{fontSize:15,fontWeight:800,color:th.neg}}>{fmt(sumBal)}</div></div><div><div style={{fontSize:10,color:th.dim}}>{t.weightedApr||"Weighted APR"}</div><div style={{fontSize:15,fontWeight:800,color:th.warn}}>{weightedApr.toFixed(2)}%</div></div><div><div style={{fontSize:10,color:th.dim}}>{t.minPayMo||"Min Pay/mo"}</div><div style={{fontSize:15,fontWeight:800,color:GOLD}}>{fmt(sumMinPay)}</div></div></div></div>
  <Row2><Field label={t?.extraMonthly||"Extra Monthly Payment ($)"}><MaskedNumInp style={INP} value={extraPay} onChange={e=>setExtraPay(+e.target.value||0)}/></Field><Field label={t?.strategyLbl||"Strategy"}><select style={INP} value={strat} onChange={e=>setStrat(e.target.value)}><option value="avalanche">{t?.avalancheOpt||"Avalanche (highest APR first)"}</option><option value="snowball">{t?.snowballOpt||"Snowball (smallest balance first)"}</option></select></Field></Row2>
  <div style={{...mCARD(th),padding:14,marginTop:10,background:th.pos+"08",border:`1px solid ${th.pos}33`}}>
    <CalcRow label={t?.monthlyPmtMinExtra||"Monthly Payment (min + extra)"} value={fmt(totalMonthly)} color={th.accent}/>
    <CalcRow label={t.payoffTimeLbl||"Payoff Time"} value={sumBal>0&&totalMonthly>0&&months!=null?Math.ceil(months)+" mo ("+(months/12).toFixed(1)+" yr)":"N/A"} color={th.pos} big/>
    <CalcRow label={t.totalInterest||"Total Interest"} value={totalInt!=null?fmt(totalInt):"N/A"} color={th.neg}/>
    <CalcRow label={t.totalPaidLbl||"Total Paid"} value={totalInt!=null?fmt(sumBal+totalInt):"N/A"} color={th.muted}/>
  </div>
  <div style={{...mCARD(th),padding:12,marginTop:10,fontSize:11,color:th.dim,lineHeight:1.6}}>ℹ️ Payoff uses blended weighted APR across selected debts. {strat==="avalanche"?"Avalanche prioritizes high-APR debts first (saves more interest).":"Snowball prioritizes smallest balances first (faster psychological wins)."}</div>
  {/* v0.38.0 — Charts: Ranked H Bars (sort + APR colors) + Payoff Progression timeline */}
  {sel.length>0&&<div data-ga-grid="two-col" style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:14,marginTop:14}}>
    <div style={{...mCARD(th),padding:12}}>
      <div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:10}}>📊 {t.debtRankHdr||"Debts by Balance"}</div>
      <RankedHBars data={sel.map(d=>({label:d.name,value:+d.balance||0,color:d.debtType==="card"?(d.apr>=20?th.neg:d.apr>=10?th.warn:GOLD):(LOAN_META[d.type]?.c||th.blue)}))} width={460}/>
    </div>
    <div style={{...mCARD(th),padding:12}}>
      <div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:10}}>📉 {t.payoffTimelineHdr||"Payoff Timeline"}</div>
      <PayoffProgression debts={sel.map(d=>({name:d.name,balance:+d.balance||0,apr:+d.apr||0,min:d.debtType==="card"?(d.isScenario?(+d.min||Math.max(25,(+d.balance||0)*0.02)):effectiveMin(d)):Math.max(+d.min||0,Math.max(25,Math.round((+d.balance||0)*0.01))),color:d.debtType==="card"?"#EF4444":"#3B82F6"}))} extraPay={extraPay} height={200} width={460}/>
    </div>
  </div>}
  </div>;
}

// ── Client-aware Car Loan Calc: picks from client properties tagged Vehicle or loans with type=vehicle ──
export function ClientCarLoanCalc({client,scope,t}){
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
  return<div><div style={{fontSize:11,color:th.dim,marginBottom:14,fontStyle:"italic"}}>{t.prefillVehicles||"Prefilled from client's vehicles. Select existing vehicle loans to include their weighted-avg APR."}</div>
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
  {/* v0.38.0 — Amortization chart */}
  {amountFinanced>0&&<div style={{...mCARD(th),padding:12,marginTop:12}}>
    <div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:10}}>📉 {t.amortizationHdr||"Loan Balance Over Time"}</div>
    <AmortizationArea principal={amountFinanced} apr={f.apr} termMonths={f.term} color={"#F97316"} width={600} height={140}/>
  </div>}
  </div>;
}

export function ClientCalculatorsTab({client,onUpdate,t}){
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
    // v0.55 — Portfolio removed from client-side calc tabs per Mauricio.
    // Available in the Portfolios section + standalone /calculators.
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
    alert(t.snapshotSavedMsg||"✓ Snapshot saved. It will appear in the Complete Report.");
  };
  const clearSnapshot=()=>{
    if(!confirm((t.confirmClearSnap||"Clear the saved {x} snapshot?").replace("{x}",current.label)))return;
    onUpdate({...client,savedCalcs:saved.filter(s=>s.calcId!==tab)});
  };
  const clearAllSnapshots=()=>{
    if(!confirm((t.confirmClearAllSnaps||"Clear ALL {n} calculator snapshot(s)?").replace("{n}",saved.length)))return;
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


