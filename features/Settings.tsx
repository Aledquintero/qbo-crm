"use client";

// ============================================================
// PÁGINA: SETTINGS (Configuración)
// Permite modificar las preferencias de la cuenta
// ============================================================

import { useState } from "react";
import { loadFabricante, saveFabricante, type Fabricante } from "@/lib/fabricante";
import { getSession } from "@/lib/auth/store";
import { UsersAdmin } from "@/features/UsersAdmin";
import { Constructor } from "@/features/Constructor";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Users,
  Palette,
  Globe,
  RefreshCw,
  Check,
  Building2,
  Wrench,
} from "lucide-react";

export function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [fabricante, setFabricante] = useState<Fabricante>(() => loadFabricante());
  const [fabSaved, setFabSaved] = useState(false);
  const [isAdmin] = useState(() => getSession()?.rol === "Admin");

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary border border-border p-1">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-card data-[state=active]:text-foreground"
          >
            <User className="w-4 h-4 mr-2" />
            Cuenta
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger
              value="empresa"
              className="data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Empresa
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger
              value="constructor"
              className="data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              <Wrench className="w-4 h-4 mr-2" />
              Constructor
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger
              value="usuarios"
              className="data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              <Users className="w-4 h-4 mr-2" />
              Usuarios
            </TabsTrigger>
          )}
        </TabsList>

        {/* Cuenta Tab (preferencias + contraseña) */}
        <TabsContent value="profile" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-medium">Display Preferences</CardTitle>
              <CardDescription>Customize how data is displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">Use dark theme for the interface</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Moneda</p>
                    <p className="text-sm text-muted-foreground">Peso chileno (CLP) en toda la app</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-md bg-secondary border border-border text-xs font-semibold text-foreground">
                  $ CLP
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-medium">Password & Authentication</CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    className="bg-secondary border-border focus:border-accent max-w-md"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    className="bg-secondary border-border focus:border-accent max-w-md"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    className="bg-secondary border-border focus:border-accent max-w-md"
                  />
                </div>
                <Button variant="outline">Update Password</Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Empresa Tab (solo Admin: datos del fabricante para contratos) */}
        {isAdmin && (
        <TabsContent value="empresa" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-medium">Datos del fabricante</CardTitle>
              <CardDescription>Se usan para generar los contratos en PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fab-razon">Razón social</Label>
                  <Input id="fab-razon" value={fabricante.razonSocial}
                    onChange={(e) => { setFabricante((p) => ({ ...p, razonSocial: e.target.value })); setFabSaved(false); }}
                    className="bg-secondary border-border focus:border-accent" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fab-rut">RUT empresa</Label>
                  <Input id="fab-rut" value={fabricante.rut}
                    onChange={(e) => { setFabricante((p) => ({ ...p, rut: e.target.value })); setFabSaved(false); }}
                    className="bg-secondary border-border focus:border-accent" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fab-dom">Domicilio</Label>
                  <Input id="fab-dom" value={fabricante.domicilio}
                    onChange={(e) => { setFabricante((p) => ({ ...p, domicilio: e.target.value })); setFabSaved(false); }}
                    className="bg-secondary border-border focus:border-accent" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fab-ciudad">Ciudad</Label>
                    <Input id="fab-ciudad" value={fabricante.ciudad}
                      onChange={(e) => { setFabricante((p) => ({ ...p, ciudad: e.target.value })); setFabSaved(false); }}
                      className="bg-secondary border-border focus:border-accent" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fab-region">Región</Label>
                    <Input id="fab-region" value={fabricante.region}
                      onChange={(e) => { setFabricante((p) => ({ ...p, region: e.target.value })); setFabSaved(false); }}
                      className="bg-secondary border-border focus:border-accent" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fab-rep">Representante</Label>
                  <Input id="fab-rep" value={fabricante.representante}
                    onChange={(e) => { setFabricante((p) => ({ ...p, representante: e.target.value })); setFabSaved(false); }}
                    className="bg-secondary border-border focus:border-accent" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fab-rutrep">RUT representante</Label>
                  <Input id="fab-rutrep" value={fabricante.rutRepresentante}
                    onChange={(e) => { setFabricante((p) => ({ ...p, rutRepresentante: e.target.value })); setFabSaved(false); }}
                    className="bg-secondary border-border focus:border-accent" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fab-plazo">Plazo fabricación (días)</Label>
                  <Input id="fab-plazo" type="number" value={fabricante.plazoDias}
                    onChange={(e) => { setFabricante((p) => ({ ...p, plazoDias: Number(e.target.value) || 0 })); setFabSaved(false); }}
                    className="bg-secondary border-border focus:border-accent" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fab-gar">Garantía (meses)</Label>
                  <Input id="fab-gar" type="number" value={fabricante.garantiaMeses}
                    onChange={(e) => { setFabricante((p) => ({ ...p, garantiaMeses: Number(e.target.value) || 0 })); setFabSaved(false); }}
                    className="bg-secondary border-border focus:border-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end items-center gap-3">
            {fabSaved && <span className="text-xs text-success">Guardado</span>}
            <Button
              onClick={() => { saveFabricante(fabricante); setFabSaved(true); }}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Check className="w-4 h-4 mr-2" />
              Guardar empresa
            </Button>
          </div>
        </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="constructor" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Constructor />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="usuarios" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <UsersAdmin />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
