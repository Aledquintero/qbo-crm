-- Auth MVP QBO: tabla app_users (separada de team) + permisos por rol.
-- Password en plano SOLO para MVP. Migración bcrypt: agregar password_hash y dejar de usar password.
create table if not exists app_users (
  id text primary key,
  nombre text not null,
  username text unique not null,
  password text not null,
  rol text not null check (rol in ('Admin','Vendedor','Mueblista')),
  estado text not null default 'pendiente' check (estado in ('pendiente','activo','inactivo')),
  created_at timestamptz default now()
);

alter table app_users enable row level security;
drop policy if exists "anon all app_users" on app_users;
create policy "anon all app_users" on app_users for all to anon using (true) with check (true);

-- Seed primer Admin: QBO Modular / qbomodular / admin123
insert into app_users (id, nombre, username, password, rol, estado)
values ('seed-admin-qbo', 'QBO Modular', 'qbomodular', 'admin123', 'Admin', 'activo')
on conflict (username) do nothing;

-- Permisos por rol (ver + acciones) en JSON para que Admin los controle
create table if not exists role_permissions (
  rol text primary key check (rol in ('Admin','Vendedor','Mueblista')),
  ver jsonb not null default '{}',
  acciones jsonb not null default '{}'
);
alter table role_permissions enable row level security;
drop policy if exists "anon all role_permissions" on role_permissions;
create policy "anon all role_permissions" on role_permissions for all to anon using (true) with check (true);
