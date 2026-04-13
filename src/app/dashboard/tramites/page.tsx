"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, Briefcase } from "lucide-react";

export default function TramitesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Trámites y Gestiones</h2>
          <p className="text-muted-foreground">Revisa el estado de avance de tus casos activos.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full text-primary">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Constitución Sociedad SpA</h3>
                <p className="text-sm text-muted-foreground">Área Jurídica • Actualizado hace 2 días</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <Badge className="bg-blue-500 hover:bg-blue-600">En revisión interna</Badge>
                <p className="text-xs text-muted-foreground mt-1">Estimado: 15 de Mayo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="opacity-70">
          <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 p-3 rounded-full text-gray-500 dark:bg-gray-800">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg line-through text-muted-foreground">Iniciación de Actividades SII</h3>
                <p className="text-sm text-muted-foreground">Área Tributaria • Finalizado el 10 de Enero</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">Finalizado</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-full text-orange-500 dark:bg-orange-900/30">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Revisión Contrato de Arrendamiento</h3>
                <p className="text-sm text-muted-foreground">Área Jurídica • Actualizado hoy</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">Requiere tu atención</Badge>
                <p className="text-xs font-medium text-orange-500 mt-1">Falta firma representante</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
