"use client";

// ============================================================
// PÁGINA: CUSTOMERS (Tarjetas de clientes)
// Carga y persiste customer desde Supabase (CRUD real)
// ============================================================

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AddCustomerPanel, type CustomerFormData } from "@/components/AddCustomerPanel";
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type Customer,
} from "@/lib/api/customers";
import {
  Building2,
  Search,
  Plus,
  MapPin,
  Mail,
  Phone,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

const tierColors: Record<string, string> = {
  Enterprise: "bg-accent/20 text-accent border-accent/30",
  Growth: "bg-chart-1/20 text-chart-1 border-chart-1/30",
  Starter: "bg-muted text-muted-foreground border-border",
};

export function Customers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [menuTarget, setMenuTarget] = useState<{ customer: Customer; x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCustomers()
      .then(setCustomerList)
      .catch((e) => {
        console.error(e);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!menuTarget) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuTarget(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuTarget]);

  const handleSave = async (data: CustomerFormData) => {
    try {
      if (editCustomer) {
        const updated = await updateCustomer(editCustomer.id, {
          name: data.name,
          industry: data.industry,
          tier: data.tier,
          location: data.location,
          contact: data.contact,
          email: data.email,
          phone: data.phone,
        });
        setCustomerList((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await createCustomer(data);
        setCustomerList((prev) => [created, ...prev]);
      }
      setEditCustomer(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer(id);
      setCustomerList((prev) => prev.filter((c) => c.id !== id));
      setMenuTarget(null);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredCustomers = customerList.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.contact.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = !selectedTier || customer.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  const totalRevenue = customerList.reduce((acc, c) => acc + c.totalRevenue, 0);
  const avgHealthScore = customerList.length
    ? Math.round(customerList.reduce((acc, c) => acc + c.healthScore, 0) / customerList.length)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-secondary/50 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-secondary/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <p className="text-muted-foreground">No se pudieron cargar los customers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Customers", value: customerList.length.toString(), icon: Building2, color: "text-foreground" },
          { label: "Total Revenue", value: `$${(totalRevenue / 1000000).toFixed(2)}M`, icon: DollarSign, color: "text-accent" },
          { label: "Avg Health Score", value: `${avgHealthScore}%`, icon: TrendingUp, color: "text-chart-1" },
          { label: "Active Deals", value: customerList.reduce((acc, c) => acc + c.activeDeals, 0).toString(), icon: Building2, color: "text-chart-3" },
        ].map((stat, index) => (
          <Card
            key={stat.label}
            className="border-border bg-card hover:border-muted-foreground/30 transition-all duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={`text-2xl font-semibold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[280px] bg-secondary border-border focus:border-accent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {["Enterprise", "Growth", "Starter"].map((tier) => (
              <Button
                key={tier}
                variant={selectedTier === tier ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTier(selectedTier === tier ? null : tier)}
                className={selectedTier === tier ? "bg-accent text-accent-foreground" : ""}
              >
                {tier}
              </Button>
            ))}
          </div>
        </div>
        <Button
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
          onClick={() => {
            setEditCustomer(null);
            setIsAddOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Customer Cards */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground">No hay customers. Agrega el primero.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCustomers.map((customer, index) => (
            <Card
              key={customer.id}
              className="border-border bg-card hover:border-accent/50 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 bg-secondary">
                      <AvatarFallback className="bg-secondary text-foreground font-semibold">
                        {customer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                        {customer.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{customer.industry}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${tierColors[customer.tier] ?? tierColors.Starter} border`}>
                      {customer.tier}
                    </Badge>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMenuTarget({ customer, x: rect.left - 120, y: rect.bottom + 6 });
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      {customer.location || "—"}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" />
                      {customer.email || "—"}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" />
                      {customer.phone || "—"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-medium text-foreground">
                        {customer.totalRevenue ? `$${customer.totalRevenue.toLocaleString()}` : "$0"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Active Deals</span>
                      <span className="font-medium text-foreground">{customer.activeDeals}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Contact</span>
                      <span className="font-medium text-foreground">{customer.lastContact || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Health Score */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Health Score</span>
                    {customer.trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-accent" />}
                    {customer.trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-destructive" />}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${customer.healthScore}%`,
                          backgroundColor:
                            customer.healthScore >= 80
                              ? "oklch(0.7 0.18 145)"
                              : customer.healthScore >= 60
                              ? "oklch(0.75 0.18 55)"
                              : "oklch(0.65 0.2 25)",
                        }}
                      />
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        customer.healthScore >= 80
                          ? "text-accent"
                          : customer.healthScore >= 60
                          ? "text-chart-3"
                          : "text-destructive"
                      }`}
                    >
                      {customer.healthScore}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddCustomerPanel
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleSave}
        initialData={
          editCustomer
            ? {
                name: editCustomer.name,
                industry: editCustomer.industry,
                tier: editCustomer.tier,
                location: editCustomer.location,
                contact: editCustomer.contact,
                email: editCustomer.email,
                phone: editCustomer.phone,
              }
            : undefined
        }
      />

      {menuTarget &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[60] w-40 rounded-lg border border-border bg-card shadow-lg overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150"
            style={{ left: menuTarget.x, top: menuTarget.y }}
          >
            <button
              onClick={() => {
                setEditCustomer(menuTarget.customer);
                setIsAddOpen(true);
                setMenuTarget(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </button>
            <button
              onClick={() => handleDelete(menuTarget.customer.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-secondary transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}