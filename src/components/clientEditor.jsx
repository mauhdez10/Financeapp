// New-client modal + client edit form — extracted from App.jsx in Phase 2 of
// docs/ARCHITECTURE-PLAN.md (D-37). Verbatim from the single-file era.
import { useEffect, useState } from "react";
import { useTh } from "../contexts/theme";
import { mINP } from "../styles/theme";
import { fmtPh, gid, mig, vEmail } from "../utils/finance";
import { CCircle, Field, Modal, Row2, SSNInput, SaveBar } from "./primitives";
import { Phone } from "lucide-react";

export function NewClientModal({onSave,onClose,t}){const th=useTh();const[f,setF]=useState({firstName:"",lastName:"",email:"",color1:"#4472C4",hasPartner:false,partnerFirst:"",partnerLast:"",color2:"#ED7D31"});const[err,setErr]=useState("");const u=k=>e=>setF(p=>({...p,[k]:e.target.value}));const save=()=>{if(!f.firstName||!f.lastName){setErr("First and last name required.");return;}if(!f.email||!vEmail(f.email)){setErr("Valid email required.");return;}if(f.hasPartner&&!f.partnerFirst){setErr("Partner first name required.");return;}onSave(mig({...f,id:gid(),partnerFirst:f.hasPartner?f.partnerFirst:null,partnerLast:f.hasPartner?f.partnerLast:null,color2:f.hasPartner?f.color2:null}));};const INP=mINP(th);return<Modal title={t.addClient} onClose={onClose} width={500}><Row2><Field label={`${t.firstName} *`}><input style={INP} value={f.firstName} onChange={u("firstName")}/></Field><Field label={`${t.lastName} *`}><input style={INP} value={f.lastName} onChange={u("lastName")}/></Field></Row2><Field label={`${t.email} *`}><input style={INP} value={f.email} onChange={u("email")}/></Field><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,padding:"10px 12px",background:th.bg,borderRadius:8}}><CCircle value={f.color1} onChange={u("color1")}/><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:th.text}}>{f.firstName||t.p1} color</div></div></div><div style={{borderTop:`1px solid ${th.cardBorder}`,paddingTop:14,marginBottom:14}}><button onClick={()=>setF(p=>({...p,hasPartner:!p.hasPartner}))} style={{fontSize:12,padding:"6px 14px",borderRadius:8,cursor:"pointer",background:f.hasPartner?th.accent+"22":"transparent",color:f.hasPartner?th.accent:th.muted,border:`1px solid ${f.hasPartner?th.accent:th.cardBorder}`,fontWeight:600}}>{f.hasPartner?"✓ "+t.removePartner:"＋ "+t.addPartner}</button></div>{f.hasPartner&&<><Row2><Field label={`${t.partnerFirst} *`}><input style={INP} value={f.partnerFirst} onChange={u("partnerFirst")}/></Field><Field label={t.partnerLast}><input style={INP} value={f.partnerLast} onChange={u("partnerLast")}/></Field></Row2><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,padding:"10px 12px",background:th.bg,borderRadius:8}}><CCircle value={f.color2} onChange={u("color2")}/><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:th.text}}>{f.partnerFirst||t.p2} color</div></div></div></>}{err&&<div style={{fontSize:11,color:"#EF4444",background:"#EF444411",borderRadius:8,padding:"7px 10px",marginBottom:8}}>{err}</div>}<SaveBar onSave={save} onCancel={onClose} t={t}/></Modal>;}

/* ── EDIT CLIENT MODAL ───────────────────────────────────────────────────── */
export function ClientForm({client,onSave,onDelete,onClose,t}){const th=useTh();const[f,setF]=useState({firstName:"",lastName:"",partnerFirst:"",partnerLast:"",email:"",phone:"",address:"",dob:"",social:"",clientType:"financeOnly",recommendedBy:"",p1Phone:"",p2Phone:"",p1Email:"",p2Email:"",p1Dob:"",p2Dob:"",p1Social:"",p2Social:"",color1:"#4472C4",color2:"#ED7D31",...(client||{})});
  // Mirror legacy top-level phone/email/dob/social to p1Phone etc on initial load for existing clients
  useEffect(()=>{setF(p=>({...p,p1Phone:p.p1Phone||p.phone||"",p1Email:p.p1Email||p.email||"",p1Dob:p.p1Dob||p.dob||"",p1Social:p.p1Social||p.social||""}));},[]);
  const[errs,setErrs]=useState({});
  const u=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const save=()=>{const e={};if(!f.firstName)e.firstName="Required";if(!f.lastName)e.lastName="Required";if(!f.p1Email&&!f.email)e.p1Email="Required";else if((f.p1Email||f.email)&&!vEmail(f.p1Email||f.email))e.p1Email="Invalid";if(Object.keys(e).length){setErrs(e);return;}
    // Keep legacy top-level fields in sync with p1 for backward compat
    const merged={...client,...f,id:client?.id||gid(),partnerFirst:f.partnerFirst||null,partnerLast:f.partnerLast||null,color2:f.partnerFirst?f.color2:null,email:f.p1Email||f.email,phone:f.p1Phone||f.phone,dob:f.p1Dob||f.dob,social:f.p1Social||f.social};
    onSave(mig(merged));};
  const INP=mINP(th);
  const hasP2=!!f.partnerFirst;
  return<Modal title={t.editClient} onClose={onClose} width={580}>
    <Row2>
      <div><label style={{fontSize:11,color:th.muted,display:"block",marginBottom:5}}>{t.firstName} *</label><input style={INP} value={f.firstName} onChange={u("firstName")}/>{errs.firstName&&<div style={{fontSize:10,color:"#EF4444",marginTop:2}}>{errs.firstName}</div>}</div>
      <div><label style={{fontSize:11,color:th.muted,display:"block",marginBottom:5}}>{t.lastName} *</label><input style={INP} value={f.lastName} onChange={u("lastName")}/>{errs.lastName&&<div style={{fontSize:10,color:"#EF4444",marginTop:2}}>{errs.lastName}</div>}</div>
    </Row2>
    <Row2>
      <Field label={t.partnerFirst}><input style={INP} value={f.partnerFirst||""} onChange={u("partnerFirst")} placeholder={t?.blankIfSingle||"Blank if single"}/></Field>
      <Field label={t.partnerLast}><input style={INP} value={f.partnerLast||""} onChange={u("partnerLast")}/></Field>
    </Row2>
    <Field label={t.address}><input style={INP} value={f.address||""} onChange={u("address")}/></Field>
    <Row2>
      <Field label={t.clientType}><select style={INP} value={f.clientType||"financeOnly"} onChange={u("clientType")}><option value="financeOnly">{t.financeOnly}</option><option value="financeAndHealth">{t.financeAndHealth}</option></select></Field>
      <Field label={t.recommendedBy}><input style={INP} value={f.recommendedBy||""} onChange={u("recommendedBy")}/></Field>
    </Row2>
    <div style={{height:1,background:th.cardBorder,margin:"16px 0"}}/>
    <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:10}}>👤 {f.firstName||"Person 1"} — Personal Info</div>
    <Row2>
      <div><label style={{fontSize:11,color:th.muted,display:"block",marginBottom:5}}>{t?.email||"Email"} *</label><input style={INP} value={f.p1Email} onChange={u("p1Email")} placeholder="person1@email.com"/>{errs.p1Email&&<div style={{fontSize:10,color:"#EF4444",marginTop:2}}>{errs.p1Email}</div>}</div>
      <Field label={t?.phone||"Phone"}><input style={INP} value={f.p1Phone||""} onChange={e=>setF(p=>({...p,p1Phone:fmtPh(e.target.value)}))} placeholder="(305) 555-0000"/></Field>
    </Row2>
    <Row2>
      <Field label={t?.dob||"Date of Birth"}><input type="date" style={INP} value={f.p1Dob||""} onChange={u("p1Dob")}/></Field>
      <Field label={t?.social||"SSN"}><SSNInput value={f.p1Social||""} onChange={u("p1Social")} t={t}/></Field>
    </Row2>
    {hasP2&&<><div style={{height:1,background:th.cardBorder,margin:"16px 0"}}/>
    <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:10}}>👤 {f.partnerFirst} — Personal Info</div>
    <Row2>
      <Field label={t?.email||"Email"}><input style={INP} value={f.p2Email||""} onChange={u("p2Email")} placeholder="person2@email.com"/></Field>
      <Field label={t?.phone||"Phone"}><input style={INP} value={f.p2Phone||""} onChange={e=>setF(p=>({...p,p2Phone:fmtPh(e.target.value)}))} placeholder="(305) 555-0000"/></Field>
    </Row2>
    <Row2>
      <Field label={t?.dob||"Date of Birth"}><input type="date" style={INP} value={f.p2Dob||""} onChange={u("p2Dob")}/></Field>
      <Field label={t?.social||"SSN"}><SSNInput value={f.p2Social||""} onChange={u("p2Social")} t={t}/></Field>
    </Row2></>}
    <div style={{height:1,background:th.cardBorder,margin:"16px 0"}}/>
    <div style={{display:"flex",gap:24,alignItems:"center",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}><CCircle value={f.color1||"#4472C4"} onChange={u("color1")}/><span style={{fontSize:12,color:th.muted}}>{f.firstName||t.p1}</span></div>
      {hasP2&&<div style={{display:"flex",alignItems:"center",gap:8}}><CCircle value={f.color2||"#ED7D31"} onChange={u("color2")}/><span style={{fontSize:12,color:th.muted}}>{f.partnerFirst}</span></div>}
    </div>
    <SaveBar onSave={save} onCancel={onClose} onDelete={onDelete} t={t}/>
  </Modal>;}

/* ── INTAKE ──────────────────────────────────────────────────────────────── */


