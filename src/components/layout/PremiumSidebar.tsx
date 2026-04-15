"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { UserRole, useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Ticket,
  Calculator,
  Settings,
  ShieldAlert,
  LogOut,
  Landmark,
  Scale,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
const navConfig: Record<UserRole, { title: string; href: string; icon: React.ReactNode }[]> = {
  super_admin_global: [
    { title: "Control Room", href: "/super-admin", icon: <LayoutDashboard className="w-5 h-5" /> },
    { title: "Clientes / Tenants", href: "/super-admin/clientes", icon: <Building2 className="w-5 h-5" /> },
    { title: "Gestión de Equipo", href: "/super-admin/equipo", icon: <Users className="w-5 h-5" /> },
    { title: "Ventas y CRM", href: "/super-admin/ventas", icon: <Landmark className="w-5 h-5" /> },
    { title: "Finanzas Globales", href: "/super-admin/finanzas", icon: <CreditCard className="w-5 h-5" /> },
    { title: "Operación & Log", href: "/super-admin/operacion", icon: <Settings className="w-5 h-5" /> },
    { title: "Auditoría", href: "/super-admin/auditoria", icon: <ShieldAlert className="w-5 h-5" /> },
  ],
  admin: [
    { title: "Panel Central", href: "/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
    { title: "Gestión de Leads", href: "/admin/leads", icon: <Users className="w-5 h-5" /> },
    { title: "Cartera Clientes", href: "/admin/clientes", icon: <Building2 className="w-5 h-5" /> },
    { title: "Control Tickets", href: "/admin/tickets", icon: <Ticket className="w-5 h-5" /> },
    { title: "Archivo Maestro", href: "/admin/documentos", icon: <FileText className="w-5 h-5" /> },
    { title: "Configuración", href: "/admin/configuracion", icon: <Settings className="w-5 h-5" /> },
  ],
  abogado: [
    { title: "Dashboard Legal", href: "/admin", icon: <Scale className="w-5 h-5" /> },
    { title: "Expedientes", href: "/admin/documentos", icon: <FileText className="w-5 h-5" /> },
    { title: "Tickets Dept.", href: "/admin/tickets", icon: <Ticket className="w-5 h-5" /> },
  ],
  contador: [
    { title: "Dashboard Contable", href: "/admin", icon: <Calculator className="w-5 h-5" /> },
    { title: "Balance General", href: "/admin/documentos", icon: <FileText className="w-5 h-5" /> },
  ],
  tributario: [
    { title: "Dashboard Tributo", href: "/admin", icon: <Landmark className="w-5 h-5" /> },
    { title: "Declaraciones", href: "/admin/documentos", icon: <FileText className="w-5 h-5" /> },
  ],
  staff: [
    { title: "Asistente Operativo", href: "/admin", icon: <Ticket className="w-5 h-5" /> },
    { title: "Gestión Documental", href: "/admin/documentos", icon: <FileText className="w-5 h-5" /> },
  ],
  cliente: [
    { title: "Mi Portal", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { title: "Mis Trámites", href: "/dashboard/tramites", icon: <Settings className="w-5 h-5" /> },
    { title: "Documentos", href: "/dashboard/documentos", icon: <FileText className="w-5 h-5" /> },
    { title: "Impuestos", href: "/dashboard/impuestos", icon: <Landmark className="w-5 h-5" /> },
    { title: "Tickets Soporte", href: "/dashboard/tickets", icon: <Ticket className="w-5 h-5" /> },
    { title: "Pagos y Facturas", href: "/dashboard/pagos", icon: <CreditCard className="w-5 h-5" /> },
  ],
  // Nuevos roles SaaS
  owner_firm: [
    { title: "Mi Estudio", href: "/firm", icon: <LayoutDashboard className="w-5 h-5" /> },
    { title: "Causas", href: "/firm/causas", icon: <Scale className="w-5 h-5" /> },
    { title: "Clientes", href: "/firm/clientes", icon: <Users className="w-5 h-5" /> },
    { title: "Equipo", href: "/firm/equipo", icon: <Users className="w-5 h-5" /> },
    { title: "Agenda", href: "/firm/agenda", icon: <Settings className="w-5 h-5" /> },
    { title: "Suscripción", href: "/firm/facturacion", icon: <CreditCard className="w-5 h-5" /> },
  ],
  cliente_final: [
    { title: "Mi Portal", href: "/cliente", icon: <LayoutDashboard className="w-5 h-5" /> },
    { title: "Mis Causas", href: "/cliente", icon: <Scale className="w-5 h-5" /> },
    { title: "Documentos", href: "/cliente/documentos", icon: <FileText className="w-5 h-5" /> },
    { title: "Soporte", href: "/cliente/soporte", icon: <Ticket className="w-5 h-5" /> },
  ],
};

export function PremiumSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const links = navConfig[user.role] || [];

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-slate-950 text-slate-300 border-r border-slate-800">
      <div className="flex h-16 shrink-0 items-center px-6 bg-slate-900 border-b border-slate-800 shadow-sm">
        <Scale className="w-6 h-6 text-emerald-500 mr-2" />
        <span className="text-lg font-bold text-white tracking-wide">Portal 360</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Navegación
        </p>
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              {link.icon}
              {link.title}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 text-emerald-500 font-bold">
            {user.displayName?.charAt(0).toUpperCase() || (user.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user.displayName || "Usuario"}</p>
            <p className="text-xs text-slate-400 capitalize truncate">{user.role.replace(/_/g, " ")}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}
