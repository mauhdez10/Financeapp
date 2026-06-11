// Extracted from App.jsx in Phase 1 of docs/ARCHITECTURE-PLAN.md (D-37, 2026-06-10).
// Code is verbatim from the single-file era; comments may reference old App.jsx line numbers.
import { useState, useEffect, useRef, useId } from "react";

/* ── v0.37.0 — Chart animation foundation ───────────────────────────────────
   useTweenedData(target, durationMs?) — tween any numeric value, array, or
   object-of-numbers from current state to a new target over ~800ms with
   easeOutCubic. Used by every chart so values morph smoothly when the
   underlying data changes (toggling p1/p2/both, switching client, new
   month snapshot). Shape changes (different array length, new keys) snap
   instantly — only same-shape transitions tween. */
const _easeOutCubic=t=>1-Math.pow(1-t,3);
function _lerpAny(a,b,k){
  if(typeof a==="number"&&typeof b==="number"&&isFinite(a)&&isFinite(b))return a+(b-a)*k;
  if(Array.isArray(a)&&Array.isArray(b)&&a.length===b.length)return a.map((x,i)=>_lerpAny(x,b[i],k));
  if(a&&b&&typeof a==="object"&&typeof b==="object"&&!Array.isArray(a)&&!Array.isArray(b)){
    const o={...b};for(const key of Object.keys(b))if(key in a)o[key]=_lerpAny(a[key],b[key],k);return o;
  }
  return b;
}
function _sameShape(a,b){
  if(a===null||b===null)return a===b;
  if(typeof a!==typeof b)return false;
  if(Array.isArray(a)!==Array.isArray(b))return false;
  if(Array.isArray(a))return a.length===b.length&&a.every((x,i)=>_sameShape(x,b[i]));
  if(a&&b&&typeof a==="object"){const ka=Object.keys(a).sort(),kb=Object.keys(b).sort();return ka.length===kb.length&&ka.every((k,i)=>k===kb[i]);}
  return true;
}
function useTweenedData(target,duration=300){
  const[cur,setCur]=useState(target);
  const ref=useRef({to:target,raf:0,cur:target});
  ref.current.cur=cur;
  useEffect(()=>{
    if(!_sameShape(ref.current.to,target)){
      cancelAnimationFrame(ref.current.raf);
      ref.current.to=target;
      setCur(target);
      return;
    }
    cancelAnimationFrame(ref.current.raf);
    const from=ref.current.cur,t0=performance.now();
    ref.current.to=target;
    const tick=now=>{
      const k=Math.min(1,(now-t0)/duration);
      setCur(_lerpAny(from,target,_easeOutCubic(k)));
      if(k<1)ref.current.raf=requestAnimationFrame(tick);
    };
    ref.current.raf=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(ref.current.raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[JSON.stringify(target),duration]);
  return cur;
}
// Stable unique ID per component instance for SVG <defs> (filters, gradients)
function useSvgId(prefix){const id=useId();return `${prefix}-${id.replace(/:/g,"")}`;}

// v0.43.0 — Respect prefers-reduced-motion for SVG <animate> elements (CSS
// reduced-motion rule already handles CSS animations; this hook lets us
// conditionally skip SMIL animations + the tween hook).
function useReducedMotion(){
  const[reduced,setReduced]=useState(()=>typeof window!=="undefined"&&window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(()=>{
    if(typeof window==="undefined"||!window.matchMedia)return;
    const mq=window.matchMedia("(prefers-reduced-motion: reduce)");
    const h=()=>setReduced(mq.matches);
    if(mq.addEventListener)mq.addEventListener("change",h);else if(mq.addListener)mq.addListener(h);
    return()=>{if(mq.removeEventListener)mq.removeEventListener("change",h);else if(mq.removeListener)mq.removeListener(h);};
  },[]);
  return reduced;
}

export { useTweenedData, useSvgId, useReducedMotion };
