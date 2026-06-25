// Dashboard chart-slot options — a pure `t => [{id,label}]` factory shared by
// dashboard.jsx (the slot picker) and chartEditors.jsx (ChartSettingsModal).
// Extracted here to avoid a dashboard ⇄ chartEditors import cycle (dashboard
// already imports chartEditors). Moved verbatim from dashboard.jsx in the
// 2026-06-25 lint cleanup (was an undefined ref in chartEditors → ReferenceError).
export const dashChartOptions=t=>[
  {id:"incomeVsSpending",label:"📊 "+(t?.incomeVsSpendingHdr||"Income vs Spending")},
  {id:"sankey",label:"🌊 "+(t?.cashFlowMapHdr||"Cash Flow Map (Sankey)")},
  {id:"netWorthDonut",label:"💎 "+(t?.netWorthDistributionHdr||"Net Worth Distribution")},
  {id:"clientsTreemap",label:"🗺️ "+(t?.clientsByNetWorthHdr||"Clients by Net Worth")},
  // v0.54 (PR 5) — RankedHBars alternative for "Clients by Net Worth" per
  // preview/27-dashboard-row.html. Treemap kept above as a version choice.
  {id:"clientsRanked",label:"🏆 "+(t?.clientsRankedSlot||"Clients · Ranked H-Bars")},
  {id:"practiceHealth",label:"🎯 "+(t?.practiceHealthHdr||"Practice Health")},
  {id:"netWorthBridge",label:"⚖️ "+(t?.netWorthBridgeHdr||"Net Worth Bridge")},
  // v0.47.0 — expanded slot options. Each renders practice-aggregated data.
  {id:"debtVsSavingsTrend",label:"📈 "+(t?.debtVsSavingsSlot||"Debt vs Savings Trend")},
  {id:"cashFlowTrend",label:"💰 "+(t?.cashFlowTrendSlot||"Cash Flow Trend")},
  {id:"debtRanked",label:"🏦 "+(t?.debtRankedSlot||"Debts by Balance")},
  {id:"practiceWaterfall",label:"🌊 "+(t?.practiceWaterfallSlot||"Practice Cash Flow Waterfall")},
  {id:"healthRadar",label:"🎯 "+(t?.healthRadarSlot||"Practice Health (Radar)")},
  {id:"netWorthForecast",label:"🔮 "+(t?.netWorthForecastSlot||"Net Worth Forecast")},
  {id:"assetSunburst",label:"☀️ "+(t?.assetSunburstSlot||"Asset Allocation (Sunburst)")},
  {id:"clientsDumbbell",label:"⚖️ "+(t?.clientsDumbbellSlot||"Client Net Worth Δ")},
  {id:"netWorthSlope",label:"📐 "+(t?.netWorthSlopeSlot||"Net Worth Prior vs Current")},
  {id:"billsStacked",label:"💳 "+(t?.billsStackedSlot||"Bills by Category")},
  {id:"billsYoY",label:"📅 "+(t?.billsYoYSlot||"Bills YoY")},
  {id:"spendingHeatmap",label:"🔥 "+(t?.spendingHeatmapSlot||"Spending Heatmap")},
  {id:"payoffProgression",label:"📉 "+(t?.payoffProgressionSlot||"Debt Payoff Timeline")},
  {id:"kpiSparklines",label:"✨ "+(t?.kpiSparklinesSlot||"KPI Sparklines")},
];
