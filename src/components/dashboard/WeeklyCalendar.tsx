import { useEffect, useState } from "react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  Timestamp,
  orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

import { format, addDays, startOfWeek, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth, endOfWeek, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  type: "task" | "appointment" | "reminder";
  status: "pending" | "completed" | "urgent";
  date: Date;
  tenantId?: string;
}

export default function WeeklyCalendar({ tenantId: propTenantId }: { tenantId?: string }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const activeTenantId = propTenantId || user?.tenantId;
  
  useEffect(() => {
    if (!activeTenantId) return;

    const q = query(
      collection(db, "appointments"),
      where("tenantId", "==", activeTenantId),
      orderBy("date", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date)
        } as CalendarEvent;
      });
      setEvents(fetchedEvents);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching appointments:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTenantId]);

  const handleQuickAdd = async () => {
    if (!activeTenantId) return;
    
    try {
      await addDoc(collection(db, "appointments"), {
        title: "Nueva Tarea/Cita",
        time: format(selectedDate, "HH:mm"),
        type: "task",
        status: "pending",
        date: Timestamp.fromDate(selectedDate),
        tenantId: activeTenantId,
        createdAt: Timestamp.now(),
        createdBy: user?.uid
      });
    } catch (e) {
      console.error("Error adding event:", e);
    }
  };
  
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = [...Array(7)].map((_, i) => addDays(weekStart, i));

  const eventsForDay = events.filter(e => isSameDay(e.date, selectedDate));

  return (
    <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-black/20">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Agenda Semanal</h3>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 gap-2">
              Ver Mes <ExternalLink className="w-3 h-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white dark:bg-slate-950 border-white/10">
            <MonthlyCalendarView events={events} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Week Grid */}
      <div className="p-4 grid grid-cols-7 gap-2">
        {weekDays.map((day, i) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const hasEvents = events.some(e => isSameDay(e.date, day));

          return (
            <button
              key={i}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "flex flex-col items-center py-3 rounded-2xl transition-all relative group",
                isSelected 
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
                  : "hover:bg-slate-50 dark:hover:bg-white/5"
              )}
            >
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-tighter mb-1",
                isSelected ? "text-slate-400" : "text-slate-400"
              )}>
                {format(day, "eee", { locale: es })}
              </span>
              <span className={cn(
                "text-sm font-black",
                isToday && !isSelected && "text-emerald-500 underline underline-offset-4 decoration-2"
              )}>
                {format(day, "d")}
              </span>
              {hasEvents && !isSelected && (
                <div className="absolute bottom-2 w-1 h-1 bg-emerald-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Events List */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto space-y-2 min-h-[120px]">
        {loading ? (
          <div className="p-6 text-center animate-pulse italic text-slate-300">Cargando...</div>
        ) : eventsForDay.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center opacity-40">
            <Clock className="w-8 h-8 mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest">Sin compromisos para hoy</p>
          </div>
        ) : (
          eventsForDay.map(event => (
            <div 
              key={event.id}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 transition-colors cursor-pointer group"
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                event.status === "urgent" ? "bg-rose-50 text-rose-500" : 
                event.status === "completed" ? "bg-emerald-50 text-emerald-500" : 
                "bg-blue-50 text-blue-500"
              )}>
                {event.status === "urgent" ? <AlertCircle className="w-5 h-5" /> : 
                 event.status === "completed" ? <CheckCircle2 className="w-5 h-5" /> : 
                 <Clock className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-800 dark:text-white truncate">{event.title}</p>
                <p className="text-[10px] font-bold text-slate-400">{event.time} • {event.type === 'appointment' ? 'Reunión' : 'Tarea'}</p>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Quick Add */}
      <div className="p-4 border-t border-slate-100 dark:border-white/5">
         <button 
           onClick={handleQuickAdd}
           className="w-full h-10 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500 hover:border-emerald-500/50 transition-all"
         >
           <Plus className="w-4 h-4" />
           Nueva Tarea / Cita
         </button>
      </div>
    </div>
  );
}

function MonthlyCalendarView({ events }: { events: CalendarEvent[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({
    start: startOfWeek(start, { weekStartsOn: 1 }),
    end: endOfWeek(end, { weekStartsOn: 1 }),
  });

  return (
    <div className="flex flex-col h-[70vh]">
      {/* Monthly Header */}
      <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-slate-900 text-white">
        <div>
          <h2 className="text-2xl font-black tracking-tight capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </h2>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mt-1">Calendario de Operaciones</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="hover:bg-white/10 text-white">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="hover:bg-white/10 text-white">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-7 border-collapse">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(day => (
          <div key={day} className="py-3 bg-slate-50 dark:bg-black/20 border-b border-r border-slate-100 dark:border-white/5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
            {day}
          </div>
        ))}
        {days.map((day, i) => {
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameDay(startOfMonth(day), startOfMonth(currentMonth));
          const dayEvents = events.filter(e => isSameDay(e.date, day));

          return (
            <div 
              key={i} 
              className={cn(
                "h-24 p-2 border-b border-r border-slate-100 dark:border-white/5 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5",
                !isCurrentMonth && "bg-slate-50/30 dark:bg-black/30 opacity-40",
                isToday && "bg-emerald-500/5"
              )}
            >
              <div className="flex justify-between items-start">
                <span className={cn(
                  "text-[10px] font-black",
                  isToday ? "bg-emerald-500 text-white w-5 h-5 flex items-center justify-center rounded-full" : "text-slate-400"
                )}>
                  {format(day, "d")}
                </span>
                {dayEvents.length > 0 && (
                   <span className="text-[10px] font-bold text-emerald-500">{dayEvents.length} eventos</span>
                )}
              </div>
              <div className="mt-2 flex flex-col gap-1">
                 {dayEvents.slice(0, 2).map(e => (
                   <div key={e.id} className="text-[8px] font-bold bg-slate-100 dark:bg-white/10 p-1 rounded truncate border-l-2 border-emerald-500">
                     {e.title}
                   </div>
                 ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
