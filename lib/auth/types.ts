// Tipos centrales de autenticación — MVP simple (sin hash, migrable a bcrypt)
export type Role = "Admin" | "Vendedor" | "Mueblista";
export type UserStatus = "pendiente" | "activo" | "inactivo";

export interface AuthUser {
  id: string;
  nombre: string;
  username: string;
  // MVP: texto plano. TODO migrar a password_hash bcrypt (ver store.ts)
  password: string;
  rol: Role;
  estado: UserStatus;
  createdAt: string;
}

export interface Session {
  username: string;
  nombre: string;
  rol: Role;
}

export const ROLES: Role[] = ["Admin", "Vendedor", "Mueblista"];
