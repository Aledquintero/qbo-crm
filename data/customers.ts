// ============================================================
// DATOS DE CLIENTES
// Edita aquí la lista de clientes del CRM
// ============================================================

export interface Customer {
  id: number;
  name: string;
  industry: string;
  tier: "Enterprise" | "Growth" | "Starter";
  location: string;
  contact: string;
  email: string;
  phone: string;
  totalRevenue: number;
  activeDeals: number;
  healthScore: number;
  trend: "up" | "down" | "stable";
  lastContact: string;
}

export const customers: Customer[] = [
  {
    id: 1,
    name: "Acme Corporation",
    industry: "Technology",
    tier: "Enterprise",
    location: "San Francisco, CA",
    contact: "John Smith",
    email: "john@acme.com",
    phone: "+1 (555) 123-4567",
    totalRevenue: 485000,
    activeDeals: 3,
    healthScore: 92,
    trend: "up",
    lastContact: "2 days ago",
  },
  {
    id: 2,
    name: "GlobalTech Industries",
    industry: "Manufacturing",
    tier: "Enterprise",
    location: "New York, NY",
    contact: "Sarah Johnson",
    email: "sarah@globaltech.com",
    phone: "+1 (555) 234-5678",
    totalRevenue: 320000,
    activeDeals: 2,
    healthScore: 85,
    trend: "up",
    lastContact: "1 week ago",
  },
  {
    id: 3,
    name: "Innovate Labs",
    industry: "Healthcare",
    tier: "Growth",
    location: "Boston, MA",
    contact: "Michael Chen",
    email: "michael@innovatelabs.com",
    phone: "+1 (555) 345-6789",
    totalRevenue: 156000,
    activeDeals: 1,
    healthScore: 78,
    trend: "stable",
    lastContact: "3 days ago",
  },
  {
    id: 4,
    name: "DataStream Analytics",
    industry: "Data Services",
    tier: "Growth",
    location: "Austin, TX",
    contact: "Emily Rodriguez",
    email: "emily@datastream.com",
    phone: "+1 (555) 456-7890",
    totalRevenue: 98000,
    activeDeals: 2,
    healthScore: 65,
    trend: "down",
    lastContact: "2 weeks ago",
  },
  {
    id: 5,
    name: "NextGen Solutions",
    industry: "Finance",
    tier: "Starter",
    location: "Chicago, IL",
    contact: "David Park",
    email: "david@nextgen.com",
    phone: "+1 (555) 567-8901",
    totalRevenue: 45000,
    activeDeals: 1,
    healthScore: 88,
    trend: "up",
    lastContact: "Yesterday",
  },
  {
    id: 6,
    name: "CloudFirst Inc",
    industry: "Cloud Services",
    tier: "Enterprise",
    location: "Seattle, WA",
    contact: "Lisa Wang",
    email: "lisa@cloudfirst.com",
    phone: "+1 (555) 678-9012",
    totalRevenue: 275000,
    activeDeals: 4,
    healthScore: 95,
    trend: "up",
    lastContact: "Today",
  },
];
