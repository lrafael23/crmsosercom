"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Scale,
  Calculator,
  MessageSquare,
  Calendar,
  Users,
  Building2,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Search,
  Bell,
  Briefcase,
  BarChart3,
  ArrowRight,
  Plus,
  FolderOpen,
  CircleDollarSign,
  UserCog,
  LogOut
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Se determinan los links en base al role "cliente", "admin" o "super"
  const isSuper = user?.role === "super_admin_global";
  const isAdmin = user?.role === "admin_interno" || user?.role === "staff";
  const isClient = user?.role === "cliente";

  const menus = {
    cliente: [
      { icon: LayoutDashboard, label: "Resumen", href: "/dashboard" },
      { icon: FolderOpen, label: "Documentos", href: "/dashboard/documentos" },
      { icon: Briefcase, label: "Trámites", href: "/dashboard/tramites" },
      { icon: MessageSquare, label: "Tickets", href: "/dashboard/tickets" },
      { icon: Receipt, label: "Impuestos", href: "/dashboard/impuestos" },
      { icon: CircleDollarSign, label: "Honorarios", href: "/dashboard/pagos" },
    ],
    admin: [
      { icon: LayoutDashboard, label: "Panel", href: "/admin" },
      { icon: Users, label: "Leads y clientes", href: "/admin/leads" },
      { icon: Building2, label: "Expedientes", href: "/admin/clientes" },
      { icon: UserCog, label: "Configuración", href: "/admin/configuracion" },
    ],
    super: [
      { icon: LayoutDashboard, label: "Resumen ejecutivo", href: "/super-admin" },
      { icon: BarChart3, label: "Operación", href: "/super-admin/operacion" },
      { icon: Users, label: "Ventas", href: "/super-admin/ventas" },
      { icon: Building2, label: "Clientes", href: "/super-admin/clientes" },
      { icon: UserCog, label: "Equipo", href: "/super-admin/equipo" },
      { icon: Shield, label: "Auditoría", href: "/super-admin/auditoria" },
      { icon: CircleDollarSign, label: "Finanzas", href: "/super-admin/finanzas" },
    ],
  };

  let currentMenuName = "cliente";
  if (isSuper) currentMenuName = "super";
  else if (isAdmin) currentMenuName = "admin";

  const currentMenu = menus[currentMenuName as keyof typeof menus] || menus.cliente;

  return (
    <aside className="hidden w-72 shrink-0 border-r border-neutral-200 bg-white xl:flex flex-col h-screen">
      <div className="flex h-20 items-center gap-3 border-b border-neutral-200 px-6">
        <div className="rounded-2xl bg-neutral-950 p-3 text-white">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-neutral-500">Portal 360</p>
          <p className="font-semibold text-neutral-950">Jurídico • Contable • Tributario</p>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="rounded-3xl bg-neutral-50 p-3 mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Perfil</p>
          <p className="mt-2 font-medium capitalize text-neutral-900">
            {isClient ? "Cliente" : isAdmin ? "Staff Operativo" : "Super Admin Global"}
          </p>
        </div>

        <nav className="space-y-1">
          {currentMenu.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition font-medium",
                  isActive
                    ? "bg-neutral-950 text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-neutral-200 p-4">
        <button 
          onClick={async () => {
             await logout();
             window.location.href = "/login";
          }}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100">
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
