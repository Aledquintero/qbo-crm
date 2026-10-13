// ============================================================
// DATOS DE PRONÓSTICOS / FORECASTING
// Edita aquí los datos de proyecciones de ventas
// ============================================================

// Datos mensuales: real vs pronóstico vs meta
// Si "actual" es null, significa que aún no ocurrió (es proyección)
export const forecastMonthlyData = [
  { month: "Jan", actual: 420000,  forecast: 400000, target: 450000 },
  { month: "Feb", actual: 480000,  forecast: 460000, target: 450000 },
  { month: "Mar", actual: 510000,  forecast: 500000, target: 500000 },
  { month: "Apr", actual: 485000,  forecast: 520000, target: 500000 },
  { month: "May", actual: 560000,  forecast: 550000, target: 550000 },
  { month: "Jun", actual: 620000,  forecast: 600000, target: 550000 },
  { month: "Jul", actual: null,    forecast: 650000, target: 600000 },
  { month: "Aug", actual: null,    forecast: 680000, target: 600000 },
  { month: "Sep", actual: null,    forecast: 720000, target: 650000 },
  { month: "Oct", actual: null,    forecast: 750000, target: 650000 },
  { month: "Nov", actual: null,    forecast: 800000, target: 700000 },
  { month: "Dec", actual: null,    forecast: 850000, target: 700000 },
];

// Pronóstico por trimestre
export const quarterlyForecastData = [
  { quarter: "Q1", committed: 1200000, bestCase: 1450000, pipeline: 1800000 },
  { quarter: "Q2", committed: 1500000, bestCase: 1750000, pipeline: 2100000 },
  { quarter: "Q3", committed: 1800000, bestCase: 2100000, pipeline: 2500000 },
  { quarter: "Q4", committed: 2200000, bestCase: 2600000, pipeline: 3000000 },
];

// Factores de riesgo identificados
export const riskFactors = [
  {
    id: 1,
    title: "Deal Slippage Risk",
    description: "3 deals at risk of pushing to next quarter",
    impact: "-$180,000",
    severity: "high" as const,
    deals: ["Acme Corp Enterprise", "GlobalTech Phase 2", "DataStream Analytics"],
  },
  {
    id: 2,
    title: "Competitor Activity",
    description: "Increased competition in mid-market segment",
    impact: "-$95,000",
    severity: "medium" as const,
    deals: ["NextGen Solutions", "CloudFirst Expansion"],
  },
  {
    id: 3,
    title: "Budget Freeze Warning",
    description: "2 accounts reported potential budget freezes",
    impact: "-$120,000",
    severity: "high" as const,
    deals: ["Innovate Labs", "TechStart Inc"],
  },
];

// Escenarios de pronóstico
export const forecastScenarios = [
  { name: "Conservative", probability: 85, revenue: 6200000, color: "chart-4" },
  { name: "Base Case",    probability: 65, revenue: 7400000, color: "accent"  },
  { name: "Optimistic",  probability: 40, revenue: 8600000, color: "chart-1" },
];

// KPIs del trimestre actual
export const forecastKPIs = {
  currentQuarterTarget:   1800000,
  currentQuarterForecast: 2100000,
  forecastAccuracy:       94,   // porcentaje
  pipelineCoverage:       3.2,  // multiplicador vs cuota
};
