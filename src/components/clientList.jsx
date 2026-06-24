// Client list page — extracted from App.jsx in Phase 2 of
// docs/ARCHITECTURE-PLAN.md (D-37). Verbatim from the single-file era.
import { useState } from "react";
import { useTh } from "../contexts/theme";
import { mCARD, mINP } from "../styles/theme";
import { fmt, sumN, totalA, totalL } from "../utils/finance";
import { expBackup } from "../utils/import";
import { BackupImportModal, ExportModal, ImportWizard } from "./clientData";
import { JoinModal, SplitAssignModal } from "./clientModals";
import { Btn, Kebab, Modal, useViewport } from "./primitives";
import { Archive } from "lucide-react";

export function ClientList({clients,t,onSelect,onAdd,onRestore,onImportNew,onRestoreBackup,onArchiveMany,onRestoreMany,onDeleteMany,onSplit,onJoin}){
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
  const[shown,setShown]=useState(80); // v0.82.1 — windowed render: cap DOM nodes at high client counts
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
      <input placeholder={"🔍 "+(t.searchClients||"Search...")} aria-label={t?.searchClientsPh||"Search clients"} value={search} onChange={e=>{setSearch(e.target.value);setShown(80);}} style={{...mINP(th),flex:isMobile?"1 1 100%":"1 1 320px",minWidth:0,padding:"7px 12px",fontSize:12,boxSizing:"border-box"}}/>
      {/* v0.25.1 — sort dropdown is now compact (~180px), label-prefixed once, value reads cleanly */}
      <select value={sortBy} onChange={e=>{setSortBy(e.target.value);setShown(80);}} title={t?.sortBy||"Sort by"} aria-label={t?.sortBy||"Sort clients by"} style={{...mINP(th),padding:"7px 28px 7px 12px",fontSize:11,fontWeight:600,cursor:"pointer",flex:"0 0 auto",width:isMobile?"100%":190,minWidth:0}}>
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
    <div style={{display:"flex",flexDirection:"column",gap:8}}>{filtered.slice(0,shown).map(c=>{const selectable=mode!==null&&activeSelectable;const dim=mode!==null&&!selectable;const on=sel.has(c.id);return<div key={c.id} className="ga-lift" onClick={()=>{if(mode===null)onSelect(c);else if(selectable)toggleSel(c.id);}} style={{...mCARD(th),padding:isMobile?"10px 12px":"12px 16px",display:"flex",alignItems:"center",gap:isMobile?10:12,cursor:(mode===null||selectable)?"pointer":"default",opacity:dim?0.4:1,border:`1px solid ${(on&&mm)?mm.color:th.cardBorder}`,flexWrap:isMobile?"wrap":"nowrap"}}>{selectable&&<Cbx on={on} color={mm.color}/>}<div style={{width:isMobile?34:36,height:isMobile?34:36,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,fontSize:13,fontFamily:"'JetBrains Mono',monospace",background:c.color1+"22",color:c.color1,border:`1px solid ${c.color1}44`,flexShrink:0}}>{c.firstName[0]}{c.lastName[0]}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:700,color:th.text,overflow:"hidden",textOverflow:"ellipsis"}}>{c.firstName} {c.lastName}{c.partnerFirst&&<span style={{color:th.dim,fontWeight:400}}> & {c.partnerFirst}</span>}</div><div style={{fontSize:11,color:th.dim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.email}{!isMobile&&` · ${(c.monthSnapshots||[]).length} snapshots`}</div></div>{!isMobile&&<span style={{color:th.muted,fontSize:11,flexShrink:0}}>{fmt(sumN(c.incomeStreams))}/mo</span>}{/* v0.25.1 — per-row kebab removed per user request. Use the section kebab + the per-client kebab inside ClientDetail header instead. */}{!isMobile&&mode===null&&<span style={{color:th.accent,fontSize:16,flexShrink:0}}>›</span>}{isMobile&&<div style={{flexBasis:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,paddingTop:6,marginTop:2,borderTop:`1px solid ${th.cardBorder}`,fontSize:11}}><span style={{color:th.dim}}>{(c.monthSnapshots||[]).length} snapshots</span><span style={{color:th.muted,fontWeight:600}}>{fmt(sumN(c.incomeStreams))}/mo</span></div>}</div>;})}{filtered.length>shown&&<button onClick={()=>setShown(s=>s+120)} style={{marginTop:4,alignSelf:"flex-start",fontSize:12,padding:"8px 16px",borderRadius:8,background:th.inp,color:th.muted,border:`1px solid ${th.cardBorder}`,cursor:"pointer",fontWeight:600}}>{(t.showMoreClients||"Show more")+" ("+(filtered.length-shown)+")"}</button>}
    {!filtered.length&&<div style={{fontSize:12,color:th.dim,fontStyle:"italic",padding:"8px 2px"}}>{t.noClientsMsg||"No clients found."}</div>}</div>
    {archived.length>0&&<div style={{marginTop:20,borderTop:`1px solid ${th.cardBorder}`,paddingTop:16}}>
      <button onClick={()=>setShowArch(s=>!s)} style={{fontSize:12,fontWeight:700,color:th.warn,background:"transparent",border:"none",cursor:"pointer",marginBottom:10}}>📦 {t.archivedClientsLbl||"Archived Clients"} ({archived.length}) {showArch?"▲":"▼"}</button>
      {showArch&&<div style={{display:"flex",flexDirection:"column",gap:6}}>{archived.map(c=>{const selectable=mode!==null&&archivedSelectable;const dim=mode!==null&&!selectable;const on=sel.has(c.id);return<div key={c.id} onClick={()=>{if(selectable)toggleSel(c.id);}} style={{...mCARD(th),padding:isMobile?"9px 12px":"10px 14px",display:"flex",alignItems:"center",gap:isMobile?10:12,cursor:selectable?"pointer":"default",opacity:dim?0.4:0.85,border:`1px solid ${(on&&mm)?mm.color:th.cardBorder}`,flexWrap:isMobile?"wrap":"nowrap"}}>{selectable&&<Cbx on={on} color={mm.color}/>}<div style={{width:isMobile?32:36,height:isMobile?32:36,borderRadius:99,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,background:th.muted+"22",color:th.muted,border:`2px solid ${th.muted}44`,flexShrink:0,filter:"grayscale(1)"}}>{c.firstName[0]}{c.lastName[0]}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:th.muted,overflow:"hidden",textOverflow:"ellipsis"}}>{c.firstName} {c.lastName}{c.partnerFirst&&<span style={{fontWeight:400}}> & {c.partnerFirst}</span>}</div><div style={{fontSize:11,color:th.dim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.email}</div></div>{mode===null&&<div style={{display:"flex",gap:6,flexBasis:isMobile?"100%":"auto",justifyContent:isMobile?"flex-end":"flex-start"}}><button onClick={e=>{e.stopPropagation();onSelect(c);}} style={{fontSize:11,padding:"4px 10px",borderRadius:7,background:th.inp,color:th.muted,border:`1px solid ${th.cardBorder}`,cursor:"pointer"}}>{t.viewLbl||"View"}</button><button onClick={e=>{e.stopPropagation();onRestore(c.id);}} style={{fontSize:11,padding:"4px 10px",borderRadius:7,background:th.pos+"22",color:th.pos,border:`1px solid ${th.pos}44`,cursor:"pointer",fontWeight:700}}>↩ {t.restoreLbl||"Restore"}</button></div>}</div>;})}</div>}
    </div>}
  </div>;
}

