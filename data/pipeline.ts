// ============================================================
// DATOS DEL PIPELINE
// Edita aquí las etapas y negocios del tablero kanban
// ============================================================

export interface PipelineDeal {
  id: string;
  company: string;
  value: number;      // Valor en dólares
  rep: string;        // Representante de ventas
  daysInStage: number;
  probability: number; // Probabilidad de cierre (0-100)
}

export interface PipelineStage {
  id: string;
  name: string;
  total: number;      // Valor total de todos los deals en esta etapa
  deals: PipelineDeal[];
}

export const pipelineStages: PipelineStage[] = [
  {
    id: "lead",
    name: "Lead",
    total: 892000,
    deals: [
      { id: "1", company: "Nexus Technologies", value: 45000,  rep: "Sarah C.", daysInStage: 3, probability: 20 },
      { id: "2", company: "Bright Systems",      value: 78000,  rep: "Mike J.",  daysInStage: 5, probability: 25 },
      { id: "3", company: "CoreLogic Inc",       value: 32000,  rep: "Emily D.", daysInStage: 1, probability: 15 },
    ],
  },
  {
    id: "qualified",
    name: "Qualified",
    total: 556000,
    deals: [
      { id: "4", company: "DataPrime Ltd",  value: 125000, rep: "James W.", daysInStage: 7, probability: 40 },
      { id: "5", company: "CloudNine Corp", value: 89000,  rep: "Sarah C.", daysInStage: 4, probability: 45 },
    ],
  },
  {
    id: "proposal",
    name: "Proposal",
    total: 357000,
    deals: [
      { id: "6", company: "TechForward",  value: 167000, rep: "Mike J.", daysInStage: 12, probability: 60 },
      { id: "7", company: "Innovate Plus", value: 95000,  rep: "Lisa P.", daysInStage: 8,  probability: 65 },
      { id: "8", company: "SmartGrid Co",  value: 54000,  rep: "Emily D.", daysInStage: 6, probability: 55 },
    ],
  },
  {
    id: "negotiation",
    name: "Negotiation",
    total: 179000,
    deals: [
      { id: "9",  company: "Enterprise Max", value: 245000, rep: "Sarah C.", daysInStage: 15, probability: 80 },
      { id: "10", company: "GrowthLab",      value: 112000, rep: "James W.", daysInStage: 10, probability: 75 },
    ],
  },
];
