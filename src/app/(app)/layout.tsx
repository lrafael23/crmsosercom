"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PremiumSidebar } from "@/components/layout/PremiumSidebar";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Bell, Menu, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isImpersonating, stopImpersonating, user } = useAuth();
  
  return (
    <ProtectedRoute>
      <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
        {isImpersonating && (
          <div className="absolute top-0 left-0 right-0 bg-rose-600 text-white text-[10px] sm:text-xs font-bold py-1 px-4 flex items-center justify-between z-[100] animate-bounce-subtle">
            <div className="flex items-center gap-2">
              <span className="animate-pulse">●</span>
              <span>MODO SOPORTE: Viendo como {String(user?.displayName || "Usuario")} ({String(user?.role || "staff")})</span>
            </div>
            <button 
              onClick={stopImpersonating}
              className="bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded transition-colors uppercase"
            >
              Salir
            </button>
          </div>
        )}
        <aside className={cn("hidden md:block shrink-0", isImpersonating && "pt-6")}>
          <PremiumSidebar />
        </aside>
        
        <div className={cn("flex flex-col flex-1 min-w-0 overflow-hidden", isImpersonating && "pt-6")}>
          {/* Header Superior */}
          <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-10">
            <div className="flex items-center gap-4 flex-1">
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
              {/* Optional Search */}
              <div className="relative hidden md:flex items-center text-slate-400 focus-within:text-emerald-500 max-w-md w-full">
                <Search className="absolute left-3 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Buscar expedientes, trámites o facturas..." 
                  className="pl-9 pr-4 py-2 w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-tighter">Soporte 24/7</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Portal Conectado</span>
              </div>
              
              <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
              </Button>
              
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
              
              <Button variant="ghost" size="icon" className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                <User className="h-4 w-4" />
              </Button>
            </div>
          </header>
          
          {/* Main content area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 dark:bg-slate-950/50">
            <div className="max-w-7xl mx-auto">
              <Breadcrumbs />
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
