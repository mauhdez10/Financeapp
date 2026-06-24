// Client data management (import / backup / export / delete) — extracted from
// App.jsx in Phase 2 of docs/ARCHITECTURE-PLAN.md (D-37). Verbatim from single-file era.
import { useRef, useState } from "react";
import { useTh } from "../contexts/theme";
import { mCARD, mINP } from "../styles/theme";
import { fmt, gid, mig, mk, toM } from "../utils/finance";
import { expBackup, findDuplicate, parseCRMCsv, parseWorkbook, validateBackup } from "../utils/import";
import { BSolid, Btn, Field, Modal, Row2 } from "./primitives";
import { Anchor, Phone } from "lucide-react";

export function ImportWizard({onClose,onImport,existingClients,t}){
  const th=useTh();
  const[step,setStep]=useState('choose');
  const[mode,setMode]=useState('');
  const[xlFile,setXlFile]=useState(null);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState('');
  const[parsed,setParsed]=useState(null);
  const[csvClients,setCsvClients]=useState([]);
  const[selCSV,setSelCSV]=useState(new Set());
  const[names,setNames]=useState({firstName:'',lastName:'',partnerFirst:'',partnerLast:'',color1:'#4472C4',color2:'#ED7D31'});
  const[cardOwn,setCardOwn]=useState({});
  const[csvSearch,setCsvSearch]=useState('');
  const xlRef=useRef(),csvRef=useRef();
  const INP=mINP(th);

  const handleXLUpload=async f=>{
    if(!f)return;
    setXlFile(f);setLoading(true);setError('');
    try{
      const result=await parseWorkbook(f);
      setParsed(result);
      setNames(n=>({...n,firstName:result.p1n||'Unnamed',lastName:'Client',partnerFirst:result.p2n||'',color1:'#4472C4',color2:'#ED7D31'}));
      const owns={};
      result.rawCards.forEach(c=>{
        const det=c.owedBy!=='__joint__'?c.owedBy:null;
        // Default: joint for couples (flag detected person), p1 for single
        owns[c.id]=result.isCouple?'joint':(det&&det!=='__joint__'?'p1':'p1');
      });
      setCardOwn(owns);
      setLoading(false);
      setStep('names');
    }catch(err){setError(err.message);setLoading(false);}
  };

  const handleCSVUpload=f=>{
    if(!f)return;
    const reader=new FileReader();
    reader.onload=e=>{
      const clients=parseCRMCsv(e.target.result);
      setCsvClients(clients);
      // For 'both' mode start with nothing selected (user picks one); for csv mode select all
      setSelCSV(mode==='both'?new Set():new Set(clients.map(c=>c.id)));
      if(mode==='csv')setStep('csv_pick');
    };
    reader.readAsText(f);
  };

  const doImport=()=>{
    if(mode==='csv'){
      const toAdd=csvClients.filter(c=>selCSV.has(c.id)).map(c=>mig({...mk(),...c,monthSnapshots:[]}));
      onImport(toAdd);onClose();return;
    }
    // Excel or Both
    const isCouple=parsed.isCouple&&!!names.partnerFirst;
    // Apply card ownership
    const finalCards=parsed.rawCards.map(card=>({...card,owedBy:cardOwn[card.id]||'joint',promos:[]}));
    const snapshots=parsed.snapshots.map(snap=>({...snap,data:{...snap.data,cards:snap.data.cards.map(c=>({...c,owedBy:cardOwn[c.id]||'joint'}))}}));
    const allBills=parsed.bills.map(b=>({...b,assignedTo:isCouple?'joint':'p1',split:isCouple?{p1:50,p2:50}:{p1:100,p2:0}}));
    // CSV profile merge
    let profileData={};
    if(mode==='both'&&selCSV.size===1){
      const cc=csvClients.find(c=>selCSV.has(c.id));
      if(cc)profileData={email:cc.email,phone:cc.phone,address:cc.address,dob:cc.dob,social:cc.social,recommendedBy:cc.recommendedBy};
    }
    const newClient=mig({...mk(),...profileData,firstName:names.firstName||'Unnamed',lastName:names.lastName||'Client',partnerFirst:isCouple?names.partnerFirst:null,partnerLast:isCouple?names.partnerLast:null,color1:names.color1,color2:isCouple?names.color2:null,incomeStreams:parsed.incomeStreams,bills:allBills,cards:finalCards,accounts:[],loans:[],customAssets:[],monthSnapshots:snapshots});
    onImport([newClient]);onClose();
  };

  // ── RENDER STEPS ──
  if(step==='choose')return<Modal title={"📥 "+(t?.importClientData||"Import Client Data")} onClose={onClose}>
    <div style={{fontSize:12,color:th.muted,marginBottom:16}}>{t.whatImport||"What would you like to import?"}</div>
    {[['excel','📊','Financial Excel File','Import months of income, bills and debt from your Google Sheets export (.xlsx)'],['csv','👤','CRM Client List','Import client profiles from your insurance/health CRM export (.csv)'],['both','🔗','Link Both','Import Excel financial data and link it to a CRM client profile']].map(([m,icon,title,desc])=>
      <div key={m} onClick={()=>{setMode(m);setStep('upload');}} style={{...mCARD(th),padding:16,marginBottom:10,cursor:'pointer',display:'flex',gap:14,alignItems:'flex-start'}} onMouseEnter={e=>e.currentTarget.style.border=`1px solid ${th.accent}`} onMouseLeave={e=>e.currentTarget.style.border=`1px solid ${th.cardBorder}`}>
        <div style={{fontSize:28,flexShrink:0}}>{icon}</div>
        <div><div style={{fontWeight:700,color:th.text,marginBottom:3}}>{title}</div><div style={{fontSize:11,color:th.muted,lineHeight:1.5}}>{desc}</div></div>
      </div>
    )}
  </Modal>;

  if(step==='upload')return<Modal title={`📥 Upload File${mode==='both'?'s':''}`} onClose={onClose}>
    <input ref={xlRef} type="file" accept=".xlsx" onChange={e=>{if(e.target.files[0])handleXLUpload(e.target.files[0]);}} style={{display:'none'}}/>
    <input ref={csvRef} type="file" accept=".csv" onChange={e=>{if(e.target.files[0])handleCSVUpload(e.target.files[0]);}} style={{display:'none'}}/>
    {(mode==='excel'||mode==='both')&&<div style={{marginBottom:14}}>
      <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:6}}>📊 EXCEL FILE (.xlsx)</div>
      <div onClick={()=>xlRef.current?.click()} style={{...mCARD(th),padding:24,textAlign:'center',cursor:'pointer',border:`2px dashed ${xlFile&&!loading?th.pos:th.cardBorder}`,borderRadius:10}}>
        {loading?<><div style={{fontSize:14,marginBottom:4}}>⏳</div><div style={{fontSize:12,color:th.muted}}>{t.parsingMonths||"Parsing months…"}</div></>:xlFile?<><div style={{fontSize:14,marginBottom:4}}>✅</div><div style={{fontSize:12,color:th.pos,fontWeight:700}}>{xlFile.name}</div>{parsed&&<div style={{fontSize:11,color:th.muted,marginTop:4}}>{parsed.months.length} months found</div>}</>:<><div style={{fontSize:24,marginBottom:4}}>📂</div><div style={{fontSize:12,color:th.muted}}>{t.clickSelectXlsx||"Click to select .xlsx file"}<br/><span style={{fontSize:10}}>{t.googleSheetsExport||"Google Sheets export"}</span></div></>}
      </div>
      {parsed&&<div style={{...mCARD(th),padding:10,marginTop:8,fontSize:11}}>
        <div style={{color:th.muted,marginBottom:3}}>📅 {parsed.months.join(' · ')}</div>
        <div style={{color:th.muted,marginBottom:3}}>👤 {parsed.isCouple?`Couple: ${parsed.p1n||'P1'} & ${parsed.p2n||'P2'}`:`Single: ${parsed.p1n||'P1'}`}</div>
        <div style={{color:th.muted}}>💳 {parsed.rawCards.length} cards · 📋 {parsed.bills.length} bills · 💼 {parsed.incomeStreams.length} income streams</div>
      </div>}
      {error&&<div style={{fontSize:11,color:th.neg,marginTop:8,padding:8,background:th.neg+'11',borderRadius:8}}>⚠️ {error}</div>}
    </div>}
    {(mode==='csv'||mode==='both')&&<div style={{marginBottom:14}}>
      <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:6}}>{mode==='both'?'👤 OPTIONAL: CRM CSV FILE':'👤 CRM CSV FILE'}</div>
      <div onClick={()=>csvRef.current?.click()} style={{...mCARD(th),padding:20,textAlign:'center',cursor:'pointer',border:`2px dashed ${csvClients.length?th.pos:th.cardBorder}`,borderRadius:10}}>
        {csvClients.length?<><div style={{fontSize:14,marginBottom:4}}>✅</div><div style={{fontSize:12,color:th.pos,fontWeight:700}}>{csvClients.length} clients found</div></>:<><div style={{fontSize:24,marginBottom:4}}>📂</div><div style={{fontSize:12,color:th.muted}}>{t.clickSelectCsv||"Click to select .csv file"}</div></>}
      </div>
    </div>}
    <div style={{display:'flex',gap:8,justifyContent:'space-between',marginTop:8}}>
      <Btn onClick={()=>setStep('choose')}>Back</Btn>
      <div style={{display:'flex',gap:8}}>
        {mode==='excel'&&parsed&&!loading&&<BSolid onClick={()=>setStep('names')}>{t.continueArrow||"Continue →"}</BSolid>}
        {mode==='csv'&&csvClients.length>0&&<BSolid onClick={()=>setStep('csv_pick')}>{t.continueArrow||"Continue →"}</BSolid>}
        {mode==='both'&&parsed&&!loading&&<BSolid onClick={()=>setStep('names')}>{csvClients.length?'Continue →':'Skip CSV →'}</BSolid>}
      </div>
    </div>
  </Modal>;

  if(step==='names')return<Modal title={"👤 "+(t?.clientNamesTitle||"Client Names")} onClose={onClose}>
    <div style={{fontSize:11,color:th.muted,marginBottom:14}}>Names detected from the file — edit as needed.</div>
    <Row2><Field label={t?.firstName||"First Name"}><input style={INP} value={names.firstName} onChange={e=>setNames(n=>({...n,firstName:e.target.value}))}/></Field><Field label={t?.lastName||"Last Name"}><input style={INP} value={names.lastName} onChange={e=>setNames(n=>({...n,lastName:e.target.value}))}/></Field></Row2>
    {parsed?.isCouple&&<><div style={{height:1,background:th.cardBorder,margin:'12px 0'}}/><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>👥 Partner (detected in file)</div><Row2><Field label={t?.partnerFirst||"Partner First Name"}><input style={INP} value={names.partnerFirst} onChange={e=>setNames(n=>({...n,partnerFirst:e.target.value}))}/></Field><Field label={t?.partnerLast||"Partner Last Name"}><input style={INP} value={names.partnerLast} onChange={e=>setNames(n=>({...n,partnerLast:e.target.value}))}/></Field></Row2></>}
    <div style={{height:1,background:th.cardBorder,margin:'12px 0'}}/>
    <div style={{display:'flex',gap:16,marginBottom:4}}>
      <Field label={`${names.firstName||'P1'} Color`}><input type="color" value={names.color1} onChange={e=>setNames(n=>({...n,color1:e.target.value}))} style={{width:48,height:32,border:'none',cursor:'pointer',background:'none'}}/></Field>
      {parsed?.isCouple&&names.partnerFirst&&<Field label={`${names.partnerFirst} Color`}><input type="color" value={names.color2} onChange={e=>setNames(n=>({...n,color2:e.target.value}))} style={{width:48,height:32,border:'none',cursor:'pointer',background:'none'}}/></Field>}
    </div>
    <div style={{display:'flex',gap:8,justifyContent:'space-between',marginTop:16}}>
      <Btn onClick={()=>setStep('upload')}>Back</Btn>
      <BSolid onClick={()=>setStep(parsed?.rawCards?.length?'cards':mode==='both'&&csvClients.length?'csv_pick':'confirm')}>{t.continueArrow||"Continue →"}</BSolid>
    </div>
  </Modal>;

  if(step==='cards')return<Modal title={"💳 "+(t?.assignCardTitle||"Assign Card Ownership")} onClose={onClose} width={560}>
    <div style={{fontSize:11,color:th.muted,marginBottom:12}}>
      {parsed?.isCouple?'Cards default to Joint. ⚑ = originally detected under a specific person.':'Assign each card to the client.'}
    </div>
    <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:360,overflowY:'auto',marginBottom:16}}>
      {parsed?.rawCards.map(card=>{
        const detectedPerson=card.owedBy!=='__joint__'?card.owedBy:null;
        const cur=cardOwn[card.id]||'joint';
        const opts=[['p1',names.firstName||'P1'],parsed?.isCouple&&['joint','Joint'],parsed?.isCouple&&['p2',names.partnerFirst||'P2']].filter(Boolean);
        return<div key={card.id} style={{...mCARD(th),padding:'10px 14px',display:'flex',alignItems:'center',gap:12}}>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:700,color:th.text}}>{card.name}{detectedPerson&&<span style={{fontSize:10,color:th.warn,marginLeft:6}}>⚑ {detectedPerson}</span>}</div>
            <div style={{fontSize:11,color:th.dim}}>{fmt(card.balance)}{card.apr>0?` · ${card.apr}% APR`:' · 0% APR'}</div>
          </div>
          <div style={{display:'flex',gap:4}}>
            {opts.map(([v,l])=><button key={v} onClick={()=>setCardOwn(o=>({...o,[card.id]:v}))} style={{fontSize:11,padding:'3px 10px',borderRadius:6,cursor:'pointer',background:cur===v?th.accent+'33':'transparent',color:cur===v?th.accent:th.dim,border:`1px solid ${cur===v?th.accent:th.cardBorder}`,fontWeight:cur===v?700:400}}>{l}</button>)}
          </div>
        </div>;
      })}
    </div>
    <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
      <Btn onClick={()=>setStep('names')}>Back</Btn>
      <BSolid onClick={()=>setStep(mode==='both'&&csvClients.length?'csv_pick':'confirm')}>{t.continueArrow||"Continue →"}</BSolid>
    </div>
  </Modal>;

  if(step==='csv_pick'){const filteredCSV=csvClients.filter(c=>`${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(csvSearch.toLowerCase()));return<Modal title={"👥 "+(t?.selectClientTitle||"Select Client Profile")} onClose={onClose} width={520}>
    <div style={{fontSize:11,color:th.muted,marginBottom:10}}>{mode==='both'?'Select ONE client to link as profile for this import:':'Select which clients to import:'}</div>
    <div style={{display:'flex',gap:8,marginBottom:10,alignItems:'center'}}><input placeholder={t?.searchClientsPh||"Search clients…"} aria-label={t?.searchClientsPh||"Search clients"} value={csvSearch} onChange={e=>setCsvSearch(e.target.value)} style={{...mINP(th),flex:1,padding:'5px 10px',fontSize:12}}/>{mode!=='both'&&<><Btn small onClick={()=>setSelCSV(new Set(csvClients.map(x=>x.id)))}>All</Btn><Btn small onClick={()=>setSelCSV(new Set())}>None</Btn></>}</div>
    <div style={{display:'flex',flexDirection:'column',gap:5,maxHeight:320,overflowY:'auto',marginBottom:12}}>
      {filteredCSV.map(cl=>{
        const sel=selCSV.has(cl.id);
        return<div key={cl.id} onClick={()=>{if(mode==='both'){setSelCSV(new Set([cl.id]));}else{const ns=new Set(selCSV);sel?ns.delete(cl.id):ns.add(cl.id);setSelCSV(ns);}}} style={{...mCARD(th),padding:'9px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:10,border:`1px solid ${sel?th.accent:th.cardBorder}`}}>
          <div style={{width:17,height:17,borderRadius:3,background:sel?th.accent:th.cardBorder,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:10,color:'#fff',fontWeight:700}}>{sel&&'✓'}</div>
          <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:th.text}}>{cl.firstName} {cl.lastName}</div><div style={{fontSize:11,color:th.dim}}>{cl.email}{cl.phone?` · ${cl.phone}`:''}{cl.dob?` · ${cl.dob}`:''}</div></div>
        </div>;
      })}
      {!filteredCSV.length&&<div style={{fontSize:12,color:th.dim,padding:'12px',textAlign:'center'}}>{t.noClientsMatch||"No clients match search."}</div>}
    </div>
    <div style={{fontSize:11,color:th.dim,marginBottom:10}}>{mode==='both'?`${selCSV.size===1?'1 client selected':'Select 1 client to link'}`:`${selCSV.size} of ${csvClients.length} selected`}</div>
    <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
      <Btn onClick={()=>setStep(parsed?'cards':'upload')}>Back</Btn>
      <BSolid onClick={()=>mode==='csv'?doImport():setStep('confirm')} style={{opacity:selCSV.size===0?0.5:1}}>
        {mode==='csv'?`Import ${selCSV.size} Client${selCSV.size!==1?'s':''}`:mode==='both'&&selCSV.size===1?'Link & Continue →':'Select 1 to link'}
      </BSolid>
    </div>
  </Modal>;}

  if(step==='confirm'){
    const net=parsed?parsed.incomeStreams.reduce((s,i)=>s+toM(i.net,i.freq),0):0;
    const linkedCsv=mode==='both'&&selCSV.size===1?csvClients.find(c=>selCSV.has(c.id)):null;
    return<Modal title={"✅ "+(t?.reviewImportTitle||"Review & Import")} onClose={onClose}>
      <div style={{...mCARD(th),padding:18,marginBottom:14,background:th.pos+'08',border:`1px solid ${th.pos}33`}}>
        <div style={{fontSize:16,fontWeight:800,color:th.text,marginBottom:8}}>{names.firstName} {names.lastName}{names.partnerFirst?` & ${names.partnerFirst}`:''}</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:12}}>
          <div style={{color:th.accent,fontWeight:600}}>📅 {parsed?.snapshots?.length||0} months of data</div>
          <div style={{color:th.neg,fontWeight:600}}>💳 {parsed?.rawCards?.length||0} credit cards</div>
          <div style={{color:th.warn,fontWeight:600}}>📋 {parsed?.bills?.length||0} bills</div>
          <div style={{color:th.pos,fontWeight:600}}>💼 {fmt(net)}/mo income</div>
        </div>
      </div>
      {linkedCsv&&<div style={{...mCARD(th),padding:10,marginBottom:14,fontSize:11,color:th.muted}}>📎 Profile linked: {linkedCsv.firstName} {linkedCsv.lastName} · {linkedCsv.email}</div>}
      <div style={{fontSize:11,color:th.dim,marginBottom:16,lineHeight:1.6}}>Accounts, loans, and physical assets are not in the Excel — add them via the Intake tab after importing.</div>
      {(()=>{const fullName=`${names.firstName} ${names.lastName}`.toLowerCase();const dup=(existingClients||[]).find(c=>`${c.firstName} ${c.lastName}`.toLowerCase()===fullName);return dup?<div style={{...mCARD(useTh()),padding:12,marginBottom:14,background:useTh().warn+"11",border:`1px solid ${useTh().warn}44`,fontSize:12,color:useTh().warn}}>⚠️ A client named <b>{names.firstName} {names.lastName}</b> already exists. Importing will create a duplicate — consider archiving the existing one first.</div>:null;})()}
      <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
        <Btn onClick={()=>setStep(parsed?.rawCards?.length?'cards':mode==='both'&&csvClients.length?'csv_pick':'names')}>Back</Btn>
        <BSolid onClick={doImport}>✅ Import Client</BSolid>
      </div>
    </Modal>;
  }
  return null;
}

/* ── ARCHIVE / DELETE / BACKUP ───────────────────────────────────────────── */


export function DuplicateResolverModal({incoming,existing,onResolve,onClose,t}){const th=useTh();const pairs=incoming.map(inc=>({incoming:inc,match:findDuplicate(inc,existing)}));const dups=pairs.filter(p=>p.match);const news=pairs.filter(p=>!p.match);const[actions,setActions]=useState(()=>{const a={};dups.forEach(p=>{a[p.incoming.id||p.incoming.firstName+p.incoming.lastName]="merge";});return a;});const setAct=(id,v)=>setActions(p=>({...p,[id]:v}));const apply=()=>{const result=[];news.forEach(p=>result.push({action:"add",client:p.incoming}));dups.forEach(p=>{const k=p.incoming.id||p.incoming.firstName+p.incoming.lastName;const a=actions[k]||"merge";if(a==="skip")return;if(a==="new")result.push({action:"add",client:{...p.incoming,id:gid()}});else result.push({action:"merge",existing:p.match,incoming:p.incoming});});onResolve(result);onClose();};return<Modal title={"⚠️ "+(t?.dupClientsTitle||"Duplicate Clients Found")} onClose={onClose} width={600}><div style={{fontSize:12,color:th.muted,marginBottom:16,lineHeight:1.6}}>Found {dups.length} possible duplicate{dups.length!==1?"s":""} and {news.length} new client{news.length!==1?"s":""} in your import. Choose what to do with each match:</div>{dups.length>0&&<><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>⚠️ POSSIBLE DUPLICATES</div><div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16,maxHeight:300,overflowY:"auto"}}>{dups.map(p=>{const k=p.incoming.id||p.incoming.firstName+p.incoming.lastName;const a=actions[k]||"merge";return<div key={k} style={{...mCARD(th),padding:12,border:`1px solid ${th.warn}44`}}><div style={{display:"flex",gap:12,marginBottom:10}}><div style={{flex:1,fontSize:11}}><div style={{color:th.dim}}>📥 Incoming</div><div style={{fontWeight:700,color:th.text}}>{p.incoming.firstName} {p.incoming.lastName}</div><div style={{color:th.dim,fontSize:10}}>{p.incoming.email||p.incoming.p1Email||""}</div></div><div style={{flex:1,fontSize:11}}><div style={{color:th.dim}}>📂 Existing</div><div style={{fontWeight:700,color:th.text}}>{p.match.firstName} {p.match.lastName}</div><div style={{color:th.dim,fontSize:10}}>{p.match.email||p.match.p1Email||""}{p.match.partnerFirst?` · partner: ${p.match.partnerFirst}`:""} · {(p.match.monthSnapshots||[]).length}mo</div></div></div><div style={{display:"flex",gap:4}}>{[["merge","🔄 Merge (update empty fields)",th.blue],["skip","⏭️ Skip",th.dim],["new","➕ Import as New",th.warn]].map(([v,l,co])=><button key={v} onClick={()=>setAct(k,v)} style={{fontSize:10,padding:"4px 8px",borderRadius:6,cursor:"pointer",background:a===v?co+"22":"transparent",color:a===v?co:th.muted,border:`1px solid ${a===v?co:th.cardBorder}`,fontWeight:a===v?700:400,flex:1}}>{l}</button>)}</div></div>;})}</div></>}{news.length>0&&<div style={{fontSize:11,color:th.pos,marginBottom:14}}>✓ {news.length} new client{news.length!==1?"s":""} will be imported.</div>}<div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn onClick={onClose}>Cancel</Btn><BSolid onClick={apply}>Apply</BSolid></div></Modal>;}

export function DeleteClientModal({client,onConfirm,onClose,t}){const th=useTh();const name=`${client.firstName} ${client.lastName}`;return<Modal title={"🗑️ "+(t?.deleteClientTitle||"Delete Client")} onClose={onClose}><div style={{...mCARD(th),padding:14,marginBottom:16,background:th.neg+"11",border:`1px solid ${th.neg}33`}}><div style={{fontSize:13,fontWeight:700,color:th.neg,marginBottom:6}}>⚠️ This action is permanent</div><div style={{fontSize:12,color:th.muted,lineHeight:1.6}}>All data for <b>{name}</b> including {(client.monthSnapshots||[]).length} months of snapshots will be permanently deleted. This cannot be undone.</div></div><div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn onClick={onClose}>Cancel</Btn><button onClick={onConfirm} style={{fontSize:12,padding:"7px 16px",borderRadius:8,background:th.neg,color:"#fff",border:"none",cursor:"pointer",fontWeight:700}}>🗑️ Delete Forever</button></div></Modal>;}

export function BackupImportModal({onImport,onClose,existingClients,t}){const th=useTh();const[mode,setMode]=useState("restore");const[preview,setPreview]=useState(null);const[err,setErr]=useState("");const[search,setSearch]=useState("");const[sel,setSel]=useState(new Set());const[confirmReplace,setConfirmReplace]=useState(false);const fileRef=useRef();const handleFile=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const d=validateBackup(ev.target.result);if(!d){setErr("Invalid backup file. Must be a Golden Anchor .json backup.");return;}setPreview(d);setErr("");const allIds=new Set(d.clients.map(c=>c.id));setSel(allIds);};r.readAsText(f);};const exNames=new Set((existingClients||[]).map(c=>`${c.firstName} ${c.lastName}`.toLowerCase()));const filtered=(preview?.clients||[]).filter(c=>{const n=`${c.firstName} ${c.lastName}`;return n.toLowerCase().includes(search.toLowerCase());});const isDup=c=>exNames.has(`${c.firstName} ${c.lastName}`.toLowerCase());const doImport=()=>{if(!preview)return;if(mode==="replace"){onImport(preview,"replace");onClose();}else{const selClients=preview.clients.filter(c=>sel.has(c.id));onImport({...preview,clients:selClients},"restore");onClose();}};return<Modal title={"📥 "+(t?.restoreBackupTitle||"Restore Backup")} onClose={onClose} width={560}><input ref={fileRef} type="file" accept=".json" onChange={handleFile} style={{display:"none"}}/><div onClick={()=>fileRef.current?.click()} style={{...mCARD(th),padding:16,textAlign:"center",cursor:"pointer",border:`2px dashed ${preview?th.pos:th.cardBorder}`,borderRadius:10,marginBottom:14}}>{preview?<><div style={{fontSize:14,marginBottom:2}}>✅</div><div style={{fontSize:12,color:th.pos,fontWeight:700}}>{preview.clients.length} clients in backup</div><div style={{fontSize:11,color:th.muted}}>From {new Date(preview.ts).toLocaleDateString()}</div></>:<><div style={{fontSize:24,marginBottom:4}}>📂</div><div style={{fontSize:12,color:th.muted}}>Select .json backup file</div></>}</div>{err&&<div style={{fontSize:11,color:th.neg,marginBottom:12,padding:"8px 10px",background:th.neg+"11",borderRadius:8}}>{err}</div>}{preview&&<><div style={{display:"flex",gap:8,marginBottom:10}}>{[["restore","🔄 Restore (select clients)"],["replace","⚠️ Replace All"]].map(([v,l])=><button key={v} onClick={()=>setMode(v)} style={{fontSize:11,padding:"5px 12px",borderRadius:7,cursor:"pointer",background:mode===v?(v==="replace"?th.neg:th.accent)+"22":"transparent",color:mode===v?(v==="replace"?th.neg:th.accent):th.muted,border:`1px solid ${mode===v?(v==="replace"?th.neg:th.accent):th.cardBorder}`,fontWeight:mode===v?700:400}}>{l}</button>)}</div>{mode==="restore"&&<><div style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}><input placeholder={t?.searchClientsPh||"Search clients…"} aria-label={t?.searchClientsPh||"Search clients"} value={search} onChange={e=>setSearch(e.target.value)} style={{...mINP(th),flex:1,padding:"5px 10px"}}/><Btn small onClick={()=>setSel(new Set(preview.clients.map(c=>c.id)))}>Select All</Btn><Btn small onClick={()=>setSel(new Set())}>Clear</Btn></div><div style={{maxHeight:240,overflowY:"auto",marginBottom:10,display:"flex",flexDirection:"column",gap:4}}>{filtered.map(c=>{const dup=isDup(c);const selected=sel.has(c.id);return<div key={c.id} onClick={()=>{const ns=new Set(sel);selected?ns.delete(c.id):ns.add(c.id);setSel(ns);}} style={{...mCARD(th),padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,border:`1px solid ${selected?th.accent:th.cardBorder}`}}><div style={{width:16,height:16,borderRadius:3,background:selected?th.accent:th.cardBorder,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:10,color:"#fff"}}>{selected&&"✓"}</div><div style={{flex:1}}><span style={{fontSize:12,fontWeight:600,color:th.text}}>{c.firstName} {c.lastName}</span>{dup&&<span style={{fontSize:10,color:th.warn,marginLeft:6,padding:"1px 5px",background:th.warn+"22",borderRadius:4}}>⚑ exists — will update</span>}{!dup&&<span style={{fontSize:10,color:th.pos,marginLeft:6}}>new</span>}</div><div style={{fontSize:11,color:th.dim}}>{(c.monthSnapshots||[]).length}mo</div></div>;})} </div><div style={{fontSize:11,color:th.dim,marginBottom:8}}>{sel.size} of {preview.clients.length} selected · {filtered.filter(c=>isDup(c)&&sel.has(c.id)).length} will update · {filtered.filter(c=>!isDup(c)&&sel.has(c.id)).length} will be added</div></>}{mode==="replace"&&<div style={{...mCARD(th),padding:14,marginBottom:10,background:th.neg+"08",border:`1px solid ${th.neg}33`}}><div style={{fontSize:12,fontWeight:700,color:th.neg,marginBottom:8}}>⚠️ Replace All will permanently delete your current clients and replace with:</div><div style={{maxHeight:160,overflowY:"auto"}}>{preview.clients.map(c=><div key={c.id} style={{fontSize:11,color:th.muted,padding:"3px 0"}}>{c.firstName} {c.lastName} · {(c.monthSnapshots||[]).length} months</div>)}</div></div>}</>}<div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn onClick={onClose}>Cancel</Btn>{preview&&<button onClick={doImport} style={{fontSize:12,padding:"7px 16px",borderRadius:8,background:mode==="replace"?th.neg:th.accent,color:"#fff",border:"none",cursor:"pointer",fontWeight:700}}>{mode==="replace"?"⚠️ Replace All":"✅ Restore "+sel.size+" Clients"}</button>}</div></Modal>;}

export function ArchivedSection({clients,onRestore,onDelete,t}){const th=useTh();const archived=clients.filter(c=>c.archived);const[open,setOpen]=useState(false);const[delTarget,setDelTarget]=useState(null);if(!archived.length)return null;return<div style={{...mCARD(th),padding:14,marginTop:16,border:`1px solid ${th.warn}33`}}>{delTarget&&<DeleteClientModal client={delTarget} onConfirm={()=>{onDelete(delTarget.id);setDelTarget(null);}} onClose={()=>setDelTarget(null)} t={t}/>}<div onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}><span style={{fontSize:12,fontWeight:700,color:th.warn}}>📦 Archived Clients ({archived.length})</span><span style={{color:th.dim,fontSize:12}}>{open?"▲":"▼"}</span></div>{open&&<div style={{marginTop:12,display:"flex",flexDirection:"column",gap:6}}>{archived.map(c=><div key={c.id} style={{...mCARD(th),padding:"10px 14px",display:"flex",alignItems:"center",gap:12}}><div style={{width:32,height:32,borderRadius:99,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,background:th.muted+"22",color:th.muted,border:`2px solid ${th.muted}44`,flexShrink:0,filter:"grayscale(1)"}}>{c.firstName[0]}{c.lastName[0]}</div><div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:th.muted}}>{c.firstName} {c.lastName}{c.partnerFirst?` & ${c.partnerFirst}`:""}</div><div style={{fontSize:11,color:th.dim}}>{c.email}</div></div><div style={{display:"flex",gap:6}}><Btn small onClick={()=>onRestore(c.id)} color={th.pos}>↩ Restore</Btn><Btn small onClick={()=>{expBackup([c],{});}} color={th.blue}>⬇ Export</Btn><Btn small onClick={()=>setDelTarget(c)} color={th.neg}>🗑️</Btn></div></div>)}</div>}</div>;}
export function ExportModal({clients,onClose,t}){const th=useTh();const[format,setFormat]=useState("backup");const[mode,setMode]=useState("all");const[search,setSearch]=useState("");const[sel,setSel]=useState(new Set(clients.map(c=>c.id)));const filtered=clients.filter(c=>!c.archived&&`${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()));const doExport=()=>{const toExp=mode==="all"?clients.filter(c=>!c.archived):clients.filter(c=>sel.has(c.id));if(format==="backup")expBackup(toExp,{});else{const rows=["Name,Email,Phone,DOB,Address,SSN,Type,Referred By"];toExp.forEach(c=>{rows.push(`"${c.firstName} ${c.lastName}","${c.email||""}","${c.phone||""}","${c.dob||""}","${c.address||""}","${c.social||""}","${c.clientType||""}","${c.recommendedBy||""}"`);});const blob=new Blob([rows.join("\n")],{type:"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`golden_anchor_clients_${new Date().toISOString().slice(0,10)}.csv`;a.click();}onClose();};return<Modal title={"⬇️ "+(t?.exportClientsTitle||"Export Clients")} onClose={onClose} width={500}><div style={{marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>Format</div><div style={{display:"flex",gap:8}}>{[["backup","💾 Full Backup (.json)","Includes all financial data, snapshots — re-importable"],["csv","👤 Profile CSV","Names, email, phone, DOB — importable as CRM profiles"]].map(([v,l,d])=><div key={v} onClick={()=>setFormat(v)} style={{...mCARD(th),padding:12,cursor:"pointer",flex:1,border:`1px solid ${format===v?th.accent:th.cardBorder}`}}><div style={{fontSize:12,fontWeight:700,color:format===v?th.accent:th.text,marginBottom:3}}>{l}</div><div style={{fontSize:10,color:th.muted}}>{d}</div></div>)}</div></div><div style={{marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8}}>Which clients</div><div style={{display:"flex",gap:8,marginBottom:10}}>{[["all","All Active"],["select","Select Clients"]].map(([v,l])=><button key={v} onClick={()=>setMode(v)} style={{fontSize:11,padding:"5px 14px",borderRadius:8,cursor:"pointer",background:mode===v?th.accent+"22":"transparent",color:mode===v?th.accent:th.muted,border:`1px solid ${mode===v?th.accent:th.cardBorder}`,fontWeight:mode===v?700:400}}>{l}</button>)}</div>{mode==="select"&&<><div style={{display:"flex",gap:8,marginBottom:6}}><input placeholder={t?.searchPh||"Search…"} aria-label={t?.searchClientsPh||"Search clients"} value={search} onChange={e=>setSearch(e.target.value)} style={{...mINP(th),flex:1,padding:"5px 10px"}}/><Btn small onClick={()=>setSel(new Set(clients.filter(c=>!c.archived).map(c=>c.id)))}>All</Btn><Btn small onClick={()=>setSel(new Set())}>None</Btn></div><div style={{maxHeight:200,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>{filtered.map(c=>{const s=sel.has(c.id);return<div key={c.id} onClick={()=>{const ns=new Set(sel);s?ns.delete(c.id):ns.add(c.id);setSel(ns);}} style={{...mCARD(th),padding:"7px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,border:`1px solid ${s?th.accent:th.cardBorder}`}}><div style={{width:15,height:15,borderRadius:3,background:s?th.accent:th.cardBorder,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff"}}>{s&&"✓"}</div><span style={{fontSize:12,color:th.text}}>{c.firstName} {c.lastName}</span><span style={{fontSize:10,color:th.dim,marginLeft:"auto"}}>{(c.monthSnapshots||[]).length}mo</span></div>;})} </div><div style={{fontSize:11,color:th.dim,marginTop:6}}>{sel.size} selected</div></>}</div><div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn onClick={onClose}>Cancel</Btn><BSolid onClick={doExport}>{format==="backup"?"💾 Export Backup":"📄 Export CSV"}</BSolid></div></Modal>;}

/* ── v0.39.0 — Dashboard chart catalog (option labels). Shared by the gear
   dropdown on each card and by the ChartSettingsModal in the avatar menu. */

