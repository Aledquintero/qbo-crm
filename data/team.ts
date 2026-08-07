// ============================================================
// DATOS DEL EQUIPO
// Edita aquí los miembros del equipo de ventas
// ============================================================

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;   // Iniciales del nombre (ej: "SC" para Sarah Chen)
  deals: number;    // Cantidad de deals cerrados
  revenue: number;  // Ingresos generados
  quota: number;    // Meta de ingresos
  change: number;   // Cambio porcentual (positivo = sube, negativo = baja)
  rank: number;     // Posición en el ranking
}

export const teamMembers: TeamMember[] = [
  { id: "1", name: "Sarah Chen",    role: "Senior AE",          email: "sarah@company.com", avatar: "SC", deals: 24, revenue: 487500, quota: 450000, change: 15, rank: 1 },
  { id: "2", name: "Mike Johnson",  role: "Account Executive",  email: "mike@company.com",  avatar: "MJ", deals: 19, revenue: 356200, quota: 400000, change: 8,  rank: 2 },
  { id: "3", name: "Emily Davis",   role: "Senior AE",          email: "emily@company.com", avatar: "ED", deals: 17, revenue: 312800, quota: 350000, change: 12, rank: 3 },
  { id: "4", name: "James Wilson",  role: "Account Executive",  email: "james@company.com", avatar: "JW", deals: 15, revenue: 289400, quota: 350000, change: -5, rank: 4 },
  { id: "5", name: "Lisa Park",     role: "Account Executive",  email: "lisa@company.com",  avatar: "LP", deals: 14, revenue: 267100, quota: 300000, change: 9,  rank: 5 },
];

// Datos para la gráfica de rendimiento (en miles)
export const performanceChartData = [
  { name: "Sarah",  revenue: 487, quota: 450 },
  { name: "Mike",   revenue: 356, quota: 400 },
  { name: "Emily",  revenue: 312, quota: 350 },
  { name: "James",  revenue: 289, quota: 350 },
  { name: "Lisa",   revenue: 267, quota: 300 },
];
