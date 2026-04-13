"use client";

import { usePathname } from "next/navigation";
import { Search, Bell, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

export function Header({ title, subtitle }: { title?: string, subtitle?: string }) {
  const pathname = usePathname();
  
  const generatedTitle = title || (pathname.split("/").pop()?.replace("-", " ") || "Resumen");
  const formattedTitle = generatedTitle.charAt(0).toUpperCase() + generatedTitle.slice(1);
  const formattedSubtitle = subtitle || "Vista rápida del portal 360.";

  return (
    <div className="flex flex-col gap-4 border-b border-neutral-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 shrink-0">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger className="xl:hidden inline-flex items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 p-2 border">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Sidebar</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0 border-none">
             <Sidebar />
          </SheetContent>
        </Sheet>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">{formattedTitle}</h2>
          <p className="mt-1 text-sm text-neutral-500">{formattedSubtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input className="w-72 rounded-2xl border-neutral-200 pl-9 focus-visible:ring-neutral-400" placeholder="Buscar cliente, trámite o documento" />
        </div>
        <Button variant="outline" className="rounded-2xl border-neutral-200 !text-neutral-700">
          <Bell className="mr-2 h-4 w-4" /> Alertas
        </Button>
        <Button className="rounded-2xl bg-neutral-950 text-white hover:bg-neutral-800">
          <Plus className="mr-2 h-4 w-4" /> Acción rápida
        </Button>
      </div>
    </div>
  );
}
