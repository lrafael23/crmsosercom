"use client";

import { Bell, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";

import { useAuth } from "@/lib/auth/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { Sidebar } from "./sidebar";

function formatTitle(pathname: string) {
  if (pathname === "/dashboard") return "Panel cliente";
  if (pathname === "/admin") return "Panel del estudio";
  if (pathname === "/super-admin") return "Panel ejecutivo";

  const segment = pathname.split("/").filter(Boolean).pop() ?? "inicio";
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

function getInitials(value: string | null | undefined) {
  if (!value) return "P360";

  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <Sheet>
        <SheetTrigger className="inline-flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Menu de navegacion</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 items-center gap-4 md:gap-8">
        <div>
          <h1 className="hidden text-lg font-semibold sm:block">{formatTitle(pathname)}</h1>
          {user ? <p className="hidden text-xs text-muted-foreground sm:block">{user.role}</p> : null}
        </div>

        <div className="ml-auto flex flex-1 items-center space-x-2 sm:flex-initial">
          <div className="relative hidden max-w-sm flex-1 sm:block sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-full rounded-lg bg-background pl-8 md:w-[300px] lg:w-[300px]"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
          <span className="sr-only">Notificaciones</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-full border-0 bg-transparent text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt={user?.displayName ?? "Portal 360"} />
              <AvatarFallback>{getInitials(user?.displayName ?? user?.email ?? null)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{user?.displayName ?? "Portal 360"}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email ?? user?.role ?? "Sin email"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>{user?.status ?? "Sin estado"}</DropdownMenuItem>
            <DropdownMenuItem disabled>{user?.tenantId ?? "Sin tenant"}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await logout();
                window.location.href = "/login";
              }}
            >
              Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
