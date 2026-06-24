// Dashboard chart-customization UI — extracted from App.jsx in Phase 2 of
// docs/ARCHITECTURE-PLAN.md (D-37). Verbatim from the single-file era.
import { useEffect, useRef, useState } from "react";
import { Legend, Line } from "recharts";
import { ChartConfigCtx, useTh } from "../contexts/theme";
import { GOLD, mINP } from "../styles/theme";
import { AmortizationArea, BulletChart, Donut, Dumbbell, ForecastCone, GroupedYoY, HeatmapCalendar, NetWorthBridge, PayoffProgression, Radar5, RadialGauge, RankedHBars, Sankey, SlopeGraph, SmoothAreaLine, Sparkline, StackedBars, Sunburst, Treemap, Waterfall } from "./charts";
import { BSolid, Modal, useViewport } from "./primitives";

export function ChartGalleryCard({name,status,desc,th,t,templateId,onEdit,isCustomized,density="comfortable",children}){
  const isNew=status==="new";
  const compact=density==="compact";
  // v0.54 (PR 4) — card respects density toggle. Comfortable 220px min,
  // compact 180px; padding tightens to 12 14 14 per spec.
  return<div style={{background:th.card,border:`1px solid ${isCustomized?GOLD+"66":th.cardBorder}`,borderRadius:10,padding:compact?"10px 12px 12px":"12px 14px 14px",display:"flex",flexDirection:"column",gap:compact?6:8,minHeight:compact?180:220,overflow:"hidden",position:"relative"}}>
    <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:8}}>
      <div style={{fontSize:compact?9:10,fontWeight:700,color:GOLD,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',ui-monospace,Menlo,monospace"}}>{name}</div>
      <div style={{display:"flex",gap:5,alignItems:"center",flexShrink:0}}>
        {templateId&&<button onClick={()=>onEdit?.(templateId)} title={t.chartEditTip||"Edit colors, stroke, labels"} style={{fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:99,letterSpacing:"0.06em",textTransform:"uppercase",background:isCustomized?GOLD+"33":"transparent",color:GOLD,border:`1px solid ${GOLD}66`,cursor:"pointer",whiteSpace:"nowrap",lineHeight:1}}>✏️ {isCustomized?(t.chartEdited||"Edited"):(t.chartEdit||"Edit")}</button>}
        <span style={{fontSize:8,fontWeight:700,padding:"2px 7px",borderRadius:99,letterSpacing:"0.08em",textTransform:"uppercase",background:isNew?"#F59E0B22":GOLD+"22",color:isNew?"#F59E0B":GOLD,border:`1px solid ${isNew?"#F59E0B66":GOLD+"66"}`,whiteSpace:"nowrap"}}>{isNew?(t.chartGalleryNew||"New"):(t.chartGalleryWired||"Wired")}</span>
      </div>
    </div>
    {!compact&&<div style={{fontSize:10,color:th.muted,lineHeight:1.45,minHeight:28}}>{desc}</div>}
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",minHeight:compact?100:130,width:"100%"}}>{children}</div>
  </div>;
}

// v0.54 (PR 4) — chart family categorization for the gallery filter chips.
const _chartCategory=name=>{
  const s=String(name||"").toLowerCase();
  if(s.includes("smootharea")||s.includes("sparkline")||s.includes("amortization"))return"trends";
  if(s.includes("donut")||s.includes("sunburst")||s.includes("treemap")||s.includes("sankey")||s.includes("heatmap"))return"composition";
  if(s.includes("ranked")||s.includes("bullet")||s.includes("dumbbell")||s.includes("slope")||s.includes("yoy")||s.includes("stacked"))return"ranking";
  if(s.includes("payoff")||s.includes("bridge"))return"progress";
  return"advanced";
};

/* v0.48.0 — ChartEditModal: per-template editor. Reads & writes
   settings.chartCustomizations[templateId]. Color pickers, stroke slider,
   label inputs. Changes propagate live via ChartConfigCtx. */
export function ChartEditModal({templateId,defaults,settings,onSave,onClose,t}){
  const th=useTh();
  const current=settings.chartCustomizations?.[templateId]||{};
  const colorSlots=Object.keys(defaults?.colors||{});
  const labelSlots=Object.keys(defaults?.legendLabels||{});
  const merged={
    displayName:current.displayName||defaults?.displayName||templateId,
    colors:{...(defaults?.colors||{}),...(current.colors||{})},
    strokeWidth:current.strokeWidth??defaults?.strokeWidth??1.75,
    legendLabels:{...(defaults?.legendLabels||{}),...(current.legendLabels||{})},
  };
  const[form,setForm]=useState(merged);
  const skipFirst=useRef(true);
  const setColor=(k,v)=>setForm(f=>({...f,colors:{...f.colors,[k]:v}}));
  const setLabel=(k,v)=>setForm(f=>({...f,legendLabels:{...f.legendLabels,[k]:v}}));
  const reset=()=>{
    const cust2={...(settings.chartCustomizations||{})};
    delete cust2[templateId];
    onSave({...settings,chartCustomizations:cust2});
    skipFirst.current=true;// don't immediately re-write defaults
    setForm(merged);
  };
  const INP=mINP(th);
  // Auto-apply on every edit (after first render) so the user sees changes
  // live in the gallery behind the modal. First render is skipped so opening
  // the editor doesn't mark a template as "Edited" just by mounting.
  useEffect(()=>{
    if(skipFirst.current){skipFirst.current=false;return;}
    const cust2={...(settings.chartCustomizations||{})};
    cust2[templateId]={...form};
    onSave({...settings,chartCustomizations:cust2});
  },[form]);
  return<Modal title={"✏️ "+(t.chartEditHdr||"Edit Chart")+" — "+(form.displayName||templateId)} onClose={onClose} width={520}>
    <div style={{fontSize:11,color:th.muted,marginBottom:14,lineHeight:1.6}}>{t.chartEditBlurb||"Changes save and apply automatically. They propagate to every place this chart appears (Client headers, Dashboard slots, gallery)."}</div>
    <label style={{display:"block",marginBottom:14}}>
      <div style={{fontSize:11,fontWeight:600,color:th.muted,marginBottom:5,letterSpacing:"0.04em",textTransform:"uppercase"}}>{t.chartEditNameLbl||"Display Name"}</div>
      <input style={INP} value={form.displayName||""} onChange={e=>setForm(f=>({...f,displayName:e.target.value}))}/>
    </label>
    {colorSlots.length>0&&<div style={{marginBottom:14}}>
      <div style={{fontSize:11,fontWeight:600,color:th.muted,marginBottom:8,letterSpacing:"0.04em",textTransform:"uppercase"}}>{t.chartEditColorsLbl||"Colors"}</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {colorSlots.map(k=><div key={k} style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:11,color:th.muted,flex:"0 0 90px",textTransform:"capitalize"}}>{form.legendLabels?.[k]||k}</span>
          <input type="color" value={form.colors[k]||"#000000"} onChange={e=>setColor(k,e.target.value)} style={{width:36,height:30,cursor:"pointer",border:"none",borderRadius:6,padding:0}}/>
          <input value={form.colors[k]||""} onChange={e=>setColor(k,e.target.value)} style={{...INP,fontFamily:"'JetBrains Mono',monospace",fontSize:11,width:100}}/>
        </div>)}
      </div>
    </div>}
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}>
        <div style={{fontSize:11,fontWeight:600,color:th.muted,letterSpacing:"0.04em",textTransform:"uppercase"}}>{t.chartEditStrokeLbl||"Line Thickness"}</div>
        <div style={{fontSize:11,fontWeight:700,color:GOLD,fontFamily:"'JetBrains Mono',monospace"}}>{form.strokeWidth.toFixed(2)}px</div>
      </div>
      <input type="range" min="0.5" max="4" step="0.25" value={form.strokeWidth} onChange={e=>setForm(f=>({...f,strokeWidth:+e.target.value}))} style={{width:"100%",accentColor:GOLD,cursor:"pointer"}}/>
    </div>
    {labelSlots.length>0&&<div style={{marginBottom:14}}>
      <div style={{fontSize:11,fontWeight:600,color:th.muted,marginBottom:8,letterSpacing:"0.04em",textTransform:"uppercase"}}>{t.chartEditLabelsLbl||"Legend Labels"}</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {labelSlots.map(k=><div key={k} style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:11,color:th.muted,flex:"0 0 90px",textTransform:"capitalize"}}>{k}</span>
          <input style={INP} value={form.legendLabels[k]||""} onChange={e=>setLabel(k,e.target.value)}/>
        </div>)}
      </div>
    </div>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:18,paddingTop:14,borderTop:`1px solid ${th.cardBorder}`}}>
      <button onClick={reset} style={{fontSize:11,padding:"7px 14px",borderRadius:8,background:"transparent",color:th.neg,border:`1px solid ${th.neg}55`,cursor:"pointer"}}>{t.chartEditReset||"Reset to Default"}</button>
      <BSolid onClick={onClose}>{t.done||"Done"}</BSolid>
    </div>
  </Modal>;
}

export function ChartSettingsModal({settings,onSave,onClose,t}){
  const th=useTh();
  const{isMobile}=useViewport();
  const slots=(settings.dashboardSlots||["incomeVsSpending","sankey","netWorthDonut"]).slice(0,3);
  while(slots.length<3)slots.push(["incomeVsSpending","sankey","netWorthDonut"][slots.length]);
  const opts=dashChartOptions(t);
  const setSlot=(i,id)=>{const s=[...slots];s[i]=id;onSave({...settings,dashboardSlots:s});};
  const INP=mINP(th);
  // v0.48 — Per-template chart editor. Click ✏️ on any card → opens the editor.
  const[editingTid,setEditingTid]=useState(null);
  // Defaults registry: per templateId, what knobs are available + their defaults.
  const TEMPLATE_DEFAULTS={
    "smoothAreaLine.debtVsSavings":{displayName:t.debtVsSavingsSlot||"Debt vs Savings Trend",colors:{primary:"#EF4444",secondary:"#10B981"},strokeWidth:1.75,legendLabels:{primary:"Debt",secondary:"Savings"}},
    "smoothAreaLine.cashFlowTrend":{displayName:t.cashFlowTrendSlot||"Cash Flow Trend",colors:{primary:"#10B981",secondary:GOLD},strokeWidth:1.75,legendLabels:{primary:"Cash Flow",secondary:"Income"}},
  };
  const cust=settings.chartCustomizations||{};
  // Sample data, common to all cards. Amanda-Chen-style numbers.
  const heatmapData=(()=>{const out=[];[2024,2025,2026].forEach(y=>{for(let m=1;m<=12;m++){if(y===2026&&m>5)continue;out.push({year:y,month:m,value:1800+Math.round(Math.abs(Math.sin(m*0.7+y*1.3))*1600)+(y-2024)*220});}});return out;})();
  const gallery=[
    {name:"Sparkline",status:"wired",desc:"Tiny trend lines for KPI tiles. No axes.",render:()=><div style={{width:"100%",maxWidth:280,display:"flex",flexDirection:"column",gap:8}}>
      {[
        ["Net worth",[18,22,21,26,28,30,34,38,42,48],th.pos,"$48K"],
        ["Debt",[42,40,38,36,34,32,30,28,26,22],th.neg,"$22K"],
        ["Liquid mo.",[3.2,3.8,4.1,5.0,5.8,6.4,7.1,7.6,8.0],GOLD,"8.0"],
      ].map(([l,d,c,v],i)=><div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,fontSize:11}}>
        <span style={{color:th.dim,flex:"0 0 70px"}}>{l}</span>
        <Sparkline data={d} color={c} width={120} height={22}/>
        <span style={{color:c,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,minWidth:50,textAlign:"right"}}>{v}</span>
      </div>)}
    </div>},
    {name:"RadialGauge",status:"wired",desc:"Single-value arc gauge with target marker.",render:()=><RadialGauge value={68} max={100} target={75} size={150} label="HEALTH" subLabel="Strong" thresholds={[0.6,0.4]} direction="higher"/>},
    {name:"BulletChart",status:"wired",desc:"Tufte-style goal progress with target tick.",render:()=><div style={{width:"100%",maxWidth:320,display:"flex",flexDirection:"column",gap:14}}>
      <BulletChart value={4200} target={6000} max={10000} label="Emergency Fund" sublabel="3.5 of 6 mo" width={320}/>
      <BulletChart value={2800} target={2500} max={5000} label="Monthly Save" sublabel="112% of $2.5K goal" color="#10B981" width={320}/>
    </div>},
    {name:"Donut",status:"wired",desc:"Composition by slice. Center label/value.",render:()=><Donut size={150} centerLabel="Net Worth" centerValue="$28.1K" data={[
      {label:"Retirement",value:22000,color:"#8B5CF6"},
      {label:"Brokerage",value:22000,color:"#10B981"},
      {label:"Savings",value:12000,color:"#06B6D4"},
      {label:"Checking",value:3800,color:"#3B82F6"},
    ]}/>},
    {name:"Treemap",status:"wired",desc:"Proportional rectangles. Bigger = more $.",render:()=><Treemap width={400} height={180} data={[
      {label:"Mortgage",value:285000,color:"#DC2626"},
      {label:"Auto",value:24000,color:"#F97316"},
      {label:"Student",value:18000,color:"#3B82F6"},
      {label:"Cards",value:8400,color:"#EF4444"},
      {label:"Personal",value:3200,color:"#F59E0B"},
    ]}/>},
    {name:"Sunburst",status:"new",desc:"Nested radial — parent groups + children. Asset-map candidate.",render:()=><Sunburst size={210} data={[
      {label:"Cash",color:"#06B6D4",children:[
        {label:"Checking",value:3800,color:"#3B82F6"},
        {label:"Savings",value:12000,color:"#06B6D4"},
      ]},
      {label:"Investments",color:"#8B5CF6",children:[
        {label:"401k",value:18000,color:"#8B5CF6"},
        {label:"IRA",value:4000,color:"#A78BFA"},
        {label:"Brokerage",value:22000,color:"#10B981"},
      ]},
    ]}/>},
    {name:"RankedHBars",status:"wired",desc:"Horizontal bars sorted high → low. Debt by balance.",render:()=><RankedHBars width={400} data={[
      {label:"Mortgage",value:285000,color:"#DC2626"},
      {label:"Auto Loan",value:24000,color:"#F97316"},
      {label:"Student Loan",value:18000,color:"#3B82F6"},
      {label:"Chase Card",value:5200,color:"#EF4444"},
      {label:"Capital One",value:3200,color:"#EF4444"},
    ]}/>},
    {name:"Waterfall",status:"wired",desc:"Stepwise cash-flow walk. Income → minus → free.",render:()=><Waterfall width={420} height={160} segments={[
      {label:"Income",value:9600,color:"#10B981"},
      {label:"Bills",value:-1985,color:"#EF4444"},
      {label:"Min Debt",value:-450,color:"#EF4444"},
      {label:"Savings",value:-1500,color:"#F59E0B"},
      {label:"Free",value:5665,kind:"total"},
    ]}/>},
    // v0.54 (PR 4) — Sankey card removed from gallery per Mauricio's
    // "besides the Sankey i like the rest" + HANDOFF-v0.46 "Sankey removed
    // (20→19)". Component stays available as a Dashboard slot option, just
    // not in the gallery audit grid.
    {name:"SmoothAreaLine — Debt vs Savings",status:"wired",templateId:"smoothAreaLine.debtVsSavings",desc:"Two-curve area trend. Red = debt, Green = savings. Used on every Client header.",render:()=><SmoothAreaLine height={160} debtColor="#EF4444" savingsColor="#10B981" templateId="smoothAreaLine.debtVsSavings" legendDebt="Debt" legendSav="Savings" data={[
      {label:"Dec",debt:38000,savings:9000},
      {label:"Jan",debt:35500,savings:11500},
      {label:"Feb",debt:33000,savings:14500},
      {label:"Mar",debt:30000,savings:17000},
      {label:"Apr",debt:27500,savings:21000},
      {label:"▶ Now",debt:25000,savings:24500},
    ]}/>},
    {name:"SmoothAreaLine — Cash Flow Trend",status:"wired",templateId:"smoothAreaLine.cashFlowTrend",desc:"Same component, different signal. Green = cash flow, Gold = income.",render:()=><SmoothAreaLine height={160} debtColor="#10B981" savingsColor={GOLD} debtKey="cashFlow" savingsKey="income" templateId="smoothAreaLine.cashFlowTrend" legendDebt="Cash Flow" legendSav="Income" data={[
      {label:"Dec",cashFlow:1850,income:7200},
      {label:"Jan",cashFlow:2100,income:7400},
      {label:"Feb",cashFlow:2950,income:7800},
      {label:"Mar",cashFlow:3400,income:8100},
      {label:"Apr",cashFlow:4200,income:8400},
      {label:"▶ Now",cashFlow:5165,income:9600},
    ]}/>},
    {name:"Radar5",status:"wired",desc:"5-axis radar. Financial Health Score.",render:()=><Radar5 size={220} axes={["DSR","Save Rate","EF","D/A","Cash Flow"]} values={[0.68,0.55,0.82,0.40,0.72]}/>},
    {name:"SlopeGraph",status:"new",desc:"Tufte slope — period-over-period. Last month vs this month.",render:()=><SlopeGraph height={210} leftLabel="Apr" rightLabel="May" data={[
      {label:"Net Worth",a:42000,b:48000,color:GOLD},
      {label:"Savings",a:21000,b:24500,color:"#10B981"},
      {label:"Auto Loan",a:24600,b:24000,color:"#F97316"},
      {label:"Cards",a:8800,b:8400,color:"#EF4444"},
      {label:"Mortgage",a:286000,b:285200,color:"#DC2626"},
    ]}/>},
    {name:"Dumbbell",status:"new",desc:"Before/after rows. Auto-colors green if decreasing.",render:()=><Dumbbell width={400} leftLabel="Was" rightLabel="Now" data={[
      {label:"Chase Card",a:6800,b:5200},
      {label:"Cap One",a:4400,b:3200},
      {label:"Auto Loan",a:24600,b:24000},
      {label:"Savings",a:21000,b:24500},
    ]}/>},
    {name:"GroupedYoY",status:"wired",desc:"Current year vs prior year per category.",render:()=><GroupedYoY width={400} curLabel="2026" priorLabel="2025" data={[
      {label:"Housing",current:18000,prior:17400},
      {label:"Food",current:7200,prior:6500},
      {label:"Auto",current:5800,prior:6200},
      {label:"Travel",current:3200,prior:2100},
      {label:"Other",current:4800,prior:4500},
    ]}/>},
    {name:"StackedBars",status:"wired",desc:"Stacked categories across periods.",render:()=><StackedBars width={400} height={170} data={[
      {label:"Jan",rent:1500,food:600,utility:240},
      {label:"Feb",rent:1500,food:680,utility:255},
      {label:"Mar",rent:1500,food:520,utility:200},
      {label:"Apr",rent:1500,food:710,utility:220},
      {label:"May",rent:1500,food:640,utility:260},
    ]} categories={["rent","food","utility"]} colors={{rent:"#3B82F6",food:"#F59E0B",utility:"#10B981"}}/>},
    {name:"NetWorthBridge",status:"wired",desc:"Assets above zero, liabilities below.",render:()=><NetWorthBridge width={400} height={180} data={[
      {label:"Jan",assets:{checking:3000,savings:8000,retirement:14000,investments:18000},liabilities:{cards:6500,auto:25000,mortgage:290000}},
      {label:"Feb",assets:{checking:3200,savings:9500,retirement:15500,investments:19000},liabilities:{cards:5800,auto:24800,mortgage:289000}},
      {label:"Mar",assets:{checking:3400,savings:11000,retirement:16800,investments:21000},liabilities:{cards:5000,auto:24400,mortgage:288000}},
      {label:"Apr",assets:{checking:3600,savings:12500,retirement:18000,investments:21500},liabilities:{cards:4400,auto:24000,mortgage:287000}},
      {label:"May",assets:{checking:3800,savings:14000,retirement:19000,investments:22500},liabilities:{cards:3600,auto:23500,mortgage:286000}},
    ]}/>},
    {name:"PayoffProgression",status:"wired",desc:"Stacked payoff timeline projection.",render:()=><PayoffProgression width={400} height={160} extraPay={300} debts={[
      {name:"Chase",balance:5200,apr:24.99,min:130,color:"#EF4444"},
      {name:"Cap One",balance:3200,apr:21.99,min:80,color:"#F97316"},
      {name:"Student",balance:18000,apr:6.5,min:220,color:"#3B82F6"},
    ]}/>},
    {name:"AmortizationArea",status:"wired",desc:"Loan balance dropping over the term.",render:()=><AmortizationArea width={400} height={150} principal={28000} apr={6.99} termMonths={60}/>},
    {name:"ForecastCone",status:"wired",desc:"History solid line + widening projection cone.",render:()=><ForecastCone width={400} height={160} confidence={0.18} history={[
      {label:"2022",value:18000},
      {label:"2023",value:24000},
      {label:"2024",value:34000},
      {label:"2025",value:42000},
      {label:"2026",value:48000},
    ]} projection={[
      {label:"2027",value:58000},
      {label:"2028",value:70000},
      {label:"2030",value:100000},
      {label:"2032",value:140000},
      {label:"2035",value:185000},
    ]}/>},
    {name:"HeatmapCalendar",status:"wired",desc:"Year × month intensity grid. Cream → amber.",render:()=><HeatmapCalendar width={400} height={130} data={heatmapData}/>},
  ];
  // v0.54 (PR 4) — gallery filter chips + density toggle per preview/21-charts-gallery.
  const[galleryFilter,setGalleryFilter]=useState("all");
  const[galleryDensity,setGalleryDensity]=useState("comfortable");
  const filterChips=[
    {id:"all",l:t.galFilterAll||"All"},
    {id:"trends",l:t.galFilterTrends||"Trends"},
    {id:"composition",l:t.galFilterComposition||"Composition"},
    {id:"ranking",l:t.galFilterRanking||"Ranking"},
    {id:"progress",l:t.galFilterProgress||"Progress"},
    {id:"advanced",l:t.galFilterAdvanced||"Advanced"},
  ];
  const counts=gallery.reduce((acc,c)=>{const k=_chartCategory(c.name);acc[k]=(acc[k]||0)+1;acc.all++;return acc;},{all:0});
  const visibleGallery=galleryFilter==="all"?gallery:gallery.filter(c=>_chartCategory(c.name)===galleryFilter);
  // Grid columns: 4-up ≥1280px desktop, 3-up middle, 2-up smaller, 1-up mobile.
  // Use auto-fit with minmax for responsive without media queries.
  const cardMin=galleryDensity==="compact"?220:280;
  return<Modal title={"📊 "+(t.chartSettingsHdr||"Chart Gallery")} onClose={onClose} width={1100}>
    <div style={{fontSize:11,color:th.muted,marginBottom:14,lineHeight:1.6}}>{t.chartSettingsBlurb||"Every chart available in the app, rendered with sample data. Temporary section — decide which to keep, swap, or retire."}</div>
    {/* Filter chips + density toggle row */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:14,paddingBottom:10,borderBottom:`1px solid ${th.cardBorder}`}}>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{filterChips.map(f=>{const active=galleryFilter===f.id;const ct=counts[f.id]||0;return<button key={f.id} onClick={()=>setGalleryFilter(f.id)} style={{fontSize:10,padding:"4px 10px",borderRadius:99,cursor:"pointer",background:active?GOLD+"22":"transparent",color:active?GOLD:th.muted,border:`1px solid ${active?GOLD:th.cardBorder}`,fontWeight:active?700:500,letterSpacing:"0.04em",textTransform:"uppercase",display:"inline-flex",alignItems:"center",gap:5}}>{f.l}<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:active?GOLD:th.dim,opacity:0.8}}>{ct}</span></button>;})}</div>
      <div role="tablist" aria-label={t.densityLbl||"Density"} style={{display:"flex",gap:0,background:th.bg,border:`1px solid ${th.cardBorder}`,borderRadius:6,overflow:"hidden",padding:2}}>
        {[["comfortable",t.densityComfortable||"Comfortable"],["compact",t.densityCompact||"Compact"]].map(([m,l])=><button key={m} role="tab" aria-selected={galleryDensity===m} onClick={()=>setGalleryDensity(m)} style={{background:galleryDensity===m?GOLD+"22":"transparent",border:"none",color:galleryDensity===m?GOLD:th.dim,fontFamily:"inherit",fontSize:10,fontWeight:700,letterSpacing:"0.06em",padding:"4px 9px",borderRadius:4,cursor:"pointer",textTransform:"uppercase"}}>{l}</button>)}
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":`repeat(auto-fit, minmax(${cardMin}px, 1fr))`,gap:galleryDensity==="compact"?10:12,marginBottom:20}}>
      {visibleGallery.map((c,i)=><ChartGalleryCard key={i} name={c.name} status={c.status} desc={c.desc} th={th} t={t} density={galleryDensity} templateId={c.templateId} isCustomized={c.templateId&&!!cust[c.templateId]} onEdit={tid=>setEditingTid(tid)}>{c.render()}</ChartGalleryCard>)}
    </div>
    <div style={{borderTop:`1px solid ${th.cardBorder}`,paddingTop:16,marginTop:4}}>
      <div style={{fontSize:11,fontWeight:700,color:GOLD,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10,fontFamily:"'JetBrains Mono',ui-monospace,Menlo,monospace"}}>{t.chartGallerySlotsHdr||"Dashboard Slots"}</div>
      <div style={{fontSize:10,color:th.dim,marginBottom:12,lineHeight:1.6}}>{t.chartSettingsTip||"Tip: pick which charts fill the Dashboard slots below — or use the ⚙ gear on any Dashboard card."}</div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:12}}>
        {slots.map((id,i)=><div key={i}>
          <label style={{fontSize:10,fontWeight:600,color:th.muted,display:"block",marginBottom:5,letterSpacing:"0.04em",textTransform:"uppercase"}}>{(t.dashboardSlotLbl||"Dashboard slot")+" "+(i+1)}</label>
          <select style={INP} value={id} onChange={e=>setSlot(i,e.target.value)}>{opts.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select>
        </div>)}
      </div>
    </div>
    <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:20}}><BSolid onClick={onClose}>{t.done||"Done"}</BSolid></div>
    {editingTid&&TEMPLATE_DEFAULTS[editingTid]&&<ChartEditModal templateId={editingTid} defaults={TEMPLATE_DEFAULTS[editingTid]} settings={settings} onSave={onSave} onClose={()=>setEditingTid(null)} t={t}/>}
  </Modal>;
}

/* ── v0.39.0 — DashSlotPicker: gear icon on each dashboard card; click → dropdown
   of available chart options; pick one → swap that slot's chart. ─────────── */
export function DashSlotPicker({currentId,options,onPick,th,t}){
  const[open,setOpen]=useState(false);
  return<div style={{position:"absolute",top:8,right:8,zIndex:5}}>
    <button onClick={()=>setOpen(o=>!o)} title={t?.changeChart||"Change chart"} aria-label={t?.changeChart||"Change chart"} aria-haspopup="menu" aria-expanded={open} style={{width:26,height:26,padding:0,borderRadius:6,background:open?th.accent+"22":"transparent",border:`1px solid ${open?th.accent:th.cardBorder}`,color:open?th.accent:th.dim,cursor:"pointer",fontSize:13,lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}}>⚙</button>
    {open&&<>
      <div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:9}}/>
      <div role="menu" style={{position:"absolute",top:32,right:0,minWidth:240,background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:10,padding:6,zIndex:10,boxShadow:"0 12px 40px rgba(0,0,0,0.45)"}}>
        <div style={{fontSize:9,fontWeight:700,color:th.dim,padding:"4px 8px",letterSpacing:"0.04em",textTransform:"uppercase"}}>{t?.changeChart||"Change chart"}</div>
        {options.map(o=><button key={o.id} role="menuitem" onClick={()=>{onPick(o.id);setOpen(false);}} style={{display:"block",width:"100%",textAlign:"left",padding:"7px 10px",fontSize:12,borderRadius:6,cursor:"pointer",background:o.id===currentId?th.accent+"22":"transparent",color:o.id===currentId?th.accent:th.text,border:"none",fontWeight:o.id===currentId?700:400}}>{o.label}{o.id===currentId&&<span style={{float:"right",fontSize:10}}>✓</span>}</button>)}
      </div>
    </>}
  </div>;
}

/* ── DASHBOARD ───────────────────────────────────────────────────────────── */


