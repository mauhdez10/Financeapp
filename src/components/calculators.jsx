// Extracted from App.jsx in Phase 1b of docs/ARCHITECTURE-PLAN.md (D-37, 2026-06-10).
// Code is verbatim from the single-file era; comments may reference old App.jsx line numbers.
import { useState, useEffect, useMemo, useRef } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTip, Line, ComposedChart, Legend } from "recharts";
import { PiggyBank, TrendingUp, Home, Wallet, TrendingDown, Car, KeyRound, Percent, Gem } from "lucide-react";
import { useTh } from "../contexts/theme";
import { GOLD, stripLeadEmoji, mCARD, mINP, mIIN, mTH, mTHR, mTD, mTDR } from "../styles/theme";
import { PORTFOLIOS, TICKER_META, DEF_PORT_RATES, PC } from "../constants/meta";
import { fmt, fmtD, fmtS, bE, payM, payL, mthPmt } from "../utils/finance";
import { AmortizationArea, ForecastCone, CompoundGrowthStack, PayoffProgression, Donut, RadialGauge } from "./charts";
import { Field, Row2, CalcRow, MaskedNumInp, NumInp, YearInp, Btn, BSolid, Pill, Paginator, SHdr, Tog } from "./primitives";

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
{tab==="equity"&&<div><Row2><Field label={t.homeValuePh||"Home Value ($)"}><MaskedNumInp style={INP} value={eq.homeValue} onChange={ue("homeValue")} onKeyDown={bE}/></Field><Field label={t.firstMortgage||"1st Mortgage ($)"}><MaskedNumInp style={INP} value={eq.mortgage1} onChange={ue("mortgage1")} onKeyDown={bE}/></Field></Row2><Row2><Field label={t.secondMortgage||"2nd Mortgage ($)"}><MaskedNumInp style={INP} value={eq.mortgage2} onChange={ue("mortgage2")} onKeyDown={bE}/></Field><Field label={t.otherLiens||"Other Liens ($)"}><MaskedNumInp style={INP} value={eq.liens} onChange={ue("liens")} onKeyDown={bE}/></Field></Row2><Row2><Field label={t.ltvLbl||"Max LTV (%)"}><MaskedNumInp style={INP} value={eq.loanPct} onChange={ue("loanPct")} onKeyDown={bE} min={50} max={95}/></Field><Field label={t.loanAprLbl||"Loan APR (%)"}><MaskedNumInp style={INP} value={eq.apr} onChange={ue("apr")} onKeyDown={bE} step="0.1"/></Field></Row2><Field label={t.termYearsLbl||"Term (years)"}><MaskedNumInp style={INP} value={eq.term} onChange={ue("term")} onKeyDown={bE} min={1} max={30}/></Field><div style={{...mCARD(th),padding:14,marginTop:8}}><CalcRow label={t.totalOwed||"Total Owed"} value={fmt(totalOwed)} color={th.neg}/><CalcRow label={t.maxBorrowable||"Max Borrowable"} value={fmt(maxLoan)} color={th.pos} big/><CalcRow label={t.monthlyPaymentLbl||"Monthly Payment"} value={fmtD(helocPay)} color={th.warn}/><CalcRow label={t.currentEquity||"Current Equity"} value={fmt(eq.homeValue-totalOwed)} color={GOLD}/></div>
{/* v0.45.0 — Home value composition donut */}
{eq.homeValue>0&&<div style={{...mCARD(th),padding:14,marginTop:12,display:"flex",flexDirection:"column",alignItems:"center"}}>
  <div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8}}>🥧 {t.homeValueSplitHdr||"Home Value Composition"}</div>
  <Donut data={[
    {name:t.totalOwed||"Total Owed",value:totalOwed,color:th.neg},
    {name:t.maxBorrowable||"Borrowable Equity",value:maxLoan,color:GOLD},
    {name:t.lockedEquity||"Locked Equity",value:Math.max(0,eq.homeValue-totalOwed-maxLoan),color:th.pos},
  ].filter(d=>d.value>0)} size={180} centerLabel={t.homeValuePh||"Home Value"} centerValue={fmtS(eq.homeValue)} centerColor={GOLD}/>
</div>}
</div>}
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
  {/* v0.45.0 — Paycheck breakdown donut: net + taxes + pre-tax deductions */}
  {gross>0&&<div data-ga-grid="two-col" style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:14,marginTop:14}}>
    <div style={{...mCARD(th),padding:14,display:"flex",flexDirection:"column",alignItems:"center"}}>
      <div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8}}>🥧 {t.paycheckBreakdownHdr||"Where Each Dollar Goes"}</div>
      <Donut data={[
        {name:t.netSlice||"Net (take-home)",value:netAnnual,color:th.pos},
        {name:t.fedTaxSlice||"Federal",value:fedTax,color:"#DC2626"},
        {name:t.stateTaxSlice||"State",value:stateTax,color:"#F59E0B"},
        {name:t.ssTaxSlice||"Social Security",value:ssTax,color:"#8B5CF6"},
        {name:t.medTaxSlice||"Medicare",value:medicareTax+(addMedTax||0),color:"#06B6D4"},
        ...(preTax>0?[{name:t.preTaxSlice||"Pre-tax (401k/HSA)",value:preTax,color:"#3B82F6"}]:[]),
      ].filter(d=>d.value>0)} size={170} centerLabel={t.grossLbl||"Gross"} centerValue={fmtS(gross)}/>
    </div>
    <div style={{...mCARD(th),padding:14,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8}}>🎯 {t.effectiveTaxRateHdr||"Effective Tax Rate"}</div>
      <RadialGauge value={gross>0?(totalTax/gross)*100:0} max={50} target={25} size={150} label={t.taxRateLbl||"Tax Rate"} subLabel={t.lowerIsBetter||"≤ 25% target"} direction="lower" thresholds={[0.5,0.7]} fmt={v=>v.toFixed(1)+"%"}/>
    </div>
  </div>}
  </div>;}
function DebtReductionCalc({t}){const th=useTh();const[mode,setMode]=useState("payoff");const[feeMode,setFeeMode]=useState("pct");const[f,setF]=useState({balance:5000,apr:28,payment:200,loanApr:12,loanTerm:36,origFee:2,origFlat:100});const u=k=>e=>setF(p=>({...p,[k]:+e.target.value||0}));const ccMonths=payM(f.balance,f.apr,f.payment);const ccTotal=ccMonths?(f.payment*ccMonths):null;const origCost=feeMode==="pct"?f.balance*(f.origFee/100):f.origFlat;const loanAmt=f.balance+origCost;const loanPayment=mthPmt(loanAmt,f.loanApr/100,f.loanTerm);const loanTotal=loanPayment*f.loanTerm;const savings=ccTotal?ccTotal-loanTotal:null;const INP=mINP(th);return<div><div style={{display:"flex",gap:8,marginBottom:16}}>{[["payoff","📉 "+(t.payoff||"Payoff")],["compare","⚖️ "+(t.ccVsLoan||"CC vs Loan")]].map(([v,l])=><button key={v} onClick={()=>setMode(v)} style={{fontSize:12,padding:"6px 14px",borderRadius:8,cursor:"pointer",background:mode===v?th.accent+"22":"transparent",color:mode===v?th.accent:th.muted,border:`1px solid ${mode===v?th.accent:th.cardBorder}`}}>{l}</button>)}</div><Row2><Field label={(t.cardBalance||"Card Balance")+" ($)"}><MaskedNumInp style={INP} value={f.balance} onChange={u("balance")} onKeyDown={bE}/></Field><Field label={(t.cardAPR||"Card APR")+" (%)"}><MaskedNumInp style={INP} value={f.apr} onChange={u("apr")} onKeyDown={bE} step="0.1"/></Field></Row2><Field label={(t.monthlyPaymentLbl||"Monthly Payment")+" ($)"}><MaskedNumInp style={INP} value={f.payment} onChange={u("payment")} onKeyDown={bE}/></Field>{mode==="compare"&&<><div style={{height:1,background:th.cardBorder,margin:"12px 0"}}/><Row2><Field label={(t.loanAPRLbl||"Loan APR")+" (%)"}><MaskedNumInp style={INP} value={f.loanApr} onChange={u("loanApr")} onKeyDown={bE} step="0.1"/></Field><Field label={t.loanTermMo||"Loan Term (months)"}><MaskedNumInp style={INP} value={f.loanTerm} onChange={u("loanTerm")} onKeyDown={bE}/></Field></Row2><div style={{...mCARD(th),padding:12,marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontSize:12,color:th.muted}}>{t.origFeeLbl||"Origination Fee"}</span><div style={{display:"flex",gap:6}}>{[["pct","% of Balance"],["flat","Flat ($)"]].map(([v,l])=><button key={v} onClick={()=>setFeeMode(v)} style={{fontSize:11,padding:"3px 10px",borderRadius:6,cursor:"pointer",background:feeMode===v?th.accent+"22":"transparent",color:feeMode===v?th.accent:th.muted,border:`1px solid ${feeMode===v?th.accent:th.cardBorder}`}}>{l}</button>)}</div></div>{feeMode==="pct"?<Row2><Field label={t.feePct||"Fee %"}><MaskedNumInp style={INP} value={f.origFee} onChange={u("origFee")} onKeyDown={bE} step="0.1"/></Field><Field label={t.feeAmt||"Fee Amount"}><div style={{...mINP(th),opacity:0.6}}>{fmt(origCost)}</div></Field></Row2>:<Row2><Field label={t.flatFee||"Flat Fee ($)"}><MaskedNumInp style={INP} value={f.origFlat} onChange={u("origFlat")} onKeyDown={bE}/></Field><Field label={t.pctOfBalance||"% of Balance"}><div style={{...mINP(th),opacity:0.6}}>{((origCost/Math.max(1,f.balance))*100).toFixed(2)}%</div></Field></Row2>}</div></>}<div style={{...mCARD(th),padding:16,marginTop:8}}>{mode==="payoff"?<><CalcRow label={t.payoffTimeLbl||"Payoff Time"} value={payL(ccMonths)} color={th.accent} big/><CalcRow label={t.totalPaidLbl||"Total Paid"} value={ccTotal?fmt(ccTotal):"—"} color={th.muted}/><CalcRow label={t.totalInterest||"Total Interest"} value={ccTotal?fmt(ccTotal-f.balance):"—"} color={th.neg}/></>:<><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}><div style={{...mCARD(th),padding:12,background:th.neg+"11"}}><div style={{fontSize:11,fontWeight:700,color:th.neg,marginBottom:6}}>💳 {t.creditCard||"Credit Card"}</div><CalcRow label={t.payoff||"Payoff"} value={payL(ccMonths)}/><CalcRow label={t.totalLbl||"Total"} value={ccTotal?fmt(ccTotal):"—"} color={th.neg}/></div><div style={{...mCARD(th),padding:12,background:th.pos+"11"}}><div style={{fontSize:11,fontWeight:700,color:th.pos,marginBottom:6}}>🏦 {t.personalLoan||"Personal Loan"}</div><CalcRow label={t.monthly2||"Monthly"} value={fmtD(loanPayment)}/><CalcRow label={t.totalLbl||"Total"} value={fmt(loanTotal)} color={th.pos}/></div></div>{savings!==null&&<CalcRow label={"💰 "+t.savings3} value={fmt(Math.abs(savings))+" "+(savings>0?"saved with loan":"saved with CC")} color={savings>0?th.pos:th.neg} big/>}</>}</div>
{/* v0.54 (PR 9) — PayoffProgression chart on standalone Debt Reduction. */}
{f.balance>0&&f.payment>0&&<div style={{...mCARD(th),padding:14,marginTop:12}}>
  <div style={{fontSize:11,fontWeight:700,color:GOLD,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>{t.payoffProgressionHdr||"Payoff progression"}</div>
  <div style={{fontSize:10,color:th.muted,marginBottom:8}}>{t.payoffProgressionSub||"Balance dropping to zero given current monthly payment."}</div>
  <PayoffProgression debts={[{name:t.creditCard||"Card",balance:+f.balance||0,apr:+f.apr||0,min:+f.payment||0,color:GOLD}]} width={460} height={180} maxMonths={120}/>
  {ccMonths&&<div style={{display:"flex",gap:14,fontSize:10,color:th.muted,marginTop:6}}><span><b style={{color:GOLD,fontFamily:"'JetBrains Mono',monospace"}}>{payL(ccMonths)}</b> {t.toDebtFree||"to debt-free"}</span><span style={{color:th.pos,fontFamily:"'JetBrains Mono',monospace",marginLeft:"auto"}}>{fmt(ccTotal-f.balance)} {t.totalInterestLbl||"total interest"}</span></div>}
</div>}
</div>;}
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
  </div>
  {/* v0.45.0 — Amortization chart for standalone Car Loan calc */}
  {amountFinanced>0&&<div style={{...mCARD(th),padding:12,marginTop:12}}>
    <div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:10}}>📉 {t.amortizationHdr||"Loan Balance Over Time"}</div>
    <AmortizationArea principal={amountFinanced} apr={f.apr} termMonths={f.term} color={"#F97316"} width={600} height={140}/>
  </div>}
  </div>;}
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
  </div>
  {/* v0.38.0 — PITI Donut + DTI Gauge */}
  {maxPrice>0&&<div data-ga-grid="two-col" style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:14,marginTop:14}}>
    <div style={{...mCARD(th),padding:14,display:"flex",flexDirection:"column",alignItems:"center"}}>
      <div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8}}>🥧 {t.pitiBreakdownHdr||"PITI Breakdown"}</div>
      <Donut data={[
        {name:t.affordMonthlyPI||"P&I",value:principalInt,color:GOLD},
        {name:t.affordMonthlyTax||"Tax",value:monthlyTax,color:"#3B82F6"},
        {name:t.affordMonthlyIns||"Insurance",value:f.insurance,color:"#10B981"},
        ...(f.hoa>0?[{name:t.affordMonthlyHOA||"HOA",value:f.hoa,color:"#8B5CF6"}]:[]),
      ]} size={150} centerLabel={t.totalLbl||"Total"} centerValue={fmt(Math.round(totalPITI))+"/mo"}/>
    </div>
    <div style={{...mCARD(th),padding:14,display:"flex",flexDirection:"column",alignItems:"center"}}>
      <div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8}}>🎯 {t.dtiGaugeHdr||"DTI Ratio"}</div>
      <RadialGauge value={f.grossIncome>0?((totalPITI+f.existingDebt)/f.grossIncome)*100:0} max={60} target={36} size={150} label={"DTI"} subLabel={"≤ 36% target"} direction="lower" thresholds={[0.6,0.83]} fmt={v=>v.toFixed(0)+"%"}/>
    </div>
  </div>}
  </div>;}
function InterestCalc({t}){
  const th=useTh();
  // v0.54 (PR 9) — added monthly contribution + CompoundGrowthStack chart.
  const[f,setF]=useState({principal:10000,monthly:0,rate:5,years:5,type:"compound",freq:12});
  const u=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const r=f.rate/100;
  const monthly=Math.max(0,+f.monthly||0);
  const interest=(()=>{
    if(f.type==="simple")return (+f.principal||0)*r*(+f.years||0)+monthly*0; // simple ignores monthly drip
    const mr=r/12,n=(+f.years||0)*12;
    const total=(+f.principal||0)*Math.pow(1+mr,n)+(mr>0?monthly*((Math.pow(1+mr,n)-1)/mr):monthly*n);
    return total-(+f.principal||0)-monthly*n;
  })();
  const totalContrib=monthly*(+f.years||0)*12;
  const total=(+f.principal||0)+totalContrib+interest;
  const INP=mINP(th);
  return<div>
    <Row2><Field label={t.principalLbl||"Principal ($)"}><MaskedNumInp style={INP} value={f.principal} onChange={u("principal")} onKeyDown={bE}/></Field><Field label={t.interestRateLbl||"Interest Rate (%)"}><MaskedNumInp style={INP} value={f.rate} onChange={u("rate")} onKeyDown={bE} step="0.1"/></Field></Row2>
    <Row2><Field label={t.termYearsLbl||"Term (years)"}><MaskedNumInp style={INP} value={f.years} onChange={u("years")} onKeyDown={bE} min={1}/></Field><Field label={t.type||"Type"}><select style={INP} value={f.type} onChange={u("type")}><option value="compound">{t.compoundLbl||"Compound"}</option><option value="simple">{t.simpleLbl||"Simple"}</option></select></Field></Row2>
    <Row2><Field label={t.monthlyContribLbl||"Monthly Contribution ($)"}><MaskedNumInp style={INP} value={f.monthly} onChange={u("monthly")} onKeyDown={bE}/></Field>{f.type==="compound"?<Field label={t.compoundFreq||"Compound Frequency"}><select style={INP} value={f.freq} onChange={u("freq")}><option value={12}>{t.monthly2||"Monthly"}</option><option value={4}>{t.quarterly||"Quarterly"}</option><option value={1}>{t.annual||"Annual"}</option></select></Field>:<div/>}</Row2>
    <div style={{...mCARD(th),padding:16,marginTop:8,marginBottom:12}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:4}}>
        <div><div style={{fontSize:10,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:700}}>{t.finalValueLbl||"Final value"}</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontVariantNumeric:"tabular-nums",fontSize:18,fontWeight:700,color:GOLD,marginTop:2}}>{fmt(total)}</div></div>
        <div><div style={{fontSize:10,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:700}}>{t.interestEarnedLbl||"Of which interest"}</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontVariantNumeric:"tabular-nums",fontSize:16,fontWeight:700,color:th.pos,marginTop:2}}>{fmt(interest)}</div></div>
        <div><div style={{fontSize:10,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:700}}>{t.realValueLbl||"Real (3% infl)"}</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontVariantNumeric:"tabular-nums",fontSize:16,fontWeight:700,color:th.muted,marginTop:2}}>{fmt(total/Math.pow(1.03,Math.max(1,+f.years||1)))}</div></div>
      </div>
    </div>
    <div style={{...mCARD(th),padding:14}}>
      <div style={{fontSize:11,fontWeight:700,color:GOLD,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>{t.compoundGrowthHdr||"Compound growth"}</div>
      <CompoundGrowthStack principal={+f.principal||0} monthly={monthly} rate={+f.rate||0} years={+f.years||0} simple={f.type==="simple"} height={240}/>
      <div style={{display:"flex",gap:14,fontSize:10,color:th.muted,marginTop:8,flexWrap:"wrap"}}>
        <span style={{display:"inline-flex",alignItems:"center",gap:5}}><span style={{width:8,height:8,borderRadius:2,background:"#4472C4"}}/>{t.principalLbl||"Principal"}</span>
        <span style={{display:"inline-flex",alignItems:"center",gap:5}}><span style={{width:8,height:8,borderRadius:2,background:"#5B9BD5"}}/>{t.contributionsLbl||"Contributions"}</span>
        <span style={{display:"inline-flex",alignItems:"center",gap:5}}><span style={{width:8,height:8,borderRadius:2,background:GOLD}}/>{t.interestLbl||"Interest"}</span>
      </div>
    </div>
  </div>;
}
function SavingsCalc({t}){const th=useTh();const[f,setF]=useState({initial:1000,monthly:200,apy:4.5,years:10});const u=k=>e=>setF(p=>({...p,[k]:+e.target.value||0}));const r=f.apy/100/12;const n3=f.years*12;const fv=f.initial*Math.pow(1+r,n3)+(f.monthly>0?f.monthly*((Math.pow(1+r,n3)-1)/r):0);const contrib=f.initial+f.monthly*n3;const data3=[1,2,3,4,5,6,7,8,9,10].filter(y=>y<=f.years).map(y=>{const n2=y*12;const v=f.initial*Math.pow(1+r,n2)+(f.monthly>0?f.monthly*((Math.pow(1+r,n2)-1)/r):0);return{year:"Yr "+y,value:Math.round(v),contrib:Math.round(f.initial+f.monthly*n2)};});const INP=mINP(th);return<div><Row2><Field label={t.initialDeposit||"Initial Deposit ($)"}><MaskedNumInp style={INP} value={f.initial} onChange={u("initial")} onKeyDown={bE}/></Field><Field label={t.monthlyDeposit||"Monthly Deposit ($)"}><MaskedNumInp style={INP} value={f.monthly} onChange={u("monthly")} onKeyDown={bE}/></Field></Row2><Row2><Field label={t.apyLbl||"APY (%)"}><MaskedNumInp style={INP} value={f.apy} onChange={u("apy")} onKeyDown={bE} step="0.1"/></Field><Field label={t.years||"Years"}><MaskedNumInp style={INP} value={f.years} onChange={u("years")} onKeyDown={bE} min={1} max={50}/></Field></Row2><div style={{...mCARD(th),padding:16,marginBottom:10}}><CalcRow label={t.futureValue||"Future Value"} value={fmt(fv)} color={th.accent} big/><CalcRow label={t.totalContrib||"Total Contributed"} value={fmt(contrib)} color={th.muted}/><CalcRow label={t.interestEarned||"Interest Earned"} value={fmt(fv-contrib)} color={th.pos}/></div><ResponsiveContainer width="100%" height={140} style={{outline:"none"}}><AreaChart data={data3} margin={{top:10,right:0,left:0,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke={th.cardBorder}/><XAxis dataKey="year" tick={{fontSize:9,fill:th.dim}} axisLine={false} tickLine={false}/><YAxis hide/><ReTip contentStyle={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:8,fontSize:11}} formatter={v=>fmt(v)}/><Area type="monotone" dataKey="value" name="Value" stroke={th.accent} fill={th.accent+"33"} strokeWidth={2}/><Area type="monotone" dataKey="contrib" name="Contributed" stroke={th.muted} fill={th.muted+"22"} strokeWidth={1}/></AreaChart></ResponsiveContainer></div>;}
function RetirementCalc({t}){const th=useTh();const[f,setF]=useState({currentAge:30,retireAge:65,balance:25000,monthly:500,matchPct:50,matchLimit:6,salary:5000,worst:5,base:8,best:11});const u=k=>e=>setF(p=>({...p,[k]:+e.target.value||0}));const INP=mINP(th);const years=Math.max(0,f.retireAge-f.currentAge);const totalMonths=years*12;const employerMatch=Math.min(f.monthly,f.salary*(f.matchLimit/100))*(f.matchPct/100);const totalMonthly=f.monthly+employerMatch;const proj=rate=>{const r=rate/100/12;return r>0?f.balance*Math.pow(1+r,totalMonths)+totalMonthly*((Math.pow(1+r,totalMonths)-1)/r):f.balance+totalMonthly*totalMonths;};const scenarios=[{l:t.worst||"Worst",rate:f.worst,c:th.warn},{l:t.base||"Base",rate:f.base,c:th.accent},{l:t.best||"Best",rate:f.best,c:th.pos}];const totalContrib=f.balance+totalMonthly*totalMonths;const chartData=[];const step=Math.max(1,Math.round(years/10));for(let y=0;y<=years;y+=step){const m=y*12;const r_w=f.worst/100/12;const r_b=f.base/100/12;const r_g=f.best/100/12;const calc=(r,bal,mo)=>r>0?bal*Math.pow(1+r,m)+mo*((Math.pow(1+r,m)-1)/r):bal+mo*m;chartData.push({yr:"Yr "+y,worst:Math.round(calc(r_w,f.balance,totalMonthly)),base:Math.round(calc(r_b,f.balance,totalMonthly)),best:Math.round(calc(r_g,f.balance,totalMonthly))});}
  // v0.38.0 — ForecastCone build: history is the starting balance, projection is base-case
  const fcHist=[{label:`Age ${f.currentAge}`,value:f.balance}];
  const fcProj=[];const fcStep=Math.max(1,Math.round(years/8));
  const r_b=f.base/100/12;
  for(let y=fcStep;y<=years;y+=fcStep){const m=y*12;const v=r_b>0?f.balance*Math.pow(1+r_b,m)+totalMonthly*((Math.pow(1+r_b,m)-1)/r_b):f.balance+totalMonthly*m;fcProj.push({label:`Age ${f.currentAge+y}`,value:Math.round(v)});}return<div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}><div style={{...mCARD(th),padding:14}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:10}}>👤 {(t.profile||"Profile").toUpperCase()}</div><Row2><Field label={t.currentAge||"Current Age"}><MaskedNumInp style={INP} value={f.currentAge} onChange={u("currentAge")} min={18} max={80} onKeyDown={bE}/></Field><Field label={t.retirementAge||"Retirement Age"}><MaskedNumInp style={INP} value={f.retireAge} onChange={u("retireAge")} min={40} max={80} onKeyDown={bE}/></Field></Row2><Field label={t.currentBalance||"Current Balance ($)"}><MaskedNumInp style={INP} value={f.balance} onChange={u("balance")} onKeyDown={bE}/></Field><Field label={t.monthlyContribution||"Monthly Contribution ($)"}><MaskedNumInp style={INP} value={f.monthly} onChange={u("monthly")} onKeyDown={bE}/></Field></div><div style={{...mCARD(th),padding:14}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:10}}>🏢 {(t.employerMatch||"Employer Match").toUpperCase()}</div><Field label={t.monthlyGrossSalary||"Monthly Gross Salary ($)"}><MaskedNumInp style={INP} value={f.salary} onChange={u("salary")} onKeyDown={bE}/></Field><Row2><Field label={t.matchPctOfContrib||"Match % of contrib"}><MaskedNumInp style={INP} value={f.matchPct} onChange={u("matchPct")} min={0} max={100} onKeyDown={bE}/></Field><Field label={t.upToPctOfSalary||"Up to % of salary"}><MaskedNumInp style={INP} value={f.matchLimit} onChange={u("matchLimit")} min={0} max={25} onKeyDown={bE}/></Field></Row2><div style={{...mCARD(th),padding:10,background:th.pos+"11",marginTop:8}}><div style={{fontSize:11,color:th.muted}}>{t.employerAdds||"Employer adds"}</div><div style={{fontSize:18,fontWeight:800,color:th.pos}}>{fmt(employerMatch)}/mo</div><div style={{fontSize:11,color:th.muted}}>{t.totalInvested||"Total invested"}: <b style={{color:th.pos}}>{fmt(totalMonthly)}/mo</b></div></div></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}><div style={{...mCARD(th),padding:10}}><div style={{fontSize:11,color:th.dim,marginBottom:4}}>⏱ {t.yearsToRetirement||"Years to retirement"}</div><div style={{fontSize:20,fontWeight:800,color:GOLD}}>{years} yrs</div></div><div style={{...mCARD(th),padding:10}}><div style={{fontSize:11,color:th.dim,marginBottom:4}}>💰 {t.totalContributed||"Total contributed"}</div><div style={{fontSize:16,fontWeight:800,color:th.muted}}>{fmt(totalContrib)}</div></div><div style={{...mCARD(th),padding:10}}><div style={{fontSize:11,color:th.dim,marginBottom:4}}>📅 {t.returnsOnReturns||"Returns on returns"}</div><div style={{fontSize:16,fontWeight:800,color:th.pos}}>{fmt(proj(f.base)-totalContrib)} (base)</div></div></div><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>📊 {(t.scenarios||"Scenarios — Expected Annual Return").toUpperCase()}</div><Row2><Field label={t.worstCase||"Worst Case (%)"}><MaskedNumInp style={INP} value={f.worst} onChange={u("worst")} min={1} max={15} step="0.5" onKeyDown={bE}/></Field><Field label={t.bestCase||"Best Case (%)"}><MaskedNumInp style={INP} value={f.best} onChange={u("best")} min={1} max={20} step="0.5" onKeyDown={bE}/></Field></Row2><Field label={t.baseCase||"Base Case (%)"}><MaskedNumInp style={INP} value={f.base} onChange={u("base")} min={1} max={15} step="0.5" onKeyDown={bE}/></Field><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>{scenarios.map(s=>{const bal=proj(s.rate);const mo4pct=bal*0.04/12;const growth=bal-totalContrib;return<div key={s.l} style={{...mCARD(th),padding:14,border:`2px solid ${s.c}44`,background:s.c+"08"}}><div style={{fontSize:12,fontWeight:800,color:s.c,marginBottom:8}}>{s.l} ({s.rate}%)</div><div style={{fontSize:18,fontWeight:800,color:s.c,marginBottom:4}}>{fmt(bal)}</div><div style={{fontSize:11,color:th.muted,marginBottom:2}}>{t.growthLbl||"Growth"}: <b style={{color:s.c}}>{fmt(growth)}</b></div><div style={{fontSize:11,color:th.muted,marginBottom:2}}>{t.fourPctRule||"4% rule/mo"}: <b style={{color:s.c}}>{fmt(mo4pct)}</b></div><div style={{fontSize:10,color:th.dim}}>{t.annualIncome||"Annual income"}: {fmt(bal*0.04)}</div></div>;})} </div><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>📈 {(t.growthProjection||"Growth Projection").toUpperCase()}</div><ResponsiveContainer width="100%" height={200} style={{outline:"none"}}><AreaChart data={chartData} margin={{top:10,right:4,left:4,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke={th.cardBorder}/><XAxis dataKey="yr" tick={{fontSize:9,fill:th.dim}} axisLine={false} tickLine={false}/><YAxis hide/><ReTip contentStyle={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:8,fontSize:11}} formatter={v=>fmt(v)}/><Area type="monotone" dataKey="best" name="Best" stroke={th.pos} fill={th.pos+"22"} strokeWidth={2}/><Area type="monotone" dataKey="base" name="Base" stroke={th.accent} fill={th.accent+"22"} strokeWidth={2}/><Area type="monotone" dataKey="worst" name="Worst" stroke={th.warn} fill={th.warn+"11"} strokeWidth={2}/></AreaChart></ResponsiveContainer>
{/* v0.38.0 — ForecastCone: confidence band widens with time at base rate */}
{years>0&&<div style={{...mCARD(th),padding:14,marginTop:12}}>
  <div style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8}}>🎯 {t.forecastConeHdr||"Forecast Cone (base case ± uncertainty)"}</div>
  <ForecastCone history={fcHist} projection={fcProj} confidence={0.18} height={200} width={620}/>
</div>}
</div>;}

function PortfolioStandaloneCalc({t}){const th=useTh();const[sel,setSel]=useState("growth");const[rates,setRates]=useState({conservative:5.5,growth:8.5,aggressive:11.0});const[monthly,setMonthly]=useState(500);const[initial,setInitial]=useState(0);const[years,setYears]=useState(10);const[showH,setShowH]=useState({});const INP=mINP(th);const port=PORTFOLIOS[sel];const ret=rates[sel]||8.5;const r=ret/100/12;const nY=years*12;const baseH=port.holdings.map(h=>({...h}));const fv=(initial>0?initial*Math.pow(1+r,nY):0)+(monthly>0?monthly*((Math.pow(1+r,nY)-1)/r):0);const contrib=initial+monthly*nY;// v0.54 (PR 8) — chartData now carries nominal + inflation-adjusted (3% real).
// Nominal = gold area + solid stroke. Real = gray dashed, no fill.
const INFL=0.03;
const chartData=[];for(let y=1;y<=years;y++){const n2=y*12;const v=(initial>0?initial*Math.pow(1+r,n2):0)+(monthly>0?monthly*((Math.pow(1+r,n2)-1)/r):0);const real=v/Math.pow(1+INFL,y);chartData.push({year:"Yr "+y,value:Math.round(v),real:Math.round(real),contrib:Math.round(initial+monthly*n2)});}const saveRates=()=>{};return<div><div data-ga-grid="portfolios" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>{Object.entries(PORTFOLIOS).map(([k,p])=><div key={k} onClick={()=>setSel(k)} style={{...mCARD(th),padding:14,cursor:"pointer",background:sel===k?p.color+"22":th.card,border:`1px solid ${sel===k?p.color:th.cardBorder}`}}><div style={{fontSize:11,fontWeight:700,color:sel===k?p.color:th.muted,marginBottom:4}}>{t["capitalLabel"+p.nameKey.charAt(0).toUpperCase()+p.nameKey.slice(1)]||p.nameKey.toUpperCase()}</div><div style={{display:"flex",alignItems:"center",gap:4}}><MaskedNumInp value={rates[k]} min={0} max={30} step="0.5" onChange={e=>{e.stopPropagation();setRates(r=>({...r,[k]:+e.target.value||0}));}} onClick={e=>e.stopPropagation()} style={{...mIIN(th),width:44,textAlign:"center",fontWeight:800,fontSize:16,color:sel===k?p.color:th.dim}}/><span style={{fontSize:13,color:sel===k?p.color:th.dim}}>%</span></div><Pill color={p.color}>{p.risk} {t.riskSuffix||"Risk"}</Pill></div>)}</div><div data-ga-grid="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}><div><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>📋 {(t.holdingsHdr||"Holdings").toUpperCase()} — {t[port.nameKey]||port.nameKey}</div>{baseH.map((h,i)=>{const tm=TICKER_META[h.ticker];const dollarAmt=Math.max(0,monthly)*(h.pct/100);return<div key={h.ticker} style={{...mCARD(th),padding:"7px 12px",marginBottom:5}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><span style={{fontSize:12,fontWeight:700,color:PC[i%PC.length]}}>{h.ticker}</span><span style={{fontSize:11,color:th.muted,marginLeft:6}}>{tm?.name||h.name}</span></div><div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:700,color:PC[i%PC.length]}}>{h.pct}%</div>{dollarAmt>0&&<div style={{fontSize:10,color:th.dim,fontWeight:600}}>{fmtD(dollarAmt)}/mo</div>}</div></div>{tm?.desc&&<div style={{fontSize:10,color:th.dim,marginTop:3,fontStyle:"italic"}}>{tm.desc}</div>}</div>;})}</div><div><div style={{...mCARD(th),padding:14,marginBottom:10}}><Field label={t.initialInvestment||"Initial Investment ($)"}><MaskedNumInp style={INP} value={initial} onChange={e=>setInitial(+e.target.value||0)} onKeyDown={bE}/></Field><Field label={t.monthlyInvest+" ($)"}><MaskedNumInp style={INP} value={monthly} onChange={e=>setMonthly(+e.target.value||0)} onKeyDown={bE}/></Field><div style={{marginBottom:14}}><label style={{fontSize:11,color:th.muted,display:"block",marginBottom:5}}>{t.years||"Years"}: <b>{years}</b></label><input type="range" min={1} max={40} step={1} value={years} onChange={e=>setYears(+e.target.value)} style={{width:"100%",accentColor:th.accent,cursor:"pointer"}}/></div><div style={{...mCARD(th),padding:12}}><CalcRow label={`${t.futureValue||"Future Value"} (${years}${t.yearsAbbr||"yr"} @ ${ret}%)`} value={fmt(fv)} color={th.accent} big/><CalcRow label={t.totalContrib||"Total Contributed"} value={fmt(contrib)} color={th.muted}/><CalcRow label={t.investmentGrowth||"Investment Growth"} value={"+"+fmt(fv-contrib)} color={th.pos}/></div></div><ResponsiveContainer width="100%" height={220} style={{outline:"none"}}><AreaChart data={chartData} margin={{top:14,right:28,left:0,bottom:0}}>
  <defs>
    <linearGradient id="pf-nominal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={GOLD} stopOpacity="0.40"/>
      <stop offset="100%" stopColor={GOLD} stopOpacity="0"/>
    </linearGradient>
  </defs>
  <CartesianGrid strokeDasharray="2 4" stroke={th.cardBorder} vertical={false}/>
  <XAxis dataKey="year" tick={{fontSize:10,fill:th.dim,fontFamily:"'JetBrains Mono',monospace"}} axisLine={false} tickLine={false}/>
  <YAxis tick={{fontSize:9,fill:th.dim,fontFamily:"'JetBrains Mono',monospace"}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?Math.round(v/1000)+"K":v}/>
  <ReTip contentStyle={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:8,fontSize:11}} formatter={(v,n)=>[fmt(v),n==="value"?(t.nominalLbl||"Nominal"):(t.realLbl||"Inflation-adjusted")]}/>
  <Area type="monotone" dataKey="value" name="value" stroke={GOLD} fill="url(#pf-nominal)" strokeWidth={2.25} dot={false} activeDot={{r:3.5,fill:GOLD,stroke:"#111827",strokeWidth:0.8}}/>
  <Area type="monotone" dataKey="real" name="real" stroke="#94A3B8" fill="none" strokeWidth={1.5} strokeDasharray="4 3" dot={false} activeDot={{r:2.5,fill:"#94A3B8",stroke:"none"}}/>
</AreaChart></ResponsiveContainer>
<div style={{display:"flex",gap:14,paddingTop:10,marginTop:10,borderTop:`1px solid ${th.cardBorder}`,fontSize:10,color:th.muted}}>
  <span style={{display:"inline-flex",alignItems:"center",gap:5}}><span style={{width:8,height:8,borderRadius:99,background:GOLD}}/>{t.nominalLbl||"Nominal"} <span style={{fontFamily:"'JetBrains Mono',monospace",color:GOLD,marginLeft:4,fontWeight:700}}>{fmt(fv)}</span></span>
  <span style={{display:"inline-flex",alignItems:"center",gap:5}}><span style={{width:14,height:2,borderTop:"1.5px dashed #94A3B8"}}/>{t.realLbl||"Real (3% infl)"} <span style={{fontFamily:"'JetBrains Mono',monospace",color:"#94A3B8",marginLeft:4,fontWeight:700}}>{fmt(fv/Math.pow(1+INFL,years))}</span></span>
</div></div></div></div>;}

function CalculatorsPage({t,activeCalc,onActiveChange}){const th=useTh();const[active,setActive]=useState(activeCalc||null);useEffect(()=>{const next=activeCalc||null;if(next!==active)setActive(next);},[activeCalc]);const calcs=[{id:"retirement",label:(t.calcRetirementPlanner||"🎯 Retirement Planner"),C:RetirementCalc},{id:"portfolio",label:(t.calcPortfolioCalc||"📈 Portfolio Calculator"),C:PortfolioStandaloneCalc},{id:"homeEquity",label:(t.calcHomeCalc||"🏠 Home Calculator"),C:HomeEquityCalc},{id:"income",label:(t.calcIncomeCalc||"💰 Income Calculator"),C:IncomeCalc},{id:"debtReduction",label:(t.calcDebtReduction||"📉 Debt Reduction"),C:DebtReductionCalc},{id:"carLoan",label:(t.calcCarLoan||"🚗 Car Loan"),C:CarLoanCalc},{id:"affordability",label:(t.calcAffordability||"🏡 Affordability"),C:AffordabilityCalc},{id:"interest",label:(t.calcInterestCalc||"📊 Interest Calculator"),C:InterestCalc},{id:"savings",label:(t.calcHySavings||"💎 High Yield Savings"),C:SavingsCalc}];if(active){const calc=calcs.find(c=>c.id===active);if(!calc){// v0.13.1 — URL pointed at an unknown calculator id; bounce to the picker silently
if(activeCalc)onActiveChange?.(null);return null;}const Comp=calc.C;return<div style={{padding:"24px 14px"}}><button onClick={()=>{setActive(null);onActiveChange?.(null);}} style={{fontSize:12,padding:"5px 12px",borderRadius:8,background:th.inp,color:th.muted,border:`1px solid ${th.cardBorder}`,cursor:"pointer",marginBottom:16}}>{t.back}</button><h2 style={{fontSize:16,fontWeight:800,color:th.text,marginBottom:20,marginTop:0}}>{stripLeadEmoji(calc.label)}</h2><div style={{maxWidth:900}}><Comp t={t}/></div></div>;}
// v0.56 — calc grid tile size bumped again per Mauricio's "still too small"
// feedback. Was minmax(220, 1fr) with 104px minHeight reading as a wall of
// thin cards. Now minmax(300, 1fr) + 130px minHeight + 16/18 padding +
// 32px icon. Fewer tiles per row, each one feels substantial.
const ICONS={retirement:PiggyBank,portfolio:TrendingUp,homeEquity:Home,income:Wallet,debtReduction:TrendingDown,carLoan:Car,affordability:KeyRound,interest:Percent,savings:Gem};
  const DESCS={retirement:t.descRetirement||"Project your retirement savings to a target age.",portfolio:t.descPortfolio||"Estimate long-term portfolio growth.",savings:t.descSavings||"See how high-yield savings compound.",interest:t.descInterest||"Compound interest on any balance.",debtReduction:t.descDebtReduction||"Compare avalanche vs snowball payoff.",carLoan:t.descCarLoan||"Monthly payment, interest, and amortization.",homeEquity:t.descHomeEquity||"Equity, refinance, and borrowing power.",affordability:t.descAffordability||"How much home you can afford.",income:t.descIncomeCalc||"Take-home pay after taxes."};
  const CATS=[{title:t.calcCatPlan||"Plan & grow",ids:["retirement","portfolio","savings","interest"]},{title:t.calcCatDebt||"Tackle debt",ids:["debtReduction","carLoan"]},{title:t.calcCatHome||"Home & affordability",ids:["homeEquity","affordability"]},{title:t.calcCatIncome||"Income",ids:["income"]}];
  return<div className="ga-np" style={{padding:"24px 20px",maxWidth:1100,margin:"0 auto"}}>
    <div style={{marginBottom:28}}>
      <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.18em",color:th.dim,fontFamily:"'JetBrains Mono',ui-monospace,monospace",marginBottom:9,textTransform:"uppercase"}}>{t.calcEyebrow||"Tools"}</div>
      <h1 style={{margin:"0 0 9px",fontSize:27,fontWeight:800,letterSpacing:"-0.02em",color:th.text}}>{t.calculators||"Calculators"}</h1>
      <p style={{fontSize:13,color:th.muted,lineHeight:1.6,maxWidth:560,margin:0}}>{t.financialCalcDesc||"Financial calculators for planning."}</p>
    </div>
    {CATS.map(cat=><div key={cat.title} style={{marginBottom:24}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}><span style={{fontSize:10.5,fontWeight:600,letterSpacing:"0.14em",color:th.dim,fontFamily:"'JetBrains Mono',ui-monospace,monospace",textTransform:"uppercase",whiteSpace:"nowrap"}}>{cat.title}</span><div style={{flex:1,height:1,background:th.cardBorder}}/></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
        {cat.ids.map(id=>{const c=calcs.find(x=>x.id===id);if(!c)return null;const Ic=ICONS[id];return<div key={id} className="ga-lift ga-spot" onClick={()=>{setActive(id);onActiveChange?.(id);}} style={{...mCARD(th),padding:18,cursor:"pointer",display:"flex",flexDirection:"column",gap:13,minHeight:152}}>
          <div style={{width:44,height:44,borderRadius:12,background:th.accent+"12",border:"1px solid "+th.accent+"26",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ic?<Ic size={21} strokeWidth={1.6} color={th.accent}/>:null}</div>
          <div style={{flex:1}}><div style={{fontSize:14.5,fontWeight:700,color:th.text,marginBottom:5,lineHeight:1.3}}>{stripLeadEmoji(c.label)}</div><div style={{fontSize:12,color:th.muted,lineHeight:1.55}}>{DESCS[id]||""}</div></div>
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,fontWeight:600,color:th.accent}}>{t.calcOpen||"Open"} <span>→</span></div>
        </div>;})}
      </div>
    </div>)}
  </div>;
}


export { AffordabilityCalc, AmortTablePaginated, CalculatorsPage, CarLoanCalc, DebtReductionCalc, EquityTablePaginated, HomeEquityCalc, IncomeCalc, InterestCalc, PortfolioStandaloneCalc, RetirementCalc, STD_DED, SavingsCalc, TAX_BRACKETS, calcFedTax, getBracket };
