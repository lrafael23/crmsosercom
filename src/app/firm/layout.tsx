"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, isFirmRole } from "@/lib/auth/AuthContext";
import {
  Scale,
  LayoutDashboard,
  FolderOpen,
  Users,
  CreditCard,
  Calendar,
  Clock3,
  UserCheck,
  AlertCircle,
  LogOut,
  Menu,
  X,
  Loader2,
  ChevronRight,
  Bell,
  Search,
} from "lucide-react";

// ─── Navegación ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/firm/agenda", label: "Agenda Maestra", icon: Calendar },
  { href: "/firm/causas", label: "Causas", icon: FolderOpen },
  { href: "/firm/disponibilidad", label: "Disponibilidad", icon: Clock3 },
  { href: "/firm", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/firm/clientes", label: "Clientes", icon: Users },
  { href: "/firm/equipo", label: "Mi Equipo", icon: UserCheck },
  { href: "/firm/facturacion", label: "Suscripción", icon: CreditCard },
];

// ─── Componentes Auxiliares ──────────────────────────────────────────────────

function SubscriptionBanner({ status }: { status: string | null }) {
  if (!status || status === "active") return null;

  const configs = {
    pending: {
      bg: "bg-amber-500",
      text: "text-white",
      message: "Tu suscripción está pendiente de activación.",
      cta: "/checkout",
    },
    paused: {
      bg: "bg-orange-600",
      text: "text-white",
      message: "Tu cuenta está pausada por falta de pago.",
      cta: "/firm/facturacion",
    },
    cancelled: {
      bg: "bg-red-600",
      text: "text-white",
      message: "Suscripción cancelada. Renovación requerida.",
      cta: "/planes",
    },
  };

  const config = configs[status as keyof typeof configs];
  if (!config) return null;

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      className={`${config.bg} overflow-hidden`}
    >
      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-wider">
        <span className={config.text}>{config.message}</span>
        <Link href={config.cta} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors">
          Solucionar ahora
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Layout Principal ─────────────────────────────────────────────────────────

export default function FirmLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!isFirmRole(user.role) && user.role !== "super_admin_global") {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <Scale className="w-6 h-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-emerald-500 font-bold tracking-widest text-xs uppercase animate-pulse">Iniciando Portal</p>
        </div>
      </div>
    );
  }

  if (!user || (!isFirmRole(user.role) && user.role !== "super_admin_global")) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#020617] transition-colors">
      <SubscriptionBanner status={user.subscriptionStatus} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar — Desktop con Glassmorphism */}
        <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/50 relative z-30 shadow-2xl shadow-slate-200/50 dark:shadow-none">
          {/* Logo & Brand */}
          <div className="p-8">
            <Link href="/firm" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Portal 360</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SaaS Edition</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
             <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 mt-2">Menú Principal</p>
            {NAV_ITEMS.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 group ${
                    isActive 
                      ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/20" 
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <motion.div layoutId="active-indicator" className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                </Link>
              );
            })}
          </nav>

          {/* User Section - Diseño Premium */}
          <div className="p-6 mt-auto">
             <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-4 border border-slate-100 dark:border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 border border-white/10 shadow-inner">
                      {user.displayName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{user.displayName}</p>
                    <p className="text-[10px] text-slate-500 font-medium truncate uppercase tracking-tight">{user.role.replace('_', ' ')}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                >
                  <LogOut className="w-4 h-4" />
                  Finalizar Sesión
                </button>
             </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto relative bg-transparent">
          {/* Dashboard Header / Topbar */}
          <header className="sticky top-0 z-20 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/50 px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
               {/* Mobile Toggle */}
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden md:flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                <span>Plataforma</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-900 dark:text-white uppercase">{pathname.split('/')[2] || 'Dashboard'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex relative mr-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar causas o clientes..." 
                  className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-xl text-xs w-64 focus:ring-2 ring-emerald-500 transition-all"
                />
              </div>
              <button className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:scale-105 transition-transform">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 border-2 border-slate-100 dark:border-slate-900" />
              </button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="p-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Sidebar Móvil */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 z-[70] w-80 bg-white dark:bg-slate-950 p-6 flex flex-col shadow-2xl"
            >
              {/* Contenido simplificado del sidebar para móvil */}
               <div className="flex justify-between items-center mb-10">
                 <Scale className="w-8 h-8 text-emerald-600" />
                 <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900">
                   <X className="w-5 h-5" />
                 </button>
               </div>
               <nav className="flex-1 space-y-2">
                 {NAV_ITEMS.map((item) => {
                   const isActive = pathname === item.href;
                   const Icon = item.icon;
                   return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-bold transition-all ${
                        isActive ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900"
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      {item.label}
                    </Link>
                   );
                 })}
               </nav>
               <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={logout} className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                    <LogOut className="w-5 h-5" />
                    Cerrar Sesión
                  </button>
               </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
