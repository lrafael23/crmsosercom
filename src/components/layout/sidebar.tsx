"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  FileText, 
  FolderOpen, 
  Home, 
  LifeBuoy, 
  LogOut, 
  Settings, 
  Users, 
  Briefcase,
  Scale
} from "lucide-react";

const navItems = [
  { name: "Inicio", href: "/dashboard", icon: Home },
  { name: "Documentos", href: "/dashboard/documentos", icon: FolderOpen },
  { name: "Trámites", href: "/dashboard/tramites", icon: Briefcase },
  { name: "Tickets", href: "/dashboard/tickets", icon: LifeBuoy },
  { name: "Honorarios", href: "/dashboard/pagos", icon: FileText },
  { name: "Impuestos", href: "/dashboard/impuestos", icon: BarChart3 },
];

const adminItems = [
  { name: "Leads", href: "/admin/leads", icon: Users },
  { name: "Clientes", href: "/admin/clientes", icon: Users },
  { name: "Configuración", href: "/admin/configuracion", icon: Settings },
];

const superAdminItems = [
  { name: "Operación", href: "/super-admin/operacion", icon: Briefcase },
  { name: "Clientes Análisis", href: "/super-admin/clientes", icon: Users },
  { name: "Ventas", href: "/super-admin/ventas", icon: BarChart3 },
  { name: "Equipo", href: "/super-admin/equipo", icon: LifeBuoy },
  { name: "Auditoría", href: "/super-admin/auditoria", icon: FileText },
  { name: "Finanzas", href: "/super-admin/finanzas", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card/50 backdrop-blur-sm">
      <div className="flex h-16 items-center px-6 border-b">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <Scale className="h-6 w-6 text-primary" />
          <span>Portal 360</span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-4">
          <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Mi Panel
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <nav className="mt-8 space-y-1 px-4">
          <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Administración
          </p>
          {adminItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {user?.role === "super_admin_global" && (
          <nav className="mt-8 space-y-1 px-4 mb-4">
            <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Super Admin
            </p>
            {superAdminItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      <div className="border-t p-4">
        <button 
          onClick={async () => {
            await logout();
            window.location.href = "/login";
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
