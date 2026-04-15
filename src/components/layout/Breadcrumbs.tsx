"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const routeMap: Record<string, string> = {
  dashboard: "Portal Cliente",
  admin: "Panel Interno",
  "super-admin": "Super Admin",
  documentos: "Documentos",
  impuestos: "Impuestos",
  pagos: "Pagos y Facturas",
  tickets: "Soporte",
  tramites: "Trámites",
  leads: "Leads",
  clientes: "Clientes",
  equipo: "Equipo",
  ventas: "Ventas",
  finanzas: "Finanzas",
  auditoria: "Auditoría",
  operacion: "Operación",
  configuracion: "Configuración",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);

  if (paths.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-6">
      <Link 
        href="/"
        className="hover:text-emerald-500 transition-colors flex items-center"
      >
        <Home className="w-4 h-4" />
      </Link>
      
      {paths.map((path, index) => {
        const href = `/${paths.slice(0, index + 1).join("/")}`;
        const isLast = index === paths.length - 1;
        const label = routeMap[path] || path.charAt(0).toUpperCase() + path.slice(1);

        return (
          <div key={href} className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px] md:max-w-none">
                {label}
              </span>
            ) : (
              <Link 
                href={href}
                className="hover:text-emerald-500 transition-colors truncate max-w-[100px] md:max-w-none"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
