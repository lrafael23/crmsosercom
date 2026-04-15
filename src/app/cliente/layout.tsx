"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, isClientRole } from "@/lib/auth/AuthContext";
import {
  Scale,
  LayoutDashboard,
  FolderOpen,
  FileText,
  Calendar,
  User,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronRight,
  Headphones
} from "lucide-react";

// ─── Navegación del Cliente ──────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/cliente", label: "Mi Resumen", icon: LayoutDashboard, exact: true },
  { href: "/cliente/causas", label: "Mis Causas", icon: FolderOpen },
  { href: "/cliente/documentos", label: "Documentos", icon: FileText },
  { href: "/cliente/citas", label: "Mis Citas", icon: Calendar },
  { href: "/cliente/perfil", label: "Mi Perfil", icon: User },
];

// ─── Layout Principal ─────────────────────────────────────────────────────────

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Verificación de acceso
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!isClientRole(user.role) && user.role !== "super_admin_global") {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <Scale className="w-6 h-6 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-indigo-500 font-bold tracking-widest text-xs uppercase animate-pulse">Accediendo a tu Portal</p>
        </div>
      </div>
    );
  }

  if (!user || (!isClientRole(user.role) && user.role !== "super_admin_global")) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#020617] transition-colors">
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar — Desktop Indigo Premium */}
        <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-white/5 relative z-30 shadow-2xl shadow-indigo-500/5">
          {/* Logo & Brand */}
          <div className="p-8">
            <Link href="/cliente" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Portal 360</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Portal</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Buscador Rápido Interno */}
          <div className="px-6 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar en mis causas..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-white/5 border-none rounded-xl text-[11px] focus:ring-1 ring-indigo-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
            {NAV_ITEMS.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 group ${
                    isActive 
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" 
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-indigo-500/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <motion.div layoutId="client-active-indicator" className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Support Widget */}
          <div className="mx-6 mb-6 p-4 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/10 backdrop-blur-sm">
            <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Headphones className="w-3 h-3" /> Soporte
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-3">
              ¿Tienes dudas sobre el estado de tu causa?
            </p>
            <button className="w-full py-2 bg-white dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl text-[10px] font-bold text-indigo-600 dark:text-indigo-300 transition-all border border-indigo-100 dark:border-white/5 shadow-sm">
              Contactar Abogado
            </button>
          </div>

          {/* User Section */}
          <div className="p-6 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-100 to-indigo-200 dark:from-slate-800 dark:to-indigo-900/40 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-white/5">
                    {user.displayName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{user.displayName}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">ID Cliente: {user.uid.slice(0, 8)}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 uppercase tracking-widest"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Salir del Portal
                </button>
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 overflow-auto relative bg-transparent">
          {/* Dashboard Header */}
          <header className="sticky top-0 z-20 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden md:flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                {pathname === "/cliente" ? (
                  <span className="text-indigo-600 dark:text-indigo-400">Inicio</span>
                ) : (
                  <>
                    <Link href="/cliente" className="hover:text-indigo-500 transition-colors">Mi Portal</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-900 dark:text-white">{pathname.split('/')[2]}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:scale-105 transition-transform group">
                <Bell className="w-5 h-5 group-hover:text-indigo-500 transition-colors" />
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-indigo-500 border-2 border-white dark:border-[#020617]" />
              </button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="p-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-md"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 z-[70] w-80 bg-white dark:bg-slate-950 p-6 flex flex-col shadow-2xl"
            >
               <div className="flex justify-between items-center mb-10">
                 <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                       <Scale className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">Portal 360</span>
                 </div>
                 <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900">
                   <X className="w-5 h-5" />
                 </button>
               </div>
               
               <nav className="flex-1 space-y-2">
                 {NAV_ITEMS.map((item) => {
                   const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                   const Icon = item.icon;
                   return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all ${
                        isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                   );
                 })}
               </nav>

               <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                  <button onClick={logout} className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-500/10 transition-all uppercase text-xs tracking-widest">
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
