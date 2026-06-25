// Import / CSV / backup / dedupe helpers — extracted from App.jsx in Phase 2 of
// docs/ARCHITECTURE-PLAN.md (D-37). Pure data helpers (only finance utils + XLSX).
import * as XLSX from "xlsx";
import { gid, sumB, toM } from "./finance";
import { MS } from "../constants/meta";

export const expBackup=async(clients,settings)=>{const data=JSON.stringify({__ga_backup__:true,v:2,ts:Date.now(),clients,settings},null,2);const fname="golden_anchor_backup_"+new Date().toISOString().slice(0,10)+".json";try{if(typeof window!=="undefined"&&window.showSaveFilePicker){const h=await window.showSaveFilePicker({suggestedName:fname,types:[{description:"Golden Anchor backup (JSON)",accept:{"application/json":[".json"]}}]});const w=await h.createWritable();await w.write(data);await w.close();return;}}catch(e){if(e&&e.name==="AbortError")return;}const blob=new Blob([data],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=fname;a.click();};
export const validateBackup=json=>{try{const d=JSON.parse(json);return d.__ga_backup__&&Array.isArray(d.clients)?d:null;}catch{return null;}};
/* ── EXCEL / CSV IMPORTER ────────────────────────────────────────────────── */
export const xFreq=f=>{const s=(f||'').toLowerCase().replace(/[-\s]/g,'');if(s.includes('biweek')||s.includes('byweek'))return'biweekly';if(s.includes('week'))return'weekly';if(s.includes('year')||s.includes('annual'))return'annual';return'monthly2';};
export const SKIP_SH=new Set(['cover','cover page','debt','savings','model-r','model','intro','graphs','summary']);
export const moIdx=n=>{const m={jan:0,january:0,enero:0,feb:1,february:1,febrero:1,mar:2,march:2,marzo:2,apr:3,april:3,abril:3,may:4,mayo:4,jun:5,june:5,junio:5,jul:6,july:6,julio:6,aug:7,august:7,agosto:7,sep:8,september:8,septiembre:8,sept:8,oct:9,october:9,octubre:9,nov:10,november:10,noviembre:10,dec:11,december:11,diciembre:11,dic:11};const k=n.toLowerCase().replace(/[^a-záéíóúñ]/g,'').slice(0,10);for(const[key,v]of Object.entries(m))if(k.startsWith(key.slice(0,4)))return v;return-1;};
export const isMonthSh=n=>{const lc=n.toLowerCase().trim();return!SKIP_SH.has(lc)&&(moIdx(lc)>=0||/\d{4}/.test(lc));};
export const shToLabel=n=>{const t=n.trim();const m=t.match(/^([A-Za-záéíóúñ]+)(\d{4})$/i);if(m){const i=moIdx(m[1]);return i>=0?`${MS[i]} ${m[2]}`:t;}const i=moIdx(t);if(i>=0){const now=new Date();const yr=i>now.getMonth()?now.getFullYear()-1:now.getFullYear();return`${MS[i]} ${yr}`;}return t;};

export function parseMonthRows(rows){
  const r={bills:[],incP1:[],incP2:[],cards:[],tempM:[],annualB:[],p1n:'',p2n:'',p1tot:0,p2tot:0};
  let st='idle',curIP=null,curDP=null,curSrc='',tc=0;
  const cv=(row,i)=>row[i]===null||row[i]===undefined?'':String(row[i]).trim();
  const cn=(row,i)=>parseFloat(row[i])||0;
  const rT=row=>row.map(v=>(v||'').toString().toLowerCase()).join(' ');
  for(let i=0;i<rows.length;i++){
    const row=rows[i]||[];const txt=rT(row);
    if(!txt.replace(/\s/g,''))continue;
    const b=cv(row,1),c=cv(row,2);
    const e=cn(row,4),g=cn(row,6),h=cn(row,7),jv=cn(row,9);
    // Temp bills (must check before debt/bills)
    if(txt.includes('temporary bills')&&!txt.includes('total')&&!txt.includes('temp credit')){tc++;st=tc===1?'tm':'ta';curSrc='';continue;}
    // Debt section header
    if(!txt.includes('total')&&txt.includes('debt')&&(txt.includes('apr')||txt.includes('$'))&&!txt.includes('interest free')&&!txt.includes('interest debt')&&e===0){st='debt';curDP=null;continue;}
    if(st==='debt'&&(txt.includes('credit cards')||txt.includes('credito')))continue;
    // Bills sections
    if(!txt.includes('total')&&!txt.includes('temporary')&&(txt.includes('bills')||txt.includes('gastos'))&&(txt.includes('1st')||txt.includes('1ra')||txt.includes('primera')||txt.includes('quarter')||st==='idle')){st='b1';continue;}
    if(!txt.includes('total')&&!txt.includes('temporary')&&(txt.includes('bills')||txt.includes('gastos'))&&(txt.includes('2nd')||txt.includes('segunda'))){st='b2';continue;}
    if((st==='b1'||st==='b2')&&txt.includes('total cost')){st='ab';continue;}
    // Income: paycheck style ("Mauricio's Paycheck", "Chabeli's Check")
    if(txt.match(/[''`]s?\s*(paycheck|check)\b/)&&!txt.includes('total')){
      const np=(b+' '+c).match(/([A-Za-záéíóúñ]{3,})[''`]s?\s*(paycheck|check)/i);
      const det=np?np[1]:'';
      if(!r.p1n||det.toLowerCase()===r.p1n.toLowerCase()){r.p1n=det||r.p1n||'P1';curIP='p1';st='inc';}
      else{r.p2n=r.p2n||det;curIP='p2';st='inc';}
      curSrc='';continue;
    }
    // Income: "Primera Quincena - Name" style
    if(!txt.includes('total')&&(txt.includes('primera')||(txt.includes('quincena')&&!txt.includes('segunda')))&&!txt.includes('temporary')){
      const dm=(b+' '+c).match(/[-–]\s*([A-Za-záéíóúñ]+)/);
      r.p1n=r.p1n||(dm?dm[1]:'P1');curIP='p1';st='inc';curSrc='';continue;
    }
    if(!txt.includes('total')&&(txt.includes('segunda')||(txt.includes('quincena')&&txt.includes('segunda')))&&!txt.includes('temporary')){
      const dm=(b+' '+c).match(/[-–]\s*([A-Za-záéíóúñ]+)/);
      r.p2n=r.p2n||(dm?dm[1]:'');curIP='p2';st='inc';curSrc='';continue;
    }
    // Total Earnings
    if(txt.includes('total earnings')){
      const tot=cn(row,3)||cn(row,4);
      if(curIP==='p1'&&tot>0)r.p1tot=tot;
      if(curIP==='p2'&&tot>0)r.p2tot=tot;
      st='ai';continue;
    }
    // === EXTRACT DATA ===
    // Bills
    if(st==='b1'||st==='b2'){
      const nm=b||c;const day=parseInt(cv(row,3))||null;
      if(nm&&e>0&&!nm.toLowerCase().match(/total|bills|gastos|temp/))
        r.bills.push({id:gid(),name:nm,assignedTo:'joint',cost:e,type:'regular',freq:'monthly2',dueDay:isNaN(day)?null:day,split:{p1:50,p2:50}});
    }
    // Income source label within income section (e.g. "Mediapro", "Victoria's Check")
    if(st==='inc'&&b&&!c&&e===0&&cn(row,3)===0&&b.length>1&&!b.toLowerCase().match(/total|income|salary|1st|2nd/)){
      curSrc=b.replace(/[''`]s?\s*(check|paycheck)/i,'').trim();
    }
    // Income paystubs
    if(st==='inc'&&c&&(cn(row,3)>0||cn(row,4)>0)){
      const actual=cn(row,3),sugg=cn(row,4),amt=actual>0?actual:sugg;
      if(amt>0&&c.length>1&&!c.toLowerCase().match(/^total|^1st income|^2nd income|^income/i)){
        const raw=c.replace(/[''`]s?\s*(1st|2nd|3rd|4th)?\s*paystub/i,'').trim();
        const label=raw||curSrc||'Paycheck';
        (curIP==='p1'?r.incP1:r.incP2).push({label,amount:amt});
      }
    }
    // Periodic income "Total" (not "Total Earnings") to capture per-person sub-totals
    if(st==='inc'&&(b.toLowerCase()==='total'||c.toLowerCase()==='total')&&(cn(row,3)>0||cn(row,4)>0)){
      const tot=cn(row,3)||cn(row,4);
      if(curIP==='p1'&&tot>r.p1tot)r.p1tot=tot;
      if(curIP==='p2'&&tot>r.p2tot)r.p2tot=tot;
    }
    // Debt cards
    if(st==='debt'){
      // Person sub-header (single name, no balance, no APR, no min pay, no due day) — stricter to avoid eating 0-balance cards
      if(c&&!b&&e===0&&g===0&&h===0&&jv===0&&!c.match(/^\d/)&&!txt.match(/credit|loan|card|total|interest|visa|amex|mastercard|discover|chase|capital|citi|wells|bank/i)&&c.length>1&&c.length<25){curDP=c;continue;}
      if(c&&!c.toLowerCase().match(/total|interest|credit cost|free debt/)){
        const apr=g>1?Math.round(g*10)/10:Math.round(g*1000)/10;
        r.cards.push({id:gid(),name:c,balance:e||0,apr:apr||0,min:h||0,limit:0,promos:[],owedBy:curDP||'__joint__',dueDay:jv||null});
      }
    }
    // Temp monthly (loans/recurring)
    if(st==='tm'){
      const nm=c;const amt=cn(row,8)||h||e;const freq=cv(row,6);
      if(nm&&amt>0&&!nm.toLowerCase().match(/total|interest|free|debt|credit cost/))
        r.tempM.push({id:gid(),name:nm,assignedTo:'joint',cost:amt,type:'temporary',freq:xFreq(freq)||'monthly2',dueDay:null,split:{p1:50,p2:50}});
    }
    // Annual bills
    if(st==='ta'){
      const nm=c;const freq=cv(row,6);
      if(nm&&e>0&&!nm.toLowerCase().match(/total|paid|cost/)){
        const biY=freq.toLowerCase().match(/bi.?year|6.?month/);
        r.annualB.push({id:gid(),name:nm,assignedTo:'joint',cost:biY?e*2:e,type:'annual',freq:'annual',dueDay:null,split:{p1:50,p2:50}});
      }
    }
  }
  return r;
}

export function buildStreams(pr,p1Name,p2Name){
  const streams=[];
  const addP=(incArr,tot,person,name)=>{
    if(incArr.length>0){
      const grp={};
      incArr.forEach(s=>{const k=s.label||'Income';(grp[k]=(grp[k]||0)+s.amount);});
      const entries=Object.entries(grp).filter(([,v])=>v>0);
      // If all entries are generic ("Paycheck"/"Income") and we have a total, use total as one stream
      const allGeneric=entries.every(([k])=>k.match(/^(paycheck|income|paystub)$/i));
      if(allGeneric&&tot>0){
        streams.push({id:gid(),person,label:(name||person)+' Income',gross:tot,net:tot,freq:'monthly2'});
      } else {
        entries.forEach(([label,net])=>streams.push({id:gid(),person,label,gross:net,net,freq:'monthly2'}));
      }
    } else if(tot>0){
      streams.push({id:gid(),person,label:(name||person)+' Income',gross:tot,net:tot,freq:'monthly2'});
    }
  };
  addP(pr.incP1,pr.p1tot,'p1',p1Name);
  if(pr.p2n||p2Name)addP(pr.incP2,pr.p2tot,'p2',p2Name||pr.p2n);
  return streams;
}

export async function parseWorkbook(file){
  return new Promise((res,rej)=>{
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array',cellDates:true});
        const mSheets=wb.SheetNames.filter(isMonthSh);
        if(!mSheets.length){rej(new Error('No month sheets found. Expected sheets named after months (e.g. Noviembre, June2025).'));return;}
        const parsed=mSheets.map(name=>{
          const rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:''});
          return{name,label:shToLabel(name),pr:parseMonthRows(rows)};
        });
        let p1n='',p2n='';
        for(const{pr}of parsed){if(!p1n&&pr.p1n)p1n=pr.p1n;if(!p2n&&pr.p2n)p2n=pr.p2n;if(p1n&&p2n)break;}
        const lat=parsed[parsed.length-1].pr;
        const incomeStreams=buildStreams(lat,p1n,p2n);
        const bills=[...lat.bills,...lat.tempM,...lat.annualB];
        const rawCards=lat.cards;
        const snapshots=parsed.map(({label,pr})=>{
          const si=buildStreams(pr,p1n,p2n);
          const sb=[...pr.bills,...pr.tempM,...pr.annualB];
          const sc=pr.cards;
          const net=si.reduce((s,i)=>s+toM(i.net,i.freq),0);
          const bt=sumB(sb);const dt=sc.reduce((s,c)=>s+(+c.balance||0),0);
          const mt=sc.reduce((s,c)=>s+(+c.min||0),0);
          const parts=label.split(' ');const moName=parts[0];const yr=parseInt(parts[1])||new Date().getFullYear();
          const mo=MS.indexOf(moName)+1;
          return{label,year:yr,month:mo,income:Math.round(net),bills:Math.round(bt),debt:Math.round(dt),savings:0,cashFlow:Math.round(net-bt-mt),savedAt:new Date().toISOString(),previousVersions:[],data:{incomeStreams:si,bills:sb,cards:sc,accounts:[],loans:[],customAssets:[]}};
        });
        res({p1n,p2n,isCouple:!!p2n,incomeStreams,bills,rawCards,snapshots,months:parsed.map(p=>p.label)});
      }catch(err){rej(err);}
    };
    reader.onerror=()=>rej(new Error('File read failed.'));
    reader.readAsArrayBuffer(file);
  });
}

export function parseCRMCsv(text){
// Proper CSV tokenizer — handles quoted newlines, commas inside quotes
  const parseCSVFull=txt=>{const rows=[];let row=[],cur='',inQ=false;for(let i=0;i<txt.length;i++){const ch=txt[i];if(ch==='"'){if(inQ&&txt[i+1]==='"'){cur+='"';i++;}else inQ=!inQ;}else if(ch===','&&!inQ){row.push(cur.trim().replace(/^"|"$/g,''));cur='';}else if((ch==='\n'||ch==='\r')&&!inQ){if(ch==='\r'&&txt[i+1]==='\n')i++;if(row.length>0||cur.trim()){row.push(cur.trim().replace(/^"|"$/g,''));rows.push(row);row=[];cur='';}}else cur+=ch;}if(cur.trim()||row.length>0){row.push(cur.trim().replace(/^"|"$/g,''));rows.push(row);}return rows;};
  const allRows=parseCSVFull(text);
  if(allRows.length<2)return[];
  const hdr=allRows[0];
  // Detect format
  const isAppExport=hdr.includes('DOB')||hdr.includes('Type');
  const clients=[];
  for(let i=1;i<allRows.length;i++){
    const cols=allRows[i];
    const row={};hdr.forEach((h,j)=>row[h]=cols[j]||'');
    if(!row.Name&&!row['First Name'])continue;
    let firstName,lastName,email,phone,dob,social,address,clientType,recommendedBy;
    if(isAppExport){
      // App export format: Name,Email,Phone,DOB,Address,SSN,Type,Referred By
      const parts=(row.Name||'').trim().split(/\s+/);
      firstName=parts[0]||'Unknown';lastName=parts.slice(1).join(' ')||'';
      email=row.Email||'';phone=row.Phone||'';dob=row.DOB||'';social=row.SSN||'';
      address=row.Address||'';clientType=row.Type==='Finance + Health'?'financeAndHealth':'financeOnly';
      recommendedBy=row['Referred By']||'';
    } else {
      // CRM export format (Airtable / health CRM)
      const name=(row.Name||'').trim();const parts=name.split(/\s+/);
      firstName=parts[0]||'Unknown';lastName=parts.slice(1).join(' ')||'';
      email=row.Email||row['Client Email']||'';
      const ph=(row.Phone||'').replace(/[^\d]/g,'');
      phone=ph.length===10?`(${ph.slice(0,3)}) ${ph.slice(3,6)}-${ph.slice(6)}`:row.Phone||'';
      let rawDob=row['Date of Birth']||row.DOB||'';
      try{const d=new Date(rawDob);dob=isNaN(d)?'':(d.toISOString().split('T')[0]);}catch{dob='';}
      social=row['SSN (from Household Members)']||row.SSN||'';
      address=row.Address||'';
      const svc=(row.Services||'').toLowerCase();
      clientType=svc.includes('insurance')&&svc.includes('finance')?'financeAndHealth':svc.includes('insurance')?'financeAndHealth':'financeOnly';
      recommendedBy=row['Referral Source']||'';
    }
    clients.push({id:gid(),firstName,lastName,email,phone,address,dob,social,clientType,recommendedBy,incomeStreams:[],bills:[],cards:[],accounts:[],loans:[],customAssets:[],monthSnapshots:[],alloc:{stocks:25,retirement:20,realEstate:20,savings:15,vacation:10,other:10},notes:{shortTerm:'',midTerm:'',longTerm:'',setbacks:'',goals:'',general:''},portfolioCustom:{holdings:[],overrides:{},rates:{}}});
  }
  return clients;
}

/* ── IMPORT WIZARD ───────────────────────────────────────────────────────── */

// Find duplicates for a batch of incoming clients against existing list
// Match priority: (1) exact firstName+lastName+email, (2) firstName+lastName, (3) email only
export const findDuplicate=(incoming,existing)=>{const fn=(incoming.firstName||"").toLowerCase().trim();const ln=(incoming.lastName||"").toLowerCase().trim();const em=(incoming.email||incoming.p1Email||"").toLowerCase().trim();return existing.find(c=>{const efn=(c.firstName||"").toLowerCase().trim();const eln=(c.lastName||"").toLowerCase().trim();const eem=(c.email||c.p1Email||"").toLowerCase().trim();const pfn=(c.partnerFirst||"").toLowerCase().trim();const pln=(c.partnerLast||"").toLowerCase().trim();if(fn===efn&&ln===eln&&em&&em===eem)return true;if(fn===efn&&ln===eln)return true;if(em&&em===eem)return true;if(fn===pfn&&ln===pln)return true;/* incoming matches partner side */return false;});};

// Smart merge: existing data preserved, new fills in blanks, never overwrites existing values
// Arrays (cards, bills, accounts, loans, customAssets, monthSnapshots): union by id, incoming fills gaps
export const smartMerge=(existing,incoming)=>{const scalarKeys=["firstName","lastName","partnerFirst","partnerLast","email","phone","address","dob","social","clientType","recommendedBy","p1Phone","p2Phone","p1Email","p2Email","p1Dob","p2Dob","p1Social","p2Social","color1","color2"];const merged={...existing};scalarKeys.forEach(k=>{if(!merged[k]&&incoming[k])merged[k]=incoming[k];});const arrKeys=["incomeStreams","bills","cards","accounts","loans","customAssets"];arrKeys.forEach(k=>{const a=merged[k]||[];const b=incoming[k]||[];const existingIds=new Set(a.map(x=>x.id));const newOnes=b.filter(x=>!existingIds.has(x.id));merged[k]=[...a,...newOnes];});// Snapshots: union by label, keep existing
const existingLabels=new Set((merged.monthSnapshots||[]).map(s=>s.label));const newSnaps=(incoming.monthSnapshots||[]).filter(s=>!existingLabels.has(s.label));merged.monthSnapshots=[...(merged.monthSnapshots||[]),...newSnaps];return merged;};
