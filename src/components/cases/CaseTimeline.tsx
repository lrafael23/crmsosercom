"use client";

import { CheckCircle2, Circle, Clock, AlertCircle, XCircle } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CaseStage =
  | "intake"
  | "en_estudio"
  | "en_tramitacion"
  | "requiere_documentos"
  | "audiencia"
  | "cerrado"
  | "archivado";

export type StageStatus = "completed" | "current" | "pending" | "blocked";

export interface TimelineEvent {
  id: string;
  stage: CaseStage;
  status: StageStatus;
  title: string;
  description?: string;
  date?: string;
  responsable?: string;
  observaciones?: string;
}

// ─── Configuración de etapas ──────────────────────────────────────────────────

const STAGE_CONFIG: Record<CaseStage, { label: string; color: string }> = {
  intake: { label: "Ingreso del Caso", color: "blue" },
  en_estudio: { label: "En Estudio", color: "purple" },
  en_tramitacion: { label: "En Tramitación", color: "amber" },
  requiere_documentos: { label: "Requiere Documentos", color: "orange" },
  audiencia: { label: "En Audiencia", color: "indigo" },
  cerrado: { label: "Caso Cerrado", color: "emerald" },
  archivado: { label: "Archivado", color: "slate" },
};

// ─── Ícono por estado ─────────────────────────────────────────────────────────

function StageIcon({ status, stage }: { status: StageStatus; stage: CaseStage }) {
  const isClosed = stage === "cerrado";
  const isArchived = stage === "archivado";
  const isBlocked = status === "blocked";

  if (status === "completed") {
    return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
  }
  if (status === "current") {
    if (isBlocked) return <AlertCircle className="w-5 h-5 text-amber-500" />;
    return (
      <div className="w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
    );
  }
  if (isClosed) return <CheckCircle2 className="w-5 h-5 text-slate-300" />;
  if (isArchived) return <XCircle className="w-5 h-5 text-slate-300" />;
  return <Circle className="w-5 h-5 text-slate-300" />;
}

// ─── Semáforo de estado ────────────────────────────────────────────────────────

function StatusTrafficLight({ currentStage }: { currentStage: CaseStage }) {
  const urgencyMap: Record<CaseStage, "green" | "yellow" | "red" | "gray"> = {
    intake: "yellow",
    en_estudio: "green",
    en_tramitacion: "green",
    requiere_documentos: "red",
    audiencia: "yellow",
    cerrado: "green",
    archivado: "gray",
  };

  const urgency = urgencyMap[currentStage] ?? "gray";

  const colors = {
    green: { bg: "bg-emerald-50 dark:bg-emerald-900/20", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300", label: "Al día" },
    yellow: { bg: "bg-amber-50 dark:bg-amber-900/20", dot: "bg-amber-400", text: "text-amber-700 dark:text-amber-300", label: "En seguimiento" },
    red: { bg: "bg-red-50 dark:bg-red-900/20", dot: "bg-red-500", text: "text-red-700 dark:text-red-300", label: "Requiere acción" },
    gray: { bg: "bg-slate-50 dark:bg-slate-800", dot: "bg-slate-400", text: "text-slate-500 dark:text-slate-400", label: "Archivado" },
  };

  const c = colors[urgency];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${c.bg}`}>
      <div className={`w-2.5 h-2.5 rounded-full ${c.dot} ${urgency === "red" ? "animate-pulse" : ""}`} />
      <span className={`text-xs font-semibold ${c.text}`}>{c.label}</span>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function CaseTimeline({
  events,
  currentStage,
  caseName,
}: {
  events: TimelineEvent[];
  currentStage: CaseStage;
  caseName?: string;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl shadow-indigo-500/5"
    >
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-transparent to-indigo-500/5">
        <div>
          <h3 className="font-black text-slate-900 dark:text-white text-base tracking-tight">
            {caseName ?? "Seguimiento de la Causa"}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Etapa Actual</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold">
              {STAGE_CONFIG[currentStage]?.label}
            </span>
          </div>
        </div>
        <StatusTrafficLight currentStage={currentStage} />
      </div>

      {/* Timeline */}
      <div className="p-8">
        <div className="relative">
          {/* Línea vertical animada */}
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute left-[18px] top-6 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/50 to-transparent dark:from-indigo-500/30" 
          />

          <div className="space-y-8">
            {events.map((event, idx) => {
              const isLast = idx === events.length - 1;
              const isCurrent = event.status === "current";
              const isCompleted = event.status === "completed";

              return (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative flex gap-6 group"
                >
                  {/* Ícono con efecto de pulso si es el actual */}
                  <div
                    className={`relative z-10 w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                      isCurrent
                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 scale-110"
                        : isCompleted
                        ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    }`}
                  >
                    <StageIcon status={event.status} stage={event.stage} />
                    {isCurrent && (
                      <div className="absolute inset-0 rounded-2xl bg-indigo-500 animate-ping opacity-20 pointer-events-none" />
                    )}
                  </div>

                  {/* Contenido */}
                  <div
                    className={`flex-1 pb-4 ${isLast ? "pb-0" : ""} ${
                      isCurrent
                        ? "bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl p-5 -mt-2 border border-indigo-100 dark:border-indigo-500/20 shadow-lg shadow-indigo-500/5"
                        : "group-hover:translate-x-1 transition-transform"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col">
                        <p
                          className={`text-sm font-black tracking-tight ${
                            isCurrent
                              ? "text-indigo-900 dark:text-indigo-100"
                              : isCompleted
                              ? "text-slate-700 dark:text-slate-200"
                              : "text-slate-400 dark:text-slate-500 font-bold"
                          }`}
                        >
                          {event.title}
                        </p>
                        {event.date && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider">
                            <Clock className="w-3 h-3" />
                            {event.date}
                          </div>
                        )}
                      </div>
                      
                      {isCurrent && (
                        <motion.span 
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="text-[10px] font-black bg-indigo-600 text-white px-2.5 py-1 rounded-lg shadow-lg shadow-indigo-600/20 whitespace-nowrap"
                        >
                          ESTADO ACTUAL
                        </motion.span>
                      )}
                    </div>

                    {event.description && (
                      <p className={`text-xs mt-2 leading-relaxed ${isCurrent ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400'}`}>
                        {event.description}
                      </p>
                    )}

                    {event.responsable && (
                      <div className="flex items-center gap-2 mt-3 p-2 rounded-xl bg-white/50 dark:bg-black/20 w-fit border border-slate-100 dark:border-white/5">
                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] font-bold">
                          {event.responsable.charAt(0)}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {event.responsable}
                        </p>
                      </div>
                    )}

                    {event.observaciones && isCurrent && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-950 border border-indigo-100 dark:border-indigo-500/20 shadow-inner"
                      >
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
                          " {event.observaciones} "
                        </p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Generador de eventos de ejemplo para demo ────────────────────────────────

export function generateDemoTimeline(currentStage: CaseStage): TimelineEvent[] {
  const allStages: CaseStage[] = [
    "intake", "en_estudio", "en_tramitacion", "audiencia", "cerrado"
  ];

  const currentIdx = allStages.indexOf(currentStage);

  return allStages.map((stage, idx) => ({
    id: stage,
    stage,
    title: STAGE_CONFIG[stage].label,
    status:
      idx < currentIdx ? "completed" :
      idx === currentIdx ? "current" : "pending",
    date: idx <= currentIdx ? `0${idx + 1}/03/2025` : undefined,
    responsable: idx <= currentIdx ? "Abg. Juan Pérez" : undefined,
    observaciones:
      idx === currentIdx
        ? "Se está coordinando con el tribunal. Próxima audiencia pendiente de confirmación."
        : undefined,
  }));
}
