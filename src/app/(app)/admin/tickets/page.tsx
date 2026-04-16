import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Plus, Search } from "lucide-react";

export default function AdminTicketsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Centro de Soporte</h1>
          <p className="text-slate-500 font-medium">Gestión global de tickets de usuarios y estudios.</p>
        </div>
        <Button className="bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-600 transition-colors">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Ticket Manual
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200 dark:border-white/5 rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-white/5 pb-4">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Pendientes</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-black">12</div>
            <p className="text-xs text-amber-500 font-medium mt-1">+3 desde ayer</p>
          </CardContent>
        </Card>
        {/* Aditional cards here... */}
      </div>

      <Card className="border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-white/5">
            <TableRow>
              <TableHead className="font-bold">Ticket ID</TableHead>
              <TableHead className="font-bold">Usuario / Estudio</TableHead>
              <TableHead className="font-bold">Asunto</TableHead>
              <TableHead className="font-bold">Prioridad</TableHead>
              <TableHead className="font-bold text-right">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-mono text-xs font-bold text-slate-400">#TK-90210</TableCell>
              <TableCell>
                <div className="font-bold">Estudio Jurídico Silva</div>
                <div className="text-xs text-slate-500">plan_premium</div>
              </TableCell>
              <TableCell>Error en carga de documentos masivos</TableCell>
              <TableCell>
                <Badge className="bg-red-500/10 text-red-500 border-none">Crítica</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="outline" className="border-amber-500 text-amber-500">En Proceso</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
