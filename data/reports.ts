// ============================================================
// DATOS DE REPORTES
// Edita aquí los datos de reportes, gráficas y fuentes de leads
// ============================================================

// Tasa de conversión mensual (porcentaje)
export const conversionRateData = [
  { month: "Jan", rate: 18 },
  { month: "Feb", rate: 22 },
  { month: "Mar", rate: 19 },
  { month: "Apr", rate: 25 },
  { month: "May", rate: 23 },
  { month: "Jun", rate: 28 },
  { month: "Jul", rate: 26 },
  { month: "Aug", rate: 31 },
  { month: "Sep", rate: 29 },
  { month: "Oct", rate: 32 },
  { month: "Nov", rate: 35 },
  { month: "Dec", rate: 38 },
];

// Fuentes de leads (de dónde viene cada lead)
export const leadSourceData = [
  { name: "Direct",   value: 35, color: "oklch(0.7 0.18 220)"  },
  { name: "Referral", value: 25, color: "oklch(0.7 0.18 145)"  },
  { name: "Organic",  value: 20, color: "oklch(0.75 0.18 55)"  },
  { name: "Paid Ads", value: 15, color: "oklch(0.65 0.2 25)"   },
  { name: "Social",   value: 5,  color: "oklch(0.7 0.15 300)"  },
];

// Lista de reportes generados
export const recentReports = [
  { id: "1", name: "Monthly Sales Summary",    type: "Sales",       date: "Jan 20, 2024", status: "ready"      },
  { id: "2", name: "Q4 Performance Analysis",  type: "Performance", date: "Jan 18, 2024", status: "ready"      },
  { id: "3", name: "Pipeline Forecast",        type: "Forecast",    date: "Jan 15, 2024", status: "ready"      },
  { id: "4", name: "Team Productivity Report", type: "Team",        date: "Jan 12, 2024", status: "generating" },
  { id: "5", name: "Lead Source Analysis",     type: "Marketing",   date: "Jan 10, 2024", status: "ready"      },
];
