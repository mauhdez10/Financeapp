// Extracted from App.jsx in Phase 1 of docs/ARCHITECTURE-PLAN.md (D-37, 2026-06-10).
// Code is verbatim from the single-file era; comments may reference old App.jsx line numbers.
import { useState, useEffect, useRef, useMemo } from "react";
import { useTh, useChartConfig } from "../contexts/theme";
import { GOLD, stripLeadEmoji } from "../styles/theme";
import { fmt } from "../utils/finance";
import { useTweenedData, useSvgId, useReducedMotion } from "../hooks/anim";

/* ── v0.35.0 — Phase 5 Charts: Donut (v0.37 tween + drop shadow) ───────────
   Pure-SVG donut chart. Slice angles tween between states; soft drop-shadow
   gives subtle depth without 3D. */
function Donut({data,size=150,innerRatio=0.65,paddingAngle=1.5,centerLabel,centerValue,centerColor,placeholder}){
  const th=useTh();
  const filtered=(Array.isArray(data)?data:[]).filter(d=>d&&(+d.value||0)>0);
  const twValues=useTweenedData(filtered.map(d=>+d.value||0),700);
  const baseId=useSvgId("donut");
  if(filtered.length===0){
    return<div style={{width:size,height:size,borderRadius:999,border:`1.5px dashed ${th.cardBorder||"#E2E8F0"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:th.dim||"#94A3B8",textAlign:"center",padding:8,lineHeight:1.3}}>{placeholder||"No data"}</div>;
  }
  const total=twValues.reduce((s,v)=>s+(+v||0),0)||1;
  const r=size/2,ir=r*innerRatio,cx=r,cy=r;
  let angle=-Math.PI/2;
  const gapRad=paddingAngle*Math.PI/180;
  const segs=filtered.map((d,i)=>{
    const frac=(twValues[i]||0)/total;
    const startA=angle+gapRad/2;
    const endA=angle+frac*2*Math.PI-gapRad/2;
    angle+=frac*2*Math.PI;
    const large=endA-startA>Math.PI?1:0;
    const x1=cx+r*Math.cos(startA),y1=cy+r*Math.sin(startA);
    const x2=cx+r*Math.cos(endA),y2=cy+r*Math.sin(endA);
    const x3=cx+ir*Math.cos(endA),y3=cy+ir*Math.sin(endA);
    const x4=cx+ir*Math.cos(startA),y4=cy+ir*Math.sin(startA);
    const path=`M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${ir} ${ir} 0 ${large} 0 ${x4} ${y4} Z`;
    return{...d,path};
  });
  return<div style={{position:"relative",width:size,height:size}}>
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{display:"block",overflow:"visible"}}>
      <defs>
        {/* v0.42 — radial gradient per slice: denser at outer rim, lighter toward center */}
        {segs.map((s,i)=><radialGradient key={i} id={`${baseId}-g${i}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stopColor={s.color} stopOpacity="0.55"/>
          <stop offset="65%" stopColor={s.color} stopOpacity="0.85"/>
          <stop offset="100%" stopColor={s.color} stopOpacity="1"/>
        </radialGradient>)}
      </defs>
      {segs.map((s,i)=><path key={i} d={s.path} fill={`url(#${baseId}-g${i})`} stroke={s.color} strokeOpacity="0.18" strokeWidth="0.5"/>)}
    </svg>
    {(centerLabel||centerValue)&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",pointerEvents:"none",textAlign:"center"}}>
      {centerLabel&&<div style={{fontSize:9,color:th.dim||"#94A3B8",letterSpacing:"0.04em",textTransform:"uppercase",fontWeight:600}}>{centerLabel}</div>}
      {centerValue&&<div style={{fontSize:size<=120?13:16,color:centerColor||GOLD,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",lineHeight:1.1,marginTop:2,fontVariantNumeric:"tabular-nums"}}>{centerValue}</div>}
    </div>}
  </div>;
}

/* ── v0.35.0 — Phase 5 Charts: Waterfall (v0.37 tween + drop shadow) ──────
   Pure-SVG cash-flow waterfall — segments stacked Income → −Bills → −Debt →
   +Save → Net. Bar heights tween between states. */
// v0.58 — per design-system/charts/MASTER.md. Critical bug from Mauricio
// Image 2: SVG had `preserveAspectRatio="none"` which non-uniformly stretched
// the text (huge tall+narrow letters in Cash Flow Statement). Removed.
// Also: default height 180→160 (less air), bar cap 36→28 (less chunky), gap
// 10→18 (more breathing room between bars). Labels switched from inherited
// JetBrains Mono to Plus Jakarta Sans uppercase; only the value text stays
// JetBrains Mono.
function Waterfall({segments,height=160,width=600,bg}){
  const th=useTh();
  bg=bg||th.card||"transparent";
  const segs=Array.isArray(segments)?segments.filter(s=>s):[];
  const twVals=useTweenedData(segs.map(s=>+s.value||0),800);
  const baseId=useSvgId("wf");
  if(segs.length===0)return<div style={{padding:14,fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center"}}>No data</div>;
  let cum=0;
  const items=segs.map((s,i)=>{
    const tv=twVals[i]||0;
    if(s.kind==="total"){
      const v=s.value!=null?tv:cum;
      return{...s,start:0,end:v,delta:v,isTotal:true};
    }
    const v=tv,start=cum,end=cum+v;
    cum=end;
    return{...s,start,end,delta:v,isTotal:false};
  });
  const minV=Math.min(0,...items.map(it=>Math.min(it.start,it.end)));
  const maxV=Math.max(...items.map(it=>Math.max(it.start,it.end)),0);
  const range=Math.max(1,maxV-minV);
  const padT=14,padB=34,padL=12,padR=12;
  const innerW=width-padL-padR,innerH=height-padT-padB;
  const gap=18;
  const barW=Math.min(28,(innerW-(items.length-1)*gap)/items.length);
  const yAt=v=>padT+innerH*(1-(v-minV)/range);
  const xAt=i=>padL+(innerW-items.length*barW-(items.length-1)*gap)/2+i*(barW+gap);
  const barColor=it=>it.isTotal?GOLD:(it.delta>=0?(it.color||GOLD):(it.color||"#ED7D31"));
  return<div style={{width:"100%",overflow:"hidden"}}>
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={{width:"100%",height:"auto",display:"block",fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}} role="img" aria-label="Cash flow waterfall">
      <defs>
        {items.map((it,i)=>{const c=barColor(it);const ascending=it.delta>=0||it.isTotal;return<linearGradient key={i} id={`${baseId}-g${i}`} x1="0" y1={ascending?"0":"1"} x2="0" y2={ascending?"1":"0"}>
          <stop offset="0%" stopColor={c} stopOpacity="0.55"/>
          <stop offset="100%" stopColor={c} stopOpacity="0.95"/>
        </linearGradient>;})}
      </defs>
      <line x1={padL} y1={yAt(0)} x2={width-padR} y2={yAt(0)} stroke={th.dim} strokeOpacity="0.28" strokeDasharray="2 4" strokeWidth="0.75"/>
      {items.map((it,i)=>{if(i===items.length-1)return null;const x1=xAt(i)+barW,x2=xAt(i+1);const yEnd=it.isTotal?yAt(0):yAt(it.end);return<line key={"c"+i} x1={x1} y1={yEnd} x2={x2} y2={yEnd} stroke={th.dim} strokeOpacity="0.4" strokeDasharray="1.5 3" strokeWidth="0.75"/>;})}
      {items.map((it,i)=>{
        const c=barColor(it);
        const y=it.isTotal?yAt(Math.max(it.end,0)):Math.min(yAt(it.start),yAt(it.end));
        const h=it.isTotal?Math.abs(yAt(it.end)-yAt(0)):Math.abs(yAt(it.end)-yAt(it.start));
        return<g key={i}>
          <rect x={xAt(i)} y={y} width={barW} height={Math.max(1,h)} fill={`url(#${baseId}-g${i})`} stroke={c} strokeOpacity="0.25" strokeWidth="0.5" rx="2"/>
          <text x={xAt(i)+barW/2} y={height-20} textAnchor="middle" fontSize="9" fontWeight="600" fill={th.muted} style={{letterSpacing:"0.04em",textTransform:"uppercase",fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>{it.label||""}</text>
          <text x={xAt(i)+barW/2} y={height-8} textAnchor="middle" fontSize="10" fontWeight="500" fill={th.text} style={{fontVariantNumeric:"tabular-nums",fontFamily:"'JetBrains Mono',ui-monospace,monospace"}}>{(it.delta>=0?"+":"")+(it.delta>=1000||it.delta<=-1000?Math.round(it.delta/1000)+"K":Math.round(it.delta))}</text>
        </g>;
      })}
    </svg>
  </div>;
}

/* ── v0.53.0 — PR 6 from HANDOFF-v0.46. Live-pair upgrade for the ClientDetail
   header trend cards. Wraps SmoothAreaLine (line mode) or PairedBars (bar mode),
   with a per-card line/bar toggle persisted to
   localStorage[`client.${id}.live-view.${templateId}`] (default "line").
   Adds a 3-cell values row below: debt · savings · crossover/net with delta
   arrows. Spec from preview/28-live-pair.html. ────────────────────────────── */
// v0.56 — PairedBars rebuilt as a Google-Sheets-style combo chart per
// Mauricio's image 4 feedback ("bar version doesn't look good, should be
// line or combined line with bar"). Bars (income/savings) on the positive
// side, mirror bars (bills/debt) on the negative side, dashed cumulative
// net line overlay. Transparent bg, no fill on the line — keeps the chart
// reading as data, not chartjunk.
function PairedBars({data,debtKey,savingsKey,debtColor,savingsColor,height=160,labelKey="label"}){
  const th=useTh();
  const pts=Array.isArray(data)?data:[];
  const tw=useTweenedData(pts.map(p=>({d:+p[debtKey]||0,s:+p[savingsKey]||0})),800);
  if(pts.length<1)return<div style={{padding:14,fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center"}}>No data</div>;
  const W=600,H=height,padL=46,padR=22,padT=14,padB=24;
  const innerW=W-padL-padR,innerH=H-padT-padB;
  const mxS=Math.max(1,...tw.map(p=>p.s));
  const mxD=Math.max(1,...tw.map(p=>p.d));
  // Symmetric scale so positive (savings/income) above zero, negative (debt/bills) below.
  const mx=Math.max(mxS,mxD);
  const slot=innerW/pts.length;
  const barW=Math.min(20,Math.max(8,slot*0.4));
  const zeroY=padT+innerH/2;
  const yPos=v=>zeroY-(v/mx)*(innerH/2);
  const yNeg=v=>zeroY+(v/mx)*(innerH/2);
  const fmtTick=v=>v>=1000?Math.round(v/1000)+"K":Math.round(v);
  // Net cumulative line (savings - debt)
  const net=tw.map(p=>p.s-p.d);
  let cumNet=0;const cum=net.map(v=>{cumNet+=v;return cumNet;});
  const cumMax=Math.max(1,...cum.map(Math.abs));
  const yCum=v=>zeroY-(v/cumMax)*(innerH/2);
  const xCenter=i=>padL+slot*i+slot/2;
  const cumPath=cum.map((v,i)=>`${i===0?"M":"L"}${xCenter(i)} ${yCum(v)}`).join(" ");
  return<div style={{width:"100%",overflow:"hidden"}}>
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{width:"100%",height:"auto",display:"block",fontFamily:"'JetBrains Mono',ui-monospace,Menlo,monospace"}}>
      {/* Zero line, heavier */}
      <line x1={padL} y1={zeroY} x2={W-padR} y2={zeroY} stroke={th.dim} strokeOpacity="0.4" strokeWidth="0.75"/>
      {/* gridlines */}
      {[0.5,1].map((tk,i)=>{const y1=zeroY-(tk)*(innerH/2);const y2=zeroY+(tk)*(innerH/2);return<g key={i}>
        <line x1={padL} y1={y1} x2={W-padR} y2={y1} stroke={th.dim} strokeOpacity="0.12" strokeDasharray="1.5 4"/>
        <line x1={padL} y1={y2} x2={W-padR} y2={y2} stroke={th.dim} strokeOpacity="0.12" strokeDasharray="1.5 4"/>
        <text x={padL-6} y={y1+3} textAnchor="end" fontSize="9" fill={th.dim} style={{fontVariantNumeric:"tabular-nums"}}>${fmtTick(mx*tk)}</text>
        <text x={padL-6} y={y2+3} textAnchor="end" fontSize="9" fill={th.dim} style={{fontVariantNumeric:"tabular-nums"}}>-${fmtTick(mx*tk)}</text>
      </g>;})}
      {/* Bars: savings above zero, debt below */}
      {pts.map((p,i)=>{
        const cx=xCenter(i);
        const x=cx-barW/2;
        const sv=tw[i]?.s||0,dv=tw[i]?.d||0;
        return<g key={i}>
          <rect x={x} y={yPos(sv)} width={barW} height={Math.max(0,zeroY-yPos(sv))} fill={savingsColor} opacity="0.85" rx="2"/>
          <rect x={x} y={zeroY} width={barW} height={Math.max(0,yNeg(dv)-zeroY)} fill={debtColor} opacity="0.85" rx="2"/>
          <text x={cx} y={H-8} textAnchor="middle" fontSize="9" fill={th.muted} style={{letterSpacing:"0.04em",textTransform:"uppercase"}}>{String(p[labelKey]||"").split(/\s|'/)[0].slice(0,3)}</text>
        </g>;
      })}
      {/* Cumulative net line overlay (dashed gold) */}
      <path d={cumPath} fill="none" stroke={GOLD} strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" opacity="0.85"/>
      {cum.map((v,i)=><circle key={i} cx={xCenter(i)} cy={yCum(v)} r="2.5" fill={GOLD}/>)}
    </svg>
  </div>;
}

function LiveTrendCard({client,trendData,debtKey,savingsKey,debtColor,savingsColor,title,templateId,leftControl,t}){
  const th=useTh();
  const persistKey=`client.${client.id}.live-view.${templateId||"default"}`;
  const[mode,setMode]=useState(()=>{try{return localStorage.getItem(persistKey)||"line";}catch{return"line";}});
  const switchMode=m=>{setMode(m);try{localStorage.setItem(persistKey,m);}catch{}};
  const last=trendData[trendData.length-1]||{};
  const first=trendData[0]||{};
  const lastDebt=+last[debtKey]||0,lastSav=+last[savingsKey]||0;
  const firstDebt=+first[debtKey]||0,firstSav=+first[savingsKey]||0;
  const debtPct=firstDebt?((lastDebt-firstDebt)/Math.abs(firstDebt)*100):0;
  const savPct=firstSav?((lastSav-firstSav)/Math.abs(firstSav)*100):0;
  // Crossover: find first pair index where (sav-debt) flips sign
  let crossLabel=null;
  for(let i=0;i<trendData.length-1;i++){
    const dA=(+trendData[i][savingsKey]||0)-(+trendData[i][debtKey]||0);
    const dB=(+trendData[i+1][savingsKey]||0)-(+trendData[i+1][debtKey]||0);
    if(dA===0&&dB===0)continue;
    if((dA<=0&&dB>=0)||(dA>=0&&dB<=0)){crossLabel=trendData[i+1].label;break;}
  }
  const isCashCard=debtKey!=="debt";
  const debtLbl=isCashCard?(t?.cashFlow||"Cash Flow"):(t?.totalDebt||"Debt");
  const savLbl=isCashCard?(t?.income||"Income"):(t?.savings||"Savings");
  const netVal=isCashCard?lastSav-lastDebt:null;
  const lineIcon=<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{width:11,height:11}}><path d="M3 18 L9 12 L13 14 L21 6"/></svg>;
  const barIcon=<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{width:11,height:11}}><rect x="4" y="14" width="3" height="6"/><rect x="10" y="9" width="3" height="11"/><rect x="16" y="4" width="3" height="16"/></svg>;
  return<div style={{minHeight:200,display:"flex",flexDirection:"column"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,gap:8,flexWrap:"wrap",rowGap:6}}>
      <span style={{fontSize:11,fontWeight:700,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",display:"inline-flex",alignItems:"center",gap:6,minWidth:0}}>
        {stripLeadEmoji(title)}
        <span style={{fontSize:9,color:th.pos,display:"inline-flex",alignItems:"center",gap:3,fontFamily:"'JetBrains Mono',monospace"}}>
          <span style={{width:5,height:5,borderRadius:99,background:th.pos,boxShadow:`0 0 0 3px ${th.pos}22`}}/>{t?.liveLbl||"LIVE"}
        </span>
      </span>
      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
        {leftControl}
        <div role="tablist" aria-label={t?.viewModeLbl||"View mode"} style={{display:"flex",gap:0,background:th.bg,border:`1px solid ${th.cardBorder}`,borderRadius:6,overflow:"hidden",padding:2}}>
          {[["line",t?.viewLine||"Line",lineIcon],["bar",t?.viewBar||"Bar",barIcon]].map(([m,lbl,icon])=>
            <button key={m} role="tab" aria-selected={mode===m} onClick={()=>switchMode(m)} style={{background:mode===m?GOLD+"22":"transparent",border:"none",color:mode===m?GOLD:th.dim,fontFamily:"inherit",fontSize:9.5,fontWeight:700,letterSpacing:"0.06em",padding:"4px 9px",borderRadius:4,cursor:"pointer",textTransform:"uppercase",display:"inline-flex",alignItems:"center",gap:4}}>
              {icon}{lbl}
            </button>
          )}
        </div>
      </div>
    </div>
    <div style={{flex:1,minHeight:130}}>
      {mode==="line"
        ? <SmoothAreaLine data={trendData} height={130} debtKey={debtKey} savingsKey={savingsKey} debtColor={debtColor} savingsColor={savingsColor} templateId={templateId}/>
        : <PairedBars data={trendData} debtKey={debtKey} savingsKey={savingsKey} debtColor={debtColor} savingsColor={savingsColor} height={130}/>
      }
    </div>
    <div style={{display:"flex",gap:14,paddingTop:8,marginTop:8,borderTop:`1px solid ${th.cardBorder}`,fontSize:10}}>
      <div style={{color:th.dim,minWidth:0}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontVariantNumeric:"tabular-nums",fontSize:14,fontWeight:700,color:debtColor,lineHeight:1.1}}>{fmt(lastDebt)}</div>
        {debtLbl} {firstDebt?<span style={{color:debtPct<=0?th.pos:th.neg,marginLeft:2}}>{debtPct<=0?"▼":"▲"} {Math.abs(debtPct).toFixed(0)}%</span>:null}
      </div>
      <div style={{color:th.dim,minWidth:0}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontVariantNumeric:"tabular-nums",fontSize:14,fontWeight:700,color:savingsColor,lineHeight:1.1}}>{fmt(lastSav)}</div>
        {savLbl} {firstSav?<span style={{color:savPct>=0?th.pos:th.neg,marginLeft:2}}>{savPct>=0?"▲":"▼"} {Math.abs(savPct).toFixed(0)}%</span>:null}
      </div>
      <div style={{marginLeft:"auto",textAlign:"right",color:th.dim,minWidth:0}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontVariantNumeric:"tabular-nums",fontSize:14,fontWeight:700,color:GOLD,lineHeight:1.1}}>{crossLabel||(netVal!=null?fmt(netVal):"—")}</div>
        {crossLabel?(t?.crossoverLbl||"Crossover"):(t?.netLbl||"Net")}
      </div>
    </div>
  </div>;
}

/* ── v0.34.0 — Phase 5 Charts: SmoothAreaLine (v0.37 tween + glow + live dot)
   Pure-SVG two-curve area chart. Numeric values tween over ~800ms so the
   curve morphs between states. Gold glow filter under the savings curve.
   Pulsing dot at the rightmost point when the last label contains "Now". */
function SmoothAreaLine({data,height=170,debtColor,savingsColor,bg,muted,dim,labelKey="label",debtKey="debt",savingsKey="savings",templateId,strokeWidth,legendDebt,legendSav}){
  const th=useTh();
  // v0.48 — pull color/stroke/legend overrides from the chart-config context.
  // Saved customizations win over explicit props so the gallery editor can
  // override per-template without code edits at the call site.
  const cfg=useChartConfig(templateId,{
    colors:{primary:debtColor||"#ED7D31",secondary:savingsColor||GOLD},
    strokeWidth:strokeWidth??1.25,/* v0.54 — leaner stroke per Mauricio's feedback (was 1.75). */
    legendLabels:{primary:legendDebt||"Debt",secondary:legendSav||"Savings"},
  });
  debtColor=cfg.colors.primary;
  savingsColor=cfg.colors.secondary;
  const sw=cfg.strokeWidth;
  bg=bg||th.card||"transparent";
  muted=muted||th.muted||"#475569";
  dim=dim||th.dim||"#94A3B8";
  const W=600,H=height,padL=46,padR=14,padT=12,padB=28;
  const pts=Array.isArray(data)?data.filter(d=>d):[];
  const reducedMotion=useReducedMotion();
  // v0.37.0 — tween the two numeric series; labels stay stable
  const twPts=useTweenedData(pts.map(p=>({d:+p[debtKey]||0,s:+p[savingsKey]||0})),reducedMotion?0:800);
  const gradId=useSvgId("sal-grad");
  const glowId=useSvgId("sal-glow");
  if(pts.length<2)return<div style={{padding:14,fontSize:11,color:dim,fontStyle:"italic",textAlign:"center"}}>{(pts.length===0?"No data yet":"Need at least 2 months of data")}</div>;
  const apts=pts.map((p,i)=>({...p,[debtKey]:twPts[i]?.d??(+p[debtKey]||0),[savingsKey]:twPts[i]?.s??(+p[savingsKey]||0)}));
  const rawMax=Math.max(0,...apts.map(p=>Math.max(+p[debtKey]||0,+p[savingsKey]||0)));
  const niceMax=(v=>{if(!v)return 1000;const e=Math.pow(10,Math.floor(Math.log10(v)));const n=v/e;const m=n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10;return m*e;})(rawMax);
  const innerW=W-padL-padR,innerH=H-padT-padB;
  const xAt=i=>padL+(apts.length===1?innerW/2:innerW*i/(apts.length-1));
  const yAt=v=>padT+innerH*(1-(v/niceMax));
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
  const savCoords=apts.map((p,i)=>({x:xAt(i),y:yAt(+p[savingsKey]||0)}));
  const debtCoords=apts.map((p,i)=>({x:xAt(i),y:yAt(+p[debtKey]||0)}));
  const ticks=[0,niceMax/3,niceMax*2/3,niceMax];
  const fmtTick=v=>{if(v>=1e6)return(v/1e6).toFixed(1).replace(/\.0$/,"")+"M";if(v>=1000)return Math.round(v/1000)+"K";return Math.round(v).toString();};
  const crossovers=[];
  for(let i=0;i<apts.length-1;i++){
    const dA=(+apts[i][savingsKey]||0)-(+apts[i][debtKey]||0),dB=(+apts[i+1][savingsKey]||0)-(+apts[i+1][debtKey]||0);
    if(dA===0&&dB===0)continue;
    if((dA<=0&&dB>=0)||(dA>=0&&dB<=0)){
      const t=Math.abs(dA)/(Math.abs(dA)+Math.abs(dB)||1);
      const x=xAt(i)+(xAt(i+1)-xAt(i))*t;
      const yMix=(+apts[i][savingsKey]||0)*(1-t)+(+apts[i+1][savingsKey]||0)*t;
      crossovers.push({x,y:yAt(yMix)});
    }
  }
  const xLabel=l=>String(l||"").split(/\s|'/)[0].slice(0,3);
  const lastLabel=String(apts[apts.length-1]?.[labelKey]||"");
  const isLive=/Now|▶/.test(lastLabel);
  const livePt=isLive?savCoords[savCoords.length-1]:null;
  const debtGradId=useSvgId("sal-dgrad");
  return<div style={{width:"100%",overflow:"hidden"}}>
    {/* v0.59 — preserveAspectRatio: none → xMidYMid meet (same text-distortion
       bug v0.58 fixed on Waterfall — labels were stretching vertically when
       the container was wide). Area gradients pulled in (0.42→0.25 / 0.22→0.15)
       for thinner, modern line-chart read per Mauricio's reference image. */}
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{width:"100%",height:"auto",display:"block",fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}} role="img" aria-label="Trend line chart">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={savingsColor} stopOpacity="0.10"/>
          <stop offset="55%" stopColor={savingsColor} stopOpacity="0.03"/>
          <stop offset="100%" stopColor={savingsColor} stopOpacity="0"/>
        </linearGradient>
        <linearGradient id={debtGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={debtColor} stopOpacity="0.06"/>
          <stop offset="100%" stopColor={debtColor} stopOpacity="0"/>
        </linearGradient>
        <linearGradient id={`${gradId}-stroke`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={savingsColor} stopOpacity="0.7"/>
          <stop offset="100%" stopColor={savingsColor} stopOpacity="1"/>
        </linearGradient>
        <linearGradient id={`${debtGradId}-stroke`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={debtColor} stopOpacity="0.7"/>
          <stop offset="100%" stopColor={debtColor} stopOpacity="1"/>
        </linearGradient>
        <filter id={glowId} x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="1.4"/>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {ticks.map((v,i)=>{const y=yAt(v);return<g key={i}>
        <line x1={padL} y1={y} x2={W-padR} y2={y} stroke={dim} strokeOpacity="0.14" strokeDasharray="1.5 4"/>
        <text x={padL-6} y={y+3} textAnchor="end" fontSize="9" fill={dim} style={{fontVariantNumeric:"tabular-nums"}}>{fmtTick(v)}</text>
      </g>;})}
      <path d={path(debtCoords,true)} fill={`url(#${debtGradId})`} stroke="none"/>
      <path d={path(savCoords,true)} fill={`url(#${gradId})`} stroke="none"/>
      {/* v0.53 (PR 6) — both lines now 1.75px (was 1.5/1.75 split). Crossover
         and live dots use #111827 stroke per handoff spec instead of #fff. */}
      <path d={path(debtCoords,false)} fill="none" stroke={`url(#${debtGradId}-stroke)`} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
      <path d={path(savCoords,false)} fill="none" stroke={`url(#${gradId}-stroke)`} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
      {/* v0.54 — smaller dots, no stroke, per Mauricio's feedback. */}
      {crossovers.map((c,i)=><g key={i}>
        <circle cx={c.x} cy={c.y} r="4" fill={GOLD} opacity="0.18"/>
        <circle cx={c.x} cy={c.y} r="2.5" fill={GOLD}/>
      </g>)}
      {livePt&&<g>
        {!reducedMotion&&<circle cx={livePt.x} cy={livePt.y} r="4" fill={savingsColor} opacity="0.4">
          <animate attributeName="r" values="4;9;4" dur="2.2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.4;0;0.4" dur="2.2s" repeatCount="indefinite"/>
        </circle>}
        <circle cx={livePt.x} cy={livePt.y} r="2" fill={savingsColor}/>
      </g>}
      {apts.map((p,i)=><text key={i} x={xAt(i)} y={H-8} textAnchor="middle" fontSize="9" fill={muted} style={{letterSpacing:"0.04em",textTransform:"uppercase"}}>{xLabel(p[labelKey])}</text>)}
    </svg>
  </div>;
}

/* ── v0.37.0 — Phase 5 Charts: Sankey ───────────────────────────────────────
   Pure-SVG sankey flow diagram. Takes nodes (each with `layer` column index)
   and links (with from/to/value) and renders proportional bands connecting
   them. Used to show cash flow — income sources → spending categories →
   savings. Link widths tween between states. */
function Sankey({nodes,links,height=320,width=720,nodeWidth=12,nodeGap=10,labelSize=10,placeholder}){
  const th=useTh();
  const safeLinks=Array.isArray(links)?links.filter(l=>l&&(+l.value||0)>0):[];
  const safeNodes=Array.isArray(nodes)?nodes:[];
  const twLinkVals=useTweenedData(safeLinks.map(l=>+l.value||0),900);
  const glowId=useSvgId("sky-glow");
  if(safeNodes.length===0||safeLinks.length===0){
    return<div style={{padding:24,fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center"}}>{placeholder||"Add income, bills, or savings to see flow"}</div>;
  }
  const layers={};
  safeNodes.forEach(n=>{(layers[n.layer]=layers[n.layer]||[]).push(n);});
  const layerKeys=Object.keys(layers).map(Number).sort((a,b)=>a-b);
  const nodeIn={},nodeOut={};
  safeLinks.forEach((l,i)=>{const v=twLinkVals[i]||0;nodeIn[l.to]=(nodeIn[l.to]||0)+v;nodeOut[l.from]=(nodeOut[l.from]||0)+v;});
  const nodeVal=id=>Math.max(nodeIn[id]||0,nodeOut[id]||0);
  const padT=18,padB=18,padL=70,padR=70;
  const innerW=width-padL-padR,innerH=height-padT-padB;
  const layerX=k=>{const i=layerKeys.indexOf(k);return padL+(layerKeys.length===1?innerW/2:innerW*i/(layerKeys.length-1))-nodeWidth/2;};
  const layerTotal=lyr=>(layers[lyr]||[]).reduce((s,n)=>s+nodeVal(n.id),0);
  const maxLayer=Math.max(1,...layerKeys.map(layerTotal));
  // Pick the layer with the most nodes for sizing gaps
  const widestLayer=layerKeys.reduce((a,b)=>(layers[a]||[]).length>(layers[b]||[]).length?a:b,layerKeys[0]);
  const widestNodeCount=(layers[widestLayer]||[]).length;
  const pxPerVal=maxLayer>0?(innerH-Math.max(0,widestNodeCount-1)*nodeGap)/maxLayer:0;
  const nodePos={};
  layerKeys.forEach(lyr=>{
    const ns=layers[lyr];
    const total=layerTotal(lyr);
    const gaps=ns.length-1;
    let y=padT+(innerH-(total*pxPerVal+gaps*nodeGap))/2;
    ns.forEach(n=>{
      const h=Math.max(2,nodeVal(n.id)*pxPerVal);
      nodePos[n.id]={x:layerX(lyr),y,h,layer:lyr,color:n.color||GOLD,label:n.label||n.id};
      y+=h+nodeGap;
    });
  });
  const linkSrcY={},linkDstY={};
  const srcCur={},dstCur={};
  safeLinks.forEach((l,i)=>{
    const v=twLinkVals[i]||0;
    const sp=nodePos[l.from],dp=nodePos[l.to];
    if(!sp||!dp)return;
    const srcY=srcCur[l.from]??sp.y;
    const srcH=nodeVal(l.from)>0?(v/nodeVal(l.from))*sp.h:0;
    srcCur[l.from]=srcY+srcH;
    const dstY=dstCur[l.to]??dp.y;
    const dstH=nodeVal(l.to)>0?(v/nodeVal(l.to))*dp.h:0;
    dstCur[l.to]=dstY+dstH;
    linkSrcY[i]={y0:srcY,y1:srcY+srcH};
    linkDstY[i]={y0:dstY,y1:dstY+dstH};
  });
  return<div style={{width:"100%",overflow:"hidden"}}>
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={{width:"100%",height:"auto",display:"block",fontFamily:"'JetBrains Mono',ui-monospace,Menlo,monospace"}}>
      <defs>
        {/* v0.42 — bolder color-transition gradients (left node tone → right node tone) */}
        {safeLinks.map((l,i)=>{
          const sp=nodePos[l.from],dp=nodePos[l.to];
          if(!sp||!dp)return null;
          return<linearGradient key={i} id={`${glowId}-lk${i}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={l.color||sp.color} stopOpacity="0.85"/>
            <stop offset="55%" stopColor={l.color||sp.color} stopOpacity="0.55"/>
            <stop offset="100%" stopColor={l.color||dp.color} stopOpacity="0.85"/>
          </linearGradient>;
        })}
        {/* Node rect gradients (vertical) */}
        {Object.entries(nodePos).map(([id,p],i)=><linearGradient key={"n"+i} id={`${glowId}-n${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.color} stopOpacity="0.95"/>
          <stop offset="100%" stopColor={p.color} stopOpacity="0.65"/>
        </linearGradient>)}
      </defs>
      {safeLinks.map((l,i)=>{
        const sp=nodePos[l.from],dp=nodePos[l.to];
        if(!sp||!dp||!linkSrcY[i])return null;
        const{y0:sy0,y1:sy1}=linkSrcY[i];
        const{y0:dy0,y1:dy1}=linkDstY[i];
        const x0=sp.x+nodeWidth,x1=dp.x;
        const mx=(x0+x1)/2;
        const d=`M${x0} ${sy0} C${mx} ${sy0} ${mx} ${dy0} ${x1} ${dy0} L${x1} ${dy1} C${mx} ${dy1} ${mx} ${sy1} ${x0} ${sy1} Z`;
        return<path key={i} d={d} fill={`url(#${glowId}-lk${i})`} stroke="none"/>;
      })}
      {Object.entries(nodePos).map(([id,p],i)=>{
        const lyr=layerKeys.indexOf(p.layer);
        const isLast=lyr===layerKeys.length-1;
        const lblX=isLast?(p.x-6):(p.x+nodeWidth+6);
        const lblAnchor=isLast?"end":"start";
        const v=nodeVal(id);
        const valStr=v>=1e6?(v/1e6).toFixed(1).replace(/\.0$/,"")+"M":v>=1000?Math.round(v/100)/10+"K":Math.round(v);
        return<g key={id}>
          <rect x={p.x} y={p.y} width={nodeWidth} height={Math.max(2,p.h)} fill={`url(#${glowId}-n${i})`} rx="2"/>
          <text x={lblX} y={p.y+p.h/2-1} textAnchor={lblAnchor} fontSize={labelSize} fontWeight="600" fill={th.text} style={{letterSpacing:"0.02em"}}>{p.label}</text>
          <text x={lblX} y={p.y+p.h/2+labelSize+1} textAnchor={lblAnchor} fontSize={labelSize-1} fill={th.dim} style={{fontVariantNumeric:"tabular-nums"}}>${valStr}</text>
        </g>;
      })}
    </svg>
  </div>;
}

/* ── v0.37.0 — Phase 5 Charts: Treemap ──────────────────────────────────────
   Pure-SVG squarified treemap. Each leaf becomes a proportional rectangle —
   bigger = more $. Used to show net worth allocation, spending categories,
   account composition. Aspect-ratio-optimized for readable labels. Values
   tween between states. */
function Treemap({data,height=260,width=520,placeholder,valuePrefix="$"}){
  const th=useTh();
  const items=(Array.isArray(data)?data:[]).filter(d=>d&&(+d.value||0)>0);
  const twVals=useTweenedData(items.map(d=>+d.value||0),800);
  const dsId=useSvgId("tm-ds");
  if(items.length===0){
    return<div style={{padding:24,fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center"}}>{placeholder||"No data to display"}</div>;
  }
  const sorted=items.map((d,i)=>({...d,value:twVals[i]||0})).sort((a,b)=>b.value-a.value);
  const total=sorted.reduce((s,d)=>s+d.value,0)||1;
  const scale=(width*height)/total;
  const worst=(row,short)=>{
    if(!row.length)return Infinity;
    const sum=row.reduce((s,r)=>s+r._a,0);
    const ma=Math.max(...row.map(r=>r._a));
    const mi=Math.min(...row.map(r=>r._a));
    return Math.max((short*short*ma)/(sum*sum),(sum*sum)/(short*short*mi));
  };
  const layout=(rows,x,y,w,h)=>{
    const out=[];
    let remaining=rows.slice();
    let cx=x,cy=y,cw=w,ch=h;
    while(remaining.length){
      const short=Math.min(cw,ch);
      const row=[remaining.shift()];
      while(remaining.length){
        const test=row.concat(remaining[0]);
        if(worst(test,short)>=worst(row,short))break;
        row.push(remaining.shift());
      }
      const rowTotal=row.reduce((s,r)=>s+r._a,0);
      const rowLen=rowTotal/Math.max(1,short);
      if(cw>=ch){
        let yy=cy;
        for(const r of row){const hh=r._a/Math.max(1,rowLen);out.push({...r,x:cx,y:yy,w:rowLen,h:hh});yy+=hh;}
        cx+=rowLen;cw-=rowLen;
      }else{
        let xx=cx;
        for(const r of row){const ww=r._a/Math.max(1,rowLen);out.push({...r,x:xx,y:cy,w:ww,h:rowLen});xx+=ww;}
        cy+=rowLen;ch-=rowLen;
      }
    }
    return out;
  };
  const tiles=layout(sorted.map(d=>({...d,_a:d.value*scale})),0,0,width,height);
  const fmtVal=v=>v>=1e6?(v/1e6).toFixed(1).replace(/\.0$/,"")+"M":v>=1000?Math.round(v/100)/10+"K":Math.round(v);
  return<div style={{width:"100%",overflow:"hidden"}}>
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={{width:"100%",height:"auto",display:"block",fontFamily:"'JetBrains Mono',ui-monospace,Menlo,monospace"}}>
      <defs>
        {/* v0.42 — diagonal gradient per tile (top-left bright → bottom-right muted) */}
        {tiles.map((t,i)=>{const color=t.color||GOLD;return<linearGradient key={i} id={`${dsId}-g${i}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.78"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.42"/>
        </linearGradient>;})}
      </defs>
      {tiles.map((t,i)=>{
        const color=t.color||GOLD;
        const labelFits=t.w>56&&t.h>28;
        const valFits=t.w>56&&t.h>44;
        const maxChars=Math.max(4,Math.floor(t.w/7));
        const lbl=String(t.label||t.name||"").slice(0,maxChars);
        return<g key={i}>
          <rect x={t.x+2} y={t.y+2} width={Math.max(0,t.w-4)} height={Math.max(0,t.h-4)} fill={`url(#${dsId}-g${i})`} stroke={color} strokeOpacity="0.35" strokeWidth="0.5" rx="4"/>
          {labelFits&&<text x={t.x+10} y={t.y+19} fontSize="11" fontWeight="600" fill="#fff" style={{letterSpacing:"0.01em"}}>{lbl}</text>}
          {valFits&&<text x={t.x+10} y={t.y+33} fontSize="10" fill="rgba(255,255,255,0.82)" style={{fontVariantNumeric:"tabular-nums"}}>{valuePrefix+fmtVal(t.value)}</text>}
        </g>;
      })}
    </svg>
  </div>;
}

/* ── v0.38.0 — Phase 5 Charts: RadialGauge ──────────────────────────────────
   270°-arc gauge for ratio/percentage with optional target marker. Used for
   DSR, savings rate, EF months, DTI. Thin stroke (linecap=round), color
   shifts good/warn/bad based on threshold. Value tweens. */
// v0.58 r2 — per real Playwright screenshot of Amanda's Monthly tab.
// Reverted size default 120→140 (the r1 shrink made gauges look tiny in
// cards already sized for the radar). Track ring opacity bumped 0.45→0.75
// so DSR with value≈0 (no fill arc) still has a visibly defined ring on
// dark navy. Internal padding r=size/2-14 (was -16 in r1, -10 originally).
function RadialGauge({value,max=100,target,size=140,label,subLabel,color,direction="higher",thresholds,placeholder,fmt:fmtFn}){
  const th=useTh();
  const tw=useTweenedData({v:+value||0,m:+max||100},700);
  const v=tw.v,mx=tw.m||1;
  const pct=Math.max(0,Math.min(1,v/mx));
  const r=size/2-14,cx=size/2,cy=size/2;
  const startA=Math.PI*0.75,endA=Math.PI*2.25;// 270° sweep from 7:30 to 4:30 (clockwise)
  const arcPath=(a0,a1)=>{
    const x0=cx+r*Math.cos(a0),y0=cy+r*Math.sin(a0);
    const x1=cx+r*Math.cos(a1),y1=cy+r*Math.sin(a1);
    const large=a1-a0>Math.PI?1:0;
    return`M${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  };
  const fillA=startA+(endA-startA)*pct;
  // Color thresholds: default green/yellow/red by direction
  const tgt=target!=null?Math.max(0,Math.min(1,target/mx)):null;
  let auto=color;
  if(!auto&&thresholds){
    const[good,warn]=thresholds;
    if(direction==="higher")auto=pct>=good?th.pos:pct>=warn?th.warn:th.neg;
    else auto=pct<=good?th.pos:pct<=warn?th.warn:th.neg;
  }
  const strokeColor=auto||GOLD;
  if(!value&&value!==0)return<div style={{padding:18,fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center"}}>{placeholder||"No data"}</div>;
  const gid=useSvgId("rg");
  return<div style={{position:"relative",width:size,height:size}}>
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{display:"block",overflow:"hidden"}} role="img" aria-label={`${label||"Gauge"}: ${fmtFn?fmtFn(v):Math.round(v)}`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.55"/>
          <stop offset="55%" stopColor={strokeColor} stopOpacity="0.85"/>
          <stop offset="100%" stopColor={strokeColor} stopOpacity="1"/>
        </linearGradient>
      </defs>
      <path d={arcPath(startA,endA)} fill="none" stroke={th.cardBorder} strokeWidth="7" strokeLinecap="round" strokeOpacity="0.75"/>
      <path d={arcPath(startA,fillA)} fill="none" stroke={`url(#${gid})`} strokeWidth="8" strokeLinecap="round"/>
      {tgt!=null&&(()=>{const a=startA+(endA-startA)*tgt;return<line x1={cx+(r-6)*Math.cos(a)} y1={cy+(r-6)*Math.sin(a)} x2={cx+(r+6)*Math.cos(a)} y2={cy+(r+6)*Math.sin(a)} stroke={th.text} strokeWidth="1.25" strokeOpacity="0.5"/>;})()}
    </svg>
    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",pointerEvents:"none",textAlign:"center"}}>
      {label&&<div style={{fontSize:8,color:th.dim,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600,marginBottom:2,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>{label}</div>}
      <div style={{fontSize:size<=120?16:19,color:strokeColor,fontWeight:600,fontFamily:"'JetBrains Mono',ui-monospace,monospace",lineHeight:1,fontVariantNumeric:"tabular-nums",letterSpacing:"-0.01em"}}>{fmtFn?fmtFn(v):Math.round(v*10)/10}</div>
      {subLabel&&<div style={{fontSize:8,color:th.muted,marginTop:3,maxWidth:size-30,lineHeight:1.3,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>{subLabel}</div>}
    </div>
  </div>;
}

/* ── v0.38.0 — Phase 5 Charts: RankedHBars ──────────────────────────────────
   Horizontal bars sorted high→low. Used for debts, bills, income streams.
   Thin (12-16px) bars, label left, value right, monospace value. */
// v0.58 — per design-system/charts/MASTER.md. Bug from Mauricio Image 3:
// SVG's outer font-family was JetBrains Mono → labels (asset names) inherited
// it and looked too thick + wrong typeface. Fix: outer font = Plus Jakarta
// Sans (proper for labels); values explicitly override to JetBrains Mono.
// Also smaller label font (11→10) for a thinner, more modern read.
function RankedHBars({data,maxBars=10,barH=14,gap=8,width=460,labelW=140,valueW=64,placeholder}){
  const th=useTh();
  const items=(Array.isArray(data)?data:[]).filter(d=>d&&(+d.value||0)>0).slice().sort((a,b)=>(+b.value||0)-(+a.value||0)).slice(0,maxBars);
  const twVals=useTweenedData(items.map(d=>+d.value||0),700);
  const gid=useSvgId("rh");
  if(items.length===0)return<div style={{padding:18,fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center"}}>{placeholder||"No data to rank"}</div>;
  const maxV=Math.max(1,...twVals);
  const innerW=width-labelW-valueW-12;
  const totalH=items.length*(barH+gap)-gap;
  const fmtV=v=>v>=1e6?(v/1e6).toFixed(1).replace(/\.0$/,"")+"M":v>=1000?Math.round(v/100)/10+"K":Math.round(v);
  return<div style={{width:"100%",overflow:"hidden"}}>
    <svg viewBox={`0 0 ${width} ${totalH}`} preserveAspectRatio="xMidYMid meet" style={{width:"100%",height:"auto",display:"block",fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}} role="img" aria-label="Ranked horizontal bars">
      <defs>
        {items.map((d,i)=>{const color=d.color||GOLD;return<linearGradient key={i} id={`${gid}-${i}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.55"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.95"/>
        </linearGradient>;})}
      </defs>
      {items.map((d,i)=>{
        const y=i*(barH+gap);
        const w=Math.max(2,(twVals[i]||0)/maxV*innerW);
        const color=d.color||GOLD;
        return<g key={i}>
          <text x={labelW-8} y={y+barH-3} textAnchor="end" fontSize="10" fill={th.text} fontWeight="500" style={{letterSpacing:"0.01em",fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>{(d.label||"").slice(0,18)}</text>
          <rect x={labelW} y={y+barH*0.25} width={innerW} height={barH*0.5} fill={th.cardBorder} fillOpacity="0.28" rx="2"/>
          <rect x={labelW} y={y+barH*0.25} width={w} height={barH*0.5} fill={`url(#${gid}-${i})`} rx="2"/>
          <text x={labelW+innerW+8} y={y+barH-3} fontSize="10" fill={color} fontWeight="600" style={{fontVariantNumeric:"tabular-nums",fontFamily:"'JetBrains Mono',ui-monospace,monospace"}}>${fmtV(twVals[i]||0)}</text>
        </g>;
      })}
    </svg>
  </div>;
}

/* ── v0.38.0 — Phase 5 Charts: BulletChart ──────────────────────────────────
   Tufte-style: target diamond on a background range bar with the actual
   value as a thin black bar overlaid. Used for goal progress. */
function BulletChart({value,target,max,label,sublabel,color,width=320,height=40}){
  const th=useTh();
  const tw=useTweenedData({v:+value||0,t:+target||0,m:+max||Math.max(+value||0,+target||0)*1.2||100},700);
  const v=tw.v,tg=tw.t,mx=tw.m||1;
  const pct=Math.min(1,v/mx);
  const tpct=Math.min(1,tg/mx);
  const c=color||GOLD;
  const barH=12;
  const innerW=width-12;
  const gid=useSvgId("blt");
  return<div style={{width,padding:4}}>
    {label&&<div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:th.dim,marginBottom:4,fontWeight:600,letterSpacing:"0.04em"}}>
      <span style={{textTransform:"uppercase"}}>{label}</span>
      <span style={{fontFamily:"'JetBrains Mono',monospace",fontVariantNumeric:"tabular-nums"}}>${v>=1000?Math.round(v/100)/10+"K":Math.round(v)} / ${tg>=1000?Math.round(tg/100)/10+"K":Math.round(tg)}</span>
    </div>}
    <svg viewBox={`0 0 ${width} ${barH+8}`} preserveAspectRatio="none" style={{width:"100%",height:barH+8,display:"block"}}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={c} stopOpacity="0.5"/>
          <stop offset="100%" stopColor={c} stopOpacity="0.95"/>
        </linearGradient>
      </defs>
      <rect x={6} y={4} width={innerW} height={barH} fill={th.cardBorder} fillOpacity="0.3" rx="3"/>
      <rect x={6} y={4} width={innerW*pct} height={barH} fill={`url(#${gid})`} rx="3"/>
      {tg>0&&<line x1={6+innerW*tpct} y1={1} x2={6+innerW*tpct} y2={barH+7} stroke={th.text} strokeWidth="1.25" strokeOpacity="0.6"/>}
    </svg>
    {sublabel&&<div style={{fontSize:9,color:th.muted,marginTop:2}}>{sublabel}</div>}
  </div>;
}

/* ── v0.38.0 — Phase 5 Charts: Sparkline ────────────────────────────────────
   Tiny minimalist trend line, no axes, optional area fill. For KPI tiles. */
// v0.59.1 — ROOT FIX for Mauricio's "Sparklines still out of box" complaint.
// The SVG had style={{width:500, height}} which forced CSS width to 500px
// regardless of the flex container. In narrower wrappers the SVG overflowed
// and the endpoint dot bled into the value text. Fix: style.width="100%",
// preserveAspectRatio="none" so the chart stretches to fill its container.
// Plus 8px right inset on xAt() so the endpoint dot has clear space before
// the value column.
function Sparkline({data,width=80,height=24,color,fill=true,strokeWidth=1.1}){
  const th=useTh();
  const pts=(Array.isArray(data)?data:[]).filter(d=>d!=null).map(d=>+d||0);
  const tw=useTweenedData(pts,600);
  const gid=useSvgId("spk");
  if(tw.length<2)return<div style={{width:"100%",height,display:"flex",alignItems:"center",justifyContent:"center",color:th.dim,fontSize:9}}>—</div>;
  const mn=Math.min(...tw),mx=Math.max(...tw);
  const range=Math.max(1,mx-mn);
  // 8px right inset (was 4) so endpoint dot doesn't crowd the value column
  const xAt=i=>4+(width-12)*(i/(tw.length-1));
  const yAt=v=>height-3-(height-6)*((v-mn)/range);
  const ptStr=tw.map((v,i)=>`${xAt(i)} ${yAt(v)}`).join(" L");
  const c=color||GOLD;
  return<svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{width:"100%",height,display:"block"}}>
    <defs>
      {/* v0.42 — sparkline area gradient: vivid at top → transparent at bottom */}
      <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={c} stopOpacity="0.22"/>
        <stop offset="100%" stopColor={c} stopOpacity="0"/>
      </linearGradient>
    </defs>
    {fill&&<path d={`M${xAt(0)} ${height-3} L${ptStr} L${xAt(tw.length-1)} ${height-3} Z`} fill={`url(#${gid})`} stroke="none"/>}
    <path d={`M${ptStr}`} fill="none" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx={xAt(tw.length-1)} cy={yAt(tw[tw.length-1])} r="1.5" fill={c}/>
  </svg>;
}

/* ── v0.38.0 — Phase 5 Charts: Radar5 ───────────────────────────────────────
   5-axis radar polygon. Used for Financial Health Score across DSR, Savings
   Rate, EF Months, Debt-to-Asset, Cash Flow Health. Each value 0-1. */
// v0.58 r2 — bumped inner padding 30→36 (more room for axis labels) and
// pushed label position 1.18*r → 1.28*r so labels no longer crowd the
// polygon edge (Mauricio Image: DSR/SAVINGS/EF/D-A/CASH labels were overlapping the chart at size=140).
function Radar5({axes,values,target,size=240,color,placeholder}){
  const th=useTh();
  const safeAxes=Array.isArray(axes)?axes.slice(0,5):[];
  const safeValues=Array.isArray(values)?values.slice(0,safeAxes.length).map(v=>Math.max(0,Math.min(1,+v||0))):[];
  const tw=useTweenedData(safeValues,800);
  if(safeAxes.length<3)return<div style={{padding:18,fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center"}}>{placeholder||"Need at least 3 axes"}</div>;
  const cx=size/2,cy=size/2,r=size/2-36;
  const angleAt=i=>(-Math.PI/2)+(2*Math.PI*i/safeAxes.length);
  const pt=(val,i)=>{const a=angleAt(i);return{x:cx+r*val*Math.cos(a),y:cy+r*val*Math.sin(a)};};
  const ringLvls=[0.25,0.5,0.75,1];
  const polyPath=(vals)=>vals.map((v,i)=>{const p=pt(v,i);return`${p.x} ${p.y}`;}).join(" L");
  const c=color||GOLD;
  const targetPath=target?safeAxes.map((_,i)=>{const p=pt(target,i);return`${p.x} ${p.y}`;}).join(" L"):null;
  const gid=useSvgId("rd");
  return<svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{display:"block",overflow:"visible",fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}} role="img" aria-label="Radar chart">
    <defs>
      {/* v0.42 — radial gradient on polygon fill: dense at center → fading toward edge */}
      <radialGradient id={gid} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={c} stopOpacity="0.42"/>
        <stop offset="100%" stopColor={c} stopOpacity="0.1"/>
      </radialGradient>
    </defs>
    {ringLvls.map((lv,i)=><polygon key={i} points={safeAxes.map((_,j)=>{const p=pt(lv,j);return`${p.x},${p.y}`;}).join(" ")} fill="none" stroke={th.cardBorder} strokeOpacity={lv===1?0.45:0.2} strokeWidth="0.75" strokeDasharray={lv===1?"":"1.5 3"}/>)}
    {safeAxes.map((_,i)=>{const p=pt(1,i);return<line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={th.cardBorder} strokeOpacity="0.2" strokeWidth="0.75"/>;})}
    {targetPath&&<polygon points={safeAxes.map((_,i)=>{const p=pt(target,i);return`${p.x},${p.y}`;}).join(" ")} fill="none" stroke={th.text} strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2 3"/>}
    <polygon points={tw.map((v,i)=>{const p=pt(v,i);return`${p.x},${p.y}`;}).join(" ")} fill={`url(#${gid})`} stroke={c} strokeOpacity="0.85" strokeWidth="1.25" strokeLinejoin="round"/>
    {tw.map((v,i)=>{const p=pt(v,i);return<g key={i}><circle cx={p.x} cy={p.y} r="4" fill={c} opacity="0.25"/><circle cx={p.x} cy={p.y} r="2" fill={c}/></g>;})}
    {safeAxes.map((ax,i)=>{const p=pt(1.28,i);const isRight=p.x>cx+5,isLeft=p.x<cx-5;const anchor=isRight?"start":isLeft?"end":"middle";return<text key={i} x={p.x} y={p.y+3} textAnchor={anchor} fontSize="9" fontWeight="600" fill={th.muted} style={{letterSpacing:"0.04em",textTransform:"uppercase",fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>{ax}</text>;})}
  </svg>;
}

/* ── v0.38.0 — Phase 5 Charts: NetWorthBridge ───────────────────────────────
   Stacked area: assets above zero (positive tones), liabilities below zero
   (negative tones), thin net-worth line on top. Each "data" point is
   {label, assets:{checking,savings,retirement,property,other}, liabilities:{cards,loans}}. */
function NetWorthBridge({data,height=200,width=600,placeholder}){
  const th=useTh();
  const pts=Array.isArray(data)?data.filter(d=>d):[];
  // Tween: pull numeric leaves from assets+liabilities into a flat object
  const flatten=p=>{const o={};for(const k of Object.keys(p.assets||{}))o["a_"+k]=+p.assets[k]||0;for(const k of Object.keys(p.liabilities||{}))o["l_"+k]=+p.liabilities[k]||0;return o;};
  const twFlat=useTweenedData(pts.map(flatten),800);
  if(pts.length<2)return<div style={{padding:18,fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center"}}>{placeholder||"Need at least 2 data points"}</div>;
  // Reconstruct points with tweened values
  const apts=pts.map((p,i)=>{
    const f=twFlat[i]||{};
    const assets={},liabs={};
    for(const k of Object.keys(p.assets||{}))assets[k]=f["a_"+k]??0;
    for(const k of Object.keys(p.liabilities||{}))liabs[k]=f["l_"+k]??0;
    return{...p,assets,liabilities:liabs};
  });
  const assetKeys=Object.keys(pts[0].assets||{});
  const liabKeys=Object.keys(pts[0].liabilities||{});
  const assetColors={checking:"#3B82F6",savings:"#06B6D4",retirement:"#8B5CF6",property:"#059669",investments:"#10B981",other:"#94A3B8"};
  const liabColors={cards:"#EF4444",loans:"#F97316",mortgage:"#DC2626",auto:"#F59E0B"};
  const totals=apts.map(p=>{
    const a=assetKeys.reduce((s,k)=>s+(+p.assets[k]||0),0);
    const l=liabKeys.reduce((s,k)=>s+(+p.liabilities[k]||0),0);
    return{a,l,net:a-l};
  });
  const maxA=Math.max(1,...totals.map(t=>t.a));
  const maxL=Math.max(1,...totals.map(t=>t.l));
  const padT=14,padB=28,padL=42,padR=14;
  const innerW=width-padL-padR,innerH=height-padT-padB;
  const zero=padT+innerH*maxA/(maxA+maxL);
  const yAtA=v=>zero-(v/maxA)*(zero-padT);
  const yAtL=v=>zero+(v/maxL)*(padT+innerH-zero);
  const xAt=i=>padL+(apts.length===1?innerW/2:innerW*i/(apts.length-1));
  // Build stacked paths for assets (above zero) and liabilities (below zero)
  const stack=(keys,colorMap,isAsset)=>{
    let cumPerPt=apts.map(()=>0);
    return keys.map(k=>{
      const pts2=apts.map((p,i)=>{
        const v=isAsset?(+p.assets[k]||0):(+p.liabilities[k]||0);
        const prev=cumPerPt[i];
        cumPerPt[i]=prev+v;
        return{i,prev,cur:cumPerPt[i],v};
      });
      // Build path: top = previous cum, bottom = previous cum + value (or vice versa for liabilities going down)
      const topY=isAsset?(p=>yAtA(p.cur)):(p=>yAtL(p.cur));
      const botY=isAsset?(p=>yAtA(p.prev)):(p=>yAtL(p.prev));
      const top=pts2.map(p=>`${xAt(p.i)} ${topY(p)}`).join(" L");
      const bot=pts2.slice().reverse().map(p=>`${xAt(p.i)} ${botY(p)}`).join(" L");
      return{k,color:colorMap[k]||"#94A3B8",d:`M${top} L${bot} Z`};
    });
  };
  const assetBands=stack(assetKeys,assetColors,true);
  const liabBands=stack(liabKeys,liabColors,false);
  // Net worth line on top
  const netY=v=>{if(v>=0)return yAtA(v);return yAtL(-v);};
  const netPath="M"+totals.map((t,i)=>`${xAt(i)} ${netY(t.net)}`).join(" L");
  const fmtTick=v=>v>=1e6?(v/1e6).toFixed(1).replace(/\.0$/,"")+"M":v>=1000?Math.round(v/1000)+"K":Math.round(v);
  const gid=useSvgId("nwb");
  return<div style={{width:"100%",overflow:"hidden"}}>
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{width:"100%",height:"auto",display:"block",fontFamily:"'JetBrains Mono',ui-monospace,Menlo,monospace"}}>
      <defs>
        {/* v0.44 — gradient per asset band (fading top→bottom) and per liability band (mirrored) */}
        {assetBands.map((b,i)=><linearGradient key={"ga"+i} id={`${gid}-a${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={b.color} stopOpacity="0.7"/>
          <stop offset="100%" stopColor={b.color} stopOpacity="0.28"/>
        </linearGradient>)}
        {liabBands.map((b,i)=><linearGradient key={"gl"+i} id={`${gid}-l${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={b.color} stopOpacity="0.28"/>
          <stop offset="100%" stopColor={b.color} stopOpacity="0.62"/>
        </linearGradient>)}
        <linearGradient id={`${gid}-net`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.7"/>
          <stop offset="100%" stopColor={GOLD} stopOpacity="1"/>
        </linearGradient>
      </defs>
      <line x1={padL} y1={zero} x2={width-padR} y2={zero} stroke={th.dim} strokeOpacity="0.35" strokeWidth="0.75"/>
      <text x={padL-6} y={padT+3} textAnchor="end" fontSize="9" fill={th.dim} style={{fontVariantNumeric:"tabular-nums"}}>{fmtTick(maxA)}</text>
      <text x={padL-6} y={zero+3} textAnchor="end" fontSize="9" fill={th.dim}>0</text>
      <text x={padL-6} y={padT+innerH+3} textAnchor="end" fontSize="9" fill={th.dim} style={{fontVariantNumeric:"tabular-nums"}}>-{fmtTick(maxL)}</text>
      {assetBands.map((b,i)=><path key={"a"+i} d={b.d} fill={`url(#${gid}-a${i})`} stroke="none"/>)}
      {liabBands.map((b,i)=><path key={"l"+i} d={b.d} fill={`url(#${gid}-l${i})`} stroke="none"/>)}
      <path d={netPath} fill="none" stroke={`url(#${gid}-net)`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {apts.map((p,i)=><text key={i} x={xAt(i)} y={height-8} textAnchor="middle" fontSize="9" fill={th.muted} style={{letterSpacing:"0.04em",textTransform:"uppercase"}}>{String(p.label||"").split(/\s|'/)[0].slice(0,3)}</text>)}
    </svg>
  </div>;
}

/* ── v0.38.0 — Phase 5 Charts: PayoffProgression ────────────────────────────
   Stacked area showing debt balances dropping to zero over time given current
   monthly payments. Each band = one debt. Data: {debts:[{name,balance,apr,min,color}], months}. */
function PayoffProgression({debts,maxMonths=120,height=180,width=600,extraPay=0,placeholder}){
  const th=useTh();
  const safeDebts=(Array.isArray(debts)?debts:[]).filter(d=>d&&(+d.balance||0)>0);
  // Project balances over time for each debt
  const series=useMemo(()=>{
    if(safeDebts.length===0)return{months:0,seriesBy:[]};
    const sorted=safeDebts.slice().sort((a,b)=>(+b.apr||0)-(+a.apr||0));// avalanche order for extra
    const bals=sorted.map(d=>+d.balance||0);
    const rates=sorted.map(d=>(+d.apr||0)/100/12);
    const mins=sorted.map(d=>Math.max(25,+d.min||(+d.balance||0)*0.02));
    const months=[];let m=0;
    while(bals.some(b=>b>1)&&m<maxMonths){
      // Interest accrual + min pay
      for(let i=0;i<bals.length;i++){
        if(bals[i]<=0)continue;
        bals[i]+=bals[i]*rates[i];
        const pay=Math.min(bals[i],mins[i]);
        bals[i]-=pay;
      }
      // Apply extra to first non-zero (avalanche)
      let extra=extraPay;
      for(let i=0;i<bals.length&&extra>0;i++){
        if(bals[i]<=0)continue;
        const pay=Math.min(bals[i],extra);
        bals[i]-=pay;extra-=pay;
      }
      months.push(bals.slice());
      m++;
    }
    return{months:months.length,seriesBy:sorted.map((d,i)=>({...d,trail:months.map(b=>Math.max(0,b[i]))}))};
  },[safeDebts,extraPay,maxMonths]);
  if(safeDebts.length===0||series.months===0)return<div style={{padding:18,fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center"}}>{placeholder||"Add debts to see payoff timeline"}</div>;
  const padT=14,padB=24,padL=42,padR=14;
  const innerW=width-padL-padR,innerH=height-padT-padB;
  const maxTotal=Math.max(1,...Array.from({length:series.months},(_,m)=>series.seriesBy.reduce((s,d)=>s+(d.trail[m]||0),0)));
  const xAt=m=>padL+(series.months===1?innerW/2:innerW*m/(series.months-1));
  const yAt=v=>padT+innerH*(1-v/maxTotal);
  // Stack bands
  const bands=series.seriesBy.map((d,bi)=>{
    let pathTop=[],pathBot=[];
    for(let m=0;m<series.months;m++){
      const cumBelow=series.seriesBy.slice(0,bi).reduce((s,dd)=>s+(dd.trail[m]||0),0);
      const cumWithThis=cumBelow+(d.trail[m]||0);
      pathTop.push(`${xAt(m)} ${yAt(cumWithThis)}`);
      pathBot.push(`${xAt(m)} ${yAt(cumBelow)}`);
    }
    return{...d,d:"M"+pathTop.join(" L")+" L"+pathBot.reverse().join(" L")+" Z",color:d.color||["#EF4444","#F97316","#F59E0B","#8B5CF6","#3B82F6"][bi%5]};
  });
  const fmtTick=v=>v>=1000?Math.round(v/1000)+"K":Math.round(v);
  const fmtMonth=m=>m<12?`${m}mo`:`${(m/12).toFixed(0)}y`;
  const monthTicks=series.months<=12?[0,Math.floor(series.months/2),series.months-1]:[0,12,24,Math.min(series.months-1,60),series.months-1].filter((v,i,a)=>a.indexOf(v)===i);
  const gid=useSvgId("pop");
  return<div style={{width:"100%",overflow:"hidden"}}>
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{width:"100%",height:"auto",display:"block",fontFamily:"'JetBrains Mono',ui-monospace,Menlo,monospace"}}>
      <defs>
        {/* v0.44 — gradient per debt band (left vivid → right faded as it pays off) */}
        {bands.map((b,i)=><linearGradient key={i} id={`${gid}-${i}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={b.color} stopOpacity="0.75"/>
          <stop offset="100%" stopColor={b.color} stopOpacity="0.25"/>
        </linearGradient>)}
      </defs>
      {[0,0.5,1].map((t,i)=>{const y=yAt(maxTotal*t);return<g key={i}><line x1={padL} y1={y} x2={width-padR} y2={y} stroke={th.dim} strokeOpacity="0.14" strokeDasharray="1.5 4"/><text x={padL-6} y={y+3} textAnchor="end" fontSize="9" fill={th.dim} style={{fontVariantNumeric:"tabular-nums"}}>${fmtTick(maxTotal*t)}</text></g>;})}
      {bands.map((b,i)=><path key={i} d={b.d} fill={`url(#${gid}-${i})`} stroke={b.color} strokeOpacity="0.4" strokeWidth="0.5"/>)}
      {monthTicks.map((m,i)=><text key={i} x={xAt(m)} y={height-8} textAnchor="middle" fontSize="9" fill={th.muted}>{fmtMonth(m)}</text>)}
    </svg>
  </div>;
}

/* ── v0.38.0 — Phase 5 Charts: AmortizationArea ─────────────────────────────
   Loan balance dropping over term. Single-curve area. Used for car loans
   and home affordability calculator. */
function AmortizationArea({principal,apr,termMonths,extraPay=0,height=140,width=520,color}){
  const th=useTh();
  const c=color||GOLD;
  // Compute balance series
  const trail=useMemo(()=>{
    const p=+principal||0,r=(+apr||0)/100/12,n=+termMonths||60;
    if(p<=0||n<=0)return[];
    const pmt=r>0?p*r/(1-Math.pow(1+r,-n)):p/n;
    const out=[];let bal=p;
    for(let m=0;m<n;m++){
      bal+=bal*r;
      bal-=Math.min(bal,pmt+extraPay);
      out.push(Math.max(0,bal));
      if(bal<=0)break;
    }
    return out;
  },[principal,apr,termMonths,extraPay]);
  const tw=useTweenedData(trail,800);
  const gid=useSvgId("amr");
  if(tw.length<2)return<div style={{padding:18,fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center"}}>Adjust values</div>;
  const padT=10,padB=22,padL=42,padR=14;
  const innerW=width-padL-padR,innerH=height-padT-padB;
  const mx=Math.max(...tw);
  const xAt=i=>padL+(tw.length===1?innerW/2:innerW*i/(tw.length-1));
  const yAt=v=>padT+innerH*(1-v/mx);
  const linePts=tw.map((v,i)=>`${xAt(i)} ${yAt(v)}`).join(" L");
  return<div style={{width:"100%",overflow:"hidden"}}>
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{width:"100%",height:"auto",display:"block",fontFamily:"'JetBrains Mono',ui-monospace,Menlo,monospace"}}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.4"/>
          <stop offset="100%" stopColor={c} stopOpacity="0"/>
        </linearGradient>
        <linearGradient id={`${gid}-s`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={c} stopOpacity="0.7"/>
          <stop offset="100%" stopColor={c} stopOpacity="1"/>
        </linearGradient>
      </defs>
      <path d={`M${linePts} L${xAt(tw.length-1)} ${padT+innerH} L${xAt(0)} ${padT+innerH} Z`} fill={`url(#${gid})`}/>
      <path d={`M${linePts}`} fill="none" stroke={`url(#${gid}-s)`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <text x={padL-6} y={padT+5} textAnchor="end" fontSize="9" fill={th.dim} style={{fontVariantNumeric:"tabular-nums"}}>${mx>=1000?Math.round(mx/1000)+"K":Math.round(mx)}</text>
      <text x={padL-6} y={padT+innerH+3} textAnchor="end" fontSize="9" fill={th.dim}>0</text>
      <text x={xAt(0)} y={height-6} textAnchor="start" fontSize="9" fill={th.muted} style={{letterSpacing:"0.04em",textTransform:"uppercase"}}>Mo 0</text>
      <text x={xAt(tw.length-1)} y={height-6} textAnchor="end" fontSize="9" fill={th.muted} style={{letterSpacing:"0.04em",textTransform:"uppercase"}}>Mo {tw.length}</text>
    </svg>
  </div>;
}

/* ── v0.54.0 (PR 9 from HANDOFF-v0.46) — CompoundGrowthStack ───────────────
   Three-band stacked area: principal (deep blue constant), contributions
   (mid-blue linear growth), interest (gold exponential). Inverse of
   AmortizationArea — instead of debt paying down, money grows. Gold band
   is what the chart is selling; the rest is the floor it sits on.
   Crossover marker fires the year interest exceeds principal+contributions.
   Spec: preview/26-calc-charts.html line 263+. */
function CompoundGrowthStack({principal=0,monthly=0,rate=0,years=25,height=220,width=920,simple=false}){
  const th=useTh();
  const series=useMemo(()=>{
    const out=[];
    const r=Math.max(0,+rate)/100;
    const yrs=Math.max(1,+years);
    const p=Math.max(0,+principal);
    const m=Math.max(0,+monthly);
    for(let y=0;y<=yrs;y++){
      const contribTotal=m*12*y;
      let total;
      if(simple){
        total=p*(1+r*y)+contribTotal;
      }else{
        const mr=r/12;
        const n=y*12;
        total=p*Math.pow(1+mr,n)+(mr>0?m*((Math.pow(1+mr,n)-1)/mr):m*n);
      }
      const interest=Math.max(0,total-p-contribTotal);
      out.push({y,principal:p,contrib:contribTotal,interest,total});
    }
    return out;
  },[principal,monthly,rate,years,simple]);
  const gid=useSvgId("cgs");
  if(series.length<2)return<div style={{padding:18,fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center"}}>Adjust inputs to see growth</div>;
  const mx=Math.max(1,...series.map(s=>s.total));
  const padT=14,padB=32,padL=56,padR=18;
  const innerW=width-padL-padR,innerH=height-padT-padB;
  const xAt=i=>padL+innerW*i/(series.length-1);
  const yAt=v=>padT+innerH*(1-v/mx);
  // Crossover: first year where interest > principal + contrib
  let crossoverYr=null;
  for(const s of series){if(s.interest>s.principal+s.contrib){crossoverYr=s.y;break;}}
  // Build stacked band paths bottom-up: principal, contrib (on top of principal), interest (on top of both)
  const bandPath=keyTop=>{
    const top=series.map((s,i)=>{
      let cum=s.principal;
      if(keyTop==="contrib")cum=s.principal+s.contrib;
      else if(keyTop==="interest")cum=s.principal+s.contrib+s.interest;
      return`${xAt(i)} ${yAt(cum)}`;
    }).join(" L");
    const bot=series.slice().reverse().map((s,i)=>{
      const idx=series.length-1-i;
      let cum=0;
      if(keyTop==="contrib")cum=series[idx].principal;
      else if(keyTop==="interest")cum=series[idx].principal+series[idx].contrib;
      return`${xAt(idx)} ${yAt(cum)}`;
    }).join(" L");
    return`M${top} L${bot} Z`;
  };
  const fmtT=v=>v>=1e6?(v/1e6).toFixed(1).replace(/\.0$/,"")+"M":v>=1000?Math.round(v/1000)+"K":Math.round(v);
  const ticks=[0,mx*0.25,mx*0.5,mx*0.75,mx];
  return<div style={{width:"100%",overflow:"hidden"}}>
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={{width:"100%",height:"auto",display:"block",fontFamily:"'JetBrains Mono',ui-monospace,Menlo,monospace"}}>
      <defs>
        <linearGradient id={`${gid}-prin`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4472C4" stopOpacity="0.85"/><stop offset="100%" stopColor="#4472C4" stopOpacity="0.55"/></linearGradient>
        <linearGradient id={`${gid}-contrib`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5B9BD5" stopOpacity="0.7"/><stop offset="100%" stopColor="#5B9BD5" stopOpacity="0.4"/></linearGradient>
        <linearGradient id={`${gid}-int`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={GOLD} stopOpacity="0.85"/><stop offset="100%" stopColor={GOLD} stopOpacity="0.2"/></linearGradient>
      </defs>
      {ticks.map((t,i)=>{const y=yAt(t);return<g key={i}>
        <line x1={padL} y1={y} x2={width-padR} y2={y} stroke={th.dim} strokeOpacity="0.16" strokeDasharray="1.5 4"/>
        <text x={padL-8} y={y+3} textAnchor="end" fontSize="9" fill={th.dim} style={{fontVariantNumeric:"tabular-nums"}}>${fmtT(t)}</text>
      </g>;})}
      <path d={bandPath("principal")} fill={`url(#${gid}-prin)`} stroke="#4472C4" strokeWidth="0.75" strokeOpacity="0.5"/>
      <path d={bandPath("contrib")} fill={`url(#${gid}-contrib)`} stroke="#5B9BD5" strokeWidth="0.75" strokeOpacity="0.5"/>
      <path d={bandPath("interest")} fill={`url(#${gid}-int)`} stroke={GOLD} strokeWidth="1.25"/>
      {crossoverYr!=null&&(()=>{const i=crossoverYr;const sx=xAt(i);const sy=yAt(series[i].principal+series[i].contrib+series[i].interest);return<g>
        <line x1={sx} y1={sy} x2={sx} y2={padT+innerH} stroke="#EDD594" strokeWidth="1" strokeDasharray="2 2"/>
        <circle cx={sx} cy={sy} r="4.5" fill="#EDD594" stroke="#0D1B2A" strokeWidth="1.25"/>
        <text x={sx} y={padT+innerH+18} textAnchor="middle" fontSize="10" fontWeight="700" fill={GOLD} style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>interest &gt; contributions · yr {crossoverYr}</text>
      </g>;})()}
      {/* End labels */}
      {(()=>{const last=series[series.length-1];const lx=width-padR-6;return<g fontSize="9" fontVariantNumeric="tabular-nums">
        {last.principal>0&&<text x={lx} y={yAt(last.principal/2)} textAnchor="end" fill="#94CDE3">P ${fmtT(last.principal)}</text>}
        {last.contrib>0&&<text x={lx} y={yAt(last.principal+last.contrib/2)} textAnchor="end" fill="#A8C5E8">C ${fmtT(last.contrib)}</text>}
        {last.interest>0&&<text x={lx} y={yAt(last.principal+last.contrib+last.interest/2)} textAnchor="end" fill={GOLD} fontWeight="700">I ${fmtT(last.interest)}</text>}
      </g>;})()}
      {/* X-axis year ticks */}
      {(()=>{const step=Math.max(1,Math.floor(series.length/6));const labels=[];for(let i=0;i<series.length;i+=step)labels.push(i);if(labels[labels.length-1]!==series.length-1)labels.push(series.length-1);return labels.map(i=><text key={i} x={xAt(i)} y={height-10} textAnchor="middle" fontSize="9" fill={th.muted} style={{letterSpacing:"0.04em",textTransform:"uppercase"}}>Yr {series[i].y}</text>);})()}
    </svg>
  </div>;
}

/* ── v0.38.0 — Phase 5 Charts: StackedBars ──────────────────────────────────
   Vertical stacked bars over time with multiple categories. Used for bills
   by category over months. */
function StackedBars({data,categories,colors,height=200,width=520,placeholder}){
  const th=useTh();
  const pts=Array.isArray(data)?data:[];
  const cats=Array.isArray(categories)?categories:[];
  const flatten=p=>{const o={};for(const c of cats)o[c]=+p[c]||0;return o;};
  const twPts=useTweenedData(pts.map(flatten),700);
  const gid=useSvgId("sb");
  if(pts.length===0||cats.length===0)return<div style={{padding:18,fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center"}}>{placeholder||"No data"}</div>;
  const padT=10,padB=24,padL=42,padR=14;
  const innerW=width-padL-padR,innerH=height-padT-padB;
  const totals=twPts.map(p=>cats.reduce((s,c)=>s+(+p[c]||0),0));
  const mx=Math.max(1,...totals);
  const barW=Math.min(24,(innerW-(pts.length-1)*8)/pts.length);
  const xAt=i=>padL+(innerW-pts.length*barW-(pts.length-1)*8)/2+i*(barW+8);
  const yAt=v=>padT+innerH*(1-v/mx);
  const cmap=colors||{};
  const palette=["#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#06B6D4","#F97316","#84CC16"];
  return<div style={{width:"100%",overflow:"hidden"}}>
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{width:"100%",height:"auto",display:"block",fontFamily:"'JetBrains Mono',ui-monospace,Menlo,monospace"}}>
      <defs>
        {cats.map((c,ci)=>{const color=cmap[c]||palette[ci%palette.length];return<linearGradient key={ci} id={`${gid}-${ci}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.9"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.55"/>
        </linearGradient>;})}
      </defs>
      {[0,0.5,1].map((t,i)=>{const y=yAt(mx*t);return<line key={i} x1={padL} y1={y} x2={width-padR} y2={y} stroke={th.dim} strokeOpacity="0.14" strokeDasharray="1.5 4"/>;})}
      {twPts.map((p,i)=>{
        let cumY=padT+innerH;
        return cats.map((c,ci)=>{
          const v=+p[c]||0;
          const h=mx>0?innerH*v/mx:0;
          cumY-=h;
          return<rect key={i+"_"+ci} x={xAt(i)} y={cumY} width={barW} height={Math.max(0,h)} fill={`url(#${gid}-${ci})`} rx="2"/>;
        });
      })}
      {pts.map((p,i)=><text key={i} x={xAt(i)+barW/2} y={height-8} textAnchor="middle" fontSize="9" fill={th.muted} style={{letterSpacing:"0.04em",textTransform:"uppercase"}}>{String(p.label||"").split(/\s|'/)[0].slice(0,3)}</text>)}
    </svg>
  </div>;
}

/* ── v0.38.0 — Phase 5 Charts: HeatmapCalendar ──────────────────────────────
   Year-month grid colored by intensity. Rows = years, cols = months 1-12.
   Used for spending heatmap. */
function HeatmapCalendar({data,colorScale,height=140,width=520,placeholder}){
  const th=useTh();
  const cells=Array.isArray(data)?data:[];
  const tw=useTweenedData(cells.map(c=>+c.value||0),700);
  if(cells.length===0)return<div style={{padding:18,fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center"}}>{placeholder||"No data"}</div>;
  const years=Array.from(new Set(cells.map(c=>c.year))).sort();
  const mx=Math.max(1,...tw);
  const padT=14,padB=18,padL=44,padR=10;
  const innerW=width-padL-padR,innerH=height-padT-padB;
  const colW=innerW/12,rowH=Math.min(28,innerH/Math.max(1,years.length));
  const base=colorScale||GOLD;
  const monthLabels=["J","F","M","A","M","J","J","A","S","O","N","D"];
  // v0.44 — color gradient interpolation: low intensity = soft cream, high = deep amber
  const lerpHex=(t)=>{const low={r:0xFE,g:0xF3,b:0xC7};const high=(c=>({r:parseInt(c.slice(1,3),16),g:parseInt(c.slice(3,5),16),b:parseInt(c.slice(5,7),16)}))(base);const r=Math.round(low.r+(high.r-low.r)*t);const g=Math.round(low.g+(high.g-low.g)*t);const b=Math.round(low.b+(high.b-low.b)*t);return`rgb(${r},${g},${b})`;};
  return<div style={{width:"100%",overflow:"hidden"}}>
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={{width:"100%",height:"auto",display:"block",fontFamily:"'JetBrains Mono',ui-monospace,Menlo,monospace"}}>
      {monthLabels.map((m,i)=><text key={i} x={padL+colW*i+colW/2} y={padT-3} textAnchor="middle" fontSize="9" fill={th.dim} style={{letterSpacing:"0.04em",textTransform:"uppercase"}}>{m}</text>)}
      {years.map((y,yi)=><text key={y} x={padL-6} y={padT+rowH*yi+rowH/2+3} textAnchor="end" fontSize="9" fill={th.dim} style={{fontVariantNumeric:"tabular-nums"}}>{y}</text>)}
      {cells.map((c,i)=>{
        const yi=years.indexOf(c.year);
        const m=(c.month||1)-1;
        const intensity=mx>0?(tw[i]||0)/mx:0;
        return<rect key={i} x={padL+colW*m+2} y={padT+rowH*yi+2} width={colW-4} height={rowH-4} fill={intensity>0.02?lerpHex(intensity):"transparent"} stroke={base} strokeOpacity={intensity>0.02?0:0.18} strokeWidth="0.75" rx="3"/>;
      })}
    </svg>
  </div>;
}

/* ── v0.38.0 — Phase 5 Charts: GroupedYoY ───────────────────────────────────
   Side-by-side bars: current year vs prior year per category. */
function GroupedYoY({data,height=180,width=520,curColor,priorColor,curLabel="This Yr",priorLabel="Prior Yr",placeholder}){
  const th=useTh();
  const items=Array.isArray(data)?data:[];
  const tw=useTweenedData(items.map(d=>({c:+d.current||0,p:+d.prior||0})),800);
  const gid=useSvgId("yoy");
  if(items.length===0)return<div style={{padding:18,fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center"}}>{placeholder||"No data"}</div>;
  const padT=22,padB=28,padL=42,padR=14;
  const innerW=width-padL-padR,innerH=height-padT-padB;
  const mx=Math.max(1,...tw.flatMap(p=>[p.c,p.p]));
  const slot=innerW/items.length;
  const barW=Math.min(16,(slot-12)/2);
  const yAt=v=>padT+innerH*(1-v/mx);
  const cc=curColor||GOLD,pc=priorColor||th.dim;
  return<div style={{width:"100%",overflow:"hidden"}}>
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{width:"100%",height:"auto",display:"block",fontFamily:"'JetBrains Mono',ui-monospace,Menlo,monospace"}}>
      <defs>
        <linearGradient id={`${gid}-c`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={cc} stopOpacity="0.92"/><stop offset="100%" stopColor={cc} stopOpacity="0.5"/></linearGradient>
        <linearGradient id={`${gid}-p`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={pc} stopOpacity="0.72"/><stop offset="100%" stopColor={pc} stopOpacity="0.32"/></linearGradient>
      </defs>
      <g>
        <rect x={padL} y={5} width={9} height={5} fill={`url(#${gid}-c)`} rx="1.5"/>
        <text x={padL+12} y={11} fontSize="9" fill={th.muted} fontWeight="600" style={{letterSpacing:"0.04em",textTransform:"uppercase"}}>{curLabel}</text>
        <rect x={padL+70} y={5} width={9} height={5} fill={`url(#${gid}-p)`} rx="1.5"/>
        <text x={padL+82} y={11} fontSize="9" fill={th.muted} fontWeight="600" style={{letterSpacing:"0.04em",textTransform:"uppercase"}}>{priorLabel}</text>
      </g>
      {[0,0.5,1].map((t,i)=>{const y=yAt(mx*t);return<line key={i} x1={padL} y1={y} x2={width-padR} y2={y} stroke={th.dim} strokeOpacity="0.14" strokeDasharray="1.5 4"/>;})}
      {items.map((d,i)=>{
        const slotX=padL+slot*i+slot/2;
        const xCur=slotX-barW-2,xPrior=slotX+2;
        const c=tw[i]?.c||0,p=tw[i]?.p||0;
        return<g key={i}>
          <rect x={xCur} y={yAt(c)} width={barW} height={padT+innerH-yAt(c)} fill={`url(#${gid}-c)`} rx="2"/>
          <rect x={xPrior} y={yAt(p)} width={barW} height={padT+innerH-yAt(p)} fill={`url(#${gid}-p)`} rx="2"/>
          <text x={slotX} y={height-8} textAnchor="middle" fontSize="9" fill={th.muted} style={{letterSpacing:"0.04em",textTransform:"uppercase"}}>{(d.label||"").slice(0,8)}</text>
        </g>;
      })}
    </svg>
  </div>;
}

/* ── v0.38.0 — Phase 5 Charts: ForecastCone ─────────────────────────────────
   Solid line for history + widening probability band for projection.
   Used for retirement / net worth projection. */
function ForecastCone({history,projection,confidence=0.2,height=200,width=600,color,placeholder}){
  const th=useTh();
  const hist=Array.isArray(history)?history:[];
  const proj=Array.isArray(projection)?projection:[];
  const all=[...hist,...proj];
  const tw=useTweenedData(all.map(p=>+p.value||0),800);
  if(hist.length<1||proj.length<1)return<div style={{padding:18,fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center"}}>{placeholder||"Need history + projection"}</div>;
  const padT=14,padB=24,padL=42,padR=14;
  const innerW=width-padL-padR,innerH=height-padT-padB;
  const mx=Math.max(1,...tw)*1.15;
  const xAt=i=>padL+(all.length===1?innerW/2:innerW*i/(all.length-1));
  const yAt=v=>padT+innerH*(1-v/mx);
  const c=color||GOLD;
  // History solid line + filled area
  const histPath=hist.map((p,i)=>`${xAt(i)} ${yAt(tw[i]||0)}`).join(" L");
  // Projection center line + cone (widens with sqrt(months_from_now))
  const projStart=hist.length-1;
  const conePath=(()=>{const top=[],bot=[];for(let i=projStart;i<all.length;i++){const v=tw[i]||0;const distance=i-projStart;const range=v*confidence*Math.sqrt(distance);top.push(`${xAt(i)} ${yAt(v+range)}`);bot.push(`${xAt(i)} ${yAt(Math.max(0,v-range))}`);}return"M"+top.join(" L")+" L"+bot.reverse().join(" L")+" Z";})();
  const projPath=proj.map((p,i)=>`${xAt(projStart+i)} ${yAt(tw[projStart+i]||0)}`).join(" L");
  const fmtT=v=>v>=1e6?(v/1e6).toFixed(1).replace(/\.0$/,"")+"M":v>=1000?Math.round(v/1000)+"K":Math.round(v);
  const gid=useSvgId("fc");
  return<div style={{width:"100%",overflow:"hidden"}}>
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{width:"100%",height:"auto",display:"block",fontFamily:"'JetBrains Mono',ui-monospace,Menlo,monospace"}}>
      <defs>
        {/* v0.44 — cone widening fade + history area gradient */}
        <linearGradient id={`${gid}-cone`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={c} stopOpacity="0.32"/>
          <stop offset="100%" stopColor={c} stopOpacity="0.08"/>
        </linearGradient>
        <linearGradient id={`${gid}-hist`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.32"/>
          <stop offset="100%" stopColor={c} stopOpacity="0"/>
        </linearGradient>
        <linearGradient id={`${gid}-stroke`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={c} stopOpacity="0.65"/>
          <stop offset="100%" stopColor={c} stopOpacity="1"/>
        </linearGradient>
      </defs>
      {[0,0.5,1].map((t,i)=>{const y=yAt(mx*t);return<g key={i}><line x1={padL} y1={y} x2={width-padR} y2={y} stroke={th.dim} strokeOpacity="0.14" strokeDasharray="1.5 4"/><text x={padL-6} y={y+3} textAnchor="end" fontSize="9" fill={th.dim} style={{fontVariantNumeric:"tabular-nums"}}>${fmtT(mx*t)}</text></g>;})}
      <line x1={xAt(projStart)} y1={padT} x2={xAt(projStart)} y2={padT+innerH} stroke={th.dim} strokeOpacity="0.3" strokeWidth="0.75" strokeDasharray="2 3"/>
      <path d={conePath} fill={`url(#${gid}-cone)`} stroke="none"/>
      <path d={`M${histPath} L${xAt(hist.length-1)} ${padT+innerH} L${xAt(0)} ${padT+innerH} Z`} fill={`url(#${gid}-hist)`} stroke="none"/>
      <path d={`M${histPath}`} fill="none" stroke={`url(#${gid}-stroke)`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d={`M${projPath}`} fill="none" stroke={c} strokeOpacity="0.55" strokeWidth="1.25" strokeDasharray="3 3" strokeLinecap="round"/>
      <text x={xAt(0)} y={height-8} textAnchor="start" fontSize="9" fill={th.muted} style={{letterSpacing:"0.04em",textTransform:"uppercase"}}>{hist[0]?.label||""}</text>
      <text x={xAt(projStart)} y={height-8} textAnchor="middle" fontSize="9" fill={th.muted} style={{letterSpacing:"0.04em",textTransform:"uppercase"}}>Now</text>
      <text x={xAt(all.length-1)} y={height-8} textAnchor="end" fontSize="9" fill={th.muted} style={{letterSpacing:"0.04em",textTransform:"uppercase"}}>{proj[proj.length-1]?.label||""}</text>
    </svg>
  </div>;
}

/* ── v0.45.0 — Phase 5 Charts: SlopeGraph ───────────────────────────────────
   Tufte-style two-period comparison. Each line connects a category's value
   from period A to period B. Categories sorted by current value descending.
   Used for "this month vs last month" comparisons. */
function SlopeGraph({data,leftLabel="Prior",rightLabel="Current",height=240,width=460,placeholder}){
  const th=useTh();
  const items=(Array.isArray(data)?data:[]).filter(d=>d&&(d.a!=null||d.b!=null));
  const tw=useTweenedData(items.map(d=>({a:+d.a||0,b:+d.b||0})),800);
  const gid=useSvgId("slope");
  if(items.length===0)return<div style={{padding:18,fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center"}}>{placeholder||"No comparison data"}</div>;
  const padT=24,padB=22,padL=120,padR=120;
  const innerW=width-padL-padR,innerH=height-padT-padB;
  const all=tw.flatMap(p=>[p.a,p.b]);
  const mx=Math.max(1,...all);
  const yAt=v=>padT+innerH*(1-v/mx);
  const fmtV=v=>v>=1e6?(v/1e6).toFixed(1).replace(/\.0$/,"")+"M":v>=1000?Math.round(v/100)/10+"K":Math.round(v);
  // sort items by current value descending for label clarity
  const order=items.map((d,i)=>({...d,_i:i})).sort((a,b)=>(tw[b._i]?.b||0)-(tw[a._i]?.b||0));
  return<div style={{width:"100%",overflow:"hidden"}}>
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={{width:"100%",height:"auto",display:"block",fontFamily:"'JetBrains Mono',ui-monospace,Menlo,monospace"}}>
      <defs>
        {order.map((d,i)=>{const c=d.color||GOLD;return<linearGradient key={i} id={`${gid}-${i}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={c} stopOpacity="0.5"/>
          <stop offset="100%" stopColor={c} stopOpacity="0.95"/>
        </linearGradient>;})}
      </defs>
      {/* Axis labels at top */}
      <text x={padL} y={padT-8} textAnchor="end" fontSize="9" fontWeight="700" fill={th.muted} style={{letterSpacing:"0.06em",textTransform:"uppercase"}}>{leftLabel}</text>
      <text x={width-padR} y={padT-8} textAnchor="start" fontSize="9" fontWeight="700" fill={th.muted} style={{letterSpacing:"0.06em",textTransform:"uppercase"}}>{rightLabel}</text>
      {/* Vertical anchor lines */}
      <line x1={padL} y1={padT} x2={padL} y2={padT+innerH} stroke={th.dim} strokeOpacity="0.25" strokeWidth="0.75"/>
      <line x1={width-padR} y1={padT} x2={width-padR} y2={padT+innerH} stroke={th.dim} strokeOpacity="0.25" strokeWidth="0.75"/>
      {/* Lines + dots + labels */}
      {order.map((d,i)=>{
        const a=tw[d._i]?.a||0,b=tw[d._i]?.b||0;
        const ya=yAt(a),yb=yAt(b);
        const c=d.color||GOLD;
        const change=b-a;
        const pct=a>0?((change/a)*100).toFixed(0):0;
        return<g key={i}>
          <line x1={padL} y1={ya} x2={width-padR} y2={yb} stroke={`url(#${gid}-${i})`} strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx={padL} cy={ya} r="3.5" fill={c} stroke="#fff" strokeWidth="1.2"/>
          <circle cx={width-padR} cy={yb} r="3.5" fill={c} stroke="#fff" strokeWidth="1.2"/>
          <text x={padL-8} y={ya+3} textAnchor="end" fontSize="9" fontWeight="600" fill={th.text}>{(d.label||"").slice(0,14)}</text>
          <text x={padL-8} y={ya+13} textAnchor="end" fontSize="8" fill={th.dim} style={{fontVariantNumeric:"tabular-nums"}}>${fmtV(a)}</text>
          <text x={width-padR+8} y={yb+3} textAnchor="start" fontSize="9" fontWeight="600" fill={c} style={{fontVariantNumeric:"tabular-nums"}}>${fmtV(b)}</text>
          <text x={width-padR+8} y={yb+13} textAnchor="start" fontSize="8" fill={change>=0?th.pos:th.neg} style={{fontVariantNumeric:"tabular-nums"}}>{change>=0?"+":""}{pct}%</text>
        </g>;
      })}
    </svg>
  </div>;
}

/* ── v0.45.0 — Phase 5 Charts: Sunburst ────────────────────────────────────
   Nested radial chart — inner ring = parent categories, outer ring = children.
   Used for nested allocations (cash → checking/savings/MM, investments →
   401k/IRA/Brokerage, etc.). */
function Sunburst({data,size=240,placeholder}){
  const th=useTh();
  const groups=(Array.isArray(data)?data:[]).filter(g=>g&&Array.isArray(g.children)&&g.children.length>0);
  const allChildValues=groups.flatMap(g=>g.children.map(c=>+c.value||0));
  const tw=useTweenedData(allChildValues,800);
  const gid=useSvgId("sb");
  if(groups.length===0)return<div style={{padding:18,fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center"}}>{placeholder||"No nested data"}</div>;
  // Re-distribute tweened values back into groups
  let cursor=0;
  const groupsT=groups.map(g=>{const children=g.children.map(c=>{const v=tw[cursor]||0;cursor++;return{...c,value:v};});const total=children.reduce((s,c)=>s+c.value,0);return{...g,children,total};});
  const grand=groupsT.reduce((s,g)=>s+g.total,0)||1;
  const r=size/2-4,rInner=r*0.35,rMid=r*0.62,cx=size/2,cy=size/2;
  let angle=-Math.PI/2;
  const segs=[];
  groupsT.forEach((g,gi)=>{
    const groupFrac=g.total/grand;
    const groupStart=angle;
    const groupEnd=angle+groupFrac*2*Math.PI;
    angle=groupEnd;
    const groupColor=g.color||GOLD;
    // Parent ring (inner)
    const large=groupEnd-groupStart>Math.PI?1:0;
    const x1=cx+rMid*Math.cos(groupStart),y1=cy+rMid*Math.sin(groupStart);
    const x2=cx+rMid*Math.cos(groupEnd),y2=cy+rMid*Math.sin(groupEnd);
    const x3=cx+rInner*Math.cos(groupEnd),y3=cy+rInner*Math.sin(groupEnd);
    const x4=cx+rInner*Math.cos(groupStart),y4=cy+rInner*Math.sin(groupStart);
    segs.push({type:"parent",gi,path:`M${x1} ${y1} A${rMid} ${rMid} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`,color:groupColor,label:g.label,value:g.total});
    // Child segments (outer)
    let childAngle=groupStart;
    g.children.forEach((c,ci)=>{
      const cFrac=g.total>0?c.value/g.total:0;
      const cStart=childAngle+0.005;
      const cEnd=childAngle+cFrac*(groupEnd-groupStart)-0.005;
      childAngle+=cFrac*(groupEnd-groupStart);
      if(cEnd<=cStart)return;
      const cLarge=cEnd-cStart>Math.PI?1:0;
      const cx1=cx+r*Math.cos(cStart),cy1=cy+r*Math.sin(cStart);
      const cx2=cx+r*Math.cos(cEnd),cy2=cy+r*Math.sin(cEnd);
      const cx3=cx+rMid*Math.cos(cEnd),cy3=cy+rMid*Math.sin(cEnd);
      const cx4=cx+rMid*Math.cos(cStart),cy4=cy+rMid*Math.sin(cStart);
      segs.push({type:"child",gi,ci,path:`M${cx1} ${cy1} A${r} ${r} 0 ${cLarge} 1 ${cx2} ${cy2} L${cx3} ${cy3} A${rMid} ${rMid} 0 ${cLarge} 0 ${cx4} ${cy4} Z`,color:c.color||groupColor,label:c.label,value:c.value});
    });
  });
  return<div style={{width:size,height:size,display:"inline-block"}}>
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{display:"block",overflow:"visible"}}>
      <defs>
        {segs.map((s,i)=><radialGradient key={i} id={`${gid}-${i}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={s.color} stopOpacity={s.type==="parent"?0.95:0.55}/>
          <stop offset="100%" stopColor={s.color} stopOpacity={s.type==="parent"?0.7:0.85}/>
        </radialGradient>)}
      </defs>
      {segs.map((s,i)=><path key={i} d={s.path} fill={`url(#${gid}-${i})`} stroke="#fff" strokeOpacity="0.4" strokeWidth="0.5"/>)}
    </svg>
  </div>;
}

/* ── v0.45.0 — Phase 5 Charts: Dumbbell ─────────────────────────────────────
   Before/after comparison — two dots per row connected by a colored line.
   Used for debt-payoff progress (was $X, now $Y), savings goals, etc. */
function Dumbbell({data,leftLabel="Was",rightLabel="Now",height,width=460,maxRows=8,rowH=28,placeholder}){
  const th=useTh();
  const items=(Array.isArray(data)?data:[]).filter(d=>d).slice(0,maxRows);
  const tw=useTweenedData(items.map(d=>({a:+d.a||0,b:+d.b||0})),800);
  const gid=useSvgId("dmb");
  if(items.length===0)return<div style={{padding:18,fontSize:11,color:th.dim,fontStyle:"italic",textAlign:"center"}}>{placeholder||"No comparison data"}</div>;
  const padT=22,padL=120,padR=70;
  const h=height||(padT+items.length*rowH+12);
  const innerW=width-padL-padR;
  const all=tw.flatMap(p=>[p.a,p.b]);
  const mx=Math.max(1,...all);
  const xAt=v=>padL+(v/mx)*innerW;
  const fmtV=v=>v>=1e6?(v/1e6).toFixed(1).replace(/\.0$/,"")+"M":v>=1000?Math.round(v/100)/10+"K":Math.round(v);
  return<div style={{width:"100%",overflow:"hidden"}}>
    <svg viewBox={`0 0 ${width} ${h}`} preserveAspectRatio="xMidYMid meet" style={{width:"100%",height:"auto",display:"block",fontFamily:"'JetBrains Mono',ui-monospace,Menlo,monospace"}}>
      <defs>
        {items.map((d,i)=>{const a=tw[i]?.a||0,b=tw[i]?.b||0;const decreasing=b<a;const c=d.color||(decreasing?th.pos:th.neg);return<linearGradient key={i} id={`${gid}-${i}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={c} stopOpacity={decreasing?"0.95":"0.6"}/>
          <stop offset="100%" stopColor={c} stopOpacity={decreasing?"0.5":"0.95"}/>
        </linearGradient>;})}
      </defs>
      {/* Header labels */}
      <text x={padL} y={padT-8} textAnchor="middle" fontSize="9" fontWeight="700" fill={th.muted} style={{letterSpacing:"0.06em",textTransform:"uppercase"}}>{leftLabel}</text>
      <text x={padL+innerW} y={padT-8} textAnchor="middle" fontSize="9" fontWeight="700" fill={th.muted} style={{letterSpacing:"0.06em",textTransform:"uppercase"}}>{rightLabel}</text>
      {items.map((d,i)=>{
        const a=tw[i]?.a||0,b=tw[i]?.b||0;
        const xa=xAt(a),xb=xAt(b);
        const y=padT+i*rowH+rowH/2;
        const decreasing=b<a;
        const c=d.color||(decreasing?th.pos:th.neg);
        return<g key={i}>
          {/* Row label */}
          <text x={padL-10} y={y+3} textAnchor="end" fontSize="10" fontWeight="600" fill={th.text}>{(d.label||"").slice(0,14)}</text>
          {/* Connector */}
          <line x1={Math.min(xa,xb)} y1={y} x2={Math.max(xa,xb)} y2={y} stroke={`url(#${gid}-${i})`} strokeWidth="3" strokeLinecap="round"/>
          {/* "Was" dot (smaller, lighter) */}
          <circle cx={xa} cy={y} r="4" fill={th.cardBorder} stroke={c} strokeWidth="1.5"/>
          {/* "Now" dot (bigger, solid) */}
          <circle cx={xb} cy={y} r="5.5" fill={c} stroke="#fff" strokeWidth="1.5"/>
          {/* Value labels */}
          <text x={Math.min(xa,xb)-6} y={y+3} textAnchor="end" fontSize="8" fill={th.dim} style={{fontVariantNumeric:"tabular-nums"}}>${fmtV(a)}</text>
          <text x={Math.max(xa,xb)+8} y={y+3} textAnchor="start" fontSize="9" fontWeight="700" fill={c} style={{fontVariantNumeric:"tabular-nums"}}>${fmtV(b)}</text>
        </g>;
      })}
    </svg>
  </div>;
}


export { Donut, Waterfall, PairedBars, LiveTrendCard, SmoothAreaLine, Sankey, Treemap, RadialGauge, RankedHBars, BulletChart, Sparkline, Radar5, NetWorthBridge, PayoffProgression, AmortizationArea, CompoundGrowthStack, StackedBars, HeatmapCalendar, GroupedYoY, ForecastCone, SlopeGraph, Sunburst, Dumbbell };
