"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle, LifeBuoy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function TicketsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Soporte y Consultas</h2>
          <p className="text-muted-foreground">Comunícate directamente con nuestro equipo interno.</p>
        </div>
        <Button className="gap-2 w-full sm:w-auto">
          <PlusCircle className="h-4 w-4" />
          Nuevo Ticket
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-primary mb-2">
              <LifeBuoy className="h-5 w-5" />
              <h3 className="font-semibold">Jurídico</h3>
            </div>
            <p className="text-sm text-muted-foreground">Consultas legales, contratos y escrituras.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-blue-500 mb-2">
              <LifeBuoy className="h-5 w-5" />
              <h3 className="font-semibold">Contable</h3>
            </div>
            <p className="text-sm text-muted-foreground">Dudas sobre balances y estados financieros.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-green-500 mb-2">
              <LifeBuoy className="h-5 w-5" />
              <h3 className="font-semibold">Tributario</h3>
            </div>
            <p className="text-sm text-muted-foreground">Consultas sobre declaraciones y F29.</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border bg-white dark:bg-black p-8 text-center text-muted-foreground flex flex-col items-center justify-center">
        <LifeBuoy className="h-10 w-10 mb-4 opacity-20" />
        <p>No tienes tickets de soporte activos.</p>
      </div>
    </div>
  );
}
