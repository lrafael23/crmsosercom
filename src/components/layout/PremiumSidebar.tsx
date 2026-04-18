"use client";
import { useState, useEffect } from "react";
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
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Home,
  FolderOpen,
  LifeBuoy,
  BarChart3,
  Shield,
  CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navConfig: Record<string, NavItem[]> = {
  admin: [
    { title: "Agenda Maestra", href: "/admin/agenda", icon: <CalendarDays className="w-5 h-5" /> },
    { title: "Panel Central", href: "/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
    { title: "Gestión de Leads", href: "/admin/leads", icon: <Users className="w-5 h-5" /> },
    { title: "Cartera Clientes", href: "/admin/clientes", icon: <Building2 className="w-5 h-5" /> },
    { title: "Control Tickets", href: "/admin/tickets", icon: <Ticket className="w-5 h-5" /> },
    { title: "Archivo Maestro", href: "/admin/documentos", icon: <FileText className="w-5 h-5" /> },
    { title: "Configuración", href: "/admin/configuracion", icon: <Settings className="w-5 h-5" /> },
  ],
  abogado: [
    { title: "Agenda Maestra", href: "/admin/agenda", icon: <CalendarDays className="w-5 h-5" /> },
    { title: "Dashboard Legal", href: "/admin", icon: <Scale className="w-5 h-5" /> },
    { title: "Expedientes", href: "/admin/documentos", icon: <FileText className="w-5 h-5" /> },
    { title: "Tickets Dept.", href: "/admin/tickets", icon: <Ticket className="w-5 h-5" /> },
  ],
  contador: [
    { title: "Agenda Maestra", href: "/admin/agenda", icon: <CalendarDays className="w-5 h-5" /> },
    { title: "Dashboard Contable", href: "/admin", icon: <Calculator className="w-5 h-5" /> },
    { title: "Balance General", href: "/admin/documentos", icon: <FileText className="w-5 h-5" /> },
  ],
  tributario: [
    { title: "Agenda Maestra", href: "/admin/agenda", icon: <CalendarDays className="w-5 h-5" /> },
    { title: "Dashboard Tributo", href: "/admin", icon: <Landmark className="w-5 h-5" /> },
    { title: "Declaraciones", href: "/admin/documentos", icon: <FileText className="w-5 h-5" /> },
  ],
  staff: [
    { title: "Agenda Maestra", href: "/admin/agenda", icon: <CalendarDays className="w-5 h-5" /> },
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
  owner_firm: [
    { title: "Agenda Maestra", href: "/firm/agenda", icon: <CalendarDays className="w-5 h-5" /> },
    { title: "Mi Estudio", href: "/firm", icon: <LayoutDashboard className="w-5 h-5" /> },
    { title: "Causas", href: "/firm/causas", icon: <Scale className="w-5 h-5" /> },
    { title: "Clientes", href: "/firm/clientes", icon: <Users className="w-5 h-5" /> },
    { title: "Equipo", href: "/firm/equipo", icon: <Users className="w-5 h-5" /> },
    { title: "Suscripción", href: "/firm/facturacion", icon: <CreditCard className="w-5 h-5" /> },
  ],
  cliente_final: [
    { title: "Mi Portal", href: "/cliente", icon: <LayoutDashboard className="w-5 h-5" /> },
    { title: "Mis Causas", href: "/cliente", icon: <Scale className="w-5 h-5" /> },
    { title: "Documentos", href: "/cliente/documentos", icon: <FileText className="w-5 h-5" /> },
    { title: "Mis citas", href: "/cliente/citas", icon: <CalendarDays className="w-5 h-5" /> },
    { title: "Soporte", href: "/cliente/soporte", icon: <Ticket className="w-5 h-5" /> },
  ],
};

const superAdminSections: NavSection[] = [
  {
    label: "Control Superior",
    items: [
      { title: "Agenda Maestra", href: "/super-admin/agenda", icon: <CalendarDays className="w-5 h-5" /> },
      { title: "Dashboard Global", href: "/super-admin", icon: <Shield className="w-5 h-5 text-amber-500" /> },
      { title: "Auditoría Sist.", href: "/super-admin/auditoria", icon: <ShieldAlert className="w-5 h-5" /> },
      { title: "Finanzas Global", href: "/super-admin/finanzas", icon: <CreditCard className="w-5 h-5" /> },
      { title: "Operación", href: "/super-admin/operacion", icon: <Settings className="w-5 h-5" /> },
    ]
  },
  {
    label: "Gestión Interna",
    items: [
      { title: "leads CRM", href: "/admin/leads", icon: <Users className="w-5 h-5" /> },
      { title: "Control Clientes", href: "/admin/clientes", icon: <Building2 className="w-5 h-5" /> },
      { title: "Config. Sosercom", href: "/admin/configuracion", icon: <Settings className="w-5 h-5" /> },
    ]
  },
  {
    label: "Portal Cliente",
    items: [
      { title: "Vista Cliente", href: "/dashboard", icon: <Home className="w-5 h-5" /> },
      { title: "Bóveda Doc.", href: "/dashboard/documentos", icon: <FolderOpen className="w-5 h-5" /> },
      { title: "Tramitaciones", href: "/dashboard/tramites", icon: <Briefcase className="w-5 h-5" /> },
    ]
  }
];

export function PremiumSidebar() {
  const pathname = usePathname();
  const { user, logout, isImpersonating } = useAuth();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setIsCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  if (!user || !mounted) return null;

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const renderLink = (link: NavItem) => {
    const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
    return (
      <Link
        key={link.href}
        href={link.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative",
          isActive
            ? "bg-emerald-500/10 text-emerald-400"
            : "hover:bg-slate-800 hover:text-white",
          isCollapsed && "justify-center px-0"
        )}
      >
        <div className="flex-shrink-0">{link.icon}</div>
        {!isCollapsed && (
          <span className="whitespace-nowrap transition-opacity">
            {link.title}
          </span>
        )}
        
        {isCollapsed && (
          <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-xl z-[100] border border-slate-700">
            {link.title}
          </div>
        )}
      </Link>
    );
  };

  return (
    <motion.div 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      className={cn(
        "flex h-screen flex-col bg-slate-950 text-slate-300 border-r border-slate-800 relative shadow-2xl z-40 transition-all",
        isImpersonating && "border-t-4 border-t-amber-500"
      )}
    >
      {/* Collapse Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-500 z-50 transition-colors border-2 border-slate-950"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={cn(
        "flex h-16 shrink-0 items-center px-6 bg-slate-900 border-b border-slate-800 shadow-sm overflow-hidden",
        isCollapsed && "px-0 justify-center"
      )}>
        <Scale className="w-6 h-6 text-emerald-500 flex-shrink-0" />
        {!isCollapsed && (
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg font-bold text-white tracking-wide ml-2 whitespace-nowrap"
          >
            Portal 360 {isImpersonating && <span className="text-[10px] text-amber-500">(View)</span>}
          </motion.span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-hide">
        {user.role === "super_admin_global" ? (
          superAdminSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <p className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">
                  {section.label}
                </p>
              )}
              {section.items.map(renderLink)}
            </div>
          ))
        ) : (
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">
                Navegación
              </p>
            )}
            {(navConfig[user.role] || []).map(renderLink)}
          </div>
        )}
      </nav>

      <div className={cn("p-4 bg-slate-900 border-t border-slate-800", isCollapsed && "px-2")}>
        <div className={cn("flex items-center gap-3 px-2 mb-4", isCollapsed && "justify-center px-0")}>
          <div className={cn(
            "w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 font-bold border border-slate-700 shadow-inner",
            isImpersonating ? "text-amber-500 border-amber-500/50" : "text-emerald-500"
          )}>
            {user.displayName?.charAt(0).toUpperCase() || (user.email || "U").charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{String(user.displayName || "Usuario")}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter truncate">
                {isImpersonating ? "Modo Simulación" : String(user.role || "").replace(/_/g, " ")}
              </p>
            </div>
          )}
        </div>
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl",
            isCollapsed && "justify-center p-0 h-10 w-10 mx-auto"
          )}
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span className="ml-2">Salir</span>}
        </Button>
      </div>
    </motion.div>
  );
}
