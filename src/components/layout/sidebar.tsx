"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Briefcase, FileText, FolderOpen, Home, LifeBuoy, LogOut, Scale, Settings, Shield, Users } from "lucide-react";

import { getDefaultRouteForRole, isAdminRole, isClientRole, useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";

const clientItems = [
  { name: "Inicio", href: "/dashboard", icon: Home },
  { name: "Documentos", href: "/dashboard/documentos", icon: FolderOpen },
  { name: "Tramites", href: "/dashboard/tramites", icon: Briefcase },
  { name: "Tickets", href: "/dashboard/tickets", icon: LifeBuoy },
  { name: "Honorarios", href: "/dashboard/pagos", icon: FileText },
  { name: "Impuestos", href: "/dashboard/impuestos", icon: BarChart3 },
];

const adminItems = [
  { name: "Inicio", href: "/admin", icon: Home },
  { name: "Leads", href: "/admin/leads", icon: Users },
  { name: "Clientes", href: "/admin/clientes", icon: Briefcase },
  { name: "Configuracion", href: "/admin/configuracion", icon: Settings },
];

const superAdminItems = [
  { name: "Panel ejecutivo", href: "/super-admin", icon: Shield },
  { name: "Operacion", href: "/super-admin/operacion", icon: Briefcase },
  { name: "Clientes", href: "/super-admin/clientes", icon: Users },
  { name: "Ventas", href: "/super-admin/ventas", icon: BarChart3 },
  { name: "Equipo", href: "/super-admin/equipo", icon: LifeBuoy },
  { name: "Auditoria", href: "/super-admin/auditoria", icon: FileText },
  { name: "Finanzas", href: "/super-admin/finanzas", icon: Settings },
];

function NavSection({
  label,
  items,
  pathname,
}: {
  label: string;
  items: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
  pathname: string;
}) {
  return (
    <nav className="space-y-1 px-4">
      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const showClient = user.role === "super_admin_global" || isClientRole(user.role);
  const showAdmin = user.role === "super_admin_global" || isAdminRole(user.role);
  const showSuperAdmin = user.role === "super_admin_global";

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card/50 backdrop-blur-sm">
      <div className="flex h-16 items-center border-b px-6">
        <Link href={getDefaultRouteForRole(user.role)} className="flex items-center gap-2 font-bold tracking-tight">
          <Scale className="h-6 w-6 text-primary" />
          <span>Portal 360</span>
        </Link>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto py-4">
        {showClient ? <NavSection label="Portal cliente" items={clientItems} pathname={pathname} /> : null}
        {showAdmin ? <NavSection label="Gestion interna" items={adminItems} pathname={pathname} /> : null}
        {showSuperAdmin ? <NavSection label="Control superior" items={superAdminItems} pathname={pathname} /> : null}
      </div>

      <div className="border-t p-4">
        <button
          onClick={async () => {
            await logout();
            window.location.href = "/login";
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesion
        </button>
      </div>
    </div>
  );
}
