import { Card, CardContent } from "@/components/ui/card";
import { Folder, File, HardDrive, Search, Cloud } from "lucide-react";

export default function AdminDocumentsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Bóveda Global</h1>
        <p className="text-slate-500 font-medium">Monitor de almacenamiento y archivos del sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-slate-200 dark:border-white/5 rounded-[2rem] bg-emerald-500 text-slate-950 p-6">
          <div className="flex justify-between items-start mb-4">
             <Cloud className="w-8 h-8 opacity-40" />
             <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded">Drive Pool</span>
          </div>
          <div className="text-3xl font-black">2.4 TB</div>
          <p className="text-xs font-bold opacity-70">Uso compartido total</p>
        </Card>
      </div>

      <Card className="border-slate-200 dark:border-white/5 rounded-[3rem] p-8 border-dashed flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
          <HardDrive className="w-10 h-10 text-slate-400" />
        </div>
        <div>
          <h3 className="text-xl font-black">Explorador de Archivos Staff</h3>
          <p className="text-slate-500 max-w-md mx-auto mt-2">
            Este panel permite auditar documentos cargados por todos los tenants en caso de reclamos o emergencias legales.
          </p>
        </div>
      </Card>
    </div>
  );
}
