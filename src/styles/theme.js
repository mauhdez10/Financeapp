// Extracted from App.jsx in Phase 0 of docs/ARCHITECTURE-PLAN.md (D-37, 2026-06-10).
// Code is verbatim from the single-file era; comments may reference old App.jsx line numbers.
/* ── THEMES ─────────────────────────────────────────────────────────────── */
const GOLD="#C9A84C";
// v0.26.0 — bumped muted/dim/sideMuted on dark mode to pass WCAG AA contrast (4.5:1+ on dark navy bg). Was #9CA3AF/#6B7280.
// v0.62 — Direction B (Linear/Vercel dark-tech): FLAT solid surfaces (not glass),
// 1px hairline borders, mono labels, near-monochrome + one gold accent. glassBg/
// glassBorder now carry solid B surfaces (blur off); hover-lift motion lives in CSS
// (.ga-lift). glow1/glow2 kept very faint for a hint of depth on the near-black shell.
// v0.62.1 — dark was too dark (bg & card nearly identical → no panel separation).
// Lift card surfaces (#16181C) clearly above the near-black bg (#0A0B0D) + more
// visible hairline borders (#2A2E35), brighter muted/dim text. Linear-style: panels
// read as distinct on a near-black ground.
const makeDark=(a=GOLD)=>({bg:"#0C0D11",bgHi:"#16181D",bgLo:"#08090B",nav:"#101216",navBorder:"#23262D",card:"#16181C",cardBorder:"#2A2E35",glassBg:"#16181C",glassBorder:"#2A2E35",blur:"blur(0px)",cardShadow:"none",glow1:"rgba(226,195,117,0.16)",glow2:"rgba(60,110,120,0.04)",modal:"#181A1F",inp:"#1C1F24",inpBorder:"#32363E",text:"#ECEEF1",muted:"#9BA1AB",dim:"#6B7079",sideText:"#ECEEF1",sideMuted:"#9BA1AB",navAcc:"#E2C375",accent:a,pos:"#3DD68C",neg:"#F0857B",warn:"#E2C375",blue:"#7FA8C9"});
// v0.55.0 — warm cream + amber light palette applied app-wide per Mauricio's
// "the light mode looks off" feedback. Same palette family as landing + intake.
// Was: cool slate (`#F1F5F9` bg, `#E2E8F0` borders, blue accent).
// v0.62 — Direction B light: flat white surfaces, 1px #ECEDEF hairline, no card
// shadow (hover-lift adds it). Sidebar stays near-black (B keeps a dark rail in light).
// Light sidebar (B in light keeps a clean off-white rail, not a dark one). navAcc =
// walnut gold so active items stay legible on white (gold #C9A84C fails AA on white).
const makeLight=(a="#C9A84C")=>({bg:"#F8F7F2",bgHi:"#FDFCF8",bgLo:"#EFEDE5",nav:"#FFFFFF",navBorder:"#ECEDEF",card:"#FFFFFF",cardBorder:"#ECEDEF",glassBg:"#FFFFFF",glassBorder:"#ECEDEF",blur:"blur(0px)",cardShadow:"none",glow1:"rgba(184,144,30,0.13)",glow2:"rgba(60,110,120,0.03)",modal:"#FFFFFF",inp:"#FFFFFF",inpBorder:"#E6E7EA",text:"#0B0C0E",muted:"#60646C",dim:"#9097A0",sideText:"#16181C",sideMuted:"#60646C",navAcc:"#8A6B1E",accent:a,pos:"#0E9F6E",neg:"#D0453B",warn:"#B8901E",blue:"#5A7E9E"});
const DARK_ACCENTS=[{l:"Gold",v:"#C9A84C"},{l:"Blue",v:"#3B82F6"},{l:"Emerald",v:"#10B981"},{l:"Purple",v:"#8B5CF6"}];
const LIGHT_ACCENTS=[{l:"Blue",v:"#2563EB"},{l:"Teal",v:"#0D9488"},{l:"Emerald",v:"#059669"},{l:"Purple",v:"#7C3AED"}];
// v0.8.1 — background/card shade presets for the Appearance settings
// v0.55 — warm cream `#FAF6EC` is now the first preset (and DEF_SETTINGS default).
// Existing users with stored `lightBg` keep their value; they can switch in
// Settings → Appearance.
const LIGHT_BG_PRESETS=["#FAF6EC","#F7F4EC","#FFFFFF","#F1F5F9","#ECEFF3","#E6EBF0","#EDEAE3"];const LIGHT_CARD_PRESETS=["#FFFFFF","#FFFEFA","#FBFCFD","#F6F8FA"];const DARK_BG_PRESETS=["#0B0F17","#111827","#0D1117","#161B22","#15171C"];const DARK_CARD_PRESETS=["#1F2937","#1E293B","#252B36","#21262D"];

/* ── STYLES ─────────────────────────────────────────────────────────────── */
// v0.61.2 — modern aesthetic strips emoji-as-iconography from headers/labels/tabs.
// Render-time strip of a LEADING emoji (+ trailing space) so we don't have to edit
// hundreds of call sites or touch data (account-type icons etc. stay). String-only.
const stripLeadEmoji=s=>typeof s==="string"?s.replace(/^(?:[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}️‍⃣]\s*)+/u,""):s;
const mINP=th=>({background:th.inp,border:`1px solid ${th.inpBorder}`,color:th.text,borderRadius:10,padding:"9px 12px",fontSize:13,outline:"none",width:"100%",boxSizing:"border-box"});
// v0.61 — glass card: translucent bg + thin hairline + backdrop blur (dark) or
// soft shadow (light). Falls back to solid card tokens if glass tokens absent
// (e.g. a user's custom card-color override flows in via th.glassBg at merge time).
const mCARD=th=>({background:th.glassBg||th.card,border:`1px solid ${th.glassBorder||th.cardBorder}`,borderRadius:12,backdropFilter:th.blur||"none",WebkitBackdropFilter:th.blur||"none",boxShadow:th.cardShadow||"none",breakInside:"avoid",pageBreakInside:"avoid",WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"});
const mTH=th=>({fontSize:11,fontWeight:700,color:th.muted,padding:"0 6px 8px 0",textAlign:"left",whiteSpace:"nowrap",userSelect:"none",cursor:"pointer"});
const mTHR=th=>({...mTH(th),textAlign:"right",padding:"0 0 8px 6px"});
const mTD=th=>({fontSize:12,padding:"7px 6px 7px 0",borderTop:`1px solid ${th.cardBorder}`,color:th.text,verticalAlign:"middle"});
const mTDR=th=>({...mTD(th),textAlign:"right",padding:"7px 0 7px 6px"});
const mIIN=th=>({background:th.bg,border:`1px solid ${th.inpBorder}44`,color:th.text,borderRadius:6,padding:"4px 7px",fontSize:12,outline:"none",width:"100%"});

export { GOLD, makeDark, makeLight, DARK_ACCENTS, LIGHT_ACCENTS, LIGHT_BG_PRESETS, LIGHT_CARD_PRESETS, DARK_BG_PRESETS, DARK_CARD_PRESETS, stripLeadEmoji, mINP, mCARD, mTH, mTHR, mTD, mTDR, mIIN };
