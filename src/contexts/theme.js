// Extracted from App.jsx in Phase 0 of docs/ARCHITECTURE-PLAN.md (D-37, 2026-06-10).
// Code is verbatim from the single-file era; comments may reference old App.jsx line numbers.
import { createContext, useContext } from "react";
import { makeDark } from "../styles/theme";

const ThemeCtx=createContext(makeDark());
const useTh=()=>useContext(ThemeCtx);
const HideCtx=createContext({hide:false});
const useHN=()=>useContext(HideCtx);
/* v0.48.0 — Chart customization context. Provides per-template overrides
   (colors, strokeWidth, legendLabels, displayName, version) so the gallery
   editor can edit a chart's appearance from one place and have changes
   propagate to every use-site (ClientDetail, Dashboard slots, gallery). */
const ChartConfigCtx=createContext({});
const useChartConfig=(templateId,defaults)=>{
  const map=useContext(ChartConfigCtx);
  const saved=(templateId&&map?.[templateId])||{};
  // Merge: defaults are the chart's built-in props; saved overrides win.
  // Nested merge for colors{} and legendLabels{} so partial overrides don't wipe siblings.
  return{
    ...(defaults||{}),
    ...saved,
    colors:{...(defaults?.colors||{}),...(saved.colors||{})},
    legendLabels:{...(defaults?.legendLabels||{}),...(saved.legendLabels||{})},
  };
};

export { ThemeCtx, useTh, HideCtx, useHN, ChartConfigCtx, useChartConfig };
